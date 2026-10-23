import fs from 'node:fs/promises';
import path from 'node:path';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'3.Knowledge/reports/video_requirements_2026_10_18');
const a=JSON.parse(await fs.readFile(path.join(out,'audio_assessment.json'),'utf8'));
const w=Workbook.create(),s=w.worksheets.add('Audio dan requirement');s.showGridLines=false;
s.getRange('A2').values=[['Cineva video: pemeriksaan audio dan requirement']];
s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};
const rows=[['Pemeriksaan','Hasil','Makna'],
 ['Durasi audio (detik)',a.duration_seconds,'Track AAC ada, tetapi efektif hening.'],
 ['Peak (dBFS)',a.peak_dbfs,'Amplitudo di bawah satu langkah PCM 16-bit.'],
 ['Peak PCM 16-bit',a.pcm16_peak,'Seluruh sampel hasil dekode bernilai nol.'],
 ['Segmen ucapan VAD',a.vad_speech_segments.length,'Tidak ada ucapan terdeteksi.'],
 ['Transkrip narasi','Tidak tersedia','Tidak ada requirement baru yang diklaim dari audio.']];
s.getRange('A4:C9').values=rows;s.getRange('B5').setNumberFormat('0.00');s.getRange('B6').setNumberFormat('0.00');
const mapping=[['Produk','Requirement existing','Sumber dan batas'],
 ['A: HQ','CRM dan tiga jenis project','Catatan Gemini; frontend dummy.'],
 ['A: HQ','Estimator dan alokasi crew/gear','Catatan Gemini; tarif dan integrasi operasional belum final.'],
 ['B: Creator','Dashboard, job cards, pencarian dan status','Screenshot/frame video; bukan transkrip audio.'],
 ['B: Creator','Fee, paid, unpaid dan barter','Referensi visual + Gemini; cash dan barter terpisah.'],
 ['B: Creator','Kalender, pengingat, pembayaran dan arsip','Referensi visual + Gemini; provider belum terhubung.'],
 ['B: Creator','Assistant natural language ke ticket','Visual + Gemini; parser dummy, belum local LLM.'],
 ['B: Creator','Subscription/paywall','Gemini; entitlement masih simulasi frontend.'],
 ['A dan B','HOTS modular, tenant dan vendor theme','Arahan pengguna; DB ditunda, HOTS kantor tidak diedit.']];
s.getRange('A12:C20').values=mapping;
for(const r of ['A4:C9','A12:C20']){s.getRange(r).format.font={name:'Arial',size:11};s.getRange(r).format.rowHeight=29;}
for(const r of ['A4:C4','A12:C12']){s.getRange(r).format.fill='#483326';s.getRange(r).format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};}
s.getRange('A4:A20').format.columnWidth=28;s.getRange('B4:B20').format.columnWidth=48;s.getRange('C4:C20').format.columnWidth=86;
s.getRange('A22').values=[['Sumber: audio_assessment.json dan architecture/video_audio_requirements_2026_10_18.md']];
s.getRange('A22').format.font={name:'Arial',size:10,italic:true};
w.recalculate();
await fs.writeFile(path.join(out,'workbook-inspect.json'),(await w.inspect({kind:'table',range:'Audio dan requirement!A4:C9',include:'values,formulas',tableMaxRows:6,tableMaxCols:3,maxChars:2000})).ndjson);
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Video_Audio_Requirements.xlsx'));
const preview=await w.render({sheetName:'Audio dan requirement',range:'A1:C22',scale:1});
await fs.writeFile(path.join(out,'preview.png'),new Uint8Array(await preview.arrayBuffer()));
process.stdout.write('Audio assessment report exported.\n');
