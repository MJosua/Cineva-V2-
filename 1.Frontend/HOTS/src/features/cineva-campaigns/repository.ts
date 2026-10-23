import { createAppStorage } from '@hots/app-core';
import type { Actor } from '../cineva-inquiries/domain';
import type { StoragePort } from '../cineva-inquiries/repository';
import { isHQOwner, validateCampaign, type Campaign, type TalentAssignment } from './model';
import { campaignSeed } from './seed';
import { assertExecutionMutation } from './execution';
import { assertFinanceMutation } from './finance';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export function createCampaignRepository(storage: StoragePort) {
  const key = 'campaigns', listeners = new Set<() => void>();
  const assertActor = (actor: Actor) => { if (!['hq', 'creator'].includes(actor.product) || ![`${actor.product}-1`, `${actor.product}-2`].includes(actor.id)) throw new Error('Identitas dummy tidak dikenal.'); };
  const read = (): Campaign[] => {
    const saved = storage.get<Campaign[]>(key), rows = saved === null || saved === undefined ? campaignSeed() : saved;
    try { if (!Array.isArray(rows)) throw new Error(); rows.forEach(validateCampaign); }
    catch { throw new Error('Data campaign dummy tidak valid. Jangan menimpa data; periksa penyimpanan browser.'); }
    return clone(rows);
  };
  const write = (rows: Campaign[]) => {
    rows.forEach(validateCampaign); const previous = read(); storage.set(key, rows);
    if (JSON.stringify(storage.get(key)) !== JSON.stringify(rows)) { storage.set(key, previous); throw new Error('Campaign dummy belum tersimpan.'); }
    listeners.forEach(listener => listener());
  };
  const visible = (row: Campaign, actor: Actor) => isHQOwner(actor, row) || actor.product === 'creator' && row.assignments.some(item => item.creatorId === actor.id);
  const assertNewAssignments = (assignments: TalentAssignment[]) => {
    if (assignments.some(item => item.execution !== undefined || item.finance !== undefined))
      throw new Error('Assignment baru harus tanpa progress atau ledger; gunakan tindakan operasional setelah dibuat.');
  };
  const project = (row: Campaign, actor: Actor) => {
    const copy = clone(row);
    if (actor.product === 'creator') {
      copy.assignments = copy.assignments.filter(item => item.creatorId === actor.id).map(item => {
        if (item.finance) delete (item.finance as Partial<typeof item.finance>).marketingAmount;
        return item;
      });
      const ownBatches = new Set(copy.assignments.map(item => item.batchId));
      copy.batches = copy.batches.filter(batch => ownBatches.has(batch.id));
    }
    return copy;
  };
  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    getCampaigns(actor: Actor) { assertActor(actor); return read().filter(row => visible(row, actor)).map(row => project(row, actor)); },
    get(id: string, actor: Actor) { assertActor(actor); const row = read().find(item => item.id === id); if (!row || !visible(row, actor)) throw new Error('Campaign tidak tersedia.'); return project(row, actor); },
    create(actor: Actor, row: Campaign) {
      assertActor(actor); if (!isHQOwner(actor, row)) throw new Error('Hanya HQ pemilik dapat membuat campaign.');
      assertNewAssignments(row.assignments);
      const rows = read(); if (rows.some(item => item.id === row.id)) throw new Error('ID campaign sudah ada.'); write([...rows, clone(row)]);
    },
    mutate(actor: Actor, id: string, update: (row: Campaign) => Campaign, expectedRevision?: number) {
      assertActor(actor); const rows = read(), row = rows.find(item => item.id === id);
      if (!row || !isHQOwner(actor, row)) throw new Error('Hanya HQ pemilik dapat mengubah campaign.');
      if (expectedRevision !== undefined && (row.revision ?? 0) !== expectedRevision) throw new Error('Campaign berubah. Muat kondisi terbaru.');
      const next = update(clone(row)); if (next.id !== row.id || next.ownerId !== row.ownerId) throw new Error('Identitas campaign tidak boleh berubah.');
      if (row.assignments.some(assignment => JSON.stringify(next.assignments.find(item => item.id === assignment.id)) !== JSON.stringify(assignment)))
        throw new Error('Assignment existing hanya diubah melalui tindakan assignment.');
      assertNewAssignments(next.assignments.filter(item => !row.assignments.some(previous => previous.id === item.id)));
      write(rows.map(item => item.id === id ? { ...clone(next), revision: (row.revision ?? 0) + 1 } : item));
    },
    updateAssignment(actor: Actor, id: string, assignmentId: string, update: (row: TalentAssignment) => TalentAssignment, expectedRevision?: number) {
      assertActor(actor); const rows = read(), campaign = rows.find(item => item.id === id), assignment = campaign?.assignments.find(item => item.id === assignmentId);
      if (!campaign || !assignment || !(isHQOwner(actor, campaign) || actor.product === 'creator' && assignment.creatorId === actor.id)) throw new Error('Assignment tidak tersedia.');
      if (expectedRevision !== undefined && (campaign.revision ?? 0) !== expectedRevision) throw new Error('Campaign berubah. Muat kondisi terbaru.');
      const next = update(clone(assignment));
      if (next.id !== assignment.id || next.creatorId !== assignment.creatorId || next.batchId !== assignment.batchId) throw new Error('Identitas assignment tidak boleh berubah.');
      if (assignment.execution || assignment.finance) {
        if (assignment.deliverables.some(deliverable => JSON.stringify(next.deliverables.find(item => item.id === deliverable.id)) !== JSON.stringify(deliverable)))
          throw new Error('Output yang memiliki progress atau ledger harus dipertahankan; tambahkan output baru.');
      }
      if (actor.product === 'creator') {
        const stable = (value: TalentAssignment) => { const copy = clone(value); delete copy.execution; delete copy.finance; return copy; };
        if (JSON.stringify(stable(next)) !== JSON.stringify(stable(assignment))) throw new Error('Creator hanya dapat memperbarui pelaksanaan assignment sendiri.');
      }
      assertExecutionMutation(assignment, next, actor, campaign.products);
      assertFinanceMutation(assignment, next, actor);
      write(rows.map(item => item.id === id ? { ...item, revision: (item.revision ?? 0) + 1, assignments: item.assignments.map(current => current.id === assignmentId ? clone(next) : current) } : item));
    },
  };
}
export const campaignRepository = createCampaignRepository(createAppStorage('cineva_campaigns_dummy_v1'));
export type CampaignRepository = ReturnType<typeof createCampaignRepository>;
