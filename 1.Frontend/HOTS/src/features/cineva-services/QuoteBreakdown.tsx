import { money } from '../cineva-shared/model';
import type { Quote } from './pricing';
export function QuoteBreakdown({ quote, label = 'Total penawaran', testId = 'service-quote' }: { quote: Quote; label?: string; testId?: string | false }) {
  return <div className="space-y-2 rounded-md border border-border p-4" data-testid={testId || undefined}>
    <p className="text-sm text-muted-foreground">Snapshot tarif {quote.rateVersion} · revisi {quote.revision} · simulasi, bukan harga resmi</p>
    {quote.items.map(item => <p key={item.label} className="flex flex-wrap justify-between gap-2"><span>{item.label} ({item.quantity} × {money(item.rate)})</span><span>{money(item.subtotal)}</span></p>)}
    <p className="font-semibold">{label}: {money(quote.total)}</p>
  </div>;
}
