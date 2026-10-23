import test from 'node:test';
import assert from 'node:assert/strict';
import { briefSchema } from '../../../1.Frontend/HOTS/src/features/cineva-services/catalog';
import { defaultRates, estimate } from '../../../1.Frontend/HOTS/src/features/cineva-services/pricing';
import { convertInquiry, transition, validateBrief, type Actor } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/domain';
import { createInquiryRepository } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/repository';
import { claim, handover, sendSupport } from '../../../1.Frontend/HOTS/src/features/cineva-support/support';
import { createDummyRepository } from '../../../1.Frontend/HOTS/src/features/cineva-shared/dummyRepository';
const creator: Actor = { product: 'creator', id: 'creator-1' }, hq: Actor = { product: 'hq', id: 'hq-1' };
const brief = { title: 'Dummy graduation', brand: 'Brand dummy', contact: 'PIC dummy', location: 'Studio', scheduledAt: '2026-10-21T10:00', durationHours: 2, deliverables: 'Video', specialist: 'Videografer', days: 1, crew: 2, gear: 1, budget: 9000000, occasion: 'Graduation', concept: 'Ceremony', privateFinance: 'NEVER SHARE' };
function fixture() {
  let state: unknown, fail = false;
  const repo = createInquiryRepository({ get: () => structuredClone(state) as any, set: (_key, next) => { if (!fail) state = structuredClone(next); } });
  return { repo, fail: () => { fail = true; }, row: () => repo.create('request-1', creator, hq.id, 'Production', brief) };
}
test('Three service schemas keep relevant fields, campaign period and production occasion', () => {
  assert.ok(briefSchema('Campaign').fields.some(f => f.name === 'periodEnd'));
  assert.ok(briefSchema('Production').fields.some(f => f.name === 'occasion'));
  assert.ok(!briefSchema('Content Shoot').fields.some(f => f.name === 'concept'));
  assert.throws(() => validateBrief('Production', { ...brief, specialist: 'unknown' }));
  assert.throws(() => validateBrief('Campaign', { ...brief, objective: 'Reach', periodEnd: '2026-02-31' }));
});
test('Price items reconcile, reject bad counts and retain snapshots after rate changes', () => {
  const quote = estimate('Production', 2, 3, 1, defaultRates);
  assert.equal(quote.total, 10100000); assert.equal(quote.total, quote.items.reduce((n, i) => n + i.subtotal, 0));
  assert.throws(() => estimate('Production', 1, -1, 0, defaultRates));
  const { repo, row } = fixture(), before = row();
  repo.saveRates(hq, { ...defaultRates, version: 'DUMMY-2', crew: 999000 });
  assert.deepEqual(repo.get(before.id, creator).quote, before.quote);
  assert.throws(() => repo.saveRates(creator, defaultRates));
});
test('Request envelope excludes private data, scopes two Creator and HQ identities', () => {
  const { repo, row } = fixture(); row();
  assert.equal(repo.list(creator).length, 1); assert.equal(repo.list(hq).length, 1);
  assert.equal(repo.list({ product: 'creator', id: 'creator-2' }).length, 0);
  assert.equal(repo.list({ product: 'hq', id: 'hq-2' }).length, 0);
  assert.equal(repo.get('request-1', creator).brief.privateFinance, undefined);
  assert.throws(() => repo.get('request-1', { product: 'hq', id: 'hq-2' }));
});
test('Submit retries deduplicate; failed storage never returns false success', () => {
  const { repo, row, fail } = fixture(); row(); row(); assert.equal(repo.list(creator).length, 1);
  fail(); assert.throws(() => repo.create('request-2', creator, hq.id, 'Production', brief));
  assert.equal(repo.list(hq).length, 1);
});
test('Quote acceptance belongs to request owner, terminal states prevent project conversion', async () => {
  const { row } = fixture(); let current = row();
  assert.throws(() => transition(current, 'reviewing', creator));
  current = transition(current, 'reviewing', hq); current = transition(current, 'quoted', hq);
  assert.throws(() => transition(current, 'accepted', hq));
  const workspace = await createDummyRepository().load('hq');
  assert.throws(() => convertInquiry(current, workspace));
  current = transition(current, 'accepted', creator);
  const converted = convertInquiry(current, workspace), retry = convertInquiry(current, converted);
  assert.equal(converted.jobs.length, workspace.jobs.length + 1); assert.deepEqual(retry, converted);
  assert.equal(converted.jobs.at(-1)?.fee, current.quote.total);
  assert.match(converted.jobs.at(-1)?.brief ?? '', /Graduation/);
});
test('Delayed AI result is ignored after human handover, context and user message remain', async () => {
  const { repo, row } = fixture(); row(); let resolve!: (value: string) => void;
  const pending = sendSupport(repo, 'request-1', creator, 'Butuh fotografer', { reply: () => new Promise(r => { resolve = r; }) });
  repo.update('request-1', creator, handover); repo.update('request-1', hq, r => claim(r, hq));
  resolve('Late AI message'); await pending;
  assert.equal(repo.get('request-1', hq).support, 'human');
  assert.equal(repo.get('request-1', hq).messages.length, 1);
  await sendSupport(repo, 'request-1', hq, 'Saya bantu cek brief.');
  assert.equal(repo.get('request-1', creator).messages.length, 2);
});
test('Provider failure retains user input without a fake successful AI response', async () => {
  const { repo, row } = fixture(); row();
  await assert.rejects(sendSupport(repo, 'request-1', creator, 'Tolong bantu', { reply: async () => { throw new Error('Dummy timeout'); } }));
  assert.equal(repo.get('request-1', creator).messages.length, 1);
});
test('Support retry with the same message identity does not duplicate input or AI reply', async () => {
  const { repo, row } = fixture(); row();
  const provider = { reply: async () => 'Dummy response' };
  await sendSupport(repo, 'request-1', creator, 'Bantu brief', provider, 'message-1');
  await sendSupport(repo, 'request-1', creator, 'Bantu brief', provider, 'message-1');
  assert.equal(repo.get('request-1', creator).messages.length, 2);
});
test('Drafts belong to author and destination, and can be removed after submit', () => {
  const { repo } = fixture(); repo.saveDraft(creator, hq.id, { type: 'Production', values: brief });
  assert.deepEqual(repo.draft(creator, hq.id)?.values, brief);
  assert.equal(repo.draft({ product: 'creator', id: 'creator-2' }, hq.id), null);
  assert.equal(repo.draft(creator, 'hq-2'), null);
  repo.saveDraft(creator, hq.id, null); assert.equal(repo.draft(creator, hq.id), null);
});
