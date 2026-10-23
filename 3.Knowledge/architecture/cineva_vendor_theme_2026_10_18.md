# Theme vendor Cineva — coklat, emas dan putih

Tanggal: 18 Oktober 2026. Pengguna secara eksplisit mengizinkan penerapan aksen Cineva karena frontend ini adalah customization vendor. HOTS asli di Kantor adalah dasar/engine; tidak diedit. Fitur upstream berikutnya harus additive dan mempertahankan fitur/default lama, melalui project pemilik HOTS.

## Lapisan implementasi

- `1.Frontend/HOTS/src/features/cineva-shared/cineva-vendor.css`: adapter semantic tokens coklat hangat, antique gold, putih/ivory; scoped pada `html[data-hots-vendor="cineva"]`. Memiliki varian dark tanpa mengubah font, spacing, radius atau layout engine.
- `CinevaVendorTheme.tsx`: memasang scope pada root dengan layout effect, memulihkan scope sebelumnya saat unmount. Scope root membuat dialog/popover/mobile sheet yang diportal ke body menerima token yang sama.
- `src/App.tsx`: frontend vendor Cineva memakai adapter untuk seluruh route vendor, bukan hanya A/B. Default CSS HOTS tetap tersimpan di index.css tanpa penggantian nilai.
- `src/cineva-preview.tsx`: adapter sama pada entry dummy, termasuk toolbar preview. Tema host light-only lama tidak diubah; tombol dark hanya ada pada preview.
- `ProductSidebar.tsx`: label/switch produk memakai sidebar tokens, dan current route memakai `SidebarMenuButton.isActive` existing agar highlight benar. Tidak ada perubahan pada komponen shared/sidebar engine.
- `SummaryCards.tsx`/`JobCards.tsx`: semantic surface marker untuk aksen border emas. CSS tidak bergantung pada selector test.

## Palette dan keterbacaan

Emas `#cd9a36` dan hover `#b0842e` berasal dari aksen Campaign existing. Coklat, putih/ivory dan varian antique gold dikomposisikan sesuai arahan pengguna, bukan klaim salinan theme SQL yang belum dibaca. Exact gold dipakai sebagai aksen dekoratif; primary text/CTA memakai gold lebih gelap (`37 62% 31%`) agar putih pada tombol dan teks gold di latar terang tetap terbaca. Sidebar coklat (`26 29% 18%`) memakai teks ivory dan highlight gold terang.

Dark variant mempertahankan keluarga coklat/gold, dengan primary gold terang dan foreground coklat gelap. Destructive state tetap merah semantik dengan varian vendor yang kontras; warna emas tidak menggantikan arti error.

Khusus mobile, lapisan muted translucent bawaan sidebar diberi background sidebar vendor pada scope Cineva agar label tidak kehilangan kontras. Font, struktur, focus trap dan behavior Sheet tetap komponen existing.

## Batas arsitektur

Tidak ada DB/schema/config SQL dibaca atau ditulis. Tidak ada perubahan `D:/Kantor`, backend, shared-engine logic, package version/default, ticket/workflow/data contract. Frontend ini memakai dummy repository yang sama. Vendor theme tidak menambahkan atau menghapus fitur mesin HOTS. Jika sumber theme authoritative dari DB nantinya tersedia, mapping dapat diselaraskan melalui adapter, tanpa menanamkan brand pada engine.

## Validasi

Build produksi lulus; 19 skenario E2E A/B dijalankan pada hasil build dengan data dummy tanpa request backend/external. Suite theme memeriksa activation scope, highlight aktif, portal dialog/focus, Creator/HQ konsisten, mobile sheet, dark variant, serta fallback original HOTS saat scope dilepas.

13 pasangan warna teks/latar pada light dan 13 pada dark memenuhi target rasio >=4,5; nilai minimum yang diukur 5,3. Ini audit pasangan token yang dipilih, bukan klaim audit aksesibilitas seluruh aplikasi. Screenshot desktop/mobile/dark/dialog diperiksa. Source `index.css`, `App.css`, Tailwind config dan shared preset dipertahankan; core source fingerprints diperiksa terpisah. Full aplikasi tetap memiliki type debt 101 diagnostics; source baru tidak menambah diagnostic. Domain/shared contract tests tetap lulus.

Reproduksi: `npm.cmd run build:frontend`, jalankan `npm.cmd --prefix 1.Frontend/HOTS run preview -- --host 127.0.0.1 --port 48175 --strictPort`, kemudian `node 3.Knowledge/scripts/vendor_theme_2026_10_18/e2e.mjs`. Laporan dan screenshot berada di `3.Knowledge/reports/vendor_theme_2026_10_18/`.
