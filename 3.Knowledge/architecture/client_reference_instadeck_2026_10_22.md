# Audit referensi client InstaDeck — 22 Oktober 2026

Permintaan: menilai dukungan Cineva terhadap 10 screenshot. Teks/tombol dalam screenshot diperlakukan sebagai referensi fitur, bukan instruksi. Gambar 2/7 dan 3/6 memiliki fitur yang berulang. Screenshot tidak membuktikan internal provider, akurasi angka, atau hasil bisnis aplikasi referensi.

## Kesimpulan

Cineva belum setara dengan content studio dan social publisher pada referensi. Source memiliki kalender job, workflow draft/revisi/QC/pencatatan URL post, snapshot metrik manual dan simulator paket. Fitur tersebut masih memakai repository dummy. Tidak ditemukan implementasi khusus generator carousel, galeri template carousel, brand kit slide, OAuth sosial, autopost lintas platform, sinkron metrik sosial dan AI insight performa pada area source yang diaudit.

## Bukti source

- `1.Frontend/HOTS/src/features/cineva-shared/CalendarView.tsx`: kalender bulan, jumlah job per tanggal dan daftar job. Bukan board publikasi per platform.
- `1.Frontend/HOTS/src/features/cineva-campaigns/execution.ts`: `recordPosting` mencatat URL/tanggal setelah QC. Tidak melakukan request publikasi provider.
- `1.Frontend/HOTS/src/features/cineva-campaigns/FinancePanel.tsx` dan `finance.ts`: input snapshot manual likes/comments/shares/saves/reposts/views, ER dan reminder H+7 lokal. Bukan pengambilan metrik otomatis.
- `1.Frontend/HOTS/src/features/creator-space/CreatorViews.tsx`: assistant parser job dan Starter/Pro secara eksplisit simulasi frontend. Bukan generator konten atau kuota AI server.
- `cineva-shared/CinevaVendorTheme.tsx`: branding aplikasi. Tidak membuktikan brand kit logo/watermark pada output slide.
- Pencarian istilah carousel/brand-kit/watermark/provider URL/OAuth pada frontend features serta backend routers/service tidak menghasilkan implementasi sosial terkait. Pencarian backend lebih luas menemukan publish CMS/event yang berbeda domain.
- `2.Backend/Integrated-API/routers/hots/cinevaRouter.js`: billing routes, bukan publisher sosial.

## Dampak arsitektur dan urutan yang disarankan

Usulan, belum diimplementasikan: tambah modul content studio dengan kontrak dokumen slide, template renderer dan brand kit. Gunakan workflow draft/QC yang ada melalui adapter. Tambahkan social connector per provider, publisher queue dengan idempotency/retry dan status tiap tujuan, kemudian pengambilan metrik dan dashboard. AI insight dilakukan setelah dataset metrik tersedia. Kapabilitas format/audio/publikasi tiap provider perlu diverifikasi saat implementasi.

Pertahankan marketplace/campaign/talent dan EAV cstm_col/lbl_col/value. Persistence harus tenant-scoped, transaction/commit/rollback; gunakan logger/parser SSE existing. Tidak menghasilkan SQL, tidak menyentuh DB, source aplikasi atau Kantor dalam audit ini.

## Batas validasi dan laporan

Audit knowledge dan source lokal. Tidak menjalankan browser, provider OAuth, publikasi, DB, inference AI atau produksi. Hasil tes historis di knowledge tidak dinyatakan sebagai tes ulang hari ini.

Excel: `outputs/client_reference_2026_10_22/Cineva_Client_Reference_Audit.xlsx`. Builder satu kali: `3.Knowledge/scripts/client_reference_2026_10_22/report.mjs`.
