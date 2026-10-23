# Handover HOTS original — reusable platform

Tanggal: 14 Oktober 2026. Disusun di Cineva untuk AI/pemilik project Kantor.

## Batas tugas dan dampak arsitektur

Dokumen ini adalah audit dan usulan pekerjaan. Dalam sesi pembuatannya D:/Kantor hanya dibaca; tidak ada perubahan source, knowledge, Git, database, build/deploy atau PM2 di Kantor. Pelaksanaan perbaikan dilakukan oleh AI project Kantor sesuai instruksi pengguna di chat tersebut.

Tujuan: perbaiki kontrak paket pusat secara additive agar HOTS, Cineva dan consumer lain stabil, editable dan fleksibel. Generic UI/normalisasi/client berada di paket; aturan bisnis, store, auth provider dan adapter tetap milik aplikasi; engine bisnis backend tetap layanan bersama. Ini bukan instruksi menyalin seluruh Cineva ke HOTS.

## Knowledge retrieval wajib sebelum implementasi

Baca AGENTS.md yang berlaku, D:/Kantor/3.Knowledge/KNOWLEDGE_GRAPH.md, domains/shared-platform/README.md, 03_package_design_rules.md, 04_versioning_and_compat.md, 06_identity_and_auth_standard.md, packages/REGISTRY.md dan COMPATIBILITY.md. Periksa Git status pada subrepo sebenarnya dan revalidasi source di bawah karena handover merupakan snapshot. Standar shared-platform menyebut HOTS legacy bermigrasi bertahap; audit partial adoption tidak berarti semua file lokal wajib langsung diganti.

## Urutan kerja

1. R01: perbaiki cancel edit yang sudah direproduksi; patch kecil dan regression test.
2. R03 dan R02: selaraskan kontrak client dan whitelist builder.
3. R08: audit auth segera, pisahkan koreksi dokumentasi dari migrasi transport. P0 adalah prioritas audit kompatibilitas; tidak ada exploit/insiden produksi yang dibuktikan.
4. R04: buat fixture clean consumer sebelum memperluas penggunaan paket.
5. R05, R06, R07, R09, R10: documentation sync dan evolusi paket bertahap setelah kontrak dasar stabil.

## Daftar pekerjaan dan acceptance

### R01 — P0 — table-engine Escape saves cancelled edits

Status bukti: Bug reproduced; fixed only in Cineva fork.

Sumber: packages/table-engine/src/cells/EditableCell.tsx. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: setValue restores asynchronously; immediate blur uses old draft closure and calls save.

Bukti source: D:/Kantor/1.Frontend/packages/table-engine/src/cells/EditableCell.tsx:54-59. onBlur memanggil save; Escape setValue lalu blur. State React belum diperbarui sehingga closure menyimpan draft. Reproduksi mock sebelumnya: fokus sel, ketik 'Cancelled edit', tekan Escape; nilai justru berubah. Kandidat patch tersedia di D:/Project/Cineva-V2-/1.Frontend/packages/table-engine/src/cells/EditableCell.tsx: ref untuk melewati blur setelah Escape, preventDefault, lalu restore. Port hanya perubahan perilaku ini, bukan seluruh fork.

Usulan: Use a ref to suppress the following blur save; add keyboard cancel regression coverage.

Acceptance: Escape: 0 save callback/request dan nilai kembali; Enter/blur menyimpan tepat sekali; rejection mengembalikan nilai lama.

### R02 — P1 — Builder allowed field types not enforced in inspector

Status bukti: Observed; Cineva registry guard.

Sumber: dynamic-form/src/UnifiedFormStructureBuilder.tsx. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: allowedFieldTypes filters creation catalog; GenericFieldEditor still uses all registry.listFields entries.

Bukti source: D:/Kantor/1.Frontend/dynamic-form/src/UnifiedFormStructureBuilder.tsx:67 memakai semua registry.listFields; :186 membatasi creation catalog dengan allowedFieldTypes. Buat fixture whitelist ['text'], buka inspector: pilihan lain masih muncul. Terapkan satu kebijakan untuk create/edit, dengan tampilan aman untuk jenis legacy yang sudah tersimpan. Cineva memakai registry guard sebagai adapter.

Usulan: Pass allowed types into inspector or filter the registry consistently for both creation and edit.

Acceptance: Create dan inspector memakai whitelist yang sama; field lama di luar whitelist tetap round-trip tanpa kehilangan metadata.

### R03 — P1 — Trigger client query/types differ from backend

Status bukti: Source verified; Cineva adapter.

Sumber: packages/engine-client/src/hots/trigger.ts; Integrated-API/programs/hots/core/settings/controllers/triggerFunctionController.js. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: Package list accepts type while backend reads function_type; categories typed string[] while UI/backend use category/count objects.

Bukti source: D:/Kantor/1.Frontend/packages/engine-client/src/hots/trigger.ts:32-33 versus D:/Kantor/2.Backend/Integrated-API/programs/hots/core/settings/controllers/triggerFunctionController.js:49,71-73,552-555. list({type:'sql'}) tidak menjadi filter function_type; categories berupa objek agregasi. Perbaiki tipe dan normalisasi alias pada client; tidak memerlukan SQL/migrasi DB. Reproduksi kontrak dengan mock Axios dan fixture response backend.

Usulan: Correct public filter/category types and keep legacy aliases additive.

Acceptance: function_type, category, search, is_active dikirim sesuai backend; categories bertipe {category,count}[]; alias type lama tetap didukung dengan aturan precedence.

### R04 — P1 — UI package optional peers and entry points

Status bukti: Integration gap observed.

Sumber: packages/ui-kit/package.json; src/index.ts; tailwind-preset.cjs. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: Barrel exposes optional-peer components; source-package resolution can fail when peers live in host node_modules.



Usulan: Provide documented component subpaths and peer resolution/hoisting recipe; Cineva adds subpaths and host Vite dedupe.

Acceptance: Clean install/build fixture dua host berhasil; import komponen dasar tidak membutuhkan peer opsional yang tidak dipakai; React singleton; Tailwind preset dapat di-resolve.

### R05 — P2 — Package docs/version/status drift

Status bukti: Observed.

Sumber: packages/app-core/docs/README.md; engine-client/docs/README.md; 3.Knowledge/packages/REGISTRY.md. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: README versions differ from actual metadata and registry consumption status can be older than source.



Usulan: Generate or verify registry/version/status from package.json and actual imports.

Acceptance: Versi README cocok package.json; adoption di registry dapat ditelusuri ke import/call site; CHANGELOG dan compatibility ikut diperbarui.

### R06 — P1 — Shared engine-client surface incomplete

Status bukti: Documented by reference.

Sumber: packages/engine-client/docs/README.md. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: No clean report-table/document/ticket/assignment clients; calls stay inline in HOTS pages/widgets.



Usulan: Define typed clients from actual backend routes/envelopes, with additive compatibility wrappers.

Acceptance: Client diuji terhadap route/envelope nyata; error success:false ditolak; auth/base URL di-inject; EAV dan pagination tetap kompatibel.

### R07 — P1 — Builder domain extension gaps

Status bukti: Observed.

Sumber: dynamic-form/src/UnifiedFormStructureBuilder.tsx. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: Only field-editor and preview render hooks; rich row-group/special/widget inspectors remain app-specific.



Usulan: Add optional inspector hooks/registries without importing app store or API into packages.

Acceptance: Hook opsional default perilaku lama; JSON metadata tak dikenal round-trip; row group/widget inspector berfungsi tanpa import store/API aplikasi.

### R08 — P0 — Auth documentation contradicts current implementation

Status bukti: Previously audited; rechecked source.

Sumber: HOTS/src/lib/authToken.ts; app-core/src/http.ts. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: Memory-only comment coexists with localStorage writes; shared client expects cookie-only contract.

Bukti source: D:/Kantor/1.Frontend/HOTS/src/lib/authToken.ts:4-7 mengklaim memory-only, tetapi :29-30 menulis hots_auth_token/hots_tokek ke localStorage. D:/Kantor/1.Frontend/packages/app-core/src/http.ts:38,42 memakai cookie dan menghapus Authorization. Ini konflik implementasi/standar, bukan bukti eksploitasi atau bukti login produksi rusak. Langkah awal: petakan consumer/token provider/backend; koreksi klaim dokumentasi yang keliru. Jangan menghapus storage atau Bearer global tanpa acceptance lintas consumer.

Usulan: Reconcile code, provider/backend contracts and docs in the Office project; do not blindly switch consumers.

Acceptance: Audit login/refresh/logout/SSO/MFE/SSE dan CORS/CSRF selesai; dokumen mencerminkan implementasi; migrasi auth hanya setelah consumer/backend kompatibel.

### R09 — P1 — HOTS reference itself only partly adopts packages

Status bukti: Reference metadata/source inventory.

Sumber: HOTS/package.json; HOTS/src/components/ui; packages/REGISTRY.md. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: Dynamic form/policy integration exists, while generic UI and several engine/table/API paths still live in app.



Usulan: Plan gradual migration with compatibility wrappers; package presence is not runtime adoption.

Acceptance: Migrasi satu consumer per tahap; tindakan/role/pagination/filter/export dan submit diuji; kode lama diarsipkan setelah pengganti terbukti.

### R10 — P2 — page-engine and app-template readiness

Status bukti: Registry documented.

Sumber: packages/page-engine; 3.Knowledge/packages/REGISTRY.md. Path frontend relatif terhadap D:/Kantor/1.Frontend; Integrated-API berada di D:/Kantor/2.Backend.

Penyebab/gap: page-engine only responsive/CSS helpers; app-template/commerce-kit candidates have no package implementation.



Usulan: Complete package surface before claiming full page/shell/commerce reuse.

Acceptance: Status helper/candidate dinyatakan akurat; renderer baru hanya setelah requirements, kontrak dan minimal dua consumer jelas.

## Yang boleh dijadikan kandidat upstream dari Cineva

- table-engine: suppression blur setelah Escape; optional hideSearch default false untuk host yang sudah mengelola pencarian. hideSearch adalah kebutuhan kompatibilitas consumer, bukan bukti bug semua host.
- ui-kit: public component subpaths dan utilities/hooks exports. Verifikasi default/named export, declaration dan optional peers sebelum rilis.
- Builder: konsistensi whitelist dan hook inspector opsional; pertahankan metadata unknown dan field identity.

Yang tidak boleh di-port otomatis: transport Bearer/localStorage Cineva, service 19/marketplace rules, API response shims legacy, endpoint/failover, DB/schema atau konfigurasi deployment Cineva. Fork lokal ui-kit/table-engine 0.2.0-cineva.1 adalah bukti kandidat, bukan rilis upstream.

## Bukti uji dan batas verifikasi

Integrasi Cineva: clean frontend install/build, 15 contract tests dan browser fixture mock berhasil. Reproduksi Escape terjadi sebelum patch lokal. Builder/filter/save failure/export diuji pada fixture, bukan backend produksi Kantor. Seluruh typecheck Cineva masih memiliki 101 diagnostics; keberhasilan adapter bukan sertifikasi seluruh aplikasi.

Bukti: D:/Project/Cineva-V2-/3.Knowledge/scripts/package_upgrade_2026_10_14/contracts.test.ts, contracts-results.txt, validation.json, snapshot.json, integration.json; screenshot/report di 3.Knowledge/reports/package_upgrade_2026_10_14. Snapshot referensi sebelumnya memverifikasi 271 file Kantor unchanged. Tidak ada pengujian login nyata, DB, provider, upload, SSE atau deployment dalam audit ini. R04 berasal dari kegagalan integrasi consumer Cineva; build HOTS original belum diuji. R06/R07/R09/R10 adalah gap/peluang desain, bukan bug runtime terkonfirmasi.

## Prosedur implementasi dan rollback untuk AI Kantor

1. Audit source dan knowledge terkini, consumer/dependency serta status subrepo; jelaskan dampak sebelum edit. Mulai R01/R03/R02 dalam perubahan terpisah.
2. Pakai modular engine, injection props/provider, optional parameter default lama, SemVer/deprecation dan CHANGELOG. Jangan tambah ketergantungan paket pada aplikasi.
3. Simpan one-time fixture/check script di knowledge/scripts; runtime log mengikuti SSE logger/parser. Setelah replacement terverifikasi, arsipkan legacy ke knowledge/_old atau _archive dengan provenance.
4. Jika menyentuh backend DB: ambil schema fisik terbaru dari knowledge, jangan memakai draft; pertahankan EAV cstm_col/lbl_col/value; semua writes transaction + commit + rollback. Task client/keyboard awal tidak membutuhkan DB write.
5. Jalankan test acceptance spesifik, build consumer terkait, lalu browser pada lingkungan terisolasi. Auth memerlukan login/refresh/logout/SSO/MFE/SSE acceptance; build saja tidak cukup.
6. Catat hasil, limitation dan paket/consumer yang belum mengikuti; update knowledge, registry, compatibility serta Excel. Rollback patch melalui perubahan terpisah dan versi paket sebelumnya; jangan restore menimpa perubahan pengguna. Deploy/restart/DB mutation mengikuti otorisasi chat Kantor, tidak tersirat dari handover ini.

## Deliverables yang diharapkan dari AI Kantor

Audit ulang per ID; patch kandidat kecil; hasil acceptance dan consumer impacted; catatan gap tersisa; versi/CHANGELOG/compatibility; panduan adopsi Cineva tanpa penyalinan engine bisnis.
