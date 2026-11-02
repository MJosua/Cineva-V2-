import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { money } from '../cineva-shared/model';
import { assertCancellationProof, brandCancellationOptions, cancellationDeciders, cancellationSettlementDays, cancellationReasonLabels, defaultCancellationPolicy, defaultKolRateCard, estimateKolBudget, evaluateProjectCancellation } from './policies';

const tierLabels: Record<string, string> = { nano: 'Nano (1–9,9K)', mikro: 'Mikro (10K–99,9K)', makro: 'Makro (100K ke atas)' };
const parties: Record<string, string> = { brand: 'Brand / client', crew: 'Kru', creator: 'Creator' };
const toInt = (value: string) => (value.trim() === '' ? 0 : Number(value));
const selectClass = 'mt-1 block h-10 w-full rounded-md border border-border bg-background px-3';

/** Estimasi awal campaign KOL dari pengajuan awal client. Rate final adalah hasil negosiasi per orang per SOW. */
export function KolEstimateCard() {
  const [counts, setCounts] = useState<Record<string, string>>({ nano: '0', mikro: '0', makro: '0' });
  let result: ReturnType<typeof estimateKolBudget> | null = null, error = '';
  try { result = estimateKolBudget(Object.keys(defaultKolRateCard.tiers).map(tier => ({ tier, count: toInt(counts[tier]) }))); } catch (reason) { error = (reason as Error).message; }
  return <Card data-testid="kol-estimate"><CardHeader><CardTitle>Estimasi awal campaign KOL</CardTitle></CardHeader><CardContent className="space-y-3">
    <p className="text-sm text-muted-foreground">Berdasarkan pengajuan awal: Nano Rp300 rb, Mikro Rp700 rb, Makro di atas Rp800 rb. Harga final disepakati per orang dan per SOW.</p>
    <div className="grid gap-3 sm:grid-cols-3">{Object.keys(defaultKolRateCard.tiers).map(tier => <label key={tier} className="text-sm">{tierLabels[tier]}
      <Input aria-label={`Jumlah KOL ${tier}`} type="number" min="0" step="1" value={counts[tier]} onChange={event => setCounts(current => ({ ...current, [tier]: event.target.value }))}/></label>)}</div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {result && <p data-testid="kol-estimate-result" className="text-lg font-semibold">{result.openEnded ? `Mulai dari ${money(result.min)} (tanpa batas atas untuk Makro)` : money(result.min)}<span className="block text-xs font-normal text-muted-foreground">Estimasi, bukan penawaran.</span></p>}
  </CardContent></Card>;
}

/**
 * Simulasi akibat pembatalan menurut aturan client. Client batal = DP hangus. Kru atau Creator batal = pengganti + biaya produk + denda 15% dari total fee,
 * kecuali belum menyanggupi atau ada alasan penting. Bencana alam didiskusikan (jadwal mundur atau pengembalian setengah dari total dibayarkan).
 */
export function CancellationSimulator() {
  const [party, setParty] = useState('brand'), [kind, setKind] = useState<'campaign' | 'production'>('campaign'), [reason, setReason] = useState('');
  const [totalDeal, setTotalDeal] = useState('0'), [note, setNote] = useState(''), [proofText, setProofText] = useState('');
  const [deposit, setDeposit] = useState('0'), [fee, setFee] = useState('0'), [product, setProduct] = useState('0'), [paid, setPaid] = useState('0');
  const rule = defaultCancellationPolicy.parties[party], reasons = Object.keys(rule.reasons ?? {});
  const activeReason = reason && reasons.includes(reason) ? reason : '';
  let result: ReturnType<typeof evaluateProjectCancellation> | null = null, error = '';
  try { result = evaluateProjectCancellation({ party, deposit: toInt(deposit), amounts: { totalFee: toInt(fee), amountPaid: toInt(paid) }, extraCharges: { productReplacement: toInt(product) }, ...(activeReason ? { reason: activeReason } : {}) }); } catch (failure) { error = (failure as Error).message; }
  const decider = cancellationDeciders[kind];
  let brandPenalty: number | null = null;
  if (party === 'brand' && !activeReason) try { brandPenalty = brandCancellationOptions({ deposit: toInt(deposit), totalDeal: toInt(totalDeal) }).penalty15.total; } catch (failure) { error ||= (failure as Error).message; }
  let proofIssue = '';
  try { assertCancellationProof(note, proofText.trim() ? { kind: 'text', text: proofText } : undefined); } catch (failure) { proofIssue = (failure as Error).message; }
  return <Card data-testid="cancellation-simulator"><CardHeader><CardTitle>Simulasi pembatalan</CardTitle></CardHeader><CardContent className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">Pihak yang membatalkan
        <select aria-label="Pihak yang membatalkan" className={selectClass} value={party} onChange={event => { setParty(event.target.value); setReason(''); }}>{Object.keys(parties).map(key => <option key={key} value={key}>{parties[key]}</option>)}</select></label>
      <label className="block text-sm">Jenis project
        <select aria-label="Jenis project" className={selectClass} value={kind} onChange={event => setKind(event.target.value as 'campaign' | 'production')}><option value="campaign">Campaign</option><option value="production">Produksi</option></select></label>
    </div>
    <label className="block text-sm">Alasan pembatalan
      <select aria-label="Alasan pembatalan" className={selectClass} value={activeReason} onChange={event => setReason(event.target.value)}>
        <option value="">{party === 'brand' ? 'Tanpa alasan khusus' : 'Sudah menyanggupi, tanpa alasan khusus'}</option>
        {reasons.map(key => <option key={key} value={key}>{cancellationReasonLabels[key]}</option>)}</select></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">DP diterima (Rp)<Input aria-label="DP diterima" type="number" min="0" step="1" value={deposit} onChange={event => setDeposit(event.target.value)}/></label>
      {rule.penaltyPercent !== undefined && <label className="text-sm">Total fee yang diterima (Rp)<Input aria-label="Total fee" type="number" min="0" step="1" value={fee} onChange={event => setFee(event.target.value)}/></label>}
      {rule.extraChargeKeys?.length ? <label className="text-sm">Biaya pergantian produk (Rp)<Input aria-label="Biaya pergantian produk" type="number" min="0" step="1" value={product} onChange={event => setProduct(event.target.value)}/></label> : null}
      {party === 'brand' && !activeReason && <label className="text-sm">Total nilai deal (Rp)<Input aria-label="Total nilai deal" type="number" min="0" step="1" value={totalDeal} onChange={event => setTotalDeal(event.target.value)}/></label>}
      {activeReason === 'force_majeure' && party === 'brand' && <label className="text-sm">Total yang sudah dibayarkan (Rp)<Input aria-label="Total dibayarkan" type="number" min="0" step="1" value={paid} onChange={event => setPaid(event.target.value)}/></label>}
    </div>
    <label className="block text-sm">Alasan batal (wajib)<Input aria-label="Alasan batal" value={note} maxLength={2000} onChange={event => setNote(event.target.value)}/></label>
    <label className="block text-sm">Lampiran alasan (wajib; teks atau keterangan berkas PNG/JPEG)<Input aria-label="Lampiran alasan" value={proofText} maxLength={2000} onChange={event => setProofText(event.target.value)}/></label>
    {proofIssue && <p data-testid="cancellation-proof-issue" className="text-sm text-destructive">{proofIssue}</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {result && <div data-testid="cancellation-result" className="space-y-1 text-sm">
      {result.depositForfeited > 0 && <p>DP hangus: {money(result.depositForfeited)}</p>}
      {result.penalty && <p>Denda {result.penalty.percent}% dari total fee: {money(result.penalty.amount)}</p>}
      {result.extraCharges.productReplacement > 0 && <p>Biaya pergantian produk: {money(result.extraCharges.productReplacement)}</p>}
      {result.refund && <p>Perkiraan pengembalian dana ({result.refund.percent}% dari total dibayarkan): {money(result.refund.amount)}</p>}
      {result.requiresReplacement && <p>Wajib mencarikan pengganti.</p>}
      {brandPenalty !== null ? <div data-testid="brand-options"><p className="font-semibold">Opsi A, DP hangus: {money(result.total)}</p><p className="font-semibold">Opsi B, denda 15% dari total deal: {money(brandPenalty)}</p>
        <p className="text-xs text-muted-foreground">Alasan tidak masuk akal: denda 15% atau DP hangus. Client belum menetapkan kapan yang mana; PIC/owner memilih.</p></div>
        : <p className="font-semibold">Total konsekuensi: {money(result.total)}</p>}
      <p className="text-xs text-muted-foreground">Kewajiban diselesaikan paling lambat {cancellationSettlementDays} hari setelah project selesai.</p>
      {activeReason === 'force_majeure' && <p className="text-xs text-muted-foreground">Keadaan di luar kendali manusia didiskusikan: biasanya jadwal mundur atau pengembalian setengah dari total yang dibayarkan.</p>}
      <p className="text-xs text-muted-foreground">Pihak yang bersalah diputuskan {decider.decider}; persetujuan akhir {decider.final}. Penerima denda belum diputuskan client.</p>
    </div>}
  </CardContent></Card>;
}
