import type { FormValues } from '@hots/dynamic-form';
import { briefSchema } from '../cineva-services/catalog';
import type { Quote } from '../cineva-services/pricing';
import { validateServiceDetails } from '../cineva-services/workflow';
import { acceptQuoteRevision, acceptedQuoteSnapshot } from './quotes';
import { createJob, type ProjectType, type Workspace } from '../cineva-shared/model';

export type InquiryStatus = 'submitted' | 'reviewing' | 'quoted' | 'changes_requested' | 'accepted' | 'rejected' | 'cancelled';
export type SupportMode = 'ai' | 'waiting' | 'human' | 'resolved';
export interface Actor { id: string; product: 'hq' | 'creator' }
export interface Message { id: string; actor: string; text: string }
export interface Inquiry {
  id: string; owner: string; destination: string; type: ProjectType; brief: FormValues;
  status: InquiryStatus; quote: Quote; projectId?: string; agent?: string;
  support: SupportMode; messages: Message[];
  quoteHistory?: Quote[];
  quoteChangeRequests?: { revision: number; owner: string; reason: string }[];
  acceptedQuoteRevision?: number;
  supportEvents?: import('../cineva-support/assignment').SupportEvent[];
}
export function canRead(row: Inquiry, actor: Actor) {
  return actor.product === 'hq' ? row.destination === actor.id : row.owner === actor.id;
}
export function validateBrief(type: ProjectType, brief: FormValues) {
  for (const field of briefSchema(type).fields) {
    if (field.required && !String(brief[field.name] ?? '').trim()) throw new Error(`Lengkapi ${field.label}.`);
    if (field.type === 'select' && (field.required || String(brief[field.name] ?? '').trim()) && !field.options?.some(option => String(typeof option === 'object' ? option.value : option) === String(brief[field.name])))
      throw new Error(`Pilihan ${field.label} tidak valid.`);
  }
  const date = String(brief.scheduledAt), parsed = new Date(date + '+07:00');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) !== date.slice(0, 10))
    throw new Error('Jadwal layanan tidak valid.');
  if (!Number.isSafeInteger(Number(brief.budget)) || Number(brief.budget) < 0 || !Number.isFinite(Number(brief.durationHours)) || Number(brief.durationHours) < 1 || Number(brief.durationHours) > 24)
    throw new Error('Budget/durasi tidak valid.');
  const periodEnd = String(brief.periodEnd), endDate = new Date(periodEnd + 'T00:00:00+07:00');
  if (type === 'Campaign' && (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) || !Number.isFinite(endDate.getTime()) || endDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) !== periodEnd || periodEnd < date.slice(0, 10)))
    throw new Error('Akhir periode campaign harus sesudah tanggal mulai.');
  validateServiceDetails(type, brief);
}
const allowed: Record<InquiryStatus, InquiryStatus[]> = {
  submitted: ['reviewing', 'rejected', 'cancelled'], reviewing: ['quoted', 'rejected', 'cancelled'],
  quoted: ['accepted', 'rejected', 'cancelled'], changes_requested: ['reviewing', 'rejected', 'cancelled'], accepted: [], rejected: [], cancelled: [],
};
export function transition(row: Inquiry, next: InquiryStatus, actor: Actor): Inquiry {
  if (!canRead(row, actor) || !allowed[row.status].includes(next)) throw new Error('Transisi inquiry tidak diizinkan.');
  if (['reviewing', 'quoted', 'rejected'].includes(next) && actor.product !== 'hq') throw new Error('Hanya HQ tujuan dapat mereview.');
  if (next === 'accepted' && row.owner !== actor.id) throw new Error('Pemilik permintaan yang menyetujui quote.');
  return next === 'accepted' ? acceptQuoteRevision(row, actor, row.quote.revision) : { ...row, status: next };
}
/** Recovery-safe conversion: deterministic ID handles save-success / acknowledgement-failure retries. */
export function convertInquiry(row: Inquiry, workspace: Workspace): Workspace {
  if (row.status !== 'accepted' || workspace.product !== 'hq') throw new Error('Quote harus disetujui sebelum menjadi project.');
  const quote = acceptedQuoteSnapshot(row);
  const agreedBrief = { ...row.brief, ...quote.scope };
  const id = `inquiry-${row.id}`;
  if (workspace.jobs.some(job => job.id === id)) return workspace;
  const clientId = `inquiry-client-${row.id}`;
  const current = { ...workspace, clients: [...workspace.clients, { id: clientId, name: String(row.brief.brand), contact: String(row.brief.contact), email: '' }] };
  const job = { ...createJob({ title: String(row.brief.title), clientId, type: row.type, platform: String(row.brief.platform || 'Multi-platform'),
    scheduledAt: String(row.brief.scheduledAt), durationHours: Number(row.brief.durationHours), fee: quote.total, barter: 0,
    brief: briefSchema(row.type).fields.map(field => `${field.label}: ${String(agreedBrief[field.name] ?? '')}`).join('\n'), resourceIds: [] }, current, id), sourceInquiryId: row.id,
    sourceQuote: quote,
    requiredRoles: row.brief.specialist === 'Fotografer' ? ['photographer' as const] : row.brief.specialist === 'Keduanya' ? ['photographer' as const, 'videographer' as const] : ['videographer' as const] };
  return { ...current, jobs: [...current.jobs, job] };
}
