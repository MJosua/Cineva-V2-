import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Actor } from '../cineva-inquiries/domain';
import type { CampaignProduct, TalentAssignment } from './model';
import { chooseProduct, getDeliveryExecution, progressFulfillment, readExecution, recordPosting, reviewDraft, submitDraft } from './execution';

interface ExecutionProps {
  assignment: TalentAssignment; products: CampaignProduct[]; actor: Actor;
  onChange: (update: (latest: TalentAssignment) => TalentAssignment) => void;
}
const qualityLabels = { not_submitted: 'Belum dikirim', submitted: 'Menunggu QC', revision_requested: 'Perlu revisi', approved: 'QC disetujui' };
const fulfillmentLabels = { pending: 'Belum diproses', ordered: 'Diproses / dipesan', received: 'Diterima' };

function ProductProgress({ assignment, products, actor, onChange }: ExecutionProps) {
  const current = readExecution(assignment), product = current.product;
  return <section className="space-y-2 rounded-md border border-border p-3" aria-label="Produk dan fulfillment">
    <h4 className="font-semibold">Pilihan produk & pemenuhan</h4>
    <p className="text-sm">Pilihan: {product.choice === 'selected' ? `${product.name} · ${product.variant}` : 'Belum dipilih'} · Pemenuhan: {fulfillmentLabels[product.fulfillment]}</p>
    {actor.product === 'creator' && product.fulfillment === 'pending' && products.length > 0 && <label className="block space-y-1 text-sm">Pilih produk campaign<select
      aria-label={`Pilihan produk ${assignment.creatorName}`} className="h-10 w-full rounded-md border border-input bg-background px-3" value={product.productId ?? ''}
      onChange={event => { const id = event.target.value; if (id) onChange(latest => chooseProduct(latest, actor, products, id, current.revision)); }}>
      <option value="">Pilih produk...</option>{products.map(item => <option key={item.id} value={item.id}>{item.name} · {item.variant}</option>)}</select></label>}
    {!products.length && <p className="text-sm text-muted-foreground">Campaign ini tidak memiliki katalog produk.</p>}
    <div className="flex flex-wrap gap-2">
      {actor.product === 'hq' && product.choice === 'selected' && product.fulfillment === 'pending' && <Button variant="outline" onClick={() => onChange(latest => progressFulfillment(latest, actor, 'ordered', current.revision))}>Proses produk</Button>}
      {product.fulfillment === 'ordered' && <Button variant="outline" onClick={() => onChange(latest => progressFulfillment(latest, actor, 'received', current.revision))}>Tandai produk diterima</Button>}
    </div>
    <p className="text-xs text-muted-foreground">Pilihan produk, pemenuhan, QC dan payout merupakan progress terpisah. Tidak melakukan pembelian atau pengiriman nyata.</p>
  </section>;
}

function DeliverableProgress({ assignment, actor, onChange, deliverableId }: Omit<ExecutionProps, 'products'> & { deliverableId: string }) {
  const [draftUrl, setDraftUrl] = useState(''), [draftNote, setDraftNote] = useState(''), [reviewNote, setReviewNote] = useState('');
  const [postUrl, setPostUrl] = useState(''), [postedAt, setPostedAt] = useState('');
  const target = assignment.deliverables.find(item => item.id === deliverableId)!;
  const current = readExecution(assignment), delivery = getDeliveryExecution(assignment, deliverableId), draft = delivery.drafts.at(-1);
  const owner = target.outputOwner ?? (target.postingRequired ? 'creator' : 'brand');
  return <article className="space-y-3 rounded-md border border-border p-3" aria-label={`Eksekusi ${target.title}`}>
    <div><h4 className="font-semibold">{target.title}</h4><p className="text-sm text-muted-foreground">{target.platform} · {owner === 'brand' ? 'Output untuk brand' : 'Output Creator'} · {target.postingRequired ? 'Wajib posting' : 'Tanpa posting'} · Deadline {target.deadline}</p></div>
    <p role="status">{qualityLabels[delivery.status]}{draft ? ` · Draft versi ${draft.version}` : ''}{delivery.posting ? ` · Posting ${delivery.posting.postedAt}` : ''}</p>
    {draft && <p className="text-sm"><a className="underline" href={draft.url} target="_blank" rel="noreferrer">Buka draft versi {draft.version}</a>{draft.note ? ` · ${draft.note}` : ''}</p>}
    {delivery.reviews.at(-1)?.note && <p className="text-sm">Catatan QC: {delivery.reviews.at(-1)?.note}</p>}
    {actor.product === 'creator' && ['not_submitted', 'revision_requested'].includes(delivery.status) && <form className="space-y-2" onSubmit={event => {
      event.preventDefault(); onChange(latest => submitDraft(latest, actor, deliverableId, { url: draftUrl, note: draftNote }, current.revision));
    }}>
      <label className="block space-y-1 text-sm">URL draft {target.title}<Input aria-label={`URL draft ${target.title}`} type="url" required value={draftUrl} onChange={event => setDraftUrl(event.target.value)} placeholder="https://example.test/draft"/></label>
      <label className="block space-y-1 text-sm">Catatan draft<Textarea aria-label={`Catatan draft ${target.title}`} value={draftNote} onChange={event => setDraftNote(event.target.value)} maxLength={2000}/></label>
      <Button type="submit">Kirim draft {target.title}</Button>
    </form>}
    {actor.product === 'hq' && delivery.status === 'submitted' && draft && <div className="space-y-2">
      <label className="block space-y-1 text-sm">Catatan QC<Textarea aria-label={`Catatan QC ${target.title}`} value={reviewNote} onChange={event => setReviewNote(event.target.value)} maxLength={2000}/></label>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onChange(latest => reviewDraft(latest, actor, deliverableId,
        { decision: 'revision_requested', note: reviewNote, draftVersion: draft.version }, current.revision))}>Minta revisi {target.title}</Button>
        <Button onClick={() => onChange(latest => reviewDraft(latest, actor, deliverableId,
          { decision: 'approved', note: reviewNote, draftVersion: draft.version }, current.revision))}>Setujui QC {target.title}</Button></div>
    </div>}
    {actor.product === 'creator' && target.postingRequired && owner === 'creator' && delivery.status === 'approved' && !delivery.posting && <form className="space-y-2" onSubmit={event => {
      event.preventDefault(); onChange(latest => recordPosting(latest, actor, deliverableId, { url: postUrl, postedAt }, current.revision));
    }}>
      <label className="block space-y-1 text-sm">URL posting {target.title}<Input aria-label={`URL posting ${target.title}`} type="url" required value={postUrl} onChange={event => setPostUrl(event.target.value)}/></label>
      <label className="block space-y-1 text-sm">Tanggal posting (WIB)<Input aria-label={`Tanggal posting ${target.title}`} type="date" required value={postedAt} onChange={event => setPostedAt(event.target.value)}/></label>
      <Button type="submit">Simpan posting {target.title}</Button>
    </form>}
    {delivery.posting && <a className="inline-block text-sm underline" href={delivery.posting.url} target="_blank" rel="noreferrer">Buka posting {target.title}</a>}
    {!!delivery.drafts.length && <details className="text-sm"><summary className="cursor-pointer">Riwayat draft & QC {target.title}</summary><ol className="mt-2 space-y-1">{delivery.drafts.map(item => <li key={item.version}>Draft {item.version}: {new Date(item.submittedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB{delivery.reviews.filter(review => review.draftVersion === item.version).map(review => <span key={`${review.draftVersion}-${review.decision}`}> · {qualityLabels[review.decision]} oleh {review.actor}{review.note ? `: ${review.note}` : ''}</span>)}</li>)}</ol></details>}
  </article>;
}

export function ExecutionPanel(props: ExecutionProps) {
  return <section className="space-y-3" aria-label={`Eksekusi assignment ${props.assignment.creatorName}`}>
    <ProductProgress {...props}/>
    <h3 className="font-semibold">Deliverable & QC</h3>
    {props.assignment.deliverables.map(deliverable => <DeliverableProgress key={deliverable.id} assignment={props.assignment} actor={props.actor} onChange={props.onChange} deliverableId={deliverable.id}/>)}
  </section>;
}
