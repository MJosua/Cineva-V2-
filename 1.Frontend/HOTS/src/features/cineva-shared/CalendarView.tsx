import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobCards } from './JobCards';
import { useWorkspace } from './WorkspaceContext';
import type { Job } from './model';
import { ResourceScheduler } from '../cineva-hq/ResourceScheduler';
export function CalendarView({ onSelect, actorId }: {
    onSelect: (job: Job) => void;
    actorId?: string;
}) {
    const { data } = useWorkspace(), [month, setMonth] = useState('2026-10'), [selected, setSelected] = useState('2026-10-19');
    if (!data)
        return null;
    const [year, m] = month.split('-').map(Number), days = new Date(Date.UTC(year, m, 0)).getUTCDate(), offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
    return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Kalender & jadwal</h2><Input className="w-auto" aria-label="Bulan kalender" type="month" value={month} onChange={e => { if (/^\d{4}-\d{2}$/.test(e.target.value))
        setMonth(e.target.value); }}/></div><Card><CardContent className="p-3 sm:p-5"><div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => <div key={day} className="py-2">{day}</div>)}{Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`}/>)}{Array.from({ length: days }, (_, i) => { const day = `${month}-${String(i + 1).padStart(2, '0')}`, count = data.jobs.filter(j => !j.archived && j.scheduledAt.startsWith(day)).length; return <Button key={day} aria-label={`Tanggal ${day}, ${count} job`} aria-pressed={selected === day} variant={selected === day ? 'default' : 'ghost'} className="h-14 min-w-0 flex-col p-1 sm:h-20" onClick={() => setSelected(day)}><span>{i + 1}</span>{count > 0 && <span className="text-[10px]">{count} job</span>}</Button>; })}</div></CardContent></Card><p className="text-sm text-muted-foreground">Jadwal WIB · {selected} · reminder lokal, belum terhubung kalender eksternal.</p><JobCards onSelect={onSelect} onlyDate={selected} compact/>{data.product === 'hq' && <ResourceScheduler actorId={actorId}/>}</section>;
}
