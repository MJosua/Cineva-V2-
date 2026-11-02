import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign, TalentAssignment } from './model';
import { addRatingCriterion, ratingAverage, recordRating, type RatingCriterion } from './rating';

const selectClass = 'mt-1 block h-10 w-full rounded-md border border-input bg-background px-3';

/** Butir penilaian per campaign, disusun HQ pemilik (jawaban N4: tergantung penanggung jawab project). */
export function RatingCriteriaEditor({ campaign, onChange }: { campaign: Campaign; onChange: (update: (row: Campaign) => Campaign) => void }) {
  const [label, setLabel] = useState(''), [error, setError] = useState('');
  const criteria = campaign.ratingCriteria ?? [];
  return <details className="space-y-2 rounded-md border border-border p-3" data-testid="rating-criteria">
    <summary className="cursor-pointer font-semibold">Butir penilaian crew ({criteria.length})</summary>
    {criteria.length > 0 && <ul className="list-inside list-disc text-sm">{criteria.map(item => <li key={item.id}>{item.label}</li>)}</ul>}
    <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault();
      try { const id = `criterion-${crypto.randomUUID()}`, text = label; onChange(row => addRatingCriterion(row, text, id)); setLabel(''); setError(''); } catch (failure) { setError((failure as Error).message); } }}>
      <Input aria-label="Butir penilaian baru" className="max-w-sm" value={label} onChange={event => setLabel(event.target.value)} placeholder="Contoh: Ketepatan waktu"/>
      <Button type="submit" variant="outline">Tambah butir</Button>
    </form>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Butir hanya bertambah agar nilai lama tetap bermakna. Skala 1 sampai 5. Pemetaan nilai ke grade belum ditentukan client.</p>
  </details>;
}

/** Penilaian per assignment, dicatat HQ per putaran. Creator tidak melihat panel ini. */
export function RatingPanel({ assignment, criteria, actor, onChange }: { assignment: TalentAssignment; criteria: RatingCriterion[]; actor: Actor; onChange: (update: (row: TalentAssignment) => TalentAssignment) => void }) {
  const [scores, setScores] = useState<Record<string, string>>({}), [comment, setComment] = useState(''), [cooperation, setCooperation] = useState(''), [error, setError] = useState('');
  if (actor.product !== 'hq') return null;
  const ratings = assignment.ratings ?? [];
  const submit = () => {
    try {
      const numeric = Object.fromEntries(criteria.map(item => [item.id, Number(scores[item.id])]));
      const id = `rating-${crypto.randomUUID()}`, text = comment, cooperate = cooperation as '' | 'yes' | 'no';
      onChange(row => recordRating(row, criteria, actor, { id, scores: numeric, comment: text, ...(cooperate ? { continueCooperation: cooperate } : {}) }));
      setScores({}); setComment(''); setCooperation(''); setError('');
    } catch (failure) { setError((failure as Error).message); }
  };
  return <section className="space-y-3 rounded-md border border-border p-3" data-testid="assignment-rating" aria-label={`Penilaian ${assignment.creatorName}`}>
    <h4 className="font-semibold">Penilaian kinerja</h4>
    {!criteria.length && <p className="text-sm text-muted-foreground">Susun butir penilaian campaign lebih dulu.</p>}
    {criteria.length > 0 && <>
      <div className="grid gap-3 sm:grid-cols-2">{criteria.map(item => <label key={item.id} className="text-sm">{item.label}
        <select aria-label={`Nilai ${item.label}`} className={selectClass} value={scores[item.id] ?? ''} onChange={event => setScores(current => ({ ...current, [item.id]: event.target.value }))}>
          <option value="">Pilih nilai</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}</div>
      <label className="block text-sm">Komentar<Textarea aria-label="Komentar penilaian" value={comment} onChange={event => setComment(event.target.value)} maxLength={2000}/></label>
      <label className="block text-sm">Lanjut kerja sama?
        <select aria-label="Lanjut kerja sama" className={selectClass} value={cooperation} onChange={event => setCooperation(event.target.value)}><option value="">Belum ditentukan</option><option value="yes">Ya</option><option value="no">Tidak</option></select></label>
      <Button onClick={submit}>Simpan penilaian</Button>
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {ratings.length > 0 && <ol className="space-y-1 text-sm">{[...ratings].reverse().map(rating => <li key={rating.id}>
      {new Date(rating.ratedAt).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })} · rata-rata {ratingAverage(rating)?.toLocaleString('id-ID')}
      {rating.continueCooperation ? ` · lanjut kerja sama: ${rating.continueCooperation === 'yes' ? 'ya' : 'tidak'}` : ''}{rating.comment ? ` · ${rating.comment}` : ''}</li>)}</ol>}
  </section>;
}
