/**
 * @purpose Pure pallet-mode helpers: pallets of one container must total the container maximum exactly (the last flavour is the remainder); qty = pallets x qty_per_pallet. 20 FT total is not defined yet (owner: derived from the 20 FT vs 40 HC load ratio), so unknown totals are reported as skipped. Additive (calc-kit 0.3.0).
 * Head: src/index.js
 */

/**
 * @param {object} args
 * @param {number|null|undefined} args.total  pallets that must fill the container (null = unknown, e.g. 20 FT)
 * @param {Array<number|string|null>} args.pallets  pallets per flavour, in flavour order
 */
export function palletPlan({ total, pallets }) {
  const t = Number(total);
  if (!Number.isFinite(t) || t <= 0) return { skipped: true, reason: 'total_unknown', total: null };

  const list = (pallets || []).map((p) => (p === null || p === '' || p === undefined ? 0 : Number(p)));
  if (list.some((p) => !Number.isFinite(p) || p < 0 || !Number.isInteger(p))) {
    return { skipped: false, ok: false, total: t, used: null, remaining: null, reason: 'invalid_pallet_count' };
  }
  const used = list.reduce((a, b) => a + b, 0);
  const remaining = t - used;
  return {
    skipped: false,
    ok: remaining === 0,
    total: t,
    used,
    remaining,
    over: remaining < 0,
    reason: remaining === 0 ? null : remaining > 0 ? 'pallets_missing' : 'pallets_exceeded',
  };
}

/** Last flavour = total - the others (owner rule: flavour II = 20 - flavour I). Returns null when it cannot be derived. */
export function remainderPallets({ total, pallets }) {
  const t = Number(total);
  if (!Number.isFinite(t) || t <= 0 || !pallets || pallets.length < 2) return null;
  const others = pallets.slice(0, -1).reduce((a, p) => a + (Number(p) || 0), 0);
  const rest = t - others;
  return rest >= 0 ? rest : null;
}

export function palletQty(pallets, qtyPerPallet) {
  const p = Number(pallets);
  const q = Number(qtyPerPallet);
  return Number.isFinite(p) && Number.isFinite(q) && p >= 0 && q > 0 ? p * q : null;
}
