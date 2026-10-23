/**
 * @purpose Pure check of one container card (flavours x qty) against the E-Order load rules: CBM limit (skipped when every flavour has the same container load: then sum of qty <= container load), qty cap, mixed 40HC pair; Custom Mode releases these container-load rules. Additive (calc-kit 0.3.0), no React, no DB.
 * Head: src/index.js
 */
import { calculateFlavourCBM, calculateFlavourUnitCBM } from './cbmCalculator.js';
import { resolveCBM, resolveMaxQty, resolveMixedContainerLimit } from './containerRuleEngine.js';

// mst_container ids as used by E-Order cont_size: "1" = 20 FT, "2" = 40 FT, "4" = 40 HC
const CAPACITY_KEY = { '1': 'cont20', '2': 'cont40', '4': 'cont40hc' };
const EPSILON = 1e-9;

const isFilled = (f) => f && f.sku !== undefined && f.sku !== null && String(f.sku) !== '' && String(f.sku) !== '-1' && String(f.sku) !== '0';
const hasDims = (d) => d && [d.ctn_height, d.ctn_length, d.ctn_width].every((v) => Number(v) > 0);

/**
 * @param {object} args
 * @param {Array<{sku:string|number, qty:number|string}>} args.flavours  cards' flavour lines (sku = product_code)
 * @param {string|number} args.containerSize  "1" | "2" | "4"
 * @param {boolean} [args.custom]             Custom Mode of this container: releases the container-load rules only
 * @param {Record<string, object>} args.catalog  product_code -> catalog row (ctn_*, cont20/40/40hc)
 * @param {number|string} args.companyId      PO distributor
 * @param {object} args.rules                 { default:{cbm}, companies:{...} } (calc-kit shape)
 * @param {Array<{id:string|number,value:any}>} [args.specialConditions]  effective conditions (ids 23 / 25 are read)
 * @returns {{ok:boolean, released:boolean, skipped:boolean, cbm_used:number, cbm_limit:number|null,
 *            per_flavour:Array, messages:Array<{code:string, level:'error'|'warning', [k:string]:any}>}}
 */
export function evaluateContainerLoad({ flavours, containerSize, custom = false, catalog = {}, companyId, rules, specialConditions = [] }) {
  const lines = (flavours || []).filter(isFilled).map((f) => ({
    sku: String(f.sku),
    qty: Number(f.qty) || 0,
    detail: catalog[String(f.sku)] || null,
  }));
  const messages = [];

  lines.filter((l) => !l.detail).forEach((l) => messages.push({ code: 'unknown_sku', level: 'error', sku: l.sku }));
  const known = lines.filter((l) => l.detail);

  const lineCbm = known.map((l) => (hasDims(l.detail) ? calculateFlavourCBM({ sku: l.sku, qty: l.qty }, l.detail) : 0));
  const cbmUsed = Math.floor(lineCbm.reduce((a, b) => a + b, 0) * 1e10) / 1e10;

  const capKey = CAPACITY_KEY[String(containerSize)];
  const noData = known.some((l) => !hasDims(l.detail) || !(Number(l.detail[capKey]) > 0));

  const result = (extra) => ({
    ok: !messages.some((m) => m.level === 'error'),
    released: false,
    skipped: false,
    cbm_used: cbmUsed,
    cbm_limit: null,
    per_flavour: known.map((l, i) => ({ sku: l.sku, qty: l.qty, cbm: lineCbm[i], max_qty: null })),
    messages,
    ...extra,
  });

  if (custom) return result({ released: true });
  if (noData) {
    messages.push({ code: 'no_capacity_data', level: 'warning' });
    return result({ skipped: true });
  }

  const details = known.map((l) => l.detail);
  const limit = resolveCBM({ flavours: details, companyId, rules, specialConditions });
  const sumQty = known.reduce((a, l) => a + l.qty, 0);

  // One flavour, or flavours with the same container load: the load itself is the limit (A + B = container load), CBM is not the check.
  const loads = known.map((l) => Number(l.detail[capKey]));
  const sameLoad = loads.length >= 1 && loads.every((v) => v === loads[0]);
  if (sameLoad) {
    if (sumQty > loads[0]) messages.push({ code: 'qty_cap_exceeded', level: 'error', used: sumQty, limit: loads[0] });
  } else if (cbmUsed > limit + EPSILON) {
    messages.push({ code: 'cbm_exceeded', level: 'error', used: cbmUsed, limit });
  }

  const maxQtySum = resolveMaxQty({ flavours: details, companyId, rules });
  if (maxQtySum !== null && maxQtySum !== undefined && sumQty > maxQtySum) {
    messages.push({ code: 'qty_cap_exceeded', level: 'error', used: sumQty, limit: maxQtySum });
  }

  const mixed = String(containerSize) === '4' ? resolveMixedContainerLimit({ flavours: details, companyId, rules }) : null;
  if (mixed && sumQty > mixed.maxTotal) {
    messages.push({ code: 'mixed_limit_exceeded', level: 'error', used: sumQty, limit: mixed.maxTotal });
  }

  const perFlavour = known.map((l, i) => {
    const unit = calculateFlavourUnitCBM(l.detail);
    const others = cbmUsed - lineCbm[i];
    const caps = [];
    if (sameLoad) caps.push(loads[0] - (sumQty - l.qty));
    else if (unit > 0) caps.push(Math.floor((limit - others) / unit + EPSILON));
    if (maxQtySum !== null && maxQtySum !== undefined) caps.push(maxQtySum - (sumQty - l.qty));
    if (mixed) caps.push(mixed.maxTotal - (sumQty - l.qty));
    return { sku: l.sku, qty: l.qty, cbm: lineCbm[i], max_qty: caps.length ? Math.max(0, Math.min(...caps)) : null };
  });

  return result({ cbm_limit: sameLoad ? null : limit, basis: sameLoad ? 'qty' : 'cbm', per_flavour: perFlavour });
}
