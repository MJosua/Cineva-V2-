import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';
const root = path.resolve(import.meta.dirname, '../../..'), base = path.join(root, '3.Knowledge/reports/tenant_foundation_2026_10_21');
const out = path.join(base, 'outputs/tenant_foundation_2026_10_21');await fs.mkdir(out, {recursive: true});
const read = async name => JSON.parse(await fs.readFile(path.join(base, name), 'utf8'));
const checks = await read('checks.json'), browser = await read('browser.json'), types = await read('types.json'), release = await read('release.json'), connection = await read('connection-reference.json');
assert.equal(checks.failed, 0);assert.equal(checks.exit, 0);assert.equal(types.featureDiagnostics.length, 0);assert.equal(types.integrationDiagnostics.length, 0);assert.equal(browser.errors.length, 0);
assert.match(await fs.readFile(path.join(base, 'frontend-build.txt'), 'utf8'), /built in/);
const definitions = [
 ['Implementasi', ['Area', 'Hasil', 'Batas'], [
  ['Domain', 'Tenant program; company perusahaan', 'HOTS Normal/Overseas/Cineva; user multi-membership.'],
  ['Onboarding', 'Client pribadi langsung aktif', 'Company/campaign melalui undangan; tidak ada akun DB dibuat.'],
  ['Package', '3 package lokal 0.1.0-cineva.1', 'Contracts + client + server; bukan upstream release Kantor.'],
  ['Workspace', 'Pilih company, undangan, brand JSON', 'API BFF baru; legacy data/SSE hooks tidak dimuat pada route workspace.'],
  ['Backend', 'Context/permission/repository + SSO/session adapters', 'Default 503 sampai trusted runtime/persistence dikonfigurasi.'],
  ['Database', 'Read-only melalui MCP', 'Tidak repair, grant, registration, invitation atau migration nyata.'],
  ['Target', 'cineva.com', 'DNS/TLS, issuer/client registration, keys dan deployment belum diverifikasi.'],
 ], [27,74,92]],
 ['Validasi', ['Pemeriksaan', 'Hasil', 'Makna / batas'], [
  ['Package + HTTP lokal', checks.passed, 'Semua lulus; stub persistence dan IdP sintetis dengan signature test.'],
  ['Browser produksi sintetis', browser.checks.length, 'API interception; bukan live backend atau IdP.'],
  ['Feature TypeScript', types.featureDiagnostics.length, 'Diagnostic fitur/package baru.'],
  ['Integrasi route App', types.integrationDiagnostics.length, 'Diagnostic TypeScript pada App.tsx yang menghubungkan route baru.'],
  ['Full-app TypeScript', types.totalDiagnostics, 'Seluruh aplikasi belum bersih; bukan baseline sebelum perubahan.'],
  ['Frontend build', 'Lulus', 'Warning existing pada bundle/dependencies tetap tercatat.'],
  ['Scoped lint', 'Lulus', 'WorkspacePage tanpa error/warning.'],
  ['Portable bundle', release.exports.length, 'API export ter-load dengan Node builtins; bukan full API deploy.'],
  ['DB writes', checks.databaseWrites, 'HOTS tetap read-only.'],
 ], [35,25,116]],
 ['Acceptance', ['Skenario', 'Status', 'Bukti'], browser.checks.map(c => [c.name, c.status, 'browser.json; screenshot desktop/mobile']), [95,17,65]],
 ['Integrasi berikutnya', ['Area', 'Perlu disiapkan', 'Sumber / status'], [
  ['Identity dan SSO', 'Issuer/endpoint, registration client, trusted verifier/JWKS resolver', 'User menetapkan domain saja; belum live IdP acceptance.'],
  ['Session/context', 'Persistent store TTL, cleanup, distributed revoke, runtime wiring', 'Package/API ada; runtime belum dikonfigurasi.'],
  ['Registration/invitation', 'Canonical identity write + invitation lock/grant stores', 'Service transaction ada; schema/persistence belum diaktifkan.'],
  ['Program registry', 'Program ID dan permission-module mapping authoritative', 'MCP katalog system_name tidak menemukan target; jangan menebak ID.'],
  ['DB target', 'Konfigurasi Cineva untuk fase write yang terpisah', connection.cinevaLocalEnv],
  ['Legacy migration', 'Marketplace/ticket/report/file/SSE memakai scoped adapters', 'Package baru tidak otomatis melindungi consumer lama.'],
  ['Brand management', 'Persistence/editor/publish/history/rollback', 'JSON render/asset validation ada; editor belum dibuat.'],
  ['Operasional', 'MFA/recovery/global logout/backup/quota/billing', 'Tetap acceptance lanjutan, bukan klaim selesai.'],
 ], [30,90,105]],
];
const w = Workbook.create();
for (const [name, headers, rows, widths] of definitions) {
 const s = w.worksheets.add(name), end = rows.length + 5;s.showGridLines = false;
 s.getRange('A2').values = [['Fondasi SaaS Cineva dan SSO']];s.getRange('A2').format.font = {name: 'Arial', size: 14, bold: true, color: '#483326'};
 s.getRange('A3').values = [['21 Oktober 2026. Implementasi lokal; aktivasi produksi belum dilakukan.']];s.getRange('A3').format.font = {name: 'Arial', size: 10, italic: true};
 s.getRange('A5:C5').values = [headers];s.getRange(`A6:C${end}`).values = rows;
 s.getRange(`A5:C${end}`).format.font = {name: 'Arial', size: 10};s.getRange(`A5:C${end}`).format.wrapText = true;s.getRange(`A5:C${end}`).format.verticalAlignment = 'top';
 s.getRange('A5:C5').format.fill = '#483326';s.getRange('A5:C5').format.font = {name: 'Arial', size: 10, bold: true, color: '#FFFFFF'};s.getRange('A5:C5').format.horizontalAlignment = 'center';s.getRange('A5:C5').format.rowHeight = 26;
 widths.forEach((width, i) => s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth = width);
 for(let i=6;i<=end;i++){s.getRange(`A${i}:C${i}`).format.rowHeight = name === 'Acceptance' ? 32 : 40;if(i%2===0)s.getRange(`A${i}:C${i}`).format.fill = '#F5F0E7';}
 if(name !== 'Implementasi')s.freezePanes.freezeRows(5);
}
w.recalculate();await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out, 'Tenant_Foundation.xlsx'));
await fs.writeFile(path.join(base, 'workbook_inspection.ndjson'), (await w.inspect({kind: 'sheet', include: 'id,name', maxChars: 2000})).ndjson);
for(const[name,,rows]of definitions){const blob=await w.render({sheetName:name,range:`A2:C${rows.length+5}`,scale:1});await fs.writeFile(path.join(base,`preview_${name}.png`),new Uint8Array(await blob.arrayBuffer()));}
process.stdout.write('[TENANT-REPORT][INFO] : workbook exported and rendered\n');
