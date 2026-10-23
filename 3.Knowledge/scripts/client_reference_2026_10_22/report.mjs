import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root = 'D:/Project/Cineva-V2-';
const out = `${root}/outputs/client_reference_2026_10_22`;
const base = '1.Frontend/HOTS/src/features/';
const rows = [
 ['1','AI carousel dari link, teks, ide','Belum ditemukan','Assistant hanya parser draft job dummy.','Perlu ingestion, generator, review dan render slide.',base+'cineva-shared/assistant.ts'],
 ['1','Jumlah slide, rasio 4:5 / 9:16, bahasa','Belum ditemukan','Belum ditemukan pipeline carousel.','Perlu model slide dan ekspor gambar.',base+'creator-space/CreatorViews.tsx'],
 ['2,7','Galeri template desain dan filter','Belum ditemukan','Form/page/document engine bukan galeri desain carousel.','Perlu katalog template dan renderer konten sosial.','3.Knowledge/packages/REGISTRY.md'],
 ['3,6','Kalender konten','Sebagian - dummy','Kalender bulanan job dan daftar job harian.','Belum board posting mingguan dengan status per platform.',base+'cineva-shared/CalendarView.tsx'],
 ['4','Hasil visual feed/carousel sosial','Belum terbukti','Screenshot memperlihatkan hasil di aplikasi sosial.','Butuh output render nyata dan verifikasi publikasi.','Referensi client gambar 4'],
 ['5','Koneksi banyak akun/platform sosial','Belum ditemukan','Snapshot identitas akun dan platform deliverable tersedia.','Belum koneksi OAuth atau token akun untuk publikasi.',base+'cineva-campaigns/model.ts'],
 ['5','Posting sekarang dan jadwal otomatis','Belum ditemukan','recordPosting menyimpan URL/tanggal setelah QC.','Perlu adapter provider, queue, retry dan status tiap tujuan.',base+'cineva-campaigns/execution.ts'],
 ['5','Feed/story, caption, hashtag, audio TikTok','Belum ditemukan','Belum ditemukan publish adapter untuk opsi ini.','Perlu validasi capability provider per format.','2.Backend/Integrated-API/routers; service'],
 ['8','Brand kit logo, handle, watermark, penutup','Belum ditemukan','Theme vendor Cineva tersedia untuk aplikasi.','Theme aplikasi belum brand kit yang dirender pada slide.',base+'cineva-shared/CinevaVendorTheme.tsx'],
 ['9','Views, interaksi, engagement','Sebagian - dummy','Snapshot manual dan rumus ER per deliverable.','Belum sinkron metrik otomatis lintas akun/platform.',base+'cineva-campaigns/finance.ts'],
 ['9,10','Grafik periode, top content, ranking template','Belum ditemukan','Insight assignment tersedia sebagai snapshot.','Perlu agregasi periode, attribution dan dashboard. ',base+'cineva-campaigns/FinancePanel.tsx'],
 ['10','AI insight waktu posting/template terbaik','Belum ditemukan','Assistant dummy tidak menganalisis performa sosial.','Perlu dataset metrik dan analisis dengan bukti.',base+'creator-space/CreatorViews.tsx'],
 ['1,8','Paket dan kuota generasi','Sebagian - simulasi','Starter/Pro membatasi job aktif di frontend.','Belum kuota AI, billing atau entitlement server.',base+'creator-space/CreatorViews.tsx'],
 ['3,5','Draft, revisi, persetujuan QC, catatan post','Sebagian - dummy','Ada versi draft, review dan guard QC sebelum URL post.','Dapat menjadi fondasi workflow content studio.',base+'cineva-campaigns/execution.ts'],
];
await fs.mkdir(out,{recursive:true});
const wb=Workbook.create(), s=wb.worksheets.add('Matriks');
s.showGridLines=false;
s.getRange('A2').values=[['Cineva vs referensi client — 22 Oktober 2026']];
s.getRange('A3').values=[['Audit source lokal. Belum setara end-to-end dengan referensi.']];
s.getRange('A4').values=[['Sebagian berarti fondasi frontend dummy, bukan integrasi sosial live.']];
s.getRange('A6:F6').values=[['Gambar','Kapabilitas','Status Cineva','Bukti saat ini','Gap / tindak lanjut','Sumber workspace / referensi']];
s.getRange(`A7:F${6+rows.length}`).values=rows;
s.getRange('A2:F20').format.font={name:'Arial',size:11};
s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#654431'};
s.getRange('A6:F6').format={fill:'#654431',font:{bold:true,color:'#FFFFFF'},rowHeight:30};
s.getRange('A7:F20').format.wrapText=true;
s.getRange('A7:F20').format.rowHeight=82;
for(const [c,w] of [['A',9],['B',34],['C',26],['D',49],['E',53],['F',62]])s.getRange(`${c}:${c}`).format.columnWidth=w;
s.freezePanes.freezeRows(6);
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:'Matriks!A6:C20',include:'values',tableMaxRows:15,maxChars:2500})).ndjson);
await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/Cineva_Client_Reference_Audit.xlsx`);
const preview=await wb.render({sheetName:'Matriks',range:'A6:E10',scale:1,format:'png'});
await fs.writeFile(`${out}/preview.png`,new Uint8Array(await preview.arrayBuffer()));
await fs.writeFile(`${out}/matrix.json`,JSON.stringify(rows,null,2));
