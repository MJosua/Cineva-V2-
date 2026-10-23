import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const reportDir = 'D:/Project/Cineva-V2-/3.Knowledge/reports/par_approval_pic_2026_10_22';
const outputDir = 'D:/Project/Cineva-V2-/outputs/par_approval_pic_2026_10_22';
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(reportDir, { recursive: true });
const sources = [
  'D:/Kantor/1.Frontend/overseas_module/par/src/views/ApprovalFlowSection.tsx',
  'D:/Kantor/1.Frontend/overseas_module/par/src/styles/approval-flow.css',
  'D:/Kantor/1.Frontend/overseas_module/par/src/views/ParListViews.tsx',
  'D:/Kantor/1.Frontend/overseas_module/par/src/types/par.ts',
  'D:/Kantor/1.Frontend/overseas_module/par/src/views/ParEmailStatus.tsx',
  'D:/Kantor/1.Frontend/overseas_module/par/src/styles/detail-feedback.css',
  'D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.js',
  'D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.parts/support/attach-par-business-columns.js',
  'D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.parts/support/resolve-latest-pic.js',
];
const hashes = await Promise.all(sources.map(async file => ({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex') })));
await fs.writeFile(`${reportDir}/evidence.json`, JSON.stringify({ observed_at: '2026-10-22', authorization: 'Kantor edit permission for this session, PAR changes only', files: hashes, verification: { new_isolated_tests: 9, existing_scope_tests: 16, typecheck: 'pass', build_modules: 1645, actual_hydration_read_only_db_rows: 5, production_deployment: false, authenticated_browser_workflow: false, db_writes: false } }, null, 2));

const wb = Workbook.create();
const sheet = wb.worksheets.add('PAR Upgrade');
sheet.getRange('A1').values = [['PAR — Approval, Latest PIC & Tanggal Paid']];
sheet.getRange('A2').values = [['22 Oktober 2026 | Implementasi lokal Kantor, izin khusus sesi ini']];
sheet.getRange('A4:D4').values = [['Perubahan / Pemeriksaan', 'Hasil', 'Bukti', 'Batas verifikasi']];
const rows = [
  ['Remark approve / reject', 'remark : pesan, di bawah nama dan tanggal; teks aman, multiline', 'ApprovalFlowSection.tsx + approval-flow.css; React SSR', 'Tidak mengubah penyimpanan remark existing'],
  ['Latest PIC — approval', 'Approver aktif selama approval pending', 'Resolver modular + query event existing', 'Executor tidak dihitung sebagai approver'],
  ['Latest PIC — pembayaran', 'Executor assignment aktif; fallback field konfigurasi workflow', 'Batch user lookup; latest work-data sebelum EAV', 'Tidak mengubah hak akses pembayaran'],
  ['Latest PIC — selesai', 'Paid / reject / cancel / closed / deleted: -', 'Tes lifecycle dan status terminal', 'Riwayat executor tetap tersimpan'],
  ['Paid List', 'Kolom Paid diganti Tanggal Paid = execution_date', 'React SSR: 10 kolom tetap, tanpa kolom tambahan', 'All PAR tetap kolom Paid/Unpaid'],
  ['Validasi lokal', '9 tes baru + 16 regresi scope lulus', 'node:test; frontend typecheck dan build 1.645 modules lulus', 'SSR bukan E2E browser terautentikasi'],
  ['Validasi SQL', 'Query hydration baru berhasil: 5 rows PAR nyata', 'MCP guarded read-only; query dari source', 'Tidak melakukan write, migration atau payment nyata'],
  ['Deployment', 'Belum deploy', 'Build evidence disimpan di knowledge Cineva', 'Belum reload PM2 / uji production browser'],
  ['Email Activity — desain', 'Header ikon, refresh, badge status, spacing HOTS', 'Typecheck/build lulus; Chromium 408/320 px tanpa overflow', 'Data sintetis; API dan pengiriman email tidak berubah'],
];
sheet.getRange(`A5:D${4 + rows.length}`).values = rows;
sheet.getRange('A1:D13').format.font = { name: 'Arial', size: 11 };
sheet.getRange('A1:D1').format = { fill: '#443323', font: { name: 'Arial', size: 16, bold: true, color: '#FFFFFF' }, rowHeight: 34 };
sheet.getRange('A2:D2').format = { font: { size: 10, color: '#666666' }, rowHeight: 25 };
sheet.getRange('A4:D4').format = { fill: '#9D743C', font: { bold: true, color: '#FFFFFF' }, rowHeight: 28 };
sheet.getRange('A5:D13').format.wrapText = true;
sheet.getRange('A5:D13').format.verticalAlignment = 'center';
sheet.getRange('A5:D13').format.rowHeight = 62;
for (let row = 5; row <= 13; row += 2) sheet.getRange(`A${row}:D${row}`).format.fill = '#F4EFE6';
sheet.getRange('A:A').format.columnWidth = 27;
sheet.getRange('B:B').format.columnWidth = 48;
sheet.getRange('C:C').format.columnWidth = 47;
sheet.getRange('D:D').format.columnWidth = 43;
sheet.freezePanes.freezeRows(4);
sheet.getRange('A15').values = [['Dokumentasi dan sumber']];
sheet.getRange('A15:D15').format.font = { bold: true, color: '#443323' };
sheet.getRange('A16:D16').values = [['Knowledge', '3.Knowledge/architecture/\npar_approval_pic_2026_10_22.md', 'Source hash', '3.Knowledge/reports/\npar_approval_pic_2026_10_22/\nevidence.json']];
sheet.getRange('A16:D16').format.wrapText = true;
sheet.getRange('A16:D16').format.rowHeight = 58;
wb.recalculate();
const check = await wb.inspect({ kind: 'table', range: 'PAR Upgrade!A4:D13', include: 'values', tableMaxRows: 10, tableMaxCols: 4 });
await fs.writeFile(`${reportDir}/workbook-inspect.ndjson`, check.ndjson);
const errors = await wb.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!', options: { useRegex: true, maxResults: 10 } });
await fs.writeFile(`${reportDir}/workbook-errors.ndjson`, errors.ndjson);
const preview = await wb.render({ sheetName: 'PAR Upgrade', range: 'A1:D16', scale: 1.5 });
await fs.writeFile(`${reportDir}/report-preview.png`, new Uint8Array(await preview.arrayBuffer()));
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${outputDir}/PAR_Approval_PIC_2026_10_22.xlsx`);
console.log(JSON.stringify({ report: `${outputDir}/PAR_Approval_PIC_2026_10_22.xlsx`, sources: hashes.length, errorScan: errors.ndjson }));
