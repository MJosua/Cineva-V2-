import fs from 'node:fs/promises'; import path from 'node:path'; import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/notification_package_2026_10_19');
const checks=JSON.parse(await fs.readFile(path.join(out,'checks.json'),'utf8')),browser=JSON.parse(await fs.readFile(path.join(out,'e2e-results.json'),'utf8'));
if(checks.results.some(r=>r.exit||r.diagnostics.length)||browser.checks.length!==6||browser.checks.some(c=>c.status!=='passed'))throw new Error('Acceptance failed');
const w=Workbook.create(),s=w.worksheets.add('Notification upgrade');s.showGridLines=false;
s.getRange('A2').values=[['HOTS / Cineva: modular notification dan SSE']];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#61411F'};
const rows=[['Area','Hasil','Bukti / batas'],
 ['HOTS app-core','0.6.0','Frontend package kantor di-upgrade atas instruksi pengguna.'],
 ['Cineva app-core','0.6.0-cineva.1','Addon notifikasi sama; exact-origin HTTP fix disertakan.'],
 ['Notification kit','0.1.0-cineva.1','Backend paket lokal Cineva; backend kantor tetap.'],
 ['API reusable','Inbox client dan named SSE subscription','HTTP, route, decoder dan policy disuplai host.'],
 ['Transport','Antrean backpressure dan scoped hub','False write menunggu drain; tidak mengirim frame dua kali.'],
 ['Cineva consumer','NotificationBell, SSE hook dan manager','API/UI lama dipertahankan melalui adapter.'],
 ['Kontrak backend / legacy',checks.results.find(r=>r.name==='backend-and-legacy').passed,'backend-tests.txt; dependency controller di-stub.'],
 ['Kontrak frontend Cineva',checks.results.find(r=>r.name==='cineva').passed,'cineva-client-tests.txt; HTTP/event fixture.'],
 ['Kontrak frontend kantor',checks.results.find(r=>r.name==='kantor').passed,'kantor-client-tests.txt; source paket aktual.'],
 ['E2E browser',browser.checks.length,'e2e-results.json; actual HTTP/SSE dan bell, repository dummy.'],
 ['Strict API diagnostic',checks.results.reduce((n,r)=>n+r.diagnostics.length,0),'Nol pada API baru di kedua lokasi.'],
 ['Build Cineva','Lulus','Full-app TypeScript baseline lama: 101 diagnostic.'],
 ['Regresi existing','17 paket + 9 domain lulus','Tanpa database atau data workbook asli.'],
 ['Batas source','Di bawah 1.000 baris','checks.json; source terpisah per tanggung jawab.'],
 ['DB / auth produksi','Belum dimigrasi','Tidak ada SQL, akses database atau deployment.'],
 ['Durable delivery / multi-worker','Masih perlu adapter','Accepted SSE bukan bukti diterima browser.'],
];
const last=4+rows.length;s.getRange(`A5:C${last}`).values=rows;s.getRange(`A5:C${last}`).format.font={name:'Arial',size:11};s.getRange(`A5:C${last}`).format.rowHeight=33;s.getRange(`A5:C${last}`).format.verticalAlignment='center';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};s.getRange('A5:C5').format.horizontalAlignment='center';
for(const[col,width]of [['A',31],['B',58],['C',88]])s.getRange(`${col}2:${col}${last}`).format.columnWidth=width;
s.getRange('B12:B16').setNumberFormat('0');w.recalculate();
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:600})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'HOTS_Cineva_Notification_Upgrade.xlsx'));
const preview=await w.render({sheetName:s.name,range:`A1:C${last}`,scale:1});await fs.writeFile(path.join(out,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
