import { useState } from 'react';
import { HotsForm } from '../cineva-shared/HotsForm';
import type { Campaign } from './model';
export function CampaignEditor({ ownerId, onSave }: { ownerId: string; onSave: (row: Campaign) => void }) {
  const [error, setError] = useState('');
  return <section className="space-y-3 rounded-md border border-border p-4"><h2 className="font-semibold">Buat campaign dummy</h2>
    <HotsForm schema={{ title: 'Brief campaign', fields: [
      { name: 'title', label: 'Nama campaign', type: 'text', required: true }, { name: 'brand', label: 'Brand campaign', type: 'text', required: true },
      { name: 'brief', label: 'Brief campaign', type: 'textarea', required: true }, { name: 'objective', label: 'Objective campaign', type: 'textarea', required: true },
      { name: 'audience', label: 'Target audience', type: 'text', required: true }, { name: 'messaging', label: 'Key messaging', type: 'textarea', required: true },
      { name: 'batch', label: 'Nama batch pertama', type: 'text', required: true }, { name: 'deadline', label: 'Deadline draft', type: 'date', required: true },
    ] }} submitLabel="Simpan campaign" onSubmit={values => {
      try { onSave({ id: `campaign-${crypto.randomUUID()}`, ownerId, title: String(values.title), brand: String(values.brand), brief: String(values.brief), objective: String(values.objective), audience: String(values.audience), messaging: String(values.messaging), batches: [{ id: 'batch-1', name: String(values.batch) }], milestones: [{ id: 'draft', title: 'Draft konten', deadline: String(values.deadline) }], assignments: [], products: [] }); setError(''); }
      catch (failure) { setError((failure as Error).message); }
    }}/>{error && <p role="alert" className="text-destructive">{error}</p>}
  </section>;
}
