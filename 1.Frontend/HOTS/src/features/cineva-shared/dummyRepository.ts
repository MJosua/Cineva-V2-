import { createAppStorage } from '@hots/app-core';
import type { CinevaRepository, Product, Workspace, Job } from './model';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const specialists = [
    { id: 'hq-photographer', name: 'Fotografer dummy', kind: 'crew' as const, role: 'photographer' as const },
    { id: 'hq-videographer', name: 'Videografer dummy', kind: 'crew' as const, role: 'videographer' as const },
];
function upgrade(workspace: Workspace): Workspace {
    if (workspace.product !== 'hq') return workspace;
    const resources = workspace.resources ?? [];
    return { ...workspace, resources: [...resources, ...specialists.filter(candidate => !resources.some(resource => resource.id === candidate.id))] };
}
function seed(product: Product): Workspace {
    const prefix = product === 'hq' ? 'hq' : 'creator';
    const clients = [{ id: `${prefix}-navi`, name: 'Navi Cafe (Dummy)', contact: 'Tim Navi', email: 'navi@example.test' }, { id: `${prefix}-brand`, name: 'Luma Studio (Dummy)', contact: 'Tim Luma', email: 'luma@example.test' }];
    const resources = product === 'hq' ? [{ id: 'hq-camera', name: 'Kamera A', kind: 'gear' as const }, { id: 'hq-light', name: 'Lighting kit', kind: 'gear' as const }, { id: 'hq-director', name: 'Crew Director', kind: 'crew' as const }, { id: 'hq-editor', name: 'Crew Editor', kind: 'crew' as const }] : [];
    const shared = { archived: false, platform: 'Instagram', brief: 'Konten sintetis untuk preview Cineva.', durationHours: 2, deliverables: ['Draft brief dummy', 'Preview deliverable CMS — belum terhubung'], resourceIds: [] };
    const jobs: Job[] = [
        { ...shared, id: `${prefix}-1`, ticketId: `DUMMY-${prefix}-1`, clientId: clients[0].id, title: product === 'hq' ? 'Campaign Navi Oktober' : 'Visit Navi Cafe', type: 'Campaign', status: 'running', scheduledAt: '2026-10-19T10:00', fee: product === 'hq' ? 6000000 : 300000, paid: 0, barter: 150000, resourceIds: product === 'hq' ? ['hq-camera', 'hq-director'] : [] },
        { ...shared, id: `${prefix}-2`, ticketId: `DUMMY-${prefix}-2`, clientId: clients[1].id, title: product === 'hq' ? 'Production Luma DVC' : 'Reels Luma Studio', type: 'Production', status: 'wait_pay', scheduledAt: '2026-10-20T09:00', fee: product === 'hq' ? 12000000 : 500000, paid: product === 'hq' ? 4000000 : 200000, barter: 0 },
        { ...shared, id: `${prefix}-3`, ticketId: `DUMMY-${prefix}-3`, clientId: clients[0].id, title: product === 'hq' ? 'Content Shoot Navi' : 'Konten Navi selesai', type: 'Content Shoot', status: 'done', scheduledAt: '2026-10-16T14:00', fee: product === 'hq' ? 2000000 : 200000, paid: product === 'hq' ? 2000000 : 200000, barter: 100000 },
    ];
    return upgrade({ product, clients, resources, jobs, plan: 'starter' });
}
/** NON-SECRET synthetic demo data only. Product partitioning is not tenant authorization. */
export function createDummyRepository(namespace = 'cineva_dummy_v1'): CinevaRepository {
    const storage = createAppStorage(namespace);
    return {
        async load(product) { const stored = storage.get<Workspace>(product); return clone(upgrade(stored?.product === product && Array.isArray(stored.jobs) && Array.isArray(stored.clients) ? stored : seed(product))); },
        async save(workspace) { const next = clone(workspace); storage.set(workspace.product, next); if (JSON.stringify(storage.get(workspace.product)) !== JSON.stringify(next))
            throw new Error('Penyimpanan dummy browser gagal. Data sebelumnya dipertahankan.'); },
        async reset(product) { const data = seed(product); await this.save(data); return clone(data); },
    };
}
