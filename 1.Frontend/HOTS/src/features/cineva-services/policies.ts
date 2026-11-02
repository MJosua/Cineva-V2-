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

/**
 * Batch J (jawaban kuesioner): client batal dengan alasan tidak masuk akal dikenai denda 15% **atau** DP hangus. Client belum menyebut kapan
 * yang mana, jadi sistem tidak memilih: kedua opsi dihitung dan PIC/owner memutuskan. Basis 15% (`totalDeal`, total nilai deal Brand) adalah tafsiran tim.
 */
export const brandPenaltyPolicy: CancellationPolicy = {
  version: 'CLIENT-BATCH-J-brand-15',
  parties: { brand: { penaltyPercent: 15, penaltyBasis: 'totalDeal' } },
};
export function brandCancellationOptions(input: { deposit: number; totalDeal: number }) {
  return {
    forfeitDeposit: evaluateProjectCancellation({ party: 'brand', deposit: input.deposit }),
    penalty15: evaluateCancellation(brandPenaltyPolicy, { party: 'brand', amounts: { totalDeal: input.totalDeal } }),
  };
}
/** Batch J: alasan batal wajib dilampirkan (semua pihak). Bentuk bukti sama dengan bukti perpanjangan: PNG, JPEG, atau teks. */
export type CancellationProof = { kind: 'png' | 'jpeg'; fileName: string; sizeBytes: number } | { kind: 'text'; text: string };
export function assertCancellationProof(reason: string, proof: CancellationProof | undefined): { reason: string; proof: CancellationProof } {
  const text = reason?.trim() ?? '';
  if (!text || text.length > 2000) throw new Error('Alasan pembatalan wajib diisi (maksimal 2.000 karakter).');
  if (!proof) throw new Error('Lampiran alasan pembatalan wajib diisi.');
  if (proof.kind === 'text' ? !proof.text?.trim() || proof.text.length > 2000
    : !['png', 'jpeg'].includes(proof.kind) || !proof.fileName?.trim() || !Number.isSafeInteger(proof.sizeBytes) || proof.sizeBytes <= 0)
    throw new Error('Lampiran harus berkas PNG/JPEG yang tidak kosong atau teks (maksimal 2.000 karakter).');
  return { reason: text, proof };
}
/** Batch J ("maks 7 hari"): kewajiban pembatalan diselesaikan paling lambat 7 hari kalender setelah project selesai (tafsiran tim: hari kalender). */
export const cancellationSettlementDays = 7;
export function cancellationSettlementDue(projectEnd: string, days = cancellationSettlementDays): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(projectEnd) || Number.isNaN(Date.parse(projectEnd + 'T00:00:00Z'))) throw new Error('Tanggal selesai project tidak valid.');
  const due = new Date(projectEnd + 'T00:00:00Z');
  due.setUTCDate(due.getUTCDate() + days);
  return due.toISOString().slice(0, 10);
}

/**
 * Batch J (N44): pendaftar ganda dicocokkan dari username sosial media dan WhatsApp; nama hanya pendukung karena nama sama belum tentu orang sama (tafsiran tim).
 * Username dibandingkan per platform tanpa '@' dan huruf besar; WhatsApp dinormalisasi ke 62xxxxxxxx.
 */
export interface Registration { id: string; name: string; whatsapp?: string; accounts?: { platform: string; username: string }[] }
export interface DuplicateMatch { ids: [string, string]; by: ('username' | 'whatsapp' | 'name')[]; confirmed: boolean }
export const normalizeWhatsapp = (raw: string | undefined) => {
  const digits = (raw ?? '').replace(/\D/g, '');
  const local = digits.startsWith('62') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
  return local.length >= 8 ? '62' + local : '';
};
const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');
export function findDuplicateRegistrations(rows: Registration[]): DuplicateMatch[] {
  const keyed = rows.map(row => ({
    id: row.id, name: normalizeName(row.name ?? ''), wa: normalizeWhatsapp(row.whatsapp),
    handles: new Set((row.accounts ?? []).map(a => `${a.platform.trim().toLowerCase()}:${a.username.trim().replace(/^@/, '').toLowerCase()}`).filter(h => !h.endsWith(':'))),
  }));
  const matches: DuplicateMatch[] = [];
  for (let i = 0; i < keyed.length; i++) for (let j = i + 1; j < keyed.length; j++) {
    const a = keyed[i], b = keyed[j], by: DuplicateMatch['by'] = [];
    if ([...a.handles].some(h => b.handles.has(h))) by.push('username');
    if (a.wa && a.wa === b.wa) by.push('whatsapp');
    if (a.name && a.name === b.name) by.push('name');
    if (by.length) matches.push({ ids: [a.id, b.id], by, confirmed: by.includes('username') || by.includes('whatsapp') });
  }
  return matches;
}
