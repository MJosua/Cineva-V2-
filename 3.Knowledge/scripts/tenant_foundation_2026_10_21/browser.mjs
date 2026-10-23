import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../../..'), out = path.join(root, '3.Knowledge/reports/tenant_foundation_2026_10_21');
const require = createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium} = require('playwright');
const browser = await chromium.launch({headless: true, executablePath: 'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const origin = 'http://127.0.0.1:48184';
const context = await browser.newContext({viewport: {width: 1280, height: 900}}), page = await context.newPage();
const errors = [], blocked = [], checks = [];let companies = [], selected = 1, denied = false, accepted = false, legacySse = 0, tenant = 'cineva';
page.on('pageerror', error => errors.push(error.message));page.setDefaultTimeout(15000);
const ctx = id => ({schema_version: 1, tenant_key: tenant, company_id: id, user_id: '7', membership_version: 'v1'});
await context.addCookies([{name: 'cineva_csrf', value: 'synthetic-csrf', url: origin}]);
await page.addInitScript(() => localStorage.setItem('hots_tokek', 'synthetic-legacy-token'));
await page.route('**/*', async route => {
 const req = route.request(), url = new URL(req.url());
 if (req.resourceType() === 'eventsource') legacySse++;
 if (url.origin !== origin) {blocked.push(url.origin);return route.abort();}
 if (url.pathname.startsWith('/api/tenant/v1/')) {
  assert.equal(req.headers().authorization, undefined);
  if (denied) return route.fulfill({status: 401, json: {success: false, error: {code: 'AUTHENTICATION_REQUIRED'}}});
  let data;
  if (url.pathname.endsWith('/bootstrap')) data = {user_id: '7', tenant_key: tenant, companies};
  else if (url.pathname.endsWith('/context')) {assert.equal(req.headers()['x-csrf-token'], 'synthetic-csrf');selected = req.postDataJSON().company_id;data = {context: ctx(selected), context_id: 'x'.repeat(42)+selected};}
  else if (url.pathname.endsWith('/brand')) {assert.equal(req.headers()['x-workspace-context'], 'x'.repeat(42)+selected);data = {context: ctx(selected), brand: {schema_version: 1, revision: 1, tenant_key: tenant, company_id: selected, brand: {display_name: selected === 1 ? 'Brand A' : 'Brand B', logo_asset_id: null}, tokens: {primary: selected === 1 ? '37 62% 31%' : '210 70% 35%'}}};}
  else if (url.pathname.endsWith('/tickets')) {assert.equal(req.headers()['x-workspace-context'], 'x'.repeat(42)+selected);data = {context: ctx(selected), rows: [{ticket_id: `test-${selected}`, title: `Ticket Company ${selected}`, status_id: 1}], total: 1};}
  else if (url.pathname.endsWith('/invitations/accept')) {assert.equal(req.headers()['x-csrf-token'], 'synthetic-csrf');accepted = true;companies = [{company_id: 1, company_name: 'Company A'}];data = {tenant_key: 'cineva', company_id: 1};}
  else return route.fulfill({status: 404, json: {success: false}});
  return route.fulfill({json: {success: true, data}});
 }
 if (['xhr', 'fetch', 'eventsource'].includes(req.resourceType())) return route.fulfill({json: {success: true, data: [], menus: [], services: []}});
 return route.continue();
});
const check = async (name, fn) => {await fn();checks.push({name, status: 'passed'});};
try {
 await page.goto(origin+'/hots/platform/workspaces');
 await check('active personal account has invitation-only empty state', async () => {await page.getByText('Akun Anda aktif.', {exact: false}).waitFor();assert.equal(await page.getByRole('button', {name: 'Company A', exact: true}).count(), 0);});
 await check('invalid invitation does not activate company', async () => {await page.getByLabel('Kode undangan perusahaan').fill('invalid');await page.getByRole('button', {name: 'Terima undangan'}).click();await page.getByRole('alert').waitFor();assert.equal(accepted, false);});
 await check('invitation acceptance refreshes company list', async () => {await page.getByLabel('Kode undangan perusahaan').fill('i'.repeat(43));await page.getByRole('button', {name: 'Terima undangan'}).click();await page.getByRole('button', {name: 'Company A', exact: true}).waitFor();assert(accepted);});
 companies = [{company_id: 1, company_name: 'Company A'}, {company_id: 2, company_name: 'Company B'}];await page.reload();
 await check('company selection uses scoped header and JSON branding', async () => {await page.getByRole('button', {name: 'Company A', exact: true}).click();await page.getByText('Brand A', {exact: true}).waitFor();assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--primary')), '37 62% 31%');});
 await check('switch company restores old brand and applies new config', async () => {await page.getByRole('button', {name: 'Company B', exact: true}).click();await page.getByText('Brand B', {exact: true}).waitFor();assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue('--primary')), '210 70% 35%');await page.screenshot({path: path.join(out, 'workspace-brand.png'), fullPage: true});});
 await page.setViewportSize({width: 390, height: 844});await page.screenshot({path: path.join(out, 'workspace-mobile.png'), fullPage: true});
 denied = true;await page.reload();
 await check('unauthenticated bootstrap offers SSO without exposing company data', async () => {await page.getByRole('link', {name: 'Masuk dengan SSO'}).waitFor();assert.equal(await page.getByRole('button', {name: 'Company A', exact: true}).count(), 0);assert.equal(await page.getByRole('link', {name: 'Masuk dengan SSO'}).getAttribute('href'), origin+'/api/tenant/v1/sso/start');});
 await check('BFF workspace does not start legacy SSE or send legacy bearer token', async () => {assert.equal(legacySse, 0);});
 denied = false;tenant = 'hots';await page.reload();
 await check('HOTS ticket pilot uses selected company scope', async () => {await page.getByRole('button', {name:'Company A',exact:true}).click();await page.getByText('Ticket Company 1',{exact:true}).waitFor();});
 await check('HOTS company switch replaces prior ticket list', async () => {await page.getByRole('button',{name:'Company B',exact:true}).click();await page.getByText('Ticket Company 2',{exact:true}).waitFor();assert.equal(await page.getByText('Ticket Company 1',{exact:true}).count(),0);await page.screenshot({path:path.join(out,'hots-ticket-pilot.png'),fullPage:true});});
 assert.deepEqual(errors, []);
 await fs.writeFile(path.join(out, 'browser.json'), JSON.stringify({checks, errors, blockedExternalOrigins: [...new Set(blocked)], liveBackend: false, scope: 'Production frontend + intercepted synthetic API; separate localhost HTTP tests exercise backend router.'}, null, 2));
 process.stdout.write('[TENANT-BROWSER][INFO] : '+checks.length+' checks passed\n');
} finally {await browser.close();}
