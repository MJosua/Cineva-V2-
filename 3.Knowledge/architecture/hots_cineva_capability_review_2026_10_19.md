# HOTS dan Cineva: fondasi, kandidat upstream, dan batas kesiapan

Pemeriksaan source/dokumentasi terbatas 19 Oktober 2026. Tidak mengubah HOTS Kantor atau Cineva runtime/backend/DB. HOTS dapat menjadi fondasi Cineva melalui engine ticket/EAV, form, workflow, trigger, document/CMS dan shared UI. Ini tidak membuktikan seluruh fitur Cineva sudah tersedia sebagai paket atau berjalan end-to-end di server.

## Koreksi catatan historis

Catatan `hots_reference_followups_2026_10_14.md` adalah snapshot historis. Pemeriksaan sekarang menemukan HOTS Kantor table-engine 0.2.1 dengan Escape cancel guard, dynamic-form 0.1.1 dengan allowedFieldTypes konsisten, serta engine-client 0.2.1 dengan kontrak trigger diperbaiki. Jangan mengirim ulang ketiganya sebagai bug belum diperbaiki tanpa reproduksi baru. DynamicForm.tsx reference masih memakai label `hdf-${name}`; dukungan ID form unik pada Cineva tetap kandidat port additive, bukan klaim bug semua consumer.

## Pemisahan kemampuan

| Kemampuan Cineva | Penempatan yang disarankan | Status bukti |
|---|---|---|
| ID unik beberapa form dan table hooks terpisah | Paket form/table bersama, setelah membandingkan API dan tes | Implementasi lokal Cineva; sebagian bug lama sudah diperbaiki upstream |
| HTML demo mandiri + JSON + storage adapter | Paket demo/export terpisah yang opsional | Demo lokal diuji file URL; bukan pengganti persistence server |
| Quote version, snapshot acceptance, stale revision | Modul umum opsional dengan policy vendor | Cineva frontend dummy; implementasi server belum diverifikasi |
| Milestone/calendar/resource overlap/explicit booking | Modul scheduling opsional dengan resource adapter | Aturan lokal ada; transaksi/concurrency server belum terbukti |
| Draft/revisi/QC/output/posting | Preset konfigurasi workflow dan assignment | Domain/policy tetap Cineva, mesin reusable tidak diganti |
| Cash vs barter, partial payment, payout history | Modul financial metadata/ledger opsional | Bukan core accounting engine; belum integrasi bank/DB |
| Source Excel mapping, raw values/provenance, review konflik | Import adapter + validasi/preview umum | Bridge lokal dan export; bukan importer produksi atau DDL |
| Brand, niche, Simply Juun, KPI creator dan tiga jenis jasa | Program/preset Cineva | Tidak menjadi default HOTS lintas vendor |

Engine HOTS tidak perlu mengetahui Melin, Lifestyle atau Simply Juun. Ia memerlukan kontrak umum untuk field, relasi, workflow, versioning dan extension hooks. Cineva menentukan nama field/label, state policy, domain rules serta presentation brown/gold/white. Page-engine HOTS masih mendokumentasikan renderer belum diekstrak; keberadaan paket bukan bukti renderer siap.

## Gap yang tetap harus dibuktikan

Multi-tenant authorization server dan pembatasan data HQ/Creator; persistensi serta schema fisik; transaction/rollback dan idempotency untuk mutasi; server guard stale/concurrent changes; upload/deliverable storage; payment/subscription provider; local LLM dan otorisasi aksi; scheduler/reminder delivery; integrasi runtime auth/SSE/CMS/ticket/assignment. Preview/dummy/localStorage tidak membuktikan semuanya selesai. Kemampuan IAM yang sudah ada tidak otomatis membuktikan isolasi SaaS per workspace.

Prioritas upstream: (1) rebase/audit local forks terhadap reference terbaru, (2) port fix ID form unik dan export demo sebagai capability opt-in, (3) stabilkan kontrak versioning/assignment/scheduling adapters, (4) baru implementasi server Cineva menggunakan schema terverifikasi dan tes dummy. Semua upstream additive, default/fitur lama dipertahankan; pelaksanaan di Kantor oleh project pemiliknya.

Sumber yang diperiksa: Kantor `3.Knowledge/KNOWLEDGE_GRAPH.md`, package metadata/changelog/source table-engine/dynamic-form/engine-client dan page-engine README; Cineva knowledge registry, Campaign Operations, maturity dan demo offline. Ini audit source terbatas, bukan audit menyeluruh seluruh modul Kantor atau pengujian production. Tidak ada E2E baru pada tugas dokumentasi ini.
