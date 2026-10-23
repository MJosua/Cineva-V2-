import { useState } from 'react';
import { HotsForm } from '../cineva-shared/HotsForm';
import type { Campaign, TalentAssignment } from './model';
export function AssignmentEditor({ campaign, onSave }: { campaign: Campaign; onSave: (row: TalentAssignment) => void }) {
  const [error, setError] = useState('');
  return <section className="space-y-3 rounded-md border border-border p-4"><h3 className="font-semibold">Tambah talent assignment</h3>
    <HotsForm schema={{ title: 'Talent assignment', fields: [
      { name: 'batchId', label: 'Batch assignment', type: 'select', required: true, options: campaign.batches.map(batch => ({ value: batch.id, label: batch.name })) },
      { name: 'creatorId', label: 'Identitas Creator', type: 'select', required: true, options: ['creator-1', 'creator-2'] },
      { name: 'creatorName', label: 'Nama talent dummy', type: 'text', required: true }, { name: 'platform', label: 'Platform assignment', type: 'select', required: true, options: ['Instagram', 'TikTok', 'Shopee'] },
      { name: 'handle', label: 'Akun sosial dummy', type: 'text', required: true }, { name: 'followers', label: 'Follower snapshot (kosong bila belum tersedia)', type: 'number', minnumber: 0 },
      { name: 'capturedAt', label: 'Tanggal snapshot akun', type: 'date', required: true }, { name: 'deliverable', label: 'Nama output', type: 'text', required: true },
      { name: 'output', label: 'Tujuan output', type: 'select', required: true, options: [{ value: 'creator', label: 'Posting akun Creator' }, { value: 'brand', label: 'Asset untuk brand, tanpa posting' }] },
      { name: 'deadline', label: 'Deadline output', type: 'date', required: true },
    ] }} submitLabel="Simpan assignment" onSubmit={values => {
      try { onSave({ id: `assignment-${crypto.randomUUID()}`, batchId: String(values.batchId), creatorId: String(values.creatorId), creatorName: String(values.creatorName), socialProfiles: [{ platform: String(values.platform), handle: String(values.handle), followers: String(values.followers ?? '').trim() ? Number(values.followers) : null, capturedAt: String(values.capturedAt) }], deliverables: [{ id: 'output-1', title: String(values.deliverable), platform: String(values.platform), deadline: String(values.deadline), postingRequired: values.output === 'creator', outputOwner: values.output === 'creator' ? 'creator' : 'brand' }] }); setError(''); }
      catch (failure) { setError((failure as Error).message); }
    }}/>{error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
