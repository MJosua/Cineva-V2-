import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root = path.resolve(import.meta.dirname, '../../..'), out = path.join(root, '3.Knowledge/reports/client_demo_2026_10_18');
const tests = JSON.parse(await fs.readFile(path.join(out, 'e2e-results.json'), 'utf8'));
const contractCount = Number((await fs.readFile(path.join(out, 'contracts-results.txt'), 'utf8')).match(/pass\s+(\d+)/)?.[1] || 0);
const checks = JSON.parse(await fs.readFile(path.join(root, '3.Knowledge/reports/dual_product_2026_10_18/checks.json'), 'utf8'));
if (contractCount !== 7 || tests.checks.length !== 10 || tests.checks.some(c => c.status !== 'passed') || checks.lintErrors || checks.newDiagnostics.length) throw new Error('Acceptance failed');
const w = Workbook.create(), s = w.worksheets.add('Client demo'); s.showGridLines = false;
s.getRange('A2').values = [['Cineva: paket demo client offline']];
s.getRange('A2').format.font = { name: 'Arial', size: 14, bold: true, color: '#61411F' };
s.getRange('A3').values = [['HTML mandiri + JSON editable; semua tes sintetis, tanpa database atau HOTS kantor.']];
s.getRange('A3').format.font = { name: 'Arial', size: 11, italic: true };
const rows = [['Area', 'Hasil', 'Batas dan bukti'],
 ['Output', 'HTML, JSON, README dan ZIP', 'HTML membawa JS/CSS/data inline; tidak bergantung server, CDN atau Excel bridge.'],
 ['Reuse', 'Form/UI/theme HOTS Cineva', 'Dokumen model, store, export dan panel modular; source code <1.000 baris.'],
 ['User/campaign', 'Profil, brief, deliverable, insight, ticket/assignment', 'EAV cstm_col/lbl_col/value dipertahankan; model dokumen bukan physical schema/DDL.'],
 ['Timeline', 'Milestone all-day dan editor visit simulasi', 'Konflik periode/tanggal payment dan posting ambigu tetap perlu review; tidak menebak jam visit.'],
 ['Finansial', 'Cash brief, benefit dan retail terpisah', 'Kas sumber belum terverifikasi tetap null; ledger simulasi tidak menulis sumber.'],
 ['Persist/export', 'localStorage dan HTML hasil edit portable', 'Context browser baru membuka HTML dengan data edit terbaru; blocked storage tetap dapat export sesi.'],
 ['Keamanan isi', 'Script-like JSON inert, import divalidasi', 'Tidak ada auth token atau koneksi eksternal otomatis; sumber pribadi hanya dalam output yang diizinkan.'],
 ['Kontrak', contractCount, 'Fixture sintetis: relasi dokumen, nominal, tanggal, ID, EAV dan source text.'],
 ['E2E', tests.checks.length, 'File URL tanpa server; edit/reload, kalender, payout, JSON, fresh export, mobile dan storage blocked.'],
 ['Kualitas', 'Lint dan feature TS bersih', 'Production build berhasil; full-app baseline diagnostics lama tetap dicatat.'],
 ];
s.getRange('A5:C15').values = rows; s.getRange('A5:C15').format.font = { name: 'Arial', size: 11 }; s.getRange('A5:C15').format.wrapText = true; s.getRange('A5:C15').format.rowHeight = 49; s.getRange('A5:C15').format.verticalAlignment = 'top';
s.getRange('A5:C5').format.fill = '#483326'; s.getRange('A5:C5').format.font = { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' }; s.getRange('A5:C5').format.rowHeight = 27;
for (const [col, width] of [['A', 23], ['B', 59], ['C', 86]]) s.getRange(`${col}2:${col}20`).format.columnWidth = width;
s.getRange('B13:B14').setNumberFormat('0');
s.getRange('A18').values = [['Bukti: contracts-results.txt, e2e-results.json; architecture/client_demo_melin_2026_10_18.md. Report tidak menyalin kontak/alamat/link pribadi.']]; s.getRange('A18').format.font = { name: 'Arial', size: 10, italic: true };
w.recalculate();
await fs.writeFile(path.join(out, 'workbook-errors.json'), (await w.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?', options: { useRegex: true, maxResults: 20 }, maxChars: 500 })).ndjson);
await (await SpreadsheetFile.exportXlsx(w)).save(path.join(out, 'Cineva_Client_Demo_Report.xlsx'));
const preview = await w.render({ sheetName: s.name, range: 'A1:C19', scale: 1 }); await fs.writeFile(path.join(out, 'report-preview.png'), new Uint8Array(await preview.arrayBuffer()));
