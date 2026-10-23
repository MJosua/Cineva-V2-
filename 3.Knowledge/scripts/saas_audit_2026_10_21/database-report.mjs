import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..');
const base=path.join(root,'3.Knowledge/reports/database_saas_2026_10_21');
const out=path.join(base,'outputs/database_saas_2026_10_21');
await fs.mkdir(out,{recursive:true});
const snapshotPath='3.Knowledge/schema/hots_saas_baseline_2026_10_21.json';
const raw=await fs.readFile(path.join(root,snapshotPath),'utf8');
const {catalog:c}=JSON.parse(raw);
const checks=JSON.parse(await fs.readFile(path.join(base,'data_checks.json'),'utf8')).checks;
const col=(table,name)=>c.columns.find(r=>r.TABLE_NAME===table&&r.COLUMN_NAME===name);
const metric=key=>checks.find(r=>r.key===key).rows;
assert.equal(c.tables.length,180);assert.equal(c.columns.length,2010);
assert.equal(c.columns.filter(r=>/tenant/i.test(r.COLUMN_NAME)).length,0);
assert.equal(col('t_ticket','company_id').COLUMN_DEFAULT,'0');
assert.equal(col('t_ticket_work_data','company_id').COLUMN_DEFAULT,'1');
assert.equal(col('user_profile','id').COLUMN_KEY,'PRI');assert(!col('user_profile','profile_id'));
assert.equal(Number(metric('work_parent_sample')[0].company_mismatch),905);
const findings=[
 ['D01','P0','Tenant dan company','Belum terpisah','Tidak ada kolom bernama tenant pada 2.010 kolom; m_company berarti organisasi/country/IOD mapping.','Definisikan tenant pelanggan sebagai batas ownership; company tetap badan usaha/unit bisnis.','m_company; seluruh katalog'],
 ['D02','P0','Ownership ticket','Tidak authoritative','company_id nullable/default 0, tanpa FK company; 993/1.000 sampel bernilai 0 tanpa master.','Karantina ownership ambigu dan mapping evidence-based; jangan memetakan semua 0 ke tenant pertama.','t_ticket; ticket_ownership_sample'],
 ['D03','P0','Ownership work-data','Makna perlu klarifikasi','Default company 1; 905/1.000 sampel berbeda dari parent ticket.','Putuskan apakah company = pemilik/aktor/legacy; gunakan owning tenant yang konsisten.','t_ticket_work_data; work_company_pairs'],
 ['D04','P0','Integritas parent-child','FK belum cukup','FK work-data ke ticket hanya ticket_id; assignment_id int tanpa FK ke assignment bigint.','Jaga ownership parent + assignment pada context tenant; rancang tipe/FK setelah semantik disepakati.','t_ticket_work_data; foreign_keys'],
 ['D05','P0','Identity dan membership','Fondasi parsial','user_uuid unique tetapi nullable; user.company_id default 1; profil company-user punya unique pair.','Global user boleh dipertahankan; membership tenant/company dan peran aktif harus terpisah.','user; m_company_user_profile'],
 ['D06','P0','Role dan permission','Scope ambigu','user.role_id global; permission memiliki company/module namun unique tidak memasukkan module_key.','Pisahkan platform admin dari tenant admin; tetapkan namespace permission dan role scoped.','user; user_permission'],
 ['D07','P1','Akses program','Dua representasi','user_t_program_access ada tanpa unique user/company/program; sampel kosong; OIDC membaca sso_program_access JSON.','Pilih satu sumber akses program/membership authoritative; migrasikan kompatibilitas tanpa grant implisit.','user_t_program_access; oidc/accountStore.js'],
 ['D08','P1','Identitas eksternal','Fondasi baik','Mapping external memiliki unique program/subject/company/user dan FK user_uuid/program.','Pertahankan; bedakan external_company_id dari tenant internal; petakan issuer/realm bila multi-provider.','user_t_program_identity'],
 ['D09','P0','Profil talent','Global per user','user_profile unique user_id/attribute_name tanpa scope company/product.','Pisahkan atribut identitas global dari NDA/rating/status/fee privat tenant; jangan overwrite lintas pelanggan.','user_profile; jobmarketplace_schema.md'],
 ['D10','P1','Preference user','Global per user','Unique user/category/key tanpa company/product.','Preferensi global hanya jika sengaja; workspace layout/filter/brand override harus scoped.','user_preferences'],
 ['D11','P0','Service dan workflow','Definisi global','m_service dan m_service_workflow tidak memiliki company; workflow primary key service_id.','Default shared immutable/versioned + binding/override tenant; jangan edit default untuk satu pelanggan.','m_service; m_service_workflow'],
 ['D12','P1','Brand config','Belum kontrak lengkap','m_company.logo_url tersedia; config_value TEXT, company nullable, unique company/key; 2/11 value valid JSON.','Tetapkan scope default/tenant/product/company, revision/publish/history; TEXT non-JSON existing bukan otomatis rusak.','m_company; m_company_configuration'],
 ['D13','P1','Namespace bisnis','Perlu pilihan eksplisit','cms_m_page.slug unique global meski ada company; uid juga unique global.','Putuskan global identity vs slug lokal tenant/product; jangan ubah semua unique key secara massal.','cms_m_page; user'],
 ['D14','P1','Kapasitas identifier','Tidak seragam','ticket_id varchar36, root varchar32, parent/child varchar50; assignment bigint vs work-data int.','Standarkan contract opaque ID/string dan kapasitas root; panjang string berbeda bukan bukti FK invalid.','t_ticket; t_ticket_work_data'],
 ['D15','P0','File dan dokumen','Owner belum seragam','Generic file/document mengacu entity_type/entity_id; sebagian tanpa FK/tenant dan nullable ticket.','Asset/file/document harus punya root ownership; temporary upload terikat context; cek otorisasi download.','file_t_upload; t_document; t_ticket_file'],
 ['D16','P1','Event, outbox dan notifikasi','Scope belum eksplisit','trigger_outbox idempotency_key unique global nullable; user_notification hanya user_id.','Idempotency namespace tenant/operation; event context dan subscriber mengikuti tenant aktif.','trigger_outbox; user_notification'],
 ['D17','P1','Fitur dan subscription','Belum model SaaS lengkap','m_company_feature punya company/service/config tetapi tanpa unique pair; plan/subscription/invoice SaaS tidak ada pada baseline ini.','Pisahkan entitlement produk, membership pengguna, subscription/invoice dan pembayaran; jangan menganggap license_expiry cukup.','m_company_feature; m_company; tables'],
 ['D18','P1','Index tenant query','Perlu desain workload','Ticket mempunyai index company dan service/date terpisah; belum tenant key.','Setelah ownership final, rancang composite index dari query nyata; EXPLAIN sebelum klaim optimasi.','t_ticket indexes'],
 ['D19','P0','Compatibility Cineva','Belum cocok langsung','Controller TalentProfile memakai profile_id; baseline user_profile memakai id. Job/billing marketplace tidak ada di baseline.','Buat adapter/mapping dan migrasi additive; engine shared tidak menggantikan aggregate domain marketplace.','TalentProfileController.js:106; schema'],
 ['D20','P0','Relasi job-ticket','Ambigu di source','Cineva mencari job_id pada EAV LIMIT 1 tanpa owner/user deterministik.','Tetapkan cardinality application/job/ticket dan relasi eksplisit tenant-scoped; EAV dipertahankan untuk form.','JobPICController.js:130'],
];
const evidence={date:'2026-10-21',database:'hots',server_version:'8.0.20',schemaSource:snapshotPath,sha256:crypto.createHash('sha256').update(raw).digest('hex'),tableCount:c.tables.length,baseTableCount:c.tables.filter(r=>r.TABLE_TYPE==='BASE TABLE').length,columnCount:c.columns.length,indexParts:c.indexes.length,declaredForeignKeys:new Set(c.foreign_keys.map(r=>r.TABLE_NAME+'.'+r.CONSTRAINT_NAME)).size,findings};
await fs.writeFile(path.join(base,'audit_findings.json'),JSON.stringify(evidence,null,2));
const mapping=[
 ['Tenant pelanggan','Belum eksplisit','Boundary ownership dan lifecycle SaaS.'],
 ['Company','m_company','Legal entity/unit dalam tenant; bukan nama produk.'],
 ['Product/program','m_company_program_list','Catalog program global; namanya tidak berarti company membership.'],
 ['User identity','user + user_t_program_identity','Global identity dan mapping eksternal dipertahankan.'],
 ['Membership/role','m_company_user_profile / permission / program access','Pisahkan membership tenant, company, peran dan akses program authoritative.'],
 ['Job/campaign','Belum ada pada baseline HOTS','Aggregate marketplace; tambah adapter domain tanpa menghapus EAV.'],
 ['Ticket/workflow','t_ticket + detail/event/work-data','Workflow container dengan ownership parent yang tervalidasi.'],
 ['Talent assignment','Belum ada pada baseline HOTS','Relasi job/batch/location/talent; berbeda dari task assignment engine.'],
 ['Talent private data','user_profile global tidak cukup','NDA, harga, rating, status tenant lokal; consent untuk sharing.'],
 ['Brand application','logo_url + company configuration','Terpisah dari brand campaign/client; config JSON/version/asset ownership.'],
 ['Subscription entitlement','company_feature baru fondasi','Hak fitur tenant/product berbeda dari izin user dan pembayaran talent.'],
 ['File/document/event','Root ownership perlu eksplisit','Scope asset, temporary upload, outbox, notification dan retention.'],
];
const sampleRows=[
 ['Ticket company 0',Number(metric('ticket_ownership_sample')[0].zero_company),1000,'Primary key DESC; bukan urutan tanggal.'],
 ['Ticket tanpa master company cocok',Number(metric('ticket_ownership_sample')[0].missing_company),1000,'Termasuk company 0; bukan jumlah seluruh tabel.'],
 ['Work-data beda company parent',Number(metric('work_parent_sample')[0].company_mismatch),1000,'Work-data ID terbesar.'],
 ['Work company 1 / parent company 0',827,1000,'Dari pengelompokan company pada sampel work-data.'],
 ['Work company 1 / parent company 1',95,1000,'Dari pengelompokan company pada sampel work-data.'],
 ['Work company 1 / parent company 2',78,1000,'Dari pengelompokan company pada sampel work-data.'],
 ['Work-data tanpa parent ticket',Number(metric('work_parent_sample')[0].missing_ticket),1000,'Sample work-data, bukan full-table check.'],
 ['Assignment sentinel 0',Number(metric('assignment_sentinels')[0].assignment_zero),1000,'Tidak ditafsirkan sebagai assignment positif terhapus.'],
 ['Assignment positif tidak ditemukan',Number(metric('assignment_sentinels')[0].missing_positive_assignment),1000,'Sample work-data, bukan full-table check.'],
 ['Parent ticket beda company',Number(metric('ticket_parent_sample')[0].parent_company_mismatch),1000,'Sample ticket primary key DESC.'],
 ['User UUID null',Number(metric('user_company_sample')[0].null_uuid),Number(metric('user_company_sample')[0].sample_rows),'Batas query 1.000; hasil 258 user.'],
 ['Company config valid JSON',Number(metric('config_scope_sample')[0].json_valid_values),Number(metric('config_scope_sample')[0].sample_rows),'Value lain dapat berupa plain text yang sah.'],
 ['Company config NULL company',Number(metric('config_scope_sample')[0].null_company),11,'Risiko unique NULL struktural; tidak ditemukan di sampel.'],
 ['Grup akses program terbaca',Number(metric('program_access_sample')[0].sampled_groups),'n.a.','Query sampai 2.000 row menghasilkan 0 grup; duplikasi tidak dinilai.'],
];
const defs=[
 ['Ringkasan',['Area','Hasil','Makna'],[
  ['Kesimpulan','Belum siap SaaS','Fondasi multi-company tersedia; ownership tenant belum authoritative.'],
  ['Baseline','HOTS MySQL 8.0.20','Disepakati pengguna sebagai target penyesuaian Cineva.'],
  ['Metadata','180 tabel/view, 2.010 kolom','176 base table InnoDB, 4 views; 59 declared FK.'],
  ['Ticket sample','993 dari 1.000 company 0','Sampel primary key DESC; bukan urutan waktu dan bukan seluruh data.'],
  ['Work-data sample','905 dari 1.000 beda company parent','827 parent company 0; 78 parent company 2; work company 1.'],
  ['Batas','Audit read-only','Tidak repair, migration, edit aplikasi atau Kantor; tanpa klaim insiden.'],
 ],[26,43,95]],
 ['Temuan',['ID','Prioritas','Area','Status','Bukti','Tindakan','', 'Sumber'],findings.map(r=>[...r.slice(0,6),'',r[6]]),[9,11,27,26,71,76,3,68]],
 ['Semantik',['Konsep','Existing','Arah target'],mapping,[28,59,88]],
 ['Sampel',['Pemeriksaan','Jumlah','Populasi sampel','Batas'],sampleRows,[48,16,20,85]],
];
const w=Workbook.create();
for(const[name,headers,rows,widths]of defs){
 const s=w.worksheets.add(name),last=String.fromCharCode(64+headers.length),end=rows.length+5;
 s.showGridLines=false;s.getRange('A2').values=[['Audit database dan semantik SaaS']];
 s.getRange('A2').format.font={name:'Arial',size:14,bold:true,color:'#483326'};
 s.getRange('A3').values=[['21 Oktober 2026. Baseline fisik HOTS; Cineva akan disesuaikan.']];
 s.getRange('A3').format.font={name:'Arial',size:10,italic:true};
 s.getRange(`A5:${last}5`).values=[headers];s.getRange(`A6:${last}${end}`).values=rows;
 s.getRange(`A5:${last}${end}`).format.font={name:'Arial',size:10};
 s.getRange(`A5:${last}${end}`).format.wrapText=true;s.getRange(`A5:${last}${end}`).format.verticalAlignment='top';
 s.getRange(`A5:${last}5`).format.fill='#483326';
 s.getRange(`A5:${last}5`).format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
 s.getRange(`A5:${last}5`).format.horizontalAlignment='center';s.getRange(`A5:${last}5`).format.rowHeight=26;
 widths.forEach((width,i)=>s.getRange(`${String.fromCharCode(65+i)}5:${String.fromCharCode(65+i)}${end}`).format.columnWidth=width);
 for(let i=6;i<=end;i++){s.getRange(`A${i}:${last}${i}`).format.rowHeight=name==='Temuan'?44:name==='Sampel'?50:34;if(i%2===0)s.getRange(`A${i}:${last}${i}`).format.fill='#F5F0E7';}
 if(name==='Temuan')s.getRange(`G5:G${end}`).format.fill='#FFFFFF';
 if(name==='Sampel'){s.getRange(`B6:C${end}`).format.horizontalAlignment='right';s.getRange(`B6:C${end}`).numberFormat='#,##0';}
 if(name!=='Ringkasan')s.freezePanes.freezeRows(5);
}
w.recalculate();
await fs.writeFile(path.join(base,'workbook_inspection.ndjson'),(await w.inspect({kind:'sheet',include:'id,name',maxChars:1500})).ndjson);
await(await SpreadsheetFile.exportXlsx(w)).save(path.join(out,'Database_SaaS_Audit.xlsx'));
for(const[name,,rows]of defs){
 const ranges=name==='Temuan'?['A5:F15','A16:F25','H5:H15','H16:H25']:[`A2:${name==='Sampel'?'D':'C'}${rows.length+5}`];
 for(let i=0;i<ranges.length;i++){const blob=await w.render({sheetName:name,range:ranges[i],scale:1});await fs.writeFile(path.join(base,`preview_${name}_${i}.png`),new Uint8Array(await blob.arrayBuffer()));}
}
process.stdout.write('[DATABASE-SAAS][INFO] : '+JSON.stringify({findings:findings.length,aggregateQueries:checks.length,sheets:4,databaseWrites:0})+'\n');
