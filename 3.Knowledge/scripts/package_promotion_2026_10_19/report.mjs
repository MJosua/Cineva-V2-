import fs from 'node:fs/promises'; import path from 'node:path'; import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/package_promotion_2026_10_19');
const audit=JSON.parse(await fs.readFile(path.join(out,'checks.json'),'utf8'));if(audit.results.some(r=>r.exit||r.diagnostics.length||r.files.some(f=>!f.identical)))throw new Error('Package acceptance failed');
const w=Workbook.create(),s=w.worksheets.add('Package promotion');s.showGridLines=false;
s.getRange('A2').values=[['HOTS: domain dan scheduling package tersedia']];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#61411F'};
const rows=[['Area','Hasil','Bukti / batas'],
 ...audit.results.map(r=>[r.package,r.upstreamVersion,`Cineva ${r.cinevaVersion}; source/test identik, ${r.tests} tes lulus.`]),
 ['Lokasi HOTS','D:/Kantor/1.Frontend/packages','Dua direktori baru; aplikasi/backend kantor tidak diubah.'],
 ['Source parity','Identik','checks.json mencatat SHA256 setiap file source dan test.'],
 ['Strict TypeScript',0,'ES2020; nol diagnostic pada kedua paket kantor.'],
 ['Kontrak kantor',audit.results.reduce((n,r)=>n+r.tests,0),'16 domain + 16 scheduling; fixture sintetis.'],
 ['Kontrak dan integrasi Cineva',44,'generic_packages_2026_10_19/package-checks.json'],
 ['E2E offline',10,'client_demo_2026_10_18/e2e-results.json; dummy saja.'],
 ['E2E workflow / booking',9,'cineva_maturity_2026_10_18/e2e-results.json; dummy saja.'],
 ['Build Cineva','Lulus','Tidak melakukan build/deploy aplikasi HOTS kantor.'],
 ['Native test portability','Node 24+','Import .ts eksplisit; tanpa instalasi dependency tes tambahan.'],
 ['Kalender lengkap','Tahap terpisah','UI calendar, recurrence, reminder dan server booking belum dipaketkan lengkap.'],
 ['Database / deployment','Tidak dilakukan','Paket tersedia; adopsi aplikasi HOTS masih langkah berikutnya.'],
];
const last=rows.length+4;s.getRange(`A5:C${last}`).values=rows;s.getRange(`A5:C${last}`).format.font={name:'Arial',size:11};s.getRange(`A5:C${last}`).format.rowHeight=34;s.getRange(`A5:C${last}`).format.verticalAlignment='center';s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};s.getRange('A5:C5').format.horizontalAlignment='center';
for(const[col,width]of [['A',34],['B',51],['C',98]])s.getRange(`${col}2:${col}${last}`).format.columnWidth=width;
s.getRange('B10:B14').setNumberFormat('0');w.recalculate();
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'HOTS_Package_Promotion_Report.xlsx'));
const preview=await w.render({sheetName:s.name,range:`A1:C${last}`,scale:1});await fs.writeFile(path.join(out,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
