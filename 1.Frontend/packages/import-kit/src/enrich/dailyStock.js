/**
 * @hots/import-kit — enrich/dailyStock: daily input records + reference data → stock movements per expiry batch
 * Head: src/index.js
 * Design: 3.Knowledge/domains/data-database/dw_design_indovietnam_wh_stt.md V14, V17, V18
 *
 * Pure function (no DB). The caller supplies reference data it fetched itself:
 *   containerBatches  IOD trs_realization_batch rows: { container_no, matcode, batch_no, prod_date, expired_date, stuff_qty }
 *   products          IOD mst_product: { matcode, product_group, per_carton }
 *   openingBatches    previous closing at this stock point: { product_group, expiry_date, qty_ctn }
 * Input records come from applyTemplate (template IV_DAILY_INPUT): record_type DELIVERY | STOCK_IN | TRANSFER_OUT | CLOSING.
 *
 * Rules:
 *   STOCK_IN from a port      container_no is required and must exist in IOD → one IN movement per IOD batch
 *                             (product, batch, expiry, cartons from IOD). A user quantity (with product group) overrides
 *                             the IOD quantity for that group, allocated earliest expiry first; a difference is a warning.
 *   STOCK_IN from a stock point (transfer in): product group + cartons from the user; expiry from the user or left
 *                             open (warning) until the sender's TRANSFER_OUT is matched.
 *   DELIVERY / TRANSFER_OUT   allocated FEFO (first expiry, first out) per product group over opening + today's IN;
 *                             a user expiry_date is taken first; shortage → error INSUFFICIENT_STOCK.
 *   CLOSING (physical count)  compared with the computed closing per group × expiry → warning CLOSING_DIFFERENCE.
 */

const key = (group, expiry) => `${group}|${expiry ?? ''}`;
const round = (n) => Math.round(n * 1000) / 1000;

function byExpiry(a, b) {
  if (a.expiry_date === b.expiry_date) return 0;
  if (!a.expiry_date) return 1;
  if (!b.expiry_date) return -1;
  return a.expiry_date < b.expiry_date ? -1 : 1;
}

/** In-memory stock per product group × expiry. */
class BatchStock {
  constructor() {
    this.lots = new Map();
  }

  add(group, expiry, qty, meta = {}) {
    const k = key(group, expiry);
    const lot = this.lots.get(k) || { product_group: group, expiry_date: expiry ?? null, qty_ctn: 0, batches: new Set() };
    lot.qty_ctn = round(lot.qty_ctn + qty);
    if (meta.batch_no) lot.batches.add(meta.batch_no);
    this.lots.set(k, lot);
  }

  /** Takes qty from the lots of one group: preferred expiry first, then FEFO. Returns { parts, short }. */
  take(group, qty, preferredExpiry) {
    const lots = [...this.lots.values()].filter((l) => l.product_group === group && l.qty_ctn > 0).sort(byExpiry);
    if (preferredExpiry) lots.sort((a, b) => (a.expiry_date === preferredExpiry ? -1 : b.expiry_date === preferredExpiry ? 1 : 0));
    const parts = [];
    let left = qty;
    for (const lot of lots) {
      if (left <= 0) break;
      const q = Math.min(lot.qty_ctn, left);
      lot.qty_ctn = round(lot.qty_ctn - q);
      left = round(left - q);
      parts.push({ expiry_date: lot.expiry_date, qty_ctn: q, allocation: preferredExpiry && lot.expiry_date === preferredExpiry ? 'MANUAL' : 'FEFO' });
    }
    return { parts, short: left > 0 ? left : 0 };
  }

  snapshot() {
    return [...this.lots.values()].filter((l) => l.qty_ctn !== 0).sort((a, b) => a.product_group.localeCompare(b.product_group) || byExpiry(a, b))
      .map((l) => ({ product_group: l.product_group, expiry_date: l.expiry_date, qty_ctn: l.qty_ctn }));
  }
}

const isPort = (source) => /\bport\b|^CAT LAI|^HAI PHONG/i.test(String(source || ''));
const ref = (r) => ({ sheet: r.sheet, source_row: r.source_row, source_col: r.source_col ?? null });

/**
 * @param records  applyTemplate output records (status valid|warning only — blocked records must be fixed first)
 * @param ref      { stockPoint, containerBatches, products, openingBatches }
 * @returns { movements, closing, issues, summary }
 *   movements: { event_date, stock_point, movement IN|OUT, reason, product_group, matcode, batch_no, expiry_date,
 *                qty_ctn, qty_pcs, allocation IOD|USER|FEFO|MANUAL, container_no, counterparty, source }
 *   issues:    { level warning|error, code, message, source }
 */
export function enrichDailyInput(records, { stockPoint, containerBatches = [], products = [], openingBatches = [] } = {}) {
  const issues = [];
  const movements = [];
  const perCarton = new Map(products.map((p) => [p.product_group, Number(p.per_carton) || null]));
  const groupOf = new Map(products.map((p) => [Number(p.matcode), p.product_group]));
  const pcs = (group, ctn) => (perCarton.get(group) ? round(ctn * perCarton.get(group)) : null);
  const issue = (level, code, message, r) => issues.push({ level, code, message, source: r ? ref(r) : null });
  const stock = new BatchStock();
  for (const o of openingBatches) stock.add(o.product_group, o.expiry_date, Number(o.qty_ctn) || 0);

  const live = records.filter((r) => r.status !== 'blocked');
  if (live.length !== records.length) issue('error', 'BLOCKED_RECORDS', `${records.length - live.length} blocked records must be fixed before enrichment`);
  const of = (type) => live.filter((r) => r.data.record_type === type);

  // 1. Stock in
  const containersSeen = new Set();
  for (const r of of('STOCK_IN')) {
    const d = r.data;
    if (isPort(d.source)) {
      const cno = String(d.container_no || '').toUpperCase().replace(/\s+/g, '');
      const batches = containerBatches.filter((b) => String(b.container_no).toUpperCase().replace(/\s+/g, '') === cno);
      if (!batches.length) {
        issue('error', 'CONTAINER_NOT_IN_IOD', `Container ${d.container_no} not found in IOD realization batches`, r);
        continue;
      }
      if (containersSeen.has(cno) && !d.product_group) issue('warning', 'CONTAINER_REPEATED', `Container ${cno} entered twice in this file`, r);
      containersSeen.add(cno);
      const lines = batches.map((b) => ({ ...b, product_group: groupOf.get(Number(b.matcode)) || null }))
        .filter((b) => !d.product_group || b.product_group === d.product_group)
        .sort((a, b) => byExpiry({ expiry_date: a.expired_date }, { expiry_date: b.expired_date }));
      if (lines.some((b) => !b.product_group)) issue('error', 'PRODUCT_NOT_MAPPED', `Container ${cno}: matcode without product group`, r);
      const iodQty = lines.reduce((s, b) => s + (Number(b.stuff_qty) || 0), 0);
      let userLeft = d.qty_ctn != null && d.product_group ? Number(d.qty_ctn) : null;
      if (userLeft != null && Math.abs(userLeft - iodQty) > 1e-9) issue('warning', 'QTY_DIFFERS_FROM_IOD', `Container ${cno} ${d.product_group}: received ${userLeft} ctn, IOD ${iodQty} ctn`, r);
      for (const b of lines) {
        const q = userLeft == null ? Number(b.stuff_qty) || 0 : Math.min(userLeft, Number(b.stuff_qty) || 0);
        if (userLeft != null) userLeft = round(userLeft - q);
        if (q <= 0) continue;
        stock.add(b.product_group, b.expired_date, q, b);
        movements.push({ event_date: d.event_date, stock_point: stockPoint, movement: 'IN', reason: 'CONTAINER', product_group: b.product_group, matcode: Number(b.matcode), batch_no: b.batch_no, expiry_date: b.expired_date, qty_ctn: q, qty_pcs: pcs(b.product_group, q), allocation: d.qty_ctn != null && d.product_group ? 'USER' : 'IOD', container_no: cno, counterparty: d.source, source: ref(r) });
      }
      if (userLeft > 0) issue('warning', 'QTY_ABOVE_IOD', `Container ${cno}: ${userLeft} ctn more than IOD batches; kept without batch`, r);
      if (userLeft > 0) {
        stock.add(d.product_group, null, userLeft);
        movements.push({ event_date: d.event_date, stock_point: stockPoint, movement: 'IN', reason: 'CONTAINER', product_group: d.product_group, matcode: null, batch_no: null, expiry_date: null, qty_ctn: userLeft, qty_pcs: pcs(d.product_group, userLeft), allocation: 'USER', container_no: cno, counterparty: d.source, source: ref(r) });
      }
    } else {
      if (!d.product_group || d.qty_ctn == null) {
        issue('error', 'TRANSFER_IN_NEEDS_GROUP_AND_QTY', 'Stock in from a stock point needs product group and cartons', r);
        continue;
      }
      if (!d.expiry_date) issue('warning', 'EXPIRY_FROM_SENDER_PENDING', `Transfer in from ${d.source}: expiry will be taken from the sender's transfer`, r);
      stock.add(d.product_group, d.expiry_date || null, Number(d.qty_ctn));
      movements.push({ event_date: d.event_date, stock_point: stockPoint, movement: 'IN', reason: 'TRANSFER_IN', product_group: d.product_group, matcode: null, batch_no: null, expiry_date: d.expiry_date || null, qty_ctn: Number(d.qty_ctn), qty_pcs: pcs(d.product_group, Number(d.qty_ctn)), allocation: 'USER', container_no: null, counterparty: d.source, source: ref(r) });
    }
  }

  // 2. Stock out (deliveries first in file order, then transfers) — FEFO per product group
  const outs = [
    ...of('DELIVERY').map((r) => ({ r, reason: r.data.line_type === 'PROMO' ? 'PROMO' : 'SALES', counterparty: r.data.shop_name })),
    ...of('TRANSFER_OUT').map((r) => ({ r, reason: 'TRANSFER_OUT', counterparty: r.data.to_stock_point })),
  ];
  for (const { r, reason, counterparty } of outs) {
    const d = r.data;
    if (!d.product_group) {
      issue('error', 'PRODUCT_GROUP_MISSING', 'Stock out without product group', r);
      continue;
    }
    if (reason === 'TRANSFER_OUT' && String(counterparty || '').toUpperCase() === String(stockPoint || '').toUpperCase()) {
      issue('error', 'TRANSFER_TO_SELF', `Transfer from ${stockPoint} to itself`, r);
      continue;
    }
    const { parts, short } = stock.take(d.product_group, Number(d.qty_ctn), d.expiry_date || null);
    for (const p of parts) movements.push({ event_date: d.event_date, stock_point: stockPoint, movement: 'OUT', reason, product_group: d.product_group, matcode: null, batch_no: null, expiry_date: p.expiry_date, qty_ctn: p.qty_ctn, qty_pcs: pcs(d.product_group, p.qty_ctn), allocation: p.allocation, container_no: null, counterparty, source: ref(r) });
    if (short > 0) issue('error', 'INSUFFICIENT_STOCK', `${d.product_group}: ${short} ctn more out than in stock`, r);
  }

  // 3. Closing check against the physical count
  const closing = stock.snapshot();
  const counted = of('CLOSING');
  if (counted.length) {
    const want = new Map();
    for (const r of counted) want.set(key(r.data.product_group, r.data.expiry_date), (want.get(key(r.data.product_group, r.data.expiry_date)) || 0) + Number(r.data.qty_ctn));
    const have = new Map(closing.map((c) => [key(c.product_group, c.expiry_date), c.qty_ctn]));
    for (const k of new Set([...want.keys(), ...have.keys()])) {
      const diff = round((want.get(k) || 0) - (have.get(k) || 0));
      if (Math.abs(diff) > 1e-9) {
        const [group, expiry] = k.split('|');
        issue('warning', 'CLOSING_DIFFERENCE', `${group} exp ${expiry || '-'}: counted ${want.get(k) || 0}, system ${have.get(k) || 0} (diff ${diff})`);
      }
    }
  }

  const sum = (mv, reason) => round(movements.filter((m) => m.movement === mv && (!reason || m.reason === reason)).reduce((s, m) => s + m.qty_ctn, 0));
  const summary = {
    stock_point: stockPoint,
    opening_ctn: round(openingBatches.reduce((s, o) => s + (Number(o.qty_ctn) || 0), 0)),
    in_ctn: sum('IN'),
    out_ctn: sum('OUT'),
    out_sales_ctn: sum('OUT', 'SALES') + sum('OUT', 'PROMO'),
    out_transfer_ctn: sum('OUT', 'TRANSFER_OUT'),
    closing_ctn: round(closing.reduce((s, c) => s + c.qty_ctn, 0)),
    errors: issues.filter((i) => i.level === 'error').length,
    warnings: issues.filter((i) => i.level === 'warning').length,
  };
  return { movements, closing, issues, summary };
}
