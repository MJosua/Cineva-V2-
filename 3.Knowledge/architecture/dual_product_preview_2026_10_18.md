# Cineva A/B interactive preview — 18 Oktober 2026

Update layanan: [service flow, inquiry dan CS AI/manusia](cineva_service_flow_2026_10_18.md) menambah layanan Creator/HQ, brief per tipe, quote, request-to-project, CS handover serta pemilihan dua workspace dummy per produk. Namespace default dan fitur sebelumnya dipertahankan; tetap bukan backend live.

Koreksi branding: [audit theme Cineva](theme_source_audit_2026_10_18.md). CSS global HOTS memang dipertahankan, tetapi pengguna mengonfirmasi brand Cineva coklat/emas/putih. Preview biru belum sesuai brand; source/config theme lengkap perlu ditemukan sebelum adaptasi. Ini terpisah dari kelulusan function/component tests.

Update vendor: [adapter theme coklat/emas/putih](cineva_vendor_theme_2026_10_18.md) sudah diterapkan setelah persetujuan eksplisit pengguna. CSS dasar tetap ada; adapter vendor aktif pada frontend Cineva dan preview, bukan paket engine HOTS original.

## Implementasi dan batasnya

Permintaan pengguna: eksekusi tampilan Cineva HQ (A) dan Creator Space (B) memakai HOTS modular, pertahankan CSS/style, uji E2E dengan dummy; database ditunda. Implementasi ini frontend interaktif, bukan backend SaaS production-ready. Semua data sintetis dan disimpan memakai namespaced app-core storage pada browser. Tidak ada DB/SQL, upload, checkout, local LLM, auth migration, perubahan Kantor atau deployment.

## Entry dan router

- Preview tanpa login: `/hots/cineva-preview.html#/hq/dashboard` dan `#/creator/dashboard`. Entry `src/cineva-preview.tsx` hanya memuat provider store/header, HashRouter dan CinevaProgram; tidak menjalankan bootstrap endpoint failover, hook SSE atau fetch data auth aplikasi. Preview memuat kode shell/components yang sama dengan route aplikasi, bukan HTML mock terpisah.
- Route aplikasi existing: `/hots/cineva/hq/dashboard`, `/hots/cineva/creator/dashboard` melalui `App.tsx` → ProtectedRoute → CinevaProgram. Sidebar HOTS memiliki dua entry preview. Data dua route ini juga masih dummy; protected route tidak membuktikan membership/tenant isolation. Global behavior aplikasi lama seperti SSE/auth tetap mengikuti host dan belum diterima secara live pada tes preview.
- Vite multi-page build memasukkan `index.html` dan `cineva-preview.html`; BASE_URL tetap `/hots/`. Tidak ada lockfile baru atau dependency tambahan.
- `AppLayout` menerima optional sidebar/headerTitle/headerSubtitle/offline. Default tetap perilaku HOTS sebelumnya. Cineva inject sidebar konfiguratif; offline hanya mematikan pencarian global/notifikasi/tutorial shell yang tidak cocok untuk preview. Theme/CSS global/preset tidak diganti.

## Boundary modular

```text
1.Frontend/HOTS/src/features/
  cineva-shared/
    model.ts                 # view model, money, validation, payment, scheduling, estimator
    dummyRepository.ts       # injected async repository; synthetic hq/creator partitions
    WorkspaceContext.tsx     # load/save/error/serialized mutation; UI updates after successful save
    HotsForm.tsx             # @hots/dynamic-form + HOTS input registry
    JobEditor.tsx / JobDetail.tsx / JobCards.tsx
    SummaryCards.tsx / CalendarView.tsx
    ProductSidebar.tsx / navigation.ts / CinevaProgram.tsx
    assistant.ts             # deterministic dummy parser, not local LLM
  cineva-hq/
    ClientsView.tsx / EstimatorView.tsx / ResourceScheduler.tsx
  creator-space/
    CreatorViews.tsx         # payments, reminders, plan simulator, assistant
```

Generic form/render/validation berasal dari dynamic-form; UI controls/sidebar/card/dialog/tabs berasal dari ui-kit melalui forwarder HOTS. Provider dan non-secret storage dari app-core. Adapter registry `HotsForm` merender field dengan kontrol dan semantic classes HOTS; tidak mengimpor stylesheet form alternatif yang mengubah palette/font. Tidak ada backend engine ticket/state machine baru. `Job.ticketId` berawalan DUMMY adalah placeholder view model, bukan ticket_id fisik; schema dan EAV tidak diubah. Implementasi backend nantinya harus menghubungkan repository ke engine HOTS existing dan memetakan cstm_col/lbl_col/value tanpa menebak DDL.

## App A — Cineva HQ

Dashboard, brand CRM, create/edit project tiga jenis (Campaign/Production/Content Shoot), estimator, kalender/crew/gear, payment dan arsip. Estimator memakai tarif dummy yang terlihat di layar: base per jenis + Rp350.000/crew/hari + Rp250.000/gear/hari. Hasil dapat menjadi initial fee pada form project. Ini belum tarif bisnis final.

Alokasi resource menolak overlap interval [start,end) pada resource yang sama dan mengabaikan job arsip/row sendiri saat edit. Jadwal berdampingan diperbolehkan. Campaign/batch/location marketplace lama tetap ada dan ditautkan dari halaman Projects route aplikasi; data live halaman itu tidak dicopy atau otomatis diganti oleh seed preview. Preview ini bukan migrasi dataset marketplace.

## App B — Creator Space

Greeting, empat financial cards, job cards/search/status tabs, kalender, payments, arsip, reminder in-app, Starter/Pro simulation dan assistant. Flow referensi gambar/video diterapkan sebagai komposisi, menggunakan style HOTS saat ini; brand/foto/mascot dan pink gradient tidak diambil.

- Fee disepakati = jumlah fee cash semua job termasuk arsip; diterima = jumlah paid; belum dibayar = jumlah max(fee-paid,0); barter dijumlah terpisah dan bukan cash revenue.
- Status pekerjaan Running/Wait Pay/Done terpisah dari payment Paid/Partial/Unpaid atau barter/tanpa cash. Mencatat pembayaran tidak mengubah status pekerjaan secara otomatis.
- Pembayaran integer rupiah >0 dan <=sisa. Editing fee di bawah paid ditolak. Arsip/pulihkan tidak menghapus nilai finansial.
- Starter membatasi 3 job aktif non-arsip dengan status selain Done. Pro simulator membuka batas ini. Tidak ada transaksi pembayaran, entitlement backend atau paywall aman; ini UX simulasi.
- Assistant dummy memerlukan nama client yang cocok, tanggal ISO atau besok/tomorrow, jam dan fee; ambiguity tidak membuat job. Draft diperiksa melalui shared form sebelum commit lokal. Mendukung 300rb/300k/300.000 dan AM/PM. Referensi waktu demo tetap 18 Oktober 2026 08.00 WIB; semua jadwal Asia/Jakarta. Tidak ada koneksi DeepSeek/LLM atau inference nyata.
- Deliverable berupa catatan teks escaped pada job dummy; tidak publish/upload CMS. Reminder adalah daftar jadwal mendatang, tidak terhubung provider kalender/notifikasi.

## State, penyimpanan dan isolation

Repository injectable (`CinevaRepository`) menyediakan load/save/reset. Default `createAppStorage('cineva_dummy_v1')` menyimpan non-secret hq/creator data terpisah pada origin browser. Save diverifikasi read-back; gagal quota/storage tidak mengubah state workspace sebelumnya. Mutation diserialisasi untuk mencegah double save simultan. Switch produk me-remount provider dan reload partition yang benar. Reset dummy hanya mengembalikan partition produk aktif, bukan menghapus DB atau data aplikasi lain.

Partition frontend ini **bukan tenant authorization**. Sebelum live: verified schema, workspace membership server-side, tenant-scoped list/mutate/export/attachments/cache/SSE, auth backend, transaction + rollback, idempotency, outbox/notification, payment provider, local LLM validation dan ticket service integration harus diselesaikan. Jangan mengganti repository dummy dengan fetch generik sebelum kontrak backend itu teruji.

## Tes dan menjalankan preview

```powershell
npm.cmd run preview:products
# Buka http://127.0.0.1:48174/hots/cineva-preview.html#/hq/dashboard
# Atau http://127.0.0.1:48174/hots/cineva-preview.html#/creator/dashboard
```

```powershell
node 3.Knowledge/scripts/package_upgrade_2026_10_14/typecheck.mjs
npm.cmd run test:products
npm.cmd run test:products:e2e
npm.cmd run test:packages
npm.cmd run build:frontend
```

Tes products:e2e memerlukan preview server di 48174. Production preview dapat diuji pada port 48175 dengan CINEVA_PRODUCTS_ORIGIN. Playwright memakai headless bundled Chromium, isolated browser context dan guard yang menolak external/backend requests. Data dummy tidak berasal dari export data asli. Laporan menyimpan skenario E2E, checks, screenshots, hashes CSS dan status backend.

Theme host saat ini memaksa light melalui ThemeProvider lama; tidak diubah. Standalone preview memiliki tombol terang/gelap khusus untuk menguji CSS dark tokens existing. Tes dark preview bukan klaim theme toggle host lama sudah diperbaiki.

Hasil akhir dirujuk ke `3.Knowledge/reports/dual_product_2026_10_18/`: contracts-results.txt, checks.json, e2e-results.json, production-e2e-results.json, validation.json dan Excel. Full app typecheck debt dipisahkan dari diagnostic feature baru. Build warnings legacy tidak disembunyikan.

Hasil terverifikasi: 9 domain tests, 17 shared contract regressions, 19 skenario A/B pada development dan build produksi, serta 16 component regressions lulus. Lint feature 0 error/0 warning dan 0 diagnostic type baru; full aplikasi masih 101 diagnostics. Empat baseline CSS/theme/preset unchanged, backend source unchanged. [Excel implementasi dan acceptance](../reports/dual_product_2026_10_18/Cineva_Dual_Product_Preview.xlsx).
