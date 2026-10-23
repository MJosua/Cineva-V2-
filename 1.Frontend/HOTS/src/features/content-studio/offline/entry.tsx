import {useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button} from '@/components/ui/button';
import {ContentStudio} from '../Studio';
import {createStudioPreview} from '../preview';
import {CinevaVendorTheme} from '../../cineva-shared/CinevaVendorTheme';
import {download} from '../export';
import {validatePortable,safeJson} from './model';
import {createPortableStorage} from './storage';
import {downloadPortable} from './export';
import './portable.css';
export function PortableDemo(){
  const [role,setRole]=useState<'hq'|'creator'>('hq'),[epoch,setEpoch]=useState(0),[warning,setWarning]=useState(''),[notice,setNotice]=useState(''),[dark,setDark]=useState(()=>document.documentElement.classList.contains('dark')),[help,setHelp]=useState(false),[reset,setReset]=useState(false);
  const storage=useMemo(()=>{const seed=document.getElementById('cineva-studio-seed');if(!seed)throw new Error('DEMO_SEED_MISSING');return createPortableStorage(validatePortable(JSON.parse(seed.textContent??'')),seed.getAttribute('data-storage-id')??'offline',message=>queueMicrotask(()=>setWarning(message)));},[]);
  const port=useMemo(()=>createStudioPreview({id:`portable-${role}`,product:role},{storage:storage.forRole(role)}),[storage,role]);
  const start=storage.snapshot().workspaces[role].documents[0]?.id;
  return <CinevaVendorTheme><div className="portable-demo"><header className="portable-header"><div><a href="#" className="portable-logo" onClick={e=>e.preventDefault()}>cineva<span>.</span></a><p>Content Studio · Demo interaktif</p></div><div className="portable-actions"><Button variant="ghost" onClick={()=>{document.documentElement.classList.toggle('dark',!dark);setDark(!dark);}}>{dark?'Tema terang':'Tema gelap'}</Button><Button variant="outline" onClick={()=>setHelp(!help)}>Cara demo</Button><Button aria-label="Unduh HTML terbaru" onClick={()=>{downloadPortable(storage.snapshot());setNotice('HTML terbaru diunduh. Kirim file hasil download tersebut agar penerima mendapat perubahan yang sudah disimpan.');}}>Unduh HTML terbaru</Button></div></header>
    <main className="portable-main"><section className="portable-intro"><div><p className="portable-kicker">CINEVA / PRODUCT EXPERIENCE</p><h1>Dari ide sampai siap dibagikan.</h1><p>Coba editor carousel, brand kit, persetujuan, kalender, dan analitik dalam satu demo.</p></div><div className="portable-role" role="group" aria-label="Pilih workspace demo"><Button variant={role==='hq'?'default':'outline'} onClick={()=>setRole('hq')}>Cineva HQ</Button><Button variant={role==='creator'?'default':'outline'} onClick={()=>setRole('creator')}>Creator Space</Button></div></section>
    <div className="portable-disclosure"><strong>Demo offline</strong><span>Data contoh. Tidak mengirim posting, menghubungkan akun nyata, atau menjalankan AI online.</span></div>
    {warning&&<p role="alert" className="portable-warning">{warning}</p>}{notice&&<p role="status" className="portable-notice">{notice}</p>}
    {help&&<section className="portable-help"><h2>Alur presentasi singkat</h2><ol><li>Buka contoh konten, ganti template, lalu edit teks atau foto.</li><li>Klik Simpan dan Ekspor PNG untuk mendapat gambar slide.</li><li>Ajukan QC, lalu Setujui QC di workspace HQ.</li><li>Buka Jadwal, pilih konten dan akun demo, lalu Kirim sekarang.</li><li>Jalankan worker demo, kemudian lihat Analitik.</li></ol><p>Brand Kit berlaku untuk dokumen baru. Perubahan pada demo perlu disimpan sebelum memakai Unduh HTML terbaru.</p></section>}
    <ContentStudio key={`${role}-${epoch}`} port={port} canApprove={role==='hq'} initialDocumentId={start}/>
    <footer className="portable-footer"><p>Emas, putih, dan hitam Cineva. Semua fitur demo berjalan di perangkat Anda.</p><div><Button variant="ghost" size="sm" onClick={()=>download(new Blob([safeJson(storage.snapshot())],{type:'application/json'}),'Cineva-Demo-Data.json')}>Ekspor data</Button><label className="portable-import">Impor data<input aria-label="Impor data demo" type="file" accept="application/json,.json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>12000000)throw new Error('File terlalu besar.');storage.replace(validatePortable(JSON.parse(await file.text())));setEpoch(n=>n+1);setNotice('Data demo berhasil dimuat.');}catch{setWarning('File demo tidak valid. Data sebelumnya tetap dipertahankan.');}e.target.value='';}}/></label><Button variant="ghost" size="sm" onClick={()=>setReset(true)}>Reset contoh</Button></div></footer>
    {reset&&<div className="portable-confirm" role="dialog" aria-modal="true" aria-label="Konfirmasi reset demo"><div><h2>Kembalikan contoh awal?</h2><p>Perubahan yang belum diunduh akan diganti dengan contoh bawaan file ini.</p><div className="flex gap-3 mt-5"><Button variant="outline" onClick={()=>setReset(false)}>Batal</Button><Button onClick={()=>{const seed=document.getElementById('cineva-studio-seed')!;storage.replace(validatePortable(JSON.parse(seed.textContent??'')));setEpoch(n=>n+1);setReset(false);setNotice('Contoh awal dikembalikan.');}}>Ya, reset contoh</Button></div></div></div>}
    </main></div></CinevaVendorTheme>;
}
try{createRoot(document.getElementById('root')!).render(<PortableDemo/>);}catch{document.getElementById('root')!.textContent='Demo tidak dapat dimuat. Buka file HTML lengkap di browser modern.';}
