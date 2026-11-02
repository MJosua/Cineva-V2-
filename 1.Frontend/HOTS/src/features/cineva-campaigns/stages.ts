import { evaluateExtension, type ExtensionLimits } from '@hots/scheduling-kit';
import { addWorkingDays, defaultServiceRules, type ServiceRules } from '../cineva-services/rules.ts';

/**
 * Kalender tahap campaign dari template client (B2). Template adalah data yang bisa diubah HQ per campaign (L12).
 * Vendor-only dan additive: tidak mengubah milestone atau eksekusi yang ada. Urutan wajib antar tahap dan aksi yang
 * dikunci jendela tanggal belum dijawab client (N17, N18) sehingga tidak diputuskan di sini.
 */
export interface StageDef { key: string; label: string; days: number; dayKind: 'calendar' | 'working' }
export interface StageTemplate { id: string; name: string; stages: StageDef[] }
export interface StageDate { key: string; label: string; start: string; end: string }
export type ExtensionProof = { kind: 'png' | 'jpeg'; fileName: string; sizeBytes: number } | { kind: 'text'; text: string };
export interface ExtensionRecord { stageKey: string; days: number; reason: string; proof: ExtensionProof }
/** Perpanjangan terpisah dari izin submit terlambat (L18 usulan tim). Jawaban client 2 Nov (N28): hanya 1 kali, tambahan 2 hari; batas berlaku total per campaign. */
export const defaultExtensionRules: ExtensionLimits = { maxTotalDays: 2, maxRequests: 1 };

/** Durasi dari jawaban B2. Hari konten 4 adalah nilai tengah "3 sampai 4 hari, bisa 1 minggu"; jenis hari kalender vs kerja belum dikonfirmasi (L13). */
export const defaultStageTemplates: StageTemplate[] = [
  { id: 'reguler-bulanan', name: 'Reguler bulanan', stages: [
    { key: 'talent', label: 'Dealing dan approval talent', days: 7, dayKind: 'calendar' },
    { key: 'barang', label: 'Pembelian dan pengiriman barang', days: 7, dayKind: 'calendar' },
    { key: 'konten', label: 'Pembuatan konten', days: 4, dayKind: 'calendar' },
    { key: 'payment', label: 'Pembayaran', days: 14, dayKind: 'working' },
  ] },
  { id: 'non-barang-30', name: 'Non-barang 30 hari', stages: [
    { key: 'talent_sampai_beres', label: 'Cari talent sampai beres', days: 30, dayKind: 'calendar' },
    { key: 'payment', label: 'Pembayaran', days: 14, dayKind: 'working' },
  ] },
];

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
export function addDays(date: string, days: number): string {
  if (!isDate(date) || !Number.isSafeInteger(days)) throw new Error('Tanggal dan jumlah hari harus valid.');
  const next = new Date(date + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}
export function assertStageTemplate(template: StageTemplate): StageTemplate {
  const keys = template.stages.map(stage => stage.key);
  if (!template.id.trim() || !template.name.trim() || !template.stages.length) throw new Error('Template tahap harus punya id, nama, dan minimal satu tahap.');
  if (keys.some(key => !key.trim()) || new Set(keys).size !== keys.length) throw new Error('Kunci tahap harus unik dan tidak kosong.');
  if (template.stages.some(stage => !stage.label.trim() || !Number.isSafeInteger(stage.days) || stage.days < 1 || !['calendar', 'working'].includes(stage.dayKind)))
    throw new Error('Tahap harus punya label, durasi bulat minimal 1 hari, dan jenis hari valid.');
  return template;
}

/** Tahap berurutan; tahap berikutnya mulai sehari setelah tahap sebelumnya selesai. Tahap hari kerja butuh daftar libur terisi. */
export function buildStageCalendar(template: StageTemplate, startDate: string, rules: ServiceRules = defaultServiceRules, extensions: ExtensionRecord[] = []): StageDate[] {
  assertStageTemplate(template);
  if (!isDate(startDate)) throw new Error('Tanggal mulai campaign tidak valid.');
  for (const item of extensions) if (!template.stages.some(stage => stage.key === item.stageKey)) throw new Error('Perpanjangan mengacu ke tahap yang tidak ada.');
  const result: StageDate[] = [];
  let cursor = startDate;
  for (const stage of template.stages) {
    const planned = stage.dayKind === 'working' ? addWorkingDays(cursor, stage.days, rules) : addDays(cursor, stage.days - 1);
    const extra = extensions.filter(item => item.stageKey === stage.key).reduce((sum, item) => sum + item.days, 0);
    const end = addDays(planned, extra);
    result.push({ key: stage.key, label: stage.label, start: cursor, end });
    cursor = addDays(end, 1);
  }
  return result;
}

/** Rencana tahap yang disimpan pada campaign. `holidays` diisi HQ (client belum memberi daftar resmi); daftar kosong berarti sengaja tanpa libur. */
export interface StagePlan { templateId: string; startDate: string; holidays: string[]; extensions: ExtensionRecord[] }
export const findStageTemplate = (id: string) => defaultStageTemplates.find(template => template.id === id);
export function assertStagePlan(plan: StagePlan): StagePlan {
  const template = findStageTemplate(plan.templateId);
  if (!template) throw new Error('Template tahap campaign tidak dikenal.');
  if (!isDate(plan.startDate)) throw new Error('Tanggal mulai campaign tidak valid.');
  if (!Array.isArray(plan.holidays) || !plan.holidays.every(day => typeof day === 'string' && isDate(day))) throw new Error('Daftar libur harus berformat YYYY-MM-DD yang valid.');
  if (!Array.isArray(plan.extensions)) throw new Error('Riwayat perpanjangan tidak valid.');
  plan.extensions.forEach((item, index) => validateExtension(item, plan.extensions.slice(0, index), template));
  return plan;
}
export function stagePlanCalendar(plan: StagePlan): StageDate[] {
  assertStagePlan(plan);
  return buildStageCalendar(findStageTemplate(plan.templateId)!, plan.startDate, { ...defaultServiceRules, holidays: plan.holidays }, plan.extensions);
}

/** Validasi pengajuan perpanjangan lewat `evaluateExtension` (scheduling-kit): alasan dan bukti (PNG, JPEG, atau teks) wajib, maksimal 2 hari total dan 1 pengajuan. Persetujuan bertingkat (B3) ditangani alur lain. */
export function validateExtension(request: ExtensionRecord, used: ExtensionRecord[], template: StageTemplate, limits: ExtensionLimits = defaultExtensionRules): ExtensionRecord {
  assertStageTemplate(template);
  if (!template.stages.some(stage => stage.key === request.stageKey)) throw new Error('Pilih tahap yang ada pada template campaign.');
  const issue = evaluateExtension(request, used, limits).issues[0];
  if (issue) {
    const messages: Record<string, string> = {
      reason_required: 'Alasan perpanjangan wajib diisi (maksimal 2.000 karakter).',
      days_invalid: 'Perpanjangan minimal 1 hari bulat.',
      total_limit: `Perpanjangan melebihi batas ${limits.maxTotalDays} hari per campaign (terpakai ${used.reduce((sum, item) => sum + item.days, 0)}).`,
      request_limit: `Perpanjangan hanya boleh diajukan ${limits.maxRequests} kali per campaign.`,
      proof_required: 'Bukti wajib berupa PNG, JPEG, atau teks.',
      proof_kind_not_allowed: 'Bukti wajib berupa PNG, JPEG, atau teks.',
      proof_invalid: issue.path === 'proof.text' ? 'Bukti teks wajib diisi (maksimal 2.000 karakter).' : 'Bukti gambar harus berkas PNG atau JPEG yang tidak kosong.',
    };
    throw new Error(messages[issue.code] ?? 'Pengajuan perpanjangan tidak valid.');
  }
  return { ...request, reason: request.reason.trim() };
}
