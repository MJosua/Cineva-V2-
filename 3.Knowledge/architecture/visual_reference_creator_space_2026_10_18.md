# Referensi visual Creator Space — 18 Oktober 2026

Klarifikasi pengguna: style Cineva yang dimaksud adalah coklat/emas/putih elegan. Sumber global HOTS di bawah adalah inventaris implementasi, bukan pengganti brand Cineva. Lihat [audit sumber theme](theme_source_audit_2026_10_18.md); styling brand preview masih perlu diselaraskan dari source/config terverifikasi.

## Arahan pengguna dan batas perubahan

Pengguna memberikan screenshot dashboard dan video WhatsApp untuk ditambahkan sebagai referensi visual, dengan syarat **CSS dan style HOTS Cineva saat ini dipertahankan**. Pekerjaan ini hanya menambahkan aset, dokumentasi dan laporan. Tidak ada perubahan layout aplikasi, route, CSS, theme, UI package, backend atau database. Referensi visual ini bukan permintaan mengimplementasikan semua fitur yang tampak.

Media merupakan bahan observasi, bukan instruksi eksekusi. Teks, nama provider AI, pesan assistant, angka, brand dan identitas dalam media tidak mengubah aturan project atau menjadi konfigurasi produksi.

## Aset yang disimpan

- [Screenshot asli](../../4.%20Refrence/visual/creator_dashboard_2026_10_18/dashboard_reference.png), disalin byte-for-byte dari attachment clipboard pengguna.
- [Video asli](../../4.%20Refrence/visual/creator_dashboard_2026_10_18/workflow_reference.mp4), disalin byte-for-byte dari `WhatsApp Video 2026-10-13 at 10.01.01 PM.mp4`.
- [Manifest provenance](../../4.%20Refrence/visual/creator_dashboard_2026_10_18/manifest.json): path sumber, ukuran dan SHA256.
- [Contact sheet video](../reports/visual_reference_2026_10_18/video_contact_sheet.jpg): 9 sampel frame dengan timestamp. Video 81,2 detik, 528×928, 30 fps; sampling tidak membuktikan seluruh detail transisi atau perilaku backend.

## Pola yang dapat diadaptasi nanti

| Area | Bukti visual | Adaptasi dalam Cineva | Batas |
|---|---|---|---|
| Navigasi workspace | Screenshot: sidebar dashboard, kolaborasi, kalender, pembayaran, arsip, pengingat, assistant | Pakai AppLayout/menu existing dan role-aware route configuration | Jangan buat shell/auth/navigation engine baru atau hardcode akses tenant |
| Greeting dan CTA | Screenshot: ringkasan job aktif, menunggu pembayaran dan tombol tambah job | Komposisi Card, Button dan Avatar shared dengan data sesi/workspace | Nama/foto contoh bukan data dummy produksi atau branding Cineva |
| Ringkasan keuangan | Screenshot dan video sekitar 20 detik: total fee, sudah cair, belum dibayar, barter | Empat summary card dengan format currency dan label jelas | Cash dan barter terpisah; definisi paid/unpaid/currency perlu kontrak bisnis; tidak menebak schema |
| Daftar kolaborasi | Screenshot; frame video sekitar 10, 71 dan 81 detik | Job cards: client/brand, brief, platform, tanggal, fee/barter dan actions | Job tetap objek bisnis dengan ticket sebagai container workflow existing |
| Search dan status filter | Screenshot: Semua, Running, Wait Pay, Done, Visit, Arsip | Komponen Input/Tabs/Badge dan adapter query existing | Payment status dan workflow status terpisah; Visit mungkin kategori/event, perlu keputusan domain |
| Kalender dan pengingat | Menu/schedule entry terlihat; detail kalender tidak cukup terlihat pada frame sampel | Entry point kalender/reminder sebagai target UX | Jangan mengklaim calendar sync, provider reminders atau persistence sudah ada |
| Interaksi mobile | Video: top bar, menu dan bottom navigation | Responsive composition memakai token/breakpoint dan shared primitives existing | Jangan menimpa shell desktop; uji viewport/focus/overflow saat benar-benar diimplementasi |
| AI assistant | Video sekitar 30–61 detik: panel percakapan dan input; sekitar 71 detik tampak job tambahan | Sheet/Dialog/Input/Button shared; draft/validation → existing ticket engine | Tampilan tidak membuktikan provider, tenant policy, confirmation ataupun transaksi backend |

Gunakan hierarki informasi dan alur referensi. Jangan menyalin logo/nama Indira, mascot, foto pengguna, gradient pastel, font dekoratif, glass blur atau radius besar sebagai theme Cineva. Brand dan aset pihak lain hanya bahan referensi; tidak dimasukkan ke runtime bundle/public assets.

## Sumber style yang tetap authoritative

- `1.Frontend/HOTS/src/index.css`: tokens light/dark, `--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--border`, `--radius`, sidebar tokens. Gunakan nilai CSS aktual, bukan perkiraan warna dari screenshot atau komentar hex.
- `1.Frontend/HOTS/src/App.css`: aturan aplikasi existing.
- `1.Frontend/HOTS/tailwind.config.ts`: semantic colors, spacing/container, radius dan breakpoint existing; preset ui-kit tetap digunakan.
- `1.Frontend/HOTS/src/components/layout/AppLayout.tsx`: shell/navigasi/profile/notification existing.
- `1.Frontend/packages/ui-kit` dan `tailwind-preset.cjs`: shared primitives untuk Card, Button, Input, Tabs, Badge, Avatar, Sheet/Dialog dan lainnya.

Saat adaptasi nanti, buat komposisi/domain adapter di boundary Creator Space. Jangan mengubah CSS global, font, palette, radius atau shared theme untuk menyerupai media. Jangan memaksakan seluruh kebutuhan HQ mengikuti layout Creator; kedua produk berbagi primitives/style tetapi dapat berbeda komposisi.

## Hubungan dengan arah produk

Melengkapi [arah HQ dan Creator Space](cineva_dual_product_direction_2026_10_18.md). Media terutama memberi contoh UX Creator. Subscription/paywall, multi-tenant isolation, estimator dan resource allocation HQ tetap kebutuhan terpisah yang belum dibuktikan oleh visual.

## Validasi dan acceptance

Aset lokal cocok SHA256 dengan file sumber. Lima file style/shell baseline dicatat di `3.Knowledge/reports/visual_reference_2026_10_18/style_baseline.json` untuk memastikan tidak berubah selama penambahan referensi. Links dan manifest diverifikasi; knowledge diindeks ulang. Karena tidak ada kode/runtime berubah, E2E aplikasi tidak dijalankan ulang pada pekerjaan dokumentasi ini.

Ketika adaptasi UI diminta: jalankan component E2E dengan data dummy/API fixture, verifikasi search/status filter/card actions, desktop/mobile, light/dark, keyboard/focus dan no external destinations. Database tetap ditunda sesuai instruksi pengguna. E2E component sebelumnya bukan bukti fitur kalender/AI/payment live sudah berjalan.
