import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),base=path.join(root,'3.Knowledge/reports/tenant_foundation_2026_10_21');
const read=async name=>JSON.parse(await fs.readFile(path.join(base,name),'utf8'));
const [checks,browser,live,migration,hierarchy,grants,types,release]=await Promise.all(['checks.json','browser.json','live-pilot.json','migration.json','migration-hierarchy.json','pilot-grants.json','types.json','release.json'].map(read));
assert.equal(checks.failed,0);assert(live.success&&live.rollbackVerified&&migration.success&&hierarchy.success&&grants.success);assert.equal(types.featureDiagnostics.length,0);
const tables=[...migration.tables,...hierarchy.tables];
await fs.writeFile(path.join(root,'3.Knowledge/schema/hots_saas_additions_2026_10_21.json'),JSON.stringify({date:'2026-10-21',database:'hots',authority:'Physical SHOW CREATE TABLE captured after authorized additive migration, verified against MCP target',base:'hots_saas_baseline_2026_10_21.json',tables:tables.map(t=>({table:t.table,ddl:t.ddl}))},null,2));
const rows=[
 ['Database','Diterapkan: 4 tabel tambahan','migration.json; migration-hierarchy.json. Existing business rows tidak diubah/dihapus.'],
 ['Program HOTS','103 / hots-web','Existing; origin www.indofoodinternational.com.'],
 ['Program Overseas',`${grants.overseas_program_id} / hots-overseas`,'Baru; SSO disabled dan belum ada client registration.'],
 ['Company hierarchy','Indofood -> IndoUSA, IndoCanada, IndoVietnam','Relasi eksplisit sesuai konfirmasi pengguna.'],
 ['Kevin Excom','Root Indofood + turunan, program 103 dan 108','Grant hanya brand.read/resources.read. Tidak memberi write/admin/Cineva access.'],
 ['Yosua admin','Akun existing terverifikasi; tidak diberi grant baru','Global role tidak otomatis menjadi hak lintas program/company.'],
 ['Persistence','Session/context/login: hash, expiry, soft revoke','createPersistentTenantRuntime; transaksi + rollback; raw opaque keys tidak disimpan.'],
 ['Ticket pilot','Scoped list/detail + ownership join','Ticket existing belum dibackfill; route bisnis lama belum dimigrasi.'],
 ['Frontend','HOTS ticket list mengikuti company aktif','Scoped client; response company lama ditolak; konfigurasi API mount/CSRF per aplikasi.'],
 ['Package + HTTP',`${checks.passed} lulus`,'checks.json; source/package dan HTTP lokal, bukan production identity.'],
 ['Browser',`${browser.checks.length} lulus`,'browser.json; production build + API fixture, screenshot diperiksa.'],
 ['MySQL nyata',`${live.checks.length} lulus; rollback terverifikasi`,'live-pilot.json; grant nyata dibaca, ticket/session uji tidak menyisakan row commit.'],
 ['TypeScript',`Fitur: 0; full app: ${types.totalDiagnostics}`,'types.json; seluruh aplikasi belum bersih.'],
 ['Release',`${release.exports.length} export bundle ter-load`,'release.json; bundle fitur, bukan deployment penuh HOTS.'],
 ['SSH backend 105','Process root aktif berbeda dari source lokal','production-backend-redacted.json; modul/dependency OIDC tidak ditemukan pada root yang diperiksa.'],
 ['SSH frontend 104','Proxy fondasi baru belum terpasang','production-frontend-routes.json; pemeriksaan read-only, tidak ada restart/deploy.'],
 ['SSO live','Belum terverifikasi / belum diaktifkan','Registrasi DB tidak membuktikan provider production aktif. Issuer/JWKS/callback perlu rollout bertahap.'],
 ['Aktivasi berikutnya','Provider SSO, runtime, proxy, mapping ticket','Rincian: architecture/saas_pilot_activation_2026_10_21.md. Tidak mengganti production lama otomatis.'],
];
const w=Workbook.create(),s=w.worksheets.add('Aktivasi SaaS');s.showGridLines=false;
s.getRange('A2').values=[['Pilot SaaS HOTS dan Overseas']];s.getRange('A2').format.font={name:'Arial',size:15,bold:true,color:'#483326'};
s.getRange('A3').values=[['21 Oktober 2026 | Database additive diterapkan; production SSO belum aktif']];s.getRange('A3').format.font={name:'Arial',size:10};
s.getRange('A5:C5').values=[['Area','Status','Bukti dan batas']];s.getRange(`A6:C${rows.length+5}`).values=rows;
const range=s.getRange(`A5:C${rows.length+5}`);range.format.font={name:'Arial',size:10};range.format.wrapText=true;range.format.verticalAlignment='top';
s.getRange('A5:C5').format.fill='#483326';s.getRange('A5:C5').format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};s.getRange('A5:C5').format.horizontalAlignment='center';s.getRange('A5:C5').format.rowHeight=26;
[26,65,100].forEach((v,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${rows.length+5}`).format.columnWidth=v);
for(let i=6;i<=rows.length+5;i++){s.getRange(`A${i}:C${i}`).format.rowHeight=38;if(i%2===0)s.getRange(`A${i}:C${i}`).format.fill='#F5F0E7';}
s.freezePanes.freezeRows(5);w.recalculate();
const out=path.join(base,'outputs/saas_pilot_activation_2026_10_21');await fs.mkdir(out,{recursive:true});await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'SaaS_Pilot_Activation.xlsx'));
const preview=await w.render({sheetName:'Aktivasi SaaS',range:`A2:C${rows.length+5}`,scale:1});await fs.writeFile(path.join(base,'preview_SaaS_Activation.png'),new Uint8Array(await preview.arrayBuffer()));
await fs.writeFile(path.join(base,'activation_workbook_inspection.ndjson'),(await w.inspect({kind:'sheet',include:'id,name',maxChars:1500})).ndjson);
process.stdout.write('[TENANT-REPORT][INFO] : activation workbook exported and rendered\n');
