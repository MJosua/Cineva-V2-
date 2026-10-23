import test from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../../../1.Frontend/HOTS/src/features/cineva-offline/validation';
import { syntheticData } from './fixture';

test('Complete synthetic portable document retains HOTS EAV and unresolved source values', () => {
  const data = syntheticData();
  validateData(data);
  assert.equal(data.campaign.paidAmount, null);
  assert.equal(data.events[2].startDate, null);
  assert.equal(data.events[2].requiresReview, true);
  assert.equal(data.events[2].rawDate, 'minggu depan / tahun belum jelas');
  assert.equal(data.collections.tickets[0].fields[1].cstm_col, 'fee_amount');
});

test('Fee and followers reject negative, fractional and nonfinite quantities', () => {
  for (const value of [-1, 1.5, NaN, Infinity]) {
    const fee = syntheticData(); fee.campaign.feeAmount = value; assert.throws(() => validateData(fee));
    const followers = syntheticData(); followers.user.followers = value; assert.throws(() => validateData(followers));
  }
  const unknown = syntheticData(); unknown.user.followers = null; validateData(unknown);
});

test('Partial payments remain separate from source paid amount and cannot exceed fee', () => {
  const data = syntheticData();
  data.payments.push({ id: 'payment-1', amount: 100000, paidAt: '2026-10-25', evidence: 'Dummy evidence' });
  validateData(data); assert.equal(data.campaign.paidAmount, null);
  data.payments.push({ id: 'payment-2', amount: 200001, paidAt: '2026-10-26', evidence: 'Dummy evidence two' });
  assert.throws(() => validateData(data));
});

test('Calendar rejects invalid, reversed and end-without-start dates without guessing ambiguous text', () => {
  const invalid = syntheticData(); invalid.events[0].startDate = '2026-02-31'; assert.throws(() => validateData(invalid));
  const reversed = syntheticData(); reversed.events[1].endDate = '2026-10-24'; assert.throws(() => validateData(reversed));
  const noStart = syntheticData(); noStart.events[2].endDate = '2026-10-24'; assert.throws(() => validateData(noStart));
  const payment = syntheticData(); payment.payments.push({ id: 'p', amount: 1, paidAt: '2026-99-31', evidence: 'Dummy' }); assert.throws(() => validateData(payment));
});

test('Assignments reject foreign ticket, campaign, batch and user references', () => {
  for (const field of ['ticketId', 'campaignId', 'batchId', 'userId'] as const) {
    const data = syntheticData(); data.collections.assignments[0][field] = 'foreign'; assert.throws(() => validateData(data));
  }
  const batch = syntheticData(); batch.collections.batches[0].campaignId = 'foreign'; assert.throws(() => validateData(batch));
});

test('Duplicate IDs are rejected in operational collections and editable arrays', () => {
  for (const field of ['events', 'deliverables'] as const) {
    const data = syntheticData(); (data[field] as unknown[]).push(structuredClone(data[field][0])); assert.throws(() => validateData(data));
  }
  for (const field of ['workspaces', 'brands', 'batches', 'tickets', 'assignments'] as const) {
    const data = syntheticData(); (data.collections[field] as unknown[]).push(structuredClone(data.collections[field][0])); assert.throws(() => validateData(data));
  }
});

test('Source-like script text stays valid literal content; validation never interprets it', () => {
  const data = syntheticData(), text = '<script>globalThis.syntheticShouldNeverRun = true</script>';
  data.campaign.brief = text; data.notes.push(text); data.rawSource.push({ value: text });
  validateData(data); assert.equal(data.campaign.brief, text);
  assert.equal((globalThis as Record<string, unknown>).syntheticShouldNeverRun, undefined);
});
