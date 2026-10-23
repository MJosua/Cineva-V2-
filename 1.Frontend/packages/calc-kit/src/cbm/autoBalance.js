/**
 * @purpose Pure port of the E-Order Add More Container auto-balance (FlavourNonBulk_Component handleFlavourChange / handleFlavorQtyChange / removeFlavor): which flavour quantities are open, and how the others are computed when Custom Mode is off. Custom Mode opens every value. Additive (calc-kit 0.4.0), no React, no DB.
 * Head: src/index.js
 */
import { calculateFlavourCBM, calculateFlavourUnitCBM } from './cbmCalculator.js';
import { resolveCBM, resolveMaxQty, resolveMixedContainerLimit, hasSpecificCBMRule } from './containerRuleEngine.js';

const CAPACITY_KEY = { '1': 'cont20', '2': 'cont40', '4': 'cont40hc' };

const num = (v) => Number(v) || 0;
const floor10 = (v) => Math.floor(v / 10) * 10;
const isSelected = (f) => !!f && f.sku !== '' && f.sku !== null && f.sku !== undefined && String(f.sku) !== '-1';
export const emptyFlavour = () => ({ sku: '', qty: 0 });

/** Cartons that fill one container of this size with this SKU (mst_product.cont20 / cont40 / cont40hc). */
export const capacityOf = (detail, containerSize) => num(detail && detail[CAPACITY_KEY[String(containerSize)]]);

/**
 * ctx = { containerSize, catalog, companyId, rules, specialConditions }
 * Flavours are [{ sku, qty }]; an unselected row is { sku: '', qty: 0 }.
 */
const detailOf = (ctx, f) => (isSelected(f) ? ctx.catalog[String(f.sku)] : undefined);

/** Which qty inputs the user may type in (E-Order: disabled inputs are computed automatically). */
export function flavourEditability(flavours, { custom = false } = {}) {
  return flavours.map((f, i) => {
    if (!isSelected(f)) return false;
    if (i > 0 && !isSelected(flavours[i - 1])) return false;
    if (custom) return true; // Custom Mode: every value open, flavour III included
    if (i === 0) return isSelected(flavours[1]); // alone it stays at the full container
    if (i === 1) return flavours.length > 2 && num(flavours[0].qty) > 0; // with two rows II is computed from I
    return false; // flavour III and later are always computed
  });
}

function clearFlavour(next, index, ctx) {
  const first = next[0];
  if (index >= 2) return removeFlavour(next, index, ctx);
  next[index] = emptyFlavour();
  if (index === 1) {
    if (isSelected(first)) first.qty = capacityOf(detailOf(ctx, first), ctx.containerSize);
  } else {
    next.slice(1).forEach((f, k) => { next[k + 1] = emptyFlavour(); });
  }
  return next;
}

/** Choosing a SKU in a row (E-Order handleFlavourChange): flavour I = full container, later rows start at 0. */
export function selectFlavour(flavours, index, sku, ctx) {
  const next = flavours.map((f) => ({ ...f }));
  if (!sku) return clearFlavour(next, index, ctx);

  const detail = ctx.catalog[String(sku)];
  const capacity = capacityOf(detail, ctx.containerSize);
  next[index] = { ...next[index], sku: String(sku), qty: index === 0 ? capacity : 0 };
  const first = next[0];
  const firstDetail = detailOf(ctx, first);

  if (index === 1 && String(ctx.containerSize) === '4') {
    const mixed = resolveMixedContainerLimit({ flavours: [firstDetail, detail].filter(Boolean), companyId: ctx.companyId, rules: ctx.rules });
    if (mixed) {
      first.qty = capacityOf(firstDetail, ctx.containerSize);
      next[1].qty = 0;
      return next;
    }
  }

  next.slice(1).forEach((f) => { f.qty = 0 });
  if (index !== 0 && isSelected(first)) first.qty = capacityOf(firstDetail, ctx.containerSize);
  return next;
}

/** The red close button of flavour III and later (E-Order removeFlavor): flavour I back to the full container, flavour II to 0. */
export function removeFlavour(flavours, index, ctx) {
  const next = flavours.map((f) => ({ ...f }));
  if (isSelected(next[0])) next[0].qty = capacityOf(detailOf(ctx, next[0]), ctx.containerSize);
  if (next[1]) next[1].qty = 0;
  next.splice(index, 1);
  return next;
}

function parseMixingRules(specialConditions) {
  return (specialConditions || [])
    .filter((c) => String(c.id) === '23')
    .map((c) => { try { return typeof c.value === 'string' ? JSON.parse(c.value) : c.value; } catch (e) { return null; } })
    .filter((c) => c && c.loadA && c.loadB);
}

/** Typing a quantity. Custom Mode: stored as typed. Otherwise the other flavours are computed (E-Order auto-balance). */
export function setFlavourQty(flavours, index, rawQty, ctx, { custom = false } = {}) {
  const next = flavours.map((f) => ({ ...f }));
  let q = Math.max(0, Math.floor(num(rawQty)));
  if (custom) {
    next[index].qty = q;
    return next;
  }

  const size = ctx.containerSize;
  const d = (i) => detailOf(ctx, next[i]);
  const f1 = d(0);
  const f2 = d(1);
  const selected = next.filter(isSelected).map((f) => ctx.catalog[String(f.sku)]).filter(Boolean);
  const three = next.length === 3;
  const has3 = three && isSelected(next[2]);

  // Shanghai ratio mix (condition 25) unless a condition 23 pair applies
  const loads = f1 && f2 ? [Number(f1.cont40hc), Number(f2.cont40hc)] : [];
  const matches23 = parseMixingRules(ctx.specialConditions).some((r) => loads.includes(Number(r.loadA)) && loads.includes(Number(r.loadB)));
  const hasRatio = (ctx.specialConditions || []).some((c) => String(c.id) === '25') && !matches23;
  if (hasRatio && f1 && f2 && isSelected(next[0]) && isSelected(next[1])) {
    const max1 = capacityOf(f1, size);
    const max2 = capacityOf(f2, size);
    if (max1 > 0 && max2 > 0) {
      const partner = (qty1) => {
        const target = (1 - qty1 / max1) * max2;
        const rounded = Math.round(target * 1e6) / 1e6;
        return Number.isInteger(rounded) ? rounded : floor10(target);
      };
      if (index === 0) {
        q = Math.min(q, max1);
        next[0].qty = q;
        next[1].qty = Math.min(Math.max(0, partner(q)), max2);
        if (three) next[2].qty = 0;
      } else if (index === 1) {
        q = Math.min(q, partner(num(next[0].qty)));
        next[1].qty = q;
        if (three) next[2].qty = 0;
      }
      return next;
    }
  }

  if (index === 0 && f1) q = Math.min(q, capacityOf(f1, size));

  const mixed = String(size) === '4'
    ? resolveMixedContainerLimit({ flavours: [f1, f2].filter(Boolean), companyId: ctx.companyId, rules: ctx.rules })
    : null;
  if (mixed) {
    const max = mixed.maxTotal;
    if (index === 0) {
      q = Math.min(q, max);
      next[1].qty = max - q;
    } else if (index === 1) {
      q = Math.min(q, Math.max(0, max - num(next[0].qty)));
    }
    next[index].qty = q;
    return next;
  }

  const maxQtySum = resolveMaxQty({ flavours: [f1, f2].filter(Boolean), companyId: ctx.companyId, rules: ctx.rules });
  if (maxQtySum) {
    q = Math.min(q, maxQtySum);
    if (index === 0) {
      if (next[1] && q + num(next[1].qty) > maxQtySum) next[1].qty = Math.max(0, maxQtySum - q);
    } else if (index === 1) {
      q = Math.min(q, Math.max(0, maxQtySum - num(next[0].qty)));
    }
  }

  const limit = resolveCBM({ flavours: selected, companyId: ctx.companyId, rules: ctx.rules, specialConditions: ctx.specialConditions });
  const unitOf = (detail) => calculateFlavourUnitCBM(detail);
  const cbmOf = (detail, qty) => calculateFlavourCBM({ sku: detail.product_code, qty }, detail);
  const partnerQty = (remaining, detail, flavourList) => {
    const unit = unitOf(detail);
    const specific = hasSpecificCBMRule({ flavours: flavourList, companyId: ctx.companyId, rules: ctx.rules, specialConditions: ctx.specialConditions });
    if (specific) return unit > 0 ? Math.round(remaining / unit) : 0;
    return floor10(unit > 0 ? Math.floor(remaining / unit) : 0);
  };

  if (index === 0) {
    if (!f1) { next[0].qty = q; return next; }
    const cbm1 = cbmOf(f1, q);
    const remaining = limit - cbm1;
    next[0].qty = q;
    if (isSelected(next[1]) && f2) {
      let q2 = Math.max(0, partnerQty(remaining, f2, selected));
      const max1 = capacityOf(f1, size);
      const max2 = capacityOf(f2, size);
      if (limit === 100 && max1 === max2 && max1 > 0) {
        const q3 = has3 ? num(next[2].qty) : 0;
        next[1].qty = Math.max(0, max1 - q - q3);
      } else {
        // deviation from E-Order (which can overshoot): the total-qty cap (e.g. company 116: 3800) also bounds the computed flavour II
        if (maxQtySum) q2 = Math.min(q2, Math.max(0, maxQtySum - q));
        next[1].qty = q2;
        if (has3) {
          const f3 = d(2);
          if (f3) {
            const remaining3 = limit - cbm1 - cbmOf(f2, q2);
            const unit3 = unitOf(f3);
            next[2].qty = Math.max(0, floor10(unit3 > 0 ? Math.floor(remaining3 / unit3) : 0));
          }
        }
      }
    }
  } else if (index === 1) {
    const qty1 = num(next[0].qty);
    if (limit === 100 && capacityOf(f1, size) > 0) {
      const maxCap = capacityOf(f1, size);
      q = Math.min(q, Math.max(0, maxCap - qty1));
      next[1].qty = q;
      if (has3) next[2].qty = Math.max(0, maxCap - qty1 - q);
    } else if (f1 && f2) {
      const remaining = limit - cbmOf(f1, qty1);
      q = Math.min(q, partnerQty(remaining, f2, selected));
      next[1].qty = q;
      if (has3) {
        const f3 = d(2);
        if (f3) {
          const remaining3 = limit - cbmOf(f1, qty1) - cbmOf(f2, q);
          next[2].qty = Math.max(0, partnerQty(remaining3, f3, [f1, f2, f3]));
        }
      }
    } else {
      next[1].qty = q;
    }
  } else if (index === 2) {
    const qty1 = num(next[0].qty);
    const qty2 = num(next[1].qty);
    const f3 = d(2);
    if (limit === 100 && capacityOf(f1, size) > 0) {
      q = Math.min(q, Math.max(0, capacityOf(f1, size) - qty1 - qty2));
    } else if (f1 && f2 && f3) {
      const remaining = limit - cbmOf(f1, qty1) - cbmOf(f2, qty2);
      const unit3 = unitOf(f3);
      q = Math.min(q, Math.max(0, floor10(unit3 > 0 ? Math.floor(remaining / unit3) : 0)));
    }
    next[2].qty = q;
  } else {
    next[index].qty = q;
  }
  return next;
}
