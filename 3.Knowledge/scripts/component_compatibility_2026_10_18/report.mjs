import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/component_compatibility_2026_10_18');
const v=JSON.parse(await fs.readFile(path.join(out,'validation.json'),'utf8')),e=JSON.parse(await fs.readFile(path.join(out,'e2e-results.json'),'utf8'));
if(v.contractTests!==17||v.e2ePassed!==16||v.e2eFailed||v.lintErrors||v.changedTypeDiagnostics.length||v.backendChanges.length||v.externalRequests)throw new Error('Validation incomplete');
const components=[
 ['Trigger client','Selesai','0.2.0-cineva.1: canonical filter, deprecated alias, active boolean dan kategori bertipe.','17 contract tests + browser hook','1.Frontend/packages/engine-client/src/hots/trigger.ts'],
 ['Shared builder','Selesai','0.1.0-cineva.1: whitelist create/inspector konsisten; legacy metadata/type tetap utuh; empty whitelist aman.','Browser create/edit/section/round-trip','1.Frontend/dynamic-form/src/UnifiedFormStructureBuilder.tsx'],
 ['Host adapters','Selesai','Hook trigger tanpa double cast; registry filtering workaround dihapus. Public compatibility tetap.','Browser host builder dan trigger hook','1.Frontend/HOTS/src/hooks/useTriggerFunction.ts; components/forms/UnifiedFormStructureEditor.tsx'],
 ['Table + report','Regression lulus','Escape tanpa request, Enter save sekali, rejection restore, pencarian, exact filter dan ekspor seluruh matching rows.','Browser + isi XLSX 1 dan 11 baris','3.Knowledge/reports/component_compatibility_2026_10_18/e2e-results.json'],
 ['Build dan kualitas','Lulus terbatas','Build produksi lulus; 0 diagnostic pada file berubah; 101 diagnostic aplikasi tersisa; lint 0 error / 1 warning fungsi panjang.','Build + TypeScript API + shared lint rules','3.Knowledge/reports/component_compatibility_2026_10_18/validation.json'],
 ['Dokumentasi paket','Selesai','Versi, lock, README/CHANGELOG, registry dan compatibility disinkronkan.','Metadata lokal dan source imports','3.Knowledge/packages/REGISTRY.md; COMPATIBILITY.md'],
 ['Database/backend/auth','Ditunda pengguna','Tidak ada DB, SQL, server backend, auth migration atau deployment. Backend source sama dengan baseline.','Tidak diuji; di luar scope terbaru','3.Knowledge/architecture/component_compatibility_2026_10_18.md'],
 ['HQ + Creator Space','Arah produk dicatat','HOTS/CMS shared; tenant, finansial, subscription dan AI ticket belum diimplementasi. Perlu verified schema dan tenant/create contract.','Roadmap; bukan fitur tersedia','3.Knowledge/architecture/cineva_dual_product_direction_2026_10_18.md'],
 ['Runtime form/domain','Masih parsial','Primary runtime/rules/submit, advanced domain inspectors dan specialized screens perlu migrasi per surface.','Belum diuji backend nyata','3.Knowledge/architecture/reusable_packages_2026_10_14.md'],
].map(row=>row.map((value,index)=>index===4?value.replaceAll('; ',';\n').replaceAll('component_compatibility_2026_10_18/','component_compatibility_2026_10_18/\n'):value));
const w=Workbook.create();
const definitions=[['Komponen',['Area','Status','Hasil / batas','Validasi','Sumber'],components,[25,22,83,45,100]],['E2E Dummy',['No','Skenario','Hasil'],e.checks.map((c,i)=>[i+1,c.name,c.status]),[8,110,18]]];
for(const[name,headers,rows,widths]of definitions){
 const s=w.worksheets.add(name),last=String.fromCharCode(64+headers.length),end=rows.length+4;s.showGridLines=false;
 s.getRange('A1').values=[['Cineva kompatibilitas komponen — 18 Oktober 2026']];s.getRange('A1').format.font={name:'Arial',size:15,bold:true,color:'#153451'};
 s.getRange('A2').values=[['Scope: frontend; data dan API dummy; database tidak digunakan.']];
 s.getRange(`A4:${last}4`).values=[headers];s.getRange(`A5:${last}${end}`).values=rows;
 s.getRange(`A4:${last}${end}`).format.font={name:'Arial',size:11};s.getRange(`A4:${last}${end}`).format.wrapText=true;s.getRange(`A4:${last}${end}`).format.verticalAlignment='top';
 const header=s.getRange(`A4:${last}4`);header.format.fill='#153451';header.format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};header.format.rowHeight=28;
 widths.forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}4:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
 for(let i=5;i<=end;i++){s.getRange(`A${i}:${last}${i}`).format.rowHeight=name==='Komponen'?68:34;if(i%2===0)s.getRange(`A${i}:${last}${i}`).format.fill='#F0F5FA';}s.freezePanes.freezeRows(4);
}
w.recalculate();
const errors=await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},summary:'Final formula error scan'});
await fs.writeFile(path.join(out,'workbook-check.ndjson'),errors.ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Component_Compatibility.xlsx'));
for(const[name]of definitions){const preview=await w.render({sheetName:name,range:name==='Komponen'?'A4:E9':'A4:C20',scale:1});await fs.writeFile(path.join(out,`preview_${name}.png`),new Uint8Array(await preview.arrayBuffer()));}
process.stdout.write('[COMPATIBILITY-REPORT][INFO] : Excel exported; 9 component statuses and 16 browser checks.\n');
