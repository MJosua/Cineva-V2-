import { ReferenceSummary } from './ReferenceSummary';
import { isNicheFromFollowers } from './profileMapping';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { readLiveExcel, type ExcelField, type LiveExcel } from './liveSource';
const raw = (value: ExcelField['value']) => value === null || value === '' ? 'Kosong di Excel' : String(value);
/** Live local reader only; no source cells copied into application ledgers. */
export function ReferenceAccounts({ basePath }: { basePath: string }) {
  const location = useLocation(), [data, setData] = useState<LiveExcel | null>(null);
  const [error, setError] = useState(''), [refresh, setRefresh] = useState(0), [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    readLiveExcel(controller.signal).then(next => { setData(next); setError(''); }).catch(failure => { if (!controller.signal.aborted) setError((failure as Error).message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => { const timer = window.setInterval(() => setRefresh(n => n + 1), 30000); return () => window.clearInterval(timer); }, []);
  const requested = new URLSearchParams(location.search).get('account');
  const selected = data?.accounts.find(account => account.id === requested) ?? data?.accounts[0];
  return <section className="space-y-5" data-testid="reference-accounts">
    <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
      <Badge variant="secondary">Excel live · data asli · hanya baca</Badge>
      <p>Nama dan isi sel ditampilkan apa adanya dari tiga akun terpilih. Data tidak dimasukkan ke database, localStorage atau ledger aplikasi.</p>
      <p>Otomatis baca ulang setiap 30 detik, atau gunakan tombol di bawah. Simpan perubahan di Excel terlebih dahulu. Formula menampilkan nilai cache Excel dan rumus sumber; pembaca tidak menghitung ulang formula.</p>
      <Button variant="outline" disabled={loading} onClick={() => setRefresh(n => n + 1)}>{loading ? 'Membaca Excel...' : 'Muat ulang dari Excel'}</Button>
      {data && <p>Terakhir dibaca: {new Date(data.readAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>}
      {error && <p role="alert" className="text-destructive">{error}{data ? ' Tampilan masih memakai pembacaan terakhir; belum terbaru.' : ''}</p>}
    </div>
    {selected && <>
      <nav className="flex flex-wrap gap-2" aria-label="Pilih akun referensi">{data!.accounts.map(account => <Link key={account.id} aria-current={selected.id === account.id ? 'page' : undefined} className={`rounded-md border px-4 py-2 text-sm font-medium ${selected.id === account.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`} to={`${basePath}/creator/reference?account=${account.id}`}>{account.name}</Link>)}</nav>
      <Card><CardHeader><CardTitle>Hai, {selected.name}.</CardTitle></CardHeader><CardContent className="space-y-2 break-words text-sm"><p>{selected.sourceFile}</p><p>{selected.sheet} · roster baris {selected.sourceRow}</p><p className="text-muted-foreground">Nilai kosong ditandai “Kosong di Excel”. STATUS PAYMENT tetap teks sumber, bukan otomatis kas diterima. Budget/benefit campaign tidak otomatis menjadi fee pribadi.</p></CardContent></Card>
      <ReferenceSummary account={selected}/>
      {selected.sections.map((section, i) => <Card key={`${selected.id}-${i}`}><CardHeader><CardTitle>{section.title}</CardTitle></CardHeader><CardContent className="space-y-3">
        {section.note && <p className="text-sm">{section.note}</p>}
        {section.fields.map(field => <div key={field.cell} className="space-y-2 rounded-md border border-border p-3 text-sm" data-testid="excel-source-field"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{isNicheFromFollowers(field) ? `Niche konten (header Excel: ${field.label.trim()})` : field.label}</p><Badge variant="outline">{field.cell}</Badge></div><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{raw(field.value)}</p>{field.formula && <p className="break-all font-mono text-xs">Rumus: {field.formula}</p>}<p className="text-xs text-muted-foreground">Tipe: {field.cellType} · Format Excel: {field.numberFormat}</p></div>)}
      </CardContent></Card>)}
      <details className="rounded-md border border-border p-4 text-sm"><summary className="cursor-pointer font-medium">Asal data dan cara crosscheck</summary><div className="mt-3 space-y-2 break-all"><p>{selected.sourceFile} → {selected.sheet} → baris {selected.sourceRow}. Buka koordinat pada setiap kartu untuk membandingkan sel.</p><p>SHA256 saat dibaca: {selected.sha256}</p><p>Bagian lanjutan hanya digabung jika nama cocok secara unik dalam sheet yang sama. Ini bukan login atau rekonsiliasi identity lintas campaign. URL ditampilkan sebagai teks dan tidak dibuka otomatis.</p></div></details>
    </>}
  </section>;
}
