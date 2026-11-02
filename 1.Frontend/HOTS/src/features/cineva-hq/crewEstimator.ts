import { assertServiceRules, defaultServiceRules, projectClass, type CrewRateRole, type ProjectClass, type ServiceRules } from '../cineva-services/rules.ts';

/**
 * Estimator production berbasis budget (A5): hanya jumlah kru dan rekomendasi kru, bukan RAB. Tabel budget ke komposisi
 * kru dimiliki Cineva dan belum diberikan (L6), jadi `null` dan `recommendCrew` melempar galat, bukan menebak.
 * Vendor-only dan additive: tidak mengubah `estimateBudget` atau `EstimatorView` yang ada.
 */
export type CrewComposition = Partial<Record<CrewRateRole, number>>;
export interface CrewBand { minBudget: number; composition: CrewComposition }
export type CrewBandTable = CrewBand[] | null;
export const defaultCrewBands: CrewBandTable = null;

export function assertComposition(composition: CrewComposition, rules: ServiceRules = defaultServiceRules): CrewComposition {
  const roles = Object.keys(assertServiceRules(rules).crewMinimum), entries = Object.entries(composition);
  if (!entries.length) throw new Error('Komposisi kru tidak boleh kosong.');
  for (const [role, count] of entries)
    if (!roles.includes(role) || !Number.isSafeInteger(count) || (count as number) < 1 || (count as number) > 100) throw new Error('Peran atau jumlah kru tidak valid.');
  return composition;
}

/** Perkiraan minimum jasa kru: jumlah x rate minimum per peran x sesi (satu sesi = jam kerja standar, A1). Bukan RAB dan bukan harga final. */
export function minimumCrewCost(composition: CrewComposition, rules: ServiceRules = defaultServiceRules, sessions = 1): number {
  if (!Number.isSafeInteger(sessions) || sessions < 1 || sessions > 365) throw new Error('Jumlah sesi tidak valid.');
  assertComposition(composition, rules);
  const total = Object.entries(composition).reduce((sum, [role, count]) => sum + (count as number) * rules.crewMinimum[role as CrewRateRole], 0) * sessions;
  if (!Number.isSafeInteger(total)) throw new Error('Total minimum kru di luar batas nominal.');
  return total;
}

/** Apakah budget total menutup minimum jasa kru untuk komposisi ini. `remaining` negatif berarti kurang. */
export function crewBudgetCoverage(composition: CrewComposition, totalBudget: number, rules: ServiceRules = defaultServiceRules, sessions = 1) {
  const minimumCost = minimumCrewCost(composition, rules, sessions);
  projectClass(totalBudget, rules);
  return { minimumCost, remaining: totalBudget - minimumCost, covered: totalBudget >= minimumCost };
}

export function assertCrewBands(bands: CrewBand[], rules: ServiceRules = defaultServiceRules): CrewBand[] {
  if (!bands.length) throw new Error('Tabel budget ke kru belum diisi (menunggu jawaban client L6).');
  if (!bands.every(band => Number.isSafeInteger(band.minBudget) && band.minBudget >= 0) || new Set(bands.map(band => band.minBudget)).size !== bands.length)
    throw new Error('Batas budget pada tabel kru harus rupiah bulat dan unik.');
  bands.forEach(band => assertComposition(band.composition, rules));
  return bands;
}

/** Pita dengan batas budget tertinggi yang masih tercapai. Budget di bawah pita terendah ditolak, bukan diberi komposisi karangan. */
export function recommendCrew(totalBudget: number, bands: CrewBandTable = defaultCrewBands, rules: ServiceRules = defaultServiceRules) {
  const kind: ProjectClass = projectClass(totalBudget, rules);
  const table = assertCrewBands(bands ?? [], rules);
  const band = [...table].sort((a, b) => b.minBudget - a.minBudget).find(item => item.minBudget <= totalBudget);
  if (!band) throw new Error('Budget di bawah ambang rekomendasi kru terendah.');
  return { projectClass: kind, composition: band.composition, ...crewBudgetCoverage(band.composition, totalBudget, rules) };
}
