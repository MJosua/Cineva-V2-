/**
 * @purpose Pure order-level validation ported from the E-Order submit check (AddmoreContainer.jsx): no empty container (Flavour I needs a SKU and qty > 0) and MOQ per SKU summed over all containers. Applies in Custom Mode too. Also skuTotals (per-SKU sums, bulk = qty x containers) used for the SO line effect. Additive (calc-kit 0.5.0).
 * Head: src/index.js
 */

const num = (v) => Number(v) || 0;
const isFilled = (f) => !!f && f.sku !== '' && f.sku !== null && f.sku !== undefined && String(f.sku) !== '-1' && String(f.sku) !== '0';

/** Sum of qty per SKU over every container; a bulk card is repeated for every container. */
export function skuTotals({ cards, bulk = false, count = 1 }) {
  const factor = bulk ? num(count) || 1 : 1;
  const totals = {};
  (cards || []).forEach((card) => {
    (card.flavours || []).filter(isFilled).forEach((f) => {
      const sku = String(f.sku);
      totals[sku] = (totals[sku] || 0) + num(f.qty) * factor;
    });
  });
  return totals;
}

/** MOQ of a catalog row for a container size (E-Order: 20 FT uses moq20, the others moq). */
export const moqOf = (detail, containerSize) => num(detail && (String(containerSize) === '1' ? detail.moq20 : detail.moq));

/**
 * @param {object} args
 * @param {string|number} args.containerSize
 * @param {boolean} [args.bulk]
 * @param {number} [args.count]
 * @param {Array<{flavours:Array<{sku:string|number, qty:number|string}>}>} args.cards
 * @param {Record<string, object>} args.catalog  product_code -> catalog row (moq, moq20)
 * @param {string[]} [args.onlySkus]  when given, MOQ is checked only for these SKUs (legacy orders must not block unrelated edits)
 * @returns {Array<{code:'container_empty'|'below_moq', level:'error', card?:number, sku?:string, used?:number, limit?:number}>}
 */
export function validateOrderLoad({ containerSize, bulk = false, count = 1, cards, catalog = {}, onlySkus }) {
  const messages = [];

  (cards || []).forEach((card, i) => {
    const first = (card.flavours || [])[0];
    if (!isFilled(first) || num(first.qty) <= 0) messages.push({ code: 'container_empty', level: 'error', card: i });
  });

  const totals = skuTotals({ cards, bulk, count });
  const check = onlySkus ? new Set(onlySkus.map(String)) : null;
  Object.entries(totals).forEach(([sku, total]) => {
    if (check && !check.has(sku)) return;
    const moq = moqOf(catalog[sku], containerSize);
    if (moq > 0 && total < moq) messages.push({ code: 'below_moq', level: 'error', sku, used: total, limit: moq });
  });

  return messages;
}
