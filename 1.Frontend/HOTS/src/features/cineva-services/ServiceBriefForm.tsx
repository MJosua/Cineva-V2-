import { useMemo, useRef, useState } from 'react';
import type { FormValues } from '@hots/dynamic-form';
import { Button } from '@/components/ui/button';
import { HotsForm } from '../cineva-shared/HotsForm';
import type { ProjectType } from '../cineva-shared/model';
import { validateBrief } from '../cineva-inquiries/domain';
import { briefSchema, services, serviceTypes } from './catalog';
import { estimate, type Quote, type RateCard } from './pricing';
import { QuoteBreakdown } from './QuoteBreakdown';

export function ServiceBriefForm({ rates, onSend, draft, onDraft }: { rates: RateCard; onSend: (type: ProjectType, values: FormValues) => void; draft?: { type: ProjectType; values: FormValues } | null; onDraft?: (draft: { type: ProjectType; values: FormValues }) => void }) {
  const [type, setType] = useState<ProjectType>(draft?.type ?? 'Content Shoot'), [prepared, setPrepared] = useState<Quote | null>(null), [error, setError] = useState('');
  const values = useRef<FormValues>({ durationHours: 2, days: 1, crew: 1, gear: 0, budget: 0, scheduledAt: '2026-10-21T10:00', ...draft?.values });
  const saveDraft = (nextType: ProjectType) => { try { onDraft?.({ type: nextType, values: values.current }); } catch { setError('Draft belum dapat disimpan pada browser.'); } };
  const schema = useMemo(() => briefSchema(type), [type]);
  const initial = useMemo(() => Object.fromEntries(schema.fields.map(f => [f.name, values.current[f.name] ?? ''])), [schema]);
  return <section className="space-y-4" aria-label="Brief permintaan jasa">
    <label htmlFor="service-type">Jenis layanan</label><select id="service-type" className="h-10 rounded-md border border-input bg-background px-3" value={type} onChange={e => { setType(e.target.value as ProjectType); setPrepared(null); setError(''); saveDraft(e.target.value as ProjectType); }}>{serviceTypes.map(name => <option key={name}>{name}</option>)}</select>
    <p className="text-sm text-muted-foreground">{services[type].description}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <HotsForm key={type} schema={schema} initialValues={initial} submitLabel="Hitung & siapkan brief" onValuesChange={next => { values.current = { ...values.current, ...next }; setPrepared(null); saveDraft(type); }} onSubmit={next => {
      try { validateBrief(type, next); setPrepared(estimate(type, Number(next.days), Number(next.crew), Number(next.gear), rates)); values.current = { ...values.current, ...next }; setError(''); }
      catch (failure) { setError((failure as Error).message); }
    }}/>
    {prepared && <><QuoteBreakdown quote={prepared} label="Estimasi awal"/><Button onClick={() => onSend(type, values.current)}>Kirim permintaan</Button></>}
  </section>;
}
