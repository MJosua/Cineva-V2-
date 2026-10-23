import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'3.Knowledge/reports/voice_implementation_plan_2026_10_18');
await fs.mkdir(out,{recursive:true});
const rows=[
 ['1','Katalog, brief, estimator','Fondasi preview existing','Tiga layanan; form brief per tipe; rate card dummy dan snapshot quote.','E2E semua layanan, validasi, subtotal/total, quote lama stabil.'],
 ['2','Permintaan B ke A','Paket 1','Request Creator/client; queue HQ; quote; persetujuan; konversi project sekali.','E2E sharing terarah, retry/save failure, reload, tidak duplicate atau membuka finance pribadi.'],
 ['3','CS AI dan manusia','Paket 2','Percakapan terkait inquiry; inbox agen; assignment; handover; fake AI adapter.','E2E konteks terjaga, AI berhenti saat handover, timeout/retry tidak menggandakan pesan.'],
 ['4','Integrasi dan regresi','Paket 1–3','Journey layanan sampai project/jadwal/deliverable/pembayaran/arsip dummy.','E2E desktop/mobile, contracts, components, products, theme, build; guard 1.000 baris.'],
 ['5','Backend nyata (ditunda)','Scope DB dibuka; schema dan akses terverifikasi','Adapters HOTS; tenancy; transaksi/idempotency; local LLM; CMS.','Dummy DB E2E, cross-tenant denial, rollback/retry dan event setelah commit.']
];
const w=Workbook.create(),s=w.worksheets.add('Rencana');s.showGridLines=false;
s.getRange('A2').values=[['Rencana Cineva A/B dari voice note']];
s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};
s.getRange('A3').values=[['Status seluruh paket: direncanakan. Tidak ada implementasi atau tes baru pada tugas perencanaan ini.']];
s.getRange('A3').format.font={name:'Arial',size:10,italic:true};
s.getRange('A5:E5').values=[['Paket','Cakupan','Dependensi','Hasil yang dituju','Acceptance yang akan diuji']];
s.getRange('A6:E10').values=rows;
s.getRange('A5:E10').format.font={name:'Arial',size:11};s.getRange('A5:E10').format.wrapText=true;s.getRange('A5:E10').format.verticalAlignment='top';
s.getRange('A5:E5').format.fill='#483326';s.getRange('A5:E5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};
[9,30,34,58,65].forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}10`).format.columnWidth=width);
s.getRange('A5:E5').format.rowHeight=29;s.getRange('A6:E10').format.rowHeight=86;
s.getRange('A12').values=[['Batas: HOTS kantor read-only; CSS vendor dipertahankan; DB/provider nyata tidak dipakai pada Paket 1–4.']];
s.getRange('A13').values=[['Tes dijalankan setiap paket; Paket 4 menambah regresi lintas alur, bukan menunda pengujian.']];
s.getRange('A15').values=[['Sumber: 3.Knowledge/architecture/implementation_plan_voice_2026_10_18.md dan voice_requirements_2026_10_18.md.']];
for(const r of ['A12','A13','A15'])s.getRange(r).format.font={name:'Arial',size:10,italic:true};
w.recalculate();
await fs.writeFile(path.join(out,'workbook-inspect.json'),(await w.inspect({kind:'table',range:'Rencana!A5:E10',include:'values,formulas',tableMaxRows:6,tableMaxCols:5,maxChars:1800})).ndjson);
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Implementation_Plan.xlsx'));
const image=await w.render({sheetName:'Rencana',range:'A1:E15',scale:1});
await fs.writeFile(path.join(out,'preview.png'),new Uint8Array(await image.arrayBuffer()));
process.stdout.write('Implementation plan exported; all milestones are planned, not executed.\n');
