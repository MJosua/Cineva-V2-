import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticData } from '../client_demo_2026_10_18/fixture';
import { createOfflineCommandRegistry } from '../../../1.Frontend/HOTS/src/features/cineva-offline/commands';

test('Offline adapter authorizes explicitly and rejects invalid/stale documents without altering originals', () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), next = syntheticData();
  next.user.name = 'Edited synthetic Creator';
  const request = { state, input: { next }, context: { mode: 'offline-demo' as const, canEdit: true }, expectedRevision: 2, revision: 2 };
  assert.throws(() => commands.execute('document.update', { ...request, context: { ...request.context, canEdit: false } }), /denied/);
  assert.throws(() => commands.execute('document.update', { ...request, expectedRevision: 1 }), /revision/);
  assert.throws(() => commands.execute('document.update', { ...request, revision: undefined }), /revision/);
  const invalid = syntheticData(); invalid.campaign.feeAmount = -1;
  assert.throws(() => commands.execute('document.update', { ...request, input: { next: invalid } }));
  assert.equal(state.user.name, 'Kreator Simulasi'); assert.equal(state.campaign.feeAmount, 300000);
});

test('Offline adapter returns detached valid documents and synchronizes existing EAV fields', () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), proposed = syntheticData();
  proposed.user.name = 'Edited synthetic Creator'; proposed.campaign.feeAmount = 400000;
  proposed.payments = [{ id: 'dummy-payment', amount: 100000, paidAt: '2026-10-19', evidence: 'Synthetic proof' }];
  proposed.collections.tickets[0].fields.push({ cstm_col: 'paid_amount', lbl_col: 'Paid', value: null });
  const result = commands.execute('document.update', { state, input: { next: proposed }, context: { mode: 'offline-demo', canEdit: true }, expectedRevision: 0, revision: 0 });
  assert.equal(result.collections.tickets[0].fields.find(field => field.cstm_col === 'fee_amount')?.value, 400000);
  assert.equal(result.collections.tickets[0].fields.find(field => field.cstm_col === 'paid_amount')?.value, 100000);
  result.user.name = 'Detached result'; assert.equal(proposed.user.name, 'Edited synthetic Creator'); assert.equal(state.user.name, 'Kreator Simulasi');
});

test('Offline adapter preserves valid replacement document imports and keeps namespace policy in host', () => {
  const commands = createOfflineCommandRegistry(), state = syntheticData(), next = syntheticData();
  next.datasetId = 'different-valid-import';
  const result = commands.execute('document.update', { state, input: { next }, context: { mode: 'offline-demo', canEdit: true } });
  assert.equal(result.datasetId, 'different-valid-import'); assert.equal(state.datasetId, 'synthetic-cineva-demo');
});
