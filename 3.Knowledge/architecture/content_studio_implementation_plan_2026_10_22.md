# Rencana implementasi Cineva Content Studio dan cakupan package HOTS

Tanggal: 22 Oktober 2026. Status: rencana, belum implementasi fitur. Dasar: 10 screenshot client dan [audit capability](client_reference_instadeck_2026_10_22.md), registry serta exact source package lokal/upstream. HOTS Kantor hanya dibaca.

Update eksekusi: [implementasi lokal](content_studio_implementation_2026_10_22.md) merekam source, pengujian dan gap aktivasi. Antrean target disimpan atomik bersama snapshot virtual t_document pada pilot, bukan menambah trigger_outbox/DDL. Package lokal content-kit dipakai frontend/backend; belum dipromosikan ke HOTS. Rencana di bawah tetap baseline target acceptance; tidak semua gate live sudah lulus.

## Keputusan arsitektur

Target alur: sumber link/teks/ide → draft carousel → template/brand kit → edit/preview → QC → render versi final → pilih akun/format → sekarang/jadwalkan → status tiap tujuan → metrik → insight.

Package HOTS existing belum mencakup keseluruhan alur tersebut. Rencana ini memastikan setiap requirement mempunyai pemilik modul, dependency, gap package, dan acceptance gate. Klaim mampu secara production baru diberikan setelah gate lulus, bukan karena package tersedia.

Gunakan modular monolith: UI melalui package, business engines melalui Integrated-API. Pertahankan Form/Workflow/Trigger/Document engine tunggal. Content studio ditautkan ke campaign/assignment/deliverable existing melalui adapter, tidak mengganti marketplace/KOL, payout atau booking. Tenant adalah program, company adalah perusahaan. Personal creator harus memakai scope pribadi yang eksplisit tanpa memperoleh akses company otomatis.

Perubahan sekarang hanya dokumen knowledge, bukti perbandingan dan Excel. Tidak ada aplikasi/package/DB/SQL/deployment/Kantor yang diubah. Re-index hanya Cineva. Perubahan upstream di masa implementasi tetap berupa proposal di Cineva untuk project pemilik HOTS.

## Cakupan package dan batas yang ditemukan

| Fondasi | Bukti existing | Keputusan implementasi |
|---|---|---|
| ui-kit | Button/dialog/card/chart, Carousel berbasis Embla, Calendar berbasis DayPicker | Reuse komponen. Carousel adalah slider UI, bukan generator desain. Calendar adalah date picker, bukan board posting. Tambahkan komposisi calendar board opsional hanya setelah consumer kedua terbukti. |
| dynamic-form + service-form-runtime | Builder, metadata dan runtime normalisasi | Form brief, konfigurasi brand/template, per-platform options. Pertahankan unknown metadata, EAV, unique field IDs dan kontrak submit existing. Bukan canvas renderer. |
| app-core | Injected HTTP, SSE, storage non-secret, media URL dan download | Reuse transport/progress. Tambah typed event bila perlu, bukan auth baru. Token sosial tetap di backend, tidak masuk localStorage atau SSE. |
| engine-client | Form/event/workflow/trigger/preferences clients | Tambah optional content/social clients lewat injected transport. Method dan envelope existing tetap kompatibel. |
| table-engine | Search/filter/group/edit/selection | History, daftar publish dan metrik. Audit delta upstream 0.3.0 sebelum cherry-pick, pertahankan perbaikan refactor Cineva. |
| domain-kit | Validation, relations, commands/revision, AI proposal allowlist, outbox ports | Reuse validasi dokumen, versi dan proposal AI. AI gateway tidak melakukan inference. Server async orchestration tetap adapter, jangan memanggil Promise dalam reducer sinkron. |
| scheduling-kit | Availability/resource/interval policy murni | Tetap untuk crew/gear. Tidak dipaksa menjadi durable scheduler posting atau kalender UI. Timezone dan recurrence milik adapter. |
| page-engine | Responsive layout dan safe CSS parser saja | Reuse fungsi murni jika cocok. Jangan klaim sudah punya canvas/slide renderer. Renderer konten baru harus punya ukuran pixel tetap dan output deterministik. |
| workflow-policy-kit | Timeout/warn/auto-reject policy | Reuse timeout review. Status draft/revisi/QC dijalankan engine workflow existing dan Cineva adapter, bukan engine approval kedua. |
| tenant-contracts/client/server | Context, membership, company scope, session/SSO ports | Gunakan sebagai batas akses API/worker/media/report/SSE. Integrasi baru wajib server-side dan menutup gap legacy, bukan bergantung localStorage. |
| transaction-kit | MySQL adapter, UoW, lock, idempotency, transactional outbox | Reuse kernel. Outbox existing belum delayed job queue, belum lease/recovery lengkap. Tambah kemampuan worker yang diperlukan secara additive melalui module/adapter, dengan DDL authoritative. |
| notification-kit | Scope/transport/SSE dan injected repository | Progress render/publish/sync dan notifikasi. Tidak menyamakan SSE dengan worker scheduler atau durable notification store. |
| submission-kit upstream | Event public-submission validation, bukan editorial QC | Tidak diadopsi untuk review konten hanya karena namanya submission. |

Source entrypoints: `1.Frontend/packages/*/src/index.*`, `1.Frontend/dynamic-form/src`, `2.Backend/packages/transaction-kit/src/kernel/{engine,mysqlAdapter,outbox}.js`, `2.Backend/packages/tenant-server/src`, `2.Backend/packages/notification-kit/src`. Detail versi/hash/file delta di `3.Knowledge/reports/content_studio_plan_2026_10_22/package-evidence.json`.

## Modul baru yang diperlukan

Nama di bawah merupakan kontrak rancangan, belum package yang tersedia. Hindari satu package per layar.

1. **Content contracts/core**: kontrak universal dan fungsi murni untuk ContentDocument, Slide, TemplateDefinition, BrandKit, AssetReference, ContentRevision, RenderManifest. Awali sebagai modul terisolasi di Cineva; kandidat `@hots/content-kit` hanya setelah dua consumer nyata membutuhkan API sama. Render preview dan worker menjadi dua consumer teknis, tetapi promosi lintas program tetap memerlukan kebutuhan program kedua. Pisahkan exports universal dari React/browser agar backend tidak menarik DOM.
2. **Content-studio module**: ingestion, proposal AI, visual editing, template/brand application, render jobs dan revision snapshot. Provider AI/renderer/media storage di-inject. UI brand brown/gold/white tetap adapter Cineva.
3. **Social-publishing module**: provider registry, account connection, capability discovery, publish intent/target, schedule, attempt/reconcile, revoke, cancellation/reschedule. Satu kontrak provider generik, adapter Instagram/Facebook/Threads/TikTok terpisah. Consumer client menjadi extension engine-client. State machine publish berbeda dari workflow editorial dan resource reservation.
4. **Social-insights module**: sync jobs, raw metric snapshots, canonical definitions, aggregation/ranking dan explainable insight. Simpan provider + account + post ID + capture time + metric definition + provenance.
5. **Entitlement adapter**: plan/feature gate dan usage ledger AI/render/publish. Pakai transaksi/idempotency existing. Kuota job Starter existing tidak diubah maknanya menjadi kuota AI.

Future shared improvements harus additive, optional defaults mempertahankan perilaku lama, versioned manifest, README/CHANGELOG, compatibility matrix dan explicit fork provenance. Tidak import `@/` atau config/store aplikasi dari package. Runtime server perlu build artifact/CJS-ESM yang jelas, bukan import source TS browser secara kebetulan. Release menyertakan sibling packages, worker, fonts dan adapter, tanpa path absolut Kantor.

## Tahapan implementasi dan acceptance

### P0 — Baseline kontrak, package dan akses server

Dependency: tidak ada. Hasil: matriks semua requirement R01–R14, package lock/version baseline, keputusan program/company/personal scope, OpenAPI dan error/event contracts, inventaris physical schema terbaru.

Gunakan snapshot physical `schema/hots_saas_baseline_2026_10_21.json` sebagai baseline penelusuran; sebelum SQL, refresh schema target aktual dan verifikasi tabel/kolom/index yang dibutuhkan. Tidak membuat DDL dari nama entity rancangan. Validasi pemetaan campaign/assignment/ticket ownership dan metadata EAV cstm_col/lbl_col/value. Data operasional worker yang perlu index/locking tidak dipaksa menjadi string EAV tanpa desain schema yang disetujui. Tidak memakai registry versi lama sebagai satu-satunya sumber; evidence script memeriksa package.json dan hash source aktual.

Acceptance: contract tests FE/BE konsisten; forbidden company/user/context/asset/report/SSE ditolak server; personal account tidak dapat memilih company sewenang-wenang; migration dry-run/rerun/rollback strategy terdokumentasi sebelum eksekusi. Reconcile package delta tanpa menghapus local fixes. Tidak ada fitur social live sebelum akses server ini lulus.

### P1 — Dokumen slide, template, brand kit dan renderer

Dependency: kontrak P0. Hasil: editor visual dan gallery searchable/filterable, template default/favorite, urutan/tambah/hapus slide, 1/3/5 slide dan rentang valid yang dikonfigurasi, ukuran 4:5 dan 9:16, caption/hashtag terpisah, ID/MS/EN sebagai pilihan konten, logo/handle/tagline/closing slide dan opsi watermark sesuai entitlement.

Mulai dengan 6–10 template representatif yang disetujui, bukan mengklaim telah memiliki 64 desain client. Katalog harus mampu menampung 64+ template; penambahan jumlah desain menjadi pekerjaan konten tersendiri. Brand kit untuk tiap workspace/brand, berbeda dari theme aplikasi. Asset upload tenant-scoped dengan tipe/ukuran/decoding validation dan asset references. Preview dan export memakai model/template/font versi sama, fixed pixel canvas, font/image readiness, overflow validation dan stable render manifest.

Acceptance: galeri 64 fixture dapat dicari/filter tanpa hardcode; teks Indonesia/Melayu/Inggris panjang tidak terpotong; 4:5 dan 9:16 menghasilkan file dimensi benar; logo/watermark/closing konsisten; urutan ekspor dan caption benar; save/reload/version roundtrip; error render tidak menandai selesai. Browser desktop/mobile dan inspeksi visual file output nyata. JSON advanced import/export boleh ada, bukan UX utama.

### P2 — Ingestion link/teks/ide dan AI generation

Dependency: P1 schema/renderer. Hasil: input source adapter → extraction summary + source URL/title → proposal schema → review/edit → save draft. Link berita/artikel didukung lewat extractor allowlist yang teruji. TikTok/Instagram/YouTube/Shopee/Tokopedia memakai adapter terpisah hanya jika akses/API/extraction terverifikasi; tampilkan paste-text/upload fallback saat sumber belum didukung, tanpa label supported palsu.

AI provider di backend melalui port dengan model selection, timeout/cancel, usage records, schema/slide-count/length/language validation. Proposal AI tidak mengeksekusi publish command. Teks dari halaman dan hasil model adalah data, tidak menjadi instruksi sistem/tool. Fetch URL perlu pemeriksaan scheme, redirect dan resolved network target agar tidak mengakses host internal. Simpan provenance dan bedakan fakta sumber dari inferensi/generated image.

Acceptance: link/teks/ide menghasilkan draft yang dapat diedit; malformed model output, empty source, timeout, cancel, retry dan quota exhausted memberi hasil eksplisit; dokumen lama tetap utuh saat gagal. Uji model nyata diperlukan selain fixture. Generasi AI tidak menghabiskan kuota dua kali untuk retry idempotent dan tidak melewati QC.

### P3 — Workflow QC, kalender dan antrean publikasi tahan restart

Dependency: P0 persistence/access, P1 revisions. Bisa dikerjakan bersamaan urutannya dengan P2 tanpa menunggu AI live. Hasil: bind content ke campaign deliverable, reuse workflow draft/review/revision/approved, kalender week/month/list dengan thumbnail/jam/status per platform, filter akun/status, multi-target publish intent dan schedule timezone-aware.

Approval mengunci content revision + render/template/brand/asset versions + publish options. Edit setelah approval membuat revision baru dan invalidates approval/schedule yang terpengaruh. Pada schedule create, atomically simpan intent/targets dan outbox menggunakan transaction-kit. Worker mengambil pekerjaan due memakai short DB transaction + claim lease; network ke provider dilakukan di luar DB transaction; result/status disimpan dalam transaksi baru. Lease expiry, heartbeat/recovery, bounded retry/backoff/jitter, rate-limit dan dead-letter merupakan kebutuhan baru, bukan klaim API outbox existing sudah mencakupnya.

Status per target usulan: scheduled/queued/preparing/publishing/published/failed/unknown/cancelled. Agregat intent dapat partial. Timeout setelah provider menerima publikasi menjadi unknown/reconcile, bukan blind retry yang menduplikasi post. Idempotency per document-revision/account/format/intent, provider request/post ID dan webhook dedup. Satu platform gagal tidak dapat me-rollback post yang sudah live pada platform lain. Cancellation sukses hanya untuk target yang belum dikirim; delete live post memerlukan action terpisah yang didukung provider.

Acceptance: worker restart dan dua worker tidak menduplikasi target; DB rollback tidak meninggalkan outbox/usage setengah jadi; reschedule/cancel balapan dengan claim diuji; revoke membership/account sebelum due mencegah publish; jam WIB/UTC dan timezone dengan DST fixtures benar; jadwal tidak maju/mundur saat browser ditutup; partial success/reconcile terlihat di kalender. SSE hanya progress, bukan eksekutor pekerjaan.

### P4 — Akun sosial dan provider live

Dependency: P3 serta developer app/authorized test accounts. Mulai integrasi satu provider sebagai vertical slice (Instagram carousel kandidat pertama); provider lain memakai kontrak yang sama setelah capability gate masing-masing lulus. Scope/data OAuth provider disimpan backend terenkripsi, exact callback/state/PKCE bila didukung, refresh/revoke dan redacted logs. Pilih tujuan secara eksplisit untuk satu atau beberapa akun.

Hasil: publish now dan scheduled publish, caption/hashtag, format feed/carousel/story yang benar-benar didukung tiap akun/platform, status/pesan error tiap target dan link post. Kapabilitas per provider/account/formats disimpan sebagai manifest bertanggal yang mencakup scope, account eligibility, media limits, publish path, status polling/webhooks dan supported metrics. UI menyembunyikan/menjelaskan opsi yang tidak tersedia. Facebook target Page, Instagram account type dan syarat Story perlu diverifikasi pada dokumen/API saat spike, tidak ditebak dari screenshot. TikTok photo audio opsional mengikuti capability API, bukan janji pemilihan seluruh katalog musik/trending audio.

Acceptance: tiap provider mempunyai bukti consent → publish → provider post ID/status → inspeksi konten pada akun test yang diotorisasi, revoke/expired token/rate-limit/container-processing failure dan retry aman. Masing-masing empat provider wajib lulus sendiri sebelum dinyatakan setara cross-platform. Sandbox/mock lulus tidak sama dengan izin public production. API app review dan account permission adalah dependency eksternal, bukan pekerjaan yang bisa diselesaikan hanya dengan package.

### P5 — Analytics otomatis dan insight

Dependency: P4 post IDs dan permissions metrics. Hasil: sinkron berkala/manual refresh, 7/30/90 hari dan custom range, filter akun/platform, views/interactions/ER/followers jika tersedia, tren tanggal, top posts, template performance dan AI insight dengan provenance.

Tetapkan timezone/basis tanggal, refresh time, attribution window dan definisi denominator. Jangan menjumlah lifetime cumulative snapshots antar-tanggal menjadi total baru. Metrik unsupported/permission denied/belum tersedia adalah null + reason, bukan 0. ER existing berbasis views dipertahankan dan diberi label; jangan merata-ratakan ER post tanpa dasar agregasi. Ranking template menyimpan template version dan jumlah post/sample, membedakan total engagement dengan rate. Growth followers akun tidak otomatis berasal dari satu post. Insight AI hanya memakai dataset terotorisasi dan menyebut periode/sample; rekomendasi jam/hari adalah observasi, bukan jaminan kenaikan atau kausalitas.

Acceptance: sample provider responses dapat ditelusuri ke raw snapshot dan angka dashboard; stale/partial sync terlihat; manual insight lama tetap terpisah provenance-nya; no-data/zero denominator/small sample diuji; top-post/template ranking bisa direkonsiliasi; retrieval API nyata diperlukan untuk klaim analytics live.

### P6 — Paket/kuota, hardening dan release acceptance

Dependency: P1–P5 untuk full parity. Hasil: backend plan entitlement, quota usage/reservation/refund semantics, team permissions dan audit history, notification state, pagination maksimal 100 per response transactional list, deployment API + isolated workers dan monitoring SSE/log parser existing.

Kuota generasi/render/publish punya unit dan settlement policy eksplisit. Concurrent requests tidak bisa melebihi limit. Provider failure/refund mengikuti policy dan ledger idempotent, tidak mengubah saldo cash/payout creator existing. Charge/payment provider baru hanya jika scope bisnis menyetujuinya; simulator frontend bukan subscription billing live. Rollout feature-flag per company/account/provider, canary ke akun test, backup/versioned migration dan prosedur rollback code/worker yang tidak menghapus post live. Arsip legacy hanya setelah replacement dan regresi terbukti.

Acceptance: end-to-end buat content → QC → schedule → restart worker → live post → metrik → dashboard dengan server nyata; cross-company leakage tests termasuk worker/export/media/SSE; regresi marketplace/campaign/payout/booking/forms; clean package install dan build tanpa Kantor; scoped type/lint/tests serta release artifact lengkap. Semua gap yang belum lulus tetap dinyatakan pending, termasuk public app approval.

## Traceability fitur client

| ID | Requirement | Phase / pemilik | Gate minimum |
|---|---|---|---|
| R01 | Link/teks/ide → AI carousel | P2 content-studio + provider AI | Live inference dan source fallback diuji |
| R02 | Slide count, format, language | P1 content core, P2 generator | Output dimensions/order/language constraints |
| R03 | Template gallery/filter/default | P1 content-studio + ui-kit | 64 fixture searchable; desain actual ditandai jumlahnya |
| R04 | Calendar week/month/list | P3 publishing calendar | Target status/timezone dan reschedule/cancel |
| R05 | Hasil feed/carousel sosial | P1 render + P4 connector | File visual dan post pada akun test nyata |
| R06 | Multi-platform/multi-account | P4 social-publishing | 4 provider lulus capability + OAuth separately |
| R07 | Publish now/scheduled dan failure | P3/P4 transaction-kit + worker | Restart/race/reconciliation + provider proof |
| R08 | Feed/story/caption/hashtag/audio | P1 options, P4 provider adapter | Per-format eligibility; unsupported eksplisit |
| R09 | Brand kit + watermark/closing | P1 content-studio | Export match preview dan plan policy |
| R10 | Views/interactions/ER/followers | P5 social-insights | Supported metrics + null provenance |
| R11 | Tren/top content/template ranking | P5 projection + table/ui chart | Reconcile metrics/sample/period |
| R12 | AI insight waktu/template | P5 insight adapter | Evidence-linked recommendation, no fabricated lift |
| R13 | Paket/kuota/team | P0 access + P6 entitlement | Server enforcement + concurrency ledger |
| R14 | Draft/revisi/QC/history | P3 workflow adapter | Approved revision immutable + regression |

Menu tutorial/help, dark mode, notifikasi, API/MCP dan afiliasi terlihat di screenshot tetapi detail alurnya tidak disertakan. Notifikasi/theme dasar mengikuti host. Kesetaraan modul bantuan/afiliasi/API-MCP memerlukan requirement tersendiri; tidak diklaim covered oleh R01–R14 hanya dari label menu.

## Milestone delivery dan validasi package

- M1: P0/P1 — content studio manual + brand/template/export, belum AI/publisher live.
- M2: P2/P3 — AI draft + QC + kalender/scheduler teruji dengan fake provider. Jelas diberi label simulation saat connector belum live.
- M3: P4 — publisher live per provider setelah app/account gate. Jangan menunggu keempat provider untuk menguji vertical slice pertama.
- M4: P5/P6 — metrik nyata, insight, entitlement dan full release acceptance.

Tidak menetapkan tanggal selesai sebelum spike schema, renderer dan izin provider selesai. Urutan dependency di atas lebih authoritative daripada estimasi kalender. Gate gagal menghalangi klaim milestone terkait, tidak mematikan fitur lama.

Cara memastikan reusable: contract tests package + dua consumer fixture yang berbeda label/policy (Cineva social content dan generic announcement), validasi FE/BE, render actual files dan browser integration; fixture kedua membuktikan desain portabilitas tetapi bukan program kedua production. Upgrade shared package wajib regresi default lama dan semver. Source-parity membuktikan kesamaan bytes, bukan runtime readiness.

Verifikasi ulang pada 22 Oktober: `test:generic-packages` **44/44**, package type diagnostics **0**; `test:packages` **17/17**, table files <=1000 baris; transaction-kit kernel/program/problem **23/23** dengan memory store dan SQL-shape tests. Total **84** lulus. Tidak ada live MySQL, auth/IdP, AI inference, browser/render carousel atau provider sosial yang diuji pada perencanaan ini.

## Dependency provider yang diverifikasi dan batasnya

- [TikTok Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-get-started) dan [Photo API](https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post): posting perlu app/scope/user authorization; unaudited client dibatasi private; photo source memerlukan verified URLs. Photo API menyediakan `auto_add_music`, bukan bukti bebas memilih seluruh katalog audio.
- [TikTok sharing guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines): persyaratan UX/publish dan branding mesti menjadi policy adapter; jangan otomatis menempel watermark aplikasi pada semua output TikTok.
- Meta docs dicoba 22 Oktober tetapi endpoint resmi Instagram/Threads/Pages memberikan 429. Spike per-provider P4 wajib memverifikasi ulang scopes/account eligibility/media limits dan insight permissions sebelum mengaktifkan capability. Tidak menyatakan seluruh format Meta sudah terverifikasi dari browsing ini.

## Laporan dan reproduksi

Excel rencana: `outputs/content_studio_plan_2026_10_22/Cineva_Content_Studio_Implementation_Plan.xlsx`. Bukti versi/hash/delta: `3.Knowledge/reports/content_studio_plan_2026_10_22/package-evidence.json`. Script audit/report di `3.Knowledge/scripts/content_studio_plan_2026_10_22`. Tidak menjalankan script/index/test Kantor. Tidak menyimpan secret atau data akun nyata dalam laporan.
