import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { QuoteBreakdown } from '../cineva-services/QuoteBreakdown';
import type { RateCard } from '../cineva-services/pricing';
import type { Actor } from './domain';
import { acceptQuoteRevision, requestQuoteChanges, reviseQuote, type NegotiatedInquiry } from './quotes';

export function QuoteNegotiation({ row, actor, rates, apply }: {
  row: NegotiatedInquiry; actor: Actor; rates: RateCard;
  apply: (change: (current: NegotiatedInquiry) => NegotiatedInquiry) => void;
}) {
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState(() => row.quote.scope ?? { days: Number(row.brief.days), crew: Number(row.brief.crew), gear: Number(row.brief.gear) });
  const owner = actor.id === row.owner, hq = actor.product === 'hq' && actor.id === row.destination;
  const revision = row.quote.revision;
  return <section className="space-y-3" aria-label="Negosiasi penawaran" data-testid="quote-negotiation">
    <QuoteBreakdown quote={row.quote} label={['submitted', 'reviewing'].includes(row.status) ? 'Estimasi / draft penawaran' : 'Total penawaran'}/>
    <p className="text-sm text-muted-foreground">Rincian biaya simulasi. Jadwal dan resource dikonfirmasi terpisah; persetujuan penawaran belum merupakan booking.</p>
    {row.acceptedQuoteRevision !== undefined && <p role="status" className="font-medium">Disetujui: revisi {row.acceptedQuoteRevision}. Nominal terkunci untuk project.</p>}
    {row.quoteChangeRequests?.length ? <div className="space-y-2 rounded-md border border-border p-3">
      <h3 className="font-semibold">Permintaan perubahan</h3>
      {row.quoteChangeRequests.map((request, index) => <p key={`${request.revision}-${index}`} className="whitespace-pre-wrap break-words text-sm">Revisi {request.revision} · {request.owner}: {request.reason}</p>)}
    </div> : null}
    {owner && row.status === 'quoted' && <div className="space-y-2">
      <label htmlFor={`quote-change-${row.id}`} className="text-sm font-medium">Perubahan yang diinginkan</label>
      <Textarea id={`quote-change-${row.id}`} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Contoh: sesuaikan jumlah hari atau biaya gear."/>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!reason.trim()} onClick={() => apply(current => requestQuoteChanges(current, actor, reason, revision))}>Minta perubahan</Button>
        <Button onClick={() => apply(current => acceptQuoteRevision(current, actor, revision))}>Setujui penawaran</Button>
      </div>
      <p className="text-sm text-muted-foreground">Persetujuan berlaku khusus untuk revisi {revision} yang sedang ditampilkan.</p>
    </div>}
    {hq && ['reviewing', 'changes_requested'].includes(row.status) && <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-3">{(['days', 'crew', 'gear'] as const).map(key => <label key={key} className="space-y-1 text-sm">{key === 'days' ? 'Hari penawaran' : key === 'crew' ? 'Crew penawaran' : 'Gear penawaran'}<Input aria-label={key === 'days' ? 'Hari penawaran' : key === 'crew' ? 'Crew penawaran' : 'Gear penawaran'} type="number" min={key === 'gear' ? 0 : 1} max={key === 'days' ? 365 : 100} value={scope[key]} onChange={event => { const count = Number(event.target.value); setScope(value => ({ ...value, [key]: count })); }}/></label>)}</div><Button variant="outline" onClick={() => apply(current => reviseQuote(current, actor, rates, scope))}>Revisi dengan tarif terbaru</Button><p className="text-xs text-muted-foreground">Jumlah yang direvisi berlaku pada penawaran; brief permintaan awal tetap tersimpan.</p></div>}
    {!!row.quoteHistory?.length && <details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Riwayat versi penawaran</summary>
      <div className="mt-3 space-y-3">{row.quoteHistory.map(quote => <QuoteBreakdown key={quote.revision} quote={quote} testId={false} label={`Snapshot revisi ${quote.revision}`}/>)}</div>
    </details>}
  </section>;
}
