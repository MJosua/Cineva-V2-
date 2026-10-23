// RFC 9457 Problem Details — run: npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const kit = require('../src');

test('TxError → problem+json with HOTS code, trace id and legacy fields', () => {
  const err = kit.insufficientStock('Not enough Wobbler at DEFAULT', { id: 3, available: 2, requested: 5 });
  const p = kit.toProblemDetails(err, { instance: '/api/posm/issue', traceId: 'req-123' });
  assert.equal(p.status, 409);
  assert.equal(p.headers['Content-Type'], 'application/problem+json');
  assert.deepEqual(
    { type: p.body.type, title: p.body.title, code: p.body.code, trace_id: p.body.trace_id, success: p.body.success, message: p.body.message },
    { type: 'https://hots.indofoodinternational.com/problems/insufficient-stock', title: 'Insufficient stock', code: 'TX_INSUFFICIENT_STOCK', trace_id: 'req-123', success: false, message: 'Not enough Wobbler at DEFAULT' },
  );
  assert.deepEqual(p.body.details, { id: 3, available: 2, requested: 5 });
});

test('field errors are exposed as errors[]', () => {
  const p = kit.toProblemDetails(kit.validation('Invalid input', { errors: [{ field: 'items[0].quantity', code: 'INVALID', message: 'must be > 0' }] }));
  assert.equal(p.status, 400);
  assert.equal(p.body.errors[0].field, 'items[0].quantity');
  assert.equal(p.body.details, undefined);
});

test('unknown errors are 500 and do not leak internals', () => {
  const p = kit.toProblemDetails(new Error('ER_ACCESS_DENIED for user root@10.0.0.1'), { traceId: 't-9' });
  assert.equal(p.status, 500);
  assert.equal(p.body.code, 'INTERNAL_ERROR');
  assert.doesNotMatch(p.body.detail, /root|ER_ACCESS/);
});

test('sendProblem writes status, header and body on an Express-like response', () => {
  const sent = {};
  const res = { status(s) { sent.status = s; return this; }, set(h) { sent.headers = h; return this; }, send(b) { sent.body = JSON.parse(b); return this; } };
  kit.sendProblem(res, kit.conflict('Coupon already redeemed', { status: 'already_redeemed' }), { traceId: 'x' });
  assert.equal(sent.status, 409);
  assert.equal(sent.headers['Content-Type'], 'application/problem+json');
  assert.equal(sent.body.details.status, 'already_redeemed');
});
