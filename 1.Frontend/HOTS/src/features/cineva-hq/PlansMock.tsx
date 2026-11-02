import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Mock visual pembagian Basic dan Pro untuk CAPEXA dan CIN-PACT, agar client dapat berkomentar (jawaban N12: "divisualisasikan dulu").
 * Harga dari client (E2). Pembagian fitur adalah USULAN tim dan belum disetujui. Tanpa penagihan, trial, referral atau akses nyata;
 * penagihan dilakukan tim Cineva di luar aplikasi (E4). Memakai gaya Cineva yang berjalan; tidak mengubah tema.
 */
type Tier = 'basic' | 'pro';
interface Plan { name: string; tagline: string; price: Record<Tier, number>; features: { label: string; tier: Tier }[] }
export const plans: Plan[] = [
  { name: 'CAPEXA', tagline: 'Alat hitung estimasi production dan budget', price: { basic: 50000, pro: 150000 }, features: [
    { label: 'Perhitungan budget dasar', tier: 'basic' }, { label: 'Template estimasi', tier: 'basic' },
    { label: 'Banyak format estimasi', tier: 'pro' }, { label: 'Versi revisi', tier: 'pro' }, { label: 'Lampiran RAB (tampil saja, tanpa unduh)', tier: 'pro' }, { label: 'Perbandingan antar versi', tier: 'pro' }] },
  { name: 'CIN-PACT', tagline: 'Alat pengerjaan dari estimasi budget yang disepakati', price: { basic: 20000, pro: 50000 }, features: [
    { label: 'Cari dan filter Creator', tier: 'basic' }, { label: 'Tier dan grade Creator', tier: 'basic' }, { label: 'Profil ringkas', tier: 'basic' },
    { label: 'Assessment 10 post (mean, median, kewajaran angka)', tier: 'pro' }, { label: 'Sinkron akun otomatis', tier: 'pro' }, { label: 'Riwayat performa', tier: 'pro' }, { label: 'Unduh berwatermark dengan approval Tim', tier: 'pro' }] },
];
const rupiah = (value: number) => `Rp${value.toLocaleString('id-ID')}`;

export function PlansMock() {
  const [view, setView] = useState<Tier>('basic');
  return <section className="space-y-4" data-testid="plans-mock" aria-label="Paket Basic dan Pro">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Paket Basic dan Pro</h2>
        <p className="text-sm text-muted-foreground">Mock untuk dikomentari client. Pembagian fitur adalah usulan tim dan belum disetujui; harga per bulan dari client.</p></div>
      <div className="flex gap-2" role="group" aria-label="Lihat sebagai">
        {(['basic', 'pro'] as const).map(tier => <Button key={tier} variant={view === tier ? 'default' : 'outline'} aria-pressed={view === tier} onClick={() => setView(tier)}>Lihat sebagai {tier === 'basic' ? 'Basic' : 'Pro'}</Button>)}
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">{plans.map(plan => <Card key={plan.name} data-testid={`plan-${plan.name.toLowerCase()}`}>
      <CardHeader><CardTitle>{plan.name}</CardTitle><p className="text-sm text-muted-foreground">{plan.tagline}</p></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {(['basic', 'pro'] as const).map(tier => <div key={tier} className={`rounded-md border p-3 ${view === tier ? 'border-primary' : 'border-border'}`}>
            <p className="font-semibold">{tier === 'basic' ? 'Basic' : 'Profesional'}</p><p className="text-lg">{rupiah(plan.price[tier])}<span className="text-xs text-muted-foreground"> / bulan</span></p></div>)}
        </div>
        <ul className="space-y-1 text-sm">{plan.features.map(feature => {
          const locked = view === 'basic' && feature.tier === 'pro';
          return <li key={feature.label} className={locked ? 'text-muted-foreground' : ''} data-locked={locked}>{locked ? '🔒' : '✓'} {feature.label}{feature.tier === 'pro' ? ' · Pro' : ''}</li>;
        })}</ul>
      </CardContent></Card>)}</div>
    <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
      <p>Basic untuk pengalaman awal sebagai daya tarik kerja sama; fitur Pro aktif selama project berlangsung lalu kembali ke tier normal; trial 1 minggu memakai fitur Pro. Kode referral memberi gratis 1 bulan. Penagihan oleh tim Cineva lewat Lark atau WhatsApp, bukan di aplikasi.</p>
      <p className="mt-2">Belum ditentukan client: harga dan diskon paket 1, 3 dan 12 bulan, besar promo referral, dan syarat penagihan setelah meeting ke-4.</p></div>
  </section>;
}
