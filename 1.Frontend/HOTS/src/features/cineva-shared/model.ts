import { findResourceConflict } from './scheduling.ts';
/** Cineva domain view model, not physical DB schema. Persist through HOTS adapters later. */
export type Product = 'hq' | 'creator';
export type JobStatus = 'running' | 'wait_pay' | 'done';
export type ProjectType = 'Campaign' | 'Production' | 'Content Shoot';
export interface Client {
    id: string;
    name: string;
    contact: string;
    email: string;
}
export interface Resource {
    role?: import('../cineva-hq/booking').SpecialistRole;
    id: string;
    name: string;
    kind: 'crew' | 'gear';
}
export interface Job {
    sourceQuote?: import('../cineva-services/pricing').Quote;
    serviceWorkflow?: import('../cineva-services/workflow').ServiceWorkflowState;
    requiredRoles?: import('../cineva-hq/booking').SpecialistRole[];
    booking?: import('../cineva-hq/booking').BookingRecord;
    /** Dummy view-model reference; not a physical database column. */
    sourceInquiryId?: string;
    id: string;
    ticketId: string;
    clientId: string;
    title: string;
    brief: string;
    type: ProjectType;
    status: JobStatus;
    platform: string;
    scheduledAt: string;
    durationHours: number;
    fee: number;
    paid: number;
    barter: number;
    archived: boolean;
    resourceIds: string[];
    deliverables: string[];
}
export interface Workspace {
    product: Product;
    clients: Client[];
    resources: Resource[];
    jobs: Job[];
    plan: 'starter' | 'pro';
}
export interface JobDraft {
    title: string;
    brief: string;
    clientId: string;
    type: ProjectType;
    platform: string;
    scheduledAt: string;
    durationHours: number;
    fee: number;
    barter: number;
    resourceIds: string[];
}
export interface CinevaRepository {
    load(product: Product): Promise<Workspace>;
    save(workspace: Workspace): Promise<void>;
    reset(product: Product): Promise<Workspace>;
}
export const demoClock = new Date('2026-10-18T08:00:00+07:00');
export const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
export const statusLabels: Record<JobStatus, string> = { running: 'Running', wait_pay: 'Wait Pay', done: 'Done' };
export const jobDate = (value: string) => new Date(value + '+07:00');
export function financials(jobs: Job[]) {
    return jobs.reduce((total, job) => ({ fee: total.fee + job.fee, paid: total.paid + job.paid, unpaid: total.unpaid + Math.max(0, job.fee - job.paid), barter: total.barter + job.barter }), { fee: 0, paid: 0, unpaid: 0, barter: 0 });
}
export const paymentLabel = (job: Job) => job.fee === 0 ? 'Barter / tanpa cash' : job.paid >= job.fee ? 'Paid' : job.paid > 0 ? 'Partial' : 'Unpaid';
export function validateDraft(draft: JobDraft, workspace: Workspace, excludeId?: string) {
    if (!draft.title.trim() || !workspace.clients.some(c => c.id === draft.clientId))
        throw new Error('Judul dan client wajib diisi.');
    if (!['Campaign', 'Production', 'Content Shoot'].includes(draft.type))
        throw new Error('Jenis project tidak valid.');
    if (!draft.platform.trim() || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(draft.scheduledAt) || !Number.isFinite(jobDate(draft.scheduledAt).getTime()) || jobDate(draft.scheduledAt).toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) !== draft.scheduledAt.slice(0, 10))
        throw new Error('Platform dan jadwal wajib valid.');
    if (![draft.fee, draft.barter].every(n => Number.isSafeInteger(n) && n >= 0) || !Number.isFinite(draft.durationHours) || draft.durationHours <= 0 || draft.durationHours > 24)
        throw new Error('Nominal harus rupiah bulat positif dan durasi 1–24 jam.');
    if (draft.resourceIds.some(id => !workspace.resources.some(r => r.id === id)))
        throw new Error('Resource tidak ditemukan di workspace ini.');
    const clash = findResourceConflict(draft, workspace, excludeId);
    if (clash)
        throw new Error(`Jadwal resource bertabrakan dengan ${clash.title}.`);
}
export function createJob(draft: JobDraft, workspace: Workspace, id: string): Job {
    validateDraft(draft, workspace);
    if (workspace.product === 'creator' && workspace.plan === 'starter' && workspace.jobs.filter(j => !j.archived && j.status !== 'done').length >= 3)
        throw new Error('Batas Starter: 3 job aktif. Coba simulasi Pro di halaman Paket.');
    return { ...draft, title: draft.title.trim(), id, ticketId: `DUMMY-${id}`, status: 'running', paid: 0, archived: false, deliverables: [] };
}
export function addPayment(job: Job, amount: number): Job {
    if (!Number.isSafeInteger(amount) || amount <= 0 || job.paid + amount > job.fee)
        throw new Error('Pembayaran harus lebih dari nol dan tidak melebihi sisa fee.');
    return { ...job, paid: job.paid + amount };
}
export function estimateBudget(type: ProjectType, crew: number, days: number, gear: number) {
    if (![crew, days, gear].every(Number.isSafeInteger) || crew < 1 || days < 1 || gear < 0 || crew > 100 || days > 365 || gear > 100)
        throw new Error('Masukkan crew/hari minimal 1 dan gear minimal 0 dalam batas yang wajar.');
    const base = { Campaign: 3000000, Production: 7500000, 'Content Shoot': 1500000 }[type];
    return { base, crew: crew * 350000 * days, gear: gear * 250000 * days, total: base + crew * 350000 * days + gear * 250000 * days };
}
