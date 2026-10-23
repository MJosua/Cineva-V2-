import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Actor, Inquiry } from '../cineva-inquiries/domain';
import type { InquiryRepository } from '../cineva-inquiries/repository';
import { claim, dummySupportProvider, handover, sendSupport } from './support';
import { changeSupport } from './assignment';

export function ConversationPanel({ row, actor, repo, run }: { row: Inquiry; actor: Actor; repo: InquiryRepository; run: (action: () => void | Promise<void>) => void }) {
  const [text, setText] = useState(''), [sending, setSending] = useState(false);
  const [messageId, setMessageId] = useState(() => crypto.randomUUID());
  const update = (change: (value: Inquiry) => Inquiry) => run(() => { repo.update(row.id, actor, change); });
  return <section className="space-y-3 rounded-md border border-border p-4" aria-label="Percakapan CS">
    <h3 className="font-semibold">CS AI / manusia</h3><p role="status">Mode: {row.support}{row.agent ? ` · ${row.agent}` : ''}</p>
    <p className="text-xs text-muted-foreground">AI simulasi lokal; tidak mengirim pesan eksternal.</p>
    <ol className="space-y-2" aria-label="Riwayat percakapan">{row.messages.map(message => <li key={message.id} className="rounded border border-border p-2"><strong>{message.actor}: </strong>{message.text}</li>)}</ol>
    <div className="flex flex-wrap gap-2">
      {row.support === 'ai' && <Button variant="outline" onClick={() => update(value => handover(value, actor))}>Bantuan manusia</Button>}
      {actor.product === 'hq' && row.support === 'waiting' && <Button onClick={() => update(value => claim(value, actor))}>Ambil percakapan</Button>}
      {actor.product === 'hq' && row.support === 'human' && <Button onClick={() => update(value => changeSupport(value, actor, 'resolved'))}>Selesaikan percakapan</Button>}
      {(row.support === 'resolved' || row.support === 'human' || row.support === 'waiting') && <Button variant="outline" onClick={() => update(value => changeSupport(value, actor, 'ai'))}>Kembali ke AI</Button>}
    </div>
    {actor.product === 'hq' && row.support === 'human' && <label className="block space-y-2 text-sm">Penanggung jawab CS<select aria-label="Penanggung jawab CS" value={row.agent} onChange={event => { const agent = event.target.value; update(value => changeSupport(value, actor, 'human', { agent })); }} className="h-10 w-full rounded-md border border-input bg-background px-3">{[`${actor.id}-agent`, `${actor.id}-agent-2`].map(agent => <option key={agent}>{agent}</option>)}</select></label>}
    {!!row.supportEvents?.length && <details className="rounded-md border border-border p-3"><summary className="cursor-pointer text-sm font-medium">Riwayat penanganan CS</summary><ol className="mt-2 space-y-2 text-sm">{row.supportEvents.map(event => <li key={event.id}>{new Date(event.at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB · {event.actor}: {event.from} → {event.to}{event.agent ? ` · ${event.agent}` : ''}</li>)}</ol></details>}
    <form onSubmit={event => { event.preventDefault(); setSending(true); run(async () => { try { await sendSupport(repo, row.id, actor, text, dummySupportProvider, messageId); setText(''); setMessageId(crypto.randomUUID()); } finally { setSending(false); } }); }} className="space-y-2">
      <label htmlFor="support-message">Pesan untuk CS</label><Textarea id="support-message" disabled={sending} value={text} onChange={e => { setText(e.target.value); setMessageId(crypto.randomUUID()); }} required maxLength={2000}/>
      <Button disabled={sending || row.support === 'resolved' || (actor.product === 'hq' && row.support !== 'human')} type="submit">Kirim pesan</Button>
    </form>
  </section>;
}
