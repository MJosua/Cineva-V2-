import { useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HotsForm } from '../cineva-shared/HotsForm';
import { money } from '../cineva-shared/model';
import { engagementRate, financeDate } from '../cineva-campaigns/finance';
import type { DemoData } from './model';

interface Props { data: DemoData; onChange: (update: (data: DemoData) => DemoData) => void }
const rupiah = (value: unknown) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Nominal harus rupiah bulat non-negatif.');
  return number;
};
const metrics = ['likes', 'comments', 'shares', 'saves', 'reposts', 'views'] as const;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <Card><CardContent className="space-y-4 p-5"><h2 className="text-xl font-semibold">{title}</h2>{children}</CardContent></Card>;
}
function ErrorMessage({ error }: { error: string }) { return error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null; }
function useAction() {
  const [error, setError] = useState('');
  return { error, run(action: () => void) { setError(''); try { action(); } catch (failure) { setError((failure as Error).message); } } };
}

export function ProfilePanel({ data, onChange }: Props) {
  const { error, run } = useAction();
  return <Panel title="Profil Creator"><p className="text-sm text-muted-foreground">Followers adalah jumlah pengikut Instagram; niche adalah kategori konten.</p>
    <div className="flex flex-wrap gap-2">{data.user.niches.map(niche => <Badge key={niche} variant="secondary">{niche}</Badge>)}</div><ErrorMessage error={error}/>
    <HotsForm key={data.user.id} schema={{ title: 'Profil', fields: [
      { name: 'name', label: 'Nama Creator', type: 'text', required: true }, { name: 'instagram', label: 'Instagram', type: 'text', required: true },
      { name: 'followers', label: 'Jumlah followers Instagram', type: 'number', minnumber: 0 }, { name: 'niches', label: 'Niche (pisahkan dengan koma)', type: 'text' },
      { name: 'phone', label: 'Nomor kontak', type: 'text' }, { name: 'address', label: 'Alamat', type: 'textarea' },
    ] }} initialValues={{ ...data.user, followers: data.user.followers ?? '', niches: data.user.niches.join(', ') }} submitLabel="Simpan profil" onSubmit={values => run(() => {
      const followers = String(values.followers ?? '').trim() === '' ? null : rupiah(values.followers);
      onChange(current => ({ ...current, user: { ...current.user, name: String(values.name).trim(), instagram: String(values.instagram).trim(), followers,
        niches: [...new Set(String(values.niches ?? '').split(',').map(value => value.trim()).filter(Boolean))], phone: String(values.phone ?? ''), address: String(values.address ?? '') } }));
    })}/>
  </Panel>;
}

export function CampaignPanel({ data, onChange }: Props) {
  const { error, run } = useAction();
  return <Panel title="Campaign dan brief"><Badge variant="secondary">{data.campaign.brand}</Badge><p className="text-sm text-muted-foreground">Fee cash, benefit barter dan harga retail produk adalah tiga nilai berbeda. Perubahan hanya berlaku pada demo ini.</p>
    {data.notes.length > 0 && <aside className="space-y-2 rounded-md border border-border p-3"><h3 className="font-semibold">Catatan dan konflik sumber</h3>{data.notes.map((note, index) => <p key={index} className="whitespace-pre-wrap break-words text-sm">{note}</p>)}</aside>}<ErrorMessage error={error}/>
    <HotsForm key={data.campaign.id} schema={{ title: 'Campaign', fields: [
      { name: 'title', label: 'Nama campaign', type: 'text', required: true }, { name: 'brand', label: 'Brand', type: 'text', required: true },
      { name: 'brief', label: 'Brief campaign', type: 'textarea' }, { name: 'objective', label: 'Objective', type: 'textarea' },
      { name: 'audience', label: 'Target audience', type: 'textarea' }, { name: 'messaging', label: 'Key messaging', type: 'textarea' },
      { name: 'sow', label: 'SOW dan deliverable', type: 'textarea' }, { name: 'overviewPeriod', label: 'Periode sumber (teks)', type: 'text' },
      { name: 'selectedProduct', label: 'Produk / SKU dipilih', type: 'text' },
      { name: 'feeAmount', label: 'Fee cash Creator (Rp)', type: 'number', minnumber: 0, required: true },
      { name: 'barterValue', label: 'Benefit barter (Rp)', type: 'number', minnumber: 0, required: true },
      { name: 'productRetailValue', label: 'Harga retail produk (Rp)', type: 'number', minnumber: 0, required: true },
    ] }} initialValues={{ ...data.campaign }} submitLabel="Simpan campaign" onSubmit={values => run(() => {
      const feeAmount = rupiah(values.feeAmount), barterValue = rupiah(values.barterValue), productRetailValue = rupiah(values.productRetailValue);
      onChange(current => ({ ...current, campaign: { ...current.campaign, title: String(values.title), brand: String(values.brand), brief: String(values.brief ?? ''),
        objective: String(values.objective ?? ''), audience: String(values.audience ?? ''), messaging: String(values.messaging ?? ''), sow: String(values.sow ?? ''),
        overviewPeriod: String(values.overviewPeriod ?? ''), selectedProduct: String(values.selectedProduct ?? ''), feeAmount, barterValue, productRetailValue } }));
    })}/>
  </Panel>;
}

export function PaymentsPanel({ data, onChange }: Props) {
  const { error, run } = useAction(), [paymentId, setPaymentId] = useState(() => crypto.randomUUID());
  const simulated = data.payments.reduce((sum, item) => sum + item.amount, 0), knownPaid = data.campaign.paidAmount;
  return <Panel title="Pembayaran"><dl className="grid gap-3 sm:grid-cols-2">
    <div><dt>Fee cash</dt><dd className="font-semibold">{money(data.campaign.feeAmount)}</dd></div>
    <div><dt>Status sumber</dt><dd>{data.campaign.paymentStatus || 'Kosong di Excel'}</dd></div>
    <div><dt>Nominal dibayar menurut sumber</dt><dd>{knownPaid === null ? 'Belum tercatat' : money(knownPaid)}</dd></div>
    <div><dt>Pembayaran simulasi tercatat</dt><dd>{money(simulated)}</dd></div>
  </dl><p className="text-sm text-muted-foreground">Diajukan belum berarti dibayar. Ledger di bawah adalah simulasi; tidak mengubah status, nominal atau bukti pada Excel sumber.</p><ErrorMessage error={error}/>
    <HotsForm key={paymentId} schema={{ title: 'Payout simulasi', fields: [
      { name: 'amount', label: 'Nominal pembayaran (Rp)', type: 'number', minnumber: 1, required: true },
      { name: 'paidAt', label: 'Tanggal pembayaran', type: 'date', required: true }, { name: 'evidence', label: 'Referensi bukti pembayaran', type: 'text', required: true },
    ] }} initialValues={{ amount: '', paidAt: today(), evidence: '' }} submitLabel="Catat pembayaran simulasi" onSubmit={values => run(() => {
      const amount = rupiah(values.amount), paidAt = String(values.paidAt), evidence = String(values.evidence).trim();
      if (amount <= 0 || !financeDate(paidAt) || !evidence) throw new Error('Isi nominal positif, tanggal valid dan referensi bukti.');
      onChange(current => {
        const payment = { id: paymentId, amount, paidAt, evidence }, existing = current.payments.find(item => item.id === paymentId);
        if (existing) { if (JSON.stringify(existing) !== JSON.stringify(payment)) throw new Error('Pembayaran sudah tersimpan. Pilih Pembayaran baru.'); return current; }
        const total = current.payments.reduce((sum, item) => sum + item.amount, 0) + (current.campaign.paidAmount ?? 0) + amount;
        if (!Number.isSafeInteger(total) || total > current.campaign.feeAmount) throw new Error('Nominal melebihi sisa fee cash.');
        return { ...current, payments: [...current.payments, payment] };
      });
    })}/><Button variant="outline" onClick={() => setPaymentId(crypto.randomUUID())}>Pembayaran baru</Button>
    <div className="space-y-2">{data.payments.map(payment => <p key={payment.id} className="break-words text-sm">{payment.paidAt} · {money(payment.amount)} · {payment.evidence}</p>)}</div>
  </Panel>;
}

export function InsightsPanel({ data, onChange }: Props) {
  const { error, run } = useAction(), rate = engagementRate(data.insights);
  return <Panel title="Insight publikasi"><p className="text-lg font-semibold">ER berdasarkan views: {rate === null ? 'Belum tersedia' : `${rate.toFixed(2)}%`}</p>
    <p className="text-sm text-muted-foreground">(Likes + Comments + Shares + Saves + Reposts) ÷ Views × 100. Views kosong/0 atau metrik belum lengkap tidak dianggap nol engagement.</p>
    <p className="text-sm">Kategori dari sumber: <strong>{data.insights.sourceCategory || 'Kosong di Excel'}</strong>. Kategori tidak dihitung otomatis.</p><ErrorMessage error={error}/>
    <HotsForm schema={{ title: 'Insight', fields: metrics.map(name => ({ name, label: name[0].toUpperCase() + name.slice(1), type: 'number', minnumber: 0 })) }} initialValues={Object.fromEntries(metrics.map(name => [name, data.insights[name] ?? '']))} submitLabel="Simpan insight" onSubmit={values => run(() => {
      const next = Object.fromEntries(metrics.map(name => [name, String(values[name] ?? '').trim() === '' ? null : rupiah(values[name])])) as Pick<DemoData['insights'], typeof metrics[number]>;
      onChange(current => ({ ...current, insights: { ...current.insights, ...next } }));
    })}/>
  </Panel>;
}

function safeLink(value: string) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function DeliverablesPanel({ data, onChange }: Props) {
  return <Panel title="Deliverable dan progress"><p className="text-sm text-muted-foreground">Status dan URL adalah field terpisah. Link hanya dibuka setelah diklik; teks DONE bukan URL.</p>
    {data.deliverables.map(item => <Card key={item.id}><CardContent className="space-y-3 p-4"><Badge variant="secondary">{item.platform}</Badge>
      <p className="whitespace-pre-wrap break-all text-sm">Sumber: {item.sourceUrl || 'Kosong di Excel'}</p>
      {safeLink(item.sourceUrl) && <a className="text-sm underline" href={safeLink(item.sourceUrl)!} target="_blank" rel="noopener noreferrer">Buka link {item.title}</a>}
      <HotsForm key={item.id} schema={{ title: 'Deliverable', fields: [
        { name: 'title', label: 'Judul deliverable', type: 'text', required: true }, { name: 'platform', label: 'Platform', type: 'text', required: true },
        { name: 'status', label: 'Status deliverable', type: 'text' }, { name: 'sourceUrl', label: 'URL / teks referensi', type: 'text' },
      ] }} initialValues={{ ...item }} submitLabel="Simpan deliverable" onSubmit={values => onChange(current => ({ ...current, deliverables: current.deliverables.map(row => row.id === item.id ? { ...row,
        title: String(values.title), platform: String(values.platform), status: String(values.status ?? ''), sourceUrl: String(values.sourceUrl ?? '') } : row) }))}/>
    </CardContent></Card>)}
  </Panel>;
}

export function DashboardPanel({ data }: Props) {
  const rate = engagementRate(data.insights), simulated = data.payments.reduce((sum, item) => sum + item.amount, 0);
  return <Panel title={`Halo, ${data.user.name}`}><p>{data.campaign.title} · {data.campaign.brand}</p><div className="flex flex-wrap gap-2">{data.user.niches.map(niche => <Badge key={niche} variant="secondary">{niche}</Badge>)}</div>
    <dl className="grid gap-4 sm:grid-cols-2"><div><dt>Fee cash</dt><dd className="text-2xl font-semibold">{money(data.campaign.feeAmount)}</dd></div>
      <div><dt>Benefit barter</dt><dd className="text-2xl font-semibold">{money(data.campaign.barterValue)}</dd></div>
      <div><dt>Pembayaran simulasi</dt><dd>{money(simulated)}</dd></div><div><dt>ER views</dt><dd>{rate === null ? 'Belum tersedia' : `${rate.toFixed(2)}%`}</dd></div>
      <div><dt>Followers Instagram</dt><dd>{data.user.followers === null ? 'Jumlah belum tercatat' : data.user.followers.toLocaleString('id-ID')}</dd></div><div><dt>Deliverable</dt><dd>{data.deliverables.length} output</dd></div>
    </dl><p className="text-sm text-muted-foreground">Sumber: {data.source.file} · {data.source.sheet} · roster {data.source.rosterRow} · insight {data.source.insightRow}. Perubahan demo tidak menulis Excel atau database.</p>
  </Panel>;
}
