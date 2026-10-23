import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root = path.resolve(import.meta.dirname, '../../..');
const out = path.join(root, '3.Knowledge/reports/cineva_campaigns_2026_10_18');
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const e2e = await read('3.Knowledge/reports/cineva_campaigns_2026_10_18/e2e-results.json');
const counts = await read('3.Knowledge/reports/cineva_campaigns_2026_10_18/line-counts.json');
const quality = await read('3.Knowledge/reports/dual_product_2026_10_18/checks.json');
const contracts = Number((await fs.readFile(path.join(out, 'contracts-results.txt'), 'utf8')).match(/pass\s+(\d+)/)?.[1] || 0);
if (!contracts || e2e.checks.some(c => c.status !== 'passed') || e2e.errors.length || e2e.blocked.length || counts.some(c => c.lines > 1000) || quality.lintErrors || quality.newDiagnostics.length) throw new Error('Validation failed');
const validation = { contracts, browserChecks: e2e.checks.length, origin: e2e.origin, largestFeatureFile: counts[0], lintErrors: quality.lintErrors, lintWarnings: quality.lintWarnings, featureDiagnostics: quality.newDiagnostics.length, totalAppDiagnostics: quality.totalDiagnostics, databaseUsed: false, officeWrites: 0, realWorkbookRowsImported: 0 };
await fs.writeFile(path.join(out, 'validation.json'), JSON.stringify(validation, null, 2));
const w = Workbook.create(), s = w.worksheets.add('Campaign Operations');
s.showGridLines = false;
s.getRange('A2').values = [['Cineva: Campaign Operations A/B']];
s.getRange('A2').format.font = { name: 'Arial', size: 14, bold: true, color: '#61411F' };
s.getRange('A3').values = [['Frontend dummy · backend dan database ditunda · 18 Oktober 2026']];
s.getRange('A3').format.font = { name: 'Arial', size: 11, italic: true };
const rows = [
 ['Grup', 'Hasil', 'Batas dan bukti'],
 ['Fondasi', 'Campaign → batch → talent assignment; brief dan milestone', 'HQ milik sendiri; Creator hanya assignment sendiri. Snapshot akun sosial, persist/reload, kontrol actor dan versi.'],
 ['Eksekusi', 'Produk, fulfillment, draft, revisi, QC dan posting', 'Produk terpisah dari konten/payout. Brand delivery tanpa posting tetap dibedakan. URL dummy tanpa panggilan eksternal.'],
 ['Finance', 'Payout creator dan riwayat pembayaran', 'Diajukan bukan Paid. Nominal, tanggal dan bukti divalidasi; quote client, marketing dan benefit produk bukan satu revenue.'],
 ['Insight', 'Snapshot per deliverable dan pengingat H+7', 'ER berdasarkan views dalam poin persentase. Views kosong/0 belum tersedia. Tidak menetapkan kategori tanpa aturan bisnis.'],
 ['Kompatibilitas', 'Layout, form dan controls HOTS; aksen vendor Cineva', 'Halaman marketplace lama serta layanan Production/Content Shoot dipertahankan. Tidak mengubah HOTS Kantor.'],
 ['Integrasi berikutnya', 'Server tenant, ticket/assignment adapter dan storage nyata', 'Memerlukan schema fisik. Belum ada upload/payment/provider/reminder delivery nyata.'],
 ];
s.getRange('A5:C11').values = rows;
s.getRange('A5:C11').format.font = { name: 'Arial', size: 11 };
s.getRange('A5:C11').format.wrapText = true;
s.getRange('A5:C11').format.verticalAlignment = 'top';
s.getRange('A5:C11').format.rowHeight = 61;
s.getRange('A5:C5').format.fill = '#483326';
s.getRange('A5:C5').format.font = { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' };
s.getRange('A5:C5').format.rowHeight = 27;
for (const [col, width] of [['A', 22], ['B', 62], ['C', 83]]) s.getRange(`${col}2:${col}23`).format.columnWidth = width;
s.getRange('A14:C18').values = [
 ['Validasi saat ini', 'Jumlah', 'Lingkup'],
 ['Domain campaign', contracts, 'Kontrak foundation, eksekusi dan finance; data sintetis'],
 ['Browser campaign', e2e.checks.length, 'HQ/Creator, reload, role scope, desktop/mobile; backend/external diblokir'],
 ['Lint errors / feature TS', 0, 'Feature diagnostics 0; full app masih memiliki baseline diagnostics lama'],
 ['Batas file', counts[0].lines, `Terbesar: ${counts[0].file}; batas 1.000 baris`],
 ];
s.getRange('A14:C18').format.font = { name: 'Arial', size: 11 };
s.getRange('A14:C18').format.wrapText = true;
s.getRange('A14:C18').format.rowHeight = 34;
s.getRange('A14:C14').format.fill = '#483326';
s.getRange('A14:C14').format.font = { name: 'Arial', size: 11, bold: true, color: '#FFFFFF' };
s.getRange('B15:B18').setNumberFormat('0');
s.getRange('A21').values = [['Sumber: architecture/cineva_campaign_operations_2026_10_18.md; contracts-results.txt; e2e-results.json; checks.json.']];
s.getRange('A21').format.font = { name: 'Arial', size: 10, italic: true };
w.recalculate();
await fs.writeFile(path.join(out, 'workbook-inspect.json'), (await w.inspect({ kind: 'table', range: 'Campaign Operations!A14:C18', include: 'values', tableMaxRows: 5, tableMaxCols: 3, maxChars: 2000 })).ndjson);
await fs.writeFile(path.join(out, 'workbook-errors.json'), (await w.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?', options: { useRegex: true, maxResults: 20 }, maxChars: 500 })).ndjson);
await (await SpreadsheetFile.exportXlsx(w)).save(path.join(out, 'Cineva_Campaign_Operations.xlsx'));
const preview = await w.render({ sheetName: s.name, range: 'A1:C22', scale: 1 });
await fs.writeFile(path.join(out, 'report-preview.png'), new Uint8Array(await preview.arrayBuffer()));
process.stdout.write(JSON.stringify(validation) + '\n');
