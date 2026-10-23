import type { DynamicFormSchema } from '@hots/dynamic-form';
import type { ProjectType } from '../cineva-shared/model';

export const services: Record<ProjectType, { description: string; base: number; fields: DynamicFormSchema['fields'] }> = {
  Campaign: { description: 'Campaign berperiode dengan lingkup kerja dan deliverable.', base: 3000000, fields: [
    { name: 'objective', label: 'Tujuan campaign', type: 'textarea', required: true },
    { name: 'periodEnd', label: 'Akhir periode campaign', type: 'date', required: true },
    { name: 'scopeOfWork', label: 'SOW dan batas lingkup campaign (opsional)', type: 'textarea' },
    { name: 'deliverablePlan', label: 'Rencana deliverable per periode (opsional)', type: 'textarea' },
    { name: 'reportingCadence', label: 'Frekuensi laporan campaign (opsional)', type: 'text' },
  ] },
  Production: { description: 'Video graduation, iklan atau photoshoot birthday.', base: 7500000, fields: [
    { name: 'occasion', label: 'Kebutuhan produksi', type: 'select', required: true, options: ['Graduation', 'Iklan', 'Birthday', 'Lainnya'] },
    { name: 'concept', label: 'Konsep produksi', type: 'textarea', required: true },
    { name: 'preProduction', label: 'Persiapan: script, storyboard, lokasi (opsional)', type: 'textarea' },
    { name: 'productionPlan', label: 'Rencana shooting dan kebutuhan produksi (opsional)', type: 'textarea' },
    { name: 'postProduction', label: 'Editing, format final dan revisi (opsional)', type: 'textarea' },
  ] },
  'Content Shoot': { description: 'Sesi pembuatan konten dengan fotografer atau videografer.', base: 1500000, fields: [
    { name: 'platform', label: 'Platform konten', type: 'select', required: true, options: ['Instagram', 'TikTok', 'YouTube', 'Multi-platform'] },
    { name: 'sessionCount', label: 'Jumlah sesi (opsional)', type: 'number', minnumber: 1, maxnumber: 365 },
    { name: 'sessionPlan', label: 'Rincian sesi, shot list dan output (opsional)', type: 'textarea' },
    { name: 'sessionNotes', label: 'Ketentuan lokasi dan persiapan sesi (opsional)', type: 'textarea' },
  ] },
};
export const serviceTypes = Object.keys(services) as ProjectType[];
export function briefSchema(type: ProjectType): DynamicFormSchema {
  return { title: 'Brief layanan', fields: [
    { name: 'title', label: 'Judul permintaan', type: 'text', required: true },
    { name: 'brand', label: 'Brand / client', type: 'text', required: true },
    { name: 'contact', label: 'Kontak PIC', type: 'text', required: true },
    { name: 'location', label: 'Lokasi', type: 'text', required: true },
    { name: 'scheduledAt', label: 'Jadwal layanan (WIB)', type: 'datetime', required: true },
    { name: 'durationHours', label: 'Durasi layanan (jam)', type: 'number', required: true, minnumber: 1, maxnumber: 24 },
    { name: 'deliverables', label: 'Deliverable yang diminta', type: 'textarea', required: true },
    { name: 'specialist', label: 'Jasa tenaga', type: 'select', required: true, options: ['Videografer', 'Fotografer', 'Keduanya'] },
    { name: 'days', label: 'Jumlah hari produksi', type: 'number', required: true, minnumber: 1, maxnumber: 365 },
    { name: 'crew', label: 'Jumlah crew', type: 'number', required: true, minnumber: 1, maxnumber: 100 },
    { name: 'gear', label: 'Jumlah unit gear', type: 'number', required: true, minnumber: 0, maxnumber: 100 },
    { name: 'budget', label: 'Budget indikatif (Rp)', type: 'number', required: true, minnumber: 0 },
    ...services[type].fields,
  ] };
}
