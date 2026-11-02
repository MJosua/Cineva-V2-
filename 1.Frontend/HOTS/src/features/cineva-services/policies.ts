import { evaluateCancellation, evaluateGate, type CancellationOutcome, type CancellationPolicy } from '@hots/domain-kit';

/**
 * Kebijakan Cineva dari jawaban client 2 Nov 2026 yang tidak bertentangan dengan jawaban sebelumnya.
 * Angka dan kunci adalah data (parameter); logikanya ada di `@hots/domain-kit`. Vendor-only dan additive.
 * Belum diputuskan client sehingga sengaja tidak diisi: penerima denda (N6), pihak yang memutuskan kesalahan, ambang grade (K1).
 */

/**
 * D4/D5 dan jawaban N6: client batal = DP hangus; kru atau creator batal = cari pengganti + biaya pergantian produk (jika ada) + denda 15% dari total fee yang mereka terima.
 * Jawaban 3 Nov: denda hanya bagi yang sebelumnya menyanggupi; alasan penting (sakit, kecelakaan, dan sejenisnya) boleh membatalkan tanpa denda;
 * keadaan di luar kendali manusia (bencana alam) didiskusikan, biasanya jadwal mundur atau pengembalian setengah dari total yang dibayarkan.
 * Pengembalian 50% adalah kebiasaan yang disebut client, bukan aturan pasti; hasilnya perlu diputuskan lewat diskusi.
 */
const crewReasons = { not_committed: { waivePenalty: true }, valid_reason: { waivePenalty: true }, force_majeure: { waivePenalty: true } };
export const defaultCancellationPolicy: CancellationPolicy = {
  version: 'CLIENT-2026-11-03',
  parties: {
    brand: { forfeitDeposit: true, reasons: { force_majeure: { waiveForfeit: true, refundPercent: 50, refundBasis: 'amountPaid' } } },
    crew: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, extraChargeKeys: ['productReplacement'], reasons: crewReasons },
    creator: { penaltyPercent: 15, penaltyBasis: 'totalFee', requireReplacement: true, extraChargeKeys: ['productReplacement'], reasons: crewReasons },
  },
};
export const cancellationReasonLabels: Record<string, string> = {
  not_committed: 'Belum menyanggupi', valid_reason: 'Alasan penting (sakit, kecelakaan, dan sejenisnya)', force_majeure: 'Bencana alam atau di luar kendali manusia',
};
/** Penentu pihak yang bersalah (jawaban 3 Nov): campaign oleh PIC Campaign, produksi oleh Account Manager Produksi; persetujuan akhir owner. */
export const cancellationDeciders: Record<'campaign' | 'production', { decider: string; final: string }> = {
  campaign: { decider: 'PIC Campaign', final: 'Owner' },
  production: { decider: 'Account Manager Produksi', final: 'Owner' },
};
/** `productReplacement` wajib diisi; isi 0 bila tidak ada biaya pergantian produk. */
export const evaluateProjectCancellation = (input: Parameters<typeof evaluateCancellation>[1], policy: CancellationPolicy = defaultCancellationPolicy): CancellationOutcome =>
  evaluateCancellation(policy, input);

/** N27: hasil shoot atau konten disetujui client sebagai pemegang utama, dan owner Cineva ikut menyepakati. */
export const contentApprovalKeys = ['client', 'owner'] as const;
export const approvalLabels: Record<string, string> = { client: 'persetujuan client', owner: 'kesepakatan owner Cineva' };
/** N19 dan N43: pada campaign creator, post tayang, insight masuk, dan seluruh kewajiban creator selesai sebelum payment diajukan. */
export const creatorPaymentKeys = ['post_live', 'insight_submitted', 'obligations_complete'] as const;
export const contentApprovalGate = (approvedBy: Iterable<string>, required: readonly string[] = contentApprovalKeys) => evaluateGate(required, approvedBy);
export const creatorPaymentGate = (done: Iterable<string> | Readonly<Record<string, boolean>>, required: readonly string[] = creatorPaymentKeys) => evaluateGate(required, done);

/**
 * L5/N37/N22: rate KOL adalah hasil negosiasi per orang per SOW dari total estimasi budget client. Angka di bawah hanyalah
 * pengajuan awal yang disebut client (Nano 300 rb, Mikro 700 rb, Makro di atas 800 rb), bukan harga final. Rate "Locked" di sheet
 * bisa berbeda (mis. Upper Micro 650 rb) dan SOW (Reels, VT) belum dipisah karena N38 belum dijawab.
 */
export interface KolRateTier { min: number; max?: number }
export interface KolRateCard { version: string; tiers: Readonly<Record<string, KolRateTier>>; aliases: Readonly<Record<string, string>> }
export const defaultKolRateCard: KolRateCard = {
  version: 'CLIENT-2026-11-02-opening',
  tiers: { nano: { min: 300000 }, mikro: { min: 700000 }, makro: { min: 800000 } },
  aliases: { 'lower micro': 'mikro', 'upper micro': 'mikro', 'lower macro': 'makro', 'upper macro': 'makro' },
};
const isRupiah = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export function resolveKolTier(label: string, card: KolRateCard = defaultKolRateCard): string {
  const key = label.trim().toLowerCase();
  const tier = Object.hasOwn(card.aliases, key) ? card.aliases[key] : key;
  if (!Object.hasOwn(card.tiers, tier)) throw new Error(`Tier KOL tidak dikenal: ${label}`);
  return tier;
}
/** Perkiraan awal campaign: jumlah minimum per tier, dan `openEnded` bila ada tier tanpa batas atas (Makro). Bukan harga final. */
export function estimateKolBudget(items: { tier: string; count: number }[], card: KolRateCard = defaultKolRateCard) {
  let min = 0, max = 0, openEnded = false;
  for (const item of items) {
    if (!Number.isSafeInteger(item.count) || item.count < 0) throw new Error('Jumlah KOL harus bilangan bulat non-negatif.');
    const rate = card.tiers[resolveKolTier(item.tier, card)];
    if (!isRupiah(rate.min) || (rate.max !== undefined && (!isRupiah(rate.max) || rate.max < rate.min))) throw new Error('Rate card tidak valid.');
    min += rate.min * item.count;
    if (rate.max === undefined) openEnded ||= item.count > 0; else max += rate.max * item.count;
  }
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) throw new Error('Total estimasi di luar jangkauan.');
  return { min, max: openEnded ? null : max, openEnded, version: card.version, negotiable: true as const };
}

/**
 * N39: normalisasi otomatis diizinkan dan wajib (client). Aturan pemisah adalah asumsi tim: bila ada titik dan koma, pemisah terakhir adalah desimal;
 * koma tunggal adalah desimal; titik tunggal berpola ribuan (1.234 atau 1.234.567) adalah ribuan. Sufiks K/M mengalikan 1.000/1.000.000.
 * Status `out_of_range` menandai angka di luar batas; ini bukan status review "Periksa" milik client (K2).
 */
export type MetricStatus = 'ok' | 'normalized' | 'out_of_range' | 'invalid' | 'empty';
export interface MetricRule { kind: 'percent' | 'count'; bounds?: { min: number; max: number } }
export function normalizeMetric(raw: unknown, rule: MetricRule): { value: number | null; status: MetricStatus } {
  const bounds = rule.bounds ?? (rule.kind === 'percent' ? { min: 0, max: 100 } : { min: 0, max: Number.MAX_SAFE_INTEGER });
  if (raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim())) return { value: null, status: 'empty' };
  let value: number, changed = false;
  if (typeof raw === 'number') value = raw;
  else if (typeof raw === 'string') {
    const match = /^\s*([0-9.,]+)\s*([kKmM]?)\s*(%?)\s*$/.exec(raw);
    if (!match || (rule.kind === 'count' && match[3]) || (rule.kind === 'percent' && match[2])) return { value: null, status: 'invalid' };
    let digits = match[1];
    if (digits.includes('.') && digits.includes(',')) digits = digits.lastIndexOf(',') > digits.lastIndexOf('.') ? digits.replace(/\./g, '').replace(',', '.') : digits.replace(/,/g, '');
    else if (digits.includes(',')) digits = digits.split(',').length === 2 ? digits.replace(',', '.') : '';
    else if (rule.kind === 'count' && /^\d{1,3}(\.\d{3})+$/.test(digits)) digits = digits.replace(/\./g, '');
    value = digits && /^\d+(\.\d+)?$/.test(digits) ? Number(digits) * (/k/i.test(match[2]) ? 1e3 : /m/i.test(match[2]) ? 1e6 : 1) : NaN;
    changed = /[.,kKmM%]/.test(raw);
  } else return { value: null, status: 'invalid' };
  if (!Number.isFinite(value)) return { value: null, status: 'invalid' };
  if (value < bounds.min || value > bounds.max) return { value, status: 'out_of_range' };
  return { value, status: changed ? 'normalized' : 'ok' };
}
