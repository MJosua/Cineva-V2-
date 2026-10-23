import { canRead, type Actor, type Inquiry, type SupportMode } from '../cineva-inquiries/domain';

export interface SupportEvent {
  id: string; at: string; actor: string; from: SupportMode; to: SupportMode;
  previousAgent?: string; agent?: string;
}
export type SupportInquiry = Inquiry & { supportEvents?: SupportEvent[] };
export interface SupportFilter { search: string; mode: SupportMode | 'all'; agent: string }

/** Additive audit metadata for the dummy adapter; existing mode/agent contracts are retained. */
export function changeSupport<T extends SupportInquiry>(row: T, actor: Actor, next: SupportMode,
  options: { agent?: string; at?: string; eventId?: string } = {}): T {
  if (!canRead(row, actor)) throw new Error('Percakapan tidak tersedia di workspace ini.');
  const agent = next === 'human' ? options.agent?.trim() : undefined;
  if (next === 'human' && (actor.product !== 'hq' || !agent || agent.length > 100))
    throw new Error('Penugasan memerlukan agen HQ yang valid.');
  if (next === 'resolved' && (actor.product !== 'hq' || row.support !== 'human'))
    throw new Error('Agen HQ menyelesaikan percakapan manusia terlebih dahulu.');
  if (next === 'human' && !['waiting', 'human'].includes(row.support))
    throw new Error('Minta bantuan manusia sebelum mengambil percakapan.');
  if (next === 'waiting' && row.support === 'resolved')
    throw new Error('Buka kembali percakapan ke AI sebelum handover.');
  if (row.support === next && row.agent === agent) return row;
  const id = options.eventId ?? crypto.randomUUID();
  const existing = row.supportEvents?.find(event => event.id === id);
  if (existing) throw new Error('ID perubahan CS sudah digunakan.');
  const at = options.at ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(at))) throw new Error('Waktu perubahan CS tidak valid.');
  return { ...row, support: next, agent, supportEvents: [...(row.supportEvents ?? []),
    { id, at, actor: actor.id, from: row.support, to: next, previousAgent: row.agent, agent }] };
}

export function filterSupportQueue(rows: Inquiry[], actor: Actor, filter: SupportFilter) {
  const search = filter.search.trim().toLocaleLowerCase('id-ID');
  return rows.filter(row => canRead(row, actor)
    && (filter.mode === 'all' || row.support === filter.mode)
    && (!filter.agent || row.agent === filter.agent)
    && (!search || [row.id, row.brief.title, row.brief.brand, row.agent, ...row.messages.map(message => message.text)]
      .some(value => String(value ?? '').toLocaleLowerCase('id-ID').includes(search))));
}

export function supportQueueCounts(rows: Inquiry[], actor: Actor): Record<SupportMode, number> {
  return rows.filter(row => canRead(row, actor)).reduce((counts, row) => {
    counts[row.support] += 1; return counts;
  }, { ai: 0, waiting: 0, human: 0, resolved: 0 });
}
