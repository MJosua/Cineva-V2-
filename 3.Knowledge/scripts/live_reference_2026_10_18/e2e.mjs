import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '../../..'), app = path.join(root, '1.Frontend/HOTS');
const require = createRequire(path.join(app, 'package.json')), bundled = createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const esbuild = require('esbuild'), alias = { '@': path.join(app, 'src') };
for (const p of JSON.parse(await fs.readFile(path.join(root, '3.Knowledge/scripts/package_upgrade_2026_10_14/snapshot.json'), 'utf8')).packages) alias[p.name] = path.join(root, p.local);
for (const p of ['react', 'react-dom', 'react-router-dom']) alias[p] = path.dirname(require.resolve(`${p}/package.json`));
for (const p of ['card', 'badge', 'button']) alias[`@hots/ui-kit/components/${p}`] = path.join(root, `1.Frontend/packages/ui-kit/src/components/${p}.tsx`);
let generation = 1, fail = false;
const fixture = () => ({ mode: 'live_read_only', readAt: '2026-10-18T10:00:00Z', accounts: [1, 2, 3].map(i => ({ id: `ref-${i}`, name: `Dummy Creator ${i}`, sourceFile: 'SYNTHETIC.xlsx', sheet: `Dummy cohort ${i}`, sourceRow: i + 30, sha256: 'dummy', sections: [{ title: 'Roster talent', fields: [{ label: 'STATUS PAYMENT', cell: `AA${i+30}`, value: i === 1 ? 'Diajukan' : null, formula: null, numberFormat: 'General', cellType: 's' }, { label: 'FOLLOWERS', cell: `T${i+30}`, value: i === 3 ? 'Lifestyle' : 1000 * generation, formula: null, numberFormat: 'General', cellType: 'n' }, { label: 'RANGE ENGAGEMENT', cell: 'AB61', value: '#DIV/0!', formula: '=SUM(V61:Z61)/AA61*100', numberFormat: 'General', cellType: 'e' }] }] })) });
const result = await esbuild.build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import {ReferenceAccounts} from './features/cineva-reference/ReferenceAccounts';createRoot(document.getElementById('root')).render(<BrowserRouter><ReferenceAccounts basePath=""/></BrowserRouter>);`, loader: 'tsx', resolveDir: path.join(app, 'src') }, bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'automatic', alias, logLevel: 'warning' });
esbuild.stop();
const js = result.outputFiles[0].text;
assert.ok(!js.includes('SIMPLY JUUN.xlsx') && !js.includes('Assesment Vape IC 100.xlsx'));
const server = http.createServer((req, res) => {
 if (req.url === '/hots/reference-excel/accounts') { res.statusCode = fail ? 503 : 200; res.setHeader('Content-Type','application/json'); return res.end(JSON.stringify(fail ? {error:'Synthetic unavailable'} : fixture())); }
 res.setHeader('Content-Type', req.url === '/fixture.js' ? 'text/javascript' : 'text/html'); res.end(req.url === '/fixture.js' ? js : '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`, out = path.join(root, '3.Knowledge/reports/live_reference_2026_10_18');
await fs.mkdir(out, { recursive: true });
const browser = await bundled('playwright').chromium.launch({ headless: true, executablePath: 'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe' });
const page = await browser.newPage(), checks = [], errors = [], blocked = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', route => { if (new URL(route.request().url()).origin !== origin) { blocked.push(route.request().url()); return route.abort(); } return route.continue(); });
const check = async (name, run) => { await run(); checks.push({ name, status: 'passed' }); process.stdout.write(`[REFERENCE-E2E][PASS] : ${name}\n`); };
try {
 await page.goto(`${origin}/creator/reference?account=ref-1`);
 await check('Raw names, source text and formula errors render literally without invented payment', async () => {
  await page.getByRole('heading',{name:'Hai, Dummy Creator 1.',exact:true}).waitFor();
  await page.getByText('Rumus: =SUM(V61:Z61)/AA61*100',{exact:true}).waitFor();
  assert.ok(await page.getByText('#DIV/0!',{exact:true}).isVisible());
  assert.equal(await page.getByText('Paid',{exact:true}).count(),0);
 });
 await check('All three accounts switch by URL and reload preserves selected account', async () => {
  for (const i of [2,3,1]) { await page.getByRole('link',{name:`Dummy Creator ${i}`,exact:true}).click(); await page.getByRole('heading',{name:`Hai, Dummy Creator ${i}.`,exact:true}).waitFor(); }
  await page.reload(); await page.getByRole('heading',{name:'Hai, Dummy Creator 1.',exact:true}).waitFor();
 });
 await check('Refresh fetches updated source data without rebuilding or masking text categories', async () => {
  generation=2; await page.getByRole('button',{name:'Muat ulang dari Excel',exact:true}).click();
  await page.getByText('2000',{exact:true}).first().waitFor();
  await page.getByRole('link',{name:'Dummy Creator 3',exact:true}).click(); await page.getByText('Lifestyle',{exact:true}).first().waitFor();
  await page.getByText('Kosong di Excel',{exact:true}).first().waitFor();
 });
 await check('Lifestyle maps to a content niche tag and never becomes an Instagram follower count', async () => {
  await page.getByTestId('content-niche').getByText('Lifestyle',{exact:true}).waitFor();
  await page.getByTestId('instagram-followers').getByText('Jumlah belum tercatat',{exact:true}).waitFor();
  assert.equal(await page.getByTestId('instagram-followers').getByText('Lifestyle',{exact:true}).count(),0);
  await page.getByText('Niche konten (header Excel: FOLLOWERS)',{exact:true}).waitFor();
 });
 await check('Read failure shows stale-data warning while preserving previous display; recovery works', async () => {
  fail=true; await page.getByRole('button',{name:'Muat ulang dari Excel',exact:true}).click(); await page.getByRole('alert').waitFor();
  await page.getByRole('heading',{name:'Hai, Dummy Creator 3.',exact:true}).waitFor();
  fail=false; await page.getByRole('button',{name:'Muat ulang dari Excel',exact:true}).click(); await page.getByRole('alert').waitFor({state:'detached'});
 });
 await check('Reader never writes application localStorage or calls external services', async () => {
  assert.equal(await page.evaluate(()=>localStorage.length),0); assert.deepEqual(errors,[]); assert.deepEqual(blocked,[]);
 });
} catch (error) { checks.push({ name: 'Failure', status: 'failed', error: error.stack }); process.exitCode = 1; process.stderr.write(error.stack + '\n'); }
finally { await browser.close(); await new Promise(resolve => server.close(resolve)); await fs.writeFile(path.join(out, 'e2e-results.json'), JSON.stringify({ checks, errors, blocked, fixtures: 'synthetic live endpoint only; no real workbook reads', databaseUsed: false }, null, 2)); }
