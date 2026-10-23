import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/visual_reference_2026_10_18');
const manifest=JSON.parse(await fs.readFile(path.join(root,'4. Refrence/visual/creator_dashboard_2026_10_18/manifest.json'),'utf8'));
const baseline=JSON.parse(await fs.readFile(path.join(out,'style_baseline.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const[file,sha]of Object.entries(baseline))if(hash(await fs.readFile(path.join(root,file)))!==sha)throw new Error('Style changed: '+file);
for(const asset of manifest.assets)if(hash(await fs.readFile(path.join(root,asset.local)))!==asset.sha256)throw new Error('Asset copy differs');
const rows=[
 ['Screenshot','Dashboard desktop: sidebar, greeting, 4 KPI, search, tabs dan job cards.','Adaptasi hierarchy dan komposisi; gunakan shell serta shared primitives Cineva.','Jangan menyalin branding, foto, pink gradient, font dekoratif atau glass blur.','dashboard_reference.png'],
 ['Video mobile','81,2 detik; 528×928; 30 fps. Sembilan frame sampel ditinjau.','Acuan responsive navigation dan jalur dashboard/payments/assistant.','Sampling bukan bukti detail seluruh interaksi atau backend.','workflow_reference.mp4; frame 10–81 detik'],
 ['Ringkasan keuangan','Total fee, sudah cair, belum dibayar, nilai barter.','Summary Card memakai format currency dan warna semantic existing.','Cash/barter terpisah; schema dan rule finansial belum diimplementasi.','Screenshot; video sekitar 20 detik'],
 ['Kolaborasi','Brand, brief, platform, tanggal, fee/barter dan dropdown status.','Card/Badge/Input/Tabs shared; job tetap terhubung ticket engine existing.','Pisahkan workflow/payment status; Visit perlu definisi domain.','Screenshot; video sekitar 10, 71, 81 detik'],
 ['Assistant','Panel chat, input natural language, lalu tampak job tambahan.','Acuan Sheet/Dialog dan draft → validation → ticket engine.','Tidak membuktikan local LLM, tenant policy, confirmation atau DB write.','Video sekitar 30–71 detik'],
 ['CSS/style','Semantic tokens light/dark, existing layout dan ui-kit.','Pertahankan index.css, App.css, tailwind config, AppLayout dan shared preset.','Lima file baseline diperiksa SHA256; tidak ada runtime source diubah.','style_baseline.json'],
 ['Aset/provenance','PNG dan MP4 disalin byte-for-byte; path sumber serta hash dicatat.','Simpan di 4. Refrence/visual/creator_dashboard_2026_10_18.','Hanya referensi; tidak disertakan ke public/runtime bundle.','manifest.json'],
 ['Validasi','Hash aset/style sesuai, dokumentasi dan links diperiksa.','E2E dummy diperlukan ketika adaptasi UI diimplementasikan.','Tidak ada perubahan aplikasi atau DB; E2E tidak diulang untuk dokumentasi.','3.Knowledge/architecture/visual_reference_creator_space_2026_10_18.md'],
];
const w=Workbook.create(),s=w.worksheets.add('Referensi Visual');s.showGridLines=false;
s.getRange('A1').values=[['Cineva — referensi visual 18 Oktober 2026']];s.getRange('A1').format.font={name:'Arial',size:15,bold:true,color:'#153451'};
s.getRange('A2').values=[['Layout dan interaksi sebagai acuan; CSS/style HOTS Cineva dipertahankan.']];
s.getRange('A4:E4').values=[['Area','Observasi','Adaptasi','Batas / keputusan','Sumber']];s.getRange('A5:E12').values=rows;
s.getRange('A4:E12').format.font={name:'Arial',size:11};s.getRange('A4:E12').format.wrapText=true;s.getRange('A4:E12').format.verticalAlignment='top';
s.getRange('A4:E4').format.fill='#153451';s.getRange('A4:E4').format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};s.getRange('A4:E4').format.rowHeight=28;
for(const[c,width]of Object.entries({A:25,B:65,C:75,D:80,E:87}))s.getRange(`${c}4:${c}12`).format.columnWidth=width;
for(let i=5;i<=12;i++){s.getRange(`A${i}:E${i}`).format.rowHeight=60;if(i%2===0)s.getRange(`A${i}:E${i}`).format.fill='#F0F5FA';}s.freezePanes.freezeRows(4);
w.recalculate();await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Visual_Reference.xlsx'));
const blob=await w.render({sheetName:'Referensi Visual',range:'A4:E12',scale:1});await fs.writeFile(path.join(out,'preview.png'),new Uint8Array(await blob.arrayBuffer()));
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify({date:'2026-10-18',copiedAssets:manifest.assets.length,assetHashesMatch:true,styleBaselineFiles:Object.keys(baseline).length,styleUnchanged:true,applicationSourceChanges:0,databaseUsed:false,e2e:'Not repeated: asset/document-only change',videoSampleFrames:9},null,2));
process.stdout.write('[VISUAL-REFERENCE][INFO] : Assets and style hashes verified; Excel exported.\n');
