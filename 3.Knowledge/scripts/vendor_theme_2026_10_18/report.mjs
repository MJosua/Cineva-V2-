import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/vendor_theme_2026_10_18');
const read=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const theme=await read('3.Knowledge/reports/vendor_theme_2026_10_18/theme-results.json'),functional=await read('3.Knowledge/reports/vendor_theme_2026_10_18/production-e2e-results.json'),checks=await read('3.Knowledge/reports/dual_product_2026_10_18/checks.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=await read('3.Knowledge/reports/visual_reference_2026_10_18/style_baseline.json'),baseChanges=[];
for(const[file,sha]of Object.entries(baseline).filter(([file])=>!file.endsWith('/AppLayout.tsx')))if(hash(await fs.readFile(path.join(root,file)))!==sha)baseChanges.push(file);
const fingerprints=(await read('3.Knowledge/reports/component_compatibility_2026_10_18/validation.json')).sourceHashes,coreChanges=[];
for(const[file,sha]of Object.entries(fingerprints).filter(([file])=>file.includes('/packages/')||file.includes('/dynamic-form/')))if(hash(await fs.readFile(path.join(root,file)))!==sha)coreChanges.push(file);
const backendChanges=[],backend=(await read('3.Knowledge/scripts/restructure_2026_10_14/before.json')).entries;
for(const f of backend.filter(f=>f.newPath.startsWith('2.Backend/Integrated-API/')&&/\.(js|json|bat)$/.test(f.newPath)&&!['2.Backend/Integrated-API/ecosystem.config.js','2.Backend/Integrated-API/pack_for_prod.bat'].includes(f.newPath)))if(hash(await fs.readFile(path.join(root,f.newPath)))!==f.sha256)backendChanges.push(f.newPath);
if(theme.checks.length!==8||functional.checks.length!==19||[...theme.checks,...functional.checks].some(c=>c.status!=='passed')||theme.contrast.length!==26||theme.contrast.some(c=>c.ratio<4.5)||theme.errors.length||theme.blocked.length||functional.backend.length||functional.blocked.length||baseChanges.length||coreChanges.length||backendChanges.length||checks.lintErrors||checks.newDiagnostics.length)throw new Error('Theme acceptance failed');
const validation={date:'2026-10-18',build:'Production build passed',functionalBrowserChecks:19,themeChecks:8,contrastPairs:26,minimumTextPairContrast:Math.min(...theme.contrast.map(c=>c.ratio)),baseChanges,coreChanges,backendChanges,lintErrors:checks.lintErrors,newTypeDiagnostics:checks.newDiagnostics,totalTypeDiagnostics:checks.totalDiagnostics,databaseUsed:false,officeWrites:0,scope:'Additive Cineva vendor presentation; no shared engine change'};
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(validation,null,2));
const w=Workbook.create(),definitions=[['Vendor Theme',['Area','Hasil','Batas / validasi'],[
 ['Brand','Coklat hangat, antique gold, putih/ivory; exact gold #cd9a36.','Adaptasi vendor yang diminta pengguna; bukan salinan SQL yang belum dibaca.'],
 ['Scope','CinevaVendorTheme + vendor CSS pada App dan standalone preview.','Root attribute mencakup body portals; pelepasan scope memulihkan HOTS defaults.'],
 ['Sidebar','Sidebar brown, gold active state, labels terang.','Menggunakan SidebarMenuButton.isActive existing; package sidebar tidak diubah.'],
 ['Primitives','Card/dialog/button/input/tabs memakai semantic vendor tokens.','Font, spacing, radius dan engine behavior dipertahankan.'],
 ['E2E','19 alur A/B + 8 pemeriksaan theme lulus pada build produksi.','Data dummy; tidak ada request backend/external.'],
 ['Kontras','26 pasangan light/dark; minimum rasio 5,30.','Target 4,5 untuk pasangan terpilih; bukan sertifikasi seluruh app.'],
 ['Kode','Build lulus; lint 0 errors; 0 diagnostic feature baru.','101 diagnostic aplikasi lama masih ada.'],
 ['HOTS original','Tidak diedit; perubahan vendor hanya di Cineva.','Core fingerprints, 4 default CSS/theme files dan backend baseline stabil.'],
 ['Prinsip upstream','Fitur baru harus additive/backward-compatible.','Pertahankan fitur/default lama; project pemilik Kantor yang mengimplementasikan usulan.'],
 ],[28,98,104]],['Kontras',['Mode','Foreground','Background','Rasio','Target'],theme.contrast.map(c=>[c.mode,c.foreground,c.background,c.ratio,4.5]),[16,38,38,15,15]]];
for(const[name,headers,rows,widths]of definitions){const s=w.worksheets.add(name),last=String.fromCharCode(64+headers.length),end=rows.length+4;s.showGridLines=false;s.getRange('A1').values=[['Cineva vendor theme — 18 Oktober 2026']];s.getRange('A1').format.font={name:'Arial',size:15,bold:true,color:'#61411F'};s.getRange('A2').values=[['Sumber: reports/vendor_theme_2026_10_18/theme-results.json dan validation.json']];s.getRange(`A4:${last}4`).values=[headers];s.getRange(`A5:${last}${end}`).values=rows;s.getRange(`A4:${last}${end}`).format.font={name:'Arial',size:11};s.getRange(`A4:${last}${end}`).format.wrapText=true;s.getRange(`A4:${last}${end}`).format.verticalAlignment='top';s.getRange(`A4:${last}4`).format.fill='#483326';s.getRange(`A4:${last}4`).format.font={name:'Arial',size:11,bold:true,color:'#FFF9EF'};s.getRange(`A4:${last}4`).format.rowHeight=28;widths.forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}4:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);for(let i=5;i<=end;i++){s.getRange(`A${i}:${last}${i}`).format.rowHeight=name==='Kontras'?28:58;if(i%2===0)s.getRange(`A${i}:${last}${i}`).format.fill='#F5F0E7';}if(name==='Kontras')s.getRange(`D5:E${end}`).numberFormat='0.00';s.freezePanes.freezeRows(4);}
w.recalculate();await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Vendor_Theme.xlsx'));
for(const[name]of definitions){const blob=await w.render({sheetName:name,range:name==='Kontras'?'A4:E17':'A4:C13',scale:1});await fs.writeFile(path.join(out,`preview_${name}.png`),new Uint8Array(await blob.arrayBuffer()));}
process.stdout.write('[CINEVA-VENDOR][INFO] : '+JSON.stringify(validation)+'\n');
