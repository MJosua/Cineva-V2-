# Audit sumber style Cineva — 18 Oktober 2026

Update sesudah audit: pengguna mengizinkan adaptasi aksen vendor. [Theme Cineva](cineva_vendor_theme_2026_10_18.md) kini diterapkan dari source frontend sebagai adapter; bukan hasil pengambilan konfigurasi SQL. Pernyataan preview biru di bawah adalah kondisi sebelum implementasi ini.

## Koreksi acuan branding

Pengguna menjelaskan bahwa identitas Cineva adalah **coklat, emas, putih elegan**. Pekerjaan preview A/B sebelumnya mempertahankan token global HOTS, tetapi itu belum membuktikan branding Cineva dipertahankan. Jangan menyamakan global HOTS CSS dengan product theme Cineva. Tema target sesuai arahan pengguna ini, bukan biru HOTS atau pink referensi Indira.

## Bukti source yang diverifikasi

| Lapisan | Bukti | Kesimpulan |
|---|---|---|
| Global HOTS | `1.Frontend/HOTS/src/index.css`: --primary dan --sidebar-primary 210 100% 40%, background 0 0% 98%, card putih | Token global memang biru/putih, bukan product palette coklat/emas |
| Halaman domain Cineva | `src/pages/jobmarketplace/JobMarketplaceCampaigns.tsx:54`: Button bg-[#cd9a36] hover:bg-[#b0842e] text-white | Aksen emas sudah ada pada source lokal; tidak hanya mungkin berada di SQL |
| Preview A/B | `src/cineva-preview.tsx` mengimpor index.css; new components memakai semantic primary/sidebar tokens | Preview mewarisi biru HOTS; belum memuat theme Cineva dari config/backend |
| Service settings | `src/components/admin/ServiceSettingsTab.tsx`: Theme Color dan customCss field/editor | Ada editor konfigurasi, tetapi pencarian customCss tidak menemukan consumer lain di source yang diperiksa; field tersedia bukan bukti style dieksekusi |
| CMS/dashboard | `src/pages/dashboard/panels/CMSPanel.tsx` merender HTML config.content; CMS public juga mendukung html blocks | HTML configured dapat membawa markup/style; belum membuktikan record Cineva tertentu menyimpan palette lengkap |

Tidak ada schema fisik/record DB Cineva yang dibaca dalam audit ini. Belum dapat menentukan tabel/row/function SQL yang authoritative atau menyatakan tema lengkap hanya ada/tidak ada di database. Tidak ada SQL dibuat, DB diakses, theme baru ditebak atau CSS aplikasi diubah.

## Tindak lanjut implementasi yang benar

1. Temukan konfigurasi halaman/menu/module Cineva yang aktif dan sumber style-nya. Jika authoritative style di DB, perlukan lokasi export/config atau akses read-only yang disepakati; jangan mengasumsikan nama tabel dari istilah "css sql".
2. Cocokkan palette coklat/emas/putih, font, radius, logo dan spacing existing dengan record/source sebenarnya. Aksen dua warna emas yang ditemukan tidak cukup untuk merekonstruksi seluruh brand theme.
3. Buat product-scoped theme adapter/semantic token mapping untuk A/B berdasarkan config yang diverifikasi. Pertahankan shared engines, controls dan default HOTS untuk program lain; jangan mengganti CSS global semua aplikasi agar mengejar palette satu produk.
4. Preview dummy nantinya memakai snapshot theme Cineva yang terverifikasi, bukan fetch DB/credentials. Update baseline style dan lakukan E2E/visual desktop/mobile beserta contrast/focus.

Instruksi pengguna mempertahankan style dimaknai mempertahankan **brand Cineva**, bukan membekukan warna global HOTS yang kebetulan terpakai oleh preview. Sampai sumber theme ditemukan, status branding A/B adalah **belum sesuai acuan Cineva**, meskipun feature/component tests sebelumnya lulus.
