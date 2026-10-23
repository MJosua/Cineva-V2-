import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Actor } from '../cineva-inquiries/domain';
import { money } from '../cineva-shared/model';
import type { CampaignDeliverable, TalentAssignment } from './model';
import { getDeliveryExecution } from './execution';
import { configureFinance, engagementRate, insightReminder, metricNames, payoutStatus, processPayout,
  readFinance, recordInsight, recordPayout, requestPayout, totalPaid, type InsightMetrics } from './finance';

type Change = (update: (latest: TalentAssignment) => TalentAssignment) => void;
const todayWIB = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
const statusLabels = { not_requested: 'Belum diajukan', requested: 'Diajukan — belum dibayar', processing: 'Diproses — belum dibayar', partial: 'Dibayar sebagian', paid: 'Lunas' };
const metricLabels = { likes: 'Likes', comments: 'Comments', shares: 'Shares', saves: 'Saves', reposts: 'Reposts', views: 'Views' };

export function FinancePanel({ assignment, actor, onChange }: { assignment: TalentAssignment; actor: Actor; onChange: Change }) {
  const finance = readFinance(assignment), hq = actor.product === 'hq';
  const [amounts, setAmounts] = useState(() => ({ feeAmount: finance.feeAmount, marketingAmount: finance.marketingAmount, productBenefitAmount: finance.productBenefitAmount }));
  const [payment, setPayment] = useState(() => ({ id: crypto.randomUUID(), amount: 0, paidAt: todayWIB(), evidence: '' }));
  return <section className="space-y-4 rounded-md border border-border bg-card p-4" data-testid="campaign-finance">
    <h3 className="font-semibold">Keuangan talent dan insight</h3>
    <p className="text-sm text-muted-foreground">Simulasi. Fee Creator terpisah dari penawaran client, biaya marketing dan benefit produk non-cash.</p>
    <dl className="grid gap-2 sm:grid-cols-3">
      <div><dt>Fee cash Creator</dt><dd>{money(finance.feeAmount)}</dd></div>
      {hq && <div><dt>Biaya marketing internal</dt><dd>{money(finance.marketingAmount)}</dd></div>}
      <div><dt>Benefit produk non-cash</dt><dd>{money(finance.productBenefitAmount)}</dd></div>
      <div><dt>Cash sudah dibayar</dt><dd>{money(totalPaid(finance))}</dd></div>
      <div><dt>Sisa payout</dt><dd>{money(finance.feeAmount - totalPaid(finance))}</dd></div>
      <div><dt>Status payout</dt><dd data-testid="campaign-payout-status">{statusLabels[payoutStatus(finance)]}</dd></div>
    </dl>
    {hq && <div className="space-y-3 rounded-md border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-3">{(['feeAmount', 'marketingAmount', 'productBenefitAmount'] as const).map(key => <label key={key} className="space-y-1 text-sm">{key === 'feeAmount' ? 'Fee cash Creator (Rp)' : key === 'marketingAmount' ? 'Marketing (Rp)' : 'Benefit non-cash (Rp)'}<Input type="number" min="0" step="1" aria-label={key} value={amounts[key]} onChange={event => { const value = Number(event.target.value); setAmounts(current => ({ ...current, [key]: value })); }}/></label>)}</div>
      <Button variant="outline" onClick={() => onChange(latest => configureFinance(latest, actor, amounts))}>Simpan nominal talent</Button>
    </div>}
    {actor.product === 'creator' && actor.id === assignment.creatorId && !finance.requested && finance.feeAmount > totalPaid(finance) && <Button onClick={() => onChange(latest => requestPayout(latest, actor, `request-${assignment.id}`))}>Ajukan payout</Button>}
    {hq && finance.requested && payoutStatus(finance) !== 'paid' && <div className="space-y-3 rounded-md border border-border p-3">
      <Button variant="outline" onClick={() => onChange(latest => processPayout(latest, actor))}>Tandai payout diproses</Button>
      <p className="text-sm text-muted-foreground">Diajukan/diproses tidak menambah cash dibayar. Catat nominal, tanggal dan referensi bukti secara eksplisit.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">Nominal payout (Rp)<Input aria-label="Nominal payout" type="number" min="1" step="1" value={payment.amount} onChange={event => setPayment(value => ({ ...value, amount: Number(event.target.value) }))}/></label>
        <label className="text-sm">Tanggal payout<Input aria-label="Tanggal payout" type="date" value={payment.paidAt} onChange={event => setPayment(value => ({ ...value, paidAt: event.target.value }))}/></label>
        <label className="text-sm">Referensi bukti payout<Input aria-label="Bukti payout" value={payment.evidence} onChange={event => setPayment(value => ({ ...value, evidence: event.target.value }))} placeholder="Referensi bukti dummy; bukan upload"/></label>
      </div>
      <div className="flex flex-wrap gap-2"><Button onClick={() => onChange(latest => recordPayout(latest, actor, payment))}>Catat payout</Button><Button variant="outline" onClick={() => setPayment({ id: crypto.randomUUID(), amount: 0, paidAt: todayWIB(), evidence: '' })}>Pembayaran baru</Button></div>
    </div>}
    {finance.payments.length > 0 && <div className="space-y-2"><h4 className="font-medium">Riwayat cash payout</h4>{finance.payments.map(item => <p key={item.id} className="break-words text-sm">{item.paidAt} · {money(item.amount)} · Bukti: {item.evidence}</p>)}</div>}
    <h4 className="font-medium">Insight per deliverable</h4>
    {assignment.deliverables.filter(item => item.postingRequired).map(deliverable => <InsightEntry key={deliverable.id} assignment={assignment} deliverable={deliverable} actor={actor} onChange={onChange}/>)}
    {!assignment.deliverables.some(item => item.postingRequired) && <p className="text-sm text-muted-foreground">Output brand tanpa posting tidak mempunyai insight publikasi.</p>}
  </section>;
}

function InsightEntry({ assignment, deliverable, actor, onChange }: { assignment: TalentAssignment; deliverable: CampaignDeliverable; actor: Actor; onChange: Change }) {
  const [snapshotId, setSnapshotId] = useState(() => crypto.randomUUID());
  const [capturedAt, setCapturedAt] = useState(todayWIB);
  const [values, setValues] = useState<Record<typeof metricNames[number], string>>({ likes: '', comments: '', shares: '', saves: '', reposts: '', views: '' });
  const postedAt = getDeliveryExecution(assignment, deliverable.id).posting?.postedAt;
  const finance = readFinance(assignment), snapshots = finance.insights.filter(item => item.deliverableId === deliverable.id);
  const reminder = insightReminder(postedAt, todayWIB(), snapshots, deliverable.id);
  const metrics = Object.fromEntries(metricNames.map(key => [key, values[key].trim() === '' ? null : Number(values[key])])) as InsightMetrics;
  const er = engagementRate(metrics);
  return <div className="space-y-3 rounded-md border border-border p-3" data-testid="campaign-insight">
    <p className="font-medium">{deliverable.title} · {deliverable.platform}</p>
    <p className="text-sm">{postedAt ? `Posting ${postedAt} · Insight H+7: ${reminder.dueAt}${reminder.due ? ' — perlu diambil' : ''}` : 'Belum diposting — insight belum dapat dicatat.'}</p>
    {postedAt && <>
      <label className="block text-sm">Tanggal pengambilan insight<Input aria-label={`Tanggal insight ${deliverable.title}`} type="date" value={capturedAt} onChange={event => setCapturedAt(event.target.value)}/></label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{metricNames.map(key => <label key={key} className="text-sm">{metricLabels[key]}<Input aria-label={`${metricLabels[key]} ${deliverable.title}`} type="number" min="0" step="1" value={values[key]} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} placeholder="Belum tersedia"/></label>)}</div>
      <p className="text-sm">ER berdasarkan views: {er === null ? 'Belum tersedia' : `${er.toFixed(2)}%`}</p>
      <div className="flex flex-wrap gap-2"><Button onClick={() => onChange(latest => recordInsight(latest, actor, { id: snapshotId, deliverableId: deliverable.id, capturedAt, metrics }))}>Simpan snapshot insight</Button><Button variant="outline" onClick={() => { setSnapshotId(crypto.randomUUID()); setCapturedAt(todayWIB()); }}>Snapshot baru</Button></div>
    </>}
    {snapshots.map(item => { const rate = engagementRate(item.metrics); return <div key={item.id} className="space-y-1 border-t border-border pt-2 text-sm"><p>{item.capturedAt} · ER views: {rate === null ? 'Belum tersedia' : `${rate.toFixed(2)}%`}</p><p>{metricNames.map(key => `${metricLabels[key]}: ${item.metrics[key] ?? 'Belum tersedia'}`).join(' · ')}</p></div>; })}
    <p className="text-xs text-muted-foreground">ER = (Likes + Comments + Shares + Saves + Reposts) / Views × 100. Snapshot historis tidak ditimpa; kategori performa belum ditentukan.</p>
  </div>;
}
