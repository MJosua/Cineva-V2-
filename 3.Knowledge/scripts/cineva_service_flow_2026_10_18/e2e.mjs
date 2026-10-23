import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/cineva_service_flow_2026_10_18');await fs.mkdir(out,{recursive:true});
const require=createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),origin=process.env.CINEVA_PRODUCTS_ORIGIN||'http://127.0.0.1:48174';
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),checks=[],errors=[],blocked=[];page.setDefaultTimeout(12000);
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin||/\/(auth|api|hotsdashboard|hotsprefs|hots_settings)(\/|$)/.test(url.pathname)){blocked.push(url.href);return route.abort();}return route.continue();});
const check=async(name,fn)=>{await fn();checks.push({name,status:'passed'});process.stdout.write(`[SERVICES-E2E][PASS] : ${name}\n`);};
const button=name=>page.getByRole('button',{name,exact:true});
const nav=label=>page.getByRole('link',{name:label,exact:true}).click();
const detail=()=>page.getByTestId('inquiry-detail');
const open=()=>page.getByRole('button',{name:/^E2E Graduation ·/}).click();
try {
 await page.goto(`${origin}/hots/cineva-preview.html#/creator/services`,{timeout:60000});await page.getByTestId('service-desk').waitFor();
 await check('Three brief schemas preserve common inputs and reject incomplete submit',async()=>{
   await button('Permintaan jasa baru').click();await page.getByLabel(/^Judul permintaan/).fill('E2E Graduation');
   await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Campaign');assert.equal(await page.getByLabel(/^Judul permintaan/).inputValue(),'E2E Graduation');await page.getByLabel(/^Tujuan campaign/).waitFor();
   await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Production');assert.equal(await page.getByLabel(/^Tujuan campaign/).count(),0);
   await button('Hitung & siapkan brief').click();assert.equal(await button('Kirim permintaan').count(),0);
   for(const[label,value]of [['Brand / client','Service Dummy Brand'],['Kontak PIC','Service PIC'],['Lokasi','Studio Dummy'],['Deliverable yang diminta','Video graduation'],['Konsep produksi','Dokumentasi ceremony']])await page.getByLabel(new RegExp('^'+label)).fill(value);
   await page.getByLabel(/^Jadwal layanan/).fill('2026-10-22T10:00');await page.getByLabel(/^Jasa tenaga/).selectOption('Videografer');await page.getByLabel(/^Kebutuhan produksi/).selectOption('Graduation');await page.getByLabel(/^Jumlah crew/).fill('2');await page.getByLabel(/^Jumlah unit gear/).fill('1');
   await button('Hitung & siapkan brief').click();await page.getByTestId('service-quote').waitFor();assert.match(await page.getByTestId('service-quote').textContent(),/8\.450\.000/);
 });
 await check('Creator submits selected brief; excluded fields never leak',async()=>{
   await button('Kirim permintaan').click();await detail().waitFor();assert.match(await detail().textContent(),/submitted/);assert.equal(await detail().getByText('objective',{exact:true}).count(),0);assert.match(await detail().textContent(),/Video graduation/);
 });
 await check('AI and human handover preserve conversation context',async()=>{
   await page.getByLabel('Pesan untuk CS').fill('Bisa bantu estimasi?');await button('Kirim pesan').click();await page.getByRole('listitem').filter({hasText:'Simulasi AI:'}).waitFor();
   await button('Bantuan manusia').click();await page.getByText('Mode: waiting',{exact:true}).waitFor();
   await nav('Cineva HQ');await nav('Inbox CS');await open();await button('Ambil percakapan').click();await page.getByText(/Mode: human/).waitFor();
   await page.getByLabel('Pesan untuk CS').fill('PIC dummy membantu brief graduation.');await button('Kirim pesan').click();await page.getByRole('listitem').filter({hasText:'PIC dummy membantu'}).waitFor();await button('Selesaikan percakapan').click();await page.getByText(/^Mode: resolved/).waitFor();assert.ok(await button('Kirim pesan').isDisabled());
 });
 await check('Second HQ has no access to first HQ request queue',async()=>{
   await page.getByLabel('Workspace dummy').selectOption('hq-2');await page.getByText('Belum ada permintaan untuk workspace ini.',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/^E2E Graduation ·/}).count(),0);
   await page.getByLabel('Workspace dummy').selectOption('hq-1');await open();
 });
 await check('HQ rate update preserves snapshot; explicit revision updates quote',async()=>{
   await nav('Layanan & inquiry');await open();await page.getByText('Konfigurasi tarif dummy',{exact:true}).click();
   await page.getByLabel(/^Versi tarif/).fill('DUMMY-2');await page.getByLabel(/^Tarif crew/).fill('400000');await button('Simpan tarif dummy').click();
   assert.match(await detail().getByTestId('service-quote').textContent(),/DUMMY-1/);await button('Mulai review').click();await button('Revisi dengan tarif terbaru').click();
   await detail().getByText(/Snapshot tarif DUMMY-2/).waitFor();assert.match(await detail().getByTestId('service-quote').textContent(),/8\.550\.000/);await button('Kirim penawaran').click();await detail().getByText('quoted',{exact:true}).waitFor();
 });
 await check('Other Creator cannot see the inquiry; owner accepts the quote',async()=>{
   await nav('Creator Space');await nav('Layanan Cineva');await page.getByLabel('Workspace dummy').selectOption('creator-2');await page.getByText('Belum ada permintaan untuk workspace ini.',{exact:true}).waitFor();
   await page.getByLabel('Workspace dummy').selectOption('creator-1');await open();assert.match(await detail().textContent(),/PIC dummy membantu/);await button('Setujui penawaran').click();await detail().getByText('accepted',{exact:true}).waitFor();
 });
 await check('Accepted request converts to one HOTS-compatible dummy project',async()=>{
   await nav('Cineva HQ');await nav('Layanan & inquiry');await open();await button('Jadikan project').dblclick();await button('Project sudah dibuat').waitFor();
   await nav('Projects');assert.equal(await page.getByRole('heading',{name:'E2E Graduation',exact:true}).count(),1);
   await page.getByTestId('job-card').filter({hasText:'E2E Graduation'}).getByRole('button',{name:'Buka detail',exact:true}).click();assert.match(await page.getByRole('dialog').textContent(),/8\.550\.000/);await page.keyboard.press('Escape');
 });
 await check('Reload retains requests, quote and support messages',async()=>{
   await nav('Layanan & inquiry');await open();await page.reload();await open();assert.match(await detail().textContent(),/DUMMY-2/);assert.match(await detail().textContent(),/PIC dummy membantu/);assert.ok(await button('Project sudah dibuat').isDisabled());
 });
 await check('Second HQ project dataset excludes converted projects from the first HQ',async()=>{
   await page.getByLabel('Workspace dummy').selectOption('hq-2');await nav('Projects');assert.equal(await page.getByRole('heading',{name:'E2E Graduation',exact:true}).count(),0);
   await nav('Layanan & inquiry');await page.getByLabel('Workspace dummy').selectOption('hq-1');await open();
 });
 await check('Converted project continues through resource scheduling, delivery, payment and archive',async()=>{
   await nav('Crew & schedule');await page.getByLabel('Project untuk alokasi').selectOption({label:'E2E Graduation'});await page.getByLabel('Mulai alokasi').fill('2026-10-22T10:00');await page.getByText('Kamera A',{exact:true}).click();await button('Simpan alokasi').click();await page.getByRole('status').filter({hasText:'Perubahan disimpan'}).waitFor();
   await nav('Projects');await page.getByTestId('job-card').filter({hasText:'E2E Graduation'}).getByRole('button',{name:'Buka detail',exact:true}).click();
   const dialog=page.getByRole('dialog');await dialog.getByLabel('Catatan deliverable').fill('Dummy final graduation');await dialog.getByRole('button',{name:'Tambah',exact:true}).click();await dialog.getByText('Dummy final graduation',{exact:true}).waitFor();
   await dialog.getByLabel('Catat pembayaran dummy (Rp)').fill('8550000');await dialog.getByRole('button',{name:'Catat',exact:true}).click();await dialog.getByText('Pembayaran: Paid',{exact:true}).waitFor();await dialog.getByLabel('Status pekerjaan').selectOption('done');await dialog.getByRole('button',{name:'Arsipkan job',exact:true}).click();
   await nav('Arsip');await page.getByTestId('job-card').filter({hasText:'E2E Graduation'}).getByRole('button',{name:'Buka detail',exact:true}).click();assert.match(await dialog.textContent(),/Diterima Rp\s*8\.550\.000/);await page.keyboard.press('Escape');await nav('Layanan & inquiry');await open();
 });
 await check('Direct HQ client request can be cancelled without a project',async()=>{
   await button('Permintaan jasa baru').click();for(const[label,value]of [['Judul permintaan','E2E Cancel'],['Brand / client','Direct Client'],['Kontak PIC','PIC'],['Lokasi','Studio'],['Deliverable yang diminta','Foto']])await page.getByLabel(new RegExp('^'+label)).fill(value);
   await page.getByLabel(/^Jasa tenaga/).selectOption('Fotografer');await page.getByLabel(/^Platform konten/).selectOption('Instagram');await button('Hitung & siapkan brief').click();await button('Kirim permintaan').click();await button('Batalkan permintaan').click();await detail().getByText('cancelled',{exact:true}).waitFor();assert.equal(await button('Jadikan project').count(),0);
 });
 await check('Unsent draft survives reload with type and common values',async()=>{
   await button('Permintaan jasa baru').click();await page.getByLabel(/^Judul permintaan/).fill('Draft retained');await page.getByLabel('Jenis layanan',{exact:true}).selectOption('Production');
   await page.reload();await button('Permintaan jasa baru').click();assert.equal(await page.getByLabel('Jenis layanan',{exact:true}).inputValue(),'Production');assert.equal(await page.getByLabel(/^Judul permintaan/).inputValue(),'Draft retained');await button('Tutup brief').click();
 });
 await check('Storage failure keeps previous support state and shows an actionable error',async()=>{
   await open();await button('Kembali ke AI').click();await page.getByText('Mode: ai',{exact:true}).waitFor();
   await page.evaluate(()=>{window.serviceOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('cineva_services_dummy_v1_'))return;window.serviceOriginalSet.call(this,key,value);};});
   await button('Bantuan manusia').click();await page.getByRole('alert').filter({hasText:'Penyimpanan inquiry dummy gagal'}).waitFor();assert.equal(await page.getByText('Mode: ai',{exact:true}).count(),1);
   await page.evaluate(()=>{Storage.prototype.setItem=window.serviceOriginalSet;});
 });
 await check('Reset workspace can recover the accepted project without a second inquiry',async()=>{
   await button('Reset dummy').click();await button('Jadikan project').waitFor();await button('Jadikan project').click();await button('Project sudah dibuat').waitFor();
   assert.equal(await page.getByRole('button',{name:/^E2E Graduation ·/}).count(),1);
 });
 await check('Mobile service layout has no horizontal page overflow and keeps vendor theme',async()=>{
   await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await page.locator('html').getAttribute('data-hots-vendor'),'cineva');await page.getByLabel('Pesan untuk CS').focus();assert.ok(await page.getByLabel('Pesan untuk CS').evaluate(el=>el===document.activeElement));
 });
 await page.screenshot({path:path.join(out,'service-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
} catch(error) {checks.push({name:'Failure',status:'failed',error:error.stack});await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});await fs.writeFile(path.join(out,'failure.html'),await page.content());process.stderr.write(error.stack+'\n');process.exitCode=1;}
finally {await browser.close();await fs.writeFile(path.join(out,'e2e-results.json'),JSON.stringify({checks,errors,blocked,origin,databaseUsed:false},null,2));}
