/** @purpose Supplies strict date-only calendar arithmetic, bounded recurrence and explicit-zone display helpers. */
const DAY = 86400000;
export type DateKey = string;
export function dateOrdinal(value: DateKey): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Expected YYYY-MM-DD.');
  const epoch = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString().slice(0, 10) !== value) throw new RangeError('Invalid calendar date.');
  return epoch / DAY;
}
export function dateFromOrdinal(day: number): DateKey {
  if (!Number.isSafeInteger(day)) throw new RangeError('Invalid date ordinal.');
  const date = new Date(day * DAY);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Date out of range.');
  const key = date.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new RangeError('Date out of supported year range.');
  return key;
}
export function addDays(date: DateKey, amount: number): DateKey {
  if (!Number.isSafeInteger(amount)) throw new RangeError('Day increment must be an integer.');
  return dateFromOrdinal(dateOrdinal(date) + amount);
}
export function weekday(date: DateKey): number { return new Date(dateOrdinal(date) * DAY).getUTCDay(); }
export function weekDates(date: DateKey, weekStartsOn = 1): DateKey[] {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) throw new RangeError('Invalid week start.');
  const first = addDays(date, -((weekday(date) - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}
export function monthDates(date: DateKey, weekStartsOn = 1): DateKey[] {
  dateOrdinal(date);
  const first = `${date.slice(0, 7)}-01`;
  const start = weekDates(first, weekStartsOn)[0];
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
export function shiftMonth(date: DateKey, delta: number): DateKey {
  dateOrdinal(date);
  if (!Number.isSafeInteger(delta) || Math.abs(delta) > 120000) throw new RangeError('Invalid month increment.');
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(0); target.setUTCFullYear(year, month - 1 + delta, 1); target.setUTCHours(0, 0, 0, 0);
  const end = new Date(target); end.setUTCMonth(end.getUTCMonth() + 1, 0);
  target.setUTCDate(Math.min(day, end.getUTCDate()));
  return dateFromOrdinal(target.getTime() / DAY);
}
export function dateKeyAt(epoch: number, timeZone: string): DateKey {
  if (!Number.isFinite(epoch) || !timeZone) throw new RangeError('Timestamp and explicit timezone required.');
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(epoch));
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const key = `${get('year').padStart(4, '0')}-${get('month')}-${get('day')}`;
  dateOrdinal(key); return key;
}
export function clockSlots(start = '08:00', end = '18:00', stepMinutes = 30): string[] {
  const minutes = (text: string) => {
    if (typeof text !== 'string' || (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text) && text !== '24:00')) throw new RangeError('Invalid clock time.');
    const [h, m] = text.split(':').map(Number); return h * 60 + m;
  };
  const a = minutes(start), b = minutes(end);
  if (!Number.isInteger(stepMinutes) || stepMinutes < 1 || a >= b || (b - a) % stepMinutes !== 0) throw new RangeError('Invalid slot range/step.');
  return Array.from({ length: (b - a) / stepMinutes + 1 }, (_, i) => {
    const n = a + i * stepMinutes; return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  });
}
export interface DateRecurrence {
  frequency: 'daily' | 'weekly'; interval?: number; weekdays?: number[]; count?: number; until?: DateKey; exclude?: DateKey[];
}
/** Inclusive date-only window; count counts rule matches before exclusions, never timestamps or RRULE. */
export function expandDateRecurrence(start: DateKey, rule: DateRecurrence, window: { from: DateKey; to: DateKey }): DateKey[] {
  const first = dateOrdinal(start), from = dateOrdinal(window.from), to = dateOrdinal(window.to);
  const interval = rule.interval ?? 1;
  if (!['daily', 'weekly'].includes(rule.frequency) || !Number.isInteger(interval) || interval < 1 || interval > 366 || to < from || to - first > 3660 || to - from > 3660) throw new RangeError('Invalid or unbounded recurrence window (max 3660 days).');
  if (rule.count !== undefined && (!Number.isSafeInteger(rule.count) || rule.count < 1 || rule.count > 1000)) throw new RangeError('Count must be 1..1000.');
  const days = rule.weekdays ?? [weekday(start)];
  if (!Array.isArray(days) || !days.length || days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new RangeError('Invalid recurrence weekdays.');
  const excluded = new Set((rule.exclude ?? []).map(dateOrdinal));
  const until = rule.until ? dateOrdinal(rule.until) : to;
  const weekAnchor = dateOrdinal(weekDates(start, 1)[0]);
  const output: DateKey[] = []; let matches = 0;
  for (let n = first; n <= Math.min(to, until); n++) {
    const key = dateFromOrdinal(n);
    const applies = rule.frequency === 'daily' ? (n - first) % interval === 0 : Math.floor((n - weekAnchor) / 7) % interval === 0 && days.includes(weekday(key));
    if (!applies) continue;
    if (++matches > (rule.count ?? Infinity)) break;
    if (n >= from && !excluded.has(n)) { output.push(key); if (output.length > 1000) throw new RangeError('Recurrence output exceeds 1000 dates. Narrow the window.'); }
  }
  return output;
}
