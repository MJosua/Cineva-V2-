# Peta kode Cineva dan kesenjangan terhadap requirement client (1 Nov 2026)

Dasar: pembacaan kode di komputer rumah tanpa `node_modules`. Tidak ada kode yang diubah. Requirement sumber: [pertanyaan dan jawaban client](../handover/PERTANYAAN_UNTUK_CLIENT_2026_11_01.md).

## Kondisi lingkungan

- `1.Frontend/packages` memuat 16 snapshot paket (ui-kit, table-engine, scheduling-kit, domain-kit, calc-kit, dll.); `2.Backend/packages` memuat notification-kit, tenant-server, transaction-kit. Paket sudah ada, tetapi dependensi npm (`node_modules`) belum terpasang, jadi build, lint, dan Vite tidak bisa dijalankan.
- Node v22.12 tersedia. Tes TypeScript murni tanpa dependensi dapat dijalankan dengan `node --experimental-strip-types --test <file>`: `packages/scheduling-kit/test/scheduling.test.ts` lulus 16 dari 16. Tes `content-kit` gagal (1 tes) karena dependensi belum terpasang; belum diselidiki.
- Folder `Cineva-V2-` adalah repository git. Saat catatan ini ditulis, file knowledge baru belum di-commit.

## Fitur Cineva di `1.Frontend/HOTS/src/features`

| Folder | Isi | Catatan |
|---|---|---|
| `cineva-shared` | Model `Workspace`, `Job`, `Client`, `Resource`; repositori dummy; tema vendor; cek bentrok resource | `Workspace.plan` sudah bernilai `starter` atau `pro`, cocok sebagai dasar Basic dan Pro |
| `cineva-inquiries` | Alur permintaan: submitted, reviewing, quoted, accepted; revisi quote; konversi ke Job | `accepted` adalah status akhir; `Actor.product` hanya `hq` atau `creator` |
| `cineva-services` | Katalog layanan, `pricing.ts`, editor rate card, rincian quote | `RateCard` satu tarif crew dan satu tarif gear |
| `cineva-hq` | Estimator, booking, penjadwalan resource, klien | Peran booking baru fotografer dan videografer |
| `cineva-campaigns` | Campaign, assignment, eksekusi (draft, QC, posting), keuangan | Milestone satu tenggat; keuangan berupa ledger append-only |
| `cineva-reference`, `creator-space`, `cineva-support`, `cineva-offline` | Akun referensi, ruang Creator, antrean support, demo offline | Belum dibaca rinci |

## Kesenjangan terhadap requirement

| Requirement client | Kondisi kode | Tindakan |
|---|---|---|
| Rate per peran, minimum 6 jam, lembur per jam, setup | `estimate()` = base + crew x hari x tarif tunggal + gear | Tambah konfigurasi rate per peran, aturan lembur, dan kelas project |
| Kelas project dari total budget (5 jt, 100 jt) | Tidak ada | Fungsi murni dan tabel ambang di konfigurasi |
| Jam layanan 09.00-18.00, hari kerja, libur | `scheduling.ts` hanya mendeteksi bentrok resource | Kalender kerja dan libur sebagai data |
| 14 hari kerja payment, H+1 sampai H+14 kru | Tidak ada perhitungan hari kerja | Fungsi tanggal hari kerja memakai tabel libur |
| Kalender tahap campaign, submit terlambat, perpanjangan | Milestone satu tenggat; submit tidak dikunci tanggal | Template tahap dan alur persetujuan bertingkat |
| Brand sebagai pengguna, Basic dan Premium dibuka PIC | `Actor.product` hanya `hq` dan `creator` | Perlu peran Brand dan penanda status kerja sama; tunggu N54 dan N31 |
| Tier, grade, ER 10 post, tanda Periksa | `finance.ts` menghitung ER lima komponen terhadap views | Tunggu N1, N2, N24 |
| DP, pembatalan 15%, invoice Brand ke Cineva | Job hanya punya `paid`; finance hanya HQ ke Creator | Tunggu N6 dan N34 |

## Cara verifikasi yang tersedia sekarang

Fungsi murni TypeScript baru (rate, kelas project, lembur, hari kerja) dapat diuji dengan `node --experimental-strip-types --test`. Pengecekan tipe, lint, dan tampilan baru bisa dilakukan setelah `npm.cmd --prefix 1.Frontend ci` pada komputer yang punya akses paket.
