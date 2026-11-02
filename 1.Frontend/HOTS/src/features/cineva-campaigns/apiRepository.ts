import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign, TalentAssignment } from './model';
import { planAssignmentCalls, planCampaignCalls, planCreateBody, toCampaign, trialIdentities, type ApiCall, type IdentityMap } from './apiMapping.ts';

/**
 * Repository campaign yang membaca dan menulis lewat API `/api/cineva/v1`, dengan bentuk yang sama seperti repository dummy supaya UI tidak berubah.
 * Dibaca dari cache sinkron; setiap mutasi menjalankan reducer lokal (aturan domain frontend tetap berlaku), menerjemahkan hasilnya menjadi panggilan API,
 * lalu memuat ulang dari server. Server adalah sumber kebenaran: aturan yang sama dievaluasi ulang di sana.
 * Header identitas bersifat parameter; `trialHeaders` hanya untuk server percobaan (x-test-principal), bukan autentikasi.
 */
export interface ApiRepositoryOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  headers?: (actor: Actor) => Record<string, string>;
  identities?: IdentityMap;
}
const principals: Record<string, string> = { 'hq-1': 'hq', 'hq-2': 'foreignHq', 'creator-1': 'creator', 'creator-2': 'creator2' };
export const trialHeaders = (actor: Actor): Record<string, string> => ({ 'x-test-principal': principals[actor.id] ?? '' });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const key = (actor: Actor) => `${actor.product}:${actor.id}`;

export function createApiCampaignRepository({ baseUrl, fetchImpl, headers = trialHeaders, identities = trialIdentities }: ApiRepositoryOptions) {
  const listeners = new Set<() => void>();
  const cache = new Map<string, Campaign[]>(), loading = new Map<string, Promise<void>>(), failures = new Map<string, string>();
  const root = baseUrl.replace(/\/+$/, '');
  const notify = () => listeners.forEach(listener => listener());

  async function request(actor: Actor, method: string, path: string, body?: unknown) {
    const run = fetchImpl ?? fetch;
    let response: Response;
    try {
      response = await run(root + path, { method, headers: { 'content-type': 'application/json', ...headers(actor) }, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch { throw new Error(`API percobaan tidak dapat dihubungi di ${root}. Pastikan server menyala, lalu klik Muat ulang.`); }
    let json: { success?: boolean; data?: unknown; error?: { code?: string; message?: string; details?: unknown } } | null = null;
    try { json = await response.json(); } catch { /* handled below */ }
    if (!response.ok || !json?.success) {
      const error = json?.error, details = error?.details as { missing?: string[] } | { message?: string }[] | undefined;
      const extra = Array.isArray(details) ? details.map(item => item.message).filter(Boolean).join('; ') : details?.missing?.length ? details.missing.join(', ') : '';
      throw new Error(`${error?.message ?? error?.code ?? `Permintaan gagal (${response.status})`}${extra ? ` (${extra})` : ''}`);
    }
    return json.data as any;
  }

  async function fetchAll(actor: Actor): Promise<Campaign[]> {
    const list = await request(actor, 'GET', '/campaigns?limit=100');
    const rows: Campaign[] = [];
    for (const item of list.items) {
      const [detail, assignments] = await Promise.all([request(actor, 'GET', `/campaigns/${item.id}`), request(actor, 'GET', `/campaigns/${item.id}/assignments`)]);
      rows.push(toCampaign(detail, assignments.items, identities));
    }
    return rows;
  }
  function load(actor: Actor): Promise<void> {
    const id = key(actor);
    const pending = fetchAll(actor).then(rows => { cache.set(id, rows); failures.delete(id); }, error => { failures.set(id, (error as Error).message); })
      .finally(() => { loading.delete(id); notify(); });
    loading.set(id, pending);
    return pending;
  }
  const project = (row: Campaign, actor: Actor): Campaign => {
    const copy = clone(row);
    if (actor.product === 'creator') {
      copy.assignments = copy.assignments.filter(item => item.creatorId === actor.id);
      const own = new Set(copy.assignments.map(item => item.batchId));
      copy.batches = copy.batches.filter(batch => own.has(batch.id));
    }
    return copy;
  };
  const cached = (actor: Actor) => {
    const rows = cache.get(key(actor));
    if (rows) return rows;
    const failure = failures.get(key(actor));
    if (failure) throw new Error(failure);
    if (!loading.has(key(actor))) void load(actor);
    throw new Error('Memuat campaign dari API percobaan...');
  };
  const reloadAfter = async (actor: Actor, calls: ApiCall[]) => {
    try { for (const call of calls) await request(actor, call.method, call.path, call.body); }
    finally { await load(actor); }
  };

  return {
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    /** Muat ulang dari server untuk identitas tertentu (atau semua yang pernah dimuat). */
    async reload(actor?: Actor) { if (actor) { cache.delete(key(actor)); failures.delete(key(actor)); await load(actor); } else { cache.clear(); failures.clear(); notify(); } },
    getCampaigns(actor: Actor) { return cached(actor).map(row => project(row, actor)); },
    get(id: string, actor: Actor) { const row = cached(actor).find(item => item.id === id); if (!row) throw new Error('Campaign tidak tersedia.'); return project(row, actor); },
    async create(actor: Actor, row: Campaign) {
      if (actor.product !== 'hq') throw new Error('Hanya HQ pemilik dapat membuat campaign.');
      await request(actor, 'POST', '/campaigns', planCreateBody(row));
      await load(actor);
    },
    mutate(actor: Actor, id: string, update: (row: Campaign) => Campaign, _expectedRevision?: number) {
      const row = cached(actor).find(item => item.id === id);
      if (!row || identities.toUserId(actor.id) === undefined) throw new Error('Hanya HQ pemilik dapat mengubah campaign.');
      const next = update(clone(row));
      if (next.id !== row.id || next.ownerId !== row.ownerId) throw new Error('Identitas campaign tidak boleh berubah.');
      return reloadAfter(actor, planCampaignCalls(row, next, identities));
    },
    updateAssignment(actor: Actor, id: string, assignmentId: string, update: (row: TalentAssignment) => TalentAssignment, _expectedRevision?: number) {
      const campaign = cached(actor).find(item => item.id === id), assignment = campaign?.assignments.find(item => item.id === assignmentId);
      if (!campaign || !assignment) throw new Error('Assignment tidak tersedia.');
      const next = update(clone(assignment));
      if (next.id !== assignment.id || next.creatorId !== assignment.creatorId || next.batchId !== assignment.batchId) throw new Error('Identitas assignment tidak boleh berubah.');
      return reloadAfter(actor, planAssignmentCalls(assignment, next));
    },
  };
}
export type ApiCampaignRepository = ReturnType<typeof createApiCampaignRepository>;
