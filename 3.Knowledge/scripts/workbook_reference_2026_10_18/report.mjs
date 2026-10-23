import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/workbook_reference_2026_10_18');
const books=JSON.parse(await fs.readFile(path.join(out,'structure_profile.json'),'utf8'));
for(const book of books)if(crypto.createHash('sha256').update(await fs.readFile(path.join(root,'4. Refrence',book.file))).digest('hex')!==book.sha256)throw new Error('Source workbook changed');
const w=Workbook.create(),m=w.worksheets.add('Mapping'),q=w.worksheets.add('Kualitas');
const style=(sheet,range,header,widths,height)=>{
 sheet.showGridLines=false;sheet.getRange(range).format.font={name:'Arial',size:11};sheet.getRange(range).format.wrapText=true;sheet.getRange(range).format.verticalAlignment='top';sheet.getRange(range).format.rowHeight=height;
 sheet.getRange(header).format.fill='#483326';sheet.getRange(header).format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};sheet.getRange(header).format.rowHeight=28;
 widths.forEach((width,i)=>sheet.getRange(`${String.fromCharCode(65+i)}4:${String.fromCharCode(65+i)}40`).format.columnWidth=width);
};
for(const[s,title]of [[m,'Cineva: mapping workbook operasional'],[q,'Cineva: kualitas dan batas interpretasi']]){s.getRange('A2').values=[[title]];s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#61411F'};s.getRange('A3').values=[['Analisis read-only. Data asli tidak dimasukkan ke preview, test dummy atau database.']];s.getRange('A3').format.font={name:'Arial',size:10,italic:true};}
m.getRange('A5:D5').values=[['Sumber','Sheet','Cohort utama','Baris talent']];
m.getRange('A6:D9').values=books.flatMap(book=>book.sheets.map(s=>[book.file,s.sheet,s.tables[0].heading_cell,s.tables[0].record_count]));
m.getRange('A10').values=[['Total baris assignment sumber']];m.getRange('D10').formulas=[['=SUM(D6:D9)']];
m.getRange('A11').values=[['71 baris bukan 71 orang unik. Tabel progress dan engagement tidak ditambahkan lagi ke jumlah roster.']];m.getRange('A11').format.font={name:'Arial',size:10,italic:true};
style(m,'A5:D10','A5:D5',[38,35,35,17],31);
const mapping=[['ID','Kebutuhan','Bukti dan dampak Cineva'],
 ['WB01','Brand dan campaign brief','Overview R5:S12: PIC, kategori, lokasi, objective, audience dan messaging. B hanya menerima brief assignment terkait.'],
 ['WB02','Katalog produk','SKU, varian, harga acuan dan product benefit; belum dimodelkan pada preview service flow.'],
 ['WB03','Milestone dan deadline','Listing, lolos, CO/pengiriman, drafting, posting/ACC, insight H+7 dan pembayaran; bukan satu tanggal shoot.'],
 ['WB04','Campaign/batch multi-talent','Roster menjadi participation/assignment; HQ mengelola campaign, B hanya melihat assignment miliknya.'],
 ['WB05','Profil dan akun sosial','Instagram/TikTok/Shopee terpisah; followers merupakan snapshot, bukan satu angka global.'],
 ['WB06','Biaya dan benefit','Pisahkan creator fee, biaya marketing, product benefit dan checkout. Quote client bukan otomatis creator revenue.'],
 ['WB07','Fulfillment produk','Product selection, pengiriman dan penanggung pembelian per assignment; tidak menyamakan status produk dengan payment.'],
 ['WB08','Deliverable dan output','Review, draft/drive, storyline dan post URL; owning/non-posting berbeda dari post di akun creator.'],
 ['WB09','QC dan performa','Quality review/revisi dan performa creator terpisah; header tidak memberi kontrak threshold penilaian.'],
 ['WB10','Payout per talent','Tanggal atau Diajukan tidak otomatis membuktikan penerimaan kas. Perlu status, paid_at, nominal dan evidence terpisah.'],
 ['WB11','Insight snapshot','LIKE+COMMENT+SHARE+SAVE+REPOST dibagi VIEWS ×100. Ini ER views, bukan followers.'],
 ['WB12','Referensi progress/rekapan','Label Sheet Data Progress/File Rekapan bukan bukti isi workbook eksternal telah dibaca.']];
m.getRange('A14:C26').values=mapping;style(m,'A14:C26','A14:C14',[38,35,75],58);
m.getRange('A28').values=[['Sumber: dua workbook di 4. Refrence; detail sheet/range di architecture/workbook_reference_2026_10_18.md dan structure_profile.json.']];m.getRange('A28').format.font={name:'Arial',size:10,italic:true};
const issues=[['Sumber / koordinat','Temuan','Perlakuan'],
 ['Simply 3 Q28 dan Q30:Q51','Heading 20 orang, 22 baris terisi','Review roster/quota. Jangan membuang baris atau menyimpulkan orang unik.'],
 ['Simply 2 Q29:AA35 dan Q37:AB43','Roster dan final progress masing-masing 5 baris','Rekonsiliasi assignment, jangan append menjadi 10 talent.'],
 ['Simply 3 S17 dan S24:T24','Periode overview berbeda dari milestone detail','Simpan raw text dan tandai konflik sebelum menjadi deadline.'],
 ['Simply 2 T25 dan S18','Satu tanggal Info Lolos mempunyai tahun berbeda','Review tanggal, tanpa koreksi otomatis sumber.'],
 ['IC100 T30:T54','FOLLOWERS berisi kategori teks pada 24 baris','Jangan ubah menjadi nol; perlu mapping kategori dan follower terpisah.'],
 ['Simply 2 Y38:Y43','LINK DRIVE ALL berisi DONE','Pisahkan completion state dari URL attachment.'],
 ['Simply 2 V31 dan V39','Bentuk link TikTok tidak valid','Tandai untuk koreksi eksplisit; link tidak dibuka saat audit.'],
 ['IC100 AB58:AB77 / AA58:AA77','20 cache formula error dengan denominator kosong/0','ER belum tersedia; tidak diimpor sebagai angka atau dipaksa nol.'],
 ['Simply 3 AB68','ER kosong di antara baris engagement','Review penyebab; tidak otomatis mengisi formula.'],
 ['Semua workbook','Kontak/nomor dapat berupa angka atau teks','Target string dan preserve raw; tidak mengarang nol awal/country code.'],
 ['Budget/benefit/SOW','Cash, marketing, harga SKU dan nilai benefit berbeda','Sumber tidak menetapkan margin/profit; jangan dijumlah sebagai satu revenue.']];
q.getRange('A5:C16').values=issues;style(q,'A5:C16','A5:C5',[46,67,79],57);
q.getRange('A18').values=[['Sumber: SIMPLY JUUN.xlsx (3 sheet) dan Assesment Vape IC 100.xlsx (1 sheet), koordinat tercantum pada setiap temuan.']];q.getRange('A18').format.font={name:'Arial',size:10,italic:true};
q.getRange('A20').values=[['Batas: cache dibaca tanpa recalculation Excel; tidak ada import, SQL, perubahan source atau E2E aplikasi baru pada tugas dokumentasi ini.']];q.getRange('A20').format.font={name:'Arial',size:10,italic:true};
w.recalculate();
await fs.writeFile(path.join(out,'workbook-inspect.json'),(await w.inspect({kind:'table',range:'Mapping!A5:D10',include:'values,formulas',tableMaxRows:6,tableMaxCols:4,maxChars:1800})).ndjson);
await fs.writeFile(path.join(out,'workbook-errors.json'),(await w.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?',options:{useRegex:true,maxResults:20},maxChars:500})).ndjson);
if(m.getRange('D10').values[0][0]!==71)throw new Error('Roster row reconciliation failed');
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Cineva_Workbook_Reference.xlsx'));
for(const[sheet,range]of [['Mapping','A1:D28'],['Kualitas','A1:C20']]){const preview=await w.render({sheetName:sheet,range,scale:1});await fs.writeFile(path.join(out,`preview_${sheet}.png`),new Uint8Array(await preview.arrayBuffer()));}
process.stdout.write('Reference mapping report exported. Sources unchanged, no application/data imports.\n');
