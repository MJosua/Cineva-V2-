import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign } from './model';
import { StageGantt } from './StageGantt';
import { defaultExtensionRules, maxExtensionDaysPerRequest, defaultStageTemplates, findStageTemplate, stagePlanCalendar, stageWindowState, assertStageReopen, validateExtension, type ExtensionProof, type StagePlan, type StageReopen } from './stages';

type Change = (update: (row: Campaign) => Campaign) => void;
const dateList = (text: string) => text.split(/[\s,;]+/).filter(Boolean);
const localToday = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const windowLabel = { timeline: 'Terbuka', reopen: 'Dibuka ulang PIC', not_started: 'Belum dibuka', closed: 'Tertutup' } as const;

/** Kalender tahap campaign dari template client. Hanya HQ pemilik yang mengubah; Creator melihat jadwalnya. Perpanjangan: 2 kali, maks 2 hari per izin (K6). */
export function StagePlanPanel({ campaign, actor, onChange }: { campaign: Campaign; actor: Actor; onChange: Change }) {
  const hq = actor.product === 'hq', plan = campaign.stagePlan;
  const [templateId, setTemplateId] = useState(defaultStageTemplates[0].id), [startDate, setStartDate] = useState(''), [holidays, setHolidays] = useState('');
  const [stageKey, setStageKey] = useState(''), [days, setDays] = useState('1'), [reason, setReason] = useState('');
  const [proofKind, setProofKind] = useState<'text' | 'png' | 'jpeg'>('text'), [proofText, setProofText] = useState(''), [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState('');
  const [reopenKey, setReopenKey] = useState(''), [reopenUntil, setReopenUntil] = useState(''), [reopenReason, setReopenReason] = useState(''), [clientOk, setClientOk] = useState(false);
  const today = localToday();
  const act = (action: () => void) => { try { action(); setError(''); } catch (failure) { setError((failure as Error).message); } };
  let calendar: ReturnType<typeof stagePlanCalendar> = [], readError = '';
  if (plan) try { calendar = stagePlanCalendar(plan); } catch (failure) { readError = (failure as Error).message; }
  const template = plan ? findStageTemplate(plan.templateId) : undefined;
  const usedDays = plan?.extensions.reduce((sum, item) => sum + item.days, 0) ?? 0;
  const extensionLeft = Math.max(0, (defaultExtensionRules.maxTotalDays) - usedDays), requestsLeft = Math.max(0, (defaultExtensionRules.maxRequests ?? 0) - (plan?.extensions.length ?? 0));
  const proof = (): ExtensionProof => proofKind === 'text' ? { kind: 'text', text: proofText } : { kind: proofKind, fileName: file?.name ?? '', sizeBytes: file?.size ?? 0 };
  return <section className="space-y-3 rounded-md border border-border p-4" aria-label="Kalender tahap campaign" data-testid="stage-plan">
    <h3 className="font-semibold">Kalender tahap campaign</h3>
    {(error || readError) && <p role="alert" className="text-destructive">{error || readError}</p>}
    {!plan && !hq && <p className="text-sm text-muted-foreground">Kalender tahap belum disusun HQ.</p>}
    {!plan && hq && <form className="grid gap-3 sm:grid-cols-3" onSubmit={event => { event.preventDefault();
      act(() => { const next: StagePlan = { templateId, startDate, holidays: dateList(holidays), extensions: [] }; stagePlanCalendar(next); onChange(row => ({ ...row, stagePlan: next })); }); }}>
      <label className="text-sm">Template tahap<select aria-label="Template tahap" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" value={templateId} onChange={event => setTemplateId(event.target.value)}>{defaultStageTemplates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="text-sm">Tanggal mulai<Input aria-label="Tanggal mulai tahap" type="date" required value={startDate} onChange={event => setStartDate(event.target.value)}/></label>
      <label className="text-sm sm:col-span-3">Libur nasional dan cuti bersama (YYYY-MM-DD, pisahkan koma; kosongkan bila tidak ada)<Textarea aria-label="Daftar libur" value={holidays} onChange={event => setHolidays(event.target.value)}/></label>
      <Button type="submit" className="sm:col-span-3">Susun kalender tahap</Button>
      <p className="text-xs text-muted-foreground sm:col-span-3">Hari kerja dihitung Senin–Jumat di luar libur. Daftar libur resmi belum diberikan client; HQ mengisinya sendiri.</p>
    </form>}
    {plan && <>
      {!readError && <StageGantt calendar={calendar} today={today} reopens={plan.reopens}/>}
      <ol className="space-y-1 text-sm">{calendar.map(item => { const state = stageWindowState(calendar, item.key, today, plan.reopens);
        return <li key={item.key} data-testid={`stage-window-${item.key}`}><span className="font-medium">{item.label}</span> · {item.start} s/d {item.end}{plan.extensions.filter(ext => ext.stageKey === item.key).map(ext => ` · diperpanjang ${ext.days} hari`).join('')}
          <span className={`ml-2 rounded px-2 py-0.5 text-xs ${state.open ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{windowLabel[state.open ? state.via : state.why]}</span></li>; })}</ol>
      <p className="text-xs text-muted-foreground">Aksi tahap terbuka sesuai jendela tanggal dan tertutup otomatis setelah lewat. Hanya PIC campaign yang membuka ulang, dengan persetujuan klien. Urutan antar tahap belum diputuskan client.</p>
      {hq && <form className="space-y-2 rounded-md border border-border p-3" aria-label="Buka ulang tahap" onSubmit={event => { event.preventDefault();
        act(() => { const record: StageReopen = assertStageReopen({ stageKey: reopenKey || calendar[0].key, until: reopenUntil, openedBy: 'pic_campaign', clientApproved: clientOk as true, reason: reopenReason.trim() }, calendar);
          onChange(row => ({ ...row, stagePlan: { ...plan, reopens: [...(plan.reopens ?? []), record] } })); setReopenReason(''); setClientOk(false); }); }}>
        <h4 className="font-medium">Buka ulang tahap (PIC campaign)</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Tahap<select aria-label="Tahap dibuka ulang" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" value={reopenKey || calendar[0]?.key} onChange={event => setReopenKey(event.target.value)}>{calendar.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label>
          <label className="text-sm">Terbuka sampai<Input aria-label="Batas buka ulang" type="date" required value={reopenUntil} onChange={event => setReopenUntil(event.target.value)}/></label>
        </div>
        <label className="block text-sm">Alasan<Textarea aria-label="Alasan buka ulang" value={reopenReason} onChange={event => setReopenReason(event.target.value)} maxLength={2000}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label="Disetujui klien" checked={clientOk} onChange={event => setClientOk(event.target.checked)}/> Klien sudah menyetujui</label>
        <Button type="submit">Buka ulang</Button>
      </form>}
      <p className="text-sm" data-testid="extension-quota">Perpanjangan tersisa: {extensionLeft} hari, {requestsLeft} pengajuan.</p>
      {hq && template && extensionLeft > 0 && requestsLeft > 0 && <form className="space-y-2 rounded-md border border-border p-3" onSubmit={event => { event.preventDefault();
        act(() => { const record = validateExtension({ stageKey: stageKey || template.stages[0].key, days: Number(days), reason, proof: proof() }, plan.extensions, template);
          onChange(row => ({ ...row, stagePlan: { ...plan, extensions: [...plan.extensions, record] } })); setReason(''); setProofText(''); setFile(null); }); }}>
        <h4 className="font-medium">Catat perpanjangan waktu</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Tahap<select aria-label="Tahap diperpanjang" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" value={stageKey || template.stages[0].key} onChange={event => setStageKey(event.target.value)}>{template.stages.map(stage => <option key={stage.key} value={stage.key}>{stage.label}</option>)}</select></label>
          <label className="text-sm">Tambahan hari<Input aria-label="Tambahan hari" type="number" min="1" max={Math.min(extensionLeft, maxExtensionDaysPerRequest)} step="1" value={days} onChange={event => setDays(event.target.value)}/></label>
        </div>
        <label className="block text-sm">Alasan (sakit, bencana, krisis digital, dan sejenisnya)<Textarea aria-label="Alasan perpanjangan" value={reason} onChange={event => setReason(event.target.value)} maxLength={2000}/></label>
        <label className="block text-sm">Jenis bukti<select aria-label="Jenis bukti" className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3" value={proofKind} onChange={event => setProofKind(event.target.value as 'text' | 'png' | 'jpeg')}><option value="text">Teks</option><option value="png">PNG</option><option value="jpeg">JPEG</option></select></label>
        {proofKind === 'text' ? <label className="block text-sm">Bukti (teks)<Textarea aria-label="Bukti teks" value={proofText} onChange={event => setProofText(event.target.value)} maxLength={2000}/></label>
          : <label className="block text-sm">Bukti (berkas {proofKind.toUpperCase()}, hanya nama dan ukuran yang dicatat)<Input aria-label="Berkas bukti" type="file" accept={proofKind === 'png' ? '.png' : '.jpg,.jpeg'} onChange={event => { const picked = event.target.files?.[0]; setFile(picked ? { name: picked.name, size: picked.size } : null); }}/></label>}
        <Button type="submit">Simpan perpanjangan</Button>
        <p className="text-xs text-muted-foreground">Izin karena sakit atau bencana alam: maksimal 2 kali di waktu berbeda, satu izin paling lama 2 hari berturut-turut. Payment ikut bergeser. Terpisah dari izin submit terlambat.</p>
      </form>}
    </>}
  </section>;
}
