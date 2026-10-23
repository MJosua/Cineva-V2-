import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { DemoEvent } from './model';

interface CalendarProps { events: DemoEvent[]; onSave: (event: DemoEvent) => void; onAdd: () => void }
const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const kindLabel = { milestone: 'Milestone', visit: 'Visit' };
function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function scheduled(event: DemoEvent): boolean {
  return validDate(event.startDate) && (!event.endDate || (validDate(event.endDate) && event.endDate >= event.startDate));
}
function occurs(event: DemoEvent, first: string, last: string): boolean {
  return scheduled(event) && event.startDate! <= last && (event.endDate ?? event.startDate)! >= first;
}
function shiftMonth(month: string, delta: number): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return date.toISOString().slice(0, 7);
}
function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
}

function EventEditor({ value, onClose, onSave }: { value: DemoEvent; onClose: () => void; onSave: (event: DemoEvent) => void }) {
  const [event, setEvent] = useState<DemoEvent>({ ...value }), [error, setError] = useState('');
  const update = <K extends keyof DemoEvent,>(key: K, next: DemoEvent[K]) => { setEvent(current => ({ ...current, [key]: next })); setError(''); };
  return <Card className="min-w-0" aria-label="Editor jadwal"><CardHeader><CardTitle>Edit jadwal</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={submit => {
      submit.preventDefault(); setError('');
      try {
        const startDate = event.startDate || null, endDate = event.endDate || null;
        if (!event.title.trim() || event.title.length > 200) throw new Error('Judul wajib diisi, maksimal 200 karakter.');
        if ((startDate && !validDate(startDate)) || (endDate && !validDate(endDate))) throw new Error('Gunakan tanggal kalender yang valid.');
        if (endDate && (!startDate || endDate < startDate)) throw new Error('Tanggal selesai harus sama atau sesudah tanggal mulai.');
        onSave({ ...event, title: event.title.trim(), startDate, endDate, allDay: true, requiresReview: event.requiresReview || !startDate });
      } catch (failure) { setError(failure instanceof Error ? failure.message : 'Jadwal belum tersimpan.'); }
    }}>
      <label className="block space-y-1 text-sm">Judul jadwal<Input aria-label="Judul jadwal" required maxLength={200} value={event.title} onChange={change => update('title', change.target.value)}/></label>
      <label className="block space-y-1 text-sm">Jenis jadwal<select aria-label="Jenis jadwal" value={event.kind} onChange={change => update('kind', change.target.value as DemoEvent['kind'])} className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3"><option value="milestone">Milestone</option><option value="visit">Visit</option></select></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0 space-y-1 text-sm">Tanggal mulai<Input className="min-w-0" aria-label="Tanggal mulai" type="date" value={event.startDate ?? ''} onChange={change => update('startDate', change.target.value || null)}/></label>
        <label className="block min-w-0 space-y-1 text-sm">Tanggal selesai (opsional)<Input className="min-w-0" aria-label="Tanggal selesai" type="date" value={event.endDate ?? ''} onChange={change => update('endDate', change.target.value || null)}/></label>
      </div>
      <p className="text-xs text-muted-foreground">Sepanjang hari. Jam tidak ditambahkan karena tidak tercatat dalam sumber.</p>
      <label className="flex items-center gap-2 text-sm"><Checkbox aria-label="Tanggal perlu review" checked={event.requiresReview || !event.startDate} disabled={!event.startDate} onCheckedChange={checked => update('requiresReview', checked === true)}/>Tanggal perlu review</label>
      <label className="block space-y-1 text-sm">Catatan jadwal<Textarea aria-label="Catatan jadwal" value={event.note} onChange={change => update('note', change.target.value)} maxLength={4000}/></label>
      <div className="space-y-1 break-words text-xs text-muted-foreground"><p>Tanggal asli: {event.rawDate || 'Tidak tercatat'}</p><p>Sumber: {event.sourceCell || 'Ditambahkan dalam demo'}</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit">Simpan jadwal</Button><Button type="button" variant="outline" onClick={onClose}>Tutup editor jadwal</Button></div>
    </form>
  </CardContent></Card>;
}

export function CalendarPanel({ events, onSave, onAdd }: CalendarProps) {
  const [month, setMonth] = useState(() => events.filter(scheduled).map(event => event.startDate!).sort()[0]?.slice(0, 7) ?? new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string | null>(null), [editing, setEditing] = useState<DemoEvent | null>(null);
  const first = `${month}-01`, next = new Date(`${first}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1); next.setUTCDate(0);
  const days = next.getUTCDate(), last = `${month}-${String(days).padStart(2, '0')}`;
  const offset = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const dated = events.filter(event => occurs(event, selectedDate ?? first, selectedDate ?? last))
    .sort((left, right) => left.startDate!.localeCompare(right.startDate!) || left.title.localeCompare(right.title));
  const reviews = events.filter(event => !scheduled(event) || event.requiresReview);
  const edit = (event: DemoEvent) => setEditing({ ...event });
  return <section className="min-w-0 space-y-4" aria-label="Kalender demo">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Kalender & visit</h2><p className="text-sm text-muted-foreground">Milestone sumber dan jadwal tambahan. Tanggal ambigu tetap menunggu review.</p></div><Button onClick={onAdd}>Tambah jadwal</Button></div>
    <Card className="min-w-0"><CardContent className="space-y-3 p-2 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" aria-label="Bulan sebelumnya" onClick={() => { setMonth(shiftMonth(month, -1)); setSelectedDate(null); }}>←</Button>
        <h3 className="text-center font-semibold" aria-live="polite">{monthLabel(month)}</h3>
        <Button variant="outline" aria-label="Bulan berikutnya" onClick={() => { setMonth(shiftMonth(month, 1)); setSelectedDate(null); }}>→</Button>
        <label className="flex w-full items-center gap-2 text-sm sm:w-auto">Bulan<Input className="min-w-0 flex-1 sm:w-44" aria-label="Bulan kalender demo" type="month" value={month} onChange={change => {
          if (/^\d{4}-(0[1-9]|1[0-2])$/.test(change.target.value)) { setMonth(change.target.value); setSelectedDate(null); }
        }}/></label>
      </div>
      <div className="grid grid-cols-7 gap-1" aria-label={`Tanggal ${monthLabel(month)}`}>
        {weekdays.map(day => <div key={day} className="py-1 text-center text-xs text-muted-foreground">{day}</div>)}
        {Array.from({ length: offset }, (_, index) => <div key={`pad-${index}`} aria-hidden="true"/>)}
        {Array.from({ length: days }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`, items = events.filter(event => occurs(event, date, date));
          return <Button key={date} aria-label={`Tanggal ${date}, ${items.length} jadwal`} aria-pressed={selectedDate === date} variant={selectedDate === date ? 'default' : items.length ? 'secondary' : 'ghost'}
            className="h-16 min-w-0 flex-col gap-1 overflow-hidden p-1 text-xs sm:h-20" onClick={() => setSelectedDate(date)}><span>{index + 1}</span>{items.length > 0 && <span className="text-[10px]">{items.length} agenda</span>}</Button>;
        })}
      </div>
    </CardContent></Card>
    <section className="space-y-2" aria-label="Daftar jadwal bertanggal">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{selectedDate ? `Jadwal ${selectedDate}` : `Jadwal ${monthLabel(month)}`}</h3>{selectedDate && <Button variant="outline" size="sm" onClick={() => setSelectedDate(null)}>Semua bulan ini</Button>}</div>
      {!dated.length && <p className="text-sm text-muted-foreground">Tidak ada jadwal pada {selectedDate ? 'tanggal' : 'bulan'} ini.</p>}
      {dated.map(event => <Card key={event.id} className="min-w-0"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="min-w-0 flex-1 break-words"><p className="font-medium">{event.title}</p><p className="text-xs text-muted-foreground">{kindLabel[event.kind]} · {event.startDate}{event.endDate && event.endDate !== event.startDate ? ` s.d. ${event.endDate}` : ''} · Sepanjang hari{event.requiresReview ? ' · Perlu review' : ''}</p></div><Button variant="outline" size="sm" aria-label={`Edit jadwal ${event.title}`} onClick={() => edit(event)}>Edit jadwal</Button></CardContent></Card>)}
    </section>
    <section className="space-y-2 rounded-md border border-border p-3" aria-label="Tanggal perlu review">
      <h3 className="font-semibold">Tanggal perlu review ({reviews.length})</h3><p className="text-xs text-muted-foreground">Tanggal kosong atau ambigu tidak ditempatkan otomatis di kalender. Tidak ada visit yang dibuat dari asumsi.</p>
      {!reviews.length && <p className="text-sm text-muted-foreground">Semua tanggal sudah ditinjau.</p>}
      {reviews.map(event => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2"><div className="min-w-0 flex-1 break-words text-sm"><strong>{event.title}</strong><p className="text-xs text-muted-foreground">{event.rawDate || 'Tanggal sumber kosong'}{event.sourceCell ? ` · ${event.sourceCell}` : ''}</p></div><Button variant="outline" size="sm" aria-label={`Review jadwal ${event.title}`} onClick={() => edit(event)}>Review tanggal</Button></div>)}
    </section>
    {editing && <EventEditor key={editing.id} value={editing} onClose={() => setEditing(null)} onSave={event => {
      onSave(event); setEditing({ ...event }); if (validDate(event.startDate)) { setMonth(event.startDate.slice(0, 7)); setSelectedDate(null); }
    }}/>}
  </section>;
}
