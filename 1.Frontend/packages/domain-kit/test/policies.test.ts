import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGate, evaluateCancellation, type CancellationPolicy } from '../src/policies.ts';

test('gate opens only when every required key is satisfied, from a list or a record', () => {
  assert.deepEqual(evaluateGate(['client', 'owner'], ['client']), { open: false, satisfied: ['client'], missing: ['owner'] });
  assert.equal(evaluateGate(['client', 'owner'], new Set(['owner', 'client', 'extra'])).open, true);
  assert.deepEqual(evaluateGate(['post_live', 'insight'], { post_live: true, insight: false }).missing, ['insight']);
});
test('gate refuses empty, duplicate or blank requirements so a typo cannot open it', () => {
  for (const bad of [[], ['a', 'a'], ['  ']]) assert.throws(() => evaluateGate(bad, []), RangeError);
});

const policy: CancellationPolicy = { version: 'T1', parties: {
  brand: { forfeitDeposit: true },
  crew: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, extraChargeKeys: ['productReplacement'], payee: 'host-defined' },
} };
test('brand cancellation forfeits the deposit and nothing else', () => {
  const out = evaluateCancellation(policy, { party: 'brand', deposit: 3_000_000 });
  assert.deepEqual([out.depositForfeited, out.penalty, out.requiresReplacement, out.total], [3_000_000, null, false, 3_000_000]);
});
test('crew cancellation charges the percentage of the named basis plus pass-through charges and needs a replacement', () => {
  const out = evaluateCancellation(policy, { party: 'crew', deposit: 5, amounts: { totalFee: 1_234_567 }, extraCharges: { productReplacement: 100_000 } });
  assert.equal(out.penalty?.amount, 185_185);
  assert.equal(out.penalty?.payee, 'host-defined');
  assert.equal(out.depositForfeited, 0);
  assert.equal(out.requiresReplacement, true);
  assert.equal(out.total, 285_185);
});
test('missing data and unknown parties throw instead of guessing', () => {
  assert.throws(() => evaluateCancellation(policy, { party: 'crew', extraCharges: { productReplacement: 0 } }), /totalFee/);
  assert.throws(() => evaluateCancellation(policy, { party: 'crew', amounts: { totalFee: 10 } }), /productReplacement/);
  assert.throws(() => evaluateCancellation(policy, { party: 'toString' }), /Unknown/);
  assert.throws(() => evaluateCancellation(policy, { party: 'brand', deposit: -1 }), RangeError);
  assert.throws(() => evaluateCancellation({ version: 'x', parties: { a: { penaltyPercent: 150, penaltyBasis: 'b' } } }, { party: 'a', amounts: { b: 1 } }), RangeError);
});

const reasoned: CancellationPolicy = { version: 'R1', parties: {
  brand: { forfeitDeposit: true, reasons: { force_majeure: { waiveForfeit: true, refundPercent: 50, refundBasis: 'amountPaid' } } },
  crew: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, reasons: { sick: { waivePenalty: true } } },
} };
test('a named reason can waive the penalty or the forfeiture and add a refund of a named basis', () => {
  const sick = evaluateCancellation(reasoned, { party: 'crew', reason: 'sick' });
  assert.deepEqual([sick.penalty, sick.total, sick.requiresReplacement, sick.reason], [null, 0, true, 'sick']);
  const storm = evaluateCancellation(reasoned, { party: 'brand', deposit: 4_000_000, amounts: { amountPaid: 4_000_000 }, reason: 'force_majeure' });
  assert.deepEqual([storm.depositForfeited, storm.refund?.amount, storm.total], [0, 2_000_000, 0]);
  const plain = evaluateCancellation(reasoned, { party: 'brand', deposit: 4_000_000 });
  assert.deepEqual([plain.depositForfeited, plain.refund, plain.reason], [4_000_000, null, undefined]);
});
test('unknown reasons and missing refund amounts throw instead of being ignored', () => {
  assert.throws(() => evaluateCancellation(reasoned, { party: 'crew', reason: 'bored', amounts: { totalFee: 1 } }), /Unknown cancellation reason/);
  assert.throws(() => evaluateCancellation(reasoned, { party: 'brand', deposit: 1, reason: 'force_majeure' }), /amountPaid/);
  assert.throws(() => evaluateCancellation({ version: 'x', parties: { a: { reasons: { r: { refundPercent: 10 } } } } }, { party: 'a', reason: 'r' }), RangeError);
});
