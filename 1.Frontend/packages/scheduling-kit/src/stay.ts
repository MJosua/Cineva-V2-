const dayMilliseconds = 86400000;
function ordinal(value: string): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Stay dates require YYYY-MM-DD.');
  const epoch = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== value) throw new RangeError('Stay date does not exist.');
  return epoch / dayMilliseconds;
}
/** UTC-derived date ordinals, not local timestamps; checkout is excluded. */
export function stayInterval(checkIn: string, checkOut: string): { start: number; end: number; nights: number } {
  const start = ordinal(checkIn), end = ordinal(checkOut);
  if (end <= start) throw new RangeError('Checkout must be after check-in.');
  return { start, end, nights: end - start };
}
