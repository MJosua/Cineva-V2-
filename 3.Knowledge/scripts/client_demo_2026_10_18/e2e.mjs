import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { buildDemo } from './build.mjs';
const root = path.resolve(import.meta.dirname, '../../..'), out = path.join(root, '3.Knowledge/reports/client_demo_2026_10_18');
const require = createRequire(path.join(root, '1.Frontend/HOTS/package.json'));
const esbuild = require('esbuild');
await esbuild.build({ entryPoints: [path.join(import.meta.dirname, 'fixture.ts')], outfile: path.join(import.meta.dirname, 'fixture.bundle.cjs'), bundle: true, platform: 'node', format: 'cjs', logLevel: 'warning' }); esbuild.stop();
const seed = require(path.join(import.meta.dirname, 'fixture.bundle.cjs')).syntheticData();
const fixture = await buildDemo(seed, out, 'synthetic-demo.html');
const bundleRequire = createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const browser = await bundleRequire('playwright').chromium.launch({ headless: true, executablePath: 'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe' });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), checks = [], errors = [], blocked = [];
page.setDefaultTimeout(12000); page.on('pageerror', error => errors.push(error.message));
await context.route('**/*', route => { const url = route.request().url(); if (!url.startsWith('file:') && !url.startsWith('blob:') && !url.startsWith('data:')) { blocked.push(url); return route.abort(); } return route.continue(); });
const check = async (name, fn) => { await fn(); checks.push({ name, status: 'passed' }); process.stdout.write(`[OFFLINE-E2E][PASS] : ${name}\n`); };
const nav = name => page.getByRole('navigation', { name: 'Menu demo' }).getByRole('button', { name, exact: true }).click();
const button = name => page.getByRole('button', { name, exact: true });
try {
 await page.goto(pathToFileURL(fixture.file).href);
 await check('Single HTML works from file URL without server, external assets or database', async () => {
  await page.getByRole('heading', { name: 'Halo, Kreator Simulasi', exact: true }).waitFor();
  assert.equal(await page.locator('html').getAttribute('data-hots-vendor'), 'cineva'); assert.deepEqual(blocked, []); await page.screenshot({path:path.join(out,'synthetic-dashboard.png'),fullPage:true});
 });
 await check('HOTS profile form edits persist through reload in isolated localStorage', async () => {
  await nav('Profil Creator'); await page.getByLabel(/^Nama Creator/).fill('Creator Edited'); await page.getByLabel(/^Jumlah followers/).fill('2500'); await page.getByLabel(/^Niche /).fill('Lifestyle, Fashion');
  await button('Simpan profil').click(); await page.getByRole('status').getByText('Perubahan tersimpan di browser ini.', { exact: true }).waitFor(); await page.reload();
  await page.getByRole('heading', { name: 'Halo, Creator Edited', exact: true }).waitFor(); await nav('Profil Creator'); assert.equal(await page.getByLabel(/^Nama Creator/).inputValue(), 'Creator Edited');
 });
 await check('Timeline keeps ambiguous dates separate; review and new visit are editable', async () => {
  await nav('Kalender & visit'); assert.equal(await page.getByLabel('Bulan kalender demo', { exact: true }).inputValue(), '2026-10');
  await button('Review jadwal Deadline perlu review').click(); await page.getByLabel('Tanggal mulai', { exact: true }).fill('2026-10-28'); await page.getByLabel('Tanggal selesai', { exact: true }).fill('2026-10-28'); await button('Simpan jadwal').click();
  await button('Tambah jadwal').click(); await button('Review jadwal Visit baru (simulasi)').click(); await page.getByLabel('Judul jadwal', { exact: true }).fill('Visit client dummy'); await page.getByLabel('Tanggal mulai', { exact: true }).fill('2026-10-29'); await page.getByLabel('Tanggal selesai', { exact: true }).fill('2026-10-29'); await button('Simpan jadwal').click();
  await page.getByRole('button', { name: 'Tanggal 2026-10-29, 1 jadwal', exact: true }).waitFor();
 });
 await check('Payout simulation stays separate from unknown source cash and prevents overpayment', async () => {
  await nav('Pembayaran'); await page.getByText('Belum tercatat', { exact: true }).waitFor();
  await page.getByLabel(/^Nominal pembayaran/).fill('100000'); await page.getByLabel(/^Tanggal pembayaran/).fill('2026-10-29'); await page.getByLabel(/^Referensi bukti pembayaran/).fill('DUMMY-RECEIPT'); await button('Catat pembayaran simulasi').click();
  await page.getByText(/DUMMY-RECEIPT/).waitFor(); await button('Pembayaran baru').click(); await page.getByLabel(/^Nominal pembayaran/).fill('300000'); await page.getByLabel(/^Referensi bukti pembayaran/).fill('DUMMY-OVERPAY'); await button('Catat pembayaran simulasi').click(); await page.getByRole('alert').getByText('Nominal melebihi sisa fee cash.', { exact: true }).waitFor();
 });
 await check('Insight uses ER views and unavailable denominator, without guessing source categories', async () => {
  await nav('Insight'); await page.getByText('ER berdasarkan views: 6.00%', { exact: true }).waitFor(); await page.getByLabel(/^Views/).fill('0'); await button('Simpan insight').click(); await page.getByText('ER berdasarkan views: Belum tersedia', { exact: true }).waitFor();
 });
 await check('JSON import validates before mutation and preserves last valid document', async () => {
  await nav('Data JSON'); await page.getByLabel('Editor JSON dokumen', { exact: true }).fill('{"version":99}'); await button('Terapkan JSON').click(); await page.getByRole('alert').waitFor();
  await button('Ambil data terbaru ke editor').click(); const data = JSON.parse(await page.getByLabel('Editor JSON dokumen', { exact: true }).inputValue()); assert.equal(data.user.name, 'Creator Edited'); assert.equal(data.payments.length, 1); assert.equal(data.campaign.paidAmount, null);
 });
 await check('Exported HTML carries edited data in a fresh browser with no original localStorage', async () => {
  const wait = page.waitForEvent('download'); await button('Export HTML terbaru').click(); const download = await wait; const target = path.join(out, 'synthetic-edited.html'); await download.saveAs(target);
  const html = await fs.readFile(target, 'utf8'); assert.ok(html.includes('Creator Edited')); assert.ok(!html.includes('<script src='));
  const fresh = await browser.newContext(); const next = await fresh.newPage(); await fresh.route('**/*', route => route.request().url().startsWith('file:') ? route.continue() : route.abort());
  await next.goto(pathToFileURL(target).href); await next.getByRole('heading', { name: 'Halo, Creator Edited', exact: true }).waitFor(); await fresh.close();
 });
 await check('JSON export and mobile calendar remain usable offline', async () => {
  const wait = page.waitForEvent('download'); await button('Export JSON').click(); const download = await wait; const target = path.join(out, 'synthetic-export.json'); await download.saveAs(target); assert.equal(JSON.parse(await fs.readFile(target, 'utf8')).user.name, 'Creator Edited');
  await page.setViewportSize({ width: 390, height: 844 }); await nav('Kalender & visit'); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await page.screenshot({ path: path.join(out, 'synthetic-mobile.png'), fullPage: true });
 });
 await check('Script-like raw JSON text remains inert after exporting and reopening HTML', async () => {
  await nav('Data JSON'); await button('Ambil data terbaru ke editor').click();
  const data = JSON.parse(await page.getByLabel('Editor JSON dokumen', { exact: true }).inputValue());
  data.notes.push('</script><script>window.__offlineInjected=true</script>');
  await page.getByLabel('Editor JSON dokumen', { exact: true }).fill(JSON.stringify(data)); await button('Terapkan JSON').click();
  const wait = page.waitForEvent('download'); await button('Export HTML terbaru').click(); const download = await wait; const target = path.join(out, 'synthetic-inert.html'); await download.saveAs(target);
  const fresh = await browser.newContext(); const next = await fresh.newPage(); await next.goto(pathToFileURL(target).href); await next.getByRole('heading', { name: 'Halo, Creator Edited', exact: true }).waitFor();
  assert.equal(await next.evaluate(() => typeof window.__offlineInjected), 'undefined'); await fresh.close();
 });
 await check('Blocked localStorage preserves session edits and explicitly offers portable export', async () => {
  const fresh = await browser.newContext(); await fresh.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Synthetic blocked storage'); }; });
  const next = await fresh.newPage(); await next.goto(pathToFileURL(fixture.file).href);
  await next.getByRole('navigation', { name: 'Menu demo' }).getByRole('button', { name: 'Profil Creator', exact: true }).click();
  await next.getByLabel(/^Nama Creator/).fill('Memory Only Creator'); await next.getByRole('button', { name: 'Simpan profil', exact: true }).click();
  await next.getByRole('status').getByText(/Browser tidak menyimpan localStorage/).waitFor();
  const wait = next.waitForEvent('download'); await next.getByRole('button', { name: 'Export HTML terbaru', exact: true }).click(); const download = await wait; const target = path.join(out, 'synthetic-memory.html'); await download.saveAs(target);
  assert.ok((await fs.readFile(target, 'utf8')).includes('Memory Only Creator')); await fresh.close();
 });
 assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
} catch (error) { checks.push({ name: 'Failure', status: 'failed', error: error.stack }); await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }); await fs.writeFile(path.join(out, 'failure.html'), await page.content()); process.stderr.write(error.stack + '\n'); process.exitCode = 1; }
finally { await browser.close(); await fs.writeFile(path.join(out, 'e2e-results.json'), JSON.stringify({ checks, errors, blocked, fixtures: 'synthetic only', databaseUsed: false, mode: 'file URL without server' }, null, 2)); }
