import './workflow.test';
import './quotes.test';
import './operations.test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInquiryRepository } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/repository';
import { transition, convertInquiry } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/domain';
import { createDummyRepository } from '../../../1.Frontend/HOTS/src/features/cineva-shared/dummyRepository';
import { changeSupport } from '../../../1.Frontend/HOTS/src/features/cineva-support/assignment';
import { handover, sendSupport } from '../../../1.Frontend/HOTS/src/features/cineva-support/support';
import { acceptQuoteRevision, acceptedQuoteSnapshot, requestQuoteChanges, reviseQuote } from '../../../1.Frontend/HOTS/src/features/cineva-inquiries/quotes';
import { defaultRates } from '../../../1.Frontend/HOTS/src/features/cineva-services/pricing';
const creator = { product: 'creator' as const, id: 'creator-1' }, hq = { product: 'hq' as const, id: 'hq-1' };
function fixture() {
  let data: unknown;
  const repo = createInquiryRepository({ get: () => structuredClone(data) as any, set: (_key, value) => { data = structuredClone(value); } });
  repo.create('maturity', creator, hq.id, 'Content Shoot', { title: 'Mature request', brand: 'Dummy brand', contact: 'PIC', location: 'Studio', scheduledAt: '2026-10-23T10:00', durationHours: 2, deliverables: 'Foto dan video', specialist: 'Keduanya', days: 1, crew: 2, gear: 1, budget: 3000000, platform: 'Instagram' });
  return repo;
}
test('Repository guards accepted quote history and conversion retains approved version and role needs', async () => {
  const repo = fixture();
  repo.update('maturity', hq, row => transition(row, 'reviewing', hq));
  repo.update('maturity', hq, row => transition(row, 'quoted', hq));
  repo.update('maturity', creator, row => transition(row, 'accepted', creator));
  assert.throws(() => repo.update('maturity', hq, row => ({ ...row, quote: { ...row.quote, total: 1 } })));
  assert.throws(() => repo.update('maturity', hq, row => ({ ...row, acceptedQuoteRevision: undefined })));
  assert.throws(() => repo.update('maturity', hq, row => {
    row.quote.total += 1;
    row.quoteHistory!.find(quote => quote.revision === row.acceptedQuoteRevision)!.total += 1;
    return row;
  }));
  const row = repo.get('maturity', creator), workspace = await createDummyRepository().load('hq');
  const job = convertInquiry(row, workspace).jobs.at(-1)!;
  assert.equal(job.sourceQuote?.revision, row.acceptedQuoteRevision);
  assert.equal(job.fee, row.quote.total); assert.deepEqual(job.requiredRoles, ['photographer', 'videographer']);
  assert.deepEqual(convertInquiry(row, { ...workspace, jobs: [...workspace.jobs, job] }).jobs.at(-1), job);
});
test('Late AI cannot reappear even after human handover returns to AI', async () => {
  const repo = fixture(); let resolve!: (text: string) => void;
  const pending = sendSupport(repo, 'maturity', creator, 'Help me', { reply: () => new Promise(r => { resolve = r; }) });
  repo.update('maturity', creator, row => handover(row, creator));
  repo.update('maturity', creator, row => changeSupport(row, creator, 'ai'));
  resolve('Old inference'); await pending;
  assert.equal(repo.get('maturity', creator).messages.length, 1);
  assert.equal(repo.get('maturity', creator).supportEvents?.length, 2);
});
test('Negotiated quantities are snapshotted separately from initial brief and conversion uses agreed scope', async () => {
  const repo = fixture(); repo.update('maturity', hq, row => transition(row, 'reviewing', hq));
  repo.update('maturity', hq, row => transition(row, 'quoted', hq));
  repo.update('maturity', creator, row => requestQuoteChanges(row, creator, 'One crew for two days', 1));
  repo.update('maturity', hq, row => reviseQuote(row, hq, defaultRates, { days: 2, crew: 1, gear: 0 }));
  repo.update('maturity', hq, row => transition(row, 'quoted', hq));
  const accepted = repo.update('maturity', creator, row => acceptQuoteRevision(row, creator, 2));
  assert.equal(accepted.brief.crew, 2); assert.equal(accepted.quote.scope?.crew, 1);
  const extracted = acceptedQuoteSnapshot(accepted); extracted.scope!.crew = 99;
  assert.equal(accepted.quote.scope?.crew, 1);
  const job = convertInquiry(accepted, await createDummyRepository().load('hq')).jobs.at(-1)!;
  assert.match(job.brief, /Jumlah crew: 1/); assert.equal(job.fee, 2200000);
});
