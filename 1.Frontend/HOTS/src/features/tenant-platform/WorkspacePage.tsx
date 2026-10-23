import {useEffect, useMemo, useRef, useState} from 'react';
import {createHttpClient} from '@hots/app-core';
import {createTenantClient, TenantProvider, useTenantClient, useActiveWorkspace, TenantBrand, type TenantBootstrap} from '@hots/tenant-client';
import type {BrandConfig} from '@hots/tenant-contracts';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {PilotTicketList} from './PilotTicketList';
import {ContentStudio} from '../content-studio/Studio';
import {createServerStudio} from '../content-studio/server';
const tenantApiOrigin = import.meta.env.VITE_TENANT_API_ORIGIN || window.location.origin;
const tenantApiPath = import.meta.env.VITE_TENANT_API_PATH || '/api/tenant/v1';
if (!/^\/api(?:\/[a-z0-9_-]+)+$/i.test(tenantApiPath)) throw new Error('Invalid tenant API base path');

function WorkspaceChooser() {
 const client = useTenantClient(), workspace = useActiveWorkspace();
 const [bootstrap, setBootstrap] = useState<TenantBootstrap | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [brand, setBrand] = useState<BrandConfig | null>(null);
 const [invitation, setInvitation] = useState('');
 useEffect(() => {let active = true; client.bootstrap().then(value => {if (active) setBootstrap(value);}).catch(() => {if (active) setError('Workspace belum tersedia. Silakan masuk kembali atau hubungi administrator.');});return () => {active = false; client.clear();};}, [client]);
 async function choose(id: number) {
  setBusy(true); setError(''); setBrand(null);
  try { await client.selectCompany(id); setBrand(await client.brand()); }
  catch { setError('Workspace tidak dapat dibuka. Periksa akses perusahaan Anda lalu coba lagi.'); }
  finally {setBusy(false);}
 }
 async function accept() {
  setBusy(true);setError('');setBrand(null);
  try {await client.acceptInvitation(invitation);setInvitation('');setBootstrap(await client.bootstrap());}
  catch {setError('Undangan tidak dapat diterima. Periksa kode undangan dan akun yang digunakan.');}
  finally {setBusy(false);}
 }
 const content = <main className="mx-auto max-w-3xl p-6 space-y-4">
  <Card><CardHeader>{brand?.asset && <img className="h-12 w-auto max-w-48 object-contain self-start" src={brand.asset.url} alt={brand.brand.display_name} />}<CardTitle>{brand?.brand.display_name || 'Pilih perusahaan'}</CardTitle></CardHeader><CardContent className="space-y-4">
   {error && <div><p role="alert">{error}</p><a className="underline" href={`${tenantApiOrigin}${tenantApiPath}/sso/start`}>Masuk dengan SSO</a></div>}
   {!bootstrap && !error && <p role="status">Memuat perusahaan Anda…</p>}
   {bootstrap && <p>Program: {bootstrap.tenant_key}</p>}
   {bootstrap?.companies.length === 0 && <p>Akun Anda aktif. Akses perusahaan dan campaign akan tersedia setelah undangan diterima.</p>}
   <div className="flex flex-wrap gap-3">{bootstrap?.companies.map(company => <Button key={company.company_id} disabled={busy} onClick={() => choose(company.company_id)} variant={workspace?.context.company_id === company.company_id ? 'default' : 'outline'}>{company.company_name}</Button>)}</div>
   {workspace && <p role="status">Perusahaan aktif: {bootstrap?.companies.find(c => c.company_id === workspace.context.company_id)?.company_name}</p>}
   {bootstrap && <form className="space-y-2 border-t pt-4" onSubmit={event => {event.preventDefault();void accept();}}><label htmlFor="company-invitation">Kode undangan perusahaan</label><Input id="company-invitation" autoComplete="off" value={invitation} onChange={event => setInvitation(event.target.value)} /><Button type="submit" disabled={busy || !invitation}>Terima undangan</Button></form>}
  </CardContent></Card>
  <PilotTicketList/>
  <WorkspaceStudio/>
 </main>;
 return brand && workspace ? <TenantBrand config={brand}>{content}</TenantBrand> : content;
}

function WorkspaceStudio(){
 const workspace=useActiveWorkspace(),context=useRef<string|null>(null);
 context.current=workspace?.context_id??null;
 const port=useMemo(()=>createServerStudio(createHttpClient({baseUrl:tenantApiOrigin,csrfCookieName:import.meta.env.VITE_TENANT_CSRF_COOKIE||'cineva_csrf'}),()=>context.current),[]);
 if(workspace?.context.tenant_key!=='cineva')return null;
 return <ContentStudio key={workspace.context_id} port={port}/>;
}

/** Additive entry. Does not imply legacy /cineva routes already enforce tenant isolation. */
export default function WorkspacePage() {
 const client = useMemo(() => {
  const http = createHttpClient({baseUrl: tenantApiOrigin, csrfCookieName: import.meta.env.VITE_TENANT_CSRF_COOKIE || 'cineva_csrf'});
  return createTenantClient({transport: async (path, options) => {
   try {
    const response = await http.request({url: `${tenantApiPath}${path}`, method: options.method, data: options.body, signal: options.signal, headers: options.context_id ? {'X-Workspace-Context': options.context_id} : {}});
    return response.data.data;
   } catch (error) {throw Object.assign(new Error('Workspace request failed'), {status: (error as {response?: {status?: number}}).response?.status});}
  }});
 }, []);
 return <TenantProvider client={client}><WorkspaceChooser/></TenantProvider>;
}
