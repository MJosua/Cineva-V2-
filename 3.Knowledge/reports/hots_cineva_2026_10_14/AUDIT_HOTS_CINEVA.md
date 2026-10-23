# Audit HOTS Kantor → Cineva

Tanggal: 14 Oktober 2026 (Asia/Jakarta).

## Kesimpulan dan dampak arsitektur

Cineva memiliki engine HOTS lama serta domain Job Marketplace yang sudah berkembang. HOTS Kantor saat ini memisahkan fondasi backend melalui app/modules, programs/module.json dan infrastructure, serta menyediakan shared package frontend. Upgrade yang direkomendasikan: adopsi fondasi platform beserta paket yang dibutuhkan, lalu tempatkan marketplace dalam modul Cineva dan adapter kontrak lama. Domain KOL tidak boleh hilang karena penggantian shell/controller secara menyeluruh.

Full model paket berarti renderer, builder, API client, UI, workflow policy, upload dan transaction boundary memiliki pemilik yang jelas. Bukan semua domain kantor (CTO, SeaRates, PAR, HRIS) harus diaktifkan. Package belum consumed/partial harus melewati integration acceptance. File dependencies harus tersedia di checkout/release Cineva sendiri, tidak tergantung absolute path Kantor. Engine backend tetap service internal; transaction-kit belum otomatis menggantikan seluruh transaksi aplikasi.

### Arsitektur target (usulan, belum diimplementasikan)

Cineva shell → shared runtime/builder/table/UI/client → API platform → programs/cineva (job/campaign/pickup/talent/content adapters) → workflow/assignment/document/trigger/upload engines → database. Field custom tetap EAV cstm_col/lbl_col/value; user_profile memakai attribute_name/value sesuai kontrak existing. Master domain tetap mengacu physical schema, tidak dipaksa semua menjadi EAV. UI editor visual menjadi jalur utama; JSON untuk advanced/import-export. Setiap write wajib transaction + rollback; log per module via SSE parser.

## Bukti inventaris

- **Tanggal audit:** 2026-10-14 Asia/Jakarta
- **Tujuan:** Upgrade fondasi Cineva ke model modular/package HOTS, pertahankan domain KOL marketplace
- **Kesimpulan:** Cineva tertinggal pada platform integration, bukan kosong fitur. Upgrade perlu port platform + adapter domain.
- **Batas verifikasi:** Static source/knowledge/package/hash; tidak menjalankan app, DB, build, browser atau deployment
- **Cineva FE source files:** 473
- **HOTS FE source files:** 582
- **FE relative-path Identical:** 227
- **FE relative-path Changed:** 207
- **FE relative-path HOTS only:** 148
- **FE relative-path Cineva only:** 39
- **Jumlah paket aktual:** 14
- **Manifest modul aktual:** 24
- **Knowledge Cineva baseline md/sql:** 5
- **Makna hash:** Same relative path + SHA256 bytes; file moved/refactored tidak otomatis sama; bukan ukuran kualitas/fungsi
- **Gate implementasi:** Physical schema Cineva, topology/auth contract, baseline release dan acceptance domain harus disiapkan

Scope hash hanya file .js/.jsx/.ts/.tsx di src kedua HOTS; excludes generated/vendor/archive. Daftar lengkap ada audit_evidence.json dan Excel sheet FE Delta. Manifest dan metadata paket diambil dari file aktual.

## Temuan dan perbandingan

### A01 — Knowledge (P0)

- Cineva: 5 dokumen domain ditemukan pada awal audit; schema berlabel draft
- HOTS: Graph, manifest, FILE_MAP, registry paket, schema hots.md/json, domain docs
- Tindakan upgrade: Tambahkan index Cineva + contract map; pisahkan draft, source-verified dan runtime-verified
- Bukti: D:/Project/Cineva-V2-/3. knowledge/jobmarketplace_schema.md; D:/Kantor/3.Knowledge/KNOWLEDGE_GRAPH.md
- Verifikasi: Verified static

### A02 — Backend modules (P0)

- Cineva: registerRoutes mengimpor agregat routers; minimal profile setelah import
- HOTS: Auto-discovery app/modules dan programs; module.json + depends_on + strict/disabled
- Tindakan upgrade: Port loader/platform sebagai fondasi; programs/cineva/module.json dan adapter endpoint lama
- Bukti: D:/Project/Cineva-V2-/app/registerRoutes.js; D:/Kantor/2.Backend/Integrated-API/app/http/moduleLoader.js
- Verifikasi: Verified static

### A03 — Shared packages (P0)

- Cineva: Frontend package.json tidak mendeklarasikan @hots/*
- HOTS: 13 paket frontend aktual termasuk dynamic-form/runtime; transaction-kit backend
- Tindakan upgrade: Version-pin paket beserta dependencies; jangan pertahankan file: menuju D:/Kantor untuk rilis mandiri
- Bukti: D:/Project/Cineva-V2-/1, fontend/HOTS/package.json; D:/Kantor/3.Knowledge/packages/REGISTRY.md
- Verifikasi: Verified static

### A04 — Form and visual editing (P1)

- Cineva: DynamicForm/DynamicField/FieldEditor lokal; visual trigger juga tersedia
- HOTS: Shared dynamic-form dan service runtime; HOTS juga masih memiliki wrapper dan form lokal
- Tindakan upgrade: Gunakan renderer/builder shared + registry widget Cineva; jangan anggap semua HOTS sudah shared
- Bukti: D:/Project/Cineva-V2-/1, fontend/HOTS/src/components/forms/DynamicForm.tsx; D:/Kantor/1.Frontend/dynamic-form/package.json
- Verifikasi: Verified static

### A05 — Workflow (P1)

- Cineva: workflow-engine dan form/workflow editor sudah ada
- HOTS: Engine berbeda; workflow-policy-kit + workflowGraphAdapter + focused test
- Tindakan upgrade: Adopsi kontrak graph/policy; status marketplace melalui adapter dan config tanpa menambah approval yang tidak dibutuhkan
- Bukti: D:/Project/Cineva-V2-/core/workflow-engine.js; D:/Kantor/1.Frontend/HOTS/src/utils/workflowGraphAdapter.ts
- Verifikasi: Verified static

### A06 — Triggers and documents (P1)

- Cineva: trigger/document/reporting/resource engines sudah ada
- HOTS: Engine ditempatkan di infrastructure; form-engine, report-table-engine, PAR sebagai module terpisah
- Tindakan upgrade: Reuse engine umum; trigger Cineva memakai plugin/config, bukan menyalin domain PAR
- Bukti: D:/Project/Cineva-V2-/core/document-engine.js; D:/Kantor/2.Backend/Integrated-API/app/infrastructure/engines/document-engine.js
- Verifikasi: Verified static

### A07 — Marketplace domain (P0)

- Cineva: Campaign, batch, location, talent assignment, content log, pickup, profile, applicants tersedia di routes/source
- HOTS: Platform HOTS adalah sumber fondasi; belum dibuktikan menyediakan padanan seluruh marketplace
- Tindakan upgrade: Pertahankan controller/halaman marketplace sebagai domain Cineva; archive hanya sesudah pengganti lolos acceptance
- Bukti: D:/Project/Cineva-V2-/routers/hots/hotsJobMarketplace.js; D:/Project/Cineva-V2-/3. knowledge/jobmarketplace_knowledge.md
- Verifikasi: Source present; behavior untested

### A08 — Atomicity claim (P0)

- Cineva: takeJob menangkap engine error lalu commit pickup dan kemungkinan write parsial
- HOTS: Standar knowledge mewajibkan transaksi + rollback seluruh write
- Tindakan upgrade: Satu transaction boundary untuk wajib sync; bila async disepakati perlu outbox/retry dan status eksplisit
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobClaimController.js:88
- Verifikasi: Verified control flow

### A09 — Atomicity approval (P0)

- Cineva: approveApplicant menangkap error Kanban lalu commit dan pesan sukses tasks generated
- HOTS: Transaction-kit tersedia tetapi registry menyebut not wired dan DDL prerequisite
- Tindakan upgrade: Jangan menelan failure; commit hanya jika seluruh write wajib berhasil; fault injection sebelum release
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobPICController.js:125; D:/Kantor/3.Knowledge/packages/REGISTRY.md
- Verifikasi: Verified control flow

### A10 — Applicant-ticket identity (P0)

- Cineva: approveApplicant dan createContentLog cari ticket lewat job_id LIMIT 1
- HOTS: EAV ticket_detail tetap memakai cstm_col/lbl_col/value
- Tindakan upgrade: Kontrak hubungan pickup/applicant ke ticket harus deterministik; verifikasi schema sebelum menentukan storage
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobPICController.js:130
- Verifikasi: Ambiguous selector verified; live impact untested

### A11 — Concurrency and idempotency (P0)

- Cineva: takeJob tidak terlihat lock/duplicate gate; ticket ID last+1; approval tidak cek transisi requested secara kondisional
- HOTS: transaction-kit menyediakan konsep locks/idempotency; belum otomatis dipakai
- Tindakan upgrade: Audit unique index/current schema; uji double pickup, quota, repeat approve dan parallel ticket numbering
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobClaimController.js:35; D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobPICController.js:114
- Verifikasi: Source risk; indexes unverified

### A12 — Master writes (P0)

- Cineva: createBatch/createLocation/createBrand/createCategory memakai pool.query write tanpa begin/commit/rollback
- HOTS: Standar knowledge transaction + rollback
- Tindakan upgrade: Masukkan seluruh write ke scoped transaction; validasi payload dan audit pada boundary service
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobManagementController.js:378
- Verifikasi: Verified static

### A13 — Database portability (P0)

- Cineva: Query marketplace unqualified tetapi engine qualified hots.; service_id=19 hardcoded
- HOTS: Schema hots tersedia di knowledge; modul lintas program punya dependency
- Tindakan upgrade: Putuskan isolated DB versus shared service dengan owner; tidak memakai DB kantor pada smoke test; schema Cineva fisik diperlukan
- Bukti: D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobClaimController.js:90; D:/Kantor/3.Knowledge/schema/hots.md
- Verifikasi: Verified static; live topology unknown

### A14 — Authorization (P0)

- Cineva: authGuard decodeTokenHT atau LOCAL_DISABLE_AUTH; approval handler tidak menunjukkan ownership predicate
- HOTS: HOTS memiliki module auth/OIDC; belum membuktikan policy Cineva
- Tindakan upgrade: Review decodeTokenHT dan role/company/PIC scope end-to-end; negative tests lintas role dan tenant
- Bukti: D:/Project/Cineva-V2-/routers/hots/hotsJobMarketplace.js:11; D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobPICController.js:93
- Verifikasi: Router/handler observed; global gate unverified

### A15 — Auth baseline discrepancy (P0)

- Cineva: KeepLogin menulis localStorage token
- HOTS: authToken.ts komentar memory-only tetapi setter menulis dua localStorage key
- Tindakan upgrade: Putuskan kontrak cookie/token dan session sharing sebelum port; source lebih kuat daripada komentar
- Bukti: D:/Project/Cineva-V2-/1, fontend/HOTS/src/action/KeepLogin.js:15; D:/Kantor/1.Frontend/HOTS/src/lib/authToken.ts:25
- Verifikasi: Verified contradiction in source

### A16 — SSE and logging (P1)

- Cineva: Logger SSE sudah ada; startup/controller masih console langsung
- HOTS: Logger shared juga broadcast SSE; app-core menawarkan SSE client
- Tindakan upgrade: Reuse log parser per module + business events sesudah commit; jangan klaim SSE menjamin sync DB
- Bukti: D:/Project/Cineva-V2-/core/logger.js; D:/Project/Cineva-V2-/controller/hots_controller/jobmarketplace/JobPICController.js:196
- Verifikasi: Verified static

### A17 — Uploads (P1)

- Cineva: Multer/uploader legacy dan upload attachment
- HOTS: upload-engine + file-bridge-client + runtime-paths; storage local/both/bridge
- Tindakan upgrade: Config adapter Cineva dan traceability; Bridge opsional sesuai deployment, migration additive setelah schema review
- Bukti: D:/Kantor/3.Knowledge/domains/shared-platform/integrated_api_modularization_2026_10_12.md
- Verifikasi: Knowledge + source path verified

### A18 — MFE host (P1)

- Cineva: Vite base /hots, satu app tanpa federation plugin
- HOTS: HOTS host federation form/CTO/inventory + React dedupe dan fs.allow shared roots
- Tindakan upgrade: Shell Cineva konsumsi paket; aktifkan remote yang dibutuhkan saja dan konfigurasi base/remote URL per environment
- Bukti: D:/Project/Cineva-V2-/1, fontend/HOTS/vite.config.ts; D:/Kantor/1.Frontend/HOTS/vite.config.ts
- Verifikasi: Verified static

### A19 — Package readiness (P0)

- Cineva: Belum ada shared package dependency
- HOTS: Registry: table/app-core/ui-kit/engine-client not consumed; page-engine partial; app-template candidate
- Tindakan upgrade: Full package model berarti reuse platform dengan acceptance; bukan semua paket otomatis production-ready
- Bukti: D:/Kantor/3.Knowledge/packages/REGISTRY.md
- Verifikasi: Registry claims; actual package metadata captured

### A20 — Release and PM2 (P1)

- Cineva: pack_for_prod zip source; package build merujuk build.js; PM2 integrated-api/index.js
- HOTS: tools/build/build-secure.js; source/binary packaging; PM2 memilih executable jika ada
- Tindakan upgrade: Rilis Cineva reproducible dengan bundle paket, env contract, health/smoke dan rollback; jangan jalankan packaging saat audit
- Bukti: D:/Project/Cineva-V2-/pack_for_prod.bat; D:/Kantor/2.Backend/Integrated-API/ecosystem.config.js
- Verifikasi: Verified static; deployment untested

### A21 — Knowledge drift in HOTS (P1)

- Cineva: Tidak ada platform index lengkap
- HOTS: Graph/overview masih menyebut beberapa path lama; hub punya old-current mapping; auth comment drift
- Tindakan upgrade: Gunakan path/source aktual; import knowledge relevan dan tulis provenance/version, bukan copy semua knowledge domain
- Bukti: D:/Kantor/3.Knowledge/KNOWLEDGE_GRAPH.md; D:/Kantor/3.Knowledge/domains/shared-platform/integrated_api_modularization_2026_10_12.md
- Verifikasi: Verified documentation drift


## Roadmap dan acceptance

### Phase 0 — Baseline dan kontrak

Lingkup: Capture versi/hash, endpoints, role scope, form/workflow JSON, physical schema Cineva.

Acceptance: Tidak ada perubahan aplikasi/DB; semua draft ditandai; snapshot dan rollback tersedia.

Dependency: Owner menetapkan topology DB/auth/upload.

### Phase 1 — Platform foundation

Lingkup: Modular loader, infrastructure, config, shared package dependency, programs/cineva.

Acceptance: Boot isolated tanpa cron/DB kantor; route lama tetap terpasang; dependency disabled/missing teruji.

Dependency: Phase 0.

### Phase 2 — Integrity marketplace

Lingkup: Transaction semua write; mapping pickup-ticket; authorization; idempotency dan numbering.

Acceptance: Forced failure rollback; dua applicant job sama terpisah; double approve/pickup aman; cross tenant ditolak.

Dependency: Physical schema + phase 1.

### Phase 3 — Editor dan runtime

Lingkup: Shared dynamic-form/service runtime, table/client/UI adapters, widget registries.

Acceptance: Edit-preview-save-reload konsisten; rule/order/value EAV kompatibel; JSON advanced only.

Dependency: Phase 1 + contract fixtures.

### Phase 4 — Workflow/upload/SSE/report

Lingkup: Policy/trigger/document adapters; uploader; after-commit events; reporting.

Acceptance: Campaign→pickup→PIC→Kanban→draft/revision/posting terbukti; file accessible; report sesuai EAV.

Dependency: Phase 2 dan 3.

### Phase 5 — Release dan archive

Lingkup: Build independen, staging acceptance, PM2 smoke, deployment rollback; knowledge update.

Acceptance: Clean install/build, runtime/browser acceptance, restore snapshot berhasil; archive legacy di knowledge.

Dependency: Seluruh acceptance sebelumnya.


## Knowledge dan schema

Sumber utama HOTS: 3.Knowledge/KNOWLEDGE_GRAPH.md, packages/REGISTRY.md, domains/shared-platform/integrated_api_modularization_2026_10_12.md, hots_system_overview.md dan schema/hots.md. Sumber Cineva: lima dokumen jobmarketplace*.md/job_marketplace_kanban_logic.md serta actual routers/controller/src. Dokumen schema Cineva sendiri menyatakan draft; bukan bukti DDL yang deployed. Tidak ada SQL migrasi baru atau DB connection dijalankan dalam audit ini. Sebelum SQL implementasi, minta physical schema Cineva latest untuk PK/FK/index/constraint, engine table ownership dan InnoDB/cross-schema transaction compatibility.

## Batas audit

Ini adalah baseline arsitektur dan source comparison, bukan sertifikasi seluruh fungsi. Presence routes tidak membuktikan business acceptance. Tidak menguji login provider, role gates global, DB contents, production schema, cron, Bridge, browser/editor save, race runtime, package build atau deployment. Belum dilakukan semantic diff setiap backend controller. Temuan control-flow adalah bukti kode; dampak data aktual belum diverifikasi. Tidak mengubah kode aplikasi, env, DB atau deployment. Artefak laporan dan script audit disimpan di knowledge sesuai instruksi.
