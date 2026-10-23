import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/cineva_maturity_2026_10_18');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const reports='3.Knowledge/reports/';
const suites={maturity:await read(reports+'cineva_maturity_2026_10_18/e2e-results.json'),services:await read(reports+'cineva_service_flow_2026_10_18/e2e-results.json'),components:await read(reports+'component_compatibility_2026_10_18/e2e-results.json'),products:await read(reports+'vendor_theme_2026_10_18/production-e2e-results.json'),theme:await read(reports+'vendor_theme_2026_10_18/theme-results.json')};
const expected={maturity:9,services:15,components:19,products:19,theme:8},counts={};
for(const[name,suite]of Object.entries(suites)){
 counts[name]=suite.checks.filter(c=>c.status==='passed').length;
 if(counts[name]!==expected[name]||suite.checks.some(c=>c.status!=='passed')||suite.errors?.length||suite.blocked?.length||suite.backend?.length)throw new Error('Browser suite failed: '+name);
}
const contractFiles={maturity:'3.Knowledge/reports/cineva_maturity_2026_10_18/contracts-results.txt',services:'3.Knowledge/reports/cineva_service_flow_2026_10_18/contracts-results.txt',packages:'3.Knowledge/scripts/package_upgrade_2026_10_14/contracts-results.txt'};
const contracts={};for(const[name,file]of Object.entries(contractFiles))contracts[name]=Number((await fs.readFile(path.join(root,file),'utf8')).match(/pass\s+(\d+)/)?.[1]||0);
const checks=await read(reports+'dual_product_2026_10_18/checks.json'),lines=await read(reports+'cineva_maturity_2026_10_18/line-counts.json');
const types=await read('3.Knowledge/scripts/package_upgrade_2026_10_14/typecheck.json');
const featureDiagnostics=types.diagnostics.filter(d=>d.path.includes('/features/'));
if(contracts.maturity!==16||contracts.services!==9||contracts.packages!==17||checks.contractsPassed!==9||checks.lintErrors||checks.lintWarnings||featureDiagnostics.length||lines.some(f=>f.lines>1000))throw new Error('Contract/lint/size acceptance failed');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const styleChanges=[],backendChanges=[];
for(const[file,sha]of Object.entries(await read(reports+'visual_reference_2026_10_18/style_baseline.json')).filter(([file])=>!file.endsWith('/AppLayout.tsx')))
 if(hash(await fs.readFile(path.join(root,file)))!==sha)styleChanges.push(file);
for(const f of (await read('3.Knowledge/scripts/restructure_2026_10_14/before.json')).entries.filter(f=>f.newPath.startsWith('2.Backend/Integrated-API/')&&/\.(js|json|bat)$/.test(f.newPath)&&!['2.Backend/Integrated-API/ecosystem.config.js','2.Backend/Integrated-API/pack_for_prod.bat'].includes(f.newPath)))
 if(hash(await fs.readFile(path.join(root,f.newPath)))!==f.sha256)backendChanges.push(f.newPath);
if(styleChanges.length||backendChanges.length)throw new Error('Style/backend baseline changed');
const validation={date:'2026-10-18',scope:'Three parallel groups, integrated frontend dummy only',contracts:{...contracts,products:checks.contractsPassed},contractTotal:Object.values(contracts).reduce((a,b)=>a+b,0)+checks.contractsPassed,browserChecks:counts,browserTotal:Object.values(counts).reduce((a,b)=>a+b,0),productionOrigin:suites.maturity.origin,lintErrors:checks.lintErrors,lintWarnings:checks.lintWarnings,featureDiagnostics,totalAppDiagnostics:types.totalErrors,largestFeatureFile:lines[0],styleChanges,backendChanges,databaseUsed:false,officeWrites:0,externalMessagesSent:false};
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(validation,null,2));
const w=Workbook.create(),s=w.worksheets.add('Pemantapan');s.showGridLines=false;
s.getRange('A2').values=[['Cineva: workflow, penawaran, CS dan booking']];s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};
s.getRange('A3').values=[['Tiga grup paralel diintegrasikan; frontend/data dummy. Backend dan database tetap ditunda.']];s.getRange('A3').format.font={name:'Arial',size:10,italic:true};
const rows=[['Area','Hasil','Batas / bukti'],
 ['Workflow layanan','SOW campaign, tahap production dan rincian sesi','Konfigurasi vendor; tahap berurutan, independen dari pembayaran. Sesi belum membuat multi-booking otomatis.'],
 ['Penawaran','Request perubahan, revisi quantity dan persetujuan versi','Snapshot terpisah dari brief awal; tab lama ditolak, project memakai versi accepted.'],
 ['Review lock quote','Mutasi in-place tidak melewati guard','Baseline dan working copy dipisah; regression direproduksi gagal lalu diperbaiki.'],
 ['Antrean CS','Search, filter, counter menunggu, assignment dan audit','Dua agen dummy; handover/manusia/AI tersimpan. Bukan inbox atau role server nyata.'],
 ['Booking','Ketersediaan, spesialis dan konfirmasi eksplisit','Overlap/stale confirmation ditolak; perubahan alokasi memerlukan konfirmasi ulang.'],
 ['Tes domain/kontrak',validation.contractTotal,'16 pemantapan + 9 layanan + 9 domain produk + 17 paket lulus.'],
 ['Browser checks',validation.browserTotal,'9 pemantapan + 15 layanan + 19 komponen + 19 A/B + 8 theme lulus.'],
 ['Lint dan TypeScript',0,'Nol lint error/warning dan feature diagnostic; 101 diagnostic app lama masih ada.'],
 ['File source fitur terbesar',lines[0].lines,'Batas 1.000 baris diperiksa; ukuran ini tidak mencakup semua legacy app.'],
 ['Build produksi','Lulus','Preview lokal Vite; bukan deploy atau bukti tenant authorization backend.'],
 ['HOTS / style / backend','Tidak diubah','Global style dan backend baseline sama; HOTS Kantor read-only.']];
const end=rows.length+4;s.getRange(`A5:C${end}`).values=rows;
s.getRange(`A5:C${end}`).format.font={name:'Arial',size:11};s.getRange(`A5:C${end}`).format.wrapText=true;s.getRange(`A5:C${end}`).format.verticalAlignment='top';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};
[30,65,88].forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
s.getRange('A5:C5').format.rowHeight=28;for(let i=6;i<=end;i++){s.getRange(`A${i}:C${i}`).format.rowHeight=54;if(i%2===0)s.getRange(`A${i}:C${i}`).format.fill='#F5F0E7';}
s.getRange(`A${end+2}`).values=[['Sumber: reports/cineva_maturity_2026_10_18/validation.json dan architecture/cineva_maturity_2026_10_18.md.']];s.getRange(`A${end+2}`).format.font={name:'Arial',size:10,italic:true};
w.recalculate();
await fs.writeFile(path.join(out,'workbook-inspect.json'),(await w.inspect({kind:'table',range:`Pemantapan!A5:C${end}`,include:'values,formulas',tableMaxRows:12,tableMaxCols:3,maxChars:2200})).ndjson);
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Maturity.xlsx'));
const preview=await w.render({sheetName:'Pemantapan',range:`A1:C${end+2}`,scale:1});await fs.writeFile(path.join(out,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
process.stdout.write(JSON.stringify(validation)+'\n');
