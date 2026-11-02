import test from 'node:test';
import assert from 'node:assert/strict';
import { addWorkingDays, isWorkingDay, evaluateExtension } from '../src/workdays.ts';

const none = { holidays: [] as string[] };
test('working days skip weekends and listed holidays, and never count the start date', () => {
  assert.equal(addWorkingDays('2026-11-06', 1, none), '2026-11-09');
  assert.equal(addWorkingDays('2026-11-06', 0, none), '2026-11-06');
  assert.equal(addWorkingDays('2026-11-06', 1, { holidays: ['2026-11-09'] }), '2026-11-10');
  assert.equal(addWorkingDays('2026-11-02', 14, none), '2026-11-20');
  assert.equal(isWorkingDay('2026-11-07', none), false);
  assert.equal(isWorkingDay('2026-11-09', { holidays: ['2026-11-09'] }), false);
});
test('work week is a parameter and an explicit holiday list is mandatory', () => {
  assert.equal(isWorkingDay('2026-11-07', { holidays: [], workWeek: [1, 2, 3, 4, 5, 6] }), true);
  assert.throws(() => isWorkingDay('2026-11-09', {} as never), RangeError);
  assert.throws(() => isWorkingDay('2026-11-09', { holidays: ['2026-02-30'] }), RangeError);
  assert.throws(() => isWorkingDay('2026-11-09', { holidays: [], workWeek: [] }), RangeError);
  assert.throws(() => addWorkingDays('2026-11-09', -1, none), RangeError);
  assert.throws(() => addWorkingDays('2026-11-09', 99999, none), RangeError);
});

const limits = { maxTotalDays: 2, maxRequests: 1 };
const text = { kind: 'text' as const, text: 'Surat dokter' };
test('extension accepts one request of up to 2 days with reason and proof', () => {
  assert.deepEqual(evaluateExtension({ days: 2, reason: 'Sakit', proof: text }, [], limits), { ok: true, issues: [] });
  const second = evaluateExtension({ days: 1, reason: 'Sakit', proof: text }, [{ days: 1 }], limits);
  assert.deepEqual(second.issues.map(item => item.code), ['request_limit']);
  assert.deepEqual(evaluateExtension({ days: 3, reason: 'Sakit', proof: text }, [], limits).issues.map(item => item.code), ['total_limit']);
});
test('extension reports every issue and validates proof by kind', () => {
  const bad = evaluateExtension({ days: 0, reason: '  ' }, [], limits);
  assert.deepEqual(bad.issues.map(item => item.code), ['reason_required', 'days_invalid', 'proof_required']);
  assert.equal(evaluateExtension({ days: 1, reason: 'x', proof: { kind: 'png', fileName: 'a.jpg', sizeBytes: 5 } }, [], limits).issues[0].code, 'proof_invalid');
  assert.equal(evaluateExtension({ days: 1, reason: 'x', proof: { kind: 'jpeg', fileName: 'a.JPEG', sizeBytes: 5 } }, [], limits).ok, true);
  assert.equal(evaluateExtension({ days: 1, reason: 'x', proof: text }, [], { ...limits, proofKinds: ['png'] }).issues[0].code, 'proof_kind_not_allowed');
  assert.equal(evaluateExtension({ days: 1, reason: 'x' }, [], { ...limits, requireProof: false }).ok, true);
});
test('omitting maxRequests keeps the unlimited-requests behaviour and bad limits fail loudly', () => {
  assert.equal(evaluateExtension({ days: 1, reason: 'x', proof: text }, [{ days: 1 }], { maxTotalDays: 2 }).ok, true);
  assert.throws(() => evaluateExtension({ days: 1, reason: 'x' }, [], { maxTotalDays: -1 }), RangeError);
  assert.throws(() => evaluateExtension({ days: 1, reason: 'x' }, [], { maxTotalDays: 2, maxRequests: 1.5 }), RangeError);
});
