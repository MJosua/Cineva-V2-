import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Actor } from '../cineva-inquiries/domain';
import { demoIdentities } from '../cineva-inquiries/repository';
import type { Campaign, TalentAssignment } from './model';
import { campaignRepository, type CampaignRepository } from './repository';
import { CampaignEditor } from './CampaignEditor';
import { AssignmentEditor } from './AssignmentEditor';
import { CampaignSetup, DeliverableEditor } from './CampaignSetup';

export interface AssignmentPanelProps {
  assignment: TalentAssignment; products: Campaign['products']; actor: Actor;
  onChange: (update: (latest: TalentAssignment) => TalentAssignment) => void;
}
export function CampaignDesk({ actor, onIdentityChange, repository = campaignRepository, renderExecution, renderFinance }: {
  actor: Actor; onIdentityChange: (id: string) => void; repository?: CampaignRepository;
  renderExecution?: (props: AssignmentPanelProps) => ReactNode; renderFinance?: (props: AssignmentPanelProps) => ReactNode;
}) {
  const [, refresh] = useState(0), [selected, setSelected] = useState(''), [creating, setCreating] = useState(false), [adding, setAdding] = useState(false), [error, setError] = useState(''), [batchName, setBatchName] = useState('');
  useEffect(() => repository.subscribe(() => refresh(value => value + 1)), [repository]);
  let rows: Campaign[] = [], readError = '';
  try { rows = repository.getCampaigns(actor); } catch (failure) { readError = (failure as Error).message; }
  const campaign = rows.find(row => row.id === selected) ?? rows[0];
  const act = (action: () => void) => { try { action(); setError(''); } catch (failure) { setError((failure as Error).message); } };
  return <section className="space-y-5" aria-label="Campaign operations">
    <label className="block space-y-2 text-sm">Workspace dummy<select aria-label="Workspace dummy" className="ml-2 rounded-md border border-input bg-background p-2" value={actor.id} onChange={event => { onIdentityChange(event.target.value); setSelected(''); setCreating(false); setAdding(false); setError(''); }}>{demoIdentities[actor.product].map(id => <option key={id}>{id}</option>)}</select></label>
    <p className="text-sm text-muted-foreground">Campaign → batch → talent assignment. Berbeda dari job jasa; hanya fixture sintetis, bukan data workbook asli.</p>
    {(error || readError) && <p role="alert" className="text-destructive">{error || readError}</p>}
    {actor.product === 'hq' && <Button variant="outline" onClick={() => setCreating(value => !value)}>Buat campaign</Button>}
    {creating && actor.product === 'hq' && <CampaignEditor ownerId={actor.id} onSave={row => { repository.create(actor, row); setSelected(row.id); setCreating(false); }}/>}
    <div className="flex flex-wrap gap-2">{rows.map(row => <Button variant={campaign?.id === row.id ? 'default' : 'outline'} key={row.id} onClick={() => { setSelected(row.id); setAdding(false); }}>{row.title}</Button>)}</div>
    {!campaign && <p>Belum ada campaign atau assignment untuk workspace ini.</p>}
    {campaign && <article key={campaign.id} className="space-y-5 rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">{campaign.title}</h2><p className="text-sm">{campaign.brand} · {campaign.brief}</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="font-semibold">Objective</dt><dd>{campaign.objective}</dd></div><div><dt className="font-semibold">Audience</dt><dd>{campaign.audience}</dd></div><div><dt className="font-semibold">Key messaging</dt><dd>{campaign.messaging}</dd></div></dl>
      <section><h3 className="font-semibold">Milestone campaign</h3><ul className="list-inside list-disc text-sm">{campaign.milestones.map(item => <li key={item.id}>{item.title} · {item.deadline}</li>)}</ul></section>
      <p className="text-sm">Batch: {campaign.batches.map(batch => batch.name).join(', ')}</p>
      {actor.product === 'hq' && <CampaignSetup onChange={update => repository.mutate(actor, campaign.id, update, campaign.revision ?? 0)}/>}
      {actor.product === 'hq' && <><form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); act(() => { if (!batchName.trim()) throw new Error('Isi nama batch.'); repository.mutate(actor, campaign.id, row => ({ ...row, batches: [...row.batches, { id: `batch-${crypto.randomUUID()}`, name: batchName.trim() }] }), campaign.revision ?? 0); setBatchName(''); }); }}><Input aria-label="Nama batch baru" value={batchName} onChange={event => setBatchName(event.target.value)} required/><Button variant="outline">Tambah batch</Button></form><Button variant="outline" onClick={() => setAdding(value => !value)}>Tambah talent assignment</Button>{adding && <AssignmentEditor campaign={campaign} onSave={assignment => { repository.mutate(actor, campaign.id, row => ({ ...row, assignments: [...row.assignments, assignment] }), campaign.revision ?? 0); setAdding(false); }}/>}</>}
      <h3 className="font-semibold">Talent assignments ({campaign.assignments.length})</h3>
      {campaign.assignments.map(assignment => {
        const props: AssignmentPanelProps = { assignment, products: campaign.products, actor, onChange: update => act(() => repository.updateAssignment(actor, campaign.id, assignment.id, update, campaign.revision ?? 0)) };
        return <section key={assignment.id} aria-label={`Assignment ${assignment.creatorName}`} className="space-y-4 rounded-md border border-border p-4"><h4 className="font-semibold">{assignment.creatorName} · {campaign.batches.find(batch => batch.id === assignment.batchId)?.name}</h4>
          {assignment.socialProfiles.map((profile, index) => <p key={index} className="text-sm">{profile.platform} · {profile.handle} · Followers {profile.followers === null ? 'Belum tersedia' : profile.followers.toLocaleString('id-ID')} · Snapshot {profile.capturedAt}</p>)}
          <ul className="list-inside list-disc text-sm">{assignment.deliverables.map(item => <li key={item.id}>{item.title} · {item.platform} · {item.postingRequired ? 'Posting Creator' : 'Asset brand'} · {item.deadline}</li>)}</ul>
          {actor.product === 'hq' && <DeliverableEditor onChange={props.onChange}/>}{renderExecution?.(props)}{renderFinance?.(props)}
        </section>;
      })}
    </article>}
  </section>;
}
