import type { Actor, Inquiry } from './domain';
import { estimate, type Quote, type RateCard } from '../cineva-services/pricing';

export interface QuoteChangeRequest { revision: number; owner: string; reason: string }
export type NegotiatedInquiry = Omit<Inquiry, 'status'> & {
  status: Inquiry['status'] | 'changes_requested';
  quoteHistory?: Quote[];
  quoteChangeRequests?: QuoteChangeRequest[];
  acceptedQuoteRevision?: number;
};
const copy = (quote: Quote): Quote => ({ ...quote, ...(quote.scope ? { scope: { ...quote.scope } } : {}), items: quote.items.map(item => ({ ...item })) });

/** Never retain mutable item references when capturing a quote version. */
export function snapshotQuoteHistory(row: NegotiatedInquiry): Quote[] {
  const history = (row.quoteHistory ?? []).map(copy);
  const saved = history.find(quote => quote.revision === row.quote.revision);
  if (saved && JSON.stringify(saved) !== JSON.stringify(row.quote)) throw new Error('Snapshot penawaran tidak boleh berubah.');
  if (!saved) history.push(copy(row.quote));
  return history;
}
export function requestQuoteChanges(row: NegotiatedInquiry, actor: Actor, reason: string, revision: number): NegotiatedInquiry {
  if (row.owner !== actor.id || row.status !== 'quoted') throw new Error('Hanya pemilik dapat meminta perubahan penawaran aktif.');
  if (revision !== row.quote.revision) throw new Error('Penawaran telah berubah. Baca revisi terbaru.');
  const text = reason.trim();
  if (!text || text.length > 2000) throw new Error('Jelaskan perubahan yang diminta (maksimal 2.000 karakter).');
  return { ...row, status: 'changes_requested', quoteHistory: snapshotQuoteHistory(row),
    quoteChangeRequests: [...(row.quoteChangeRequests ?? []), { revision, owner: actor.id, reason: text }] };
}
export function reviseQuote(row: NegotiatedInquiry, actor: Actor, rates: RateCard, scope = row.quote.scope ?? { days: Number(row.brief.days), crew: Number(row.brief.crew), gear: Number(row.brief.gear) }): NegotiatedInquiry {
  if (actor.product !== 'hq' || actor.id !== row.destination || !['reviewing', 'changes_requested'].includes(row.status))
    throw new Error('Hanya HQ tujuan dapat merevisi penawaran yang sedang direview.');
  if (row.acceptedQuoteRevision !== undefined) throw new Error('Penawaran yang disetujui terkunci.');
  const quote = estimate(row.type, scope.days, scope.crew, scope.gear, rates, row.quote.revision + 1);
  return { ...row, status: 'reviewing', quoteHistory: snapshotQuoteHistory(row), quote };
}
export function acceptQuoteRevision(row: NegotiatedInquiry, actor: Actor, revision: number): NegotiatedInquiry {
  if (row.owner !== actor.id || row.status !== 'quoted') throw new Error('Pemilik permintaan yang menyetujui quote.');
  if (revision !== row.quote.revision) throw new Error('Penawaran telah berubah. Baca revisi terbaru sebelum menyetujui.');
  return { ...row, status: 'accepted', quoteHistory: snapshotQuoteHistory(row), acceptedQuoteRevision: revision };
}
/** Legacy accepted inquiries without metadata retain their original quote contract. */
export function acceptedQuoteSnapshot(row: NegotiatedInquiry): Quote {
  if (row.status !== 'accepted') throw new Error('Quote harus disetujui sebelum menjadi project.');
  const revision = row.acceptedQuoteRevision ?? row.quote.revision;
  const accepted = row.quoteHistory?.find(quote => quote.revision === revision);
  if (revision !== row.quote.revision || (row.acceptedQuoteRevision !== undefined && !accepted))
    throw new Error('Revisi penawaran yang disetujui tidak konsisten.');
  if (accepted && JSON.stringify(accepted) !== JSON.stringify(row.quote)) throw new Error('Penawaran yang disetujui tidak boleh berubah.');
  return copy(accepted ?? row.quote);
}
