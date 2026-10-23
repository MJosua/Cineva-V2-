import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultRates, estimate } from '../../../1.Frontend/HOTS/src/features/cineva-services/pricing';
import { acceptQuoteRevision, acceptedQuoteSnapshot, requestQuoteChanges, reviseQuote, snapshotQuoteHistory, type NegotiatedInquiry } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/quotes';
const owner = { id: 'creator-1', product: 'creator' as const }, hq = { id: 'hq-1', product: 'hq' as const };
function fixture(): NegotiatedInquiry {
  return { id: 'quote-1', owner: owner.id, destination: hq.id, type: 'Production',
    brief: { days: 2, crew: 3, gear: 1 }, status: 'quoted', quote: estimate('Production', 2, 3, 1, defaultRates), support: 'ai', messages: [] };
}
test('Quote change request is owner-scoped, reason-required and pinned to displayed revision', () => {
  const row = fixture();
  assert.throws(() => requestQuoteChanges(row, hq, 'Lower gear', 1));
  assert.throws(() => requestQuoteChanges(row, owner, ' ', 1));
  assert.throws(() => requestQuoteChanges(row, owner, 'Lower gear', 0));
  const next = requestQuoteChanges(row, owner, '  Lower gear  ', 1);
  assert.equal(next.status, 'changes_requested');
  assert.deepEqual(next.quoteChangeRequests, [{ revision: 1, owner: owner.id, reason: 'Lower gear' }]);
  assert.equal(row.status, 'quoted');
});
test('HQ revisions retain immutable snapshots and require explicit resending', () => {
  const row = requestQuoteChanges(fixture(), owner, 'Lower fee', 1);
  const next = reviseQuote(row, hq, { ...defaultRates, version: 'DUMMY-2', gear: 0 });
  assert.equal(next.status, 'reviewing'); assert.equal(next.quote.revision, 2);
  assert.equal(next.quoteHistory?.[0].total, row.quote.total);
  assert.equal(next.quote.total, next.quote.items.reduce((sum, item) => sum + item.subtotal, 0));
  next.quoteHistory![0].items[0].rate = 0;
  assert.notEqual(row.quote.items[0].rate, 0);
  assert.throws(() => reviseQuote(row, { ...hq, id: 'hq-2' }, defaultRates));
  assert.throws(() => reviseQuote(fixture(), hq, defaultRates));
});
test('Acceptance rejects stale revisions and locks the exact snapshot used for project conversion', () => {
  const revised = reviseQuote(requestQuoteChanges(fixture(), owner, 'Lower fee', 1), hq, { ...defaultRates, version: 'DUMMY-2', gear: 0 });
  const sent = { ...revised, status: 'quoted' as const };
  assert.throws(() => acceptQuoteRevision(sent, owner, 1));
  const accepted = acceptQuoteRevision(sent, owner, 2);
  assert.equal(accepted.acceptedQuoteRevision, 2); assert.equal(acceptedQuoteSnapshot(accepted).total, sent.quote.total);
  assert.throws(() => reviseQuote(accepted, hq, defaultRates));
  assert.throws(() => acceptedQuoteSnapshot({ ...accepted, quote: { ...accepted.quote, total: 1 } }));
  assert.throws(() => acceptedQuoteSnapshot({ ...accepted, quoteHistory: [] }));
  assert.throws(() => acceptedQuoteSnapshot({ ...accepted, acceptedQuoteRevision: 99 }));
});
test('Legacy accepted records remain readable, snapshot tampering and duplicate revision mutation fail', () => {
  const old = { ...fixture(), status: 'accepted' as const };
  assert.deepEqual(acceptedQuoteSnapshot(old), old.quote);
  const saved = { ...fixture(), quoteHistory: [fixture().quote] };
  saved.quote = { ...saved.quote, total: 1 };
  assert.throws(() => snapshotQuoteHistory(saved));
});
