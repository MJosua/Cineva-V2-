import { Button } from '@/components/ui/button';
import { briefSchema } from '../cineva-services/catalog';
import { QuoteNegotiation } from './QuoteNegotiation';
import { ConversationPanel } from '../cineva-support/ConversationPanel';
import { money } from '../cineva-shared/model';
import { transition, type Actor, type Inquiry } from './domain';
import type { InquiryRepository } from './repository';
export function InquiryDetail({ row, actor, repo, run, convert, projectAvailable }: { row: Inquiry; actor: Actor; repo: InquiryRepository; run: (action: () => void | Promise<void>) => void; convert: () => Promise<void>; projectAvailable: boolean }) {
  const move = (next: Parameters<typeof transition>[1]) => run(() => { repo.update(row.id, actor, value => transition(value, next, actor)); });
  return <article className="space-y-4 rounded-md border border-border bg-card p-5" data-testid="inquiry-detail">
    <h2 className="text-xl font-semibold">{String(row.brief.title)}</h2><p>{row.type} · {row.owner} → {row.destination}</p><p>Status inquiry: <strong>{row.status}</strong></p>
    <p>Budget client: {money(Number(row.brief.budget))} · PIC: {String(row.brief.contact)}</p>
    <dl className="grid gap-2 sm:grid-cols-2">{briefSchema(row.type).fields.map(field => <div key={field.name}><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="break-words">{String(row.brief[field.name] ?? '')}</dd></div>)}</dl>
    <QuoteNegotiation row={row} actor={actor} rates={repo.rates(actor)} apply={change => run(() => { repo.update(row.id, actor, change); })}/>
    <div className="flex flex-wrap gap-2">
      {actor.product === 'hq' && row.status === 'submitted' && <Button onClick={() => move('reviewing')}>Mulai review</Button>}
      {actor.product === 'hq' && row.status === 'reviewing' && <Button onClick={() => move('quoted')}>Kirim penawaran</Button>}
      {actor.product === 'hq' && ['submitted', 'reviewing', 'quoted', 'changes_requested'].includes(row.status) && <Button variant="outline" onClick={() => move('rejected')}>Tolak permintaan</Button>}
      {actor.id === row.owner && ['submitted', 'reviewing', 'quoted', 'changes_requested'].includes(row.status) && <Button variant="outline" onClick={() => move('cancelled')}>Batalkan permintaan</Button>}
      {actor.product === 'hq' && row.status === 'accepted' && <Button disabled={Boolean(row.projectId) && projectAvailable} onClick={() => run(convert)}>{row.projectId && projectAvailable ? 'Project sudah dibuat' : 'Jadikan project'}</Button>}
    </div>
    {row.projectId && <p role="status">Project dummy: {row.projectId}. Alokasikan crew/gear melalui Crew & schedule; belum merupakan booking otomatis.</p>}
    <ConversationPanel row={row} actor={actor} repo={repo} run={run}/>
  </article>;
}
