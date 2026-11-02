import type { StageDate, StageReopen } from './stages';
import { stageWindowState } from './stages';

/**
 * Tampilan Gantt kalender tahap, meniru pola HOTS project management (`components/assignment/TaskGantt.tsx`):
 * tiap tahap satu baris, batang memanjang dari tanggal mulai sampai tanggal akhir, garis hari ini.
 * Vendor-only dan murni tampilan: TaskGantt HOTS terikat API assignment, jadi tidak dipakai langsung.
 */
const dayMs = 86_400_000;
const toDay = (date: string) => Date.parse(date + 'T00:00:00Z') / dayMs;
const label = (date: string) => new Date(date + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function StageGantt({ calendar, today, reopens }: { calendar: StageDate[]; today: string; reopens?: StageReopen[] }) {
  if (!calendar.length) return null;
  const first = toDay(calendar[0].start), last = toDay(calendar.at(-1)!.end), span = last - first + 1;
  const pct = (day: number) => `${((day - first) / span) * 100}%`;
  const ticks = Array.from({ length: span }, (_, i) => i).filter(i => i % 7 === 0);
  const now = toDay(today);
  return <div className="overflow-x-auto" data-testid="stage-gantt">
    <div className="min-w-[640px] space-y-1 text-xs">
      <div className="relative ml-40 h-5 border-b border-border text-muted-foreground">
        {ticks.map(i => <span key={i} className="absolute -translate-x-1/2" style={{ left: pct(first + i) }}>{label(new Date((first + i) * dayMs).toISOString().slice(0, 10))}</span>)}
      </div>
      {calendar.map(stage => {
        const state = stageWindowState(calendar, stage.key, today, reopens);
        const tone = state.open ? 'bg-primary text-primary-foreground' : state.why === 'closed' ? 'bg-muted-foreground/40 text-foreground' : 'bg-primary/25 text-foreground';
        const start = toDay(stage.start), width = `${((toDay(stage.end) - start + 1) / span) * 100}%`;
        return <div key={stage.key} className="flex items-center" data-testid={`gantt-row-${stage.key}`}>
          <span className="w-40 shrink-0 truncate pr-2 font-medium" title={stage.label}>{stage.label}</span>
          <div className="relative h-7 flex-1 rounded bg-muted/40">
            <div className={`absolute top-1 h-5 truncate rounded px-1 leading-5 ${tone}`} style={{ left: pct(start), width }} title={`${stage.label}: ${stage.start} s/d ${stage.end}`}>
              {stage.start === stage.end ? label(stage.start) : `${label(stage.start)}–${label(stage.end)}`}
            </div>
            {now >= first && now <= last && <div className="absolute inset-y-0 w-px bg-destructive" style={{ left: pct(now + 0.5) }} aria-hidden/>}
          </div>
        </div>;
      })}
      <p className="ml-40 text-muted-foreground">Batang terang: terbuka · pudar: belum dibuka · abu-abu: tertutup · garis merah: hari ini.</p>
    </div>
  </div>;
}
