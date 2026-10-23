import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ServiceBriefForm } from '../cineva-services/ServiceBriefForm';
import { RateCardEditor } from '../cineva-services/RateCardEditor';
import { useWorkspace } from '../cineva-shared/WorkspaceContext';
import { convertInquiry, type Actor } from './domain';
import { demoIdentities, inquiryRepository as repo } from './repository';
import { InquiryDetail } from './InquiryDetail';
import { SupportQueue } from '../cineva-support/SupportQueue';

export function ServiceDesk({ actor, onIdentityChange, supportOnly = false }: { actor: Actor; onIdentityChange: (id: string) => void; supportOnly?: boolean }) {
  const [, refresh] = useState(0), [selected, setSelected] = useState<string | null>(null), [create, setCreate] = useState(false);
  const [destination, setDestination] = useState('hq-1'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
  const { data, mutate } = useWorkspace();
  useEffect(() => repo.subscribe(() => refresh(n => n + 1)), []);
  const rows = repo.list(actor), row = rows.find(r => r.id === selected);
  const run = (action: () => void | Promise<void>) => { setError(''); setNotice(''); Promise.resolve().then(action).then(() => setNotice('Perubahan layanan dummy tersimpan.')).catch(failure => setError((failure as Error).message)); };
  return <section className="space-y-5" data-testid="service-desk">
    <p className="text-sm text-muted-foreground">Simulasi layanan dan CS lintas workspace. Hanya brief yang dikirim dibagikan ke HQ tujuan; belum otorisasi tenant server.</p>
    <div className="flex flex-wrap items-center gap-3"><label htmlFor="demo-identity">Workspace dummy</label><select id="demo-identity" className="rounded-md border border-input bg-background p-2" value={actor.id} onChange={e => onIdentityChange(e.target.value)}>{demoIdentities[actor.product].map(id => <option key={id}>{id}</option>)}</select>
      {!supportOnly && <Button onClick={() => { setCreate(!create); setSelected(null); setSubmissionId(crypto.randomUUID()); }}>{create ? 'Tutup brief' : 'Permintaan jasa baru'}</Button>}
    </div>
    {error && <p role="alert" className="text-destructive">{error}</p>}{notice && <p role="status">{notice}</p>}
    {actor.product === 'hq' && !supportOnly && <RateCardEditor rates={repo.rates(actor)} onSave={next => run(() => repo.saveRates(actor, next))}/>}
    {create && !supportOnly && <><label htmlFor="destination-hq">Kirim ke HQ</label><select id="destination-hq" className="rounded-md border border-input bg-background p-2" value={actor.product === 'hq' ? actor.id : destination} disabled={actor.product === 'hq'} onChange={e => setDestination(e.target.value)}>{demoIdentities.hq.map(id => <option key={id}>{id}</option>)}</select>
      <ServiceBriefForm key={destination} draft={repo.draft(actor, actor.product === 'hq' ? actor.id : destination)} onDraft={draft => repo.saveDraft(actor, actor.product === 'hq' ? actor.id : destination, draft)} rates={repo.rates(actor, actor.product === 'hq' ? actor.id : destination)} onSend={(type, values) => run(() => { const saved = repo.create(submissionId, actor, actor.product === 'hq' ? actor.id : destination, type, values); repo.saveDraft(actor, actor.product === 'hq' ? actor.id : destination, null); setSelected(saved.id); setCreate(false); })}/></>}
    {supportOnly ? <SupportQueue inquiries={rows} actor={actor} selected={selected} onSelect={id => { setSelected(id); setCreate(false); }}/> : <div className="flex flex-wrap gap-2" aria-label="Daftar permintaan">{rows.map(item => <Button key={item.id} variant={item.id === selected ? 'default' : 'outline'} onClick={() => { setSelected(item.id); setCreate(false); }}>{String(item.brief.title)} · {item.status}</Button>)}</div>}
    {!rows.length && <p>Belum ada permintaan untuk workspace ini.</p>}
    {row && <InquiryDetail key={row.id} projectAvailable={Boolean(data?.jobs.some(job => job.id === row.projectId))} row={row} actor={actor} repo={repo} run={run} convert={async () => {
      const latest = repo.get(row.id, actor);
      if (actor.product !== 'hq' || latest.destination !== actor.id) throw new Error('HQ tujuan tidak cocok.');
      const ok = await mutate(current => convertInquiry(latest, current));
      if (!ok) throw new Error('Project gagal disimpan; inquiry tetap dapat dicoba ulang.');
      repo.update(row.id, actor, value => ({ ...value, projectId: `inquiry-${row.id}` }));
    }}/>}
  </section>;
}
