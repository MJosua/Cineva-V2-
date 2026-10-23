import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/cineva_maturity_2026_10_18');await fs.mkdir(out,{recursive:true});
const require=createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),origin=process.env.CINEVA_PRODUCTS_ORIGIN||'http://127.0.0.1:48174';
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),checks=[],errors=[],blocked=[];page.setDefaultTimeout(12000);
page.on('pageerror',e=>errors.push(e.message));
await page.context().route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin||/^\/(auth|api|hotsdashboard|hotsprefs|hots_settings)(\/|$)/.test(url.pathname.replace(/^\/hots/,''))){blocked.push(url.href);return route.abort();}return route.continue();});
let stalePage;
const check=async(name,fn)=>{await fn();checks.push({name,status:'passed'});process.stdout.write(`[MATURITY-E2E][PASS] : ${name}\n`);};
const button=name=>page.getByRole('button',{name,exact:true}),nav=label=>page.getByRole('link',{name:label,exact:true}).click();
const detail=()=>page.getByTestId('inquiry-detail'),open=()=>page.getByRole('button',{name:/^Maturity Film ·/}).click();
try {
 await page.goto(`${origin}/hots/cineva-preview.html#/creator/services`,{timeout:60000});await page.getByTestId('service-desk').waitFor();
 await check('Distinct service details retain common inputs while sending only the chosen schema',async()=>{
   await button('Permintaan jasa baru').click();await page.getByLabel(/^Judul permintaan/).fill('Maturity Film');
   await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Campaign');await page.getByLabel(/^SOW dan batas/).fill('SOW not for production');await page.getByLabel(/^Rencana deliverable per/).waitFor();
   await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Content Shoot');await page.getByLabel(/^Jumlah sesi/).fill('2');await page.getByLabel(/^Rincian sesi/).fill('Morning and evening');
   await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Production');assert.equal(await page.getByLabel(/^Judul permintaan/).inputValue(),'Maturity Film');
   for(const[label,value]of [['Brand / client','Maturity Brand'],['Kontak PIC','Dummy PIC'],['Lokasi','Studio'],['Deliverable yang diminta','Final film'],['Konsep produksi','Graduation film'],['Persiapan: script','Storyboard approved'],['Rencana shooting','Two camera shoot'],['Editing, format','MP4 final']])await page.getByLabel(new RegExp('^'+label)).fill(value);
   await page.getByLabel(/^Jasa tenaga/).selectOption('Videografer');await page.getByLabel(/^Kebutuhan produksi/).selectOption('Graduation');await page.getByLabel(/^Jadwal layanan/).fill('2026-10-23T10:00');await page.getByLabel(/^Jumlah crew/).fill('2');await page.getByLabel(/^Jumlah unit gear/).fill('1');
   await button('Hitung & siapkan brief').click();await button('Kirim permintaan').click();await detail().waitFor();assert.equal(await detail().getByText('SOW not for production',{exact:true}).count(),0);await detail().getByText('Storyboard approved',{exact:true}).waitFor();
 });
 await check('Owner requests quote changes and HQ creates a new scoped version',async()=>{
   await nav('Cineva HQ');await nav('Layanan & inquiry');await open();await button('Mulai review').click();await button('Kirim penawaran').click();
   await nav('Creator Space');await nav('Layanan Cineva');await open();
   stalePage=await page.context().newPage();stalePage.on('pageerror',error=>errors.push(error.message));await stalePage.goto(`${origin}/hots/cineva-preview.html#/creator/services`);await stalePage.getByRole('button',{name:/^Maturity Film ·/}).click();
   await page.getByLabel('Perubahan yang diinginkan').fill('Kurangi crew menjadi satu orang');await button('Minta perubahan').click();await detail().getByText('changes_requested',{exact:true}).waitFor();assert.equal(await button('Setujui penawaran').count(),0);
   await nav('Cineva HQ');await nav('Layanan & inquiry');await open();await page.getByLabel('Crew penawaran',{exact:true}).fill('1');await button('Revisi dengan tarif terbaru').click();await detail().getByText('reviewing',{exact:true}).waitFor();
   assert.match(await detail().getByTestId('service-quote').textContent(),/8\.100\.000/);await button('Kirim penawaran').click();
 });
 await check('A stale browser tab cannot approve an outdated quote revision',async()=>{
   await stalePage.getByRole('button',{name:'Setujui penawaran',exact:true}).click();await stalePage.getByRole('alert').filter({hasText:/Penawaran telah berubah/}).waitFor();
   assert.equal(await stalePage.evaluate(()=>JSON.parse(localStorage.getItem('cineva_services_dummy_v1_shared-requests')).requests.find(row=>row.brief.title==='Maturity Film').status),'quoted');await stalePage.close();
 });
 await check('Exact quote version is approved, history retained and project fee pinned',async()=>{
   await nav('Creator Space');await nav('Layanan Cineva');await open();await button('Setujui penawaran').click();await detail().getByText('Disetujui: revisi 2. Nominal terkunci untuk project.',{exact:true}).waitFor();
   await page.getByText('Riwayat versi penawaran',{exact:true}).click();await page.getByText(/Snapshot revisi 1:/).waitFor();assert.equal(await button('Revisi dengan tarif terbaru').count(),0);
   await nav('Cineva HQ');await nav('Layanan & inquiry');await open();await button('Jadikan project').click();await button('Project sudah dibuat').waitFor();
   await nav('Projects');await page.getByTestId('job-card').filter({hasText:'Maturity Film'}).getByRole('button',{name:'Buka detail',exact:true}).click();assert.match(await page.getByRole('dialog').textContent(),/8\.100\.000/);
 });
 await check('Production workflow progresses separately from payment and survives reload',async()=>{
   const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Lanjut ke Produksi',exact:true}).click();await dialog.getByText('2. Produksi · Saat ini',{exact:true}).waitFor();await dialog.getByRole('button',{name:'Lanjut ke Pascaproduksi',exact:true}).click();await dialog.getByText('Pembayaran: Unpaid',{exact:true}).waitFor();assert.equal(await dialog.getByLabel('Status pekerjaan').inputValue(),'running');
   await page.keyboard.press('Escape');await page.reload();await page.getByTestId('job-card').filter({hasText:'Maturity Film'}).getByRole('button',{name:'Buka detail',exact:true}).click();await page.getByRole('dialog').getByText('3. Pascaproduksi · Saat ini',{exact:true}).waitFor();await page.keyboard.press('Escape');
 });
 await check('CS queue filters, assigns agents and audits reassignment/handover',async()=>{
   await nav('Creator Space');await nav('Bantuan & CS');await open();await button('Bantuan manusia').click();
   await nav('Cineva HQ');await nav('Inbox CS');await page.getByLabel('Cari percakapan CS').fill('no-match');assert.equal(await page.getByRole('button',{name:/^Maturity Film ·/}).count(),0);await page.getByLabel('Cari percakapan CS').fill('maturity');await page.getByLabel('Filter mode CS').selectOption('waiting');await page.getByText(/Menunggu agen: 1/).waitFor();await open();await button('Ambil percakapan').click();
   await page.getByLabel('Filter mode CS').selectOption('human');await page.getByLabel('Penanggung jawab CS').selectOption('hq-1-agent-2');await page.getByLabel('Filter agen CS').selectOption('hq-1-agent-2');assert.equal(await page.getByRole('button',{name:/^Maturity Film ·/}).count(),1);await page.getByText('Riwayat penanganan CS',{exact:true}).click();await page.getByText(/human → human/).waitFor();
   await button('Selesaikan percakapan').click();await button('Kembali ke AI').click();await page.getByText('Mode: ai',{exact:true}).waitFor();
 });
 await check('Booking requires specialist allocation and explicit confirmation',async()=>{
   await nav('Crew & schedule');await page.getByLabel('Project untuk alokasi').selectOption({label:'Maturity Film'});assert.ok(await button('Konfirmasi booking').isDisabled());
   await page.getByText('Kamera A',{exact:true}).click();await button('Simpan alokasi').click();assert.ok(await button('Konfirmasi booking').isDisabled());await page.getByText(/Alokasikan Videografer yang tersedia/).waitFor();
   await page.getByText('Videografer dummy',{exact:true}).click();await button('Simpan alokasi').click();await button('Konfirmasi booking').click();await page.getByText('Booking dikonfirmasi oleh hq-1.',{exact:true}).waitFor();assert.ok(await button('Konfirmasi booking').isDisabled());
 });
 await check('Reallocation invalidates booking and overlapping specialist schedules are rejected',async()=>{
   await page.getByLabel('Mulai alokasi').fill('2026-10-23T13:00');await button('Simpan alokasi').click();await page.getByText('Alokasi belum menjadi booking terkonfirmasi.',{exact:true}).waitFor();await button('Konfirmasi booking').click();
   await page.getByLabel('Project untuk alokasi').selectOption('hq-2');await page.getByLabel('Mulai alokasi').fill('2026-10-23T13:00');await page.getByText('Videografer dummy',{exact:true}).click();await button('Simpan alokasi').click();await page.getByRole('alert').filter({hasText:/Jadwal resource bertabrakan/}).waitFor();
   await page.getByLabel('Project untuk alokasi').selectOption({label:'Maturity Film'});await page.getByText('Booking dikonfirmasi oleh hq-1.',{exact:true}).waitFor();
 });
 await check('Expanded mobile views preserve vendor style and avoid horizontal overflow',async()=>{
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('html').getAttribute('data-hots-vendor'),'cineva');await page.screenshot({path:path.join(out,'booking-mobile.png'),fullPage:true});
 });
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
}catch(error){checks.push({name:'Failure',status:'failed',error:error.stack});await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});await fs.writeFile(path.join(out,'failure.html'),await page.content());process.stderr.write(error.stack+'\n');process.exitCode=1;}
finally{await browser.close();await fs.writeFile(path.join(out,'e2e-results.json'),JSON.stringify({checks,errors,blocked,origin,databaseUsed:false},null,2));}
