import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { DemoData } from './model';
import { validateData } from './validation';
export function DataPanel({ data, onReplace }: { data: DemoData; onReplace: (data: DemoData) => void }) {
  const [draft, setDraft] = useState(() => JSON.stringify(data, null, 2)), [error, setError] = useState('');
  const apply = (text: string) => { try { if (text.length > 5000000) throw new Error('JSON maksimal 5 MB.'); const next: unknown = JSON.parse(text); validateData(next); onReplace(next); setError(''); } catch (failure) { setError((failure as Error).message); } };
  return <Card><CardContent className="space-y-4 p-5"><h2 className="text-xl font-semibold">Dokumen JSON / NoSQL demo</h2><p className="text-sm text-muted-foreground">Form adalah editor utama. JSON ini untuk crosscheck, backup dan pertukaran dokumen; bukan schema database production. rawSource mempertahankan sel asli.</p>
    <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDraft(JSON.stringify(data, null, 2))}>Ambil data terbaru ke editor</Button><label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm">Import JSON<input aria-label="Import JSON" className="mt-2 block max-w-full" type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5000000) { setError('JSON maksimal 5 MB.'); return; } void file.text().then(text => { setDraft(text); apply(text); }).catch(() => setError('File tidak dapat dibaca.')); }}/></label></div>
    <Textarea aria-label="Editor JSON dokumen" className="min-h-[420px] font-mono text-xs" value={draft} onChange={event => setDraft(event.target.value)}/>
    <Button onClick={() => apply(draft)}>Terapkan JSON</Button>{error && <p role="alert" className="text-destructive">{error}</p>}
  </CardContent></Card>;
}
