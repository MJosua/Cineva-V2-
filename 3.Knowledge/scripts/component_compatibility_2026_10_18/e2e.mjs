import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {checkTableRefactor} from '../table_refactor_2026_10_18/browser-checks.mjs';
const root=path.resolve(import.meta.dirname,'../../..');
const runtime=process.env.CINEVA_TEST_RUNTIME||'C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node';
const require=createRequire(path.join(runtime,'package.json'));
const {chromium}=require('playwright');
const appRequire=createRequire(path.join(root,'1.Frontend/HOTS/package.json'));
const xlsx=appRequire('xlsx'); // Read-only validation of the browser's own downloaded file.
const out=path.join(root,'3.Knowledge/reports/component_compatibility_2026_10_18');await fs.mkdir(out,{recursive:true});
const exe=process.env.CINEVA_TEST_CHROMIUM||'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe';
const origin='http://127.0.0.1:48173',checks=[],requests=[],errors=[],blocked=[];
const server=spawn(process.execPath,[path.join(root,'3.Knowledge/scripts/package_upgrade_2026_10_14/serve-preview.mjs'),'--compatibility'],{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
let browser,page,failNext=false;
try{
 for(let i=0;i<100&&!logs.includes('listening on');i++){if(server.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,200));}
 assert.match(logs,/listening on/);
 browser=await chromium.launch({headless:true,executablePath:exe});
 page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.origin!==origin){blocked.push(url.origin);return route.abort();}
  if(url.pathname==='/hots_settings/trigger-functions'||url.pathname.endsWith('/categories')){
   requests.push({method:req.method(),path:url.pathname,query:Object.fromEntries(url.searchParams)});
   const data=url.pathname.endsWith('/categories')?[{category:'dummy',count:2}]:[{function_id:1,function_key:'dummy_fn',function_name:'Dummy handler',function_type:url.searchParams.get('function_type'),category:'dummy',is_active:1}];
   return route.fulfill({json:{success:true,data}});
  }
  if(url.pathname==='/hotsdashboard/report_detail/upsert'){
   requests.push({method:req.method(),path:url.pathname,body:req.postDataJSON()});const fail=failNext;failNext=false;
   return route.fulfill({json:fail?{success:false,message:'Dummy save rejected'}:{success:true}});
  }
  return route.continue();
 });
 const check=async(name,fn)=>{await fn();checks.push({name,status:'passed'});process.stdout.write(`[COMPATIBILITY-E2E][PASS] : ${name}\n`);};
 await page.goto(origin);const builder=page.getByTestId('builder'),state=()=>builder.getByTestId('form-state').textContent().then(JSON.parse);
 await check('Trigger hook: legacy alias + default active + structured categories',async()=>{
  await page.waitForFunction(()=>document.querySelector('[data-testid="trigger-state"]')?.textContent.includes('"loading":false'));
  const current=JSON.parse(await page.getByTestId('trigger-state').textContent());assert.equal(current.categories[0].count,2);
  const req=requests.find(r=>r.path==='/hots_settings/trigger-functions');assert.deepEqual(req.query,{category:'dummy',function_type:'sql',is_active:'true'});
 });
 await check('Trigger hook: canonical wins, false/search serialized over HTTP',async()=>{
  await page.getByRole('button',{name:'Canonical filter',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-testid="trigger-state"]')?.textContent.includes('"function_type":"handler"'));
  assert.deepEqual(requests.filter(r=>r.path==='/hots_settings/trigger-functions').at(-1).query,{category:'dummy',search:'dummy handler',function_type:'handler',is_active:'false'});
 });
 await check('Inspector whitelist matches create policy',async()=>{
  await builder.locator('article').nth(0).getByRole('button',{name:'Edit',exact:true}).click();
  await builder.getByLabel(/^Field type/).waitFor({state:'visible'});
  assert.deepEqual(await builder.getByLabel(/^Field type/).locator('option').evaluateAll(options=>options.filter(o=>!o.disabled).map(o=>o.value)),['text']);
  await builder.getByLabel('Label',{exact:true}).fill('Edited dummy caption');await builder.getByRole('button',{name:'Save changes',exact:true}).click();
  const items=await state();assert.equal(items[0].data.name,'caption');assert.deepEqual(items[0].data.custom_metadata,{keep:true});
 });
 await check('Unsupported existing field stays selected and preserves unknown metadata/rules',async()=>{
  await builder.locator('article').nth(1).getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await builder.getByLabel(/^Field type/).inputValue(),'legacy-dummy');
  assert.equal(await builder.getByLabel(/^Field type/).locator('option[value="legacy-dummy"]').getAttribute('disabled'),'');
  await builder.getByLabel('Label',{exact:true}).fill('Retained legacy');await builder.getByRole('button',{name:'Save changes',exact:true}).click();
  const field=(await state())[1].data;assert.equal(field.type,'legacy-dummy');assert.deepEqual(field.custom_metadata,{keep:'legacy'});assert.deepEqual(field.rules,[{dummy:true}]);
 });
 await check('Empty whitelist prevents root and section field creation',async()=>{
  await builder.getByRole('button',{name:'Policy empty',exact:true}).click();const count=(await state()).length;
  await builder.getByRole('button',{name:'+ Field',exact:true}).click();assert.equal((await state()).length,count);
  await builder.getByRole('button',{name:'+ Add child',exact:true}).click();assert.equal((await state())[2].data.fields.length,0);
 });
 await check('Whitelist without text: root and section additions use allowed default',async()=>{
  await builder.getByRole('button',{name:'Policy number',exact:true}).click();await builder.getByRole('button',{name:'+ Field',exact:true}).click();
  assert.equal((await state()).at(-1).data.type,'number');
  await builder.getByRole('button',{name:'Save changes',exact:true}).click();await builder.getByRole('button',{name:'+ Add child',exact:true}).click();
  assert.equal((await state())[2].data.fields[0].type,'number');await builder.getByRole('button',{name:'Save changes',exact:true}).click();
 });
 await check('Custom inspector receives policy; undefined whitelist retains old catalog',async()=>{
  await builder.getByRole('button',{name:'Toggle custom inspector',exact:true}).click();await builder.locator('article').nth(0).getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await builder.getByTestId('custom-policy').textContent(),'["number"]');
  await builder.getByRole('button',{name:'Toggle custom inspector',exact:true}).click();await builder.getByRole('button',{name:'Policy all',exact:true}).click();
  assert.ok(await builder.getByLabel(/^Field type/).locator('option').count()>3);await builder.getByRole('button',{name:'Cancel',exact:true}).click();
 });
 await check('Dummy draft reload preserves metadata and legacy type',async()=>{
  const before=await state();await builder.getByRole('button',{name:'Save dummy draft',exact:true}).click();await builder.getByRole('button',{name:'+ Field',exact:true}).click();await builder.getByRole('button',{name:'Reload dummy draft',exact:true}).click();assert.deepEqual(await state(),before);
 });
 await check('Host builder uses package policy without registry workaround',async()=>{
  const host=page.getByTestId('host-builder');await host.locator('article').first().getByRole('button',{name:'Edit',exact:true}).click();
  const types=await host.getByLabel(/^Field type/).locator('option').evaluateAll(options=>options.map(o=>o.value));assert.ok(!types.includes('amount'));assert.ok(types.includes('qrcodedesign'));
  await host.getByLabel('Label',{exact:true}).fill('Host edited');await host.getByRole('button',{name:'Save changes',exact:true}).click();assert.equal(JSON.parse(await host.getByTestId('host-state').textContent())[0].data.custom_metadata.keep,true);
 });
 const report=page.getByTestId('report'),reportState=()=>report.getByTestId('report-state').textContent().then(JSON.parse),saveCount=()=>requests.filter(r=>r.method==='POST').length;
 await check('Report Escape cancels without any request',async()=>{
  const cell=report.locator('tbody tr').first().locator('input');const before=saveCount();await cell.fill('Cancelled dummy');await cell.press('Escape');assert.equal(await cell.inputValue(),'Draft 1');assert.equal(saveCount(),before);assert.equal((await reportState())[0].Remarks,'Draft 1');
 });
 await check('Report Enter saves once and isolates detail rows',async()=>{
  const cell=report.locator('tbody tr').first().locator('input'),before=saveCount();await cell.fill('Saved dummy');await cell.press('Enter');
  await page.waitForFunction(()=>JSON.parse(document.querySelector('[data-testid="report-state"]').textContent)[0].Remarks==='Saved dummy');
  assert.equal(saveCount(),before+1);assert.equal((await reportState())[1].Remarks,'Draft 2');assert.equal(requests.filter(r=>r.method==='POST').at(-1).body.detail_id,'1');
 });
 await check('HTTP 200 business rejection restores value and flags invalid',async()=>{
  failNext=true;const cell=report.locator('tbody tr').first().locator('input');await cell.fill('Rejected dummy');await cell.press('Tab');
  await page.waitForFunction(()=>document.querySelector('[data-testid="report"] input[aria-invalid="true"]'));
  assert.equal(await cell.inputValue(),'Saved dummy');assert.equal((await reportState())[0].Remarks,'Saved dummy');
 });
 await check('Cross-page search and parent-owned search stay compatible',async()=>{
  const search=report.locator('input[placeholder]').first();await search.fill('Dummy talent 21');await page.waitForFunction(()=>document.querySelector('[data-testid="report"] tbody')?.textContent.includes('Dummy talent 21'));
  assert.equal(await report.locator('tbody tr').count(),1);await search.fill('');await report.getByRole('button',{name:'Toggle parent search',exact:true}).click();
  assert.equal(await search.count(),0);assert.equal(await report.locator('tbody tr').count(),1);
 });
 await check('XLSX export uses filtered dummy dataset',async()=>{
  const downloadPromise=page.waitForEvent('download');await report.getByRole('button',{name:/Export.*Excel|Export.*XLSX/i}).click();const download=await downloadPromise;await download.saveAs(path.join(out,'dummy-export.xlsx'));
  const book=xlsx.read(await fs.readFile(path.join(out,'dummy-export.xlsx')));const records=xlsx.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);assert.equal(records.length,1);assert.equal(records[0].Talent,'Dummy talent 21');
 });
 await check('Exact filter and XLSX include all 11 matching rows across pages',async()=>{
  await report.getByRole('button',{name:'Toggle parent search',exact:true}).click();await report.getByRole('button',{name:'Status: exact values',exact:true}).click();
  await page.locator('[data-radix-popper-content-wrapper] label').filter({hasText:/^open$/}).getByRole('checkbox').click();await page.keyboard.press('Escape');
  assert.equal(await report.locator('tbody tr').count(),10);
  const downloadPromise=page.waitForEvent('download');await report.getByRole('button',{name:'Export Excel',exact:true}).click();const download=await downloadPromise;await download.saveAs(path.join(out,'dummy-filtered-export.xlsx'));
  const book=xlsx.read(await fs.readFile(path.join(out,'dummy-filtered-export.xlsx'))),records=xlsx.utils.sheet_to_json(book.Sheets[book.SheetNames[0]]);assert.equal(records.length,11);assert.ok(records.every(row=>row.Status==='open'));assert.ok(records.some(row=>row.Talent==='Dummy talent 21'));
 });
 await report.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'e2e-report.png'),fullPage:false});
 await builder.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'e2e-builder.png'),fullPage:false});
 await checkTableRefactor(page,check);
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);checks.push({name:'No browser exceptions or external destinations',status:'passed'});
}catch(error){if(page){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});await fs.writeFile(path.join(out,'failure.html'),await page.content());}checks.push({name:'E2E failure',status:'failed',error:error.stack||String(error)});process.exitCode=1;process.stderr.write((error.stack||String(error))+'\n');}
finally{
 if(browser)await browser.close();server.stdin.write('stop\n');
 await new Promise(resolve=>{if(server.exitCode!==null)return resolve();const t=setTimeout(()=>{server.kill();resolve();},3000);server.once('exit',()=>{clearTimeout(t);resolve();});});
 await fs.writeFile(path.join(out,'e2e-results.json'),JSON.stringify({date:'2026-10-18',scope:'Component E2E with intercepted dummy API; database excluded by user',checks,requests,errors,blocked,logs},null,2));
}
