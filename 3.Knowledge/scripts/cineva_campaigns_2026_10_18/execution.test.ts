import test from 'node:test';
import assert from 'node:assert/strict';
import type { Actor } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/domain';
import type { CampaignProduct, TalentAssignment } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/model';
import { assertExecutionMutation, chooseProduct, getDeliveryExecution, progressFulfillment, readExecution, recordPosting, reviewDraft, submitDraft, validHttpUrl } from '../../../1.Frontend/HOTS/src/features/cineva-campaigns/execution';
const creator: Actor = { id: 'creator-1', product: 'creator' }, hq: Actor = { id: 'hq-1', product: 'hq' };
const products: CampaignProduct[] = [{ id: 'sku-one', name: 'Produk sintetis', variant: 'Varian A', referenceValue: 100000 }];
const at = '2026-10-18T03:00:00.000Z', reviewAt = '2026-10-18T04:00:00.000Z';
function fixture(): TalentAssignment {
  return { id: 'assignment-one', creatorId: creator.id, creatorName: 'Creator dummy', batchId: 'batch-one', socialProfiles: [], deliverables: [
    { id: 'post', title: 'Reels dummy', platform: 'Instagram', deadline: '2026-10-22', postingRequired: true, outputOwner: 'creator' },
    { id: 'brand', title: 'Raw video dummy', platform: 'Brand', deadline: '2026-10-22', postingRequired: false, outputOwner: 'brand' },
  ] };
}
function submitted(id = 'post') { return submitDraft(fixture(), creator, id, { url: 'https://example.test/draft', note: 'Draft dummy' }, 0, at); }
function approved(id = 'post') { return reviewDraft(submitted(id), hq, id, { decision: 'approved', note: 'QC dummy', draftVersion: 1 }, 1, reviewAt); }

test('Choice and fulfillment remain independent of deliverable and payout state', () => {
  const empty = fixture(), selected = chooseProduct(empty, creator, products, 'sku-one', 0);
  assert.equal(readExecution(empty).product.choice, 'unselected');
  assert.equal(readExecution(selected).product.fulfillment, 'pending');
  assert.equal(getDeliveryExecution(selected, 'post').status, 'not_submitted');
  assert.throws(() => progressFulfillment(selected, creator, 'ordered', 1));
  const ordered = progressFulfillment(selected, hq, 'ordered', 1);
  assert.throws(() => chooseProduct(ordered, creator, products, 'sku-one', 2));
  const received = progressFulfillment(ordered, creator, 'received', 2);
  assert.equal(readExecution(received).product.fulfillment, 'received');
  assert.equal(received.finance, undefined);
  assert.throws(() => progressFulfillment(received, hq, 'received', 3));
});
test('Creator draft -> HQ revision -> newer draft -> QC approval preserves version history', () => {
  const first = submitted();
  const revised = reviewDraft(first, hq, 'post', { decision: 'revision_requested', note: 'Perbaiki outro', draftVersion: 1 }, 1, reviewAt);
  const second = submitDraft(revised, creator, 'post', { url: 'https://example.test/draft-v2', note: 'Outro diperbaiki' }, 2, '2026-10-18T05:00:00Z');
  assert.throws(() => reviewDraft(second, hq, 'post', { decision: 'approved', note: '', draftVersion: 1 }, 3));
  const approvedRow = reviewDraft(second, hq, 'post', { decision: 'approved', note: '', draftVersion: 2 }, 3, '2026-10-18T06:00:00Z');
  const delivery = getDeliveryExecution(approvedRow, 'post');
  assert.equal(delivery.status, 'approved'); assert.equal(delivery.drafts.length, 2); assert.equal(delivery.reviews.length, 2);
  assert.equal(getDeliveryExecution(first, 'post').reviews.length, 0);
});
test('Posting requires QC approved creator output, valid URL/date and is stored separately', () => {
  assert.throws(() => recordPosting(submitted(), creator, 'post', { url: 'https://example.test/post', postedAt: '2026-10-18' }, 1));
  const ready = approved();
  assert.throws(() => recordPosting(ready, creator, 'post', { url: 'javascript:alert(1)', postedAt: '2026-10-18' }, 2));
  assert.throws(() => recordPosting(ready, creator, 'post', { url: 'https://example.test/post', postedAt: '2026-02-31' }, 2));
  assert.throws(() => recordPosting(ready, creator, 'post', { url: 'https://example.test/post', postedAt: '2026-10-17' }, 2));
  const posted = recordPosting(ready, creator, 'post', { url: 'https://example.test/post', postedAt: '2026-10-19' }, 2);
  assert.equal(getDeliveryExecution(posted, 'post').status, 'approved');
  assert.equal(getDeliveryExecution(posted, 'post').posting?.postedAt, '2026-10-19');
  assert.throws(() => recordPosting(posted, creator, 'post', { url: 'https://example.test/new', postedAt: '2026-10-19' }, 3));
  assert.throws(() => recordPosting(approved('brand'), creator, 'brand', { url: 'https://example.test/post', postedAt: '2026-10-19' }, 2));
});
test('Creator identity, HQ QC role and stale execution revisions are enforced', () => {
  assert.throws(() => submitDraft(fixture(), { ...creator, id: 'creator-2' }, 'post', { url: 'https://example.test/draft', note: '' }, 0));
  assert.throws(() => submitDraft(fixture(), hq, 'post', { url: 'https://example.test/draft', note: '' }, 0));
  assert.throws(() => reviewDraft(submitted(), creator, 'post', { decision: 'approved', note: '', draftVersion: 1 }, 1));
  assert.throws(() => reviewDraft(submitted(), hq, 'post', { decision: 'revision_requested', note: '', draftVersion: 1 }, 1));
  assert.throws(() => reviewDraft(submitted(), hq, 'post', { decision: 'approved', note: '', draftVersion: 1 }, 0), /berubah/);
  assert.throws(() => reviewDraft(submitted(), hq, 'post', { decision: 'approved', note: '', draftVersion: 1 }, 1, '2026-10-17T00:00:00Z'));
  assert.throws(() => submitDraft(fixture(), creator, 'post', { url: 'https://example.test/draft', note: '' }, 0, '2026-02-31T03:00:00Z'));
  assert.throws(() => getDeliveryExecution(fixture(), 'unknown'));
});
test('HTTP(S) URLs reject executable/file schemes, credentials and malformed values', () => {
  for (const value of ['javascript:alert(1)', 'file:///tmp/a', '/relative/path', 'not a url', 'https://user:pass@example.test']) assert.throws(() => validHttpUrl(value));
  assert.equal(validHttpUrl(' https://example.test/path '), 'https://example.test/path');
});
test('Repository execution guard replays legal actions and rejects forged QC/history or fulfillment', () => {
  const row = fixture(), selected = chooseProduct(row, creator, products, 'sku-one', 0);
  assert.doesNotThrow(() => assertExecutionMutation(row, selected, creator, products));
  const ordered = progressFulfillment(selected, hq, 'ordered', 1);
  assert.throws(() => assertExecutionMutation(selected, ordered, creator, products));
  assert.doesNotThrow(() => assertExecutionMutation(selected, ordered, hq, products));
  const first = submitted(), review = approved();
  assert.doesNotThrow(() => assertExecutionMutation(row, first, creator, products));
  assert.throws(() => assertExecutionMutation(first, review, creator, products));
  assert.doesNotThrow(() => assertExecutionMutation(first, review, hq, products));
  const forged = structuredClone(review); forged.execution!.revision++; forged.execution!.deliverables.post.drafts[0].url = 'https://example.test/rewrite';
  assert.throws(() => assertExecutionMutation(review, forged, creator, products));
  const deleted = { ...review, execution: undefined };
  assert.throws(() => assertExecutionMutation(review, deleted, creator, products));
});
