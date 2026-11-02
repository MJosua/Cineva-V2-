import test from 'node:test';
import assert from 'node:assert/strict';
import { addRatingCriterion, assertRatingMutation, ratingAverage, recordRating } from './rating.ts';
import type { Campaign, TalentAssignment } from './model';

const hq = { id: 'hq-1', product: 'hq' as const }, creator = { id: 'creator-1', product: 'creator' as const };
const campaign = (): Campaign => ({ id: 'c', ownerId: 'hq-1', title: 'T', brand: 'B', brief: 'b', objective: 'o', audience: 'a', messaging: 'm', milestones: [], batches: [], assignments: [], products: [] });
const assignment = (): TalentAssignment => ({ id: 'a', batchId: 'b', creatorId: 'creator-1', creatorName: 'C', socialProfiles: [], deliverables: [] });

test('criteria are appended, unique ignoring case, capped, and need a label', () => {
  let row = addRatingCriterion(campaign(), ' Ketepatan waktu ', 'k1');
  row = addRatingCriterion(row, 'Kualitas hasil', 'k2');
  assert.deepEqual(row.ratingCriteria!.map(item => item.label), ['Ketepatan waktu', 'Kualitas hasil']);
  assert.throws(() => addRatingCriterion(row, 'ketepatan WAKTU', 'k3'), /sudah ada/);
  assert.throws(() => addRatingCriterion(row, '  ', 'k3'), /Isi butir/);
  let full = campaign();
  for (let i = 0; i < 20; i++) full = addRatingCriterion(full, `Butir ${i}`, `k${i}`);
  assert.throws(() => addRatingCriterion(full, 'Butir lagi', 'x'), /Maksimal 20/);
});
test('a rating needs HQ, every criterion scored 1-5, and no foreign criteria; the average is rounded to 2 decimals', () => {
  const criteria = [{ id: 'k1', label: 'Waktu' }, { id: 'k2', label: 'Kualitas' }, { id: 'k3', label: 'Komunikasi' }];
  const input = { id: 'r1', scores: { k1: 5, k2: 4, k3: 4 }, comment: ' Baik ', continueCooperation: 'yes' as const };
  assert.throws(() => recordRating(assignment(), criteria, creator, input), /Hanya HQ/);
  assert.throws(() => recordRating(assignment(), [], hq, input), /Susun butir/);
  assert.throws(() => recordRating(assignment(), criteria, hq, { ...input, scores: { k1: 5, k2: 4 } }), /Komunikasi/);
  assert.throws(() => recordRating(assignment(), criteria, hq, { ...input, scores: { k1: 5, k2: 6, k3: 1 } }), /1 sampai 5/);
  assert.throws(() => recordRating(assignment(), criteria, hq, { ...input, scores: { k1: 5, k2: 4.5, k3: 1 } }), /bilangan bulat/);
  assert.throws(() => recordRating(assignment(), criteria, hq, { ...input, scores: { k1: 5, k2: 4, k3: 4, x: 3 } }), /bukan milik/);
  const rated = recordRating(assignment(), criteria, hq, input, '2026-11-03T10:00:00.000Z');
  assert.deepEqual([rated.ratings![0].comment, ratingAverage(rated.ratings![0])], ['Baik', 4.33]);
  assert.throws(() => recordRating(rated, criteria, hq, input), /unik/);
  assert.equal(ratingAverage({ scores: {} }), null);
});
test('the repository guard accepts one valid new round by HQ and rejects edits, deletions and Creator writes', () => {
  const criteria = [{ id: 'k1', label: 'Waktu' }];
  const base = assignment(), once = recordRating(base, criteria, hq, { id: 'r1', scores: { k1: 5 } }, '2026-11-03T10:00:00.000Z');
  assert.doesNotThrow(() => assertRatingMutation(base, once, hq, criteria));
  assert.doesNotThrow(() => assertRatingMutation(once, once, creator, criteria));
  assert.throws(() => assertRatingMutation(base, once, creator, criteria), /Hanya HQ/);
  assert.throws(() => assertRatingMutation(once, base, hq, criteria), /tidak boleh diubah/);
  const edited = { ...once, ratings: [{ ...once.ratings![0], scores: { k1: 1 } }] };
  assert.throws(() => assertRatingMutation(once, edited, hq, criteria), /tidak boleh diubah/);
  const forged = { ...base, ratings: [{ id: 'r9', ratedBy: 'hq-1', ratedAt: '2026-11-03T10:00:00.000Z', scores: { k1: 9 }, comment: '' }] };
  assert.throws(() => assertRatingMutation(base, forged, hq, criteria), /1 sampai 5/);
});
