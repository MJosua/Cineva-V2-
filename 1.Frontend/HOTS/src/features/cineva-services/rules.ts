/**
 * Aturan layanan Cineva dari jawaban client (1 Nov 2026), dipisah dari perhitungannya supaya angka bisa diganti
 * tanpa mengubah logika. Vendor-only dan additive: tidak mengubah `pricing.ts`. Nilai `null` = belum dijawab client
 * (lihat 3.Knowledge/handover/PERTANYAAN_UNTUK_CLIENT_2026_11_01.md) dan fungsi terkait melempar galat, bukan menebak.
 */
export type CrewRateRole = 'videographer' | 'photographer' | 'editor_basic' | 'editor_pro';
export type ProjectClass = 'kecil' | 'sedang' | 'profesional';
export interface OvertimeBand { minBudget: number; ratePerHour: number }
export interface ServiceRules {
  version: string;
  /** Rate minimum per peran untuk `standardHours` jam kerja (A1). */
  crewMinimum: Record<CrewRateRole, number>;
  standardHours: number;
  /** Jam layanan konsultasi dan admin, WIB (G1). Jadwal shoot mengikuti project, bukan jam ini. */
  serviceHours: { open: number; close: number };
  /** Hari layanan, 0 = Minggu ... 6 = Sabtu (WhatsApp Business: Sabtu dan Minggu tutup). */
  serviceDays: number[];
  /** Kelas project dari total budget (G2): kecil < sedangFrom <= sedang <= profesionalAbove < profesional. */
  classThresholds: { sedangFrom: number; profesionalAbove: number };
  /** Biaya tambahan jasa kru per jam (N51): kecil rentang, sedang mulai dari, profesional dibahas manual. */
  overtime: { kecil: { min: number; max: number }; sedangFrom: number; bands: OvertimeBand[] | null };
  paymentWorkingDays: number;
  /** Libur nasional dan cuti bersama, format YYYY-MM-DD. null = daftar belum diberikan client. */
  holidays: string[] | null;
}

export const defaultServiceRules: ServiceRules = {
  version: 'CLIENT-2026-11-01',
  crewMinimum: { videographer: 700000, photographer: 700000, editor_basic: 500000, editor_pro: 1000000 },
  standardHours: 6,
  serviceHours: { open: 9, close: 18 },
  serviceDays: [1, 2, 3, 4, 5],
  classThresholds: { sedangFrom: 5000000, profesionalAbove: 100000000 },
  overtime: { kecil: { min: 100000, max: 300000 }, sedangFrom: 300000, bands: null },
  paymentWorkingDays: 14,
  holidays: null,
};

const isRupiah = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;

export function assertServiceRules(rules: ServiceRules): ServiceRules {
  const { crewMinimum, serviceHours, serviceDays, classThresholds, overtime, holidays } = rules;
  if (!rules.version.trim()) throw new Error('Aturan layanan harus memiliki versi.');
  if (!Object.values(crewMinimum).every(isRupiah) || !Number.isSafeInteger(rules.standardHours) || rules.standardHours < 1)
    throw new Error('Rate minimum crew harus rupiah bulat non-negatif dan jam standar minimal 1.');
  if (!Number.isInteger(serviceHours.open) || !Number.isInteger(serviceHours.close) || serviceHours.open < 0 || serviceHours.close > 24 || serviceHours.open >= serviceHours.close)
    throw new Error('Jam layanan tidak valid.');
  if (!serviceDays.every(day => Number.isInteger(day) && day >= 0 && day <= 6) || new Set(serviceDays).size !== serviceDays.length)
    throw new Error('Hari layanan tidak valid.');
  if (!isRupiah(classThresholds.sedangFrom) || !isRupiah(classThresholds.profesionalAbove) || classThresholds.sedangFrom >= classThresholds.profesionalAbove)
    throw new Error('Ambang kelas project tidak valid.');
  if (![overtime.kecil.min, overtime.kecil.max, overtime.sedangFrom].every(isRupiah) || overtime.kecil.min > overtime.kecil.max)
    throw new Error('Biaya tambahan kru tidak valid.');
  if (overtime.bands && (!overtime.bands.every(band => isRupiah(band.minBudget) && isRupiah(band.ratePerHour)) || new Set(overtime.bands.map(band => band.minBudget)).size !== overtime.bands.length))
    throw new Error('Pita lembur harus rupiah bulat dengan batas budget unik.');
  if (!Number.isSafeInteger(rules.paymentWorkingDays) || rules.paymentWorkingDays < 0) throw new Error('Jumlah hari kerja payment tidak valid.');
  if (holidays && !holidays.every(isDate)) throw new Error('Daftar libur harus berformat YYYY-MM-DD yang valid.');
  return rules;
}

/** Kecil: di bawah batas sedang; profesional: di atas batas profesional; sisanya sedang. Nilai tepat 5 jt dan 100 jt dianggap sedang (tafsiran tim, belum dikonfirmasi). */
export function projectClass(totalBudget: number, rules: ServiceRules = defaultServiceRules): ProjectClass {
  if (!isRupiah(totalBudget)) throw new Error('Total budget harus rupiah bulat non-negatif.');
  const { sedangFrom, profesionalAbove } = assertServiceRules(rules).classThresholds;
  return totalBudget < sedangFrom ? 'kecil' : totalBudget > profesionalAbove ? 'profesional' : 'sedang';
}

/** Rentang biaya tambahan per jam jasa kru. Kecil: min sampai max; sedang: mulai dari (tanpa batas atas); profesional dibahas manual. */
export function overtimeRange(totalBudget: number, rules: ServiceRules = defaultServiceRules): { projectClass: ProjectClass; min: number; max?: number } {
  const kind = projectClass(totalBudget, rules);
  if (kind === 'profesional') throw new Error('Project profesional: biaya tambahan dibahas dengan tim dan klien.');
  return kind === 'kecil' ? { projectClass: kind, ...rules.overtime.kecil } : { projectClass: kind, min: rules.overtime.sedangFrom };
}

/** Tarif per jam dari tabel pita budget (N53). Melempar galat selama client belum mengisi tabel. */
export function overtimeRate(totalBudget: number, rules: ServiceRules = defaultServiceRules): number {
  overtimeRange(totalBudget, rules);
  const bands = rules.overtime.bands;
  if (!bands?.length) throw new Error('Tabel pita lembur per budget belum diisi (menunggu jawaban client N53).');
  const band = bands.filter(item => item.minBudget <= totalBudget).sort((a, b) => b.minBudget - a.minBudget)[0];
  if (!band) throw new Error('Budget di bawah pita lembur terendah.');
  return band.ratePerHour;
}

/**
 * Jam lembur yang ditagih untuk kelebihan `overMinutes` menit di atas jatah jam kerja (jawaban A2 client).
 * TODO(human): tentukan aturan pembulatan dan kembalikan jumlah jam penagihan (boleh pecahan, mis. 0.5).
 */
export function overtimeBillableHours(overMinutes: number): number {
  if (!Number.isFinite(overMinutes) || overMinutes < 0) throw new Error('Menit kelebihan harus angka non-negatif.');
  throw new Error('Aturan pembulatan lembur belum ditentukan.');
}

export function overtimeCost(overMinutes: number, ratePerHour: number): number {
  if (!isRupiah(ratePerHour)) throw new Error('Tarif lembur harus rupiah bulat non-negatif.');
  const cost = overtimeBillableHours(overMinutes) * ratePerHour;
  if (!Number.isSafeInteger(cost)) throw new Error('Biaya lembur harus rupiah bulat.');
  return cost;
}

/** Waktu lokal WIB `YYYY-MM-DDTHH:mm`. Hanya berlaku untuk konsultasi dan layanan admin, bukan jadwal shoot. */
export function isWithinServiceHours(localDateTime: string, rules: ServiceRules = defaultServiceRules): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match || !isDate(match[1]) || Number(match[2]) > 23 || Number(match[3]) > 59) throw new Error('Waktu layanan tidak valid.');
  const { serviceHours, serviceDays } = assertServiceRules(rules), minute = Number(match[2]) * 60 + Number(match[3]);
  return serviceDays.includes(new Date(match[1] + 'T00:00:00Z').getUTCDay()) && minute >= serviceHours.open * 60 && minute < serviceHours.close * 60;
}

function workingDayHolidays(rules: ServiceRules) {
  assertServiceRules(rules);
  if (!rules.holidays) throw new Error('Daftar libur belum diisi client; isi dulu (boleh kosong secara eksplisit).');
  return new Set(rules.holidays);
}
/** Hari kerja = Senin sampai Jumat yang bukan libur (B2: Sabtu, Minggu, libur nasional tidak dihitung). */
export function isWorkingDay(date: string, rules: ServiceRules = defaultServiceRules): boolean {
  if (!isDate(date)) throw new Error('Tanggal tidak valid.');
  const holidays = workingDayHolidays(rules), day = new Date(date + 'T00:00:00Z').getUTCDay();
  return day >= 1 && day <= 5 && !holidays.has(date);
}
/** Tambah `days` hari kerja setelah `start` (hari mulai tidak dihitung; tafsiran tim). */
export function addWorkingDays(start: string, days: number, rules: ServiceRules = defaultServiceRules): string {
  if (!isDate(start) || !Number.isSafeInteger(days) || days < 0) throw new Error('Tanggal mulai dan jumlah hari kerja harus valid.');
  workingDayHolidays(rules);
  const cursor = new Date(start + 'T00:00:00Z');
  for (let left = days; left > 0;) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(cursor.toISOString().slice(0, 10), rules)) left--;
  }
  return cursor.toISOString().slice(0, 10);
}
/** Batas pembayaran: `paymentWorkingDays` hari kerja sejak laporan assessment rekap dan invoice di-ACC (jawaban client). */
export const paymentDueDate = (approvedDate: string, rules: ServiceRules = defaultServiceRules) => addWorkingDays(approvedDate, rules.paymentWorkingDays, rules);
