# Arah produk Cineva HQ dan Creator Space

Tambahan sumber langsung pengguna: [voice note dan requirement bertimestamp](voice_requirements_2026_10_18.md) menguatkan tiga layanan dan menambahkan kebutuhan CS AI/non-AI serta jasa videografer/fotografer. Transkrip tidak menegaskan subscription atau detail tenancy; sumber masing-masing tetap dipisahkan.

Update implementasi frontend: [preview A/B 18 Oktober](dual_product_preview_2026_10_18.md) sudah menambahkan tampilan dan alur dummy. Dokumen arah ini tetap membedakan target backend/tenant/AI nyata yang belum diimplementasikan.

Sumber: catatan Gemini yang diberikan pengguna 18 Oktober 2026. Ini target produk, bukan klaim bahwa SaaS, tenant enforcement atau endpoint AI sudah tersedia. Instruksi pengguna terakhir menunda database dan memprioritaskan kompatibilitas komponen.

Referensi UX tambahan: [screenshot dan video Creator Space](visual_reference_creator_space_2026_10_18.md). Hanya pola layout/interaksi yang menjadi acuan; CSS/style HOTS Cineva existing wajib dipertahankan.

## Fondasi yang dipertahankan

Satu backend HOTS/CMS melayani HQ B2B dan Creator Space B2C. Project/endorsement dipetakan ke ticket engine, dengan domain data/adapter Cineva; jangan membangun ticket/workflow/form/auth engine kedua. Knowledge marketplace existing menyatakan job/listing adalah objek bisnis, ticket container workflow, assignment unit pelaksanaan. Model ini tetap relevan dan tidak boleh ditimpa secara diam-diam oleh target baru.

`hots:cineva` adalah identifier yang perlu dipetakan ke konfigurasi/module existing, bukan nama tabel fisik terverifikasi. Source yang diperiksa: `2.Backend/Integrated-API/routers/engine/engineTicket.js` menyediakan POST `/create`, `/create/:moduleKey` dengan decodeTokenHT dan engineTicket.create; router ini belum menetapkan mount publik penuh dalam dokumen ini. Source router bukan kontrak schema. `routers/hots/cinevaRouter.js` saat ini berisi billing; tidak membuktikan isolasi tenant atau modul AI.

## Pemetaan kebutuhan

| Produk | Kebutuhan | Batas modular |
|---|---|---|
| Bersama | Ticket, form, status dan CMS | Shared HOTS engines + injected clients dan domain registry |
| HQ | Brand CRM, Campaign/Production/Content Shoot | Konfigurasi jenis ticket dan domain adapter; pertahankan campaign/batch/talent existing |
| HQ | Estimator crew/gear/durasi dan allocation schedule | Modul domain tersendiri di atas kontrak sumber daya; jangan memakai calc-kit supply-chain tanpa kecocokan domain |
| Creator | Dashboard kartu, kalender/reminder | Shared ui-kit/page helpers/table + domain views; timezone/workspace dari sesi |
| Creator | Subscription/paywall | Entitlement server-side dan provider adapter; UI hiding bukan access control |
| Bersama | fee_amount, paid_amount, barter_value, payment_status | Proposed domain metadata; tentukan currency, decimal precision, refund/partial payment dan authority sebelum schema |
| Creator | Natural language ke ticket | Local LLM menghasilkan draft terstruktur; validate dan authorize lalu panggil engine ticket existing |

Tenant/workspace wajib ditentukan server dari membership sesi terverifikasi, bukan dipercaya dari body/LLM. Scope mencakup read/write/search/report/export/CMS attachments/SSE/cache/background jobs. User bisa memiliki beberapa workspace; HQ tidak otomatis boleh melihat semua Creator. Running/Wait Pay/Done adalah target display/domain state; mapping ke workflow existing perlu diputuskan, dan payment status tidak boleh disamakan dengan workflow status tanpa aturan eksplisit.

## Folder target, bukan direktori implementasi baru

```text
1.Frontend/
  HOTS/src/                     # host existing; pertahankan compatibility
    platform/                   # injected clients/provider
    components/                 # shared wrappers dan domain adapters
    features/cineva-hq/          # target: CRM/projects/estimator/schedule
    features/creator-space/      # target: dashboard/calendar/finance/assistant
  dynamic-form/                 # existing shared builder/renderer
  service-form-runtime/         # existing normalization/runtime package
  packages/{app-core,engine-client,ui-kit,table-engine,page-engine}/
2.Backend/
  Integrated-API/
    routers/hots/cinevaRouter.js # existing; tambah route hanya setelah auth/tenant ready
    controller/hots_controller/engine/engineTicket.js # existing ticket entry point
    programs/cineva/             # target domain boundary, bukan sudah tersedia
      assistant/                # controller → service → local-LLM adapter
      workspace/                # verified membership/tenant policy
      finance/                  # ticket metadata + entitlement/provider adapters
  packages/transaction-kit/     # existing snapshot; belum wired
3.Knowledge/
  architecture/                 # decisions, schema provenance dan boundaries
  scripts/                      # isolated dummy fixtures/migrations/tests
  reports/                      # evidence dan Excel
```

Tidak memecah dua aplikasi deployment dahulu hanya demi layout. Tentukan konsumsi host/routes dan kebutuhan dua consumer sebelum ekstraksi UI tambahan. Package tidak mengimpor app store/config atau memanggil LLM langsung dari browser.

## Kontrak controller AI yang harus diselesaikan sebelum implementasi

Urutan: authenticate → resolve authorized workspace dan entitlement → validate text/limit → local LLM adapter dengan timeout → validate structured output → resolve client/timezone/fee/currency → validate draft → idempotent commit via existing ticket engine → emit SSE setelah commit. LLM tidak boleh menentukan user/role/tenant/service/status transition atau SQL. Jangan memanggil Express controller dengan req/res palsu; ekstrak atau gunakan service API nyata engine setelah menelusuri transaction boundaries.

Input contoh "besok jam 10 fee 300k" harus mengikat reference clock dan timezone workspace, currency serta client yang benar. Ambiguitas dikembalikan untuk klarifikasi. Provider failure/invalid JSON tidak membuat ticket. Untuk request lengkap dan tervalidasi, pembuatan otomatis boleh dilakukan sesuai policy user; bila draft perlu konfirmasi, endpoint harus membedakan draft dan commit. Idempotency key mencegah duplicate ketika retry. Local LLM inference tidak boleh menahan transaksi DB terbuka; commit memakai revalidation server-side dalam transaction + rollback.

Endpoint target dapat dibagi menjadi POST assistant/drafts dan POST assistant/tickets, tetapi path/mount final mengikuti router nyata. Belum ada controller AI/route terpasang dari pekerjaan ini; jangan menyebutnya production-ready. Sebelum core controller bisa dipasang, perlu verified workspace/membership contract, existing ticket create service input/output, EAV metadata ownership dan provider local LLM config. Menambahkan controller yang melewati syarat ini akan menghasilkan isolasi tenant palsu.

## Mengapa belum ada SQL/Prisma migration

Knowledge hanya menyediakan schema draft; schema fisik terbaru Cineva belum diberikan. Pengguna secara eksplisit menunda database. Jangan membuat ALTER TABLE `hots:cineva`, menambah Prisma baru pada backend mysql2, atau menebak nama tabel/kolom. Migration nanti harus menginventarisasi physical DDL, existing keys/foreign keys, tenant ownership/backfill/quarantine, index komposit sesuai query dan EAV contracts. Tenant tidak cukup ditambahkan sebagai empat field form. MySQL DDL tidak dapat dijanjikan rollback seperti transaksi DML.

## Acceptance nanti dengan dummy DB

Minimal dua workspace dummy dengan resource IDs mirip: cross-tenant read/update/export/attachments/SSE ditolak; client/time/fee parsed benar; missing/ambiguous entities tidak commit; provider timeout no write; duplicate retries satu ticket; mandatory engine sync failure rollback; event hanya setelah commit. Tes saat ini hanya komponen frontend dummy, sehingga belum membuktikan persyaratan ini.
