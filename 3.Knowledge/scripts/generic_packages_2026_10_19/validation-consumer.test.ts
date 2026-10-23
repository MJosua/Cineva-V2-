import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticData } from '../client_demo_2026_10_18/fixture';
import { validateData, syncTicketFields } from '../../../1.Frontend/HOTS/src/features/cineva-offline/validation';
test('Offline consumer uses generic attributes and preserves source null/EAV contract', () => {
  const data = syntheticData(), original = structuredClone(data);
  validateData(data); assert.deepEqual(data, original);
  assert.equal(syncTicketFields(data).campaign.paidAmount, null);
  for (const invalid of [-1, 0.5, '100']) {
    const next = syntheticData(); next.user.followers = invalid as number;
    assert.throws(() => validateData(next), /followers/);
  }
  const badDate = syntheticData(); badDate.events[0].startDate = '2026-02-31'; assert.throws(() => validateData(badDate), /Tanggal/);
});
test('Offline consumer rejects dangling batches even without an assignment referencing them', () => {
  const data = syntheticData();
  data.collections.batches.push({ id: 'unused-dangling', name: 'Invalid batch', campaignId: 'foreign' });
  assert.throws(() => validateData(data), /Relasi/);
  const numeric = syntheticData(); numeric.collections.tickets[0].id = 1 as unknown as string;
  assert.throws(() => validateData(numeric), /ID setiap koleksi/);
  const invalidEAV = syntheticData(); invalidEAV.collections.tickets[0].fields[0].lbl_col = '';
  assert.throws(() => validateData(invalidEAV), /Kontrak EAV/);
});
test('Offline cash policy retains Indonesian error and counts source payment plus new payments', () => {
  const data = syntheticData(); data.campaign.paidAmount = 100000;
  data.payments.push({ id: 'new', amount: 200001, paidAt: '2026-10-25', evidence: 'Synthetic proof' });
  assert.throws(() => validateData(data), { message: 'Kas tercatat melebihi fee; nominal fee tidak boleh kurang dari pembayaran.' });
  data.payments[0].amount = 200000; validateData(data);
  assert.equal(data.campaign.paidAmount, 100000);
});
