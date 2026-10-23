import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

// One-time static audit. Never imports application code or opens database connections.
const cineva = path.resolve(import.meta.dirname, '..').replaceAll('\\', '/');
const kantor = 'D:/Kantor';
const backend = `${kantor}/2.Backend/Integrated-API`;
const out = `${cineva}/3.Knowledge/reports/hots_cineva_2026_10_14`;
await fs.mkdir(out, { recursive: true });
const ignored = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'public', 'data', '_old', '_archive', 'logs']);
async function walk(root, exts) {
  const files = [];
  async function scan(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (e.isDirectory() && !ignored.has(e.name)) await scan(path.join(dir, e.name));
      else if (e.isFile() && exts.includes(path.extname(e.name))) files.push(path.join(dir, e.name));
    }
  }
  await scan(root); return files.sort();
}
const hash = async p => crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');
const feOld = `${cineva}/1.Frontend/HOTS/src`, feNew = `${kantor}/1.Frontend/HOTS/src`;
const [oldFiles, newFiles] = await Promise.all([walk(feOld, ['.js','.jsx','.ts','.tsx']), walk(feNew, ['.js','.jsx','.ts','.tsx'])]);
const oldMap = new Map(oldFiles.map(p => [path.relative(feOld,p).replaceAll('\\','/'),p]));
const newMap = new Map(newFiles.map(p => [path.relative(feNew,p).replaceAll('\\','/'),p]));
const diff = [];
for (const name of [...new Set([...oldMap.keys(),...newMap.keys()])].sort()) {
  const a=oldMap.get(name), b=newMap.get(name);
  diff.push([name, !a ? 'HOTS only' : !b ? 'Cineva only' : await hash(a) === await hash(b) ? 'Identical' : 'Changed']);
}
const counts = Object.fromEntries(['Identical','Changed','HOTS only','Cineva only'].map(k => [k,diff.filter(r=>r[1]===k).length]));
const packages = [];
for (const base of [`${kantor}/1.Frontend/dynamic-form`,`${kantor}/1.Frontend/service-form-runtime`,...(await fs.readdir(`${kantor}/1.Frontend/packages`,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>`${kantor}/1.Frontend/packages/${e.name}`),`${kantor}/2.Backend/packages/transaction-kit`]) {
  const p=JSON.parse(await fs.readFile(`${base}/package.json`,'utf8'));
  packages.push([p.name,p.version,base,p.main || JSON.stringify(p.exports || {}),p.private ? 'private/local' : 'see package']);
}
const engineDiff=[];
for (const name of ['workflow-engine.js','trigger-engine.js','resource-engine.js','reporting-engine.js','document-engine.js','engine-loader.js','init-engines.js']) {
  const a=`${cineva}/2.Backend/Integrated-API/core/${name}`,b=`${backend}/app/infrastructure/engines/${name}`;
  engineDiff.push([name,await hash(a)===await hash(b)?'Identical':'Changed',a,b]);
}
const modules=[];
for(const base of [`${backend}/programs`,`${backend}/app/modules`]) {
  for(const f of await walk(base,['.json'])) {
    if(path.basename(f)!=='module.json') continue;
    const p=JSON.parse(await fs.readFile(f,'utf8'));
    modules.push([p.module||p.name,path.relative(backend,f).replaceAll('\\','/'),(p.depends_on||[]).join(', '),(p.routes||[]).map(r=>r.prefix).join(', ')]);
  }
}
const cf = s => {
  if(s.startsWith('1, fontend/'))return `${cineva}/${s.replace('1, fontend/','1.Frontend/')}`;
  if(s.startsWith('3. knowledge/'))return `${cineva}/${s.replace('3. knowledge/','3.Knowledge/')}`;
  return `${cineva}/2.Backend/Integrated-API/${s}`;
};
const hf = s => `${kantor}/${s}`;
const rows = [
 ['A01','Knowledge','P0','5 dokumen domain ditemukan pada awal audit; schema berlabel draft','Graph, manifest, FILE_MAP, registry paket, schema hots.md/json, domain docs','Tambahkan index Cineva + contract map; pisahkan draft, source-verified dan runtime-verified',cf('3. knowledge/jobmarketplace_schema.md')+'; '+hf('3.Knowledge/KNOWLEDGE_GRAPH.md'),'Verified static'],
 ['A02','Backend modules','P0','registerRoutes mengimpor agregat routers; minimal profile setelah import','Auto-discovery app/modules dan programs; module.json + depends_on + strict/disabled','Port loader/platform sebagai fondasi; programs/cineva/module.json dan adapter endpoint lama',cf('app/registerRoutes.js')+'; '+hf('2.Backend/Integrated-API/app/http/moduleLoader.js'),'Verified static'],
 ['A03','Shared packages','P0','Frontend package.json tidak mendeklarasikan @hots/*','13 paket frontend aktual termasuk dynamic-form/runtime; transaction-kit backend','Version-pin paket beserta dependencies; jangan pertahankan file: menuju D:/Kantor untuk rilis mandiri',cf('1, fontend/HOTS/package.json')+'; '+hf('3.Knowledge/packages/REGISTRY.md'),'Verified static'],
 ['A04','Form and visual editing','P1','DynamicForm/DynamicField/FieldEditor lokal; visual trigger juga tersedia','Shared dynamic-form dan service runtime; HOTS juga masih memiliki wrapper dan form lokal','Gunakan renderer/builder shared + registry widget Cineva; jangan anggap semua HOTS sudah shared',cf('1, fontend/HOTS/src/components/forms/DynamicForm.tsx')+'; '+hf('1.Frontend/dynamic-form/package.json'),'Verified static'],
 ['A05','Workflow','P1','workflow-engine dan form/workflow editor sudah ada','Engine berbeda; workflow-policy-kit + workflowGraphAdapter + focused test','Adopsi kontrak graph/policy; status marketplace melalui adapter dan config tanpa menambah approval yang tidak dibutuhkan',cf('core/workflow-engine.js')+'; '+hf('1.Frontend/HOTS/src/utils/workflowGraphAdapter.ts'),'Verified static'],
 ['A06','Triggers and documents','P1','trigger/document/reporting/resource engines sudah ada','Engine ditempatkan di infrastructure; form-engine, report-table-engine, PAR sebagai module terpisah','Reuse engine umum; trigger Cineva memakai plugin/config, bukan menyalin domain PAR',cf('core/document-engine.js')+'; '+hf('2.Backend/Integrated-API/app/infrastructure/engines/document-engine.js'),'Verified static'],
 ['A07','Marketplace domain','P0','Campaign, batch, location, talent assignment, content log, pickup, profile, applicants tersedia di routes/source','Platform HOTS adalah sumber fondasi; belum dibuktikan menyediakan padanan seluruh marketplace','Pertahankan controller/halaman marketplace sebagai domain Cineva; archive hanya sesudah pengganti lolos acceptance',cf('routers/hots/hotsJobMarketplace.js')+'; '+cf('3. knowledge/jobmarketplace_knowledge.md'),'Source present; behavior untested'],
 ['A08','Atomicity claim','P0','takeJob menangkap engine error lalu commit pickup dan kemungkinan write parsial','Standar knowledge mewajibkan transaksi + rollback seluruh write','Satu transaction boundary untuk wajib sync; bila async disepakati perlu outbox/retry dan status eksplisit',cf('controller/hots_controller/jobmarketplace/JobClaimController.js:88'),'Verified control flow'],
 ['A09','Atomicity approval','P0','approveApplicant menangkap error Kanban lalu commit dan pesan sukses tasks generated','Transaction-kit tersedia tetapi registry menyebut not wired dan DDL prerequisite','Jangan menelan failure; commit hanya jika seluruh write wajib berhasil; fault injection sebelum release',cf('controller/hots_controller/jobmarketplace/JobPICController.js:125')+'; '+hf('3.Knowledge/packages/REGISTRY.md'),'Verified control flow'],
 ['A10','Applicant-ticket identity','P0','approveApplicant dan createContentLog cari ticket lewat job_id LIMIT 1','EAV ticket_detail tetap memakai cstm_col/lbl_col/value','Kontrak hubungan pickup/applicant ke ticket harus deterministik; verifikasi schema sebelum menentukan storage',cf('controller/hots_controller/jobmarketplace/JobPICController.js:130'),'Ambiguous selector verified; live impact untested'],
 ['A11','Concurrency and idempotency','P0','takeJob tidak terlihat lock/duplicate gate; ticket ID last+1; approval tidak cek transisi requested secara kondisional','transaction-kit menyediakan konsep locks/idempotency; belum otomatis dipakai','Audit unique index/current schema; uji double pickup, quota, repeat approve dan parallel ticket numbering',cf('controller/hots_controller/jobmarketplace/JobClaimController.js:35')+'; '+cf('controller/hots_controller/jobmarketplace/JobPICController.js:114'),'Source risk; indexes unverified'],
 ['A12','Master writes','P0','createBatch/createLocation/createBrand/createCategory memakai pool.query write tanpa begin/commit/rollback','Standar knowledge transaction + rollback','Masukkan seluruh write ke scoped transaction; validasi payload dan audit pada boundary service',cf('controller/hots_controller/jobmarketplace/JobManagementController.js:378'),'Verified static'],
 ['A13','Database portability','P0','Query marketplace unqualified tetapi engine qualified hots.; service_id=19 hardcoded','Schema hots tersedia di knowledge; modul lintas program punya dependency','Putuskan isolated DB versus shared service dengan owner; tidak memakai DB kantor pada smoke test; schema Cineva fisik diperlukan',cf('controller/hots_controller/jobmarketplace/JobClaimController.js:90')+'; '+hf('3.Knowledge/schema/hots.md'),'Verified static; live topology unknown'],
 ['A14','Authorization','P0','authGuard decodeTokenHT atau LOCAL_DISABLE_AUTH; approval handler tidak menunjukkan ownership predicate','HOTS memiliki module auth/OIDC; belum membuktikan policy Cineva','Review decodeTokenHT dan role/company/PIC scope end-to-end; negative tests lintas role dan tenant',cf('routers/hots/hotsJobMarketplace.js:11')+'; '+cf('controller/hots_controller/jobmarketplace/JobPICController.js:93'),'Router/handler observed; global gate unverified'],
 ['A15','Auth baseline discrepancy','P0','KeepLogin menulis localStorage token','authToken.ts komentar memory-only tetapi setter menulis dua localStorage key','Putuskan kontrak cookie/token dan session sharing sebelum port; source lebih kuat daripada komentar',cf('1, fontend/HOTS/src/action/KeepLogin.js:15')+'; '+hf('1.Frontend/HOTS/src/lib/authToken.ts:25'),'Verified contradiction in source'],
 ['A16','SSE and logging','P1','Logger SSE sudah ada; startup/controller masih console langsung','Logger shared juga broadcast SSE; app-core menawarkan SSE client','Reuse log parser per module + business events sesudah commit; jangan klaim SSE menjamin sync DB',cf('core/logger.js')+'; '+cf('controller/hots_controller/jobmarketplace/JobPICController.js:196'),'Verified static'],
 ['A17','Uploads','P1','Multer/uploader legacy dan upload attachment','upload-engine + file-bridge-client + runtime-paths; storage local/both/bridge','Config adapter Cineva dan traceability; Bridge opsional sesuai deployment, migration additive setelah schema review',hf('3.Knowledge/domains/shared-platform/integrated_api_modularization_2026_10_12.md'),'Knowledge + source path verified'],
 ['A18','MFE host','P1','Vite base /hots, satu app tanpa federation plugin','HOTS host federation form/CTO/inventory + React dedupe dan fs.allow shared roots','Shell Cineva konsumsi paket; aktifkan remote yang dibutuhkan saja dan konfigurasi base/remote URL per environment',cf('1, fontend/HOTS/vite.config.ts')+'; '+hf('1.Frontend/HOTS/vite.config.ts'),'Verified static'],
 ['A19','Package readiness','P0','Belum ada shared package dependency','Registry: table/app-core/ui-kit/engine-client not consumed; page-engine partial; app-template candidate','Full package model berarti reuse platform dengan acceptance; bukan semua paket otomatis production-ready',hf('3.Knowledge/packages/REGISTRY.md'),'Registry claims; actual package metadata captured'],
 ['A20','Release and PM2','P1','pack_for_prod zip source; package build merujuk build.js; PM2 integrated-api/index.js','tools/build/build-secure.js; source/binary packaging; PM2 memilih executable jika ada','Rilis Cineva reproducible dengan bundle paket, env contract, health/smoke dan rollback; jangan jalankan packaging saat audit',cf('pack_for_prod.bat')+'; '+hf('2.Backend/Integrated-API/ecosystem.config.js'),'Verified static; deployment untested'],
 ['A21','Knowledge drift in HOTS','P1','Tidak ada platform index lengkap','Graph/overview masih menyebut beberapa path lama; hub punya old-current mapping; auth comment drift','Gunakan path/source aktual; import knowledge relevan dan tulis provenance/version, bukan copy semua knowledge domain',hf('3.Knowledge/KNOWLEDGE_GRAPH.md')+'; '+hf('3.Knowledge/domains/shared-platform/integrated_api_modularization_2026_10_12.md'),'Verified documentation drift'],
];
const phases=[
 ['0','Baseline dan kontrak','P0','Capture versi/hash, endpoints, role scope, form/workflow JSON, physical schema Cineva','Tidak ada perubahan aplikasi/DB; semua draft ditandai; snapshot dan rollback tersedia','Owner menetapkan topology DB/auth/upload'],
 ['1','Platform foundation','P0','Modular loader, infrastructure, config, shared package dependency, programs/cineva','Boot isolated tanpa cron/DB kantor; route lama tetap terpasang; dependency disabled/missing teruji','Phase 0'],
 ['2','Integrity marketplace','P0','Transaction semua write; mapping pickup-ticket; authorization; idempotency dan numbering','Forced failure rollback; dua applicant job sama terpisah; double approve/pickup aman; cross tenant ditolak','Physical schema + phase 1'],
 ['3','Editor dan runtime','P1','Shared dynamic-form/service runtime, table/client/UI adapters, widget registries','Edit-preview-save-reload konsisten; rule/order/value EAV kompatibel; JSON advanced only','Phase 1 + contract fixtures'],
 ['4','Workflow/upload/SSE/report','P1','Policy/trigger/document adapters; uploader; after-commit events; reporting','Campaign→pickup→PIC→Kanban→draft/revision/posting terbukti; file accessible; report sesuai EAV','Phase 2 dan 3'],
 ['5','Release dan archive','P1','Build independen, staging acceptance, PM2 smoke, deployment rollback; knowledge update','Clean install/build, runtime/browser acceptance, restore snapshot berhasil; archive legacy di knowledge','Seluruh acceptance sebelumnya'],
];
const summary=[
 ['Tanggal audit','2026-10-14 Asia/Jakarta'],
 ['Tujuan','Upgrade fondasi Cineva ke model modular/package HOTS, pertahankan domain KOL marketplace'],
 ['Kesimpulan','Cineva tertinggal pada platform integration, bukan kosong fitur. Upgrade perlu port platform + adapter domain.'],
 ['Batas verifikasi','Static source/knowledge/package/hash; tidak menjalankan app, DB, build, browser atau deployment'],
 ['Cineva FE source files',oldFiles.length],['HOTS FE source files',newFiles.length],
 ...Object.entries(counts).map(([k,v])=>[`FE relative-path ${k}`,v]),
 ['Jumlah paket aktual',packages.length],['Manifest modul aktual',modules.length],
 ['Knowledge Cineva baseline md/sql',5],
 ['Makna hash','Same relative path + SHA256 bytes; file moved/refactored tidak otomatis sama; bukan ukuran kualitas/fungsi'],
 ['Gate implementasi','Physical schema Cineva, topology/auth contract, baseline release dan acceptance domain harus disiapkan'],
];
await fs.writeFile(`${out}/audit_evidence.json`,JSON.stringify({asOf:'2026-10-14',scope:'static audit, generated/vendor/archive/public excluded',summary,findings:rows,phases,packages,modules,engineDiff,frontendDiff:diff},null,2));
const md = `# Audit HOTS Kantor → Cineva\n\nTanggal: 14 Oktober 2026 (Asia/Jakarta).\n\n## Kesimpulan dan dampak arsitektur\n\nCineva memiliki engine HOTS lama serta domain Job Marketplace yang sudah berkembang. HOTS Kantor saat ini memisahkan fondasi backend melalui app/modules, programs/module.json dan infrastructure, serta menyediakan shared package frontend. Upgrade yang direkomendasikan: adopsi fondasi platform beserta paket yang dibutuhkan, lalu tempatkan marketplace dalam modul Cineva dan adapter kontrak lama. Domain KOL tidak boleh hilang karena penggantian shell/controller secara menyeluruh.\n\nFull model paket berarti renderer, builder, API client, UI, workflow policy, upload dan transaction boundary memiliki pemilik yang jelas. Bukan semua domain kantor (CTO, SeaRates, PAR, HRIS) harus diaktifkan. Package belum consumed/partial harus melewati integration acceptance. File dependencies harus tersedia di checkout/release Cineva sendiri, tidak tergantung absolute path Kantor. Engine backend tetap service internal; transaction-kit belum otomatis menggantikan seluruh transaksi aplikasi.\n\n### Arsitektur target (usulan, belum diimplementasikan)\n\nCineva shell → shared runtime/builder/table/UI/client → API platform → programs/cineva (job/campaign/pickup/talent/content adapters) → workflow/assignment/document/trigger/upload engines → database. Field custom tetap EAV cstm_col/lbl_col/value; user_profile memakai attribute_name/value sesuai kontrak existing. Master domain tetap mengacu physical schema, tidak dipaksa semua menjadi EAV. UI editor visual menjadi jalur utama; JSON untuk advanced/import-export. Setiap write wajib transaction + rollback; log per module via SSE parser.\n\n## Bukti inventaris\n\n${summary.map(r=>`- **${r[0]}:** ${r[1]}`).join('\n')}\n\nScope hash hanya file .js/.jsx/.ts/.tsx di src kedua HOTS; excludes generated/vendor/archive. Daftar lengkap ada audit_evidence.json dan Excel sheet FE Delta. Manifest dan metadata paket diambil dari file aktual.\n\n## Temuan dan perbandingan\n\n${rows.map(r=>`### ${r[0]} — ${r[1]} (${r[2]})\n\n- Cineva: ${r[3]}\n- HOTS: ${r[4]}\n- Tindakan upgrade: ${r[5]}\n- Bukti: ${r[6]}\n- Verifikasi: ${r[7]}\n`).join('\n')}\n\n## Roadmap dan acceptance\n\n${phases.map(r=>`### Phase ${r[0]} — ${r[1]}\n\nLingkup: ${r[3]}.\n\nAcceptance: ${r[4]}.\n\nDependency: ${r[5]}.\n`).join('\n')}\n\n## Knowledge dan schema\n\nSumber utama HOTS: 3.Knowledge/KNOWLEDGE_GRAPH.md, packages/REGISTRY.md, domains/shared-platform/integrated_api_modularization_2026_10_12.md, hots_system_overview.md dan schema/hots.md. Sumber Cineva: lima dokumen jobmarketplace*.md/job_marketplace_kanban_logic.md serta actual routers/controller/src. Dokumen schema Cineva sendiri menyatakan draft; bukan bukti DDL yang deployed. Tidak ada SQL migrasi baru atau DB connection dijalankan dalam audit ini. Sebelum SQL implementasi, minta physical schema Cineva latest untuk PK/FK/index/constraint, engine table ownership dan InnoDB/cross-schema transaction compatibility.\n\n## Batas audit\n\nIni adalah baseline arsitektur dan source comparison, bukan sertifikasi seluruh fungsi. Presence routes tidak membuktikan business acceptance. Tidak menguji login provider, role gates global, DB contents, production schema, cron, Bridge, browser/editor save, race runtime, package build atau deployment. Belum dilakukan semantic diff setiap backend controller. Temuan control-flow adalah bukti kode; dampak data aktual belum diverifikasi. Tidak mengubah kode aplikasi, env, DB atau deployment. Artefak laporan dan script audit disimpan di knowledge sesuai instruksi.\n`;
await fs.writeFile(`${out}/AUDIT_HOTS_CINEVA.md`,md);
const wb=Workbook.create();
const sheets=[
 ['Ringkasan',['Ukuran / keputusan','Hasil'],summary,[44,115]],
 ['Perbandingan',['ID','Area','Prioritas','Cineva','HOTS Kantor','Arah upgrade','Bukti path/line','Verifikasi'],rows,[9,28,12,70,70,85,105,48]],
 ['Roadmap',['Phase','Target','Prioritas','Lingkup','Acceptance','Dependency'],phases,[9,32,12,90,100,50]],
 ['Paket',['Nama','Versi','Lokasi aktual','Entry','Distribusi'],packages,[33,12,100,65,20]],
 ['Modul HOTS',['Module','Manifest','Dependencies','Route prefixes'],modules,[35,80,35,100]],
 ['Engine Delta',['Engine','SHA256 comparison','Cineva','HOTS'],engineDiff,[35,25,100,110]],
 ['FE Delta',['Relative source path','SHA256 comparison'],diff,[115,26]],
];
for(const [name,headers,data,widths] of sheets){
 const s=wb.worksheets.add(name);s.showGridLines=false;
 const last=String.fromCharCode(64+headers.length),end=data.length+3;
 s.getRange('A1').values=[[`HOTS → Cineva | ${name} | 14 Oct 2026`]];
 s.getRange('A1').format.font={bold:true,size:14,color:'#153451'};
 s.getRange(`A3:${last}3`).values=[headers];
 s.getRange(`A4:${last}${end}`).values=data;
 const used=s.getRange(`A3:${last}${end}`);used.format.font={name:'Arial',size:11};used.format.wrapText=true;used.format.verticalAlignment='top';
 s.getRange(`A3:${last}3`).format.fill='#153451';s.getRange(`A3:${last}3`).format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};s.getRange(`A3:${last}3`).format.rowHeight=28;
 for(let i=0;i<widths.length;i++)s.getRange(`${String.fromCharCode(65+i)}3:${String.fromCharCode(65+i)}${end}`).format.columnWidth=widths[i];
 for(let i=0;i<data.length;i++){const r=s.getRange(`A${i+4}:${last}${i+4}`);r.format.rowHeight=['Perbandingan','Roadmap'].includes(name)?64:['Ringkasan','Modul HOTS','Paket','Engine Delta'].includes(name)?36:30;if(i%2===1)r.format.fill='#F0F5FA';}
 s.freezePanes.freezeRows(3);
}
wb.recalculate();
await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/HOTS_Cineva_Upgrade_Audit.xlsx`);
for(const [name,,data] of sheets){
 const range=name==='Perbandingan'?'A3:F7':name==='Roadmap'?'A3:E6':name==='Ringkasan'?'A1:B8':name==='Paket'?'A3:C8':name==='Modul HOTS'?'A3:D7':name==='Engine Delta'?'A3:B8':'A3:B10';
 const blob=await wb.render({sheetName:name,range,scale:1});
 await fs.writeFile(`${out}/preview_${name.replaceAll(' ','_')}.png`,new Uint8Array(await blob.arrayBuffer()));
}
console.log(JSON.stringify({out,counts,packages:packages.length,modules:modules.length,engineDiff:engineDiff.map(r=>r.slice(0,2)),summary}));
