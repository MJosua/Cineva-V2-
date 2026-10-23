import { ReferenceAccounts } from '../cineva-reference/ReferenceAccounts';
import { StudioPreview } from '../content-studio/Studio';
import { useMemo, useState } from 'react';
import { ServiceDesk } from '../cineva-inquiries/ServiceDesk';
import { CampaignDesk } from '../cineva-campaigns/CampaignDesk';
import { ExecutionPanel } from '../cineva-campaigns/ExecutionPanel';
import { FinancePanel } from '../cineva-campaigns/FinancePanel';
import type { Actor } from '../cineva-inquiries/domain';
import { createAppStorage } from '@hots/app-core';
import { demoIdentities } from '../cineva-inquiries/repository';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { createDummyRepository } from './dummyRepository';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext';
import { ProductSidebar } from './ProductSidebar';
import { productNavigation } from './navigation';
import { SummaryCards } from './SummaryCards';
import { JobCards } from './JobCards';
import { JobDetail } from './JobDetail';
import { CalendarView } from './CalendarView';
import { ClientsView } from '../cineva-hq/ClientsView';
import { EstimatorView } from '../cineva-hq/EstimatorView';
import { AssistantView, PaymentsView, RemindersView, SubscriptionView } from '../creator-space/CreatorViews';
import type { CinevaRepository, Product } from './model';
const dummyRepository = createDummyRepository();
const identityStorage = createAppStorage('cineva_demo_identity_v1');
export function CinevaProgram({ basePath = '/cineva', repository = dummyRepository }: {
    basePath?: string;
    repository?: CinevaRepository;
}) {
    const location = useLocation(), [product, screen = 'dashboard'] = location.pathname.slice(basePath.length).split('/').filter(Boolean);
    const [identities, setIdentities] = useState(() => {
        const saved = identityStorage.get<{ hq: string; creator: string }>('selected');
        return { hq: saved && demoIdentities.hq.includes(saved.hq) ? saved.hq : 'hq-1', creator: saved && demoIdentities.creator.includes(saved.creator) ? saved.creator : 'creator-1' };
    });
    const activeProduct = product === 'creator' ? 'creator' : 'hq';
    const actor: Actor = { product: activeProduct, id: identities[activeProduct] };
    const activeRepository = useMemo(() => actor.id.endsWith('-1') ? repository : createDummyRepository(`cineva_dummy_v1_${actor.id}`), [actor.id, repository]);
    const onIdentityChange = (id: string) => {
        if (!demoIdentities[activeProduct].includes(id)) return;
        setIdentities(current => { const next = { ...current, [activeProduct]: id }; identityStorage.set('selected', next); return next; });
    };
    if (product !== 'hq' && product !== 'creator')
        return <Navigate to={`${basePath}/hq/dashboard`} replace/>;
    return <WorkspaceProvider key={actor.id} product={product} repository={activeRepository}><AppLayout sidebar={<ProductSidebar product={product} basePath={basePath}/>} headerTitle={product === 'hq' ? 'Cineva HQ' : 'Cineva Creator Space'} headerSubtitle="HOTS / CMS · Preview workspace" offline><WorkspaceScreen product={product} screen={screen} basePath={basePath} actor={actor} onIdentityChange={onIdentityChange}/></AppLayout></WorkspaceProvider>;
}
function WorkspaceScreen({ product, screen, basePath, actor, onIdentityChange }: {
    product: Product;
    screen: string;
    basePath: string;
    actor: Actor;
    onIdentityChange: (id: string) => void;
}) {
    const { data, loading, busy, error, notice, reset } = useWorkspace(), [selected, setSelected] = useState<string | null>(null);
    if (loading)
        return <p role="status">Memuat workspace dummy...</p>;
    if (!data)
        return <p role="alert">{error || 'Workspace tidak tersedia.'}</p>;
    const title = productNavigation[product].find(item => item.key === screen)?.label;
    return <div className="mx-auto max-w-7xl space-y-6 text-foreground" data-testid={`workspace-${product}`}>
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3"><p className="text-xs text-muted-foreground">{screen === 'reference' ? 'Referensi Excel asli · hanya baca · tanpa database atau transaksi.' : 'Preview interaktif · data dummy di browser · tidak terhubung database, pembayaran atau AI nyata.'}</p>{screen !== 'reference' && <Button size="sm" variant="outline" disabled={busy} onClick={() => void reset()}>Reset dummy</Button>}</div>
 <div><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{product === 'hq' ? 'A · Internal operations' : 'B · Creator workspace'}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title ?? 'Halaman tidak ditemukan'}</h1></div>
 {error && <div role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{error}</div>}{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
 {(screen === 'dashboard' || screen === 'payments') && <SummaryCards jobs={data.jobs}/>}
 {screen === 'reference' && product === 'creator' && <ReferenceAccounts basePath={basePath}/>}
 {screen === 'studio' && <StudioPreview actor={actor}/>}
 {screen === 'dashboard' && product === 'creator' && <Link className="inline-block rounded-md border border-border px-4 py-2 text-sm text-primary" to={`${basePath}/creator/reference?account=ref-1`}>Lihat 3 akun dari Excel</Link>}
 {screen === 'dashboard' && <><Card><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div><h2 className="text-xl font-semibold">{product === 'hq' ? 'Produksi terencana, tim selaras.' : 'Hai, Creator.'}</h2><p className="mt-2 text-sm text-muted-foreground">{data.jobs.filter(j => !j.archived && j.status !== 'done').length} job aktif · {data.jobs.filter(j => !j.archived && j.paid < j.fee).length} dengan sisa pembayaran.</p></div><Badge variant="secondary">{product === 'hq' ? 'Campaign · Production · Content Shoot' : data.plan === 'pro' ? 'Creator Pro' : 'Starter preview'}</Badge></CardContent></Card><JobCards onSelect={job => setSelected(job.id)}/></>}
 {['projects', 'jobs', 'archive'].includes(screen) && <JobCards archived={screen === 'archive'} onSelect={job => setSelected(job.id)}/>}
 {screen === 'clients' && product === 'hq' && <ClientsView />}{screen === 'estimator' && product === 'hq' && <EstimatorView />}
 {['services', 'support'].includes(screen) && <ServiceDesk actor={actor} onIdentityChange={onIdentityChange} supportOnly={screen === 'support'}/>}
 {screen === 'campaigns' && <CampaignDesk actor={actor} onIdentityChange={onIdentityChange} renderExecution={props => <ExecutionPanel {...props}/>} renderFinance={props => <FinancePanel {...props}/>}/>}
 {screen === 'calendar' && <CalendarView actorId={actor.id} onSelect={job => setSelected(job.id)}/>}{screen === 'payments' && <PaymentsView onSelect={job => setSelected(job.id)}/>}
 {screen === 'reminders' && product === 'creator' && <RemindersView onSelect={job => setSelected(job.id)}/>}{screen === 'assistant' && product === 'creator' && <AssistantView />}{screen === 'subscription' && product === 'creator' && <SubscriptionView />}
 {!title && <Link className="text-primary underline" to={`${basePath}/${product}/dashboard`}>Kembali ke dashboard</Link>}
 {product === 'hq' && screen === 'projects' && basePath === '/cineva' && <p className="text-sm text-muted-foreground">Halaman existing tetap tersedia: <Link className="text-primary underline" to="/job-marketplace/campaigns">Campaign</Link> · <Link className="text-primary underline" to="/job-marketplace/batches">Batch</Link> · <Link className="text-primary underline" to="/job-marketplace/locations">Lokasi</Link>.</p>}
 {selected && <JobDetail id={selected} onClose={() => setSelected(null)}/>}
 </div>;
}
