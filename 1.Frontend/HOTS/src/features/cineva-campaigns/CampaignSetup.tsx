import { useState } from 'react';
import { HotsForm } from '../cineva-shared/HotsForm';
import type { Campaign, TalentAssignment } from './model';
export function CampaignSetup({ onChange }: { onChange: (update: (row: Campaign) => Campaign) => void }) {
  const [error, setError] = useState('');
  return <details className="space-y-3 rounded-md border border-border p-4"><summary className="cursor-pointer font-semibold">Produk & milestone campaign</summary>
    <HotsForm schema={{ title: 'Konfigurasi operasional campaign', fields: [{ name: 'name', label: 'Nama produk dummy', type: 'text', required: true }, { name: 'variant', label: 'Varian produk', type: 'text', required: true }, { name: 'value', label: 'Harga acuan produk (bukan payout)', type: 'number', minnumber: 0, required: true }] }} submitLabel="Tambah produk" onSubmit={values => { try { onChange(row => ({ ...row, products: [...row.products, { id: `sku-${crypto.randomUUID()}`, name: String(values.name), variant: String(values.variant), referenceValue: Number(values.value) }] })); setError(''); } catch (failure) { setError((failure as Error).message); } }}/>
    <HotsForm schema={{ title: 'Konfigurasi operasional campaign', fields: [{ name: 'title', label: 'Nama milestone', type: 'text', required: true }, { name: 'deadline', label: 'Deadline milestone', type: 'date', required: true }] }} submitLabel="Tambah milestone" onSubmit={values => { try { onChange(row => ({ ...row, milestones: [...row.milestones, { id: `milestone-${crypto.randomUUID()}`, title: String(values.title), deadline: String(values.deadline) }] })); setError(''); } catch (failure) { setError((failure as Error).message); } }}/>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </details>;
}
export function DeliverableEditor({ onChange }: { onChange: (update: (row: TalentAssignment) => TalentAssignment) => void }) {
  const [error, setError] = useState('');
  return <details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-semibold">Tambah output assignment</summary>
    <HotsForm schema={{ title: 'Konfigurasi operasional campaign', fields: [{ name: 'title', label: 'Judul output tambahan', type: 'text', required: true }, { name: 'platform', label: 'Platform output tambahan', type: 'text', required: true }, { name: 'deadline', label: 'Deadline output tambahan', type: 'date', required: true }, { name: 'destination', label: 'Tujuan output tambahan', type: 'select', required: true, options: ['Posting Creator', 'Asset brand'] }] }} submitLabel="Tambah output" onSubmit={values => { try { onChange(row => ({ ...row, deliverables: [...row.deliverables, { id: `output-${crypto.randomUUID()}`, title: String(values.title), platform: String(values.platform), deadline: String(values.deadline), postingRequired: values.destination === 'Posting Creator', outputOwner: values.destination === 'Posting Creator' ? 'creator' : 'brand' }] })); setError(''); } catch (failure) { setError((failure as Error).message); } }}/>
    {error && <p role="alert" className="text-destructive">{error}</p>}
  </details>;
}
