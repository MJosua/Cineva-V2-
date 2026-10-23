import { Wallet, CheckCircle2, Clock, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { financials, money, type Job } from './model';
export function SummaryCards({ jobs }: {
    jobs: Job[];
}) {
    const totals = financials(jobs);
    const cards = [{ label: 'Fee disepakati', value: totals.fee, icon: Wallet, note: 'Cash seluruh job, termasuk arsip' }, { label: 'Sudah diterima', value: totals.paid, icon: CheckCircle2, note: 'Pembayaran cash tercatat' }, { label: 'Belum dibayar', value: totals.unpaid, icon: Clock, note: 'Sisa fee cash, tanpa barter' }, { label: 'Nilai barter', value: totals.barter, icon: Gift, note: 'Terpisah dari pendapatan cash' }];
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="financial-summary" data-cineva-surface="summary">{cards.map(card => <Card key={card.label}><CardContent className="p-5"><div className="flex items-center justify-between gap-3 text-muted-foreground"><p className="text-sm">{card.label}</p><card.icon className="h-4 w-4"/></div><p className="mt-3 break-words text-2xl font-semibold tracking-tight" data-testid={card.label}>{money(card.value)}</p><p className="mt-2 text-xs text-muted-foreground">{card.note}</p></CardContent></Card>)}</div>;
}
