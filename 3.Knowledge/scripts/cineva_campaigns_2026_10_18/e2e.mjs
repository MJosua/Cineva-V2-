import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '../../..'), out = path.join(root, '3.Knowledge/reports/cineva_campaigns_2026_10_18');
await fs.mkdir(out, { recursive: true });
const require = createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const { chromium } = require('playwright'), origin = process.env.CINEVA_PRODUCTS_ORIGIN || 'http://127.0.0.1:48174';
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage(), checks = [], errors = [], blocked = [];
await page.clock.setFixedTime(new Date('2026-10-18T03:00:00Z'));
page.setDefaultTimeout(12000);
page.on('pageerror', e => errors.push(e.message));
await context.route('**/*', route => {
 const url = new URL(route.request().url());
 if (url.origin !== origin || /^\/(auth|api|hotsdashboard|hotsprefs|hots_settings)(\/|$)/.test(url.pathname.replace(/^\/hots/, ''))) { blocked.push(url.href); return route.abort(); }
 return route.continue();
});
const check = async (name, fn) => { await fn(); checks.push({ name, status: 'passed' }); process.stdout.write(`[CAMPAIGN-E2E][PASS] : ${name}\n`); };
const go = async product => { await page.goto(`${origin}/hots/cineva-preview.html#/${product}/campaigns`); await page.getByRole('region', { name: 'Campaign operations', exact: true }).waitFor(); };
const assignment = () => page.getByRole('region', { name: 'Assignment Kreator Dummy 1', exact: true });
const button = (scope, name) => scope.getByRole('button', { name, exact: true });
const pickSeed = async () => button(page, 'Campaign Studio Dummy 1').click();
try {
 await go('hq');
 await check('HQ campaign preserves brief, milestones, two assignments and internal identity scope', async () => {
  await page.getByRole('heading', { name: 'Talent assignments (2)', exact: true }).waitFor();
  assert.equal(await button(page, 'Campaign Studio Dummy 2').count(), 0);
  await page.getByLabel('Workspace dummy', { exact: true }).selectOption('hq-2');
  await button(page, 'Campaign Studio Dummy 2').waitFor(); assert.equal(await button(page, 'Campaign Studio Dummy 1').count(), 0);
  await page.getByLabel('Workspace dummy', { exact: true }).selectOption('hq-1');
 });
 await check('HQ configures creator cash separately from marketing and product benefits', async () => {
  const own = assignment(); await own.getByLabel('feeAmount', { exact: true }).fill('300000');
  await own.getByLabel('marketingAmount', { exact: true }).fill('900000'); await own.getByLabel('productBenefitAmount', { exact: true }).fill('125000');
  await button(own, 'Simpan nominal talent').click(); await page.waitForFunction(() => document.querySelector('[data-testid=campaign-finance]')?.textContent.includes('300.000')); await page.reload();
  await assignment().getByTestId('campaign-payout-status').getByText('Belum diajukan', { exact: true }).waitFor();
 });
 await check('Creator sees own assignment only, selects product and submits draft', async () => {
  await go('creator'); await pickSeed(); await page.getByRole('heading', { name: 'Talent assignments (1)', exact: true }).waitFor();
  assert.equal(await page.getByRole('region', { name: 'Assignment Kreator Dummy 2', exact: true }).count(), 0);
  await assignment().getByLabel('Pilihan produk Kreator Dummy 1', { exact: true }).selectOption('sku-demo');
  await assignment().getByLabel('URL draft Video ulasan dummy', { exact: true }).fill('https://example.test/draft-v1');
  await button(assignment(), 'Kirim draft Video ulasan dummy').click(); await assignment().getByText('Menunggu QC · Draft versi 1', { exact: true }).waitFor();
  await button(assignment(), 'Ajukan payout').click(); await assignment().getByTestId('campaign-payout-status').getByText('Diajukan — belum dibayar', { exact: true }).waitFor();
 });
 await check('HQ processes product and requests content revision without paying cash', async () => {
  await go('hq'); await pickSeed(); await button(assignment(), 'Proses produk').click();
  await assignment().getByLabel('Catatan QC Video ulasan dummy', { exact: true }).fill('Perjelas produk dummy');
  await button(assignment(), 'Minta revisi Video ulasan dummy').click();
  await assignment().getByText('Perlu revisi · Draft versi 1', { exact: true }).waitFor();
  await button(assignment(), 'Tandai payout diproses').click(); await assignment().getByTestId('campaign-payout-status').getByText('Diproses — belum dibayar', { exact: true }).waitFor();
 });
 await check('Creator resubmits and confirms product while posting remains blocked until QC', async () => {
  await go('creator'); await pickSeed(); await button(assignment(), 'Tandai produk diterima').click();
  assert.equal(await assignment().getByLabel('URL posting Video ulasan dummy', { exact: true }).count(), 0);
  await assignment().getByLabel('URL draft Video ulasan dummy', { exact: true }).fill('https://example.test/draft-v2');
  await button(assignment(), 'Kirim draft Video ulasan dummy').click(); await assignment().getByText('Menunggu QC · Draft versi 2', { exact: true }).waitFor();
 });
 await check('HQ approves latest revision, records evidenced partial payout and prevents overpay', async () => {
  await go('hq'); await pickSeed(); await button(assignment(), 'Setujui QC Video ulasan dummy').click();
  await assignment().getByLabel('Nominal payout', { exact: true }).fill('100000'); await assignment().getByLabel('Tanggal payout', { exact: true }).fill('2026-10-18');
  await assignment().getByLabel('Bukti payout', { exact: true }).fill('DUMMY-RECEIPT-1'); await button(assignment(), 'Catat payout').click();
  await assignment().getByTestId('campaign-payout-status').getByText('Dibayar sebagian', { exact: true }).waitFor();
  await button(assignment(), 'Pembayaran baru').click(); await assignment().getByLabel('Nominal payout', { exact: true }).fill('300000');
  await assignment().getByLabel('Bukti payout', { exact: true }).fill('DUMMY-OVERPAY'); await button(assignment(), 'Catat payout').click();
  await page.getByRole('alert').getByText('Payout melebihi sisa fee Creator.', { exact: true }).waitFor();
 });
 await check('Creator records approved post and immutable ER-by-views insight snapshots', async () => {
  await go('creator'); await pickSeed(); await assignment().getByLabel('URL posting Video ulasan dummy', { exact: true }).fill('https://example.test/post-v2');
  await assignment().getByLabel('Tanggal posting Video ulasan dummy', { exact: true }).fill('2026-10-18'); await button(assignment(), 'Simpan posting Video ulasan dummy').click();
  await assignment().getByLabel('Tanggal insight Video ulasan dummy', { exact: true }).fill('2026-10-25');
  for (const [metric, value] of Object.entries({ Likes: '40', Comments: '5', Shares: '5', Saves: '5', Reposts: '5', Views: '1000' })) await assignment().getByLabel(`${metric} Video ulasan dummy`, { exact: true }).fill(value);
  await assignment().getByText('ER berdasarkan views: 6.00%', { exact: true }).waitFor(); await button(assignment(), 'Simpan snapshot insight').click();
  await assignment().getByText('2026-10-25 · ER views: 6.00%', { exact: true }).waitFor();
  await assignment().getByLabel('Views Video ulasan dummy', { exact: true }).fill('0'); await button(assignment(), 'Simpan snapshot insight').click();
  await page.getByRole('alert').getByText('Snapshot insight tidak dapat diubah. Buat snapshot baru.', { exact: true }).waitFor();
  await button(assignment(), 'Snapshot baru').click(); await assignment().getByLabel('Tanggal insight Video ulasan dummy', { exact: true }).fill('2026-10-25'); await button(assignment(), 'Simpan snapshot insight').click();
  await assignment().getByText('2026-10-25 · ER views: Belum tersedia', { exact: true }).waitFor(); await page.reload();
  await assignment().getByText('2026-10-25 · ER views: 6.00%', { exact: true }).waitFor();
 });
 await check('Second Creator cannot see first Creator execution or payout history', async () => {
  await page.getByLabel('Workspace dummy', { exact: true }).selectOption('creator-2'); await pickSeed();
  assert.equal(await page.getByRole('region', { name: 'Assignment Kreator Dummy 1', exact: true }).count(), 0);
  assert.equal(await page.getByText('DUMMY-RECEIPT-1', { exact: false }).count(), 0);
  await page.getByLabel('Workspace dummy', { exact: true }).selectOption('creator-1'); await pickSeed();
 });
 await check('Campaign creation and roster assignment persist with brand-only deliverable', async () => {
  await go('hq'); await button(page, 'Buat campaign').click();
  for (const [label, value] of Object.entries({ 'Nama campaign': 'E2E Campaign Dummy', 'Brand campaign': 'E2E Brand', 'Brief campaign': 'Fixture sintetis', 'Objective campaign': 'Awareness', 'Target audience': 'Dummy audience', 'Key messaging': 'Dummy message', 'Nama batch pertama': 'Batch E2E', 'Deadline draft': '2026-10-24' })) await page.getByLabel(new RegExp(`^${label}`)).fill(value);
  await button(page, 'Simpan campaign').click(); await button(page, 'Tambah talent assignment').click();
  for (const [label, value] of Object.entries({ 'Batch assignment': 'batch-1', 'Identitas Creator': 'creator-1', 'Platform assignment': 'Instagram', 'Tujuan output': 'brand' })) await page.getByLabel(new RegExp(`^${label}`)).selectOption(value);
  for (const [label, value] of Object.entries({ 'Nama talent dummy': 'E2E Talent Dummy', 'Akun sosial dummy': '@e2e_dummy', 'Tanggal snapshot akun': '2026-10-18', 'Nama output': 'E2E brand video', 'Deadline output': '2026-10-24' })) await page.getByLabel(new RegExp(`^${label}`)).fill(value);
  await button(page, 'Simpan assignment').click(); await page.reload(); await button(page, 'E2E Campaign Dummy').click();
  await page.getByRole('region', { name: 'Assignment E2E Talent Dummy', exact: true }).waitFor();
  await go('creator'); await button(page, 'E2E Campaign Dummy').click(); assert.equal(await page.getByLabel('URL posting E2E brand video', { exact: true }).count(), 0);
 });
 await check('HQ adds product, milestone, batch and another output without replacing existing work', async () => {
  await go('hq'); await button(page, 'E2E Campaign Dummy').click();
  await page.getByText('Produk & milestone campaign', { exact: true }).click();
  assert.ok(await page.evaluate(() => { const ids = [...document.querySelectorAll('.hdf-field input,.hdf-field select,.hdf-field textarea')].map(node => node.id); return ids.length === new Set(ids).size; }));
  await page.getByLabel(/^Nama produk dummy/).fill('E2E Product'); await page.getByLabel(/^Varian produk/).fill('Gold');
  await page.getByLabel(/^Harga acuan produk/).fill('125000'); await button(page, 'Tambah produk').click();
  await page.getByLabel(/^Nama milestone/).fill('Insight H+7 E2E'); await page.getByLabel(/^Deadline milestone/).fill('2026-11-01'); await button(page, 'Tambah milestone').click();
  await page.getByLabel('Nama batch baru', { exact: true }).fill('Batch kedua'); await button(page, 'Tambah batch').click();
  const row = page.getByRole('region', { name: 'Assignment E2E Talent Dummy', exact: true });
  await row.getByText('Tambah output assignment', { exact: true }).click();
  await row.getByLabel(/^Judul output tambahan/).fill('E2E second output'); await row.getByLabel(/^Platform output tambahan/).fill('TikTok');
  await row.getByLabel(/^Deadline output tambahan/).fill('2026-10-27'); await row.getByLabel(/^Tujuan output tambahan/).selectOption('Posting Creator'); await button(row, 'Tambah output').click();
  await page.reload(); await button(page, 'E2E Campaign Dummy').click(); await page.getByText('Insight H+7 E2E · 2026-11-01', { exact: true }).waitFor();
  await go('creator'); await button(page, 'E2E Campaign Dummy').click(); await page.getByLabel('Pilihan produk E2E Talent Dummy', { exact: true }).selectOption({ label: 'E2E Product · Gold' });
  await page.getByRole('heading', { name: 'E2E second output', exact: true }).waitFor();
 });
 await check('A stale campaign browser tab cannot overwrite a newer batch mutation', async () => {
  await go('hq'); await pickSeed(); const stale = await context.newPage(); stale.setDefaultTimeout(12000);
  await stale.goto(`${origin}/hots/cineva-preview.html#/hq/campaigns`); await stale.getByRole('region', { name: 'Campaign operations', exact: true }).waitFor();
  await stale.getByLabel('Nama batch baru', { exact: true }).fill('Stale batch');
  await page.getByLabel('Nama batch baru', { exact: true }).fill('Latest batch'); await button(page, 'Tambah batch').click();
  await button(stale, 'Tambah batch').click();
  await stale.getByRole('alert').getByText('Campaign berubah. Muat kondisi terbaru.', { exact: true }).waitFor();
  await stale.reload(); await stale.getByText('Batch: Batch pembuka, Latest batch', { exact: true }).waitFor(); await stale.close();
 });
 await check('Vendor theme survives expanded mobile campaign operations without horizontal overflow', async () => {
  await page.setViewportSize({ width: 390, height: 844 }); await pickSeed();
  assert.equal(await page.locator('html').getAttribute('data-hots-vendor'), 'cineva');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: path.join(out, 'campaign-mobile.png'), fullPage: true });
 });
 assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
} catch (error) {
 checks.push({ name: 'Failure', status: 'failed', error: error.stack });
 await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true });
 await fs.writeFile(path.join(out, 'failure.html'), await page.content()); process.stderr.write(error.stack + '\n'); process.exitCode = 1;
} finally { await browser.close(); await fs.writeFile(path.join(out, 'e2e-results.json'), JSON.stringify({ checks, errors, blocked, origin, databaseUsed: false }, null, 2)); }
