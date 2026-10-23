import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/generic_packages_2026_10_19');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const sdk=await read('3.Knowledge/reports/generic_packages_2026_10_19/package-checks.json');
const quality=await read('3.Knowledge/reports/dual_product_2026_10_18/checks.json');
const browser=[];
for(const [label,p]of [['HQ / Creator','dual_product_2026_10_18'],['Workflow / booking','cineva_maturity_2026_10_18'],['HTML offline','client_demo_2026_10_18']]){
 const result=await read(`3.Knowledge/reports/${p}/e2e-results.json`);
 if(result.checks.some(c=>c.status!=='passed'))throw new Error(`Failed browser acceptance: ${label}`);
 browser.push([label,result.checks.length,`reports/${p}/e2e-results.json`]);
}
if(sdk.tests!==44||sdk.testExit||sdk.diagnostics.length||quality.lintErrors||quality.newDiagnostics.length)throw new Error('Acceptance failed');
const w=Workbook.create(),s=w.worksheets.add('Package adoption');s.showGridLines=false;
s.getRange('A2').values=[['Cineva: reusable domain dan scheduling']];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#61411F'};
const rows=[['Area','Hasil','Batas / bukti'],
 ['Versi','0.1.0-cineva.1','Dua paket baru lokal; HOTS Kantor tetap read-only.'],
 ['Domain kit','Relasi, atribut, rules, command','Offline dokumen menggunakan adapter Cineva.'],
 ['Scheduling kit','Kapasitas, hold, blackout, buffer','Job Cineva menggunakan adapter crew/gear kapasitas satu.'],
 ['Reuse lintas domain','Meeting, hotel, library, warehouse','Fixture sintetis; tanpa ketergantungan vendor.'],
 ['Engine tambahan','AI gateway, event/outbox, manifest, projection','Kontrak teruji; server/provider nyata belum diintegrasikan.'],
 ['Tes kontrak dan integrasi',sdk.tests,'package-checks.json dan contracts-results.txt'],
 ...browser.map(([label,count,evidence])=>[label,count,evidence]),
 ['Strict TypeScript paket',sdk.diagnostics.length,'ES2020; nol diagnostic pada dua paket.'],
 ['Diagnostic fitur Cineva',quality.newDiagnostics.length,'checks.json; full-app baseline: '+quality.totalDiagnostics],
 ['Lint error fitur',quality.lintErrors,'dual_product_2026_10_18/lint-results.txt'],
 ['Source paket terbesar',sdk.counts[0].lines,'Batas 1.000 baris; commands.ts.'],
 ['Build produksi','Lulus','npm.cmd run build:frontend; bundler warnings existing.'],
 ['Persistensi server','Ditunda','Tidak ada migrasi atau akses database.'],
 ['Booking konkuren','Belum dibuktikan','Snapshot policy; server wajib lock/recheck/transaction/rollback.'],
 ['Demo client','HTML dan ZIP dibangun ulang','JSON seed tetap; semua tes memakai data dummy.'],
];
const last=4+rows.length;s.getRange(`A5:C${last}`).values=rows;
s.getRange(`A5:C${last}`).format.font={name:'Arial',size:11};s.getRange(`A5:C${last}`).format.rowHeight=34;
s.getRange(`A5:C${last}`).format.verticalAlignment='center';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};
s.getRange('A5:C5').format.horizontalAlignment='center';
for(const[col,width]of [['A',29],['B',58],['C',100]])s.getRange(`${col}2:${col}${last}`).format.columnWidth=width;
s.getRange(`B11:B18`).setNumberFormat('0');
w.recalculate();
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:600})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Reusable_Packages_Report.xlsx'));
const preview=await w.render({sheetName:s.name,range:`A1:C${last}`,scale:1});await fs.writeFile(path.join(out,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
