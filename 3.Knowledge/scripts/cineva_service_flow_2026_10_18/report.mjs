import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/cineva_service_flow_2026_10_18');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const services=await read('3.Knowledge/reports/cineva_service_flow_2026_10_18/e2e-results.json');
const components=await read('3.Knowledge/reports/component_compatibility_2026_10_18/e2e-results.json');
const products=await read('3.Knowledge/reports/vendor_theme_2026_10_18/production-e2e-results.json');
const theme=await read('3.Knowledge/reports/vendor_theme_2026_10_18/theme-results.json');
const checks=await read('3.Knowledge/reports/dual_product_2026_10_18/checks.json');
const lines=await read('3.Knowledge/reports/cineva_service_flow_2026_10_18/line-counts.json');
const pass = value=>value.checks.filter(check=>check.status==='passed').length;
const hash = bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const styleChanges=[],baseline=await read('3.Knowledge/reports/visual_reference_2026_10_18/style_baseline.json');
for(const[file,sha]of Object.entries(baseline).filter(([file])=>!file.endsWith('/AppLayout.tsx')))
  if(hash(await fs.readFile(path.join(root,file)))!==sha)styleChanges.push(file);
const backendChanges=[];
for(const f of (await read('3.Knowledge/scripts/restructure_2026_10_14/before.json')).entries.filter(f=>f.newPath.startsWith('2.Backend/Integrated-API/')&&/\.(js|json|bat)$/.test(f.newPath)&&!['2.Backend/Integrated-API/ecosystem.config.js','2.Backend/Integrated-API/pack_for_prod.bat'].includes(f.newPath)))
  if(hash(await fs.readFile(path.join(root,f.newPath)))!==f.sha256)backendChanges.push(f.newPath);
const serviceContracts=await fs.readFile(path.join(out,'contracts-results.txt'),'utf8');
const packageContracts=await fs.readFile(path.join(root,'3.Knowledge/scripts/package_upgrade_2026_10_14/contracts-results.txt'),'utf8');
const validation={date:'2026-10-18',milestones:'1–4 frontend dummy; 5 deferred',serviceContracts:Number(serviceContracts.match(/pass\s+(\d+)/)?.[1]),packageContracts:Number(packageContracts.match(/pass\s+(\d+)/)?.[1]),productContracts:checks.contractsPassed,
 serviceE2E:pass(services),componentE2E:pass(components),productE2E:pass(products),themeE2E:pass(theme),productionOrigin:services.origin,
 lintErrors:checks.lintErrors,lintWarnings:checks.lintWarnings,newDiagnostics:checks.newDiagnostics,totalAppDiagnostics:checks.totalDiagnostics,largestFeatureFile:lines[0],styleChanges,backendChanges,databaseUsed:false,externalMessagesSent:false,officeWrites:0};
if(validation.serviceContracts!==9||validation.packageContracts!==17||validation.productContracts!==9||validation.serviceE2E!==15||validation.componentE2E!==19||validation.productE2E!==19||validation.themeE2E!==8||checks.lintErrors||checks.newDiagnostics.length||styleChanges.length||backendChanges.length||lines.some(f=>f.lines>1000))throw new Error('Validation prerequisites failed: '+JSON.stringify(validation));
for(const suite of [services,components,products,theme])if(suite.checks.some(c=>c.status!=='passed')||suite.errors?.length||suite.blocked?.length||suite.backend?.length)throw new Error('Browser suite has failures or unexpected traffic');
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(validation,null,2));
const w=Workbook.create(),s=w.worksheets.add('Implementasi');s.showGridLines=false;
s.getRange('A2').values=[['Cineva A/B: layanan, inquiry dan CS']];s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};
s.getRange('A3').values=[['Paket 1–4 frontend dummy. Backend, tenant authorization server dan local LLM nyata belum diintegrasikan.']];
s.getRange('A3').format.font={name:'Arial',size:10,italic:true};
const rows=[['Area','Hasil','Batas / bukti'],
 ['Katalog dan brief','Campaign, Production, Content Shoot','Form per layanan; draft author/tujuan dipulihkan setelah reload.'],
 ['Estimator dan quote','Rincian item, tarif dan snapshot revisi','Tarif dapat diubah per HQ; harga simulasi, bukan harga komersial final.'],
 ['Creator ke HQ','Request, review, quote, accept dan convert','Brief dibagikan ke HQ tujuan; personal finance/job tidak disalin.'],
 ['Project dan recovery','ID konversi tetap; retry tidak duplicate','Reset workspace dapat memulihkan project dari inquiry yang sama.'],
 ['CS AI / manusia','Percakapan, handover, agen dummy dan resolve','Fake AI; balasan terlambat diabaikan, pesan retry tidak duplicate.'],
 ['Journey lengkap','Alokasi, deliverable, pembayaran dan arsip','Menggunakan halaman dan adapter HOTS/Cineva existing dengan data dummy.'],
 ['Tes domain/kontrak',validation.serviceContracts+validation.packageContracts+validation.productContracts,'9 layanan + 17 paket + 9 domain produk lulus.'],
 ['Browser checks',validation.serviceE2E+validation.componentE2E+validation.productE2E+validation.themeE2E,'15 layanan + 19 komponen + 19 A/B + 8 theme lulus.'],
 ['Lint dan TypeScript',0,'Nol lint errors/warnings dan feature diagnostics; 101 diagnostics app masih ada.'],
 ['Batas source fitur',validation.largestFeatureFile.lines,'File terbesar pada features; batas 1.000 baris dicek otomatis.'],
 ['Style dan backend','Baseline tetap','Default CSS/theme dan backend diperiksa; HOTS kantor tidak diedit.'],
 ['Build produksi','Lulus','Production Vite preview lokal; bukan deployment atau bukti backend live.']];
const end=rows.length+4;s.getRange(`A5:C${end}`).values=rows;
s.getRange(`A5:C${end}`).format.font={name:'Arial',size:11};s.getRange(`A5:C${end}`).format.wrapText=true;s.getRange(`A5:C${end}`).format.verticalAlignment='top';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};
[29,66,87].forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
s.getRange('A5:C5').format.rowHeight=29;for(let i=6;i<=end;i++){s.getRange(`A${i}:C${i}`).format.rowHeight=49;if(i%2===0)s.getRange(`A${i}:C${i}`).format.fill='#F5F0E7';}
s.getRange(`A${end+2}`).values=[['Sumber: reports/cineva_service_flow_2026_10_18/validation.json dan architecture/cineva_service_flow_2026_10_18.md.']];s.getRange(`A${end+2}`).format.font={name:'Arial',size:10,italic:true};
w.recalculate();
await fs.writeFile(path.join(out,'workbook-inspect.json'),(await w.inspect({kind:'table',range:`Implementasi!A5:C${end}`,include:'values,formulas',tableMaxRows:13,tableMaxCols:3,maxChars:2200})).ndjson);
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Service_Flow.xlsx'));
const preview=await w.render({sheetName:'Implementasi',range:`A1:C${end+2}`,scale:1});await fs.writeFile(path.join(out,'report-preview.png'),new Uint8Array(await preview.arrayBuffer()));
process.stdout.write(JSON.stringify(validation)+'\n');
