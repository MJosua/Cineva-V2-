import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignSeed } from './seed.ts';
import { assertStorylineGate, assertWorkflowMutation, confirmReceipt, reportProductIssue, reviewStoryline, saveAddress, storylineStatus, submitStoryline, workflowSteps } from './workflow.ts';
import { createRegistrationRepository, registrationSeed, validateRegistration } from './registration.ts';

const campaign = campaignSeed()[0], fresh = { ...campaign.assignments[3] }; // tanpa workflow
const creator = { id: fresh.creatorId, product: 'creator' as const }, hq = { id: 'hq-1', product: 'hq' as const };

test('Creator fills address and confirms receipt; product issue must be reported within 1x24 hours with PNG/JPEG', () => {
  assert.throws(() => saveAddress(fresh, hq, { recipient: 'A', phone: '0812345678', full: 'Jl. X' }, '2026-10-09T00:00:00Z'), /Creator/);
  const withAddress = saveAddress(fresh, creator, { recipient: ' Ani ', phone: '0812-3456-789', full: 'Jl. Contoh 1' }, '2026-10-09T00:00:00Z');
  assert.equal(withAddress.workflow!.address!.recipient, 'Ani');
  const received = confirmReceipt(withAddress, creator, '2026-10-12T08:00:00Z');
  assert.throws(() => reportProductIssue(received, creator, 'Bocor', 'bukti.pdf', '2026-10-12T09:00:00Z'), /PNG atau JPEG/);
  assert.throws(() => reportProductIssue(received, creator, 'Bocor', 'bukti.png', '2026-10-13T08:00:01Z'), /1x24 jam/);
  assert.equal(workflowSteps(reportProductIssue(received, creator, 'Bocor', 'bukti.png', '2026-10-13T08:00:00Z'))[1].state, 'issue');
});

test('Storyline: submit, revision by client, resubmit, ACC by KOL Manager; history is append-only', () => {
  let row = submitStoryline(fresh, creator, 'Scene 1', '2026-10-10T00:00:00Z');
  assert.equal(storylineStatus(row), 'submitted');
  assert.throws(() => submitStoryline(row, creator, 'lagi', '2026-10-10T01:00:00Z'), /direview/);
  assert.throws(() => reviewStoryline(row, hq, 'revision_requested', 'client', ' ', '2026-10-10T02:00:00Z'), /Catatan revisi/);
  row = reviewStoryline(row, hq, 'revision_requested', 'client', 'Sebut MSRP', '2026-10-10T02:00:00Z');
  assert.equal(storylineStatus(row), 'revision_requested');
  row = submitStoryline(row, creator, 'Scene 1 + MSRP', '2026-10-10T03:00:00Z');
  const zoneOk = reviewStoryline(row, hq, 'approved', 'zone', '', '2026-10-10T04:00:00Z');
  assert.equal(storylineStatus(zoneOk), 'submitted');
  row = reviewStoryline(row, hq, 'approved', 'kol_manager', 'OK', '2026-10-10T04:00:00Z');
  assert.equal(storylineStatus(row), 'approved');
  assert.throws(() => assertWorkflowMutation(row, { ...row, workflow: { ...row.workflow, storyline: { submissions: [], reviews: [] } } }, creator), /Riwayat storyline/);
  assert.throws(() => assertWorkflowMutation(fresh, submitStoryline(fresh, creator, 'x', '2026-10-10T00:00:00Z'), hq), /HQ hanya/);
});

test('Draft is blocked until storyline ACC when the campaign requires it', () => {
  const withDraft = { ...fresh, execution: { revision: 1, product: { choice: 'unselected' as const, fulfillment: 'pending' as const }, deliverables: { reels: { status: 'submitted' as const, drafts: [{ version: 1, url: 'https://drive.google.com/x', note: '', submittedAt: '2026-10-12T00:00:00.000Z' }], reviews: [] } } } };
  assert.throws(() => assertStorylineGate(fresh, withDraft, campaign), /ACC KOL Manager/);
  assert.doesNotThrow(() => assertStorylineGate(fresh, withDraft, { ...campaign, jobRules: {} }));
  const seeded = campaign.assignments[0];
  assert.equal(storylineStatus(seeded), 'approved');
  assert.doesNotThrow(() => assertStorylineGate(seeded, { ...withDraft, workflow: seeded.workflow }, campaign));
});

test('Registration validates age rule, WhatsApp, usernames, and flags duplicates', () => {
  const base = { name: 'Ani', city: 'Bandung', age: 22, gender: 'Wanita' as const, whatsapp: '0812 3456 7890', occupation: 'Freelance', accounts: [{ platform: 'Instagram' as const, username: '@Ani.id', followers: 1200, niche: 'Lifestyle' }] };
  assert.equal(validateRegistration(base).whatsapp, '6281234567890');
  assert.throws(() => validateRegistration({ ...base, age: 19 }, { minAge: 21 }), /minimal 21/);
  assert.throws(() => validateRegistration({ ...base, whatsapp: '12' }), /WhatsApp/);
  assert.throws(() => validateRegistration({ ...base, accounts: [] }), /minimal satu akun/);
  const store = new Map<string, unknown>(), repo = createRegistrationRepository({ get: <T,>(key: string) => store.get(key) as T, set: (key, value) => { store.set(key, value); } });
  assert.equal(repo.list(hq, 'campaign-ic100').length, registrationSeed().length);
  const seedRow = registrationSeed()[2];
  const result = repo.submit({ id: 'creator-1', product: 'creator' }, 'campaign-ic100', { ...base, whatsapp: seedRow.whatsapp }, undefined, '2026-10-07T00:00:00Z');
  assert.equal(result.duplicates[0].confirmed, true);
  assert.throws(() => repo.submit({ id: 'creator-1', product: 'creator' }, 'campaign-ic100', base, undefined, '2026-10-07T00:00:00Z'), /sudah mendaftar/);
  assert.equal(repo.list({ id: 'creator-1', product: 'creator' }, 'campaign-ic100').length, 1);
  assert.throws(() => repo.decide({ id: 'creator-1', product: 'creator' }, result.row.id, 'acc', 'PIC', '', '2026-10-08T00:00:00Z'), /HQ/);
  assert.throws(() => repo.decide(hq, result.row.id, 'acc', ' ', '', '2026-10-08T00:00:00Z'), /PIC/);
  repo.decide(hq, result.row.id, 'acc', 'PIC A', '', '2026-10-08T00:00:00Z');
  assert.equal(repo.list(hq, 'campaign-ic100').find(row => row.id === result.row.id)!.status, 'acc');
});
