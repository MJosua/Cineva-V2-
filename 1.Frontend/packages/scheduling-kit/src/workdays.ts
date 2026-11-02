/** @purpose Supplies holiday-aware working-day arithmetic and a parameterised extension-request policy over date-only keys. */
import { addDays, dateOrdinal, weekday, type DateKey } from './dates.ts';

/** `holidays` is required so a caller must state "no holidays" explicitly; an unknown list must not silently count as empty. */
export interface WorkCalendar { workWeek?: readonly number[]; holidays: readonly DateKey[] }
const MAX_WORKING_DAYS = 3660;
const DEFAULT_WORK_WEEK: readonly number[] = [1, 2, 3, 4, 5];

function resolve(calendar: WorkCalendar) {
  if (!calendar || !Array.isArray(calendar.holidays)) throw new RangeError('A holiday list is required (use an empty list for none).');
  const week = calendar.workWeek ?? DEFAULT_WORK_WEEK;
  if (!week.length || week.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new RangeError('Invalid work week.');
  calendar.holidays.forEach(dateOrdinal);
  return { week: new Set(week), holidays: new Set(calendar.holidays) };
}

/** A working day is inside the work week (default Monday to Friday, 0 = Sunday) and not a listed holiday. */
export function isWorkingDay(date: DateKey, calendar: WorkCalendar): boolean {
  const { week, holidays } = resolve(calendar);
  return week.has(weekday(date)) && !holidays.has(date);
}

/** Moves forward by `days` working days; the start date itself is never counted. Zero returns the start unchanged. */
export function addWorkingDays(start: DateKey, days: number, calendar: WorkCalendar): DateKey {
  const { week, holidays } = resolve(calendar);
  dateOrdinal(start);
  if (!Number.isSafeInteger(days) || days < 0 || days > MAX_WORKING_DAYS) throw new RangeError(`Working days must be an integer from 0 to ${MAX_WORKING_DAYS}.`);
  let cursor = start;
  for (let left = days; left > 0;) {
    cursor = addDays(cursor, 1);
    if (week.has(weekday(cursor)) && !holidays.has(cursor)) left--;
  }
  return cursor;
}

export type ExtensionProofKind = 'png' | 'jpeg' | 'text';
export type ExtensionProof = { kind: 'png' | 'jpeg'; fileName: string; sizeBytes: number } | { kind: 'text'; text: string };
export interface ExtensionRequest { days: number; reason: string; proof?: ExtensionProof }
export interface ExtensionLimits {
  /** Total extra days allowed across the scope the caller tracks (campaign, stage, ...). */
  maxTotalDays: number;
  /** Optional cap on the number of accepted requests; omitted means unlimited (previous behaviour). */
  maxRequests?: number;
  maxReasonLength?: number;
  requireProof?: boolean;
  proofKinds?: readonly ExtensionProofKind[];
}
export interface ExtensionIssue { code: string; path: string; message: string }

/** Evaluates one request against earlier accepted requests in the same scope. Pure: it never records anything. */
export function evaluateExtension(request: ExtensionRequest, used: readonly { days: number }[], limits: ExtensionLimits): { ok: boolean; issues: ExtensionIssue[] } {
  if (!Number.isSafeInteger(limits?.maxTotalDays) || limits.maxTotalDays < 0) throw new RangeError('maxTotalDays must be a non-negative integer.');
  if (limits.maxRequests !== undefined && (!Number.isSafeInteger(limits.maxRequests) || limits.maxRequests < 0)) throw new RangeError('maxRequests must be a non-negative integer.');
  const issues: ExtensionIssue[] = [], add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  const maxReason = limits.maxReasonLength ?? 2000, kinds = limits.proofKinds ?? ['png', 'jpeg', 'text'];
  const reason = typeof request.reason === 'string' ? request.reason.trim() : '';
  if (!reason || reason.length > maxReason) add('reason_required', 'reason', `Reason is required (max ${maxReason} characters).`);
  if (!Number.isSafeInteger(request.days) || request.days < 1) add('days_invalid', 'days', 'Extension must be a whole number of at least 1 day.');
  else {
    const already = used.reduce((sum, item) => sum + item.days, 0);
    if (already + request.days > limits.maxTotalDays) add('total_limit', 'days', `Extension exceeds ${limits.maxTotalDays} days in total (${already} already used).`);
  }
  if (limits.maxRequests !== undefined && used.length >= limits.maxRequests) add('request_limit', 'request', `Only ${limits.maxRequests} extension request(s) are allowed.`);
  const proof = request.proof;
  if (!proof) { if (limits.requireProof ?? true) add('proof_required', 'proof', 'Proof is required.'); }
  else if (!kinds.includes(proof.kind)) add('proof_kind_not_allowed', 'proof.kind', 'Proof type is not allowed.');
  else if (proof.kind === 'text') {
    if (typeof proof.text !== 'string' || !proof.text.trim() || proof.text.length > maxReason) add('proof_invalid', 'proof.text', 'Text proof must be non-empty and within the length limit.');
  } else {
    const pattern = proof.kind === 'png' ? /\.png$/i : /\.jpe?g$/i;
    if (typeof proof.fileName !== 'string' || !pattern.test(proof.fileName.trim()) || !Number.isSafeInteger(proof.sizeBytes) || proof.sizeBytes < 1) add('proof_invalid', 'proof', 'Image proof must be a non-empty file with a matching extension.');
  }
  return { ok: issues.length === 0, issues };
}
