import type { ProjectType } from '../cineva-shared/model';
import { services } from './catalog';
export interface RateCard { version: string; crew: number; gear: number; base: Record<ProjectType, number> }
export interface Quote { revision: number; rateVersion: string; scope?: { days: number; crew: number; gear: number }; items: { label: string; quantity: number; rate: number; subtotal: number }[]; total: number }
export const defaultRates: RateCard = { version: 'DUMMY-1', crew: 350000, gear: 250000,
  base: { Campaign: services.Campaign.base, Production: services.Production.base, 'Content Shoot': services['Content Shoot'].base } };
export function estimate(type: ProjectType, days: number, crew: number, gear: number, rates: RateCard, revision = 1): Quote {
  if (!services[type] || ![days, crew, gear].every(Number.isSafeInteger) || days < 1 || days > 365 || crew < 1 || crew > 100 || gear < 0 || gear > 100)
    throw new Error('Jumlah hari/crew/gear tidak valid.');
  if (!rates.version.trim() || ![rates.base[type], rates.crew, rates.gear].every(n => Number.isSafeInteger(n) && n >= 0))
    throw new Error('Tarif dummy harus rupiah bulat non-negatif dan memiliki versi.');
  const items = [{ label: type, quantity: 1, rate: rates.base[type] },
    { label: 'Crew × hari', quantity: crew * days, rate: rates.crew },
    { label: 'Gear × hari', quantity: gear * days, rate: rates.gear }].map(i => ({ ...i, subtotal: i.quantity * i.rate }));
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  if (!Number.isSafeInteger(total)) throw new Error('Total quote di luar batas nominal.');
  return { revision, rateVersion: rates.version, scope: { days, crew, gear }, items, total };
}
