import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const integration=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'integration.json'),'utf8'));
const gaps=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'gaps.json'),'utf8'));
const types=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'typecheck.json'),'utf8'));
const contracts=await fs.readFile(path.join(import.meta.dirname,'contracts-results.txt'),'utf8');
const build=await fs.readFile(path.join(import.meta.dirname,'build-results.txt'),'utf8');
if(!contracts.includes('pass 15')||!build.includes('built in')||integration.referenceChanged.length||integration.backendChanges.length||types.editedErrors.length)throw new Error('Validation prerequisites incomplete');
const overview=[
 ['Date','2026-10-14 Asia/Jakarta'],['Scope','Cineva only. HOTS Kantor is read-only reference'],
 ['Local package snapshots',integration.catalog.length],['Consumed frontend/tooling packages',integration.consumed.length],['UI compatibility entries',integration.uiForwarders],
 ['Reference snapshot files verified unchanged',integration.referenceSnapshotFiles],['Backend source changes',integration.backendChanges.length],
 ['Clean frontend workspace install','Passed; npm ci from 1.Frontend'],['Production build','Passed; root build:frontend command'],
 ['Contract tests','15 passed; schema/API/identity/query/error/origin contracts'],['New adapter lint','Passed; shared rules scoped to new modules'],
 ['New adapter type diagnostics',types.editedErrors.length],['Whole app type diagnostics (open)',types.totalErrors],
 ['Browser fixture','Mock only: builder edit/add/reload, type restrictions, scoped save, failure restore, Escape cancel, search/exact filter/export'],
 ['Cross-page filtered export','11 data rows verified from browser-generated XLSX'],['Legacy-area migration candidates',integration.fileGaps.length],
 ['Cineva gap groups',gaps.cineva.length],['HOTS reference note groups',gaps.reference.length],
 ['Runtime boundary','No real login/backend/DB/upload/SSE/provider/deployment acceptance'],
 ['Architecture','Generic implementation in local packages; thin import/contract/domain adapters in HOTS host'],
 ['Forks','ui-kit/table-engine 0.2.0-cineva.1; additive exports, Escape fix and optional hideSearch'],
 ['Re-index','npm.cmd run knowledge:index'],['Find source','npm.cmd run knowledge:search -- EditableCell'],
];
const catalog=integration.catalog.map(p=>[p.name,p.upstream,p.localVersion,p.path,p.name==='@hots/transaction-kit'?'Catalog only; prerequisites pending':integration.consumed.includes(p.name)?(p.name==='@hots/eslint-config'?'Scoped tooling':p.name==='@hots/service-form-runtime'?'Preview normalization':'Consumed via host/adapters'):'Available; not consumed']);
const fileRows=integration.fileGaps.map(f=>[f.path,f.flags.join('; '),'Static migration candidate; verify domain contract before replacing']);
const workbook=Workbook.create();
const definitions=[
 ['Ringkasan',['Item','Hasil'],overview,[44,112]],
 ['Paket',['Package','Upstream','Cineva','Lokasi lokal','Adoption'],catalog,[33,15,23,77,45]],
 ['Gap Cineva',['ID','Area','Status','Bukti lokasi','Alasan / boundary','Next step','Priority'],gaps.cineva,[9,36,33,80,95,100,11]],
 ['Catatan HOTS',['ID','Temuan','Status','Bukti referensi','Penyebab / gap','Saran untuk owner HOTS','Priority'],gaps.reference,[9,48,52,94,110,100,11]],
 ['File belum shared',['Path Cineva','Static flags','Interpretation'],fileRows,[110,65,78]],
];
for(const[name,headers,rows,widths]of definitions){
 const s=workbook.worksheets.add(name);s.showGridLines=false;const end=rows.length+3,last=String.fromCharCode(64+headers.length);
 s.getRange('A1').values=[[`Cineva reusable packages | ${name} | 14 Oct 2026`]];s.getRange('A1').format.font={name:'Arial',size:14,bold:true,color:'#153451'};
 s.getRange(`A3:${last}3`).values=[headers];s.getRange(`A4:${last}${end}`).values=rows;
 const used=s.getRange(`A3:${last}${end}`);used.format.font={name:'Arial',size:11};used.format.wrapText=true;used.format.verticalAlignment='top';
 const header=s.getRange(`A3:${last}3`);header.format.fill='#153451';header.format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};header.format.horizontalAlignment='center';header.format.verticalAlignment='center';header.format.rowHeight=28;
 for(let c=0;c<widths.length;c++)s.getRange(`${String.fromCharCode(65+c)}3:${String.fromCharCode(65+c)}${end}`).format.columnWidth=widths[c];
 for(let i=0;i<rows.length;i++){const r=s.getRange(`A${i+4}:${last}${i+4}`);r.format.rowHeight=name.startsWith('Gap')||name==='Catatan HOTS'?72:name==='Paket'?42:name==='File belum shared'?44:37;if(i%2===1)r.format.fill='#F0F5FA';}
 s.freezePanes.freezeRows(3);
}
workbook.recalculate();
const out=path.join(root,'3.Knowledge/reports/package_upgrade_2026_10_14');await fs.mkdir(out,{recursive:true});
await(await SpreadsheetFile.exportXlsx(workbook)).save(path.join(out,'Cineva_Reusable_Packages.xlsx'));
for(const[name]of definitions){const range=name==='Ringkasan'?'A3:B10':name==='Paket'?'A3:E8':name==='File belum shared'?'A3:C8':'A3:F7';const blob=await workbook.render({sheetName:name,range,scale:1});await fs.writeFile(path.join(out,`preview_${name.replaceAll(' ','_')}.png`),new Uint8Array(await blob.arrayBuffer()));}
await fs.writeFile(path.join(import.meta.dirname,'validation.json'),JSON.stringify({cleanInstall:'Passed',build:'Passed',contracts:15,lint:'New adapter scope passed',editedTypeErrors:types.editedErrors.length,wholeTypeDiagnostics:types.totalErrors,referenceUnchangedFiles:integration.referenceSnapshotFiles,backendSourceChanges:0,browser:'Mock fixture only',filteredExportRows:11,liveBackendAcceptance:'Not run'},null,2));
console.log(JSON.stringify({out,packages:catalog.length,uiForwarders:integration.uiForwarders,fileCandidates:fileRows.length,referenceUnchanged:integration.referenceSnapshotFiles}));
