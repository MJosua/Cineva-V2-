import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const base=path.join(root,'3.Knowledge/reports/saas_audit_2026_10_21');
const out=path.join(base,'outputs/saas_audit_2026_10_21');
await fs.mkdir(out,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(base,'evidence.json'),'utf8'));
const w=Workbook.create();
const defs=[
 ['Ringkasan',['Area','Status','Implikasi'],[
  ['Kesiapan SaaS','Belum siap','Fondasi modular ada; isolasi tenant belum menyeluruh.'],
  ['Cineva backend','Scope tidak konsisten','Marketplace/billing menunjukkan gap query terisolasi.'],
  ['Overseas PAR','Multi-company','Policy company/participant ada; perlu tenant gate sebelum admin/domain policy.'],
  ['Branding JSON','Parsial','Adapter vendor statis; belum resolver JSON tenant end-to-end.'],
  ['Database','DDL belum tersedia','Schema Cineva di knowledge masih draft; belum membuat SQL.'],
  ['Pilihan transisi','Database per tenant','Shared platform/cluster dahulu; shared tables setelah tenant gate tervalidasi.'],
  ['Pemeriksaan','5 reproduksi stub','Membuktikan query controller; bukan HTTP/production/security certification.'],
  ['Batas perubahan','Dokumentasi dan audit','Tidak ada edit aplikasi, DB, deployment atau Kantor.'],
  ['Keputusan package','Wajib frontend dan backend','Contract bersama + tenant-client + tenant-server; rancangan, belum implementasi.'],
 ],[27,29,83]],
 ['Temuan',['ID','Prioritas','Area','Status','Bukti','Tindakan','', 'Sumber'],data.findings.map((r,i)=>[...r.slice(0,6),'',r[6]+':'+data.evidence[i].line]),[10,12,27,24,65,65,3,100]],
 ['Tahapan',['Tahap','Hasil','Acceptance'],[
  ['0. Inventaris','DDL fisik + ownership','Tenant/company/product jelas; DDL terbaru tersedia.'],
  ['1. Boundary','TenantContext + membership','Spoofed/missing tenant ditolak; admin tenant tidak global.'],
  ['2. Persistence','Scoped repository + transaksi','Negative cross-tenant join/write + rollback/fault injection.'],
  ['3. Branding','JSON resolver + editor','Dua tenant satu build; preview/publish/rollback; asset ownership.'],
  ['4. Domain/kanal','Cineva/Overseas adapters','List/detail/count/export/files/cache/job/SSE diuji lintas tenant.'],
  ['5. Operasional','Provisioning + entitlement','Suspend/revoke, webhook signature/replay, quota, backup/restore.'],
 ],[25,35,82]],
 ['Pemeriksaan',['ID','Observasi','Hasil','Batas'],data.checks.map(c=>[c.id,c.observation,c.result,'VM stub query; tidak mengakses DB atau HTTP production.']),[10,85,19,60]],
 ['Kontrak Package',['Package usulan','Tanggung jawab','Acceptance'],[
  ['@hots/tenant-contracts','Context/config/error schema bersama','Validasi format/version; tanpa secrets/DB atau otorisasi browser.'],
  ['@hots/tenant-client','Provider, switch, cache/storage, request dan SSE lifecycle','Switch A ke B tidak menerima respons/data/event A; cache terpisah.'],
  ['@hots/tenant-server','Verified context, membership/policy, scoped adapters','Missing/spoofed tenant ditolak; admin, repository, file/job/event tenant-scoped.'],
  ['Adapter existing','app-core, engine-client, ui-kit, transaction, notification','Consumer nyata wajib memakai adapter; EAV/domain policy dipertahankan.'],
  ['Status implementasi','Rancangan wajib, belum dibuat/dipasang','Unit contract + integration dua tenant sebelum aktivasi multi-tenant.'],
 ],[30,70,86]],
 ['Standar SaaS SSO',['Standar','Ketentuan target','Acceptance / status'],[
  ['Definisi terbaru','Tenant = HOTS Normal/Overseas/Cineva; company = Indofood/IndoUSA.','Menggantikan interpretasi tenant sebagai pelanggan pada rekomendasi historis.'],
  ['Identity dan membership','Satu global user; akses role/permission per tenant-company.','Login tidak otomatis memberi akses semua program/company.'],
  ['SSO pusat','OIDC client per aplikasi; Authorization Code + PKCE S256.','Source fondasi ada; runtime, redirect, revoke dan recovery belum diaudit end-to-end.'],
  ['Kontrak session','Verifikasi issuer/audience/subject; context app/company dan permission version.','Switch company sah; dua tab beda program/company tidak saling menimpa.'],
  ['Authorization','Platform admin berbeda dari tenant admin; client dibatasi relasi bisnis.','Default deny; akses program kosong tidak berarti grant implisit.'],
  ['Package isolation','Contract/client/server dipakai engine, repository dan kanal.','Cross-context API/file/cache/job/SSE ditolak; belum implementasi.'],
  ['Database','Ownership legacy, relasi, constraints, index dan transaksi.','Mapping berdasarkan bukti; tanpa repair otomatis; rollback/concurrency diuji.'],
  ['Brand JSON','Tenant/company precedence, schema version, asset ownership.','Visual editor, draft/preview/publish/history/rollback.'],
  ['Session lifecycle','Invite/suspend/revoke, MFA/step-up sensitif, app/global logout.','Akses company lain tetap sah; token lama tidak mempertahankan izin tanpa batas.'],
  ['API dan event','Version/error/input/idempotency dan sync/outbox eksplisit.','Atomic failure, replay dan retry tidak menggandakan efek bisnis.'],
  ['Entitlement dan billing','Hak fitur berbeda dari role; SaaS billing berbeda dari payout talent.','Provider signature/idempotency jika billing diaktifkan.'],
  ['Operasional dan acceptance','SSE audit log scoped, redaksi, backup/restore, release rollback.','Dua tenant/company multi-role; source review bukan sertifikasi deployment.'],
 ],[30,85,90]],
];
for(const[name,headers,rows,widths]of defs){
 const s=w.worksheets.add(name),last=String.fromCharCode(64+headers.length),end=rows.length+5;
 s.showGridLines=false;
 s.getRange('A2').values=[['Audit SaaS Cineva dan Overseas']];
 s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#483326'};
 s.getRange('A3').values=[['21 Oktober 2026. Source dan stub terisolasi; belum validasi produksi.']];
 s.getRange('A3').format.font={name:'Arial',size:10,italic:true};
 s.getRange(`A5:${last}5`).values=[headers];
 s.getRange(`A6:${last}${end}`).values=rows;
 s.getRange(`A5:${last}${end}`).format.font={name:'Arial',size:10};
 s.getRange(`A5:${last}${end}`).format.wrapText=true;
 s.getRange(`A5:${last}${end}`).format.verticalAlignment='top';
 s.getRange(`A5:${last}5`).format.fill='#483326';
 s.getRange(`A5:${last}5`).format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
 s.getRange(`A5:${last}5`).format.horizontalAlignment='center';
 s.getRange(`A5:${last}5`).format.rowHeight=27;
 widths.forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
 for(let i=6;i<=end;i++){
   s.getRange(`A${i}:${last}${i}`).format.rowHeight=name==='Temuan'?42:32;
   if(i%2===0)s.getRange(`A${i}:${last}${i}`).format.fill='#F5F0E7';
 }
 if(name==='Temuan'){s.getRange(`G5:G${end}`).format.fill='#FFFFFF';s.getRange('G5').values=[['']];}
 if(name!=='Ringkasan')s.freezePanes.freezeRows(5);
}
w.recalculate();
await fs.writeFile(path.join(base,'workbook_inspection.ndjson'),(await w.inspect({kind:'sheet',include:'id,name',maxChars:2000})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'SaaS_Readiness.xlsx'));
for(const[name,,rows]of defs){
 const ranges=name==='Temuan'?['A5:F13','A14:F22','H5:H13','H14:H22']:[`A2:${name==='Pemeriksaan'?'D':'C'}${rows.length+5}`];
 for(let i=0;i<ranges.length;i++){
  const blob=await w.render({sheetName:name,range:ranges[i],scale:1});
  await fs.writeFile(path.join(base,`preview_${name}_${i}.png`),new Uint8Array(await blob.arrayBuffer()));
 }
}
process.stdout.write('[SAAS-AUDIT][INFO] : Workbook exported, 6 sheets, previews rendered.\n');
