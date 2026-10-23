import type { DemoData } from './model';
import { nonNegativeInteger as integer, calendarDate, validateCash, validateDocumentRelations } from './domainAdapter';
export function validDate(value: string) {
  return calendarDate(value);
}
/** Document fixture validation, deliberately no SQL or physical schema assumptions. */
export function validateData(value: unknown): asserts value is DemoData {
  if (!value || typeof value !== 'object') throw new Error('Dokumen JSON tidak valid.');
  const data = value as DemoData;
  if (data.version !== 1 || !data.datasetId || !data.user?.id || !data.user.name?.trim() || !data.campaign?.id || !data.campaign.title?.trim()) throw new Error('Versi, user dan campaign wajib valid.');
  if (![data.user.instagram, data.user.phone, data.user.address, data.campaign.brand, data.campaign.brief, data.campaign.objective, data.campaign.audience, data.campaign.messaging, data.campaign.sow, data.campaign.overviewPeriod, data.campaign.paymentStatus, data.campaign.selectedProduct].every(item => typeof item === 'string')) throw new Error('Field profil/campaign harus teks.');
  if (data.user.followers !== null && !integer(data.user.followers)) throw new Error('Jumlah followers harus angka bulat non-negatif.');
  if (!Array.isArray(data.user.niches) || data.user.niches.some(item => typeof item !== 'string')) throw new Error('Niche harus daftar teks.');
  if (![data.campaign.feeAmount, data.campaign.barterValue, data.campaign.productRetailValue].every(integer) || data.campaign.paidAmount !== null && !integer(data.campaign.paidAmount)) throw new Error('Nominal harus rupiah bulat non-negatif.');
  if (![data.events, data.payments, data.deliverables, data.notes, data.rawSource].every(Array.isArray) || !data.insights || !data.source?.file || !data.collections) throw new Error('Koleksi dokumen belum lengkap.');
  const unique = (rows: { id: string }[]) => rows.every(row => typeof row.id === 'string' && row.id.trim()) && new Set(rows.map(row => row.id)).size === rows.length;
  for (const rows of [data.events, data.payments, data.deliverables, data.collections.workspaces, data.collections.brands, data.collections.batches, data.collections.tickets, data.collections.assignments]) if (!Array.isArray(rows) || !unique(rows)) throw new Error('ID setiap koleksi wajib unik.');
  for (const event of data.events) {
    if (!event.title?.trim() || !['visit', 'milestone'].includes(event.kind) || event.allDay !== true || typeof event.requiresReview !== 'boolean' || typeof event.note !== 'string' || typeof event.rawDate !== 'string' || typeof event.sourceCell !== 'string') throw new Error('Jadwal tidak valid.');
    if (event.startDate !== null && !validDate(event.startDate) || event.endDate !== null && !validDate(event.endDate) || event.endDate && (!event.startDate || event.endDate < event.startDate)) throw new Error('Tanggal atau rentang jadwal tidak valid.');
    if (!event.startDate && !event.requiresReview) throw new Error('Jadwal tanpa tanggal harus ditandai perlu review.');
  }
  for (const payment of data.payments) if (!integer(payment.amount) || payment.amount <= 0 || !validDate(payment.paidAt) || !payment.evidence?.trim()) throw new Error('Pembayaran simulasi memerlukan nominal, tanggal dan bukti.');
  validateCash(data);
  for (const key of ['likes', 'comments', 'shares', 'saves', 'reposts', 'views'] as const) if (data.insights[key] !== null && !integer(data.insights[key])) throw new Error('Metrik harus angka bulat non-negatif atau null.');
  for (const output of data.deliverables) if (![output.title, output.platform, output.sourceUrl, output.status].every(item => typeof item === 'string') || !output.title.trim()) throw new Error('Deliverable tidak valid.');
  if (typeof data.insights.sourceCategory !== 'string' || data.notes.some(note => typeof note !== 'string')) throw new Error('Catatan dan kategori sumber harus teks.');
  const collections = data.collections;
  if (validateDocumentRelations(data).length) throw new Error('Relasi assignment/ticket/campaign/batch tidak valid.');
  for (const ticket of collections.tickets) if (ticket.module !== 'hots:cineva' || !Array.isArray(ticket.fields) || ticket.fields.some(field => !field.cstm_col || !field.lbl_col || !['string', 'number'].includes(typeof field.value) && field.value !== null)) throw new Error('Kontrak EAV ticket wajib cstm_col, lbl_col, value.');
}
export function syncTicketFields(data: DemoData): DemoData {
  const next = structuredClone(data);
  const values: Record<string, string | number | null> = { campaign_id: next.campaign.id, fee_amount: next.campaign.feeAmount, paid_amount: next.campaign.paidAmount === null && !next.payments.length ? null : (next.campaign.paidAmount ?? 0) + next.payments.reduce((sum, row) => sum + row.amount, 0), payment_status: next.campaign.paymentStatus };
  next.collections.workspaces = next.collections.workspaces.map(workspace => workspace.id === next.user.id ? { ...workspace, name: next.user.name } : workspace);
  next.collections.tickets = next.collections.tickets.map(ticket => ({ ...ticket, fields: ticket.fields.map(field => Object.prototype.hasOwnProperty.call(values, field.cstm_col) ? { ...field, value: values[field.cstm_col] } : field) }));
  return next;
}
