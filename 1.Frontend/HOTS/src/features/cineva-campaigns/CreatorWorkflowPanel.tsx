import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign, TalentAssignment } from './model';
import { confirmReceipt, readWorkflow, reportProductIssue, reviewerLabels, reviewStoryline, saveAddress, storylineStatus, submitStoryline, workflowSteps, type StepState, type StorylineReviewer } from './workflow';

const tone: Record<StepState, string> = { done: 'bg-primary text-primary-foreground', active: 'bg-primary/25 text-foreground', issue: 'bg-destructive/20 text-destructive', pending: 'bg-muted text-muted-foreground' };
const stateLabel: Record<StepState, string> = { done: 'Selesai', active: 'Berjalan', issue: 'Perlu tindakan', pending: 'Belum' };

/** Papan progres semua creator dalam satu campaign: baris per creator, kolom per langkah (pengganti sheet progress). */
export function WorkflowBoard({ campaign }: { campaign: Campaign }) {
  if (!campaign.assignments.length) return null;
  const rows = campaign.assignments.map(item => ({ item, steps: workflowSteps(item) }));
  return <section className="space-y-2 rounded-md border border-border p-4" aria-label="Progres creator" data-testid="workflow-board">
    <h3 className="font-semibold">Progres per creator</h3>
    <div className="overflow-x-auto"><table className="min-w-[720px] text-xs">
      <thead><tr><th className="p-1 text-left">Creator</th>{rows[0].steps.map(step => <th key={step.key} className="p-1 text-left">{step.label}</th>)}</tr></thead>
      <tbody>{rows.map(({ item, steps }) => <tr key={item.id} className="border-t border-border">
        <td className="p-1 font-medium">{item.creatorName}</td>
        {steps.map(step => <td key={step.key} className="p-1"><span className={`block rounded px-1 py-0.5 ${tone[step.state]}`} title={step.detail}>{stateLabel[step.state]}</span></td>)}
      </tr>)}</tbody>
    </table></div>
    <p className="text-xs text-muted-foreground">Arahkan kursor ke sel untuk detail. Draft, posting, insight dan payment dibaca dari panel pelaksanaan dan keuangan.</p>
  </section>;
}

/** Langkah creator yang belum ada di panel pelaksanaan: alamat pengiriman, terima produk + laporan 1x24 jam, setor dan review storyline. */
export function CreatorWorkflowPanel({ assignment, actor, onChange, storylineRequired }: { assignment: TalentAssignment; actor: Actor; onChange: (update: (row: TalentAssignment) => TalentAssignment) => void; storylineRequired?: boolean }) {
  const flow = readWorkflow(assignment), story = storylineStatus(assignment), own = actor.product === 'creator' && actor.id === assignment.creatorId, hq = actor.product === 'hq';
  const [recipient, setRecipient] = useState(''), [phone, setPhone] = useState(''), [full, setFull] = useState('');
  const [issue, setIssue] = useState(''), [photo, setPhoto] = useState(''), [storyText, setStoryText] = useState('');
  const [reviewer, setReviewer] = useState<StorylineReviewer>('kol_manager'), [note, setNote] = useState(''), [error, setError] = useState('');
  const now = () => new Date().toISOString();
  const act = (update: (row: TalentAssignment) => TalentAssignment) => { try { onChange(update); setError(''); } catch (failure) { setError((failure as Error).message); } };
  const steps = workflowSteps(assignment);
  return <section className="space-y-3 rounded-md border border-border p-3" aria-label={`Alur kerja ${assignment.creatorName}`}>
    <h4 className="font-semibold">Alur kerja creator</h4>
    <ol className="flex flex-wrap gap-1 text-xs">{steps.map((step, i) => <li key={step.key} className={`rounded px-2 py-0.5 ${tone[step.state]}`} title={step.detail}>{i + 1}. {step.label}</li>)}</ol>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

    <div className="space-y-1 text-sm"><p className="font-medium">1. Alamat pengiriman</p>
      {flow.address ? <p>{own || hq ? `${flow.address.recipient} · ${flow.address.phone} · ${flow.address.full}` : 'Sudah diisi'}</p> : !own && <p className="text-muted-foreground">Belum diisi creator.</p>}
      {own && !flow.address && <form className="grid gap-2 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); act(row => saveAddress(row, actor, { recipient, phone, full }, now())); }}>
        <Input aria-label="Nama penerima" placeholder="Nama penerima" value={recipient} onChange={event => setRecipient(event.target.value)}/>
        <Input aria-label="Telepon penerima" placeholder="Nomor telepon aktif" value={phone} onChange={event => setPhone(event.target.value)}/>
        <Textarea aria-label="Alamat lengkap" className="sm:col-span-2" placeholder="Alamat rumah lengkap + patokan" value={full} onChange={event => setFull(event.target.value)}/>
        <Button type="submit" className="sm:col-span-2">Simpan alamat</Button></form>}
    </div>

    <div className="space-y-1 text-sm"><p className="font-medium">2. Terima produk</p>
      {flow.receipt ? <p>Diterima {flow.receipt.receivedAt.slice(0, 16).replace('T', ' ')}{flow.receipt.issue ? ` · Dilaporkan: ${flow.receipt.issue.note} (${flow.receipt.issue.photoName})` : ''}</p> : <p className="text-muted-foreground">Belum dikonfirmasi.</p>}
      {own && !flow.receipt && <Button variant="outline" onClick={() => act(row => confirmReceipt(row, actor, now()))}>Produk sudah saya terima</Button>}
      {own && flow.receipt && !flow.receipt.issue && <form className="grid gap-2 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); act(row => reportProductIssue(row, actor, issue, photo, now())); }}>
        <Input aria-label="Masalah produk" placeholder="Cacat produksi / salah kirim" value={issue} onChange={event => setIssue(event.target.value)}/>
        <Input aria-label="Foto bukti produk" type="file" accept=".png,.jpg,.jpeg" onChange={event => setPhoto(event.target.files?.[0]?.name ?? '')}/>
        <Button type="submit" variant="outline" className="sm:col-span-2">Laporkan produk tidak sesuai (maks 1x24 jam)</Button></form>}
    </div>

    <div className="space-y-1 text-sm"><p className="font-medium">3. Storyline {storylineRequired ? '(wajib ACC sebelum draft)' : '(opsional)'}</p>
      {(flow.storyline?.submissions ?? []).map(item => <div key={item.version} className="rounded border border-border p-2">
        <p className="text-xs text-muted-foreground">Versi {item.version} · {item.submittedAt.slice(0, 10)}</p><p className="whitespace-pre-wrap">{item.text}</p>
        {flow.storyline!.reviews.filter(review => review.version === item.version).map((review, i) => <p key={i} className="text-xs">{reviewerLabels[review.reviewer]}: {review.decision === 'approved' ? 'ACC' : 'Revisi'}{review.note ? ` · ${review.note}` : ''}</p>)}
      </div>)}
      {own && (story === 'not_submitted' || story === 'revision_requested') && <form className="space-y-2" onSubmit={event => { event.preventDefault(); act(row => submitStoryline(row, actor, storyText, now())); setStoryText(''); }}>
        <Textarea aria-label="Storyline" placeholder="Scene, visual, VO, teks layar" value={storyText} onChange={event => setStoryText(event.target.value)}/>
        <Button type="submit">{story === 'revision_requested' ? 'Kirim revisi storyline' : 'Setor storyline'}</Button></form>}
      {hq && story === 'submitted' && <div className="grid gap-2 sm:grid-cols-3">
        <select aria-label="Peninjau storyline" className="h-10 rounded-md border border-input bg-background px-3" value={reviewer} onChange={event => setReviewer(event.target.value as StorylineReviewer)}>
          {Object.entries(reviewerLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <Input aria-label="Catatan feedback storyline" className="sm:col-span-2" placeholder="Feedback STL" value={note} onChange={event => setNote(event.target.value)}/>
        <Button onClick={() => { act(row => reviewStoryline(row, actor, 'approved', reviewer, note, now())); setNote(''); }}>ACC</Button>
        <Button variant="outline" onClick={() => { act(row => reviewStoryline(row, actor, 'revision_requested', reviewer, note, now())); setNote(''); }}>Minta revisi</Button>
        <p className="text-xs text-muted-foreground sm:col-span-3">ACC dari KOL Manager membuka setor draft. Feedback client/zone dicatat sebagai riwayat.</p>
      </div>}
    </div>
    <p className="text-xs text-muted-foreground">Langkah 4–7 (draft, posting, insight H+7, payment) ada di panel pelaksanaan dan keuangan di bawah.</p>
  </section>;
}
