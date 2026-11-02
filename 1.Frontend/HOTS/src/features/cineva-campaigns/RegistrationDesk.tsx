import { useEffect, useState } from 'react';
import { createAppStorage } from '@hots/app-core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Actor } from '../cineva-inquiries/domain';
import type { Campaign } from './model';
import { createRegistrationRepository, duplicatesOf, statusLabels, type CreatorRegistration, type RegistrationRepository, type RegistrationStatus } from './registration';

export const registrationRepository = createRegistrationRepository(createAppStorage('cineva_registrations_dummy_v1'));
const select = 'h-10 rounded-md border border-input bg-background px-3';
const num = (value: string) => value.trim() === '' ? null : Number(value.replace(/\D/g, ''));

/** Layar pendaftaran creator per campaign: formulir daftar (Creator atau input HQ) dan daftar screening HQ dengan tanda pendaftar ganda. */
export function RegistrationDesk({ campaign, actor, repository = registrationRepository }: { campaign: Campaign; actor: Actor; repository?: RegistrationRepository }) {
  const [, refresh] = useState(0);
  useEffect(() => repository.subscribe(() => refresh(value => value + 1)), [repository]);
  const [form, setForm] = useState({ name: '', city: '', age: '', gender: 'Wanita', whatsapp: '', occupation: '', ig: '', igF: '', igN: '', tt: '', ttF: '', ttN: '' });
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [filter, setFilter] = useState<RegistrationStatus | 'semua'>('semua'), [pic, setPic] = useState(''), [open, setOpen] = useState(false);
  const rows = repository.list(actor, campaign.id), dupes = actor.product === 'hq' ? duplicatesOf(rows) : [];
  const dupeOf = (id: string) => dupes.filter(match => match.ids.includes(id));
  const nameOf = (id: string) => rows.find(row => row.id === id)?.name ?? id;
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm(value => ({ ...value, [key]: event.target.value }));
  const act = (action: () => void) => { try { action(); setError(''); } catch (failure) { setError((failure as Error).message); setMessage(''); } };
  const counts = { semua: rows.length, baru: 0, acc: 0, ditolak: 0 } as Record<RegistrationStatus | 'semua', number>;
  rows.forEach(row => { counts[row.status] += 1; });
  const rules = campaign.jobRules;
  return <section className="space-y-3 rounded-md border border-border p-4" aria-label="Pendaftaran creator" data-testid="registration-desk">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Pendaftaran creator</h3>
      <Button variant="outline" onClick={() => setOpen(value => !value)}>{open ? 'Tutup formulir' : actor.product === 'hq' ? 'Input pendaftar' : 'Daftar campaign ini'}</Button></div>
    <p className="text-xs text-muted-foreground">Syarat: {rules?.minAge ? `usia minimal ${rules.minAge}` : 'tanpa batas usia'}{rules?.requireLegalDoc ? ' · lampiran legal' : ''}{rules?.requireIdCard ? ' · KTP' : ''}. Pendaftar ganda dicek dari username, WhatsApp, dan nama.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p className="text-sm text-primary">{message}</p>}
    {open && <form className="grid gap-2 sm:grid-cols-3" onSubmit={event => { event.preventDefault(); act(() => {
      const result = repository.submit(actor, campaign.id, { name: form.name, city: form.city, age: Number(form.age), gender: form.gender as 'Pria' | 'Wanita', whatsapp: form.whatsapp, occupation: form.occupation,
        accounts: [{ platform: 'Instagram', username: form.ig, followers: num(form.igF), niche: form.igN }, { platform: 'TikTok', username: form.tt, followers: num(form.ttF), niche: form.ttN }] }, rules, new Date().toISOString());
      setMessage(result.duplicates.length ? 'Pendaftaran tersimpan, tetapi terdeteksi mirip pendaftar lain; HQ akan mengecek.' : 'Pendaftaran tersimpan. Status: Baru.'); setOpen(false);
    }); }}>
      <Input aria-label="Nama lengkap" placeholder="Nama lengkap" value={form.name} onChange={set('name')}/>
      <Input aria-label="Domisili" placeholder="Domisili" value={form.city} onChange={set('city')}/>
      <Input aria-label="Umur" type="number" placeholder="Umur" value={form.age} onChange={set('age')}/>
      <select aria-label="Gender" className={select} value={form.gender} onChange={set('gender')}><option>Wanita</option><option>Pria</option></select>
      <Input aria-label="WhatsApp" placeholder="No WhatsApp" value={form.whatsapp} onChange={set('whatsapp')}/>
      <Input aria-label="Pekerjaan" placeholder="Pekerjaan / info" value={form.occupation} onChange={set('occupation')}/>
      <Input aria-label="Username Instagram" placeholder="Username Instagram" value={form.ig} onChange={set('ig')}/>
      <Input aria-label="Followers Instagram" placeholder="Followers IG" value={form.igF} onChange={set('igF')}/>
      <Input aria-label="Niche Instagram" placeholder="Niche IG" value={form.igN} onChange={set('igN')}/>
      <Input aria-label="Username TikTok" placeholder="Username TikTok" value={form.tt} onChange={set('tt')}/>
      <Input aria-label="Followers TikTok" placeholder="Followers TikTok" value={form.ttF} onChange={set('ttF')}/>
      <Input aria-label="Niche TikTok" placeholder="Niche TikTok" value={form.ttN} onChange={set('ttN')}/>
      <Button type="submit" className="sm:col-span-3">Kirim pendaftaran</Button>
    </form>}
    {actor.product === 'hq' && <>
      <div className="flex flex-wrap items-center gap-2 text-sm">{(['semua', 'baru', 'acc', 'ditolak'] as const).map(key => <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} onClick={() => setFilter(key)}>{key === 'semua' ? 'Semua' : statusLabels[key]} ({counts[key]})</Button>)}
        <Input aria-label="PIC screening" className="w-40" placeholder="Nama PIC screening" value={pic} onChange={event => setPic(event.target.value)}/></div>
      <div className="overflow-x-auto"><table className="min-w-[860px] text-xs"><thead><tr className="text-left">
        <th className="p-1">Nama</th><th className="p-1">Domisili</th><th className="p-1">Umur</th><th className="p-1">Instagram</th><th className="p-1">TikTok</th><th className="p-1">WA</th><th className="p-1">Status</th><th className="p-1">PIC</th><th className="p-1">Aksi</th></tr></thead>
        <tbody>{rows.filter(row => filter === 'semua' || row.status === filter).map((row: CreatorRegistration) => { const ig = row.accounts.find(a => a.platform === 'Instagram'), tt = row.accounts.find(a => a.platform === 'TikTok'), dup = dupeOf(row.id);
          return <tr key={row.id} className="border-t border-border align-top" data-testid={`registration-${row.id}`}>
            <td className="p-1 font-medium">{row.name}{dup.map((match, i) => <span key={i} className={`mt-0.5 block rounded px-1 ${match.confirmed ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>{match.confirmed ? 'Ganda' : 'Mirip'} ({match.by.join(', ')}) dengan {nameOf(match.ids.find(id => id !== row.id)!)}</span>)}</td>
            <td className="p-1">{row.city}</td><td className="p-1">{row.age}</td>
            <td className="p-1">{ig ? `@${ig.username} · ${ig.followers?.toLocaleString('id-ID') ?? '-'} · ${ig.niche}` : '-'}</td>
            <td className="p-1">{tt ? `@${tt.username} · ${tt.followers?.toLocaleString('id-ID') ?? '-'} · ${tt.niche}` : '-'}</td>
            <td className="p-1">{row.whatsapp}</td><td className="p-1">{statusLabels[row.status]}</td><td className="p-1">{row.pic ?? '-'}</td>
            <td className="p-1"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => act(() => repository.decide(actor, row.id, 'acc', pic, '', new Date().toISOString()))}>ACC</Button>
              <Button size="sm" variant="outline" onClick={() => act(() => repository.decide(actor, row.id, 'ditolak', pic, '', new Date().toISOString()))}>Tolak</Button></div></td>
          </tr>; })}</tbody></table></div>
      <p className="text-xs text-muted-foreground">ACC di sini belum otomatis membuat talent assignment; tambahkan lewat "Tambah talent assignment". Data contoh sintetis.</p>
    </>}
    {actor.product === 'creator' && rows.map(row => <p key={row.id} className="text-sm">Pendaftaran Anda ({row.name}) · status {statusLabels[row.status]}</p>)}
  </section>;
}
