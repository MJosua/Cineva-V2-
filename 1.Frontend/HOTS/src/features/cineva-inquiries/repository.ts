import { createAppStorage } from '@hots/app-core';
import type { FormValues } from '@hots/dynamic-form';
import { briefSchema } from '../cineva-services/catalog';
import { defaultRates, estimate, type RateCard } from '../cineva-services/pricing';
import type { ProjectType } from '../cineva-shared/model';
import { canRead, validateBrief, type Actor, type Inquiry } from './domain';
import { acceptedQuoteSnapshot } from './quotes';

interface Store { requests: Inquiry[]; rates: Record<string, RateCard>; drafts?: Record<string, { type: ProjectType; values: FormValues }> }
export interface StoragePort { get<T>(key: string): T | null | undefined; set(key: string, value: unknown): void }
export const demoIdentities = { creator: ['creator-1', 'creator-2'], hq: ['hq-1', 'hq-2'] };
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
export function createInquiryRepository(storage: StoragePort) {
  const listeners = new Set<() => void>();
  const read = (): Store => storage.get<Store>('shared-requests') ?? { requests: [], rates: {} };
  const write = (data: Store, notify = true) => {
    const previous = read();
    storage.set('shared-requests', data);
    if (JSON.stringify(storage.get('shared-requests')) !== JSON.stringify(data)) {
      storage.set('shared-requests', previous);
      throw new Error('Penyimpanan inquiry dummy gagal.');
    }
    if (notify) listeners.forEach(fn => fn());
  };
  const assertActor = (actor: Actor) => { if (!demoIdentities[actor.product].includes(actor.id)) throw new Error('Identitas dummy tidak dikenal.'); };
  const get = (id: string, actor: Actor) => {
    assertActor(actor); const row = read().requests.find(r => r.id === id);
    if (!row || !canRead(row, actor)) throw new Error('Inquiry tidak tersedia untuk workspace ini.');
    return clone(row);
  };
  return {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    list(actor: Actor) { assertActor(actor); return clone(read().requests.filter(r => canRead(r, actor))); },
    get,
    draft(actor: Actor, destination: string) { assertActor(actor); return clone(read().drafts?.[`${actor.id}:${destination}`] ?? null); },
    saveDraft(actor: Actor, destination: string, draft: { type: ProjectType; values: FormValues } | null) {
      assertActor(actor); const state = read(), drafts = { ...state.drafts }, key = `${actor.id}:${destination}`;
      if (draft) drafts[key] = clone(draft); else delete drafts[key];
      write({ ...state, drafts }, false);
    },
    rates(actor: Actor, destination = actor.id) { assertActor(actor); return clone(read().rates[destination] ?? defaultRates); },
    saveRates(actor: Actor, rates: RateCard) {
      assertActor(actor); if (actor.product !== 'hq') throw new Error('Hanya HQ dapat mengubah tarif sendiri.');
      for (const type of Object.keys(rates.base) as ProjectType[]) estimate(type, 1, 1, 0, rates);
      const state = read(), previous = state.rates[actor.id] ?? defaultRates;
      if (rates.version === previous.version && JSON.stringify(rates) !== JSON.stringify(previous)) throw new Error('Gunakan versi tarif baru saat mengubah harga.');
      write({ ...state, rates: { ...state.rates, [actor.id]: clone(rates) } });
    },
    create(id: string, actor: Actor, destination: string, type: ProjectType, values: FormValues) {
      assertActor(actor);
      if (!demoIdentities.hq.includes(destination) || (actor.product === 'hq' && actor.id !== destination)) throw new Error('HQ tujuan tidak valid.');
      const state = read(), existing = state.requests.find(r => r.id === id);
      const brief = Object.fromEntries(briefSchema(type).fields.map(field => [field.name, values[field.name] ?? ''])) as FormValues;
      if (existing) {
        if (existing.owner !== actor.id || existing.destination !== destination || existing.type !== type || JSON.stringify(existing.brief) !== JSON.stringify(brief)) throw new Error('ID request sudah digunakan. Buka permintaan tersimpan atau mulai brief baru.');
        return clone(existing);
      }
      validateBrief(type, brief);
      const quote = estimate(type, Number(brief.days), Number(brief.crew), Number(brief.gear), state.rates[destination] ?? defaultRates);
      const row: Inquiry = { id, owner: actor.id, destination, type, brief, quote, status: 'submitted', support: 'ai', messages: [] };
      write({ ...state, requests: [...state.requests, row] }); return clone(row);
    },
    update(id: string, actor: Actor, change: (row: Inquiry) => Inquiry) {
      const row = get(id, actor), next = change(clone(row));
      if (next.id !== row.id || next.owner !== row.owner || next.destination !== row.destination) throw new Error('Ownership inquiry tidak boleh berubah.');
      if (row.status === 'accepted') {
        if (next.status !== 'accepted' || next.acceptedQuoteRevision !== row.acceptedQuoteRevision || JSON.stringify(acceptedQuoteSnapshot(row)) !== JSON.stringify(acceptedQuoteSnapshot(next)))
          throw new Error('Penawaran yang disetujui terkunci.');
      }
      for (const snapshot of row.quoteHistory ?? []) if (JSON.stringify(next.quoteHistory?.find(quote => quote.revision === snapshot.revision)) !== JSON.stringify(snapshot))
        throw new Error('Riwayat versi penawaran tidak boleh diubah.');
      if (next.status === 'accepted') acceptedQuoteSnapshot(next);
      const state = read(); write({ ...state, requests: state.requests.map(r => r.id === id ? next : r) }); return clone(next);
    },
  };
}
export type InquiryRepository = ReturnType<typeof createInquiryRepository>;
// Explicit shared request envelope only. Never stores full Creator jobs/financial data.
export const inquiryRepository = createInquiryRepository(createAppStorage('cineva_services_dummy_v1'));
