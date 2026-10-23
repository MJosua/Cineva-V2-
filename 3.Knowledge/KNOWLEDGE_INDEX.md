# Cineva knowledge entry point

Updated: 2026-10-14. Workspace folders are separated; reusable UI, builder, report, media and selected client packages are integrated locally. Backend business engines have not been upgraded; no database migration has been performed. HOTS Kantor is read-only reference.

Status update 2026-10-18: local trigger/builder fixes verified; HQ/Creator Space interactive frontend dummy preview implemented with 9 domain tests and 19 A/B browser scenarios on dev/production preview. Existing 17 contract tests and 16 component browser checks pass. Database work excluded by user; real tenant/payment/local-LLM integration remains pending.

## Read first

- [HTML demo Content Studio siap kirim](architecture/content_studio_portable_2026_10_22.md): satu HTML offline sekitar 1 MB + ZIP sekitar 258 KB, existing UI/theme, synthetic HQ/Creator, portable export terbaru dan 15 file-URL E2E. Tidak mengirim WhatsApp atau mengaktifkan provider.

- [Implementasi Content Studio](architecture/content_studio_implementation_2026_10_22.md): package lokal/renderer/8 template, UI HQ/Creator, scoped API, virtual-document MySQL adapter, worker/provider/AI ports, browser/HTTP/raster dan batas aktivasi production. Laporan implementasi terpisah dari baseline plan.

- [Upgrade approval/PIC PAR](architecture/par_approval_pic_2026_10_22.md): izin khusus edit Kantor sesi ini; remark kartu approval, executor sebagai Latest PIC setelah approval selesai, PIC kosong setelah paid, dan penggantian kolom Paid List dengan tanggal paid. Typecheck/build, 9 tes sintetis, 16 regresi scope dan query read-only; belum deploy.

- [Rencana Content Studio dan social publishing](architecture/content_studio_implementation_plan_2026_10_22.md): cakupan package HOTS yang diverifikasi, 7 tahap implementasi, 14 requirement, gate provider/live dan 84 tes fondasi. Dokumentasi/rencana saja, belum implementasi fitur.
- [Audit referensi client InstaDeck](architecture/client_reference_instadeck_2026_10_22.md): perbandingan 10 screenshot dengan source Cineva, gap generator carousel/publisher/brand kit/analytics dan batas dummy.

- [E2E lokal nyata HOTS/Overseas](architecture/local_live_e2e_2026_10_21.md): akun dummy Yosua dan Marcel, browser/API nyata tanpa interception. Login/list/detail berhasil sesuai scope; Marcel ditolak IndoUSA tetapi dashboard membocorkan agregat 47 PAR company lain. API tenant baru 404; OIDC lokal hidup tetapi login SSO portal belum aktif. Tidak mengedit source Kantor.

- [Aktivasi pilot SaaS dan hierarki company](architecture/saas_pilot_activation_2026_10_21.md): user mengizinkan penambahan DB HOTS melalui script; 4 tabel baru, Overseas 108, subtree Excom Kevin, pilot ticket baca, real MySQL rollback checks, dan inspeksi deployment SSH 105/104. Source/deploy HOTS tidak diubah; SSO production belum terverifikasi.

- [Implementasi fondasi tenant/SSO](architecture/tenant_foundation_2026_10_21.md): 3 package lokal, workspace UI, fail-closed backend mount, BFF/OIDC/registration/invitation adapters; Client pribadi langsung aktif dan akses perusahaan lewat undangan. Local tests/build/browser; runtime/DB/IdP nyata belum aktif. Koneksi diperiksa via MCP read-only sesuai arahan pengguna.

- [Standar SaaS dan SSO](architecture/saas_standards_sso_2026_10_21.md): definisi pengguna terbaru tenant = program (HOTS Normal/Overseas/Cineva), company = perusahaan; multi-company user dan role membership. Menggantikan interpretasi tenant-pelanggan pada rekomendasi audit sebelumnya. 12 standar, target SSO pusat dan source OIDC existing versus batas runtime.

- [Audit database dan semantik SaaS](architecture/database_saas_audit_2026_10_21.md): pengguna memilih HOTS aktual sebagai target Cineva; snapshot read-only 180 tabel/view, FK/index/kolom dan agregat ownership tersimpan di Cineva. Company legacy/work-data belum authoritative untuk tenant; tidak ada repair/migration. [Schema target](schema/hots_saas_baseline_2026_10_21.json).

- [Audit kesiapan SaaS dan isolasi Cineva/Overseas](architecture/saas_readiness_2026_10_21.md): 17 temuan source, 5 reproduksi query terisolasi, batas tenant/company/product, pilihan database, rancangan branding JSON dan tahapan acceptance. Belum ada edit aplikasi atau DB; physical DDL Cineva tetap diperlukan.

- [Domain/scheduling promotion to HOTS](architecture/package_promotion_2026_10_19.md): user-authorized new packages in Kantor frontend, 0.1.0 upstream and Cineva .2 forks, source/test parity and dummy validation; existing HOTS apps remain unchanged.

- [Modular notification/SSE](architecture/notification_package_2026_10_19.md): explicit user exception authorizes frontend `app-core` upgrade in Kantor to 0.6.0; Cineva fork/adapters and local backend notification-kit, dummy HTTP/SSE tests, remaining DB/auth boundaries.

- [Generic domain/scheduling packages](architecture/generic_packages_2026_10_19.md): local additive SDK `0.1.0-cineva.1`, parameterized contracts, offline validation/commands and Cineva resource scheduling adoption; dummy tests and explicit server boundaries.

- [Backlog modul reusable HOTS](architecture/reusable_module_backlog_2026_10_19.md): 12 capability, prioritas, adapter meeting/Cineva/hotel, batas calendar vs reservation, dan acceptance dummy; rancangan tanpa edit Kantor.

- [HOTS dan Cineva: capability review 19 Oktober](architecture/hots_cineva_capability_review_2026_10_19.md): kandidat upstream versus policy vendor, bug lama yang sudah diperbaiki upstream, dan batas readiness server.

- [Demo client Melin](architecture/client_demo_melin_2026_10_18.md): JSON dokumen HOTS/EAV, HTML offline mandiri, form editable/localStorage/export, milestone sumber dengan konflik tanggal tetap ditandai. Output di 5.Client-Demo; tes sintetis.

- [Crosscheck Excel live lokal](architecture/live_excel_reference_2026_10_18.md): permintaan terbaru pengguna menampilkan nama/isi sel asli, proxy loopback hanya baca, refresh tanpa rebuild; menggantikan snapshot tersamarkan. Tes tetap sintetis.

- [Preview tiga akun Excel](architecture/account_reference_2026_10_18.md): izin pengguna untuk tiga snapshot akun tersamarkan, route Creator/reference, hanya baca; tes tetap memakai fixture sintetis.

- [Campaign Operations A/B](architecture/cineva_campaign_operations_2026_10_18.md): campaign/batch/talent assignment, produk/fulfillment, draft/revisi/QC/post, payout dan insight; frontend dummy, DB tetap ditunda.

- [Workbook operasional asli: mapping dan gap](architecture/workbook_reference_2026_10_18.md): Simply Juun/IC100 dibaca read-only; campaign multi-talent, produk, deliverable, payout, insight dan kualitas data. Data asli tidak dimasukkan ke preview/test.

- [Pemantapan workflow, penawaran, CS dan booking](architecture/cineva_maturity_2026_10_18.md): tiga grup paralel diintegrasikan; revisi quote/persetujuan versi, tahapan layanan, antrean CS dan booking spesialis eksplisit, seluruhnya dummy.

- [Layanan, inquiry dan CS A/B](architecture/cineva_service_flow_2026_10_18.md): Paket 1–4 diimplementasikan sebagai frontend dummy, brief/quote, Creator ke HQ, CS AI/manusia, recovery dan E2E; backend nyata tetap ditunda.

- [Rencana implementasi requirement voice note](architecture/implementation_plan_voice_2026_10_18.md): lima paket berurutan, acceptance dummy per paket, CS AI/manusia dan alur Creator ke HQ; backend/DB nyata tetap ditunda.

- [Requirement dari voice note Cineva](architecture/voice_requirements_2026_10_18.md): OGG berisi narasi 2 menit 32 detik; transkrip bertimestamp, tiga layanan, AI/non-AI CS, estimasi dan kebutuhan jasa fotografer/videografer. Dibedakan antara ucapan eksplisit, interpretasi A/B dan gap implementasi.

- [Audio video dan requirement A/B](architecture/video_audio_requirements_2026_10_18.md): video referensi memiliki track audio efektif hening; tidak ada transkrip ucapan. Pemetaan A/B tetap diberi sumber visual/tertulis, bukan diklaim berasal dari narasi.

- [Refactor reusable table](architecture/table_refactor_2026_10_18.md): pemisahan hook urutan kolom, seleksi, dan grouping; batas 1.000 baris otomatis pada tes paket. Fork lokal table-engine .2, 19 browser checks komponen dummy.

- [Theme vendor Cineva](architecture/cineva_vendor_theme_2026_10_18.md): aksen coklat/emas/putih diterapkan lewat adapter frontend; HOTS core/original tetap, pengembangan upstream additive.

- [Audit sumber theme Cineva sebelum adaptasi](architecture/theme_source_audit_2026_10_18.md): membedakan branding coklat/emas/putih dari default biru HOTS. Adapter vendor sekarang aktif; isi konfigurasi theme DB tetap belum diverifikasi.

- [Preview interaktif HQ dan Creator Space](architecture/dual_product_preview_2026_10_18.md): route/preview A/B, fitur dummy, modular boundaries, cara menjalankan, E2E dan batas integrasi backend.

- [Referensi visual Creator Space](architecture/visual_reference_creator_space_2026_10_18.md): screenshot/video pengguna, pola layout/interaksi, dan aturan mempertahankan CSS/theme HOTS Cineva existing.

- [Kompatibilitas komponen 18 Oktober](architecture/component_compatibility_2026_10_18.md): perbaikan trigger/builder, fork versions, dummy browser E2E dan gap tersisa. Menggantikan status Cineva R02/R03 pada snapshot 14 Oktober.
- [Arah HQ dan Creator Space](architecture/cineva_dual_product_direction_2026_10_18.md): catatan produk Gemini dipetakan ke engine existing; tenant/finansial/AI dan DB belum diimplementasikan.

- [Status dan prompt perbaikan Cineva](handover/PROMPT_PERBAIKAN_CINEVA.md): fixed lokal versus adapter/pending, lokasi file dan langkah acceptance per tahap.

- [Handover untuk AI HOTS Kantor](handover/HOTS_ORIGINAL_HANDOVER_2026_10_14.md), [prompt chat Kantor](handover/PROMPT_AI_KANTOR.md), dan [Excel prioritas](handover/HOTS_Original_Handover.xlsx): 10 temuan, bukti, acceptance, batas upstream dan urutan perbaikan. Dokumen dibuat di Cineva; bukan perubahan atau deployment HOTS Kantor.

- [Reusable package integration](architecture/reusable_packages_2026_10_14.md), [local package registry](packages/REGISTRY.md) and [future HOTS notes](architecture/hots_reference_followups_2026_10_14.md): current package versions, adoption status and remaining work.

0. [Folder restructure](architecture/folder_restructure_2026_10_14.md), [FILE_MAP](FILE_MAP.md), [frontend APP_MAP](../1.Frontend/HOTS/APP_MAP.md) and [backend APP_MAP](../2.Backend/Integrated-API/APP_MAP.md): current paths and retrieval entry points. Run `npm.cmd run knowledge:index` from root after source/docs change; search with `npm.cmd run knowledge:search -- <words>`. Earlier audit paths are historical; resolve them using the restructure map.

1. [HOTS → Cineva audit](reports/hots_cineva_2026_10_14/AUDIT_HOTS_CINEVA.md): observed differences, architecture impact, risks and six upgrade phases.
2. [Excel report](reports/hots_cineva_2026_10_14/HOTS_Cineva_Upgrade_Audit.xlsx): comparison, package/module inventory and frontend file delta.
3. [Marketplace knowledge](jobmarketplace_knowledge.md): domain meaning and expected workflow; conceptual proposals are not all verified implementation.
4. [Schema draft](jobmarketplace_schema.md): explicitly a draft, not deployed DDL. Obtain latest physical Cineva schema before producing migration SQL.
5. [Endpoint design mapping](jobmarketplace_endpoint_mapping.md): target routes are proposals. Current implementation is 2.Backend/Integrated-API/routers/hots/hotsJobMarketplace.js, mounted under /hots_jobmarketplace.
6. [Kanban integration](job_marketplace_kanban_logic.md): marketplace/HOTS cross-schema integration and service 19. See audit A08–A13 for integrity and identity limitations.
7. [Original roadmap](jobmarketplace_roadmap.md): domain roadmap; platform prerequisite order is in the new audit.

## Upgrade decisions to preserve

- Adopt HOTS modular package/platform model while preserving Cineva campaign, pickup, talent, batch, location and content workflow.
- Backend platform engines remain shared; Cineva business rules belong in its program/config/adapter boundaries.
- Reuse shared form, builder, table, UI and API capabilities. Visual editing is the primary UX; raw JSON is advanced/import-export.
- Preserve cstm_col/lbl_col/value ticket EAV and the established profile attribute store; do not invent a physical schema from conceptual docs.
- Every DB write requires transaction, commit and rollback. Engine failure must not be swallowed before a success commit for mandatory synchronization.
- Use per-module SSE logging/events; emit business-change events after successful commit.
- Version and include required packages in the independent Cineva release. Do not rely on an absolute D:/Kantor path.
- Legacy code is archived in this knowledge folder only after a verified replacement; retain compatibility and rollback evidence.

## Verification boundaries

Current evidence covers source, manifests, package metadata and file hashes. Runtime, browser, physical Cineva schema, deployed DB ownership, identity-provider compatibility and production deployment remain unverified. SHA256 differences can include changed imports or refactors; they do not prove additional behavior.

## Reproduce audit

The one-time builder is audit_hots_cineva_2026_10_14.mjs in this folder. It uses the bundled artifact-tool via a temporary node_modules junction; it never imports application modules or connects to a database. Its knowledge-baseline count is fixed at the five original domain documents to avoid counting generated audit artifacts on reruns. Output provenance and relative-path comparisons are in reports/hots_cineva_2026_10_14/audit_evidence.json.
