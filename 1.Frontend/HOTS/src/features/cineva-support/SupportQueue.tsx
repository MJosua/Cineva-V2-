import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { canRead, type Actor, type Inquiry, type SupportMode } from '../cineva-inquiries/domain';
import { filterSupportQueue, supportQueueCounts } from './assignment';

const modeLabels: Record<SupportMode, string> = { ai: 'AI', waiting: 'Menunggu agen', human: 'Ditangani manusia', resolved: 'Selesai' };
export function SupportQueue({ inquiries, actor, selected, onSelect }: {
  inquiries: Inquiry[]; actor: Actor; selected: string | null; onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState(''), [mode, setMode] = useState<SupportMode | 'all'>('all'), [agent, setAgent] = useState('');
  const counts = supportQueueCounts(inquiries, actor);
  const agents = [...new Set(inquiries.filter(row => canRead(row, actor)).flatMap(row => row.agent ? [row.agent] : []))].sort();
  const rows = filterSupportQueue(inquiries, actor, { search, mode, agent });
  return <section className="space-y-3" aria-label="Antrean CS">
    <p role="status">Menunggu agen: {counts.waiting} · Ditangani: {counts.human} · AI: {counts.ai} · Selesai: {counts.resolved}</p>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="space-y-1 text-sm">Cari percakapan<Input aria-label="Cari percakapan CS" value={search} onChange={event => setSearch(event.target.value)} placeholder="Judul, brand atau isi pesan"/></label>
      <label className="space-y-1 text-sm">Mode CS<select aria-label="Filter mode CS" value={mode} onChange={event => setMode(event.target.value as SupportMode | 'all')} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="all">Semua mode</option>{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="space-y-1 text-sm">Agen<select aria-label="Filter agen CS" value={agent} onChange={event => setAgent(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Semua agen</option>{agents.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Daftar permintaan">{rows.map(row => <Button key={row.id} variant={row.id === selected ? 'default' : 'outline'} onClick={() => onSelect(row.id)}>{String(row.brief.title)} · {modeLabels[row.support]}{row.agent ? ` · ${row.agent}` : ''}</Button>)}</div>
    {!rows.length && <p>Tidak ada percakapan sesuai filter.</p>}
  </section>;
}
