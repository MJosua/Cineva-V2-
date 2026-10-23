import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'../../..');
const out=path.join(root,'3.Knowledge/reports/saas_audit_2026_10_21');
await fs.mkdir(out,{recursive:true});
const base='2.Backend/Integrated-API/';
const controller=base+'controller/hots_controller/';
const records=[];
async function load(relative,dependencies){
  const source=await fs.readFile(path.join(root,relative),'utf8');
  const module={exports:{}};
  vm.runInNewContext(source,{module,exports:module.exports,require:id=>{
    if(!(id in dependencies))throw new Error('Unstubbed import: '+id);
    return dependencies[id];
  },console:{log(){},warn(){},error(){}},process:{env:{}},Date,Set,Map},{filename:relative});
  return module.exports;
}
async function invoke(relative,method,query={},dataToken={user_id:101,company_id:11},params={}){
  const calls=[];
  const dbHots={promise:()=>({query:async(sql,args)=>{calls.push({sql,args});return [[],[]];}})};
  const mod=await load(relative,{'../../../config/db':{dbHots}});
  const res={statusCode:200,status(code){this.statusCode=code;return this;},json(payload){this.payload=payload;return this;}};
  await mod[method]({query,dataToken,params},res);
  assert.notEqual(res.statusCode,500);
  return {calls,status:res.statusCode};
}
const jobs=await invoke(controller+'jobmarketplace/JobManagementController.js','listJobs');
assert.equal(jobs.calls.length,1);
assert(!/company_id|tenant_id/.test(jobs.calls[0].sql));
records.push({id:'T01',observation:'listJobs tanpa filter company/tenant walaupun token company 11',result:'REPRODUCED',...jobs});
const bill=await invoke(controller+'jobmarketplace/CinevaBillingController.js','listBillings',{company_id:22});
assert.equal(bill.calls[0].args[0],22);
records.push({id:'T02',observation:'billing menerima query company 22 mengungguli token company 11',result:'REPRODUCED',...bill});
const noCompany=await invoke(controller+'jobmarketplace/CinevaBillingController.js','getReport',{}, {user_id:101});
assert(noCompany.calls.every(c=>!c.sql.includes('WHERE company_id')));
records.push({id:'T03',observation:'report tanpa company menghasilkan query tanpa scope company',result:'REPRODUCED',...noCompany});
const sub=await invoke(controller+'jobmarketplace/CinevaSubscriptionController.js','getSubscription',{}, {user_id:101});
assert.equal(sub.calls[0].args[0],1);
records.push({id:'T04',observation:'subscription tanpa company jatuh ke company 1',result:'REPRODUCED',...sub});
const detail=await invoke(controller+'jobmarketplace/JobManagementController.js','getJobDetail',{},undefined,{job_id:202});
assert(detail.calls[0].sql.includes('WHERE j.job_id = ?'));
assert(!/company_id|tenant_id/.test(detail.calls[0].sql));
records.push({id:'T05',observation:'lookup detail job hanya memakai job_id sebelum pemeriksaan tenant',result:'REPRODUCED',...detail});

const findings=[
['A01','P0','Isolasi marketplace','Belum siap','listJobs tanpa predicate company/tenant; detail hanya job_id.','Tenant repository wajib untuk list/detail/mutasi dan relasi anak.',controller+'jobmarketplace/JobManagementController.js','async listJobs'],
['A02','P0','Scope billing','Belum siap','query company_id mengungguli token; jika kosong report tanpa scope.','Validasi membership dan scope tenant server; filter client hanya mempersempit.',controller+'jobmarketplace/CinevaBillingController.js','const companyId = req.query.company_id'],
['A03','P0','Identitas tenant','Parsial','JWT diverifikasi tetapi guard ini tidak memvalidasi membership tenant.','TenantContext dari host terdaftar + identitas terverifikasi + membership; default deny.',base+'config/encrypts.js','decodeTokenHT:'],
['A04','P0','Identitas create ticket','Belum siap','company_id dari body didahulukan; token fallback ke 1.','Turunkan pemilik tenant di server; validasi company/creator dan semua parent.',controller+'engine/engineTicket.js','let { company_id, creator_id'],
['A05','P0','Mode lokal','Perlu hardening','LOCAL_DISABLE_AUTH dapat membuat actor/company 1.','Tolak startup production jika bypass aktif; verifikasi konfigurasi deployment.',base+'routers/hots/saasRouter.js','LOCAL_DISABLE_AUTH'],
['A06','P1','Subscription','Prototipe','Invoice dan transaksi ada; payment token/callback masih mock.','Webhook provider terverifikasi, idempotensi, lock, entitlement/quota server.',controller+'jobmarketplace/CinevaSubscriptionController.js','Mock Upgrade Plan'],
['A07','P1','Theme Cineva','Adapter statis','Scope vendor cineva dan token CSS ada; identitas vendor ditulis di source.','Branding resolver JSON terversi ke semantic tokens; default HOTS dipertahankan.','1.Frontend/HOTS/src/features/cineva-shared/CinevaVendorTheme.tsx',"root.dataset.hotsVendor = 'cineva'"],
['A08','P1','Theme JSON engine','Parsial','Loader parse theme_json tetapi lookup/cache hanya module_key.','Audit consumer aktif; pisahkan config tenant/product, namespace cache.',base+'core/loader.js','async function loadModule'],
['A09','P1','Mode warna','Statis','ThemeProvider selalu memasang light.','Renderer theme menerapkan preference yang diizinkan konfigurasi tenant.','1.Frontend/HOTS/src/components/theme-provider.tsx','root.classList.add'],
['A10','P1','Cache frontend','Belum tenant-aware','Key widget endpoint + params; identitas tidak otomatis ada.','Key tenant/product/user/permission/version dan clear pada switch/logout.','1.Frontend/HOTS/src/hooks/useWidgetData.ts','source.cacheKey ||'],
['A11','P0','File privat','Perlu klasifikasi','Public mount mencakup files dan generateddocuments tanpa guard pada mount.','Pisahkan aset brand public dari dokumen private melalui authorized download.',base+'app/registerRoutes.js',"App.use('/public', express.static"],
['A12','P1','SSE','User scoped','Koneksi SSE dikelompokkan userId saja.','Namespace tenant/user/channel; revalidasi switch/revoke dan policy broadcast.',base+'core/sse-manager.js','addConnection(userId, res)'],
['A13','P1','Transaksi config','Belum konsisten','Module admin menulis lewat query helper tanpa explicit transaction.','Gunakan transaction-kit setelah audit consumer; commit/rollback dan event setelah commit.',controller+'engine/moduleController.js',"'INSERT INTO m_engine_modules"],
['A14','P1','Overseas frontend','Multi-company','Header OV/Overseas Portal statis; nama company berasal dari session.','Product adapter Overseas memakai contract branding yang sama.','D:/Kantor/1.Frontend/overseas_base/src/components/OverseasHeader.tsx','Overseas Portal'],
['A15','P0','Overseas PAR','Company authorization','Detail memeriksa participant/company permission; role 4 memiliki jalur admin.','Pertahankan policy PAR di dalam tenant gate; admin tenant tidak boleh global lintas tenant.','D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.parts/access/can-read-par-ticket.js',"reason: 'admin'"],
['A16','P0','Schema fisik Cineva','Belum tersedia','Knowledge hanya menyediakan jobmarketplace_schema.md yang dinyatakan draft.','Minta export DDL fisik terbaru sebelum migration, FK/index/backfill dan SQL.','3.Knowledge/KNOWLEDGE_INDEX.md','Schema draft'],
['A17','P1','Logo existing','Parsial','LogoBar lama mengimpor aset Indofood langsung; belum membuktikan komponen ini aktif.','Inventaris semua consumer aktif: shell/login/favicon/email/PDF; pakai brand asset contract.','1.Frontend/HOTS/src/components/LogoBar.jsx',"logo_indofoodCBP_white.png"],
];
const evidence=[];
for(const row of findings){
  const absolute=path.isAbsolute(row[6])?row[6]:path.join(root,row[6]);
  const text=await fs.readFile(absolute,'utf8');
  const line=text.split(/\r?\n/).findIndex(l=>l.includes(row[7]))+1;
  assert(line>0,'Missing anchor '+row[0]);
  evidence.push({id:row[0],file:row[6],line,sha256:crypto.createHash('sha256').update(text).digest('hex')});
}
await fs.writeFile(path.join(out,'evidence.json'),JSON.stringify({date:'2026-10-21',scope:'Static source + isolated VM stubs. No DB/network/application imports; no live exploit proof.',findings,evidence,checks:records},null,2));
process.stdout.write('[SAAS-AUDIT][INFO] : '+JSON.stringify({findings:findings.length,isolatedChecks:records.length,databaseUsed:false})+'\n');
