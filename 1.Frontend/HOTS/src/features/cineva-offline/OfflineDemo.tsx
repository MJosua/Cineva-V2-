import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CinevaVendorTheme } from '../cineva-shared/CinevaVendorTheme';
import { CalendarPanel } from './CalendarPanel';
import { CampaignPanel, DashboardPanel, DeliverablesPanel, InsightsPanel, PaymentsPanel, ProfilePanel } from './DocumentPanels';
import { DataPanel } from './DataPanel';
import { documentStore } from './documentStore';
import { createOfflineCommandRegistry } from './commands';
import { downloadFile, exportHtml } from './portableExport';
import type { DemoData } from './model';
import './offline.css';
const navigation = [['dashboard', 'Dashboard'], ['campaign', 'Campaign & brief'], ['deliverables', 'Deliverable'], ['calendar', 'Kalender & visit'], ['payments', 'Pembayaran'], ['insights', 'Insight'], ['profile', 'Profil Creator'], ['data', 'Data JSON']] as const;
export function OfflineDemo({ seed, storageId }: { seed: DemoData; storageId: string }) {
  const [store] = useState(() => documentStore(storageId));
  const [loadError] = useState(() => { try { store.load(seed); return ''; } catch { return 'Data browser tidak valid; data bawaan ditampilkan tanpa menimpa penyimpanan.'; } });
  const [data, setData] = useState(() => { try { return store.load(seed); } catch { return structuredClone(seed); } });
  const [commands] = useState(createOfflineCommandRegistry);
  const current = useRef({ data, revision: 0 });
  const renderedRevision = current.current.revision;
  const [tab, setTab] = useState('dashboard'), [error, setError] = useState(''), [notice, setNotice] = useState(loadError), [dark, setDark] = useState(false);
  const apply = (update: (data: DemoData) => DemoData) => {
    const proposed = structuredClone(update(structuredClone(data))); proposed.editedAt = new Date().toISOString();
    const next = commands.execute('document.update', { state: current.current.data, input: { next: proposed }, context: { mode: 'offline-demo', canEdit: true }, expectedRevision: renderedRevision, revision: current.current.revision });
    const persisted = store.save(next); current.current = { data: next, revision: current.current.revision + 1 }; setData(next); setError('');
    setNotice(persisted ? 'Perubahan tersimpan di browser ini.' : 'Browser tidak menyimpan localStorage. Perubahan hanya di sesi ini; Export HTML atau JSON untuk menyimpannya.');
  };
  const run = (action: () => void) => { try { action(); setError(''); } catch (failure) { setError((failure as Error).message); } };
  const panelProps = { data, onChange: apply };
  return <CinevaVendorTheme><div className="offline-shell">
    <aside className="offline-sidebar"><div className="p-6"><h1 className="text-2xl font-semibold">Cineva<span className="text-sidebar-primary">.</span></h1><p className="mt-2 text-sm">Creator Space · client demo</p><Badge variant="secondary" className="mt-3">Offline · editable</Badge></div><nav aria-label="Menu demo" className="offline-nav">{navigation.map(([key, label]) => <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => { setTab(key); setError(''); }} className={tab === key ? 'active' : ''}>{label}</button>)}</nav><div className="p-6 text-sm"><strong>{data.user.name}</strong><p className="mt-2">HOTS modular engine</p></div></aside>
    <main className="min-w-0"><header className="offline-header"><div><p className="font-semibold">{data.user.name}</p><p className="text-xs text-muted-foreground">{data.campaign.title} · data referensi dan simulasi</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { document.documentElement.classList.toggle('dark', !dark); setDark(!dark); }}>{dark ? 'Tema terang' : 'Tema gelap'}</Button><Button size="sm" variant="outline" onClick={() => run(() => downloadFile('cineva-data-edited.json', JSON.stringify(data, null, 2), 'application/json'))}>Export JSON</Button><Button size="sm" onClick={() => run(() => downloadFile('Cineva-Demo-Edited.html', exportHtml(data), 'text/html'))}>Export HTML terbaru</Button></div></header>
      <div className="offline-content space-y-5"><div className="rounded-md border border-border bg-muted/40 p-3 text-sm">Demo mandiri dari referensi Excel. Semua perubahan/pembayaran di sini adalah simulasi lokal. Tidak terhubung database atau mengubah Excel.</div>
        <h2 className="text-2xl font-semibold">{navigation.find(([key]) => key === tab)?.[1]}</h2>{notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}{error && <p role="alert" className="text-destructive">{error}</p>}
        {tab === 'dashboard' && <DashboardPanel {...panelProps}/>}{tab === 'campaign' && <CampaignPanel {...panelProps}/>}{tab === 'profile' && <ProfilePanel {...panelProps}/>}{tab === 'payments' && <PaymentsPanel {...panelProps}/>}{tab === 'insights' && <InsightsPanel {...panelProps}/>}{tab === 'deliverables' && <DeliverablesPanel {...panelProps}/>}
        {tab === 'calendar' && <CalendarPanel events={data.events} onSave={event => apply(current => ({ ...current, events: current.events.map(item => item.id === event.id ? event : item) }))} onAdd={() => apply(current => ({ ...current, events: [...current.events, { id: crypto.randomUUID(), title: 'Visit baru (simulasi)', kind: 'visit', startDate: null, endDate: null, allDay: true, rawDate: '', sourceCell: '', requiresReview: true, note: 'Ditambahkan manual pada demo; belum booking nyata.' }] }))}/>}
        {tab === 'data' && <DataPanel data={data} onReplace={next => apply(() => next)}/>}
        <details className="rounded-md border border-border p-4 text-sm"><summary className="cursor-pointer font-medium">Sumber, catatan tanggal dan pemulihan</summary><div className="mt-3 space-y-3"><p>{data.source.file} · {data.source.sheet} · roster {data.source.rosterRow} · insight {data.source.insightRow}</p><ul className="list-inside list-disc space-y-2">{data.notes.map((note, i) => <li key={i}>{note}</li>)}</ul><p>localStorage hanya pada browser/perangkat ini; untuk dikirim ke client gunakan Export HTML terbaru. HTML hasil export sudah membawa seluruh data terakhir.</p><Button variant="outline" onClick={() => run(() => apply(() => structuredClone(seed)))}>Pulihkan data bawaan</Button></div></details>
      </div>
    </main>
  </div></CinevaVendorTheme>;
}
