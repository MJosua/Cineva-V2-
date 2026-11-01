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

## Tahap 1 (fondasi aturan) — dikerjakan 1 Nov 2026

Berkas baru, additive, tanpa mengubah `pricing.ts`: `1.Frontend/HOTS/src/features/cineva-services/rules.ts` dan `rules.test.ts`.

- Aturan client sebagai data (`defaultServiceRules`): rate minimum per peran, jam layanan 09.00-18.00 Senin-Jumat, kelas project (5 jt, 100 jt), biaya tambahan kru, 14 hari kerja payment.
- Fungsi murni: `projectClass`, `overtimeRange`, `overtimeRate`, `isWithinServiceHours`, `isWorkingDay`, `addWorkingDays`, `paymentDueDate`.
- Nilai yang belum dijawab bernilai `null` dan fungsinya melempar galat: pita lembur per budget (N53) dan daftar libur.
- Tafsiran tim yang belum dikonfirmasi: nilai tepat Rp5 jt dan Rp100 jt dianggap sedang; hari mulai tidak dihitung pada tambah hari kerja; aturan pembulatan lembur (A2) diserahkan ke pemilik bisnis (`overtimeBillableHours`, tanda `TODO(human)`).
- Verifikasi: `node --experimental-strip-types --test HOTS/src/features/cineva-services/rules.test.ts` (8 lulus, 1 todo). Belum diverifikasi: tsc, lint, build (tanpa `node_modules`).

## Tahap 3a (kalender tahap campaign) — dikerjakan 1 Nov 2026

Berkas baru, additive: `1.Frontend/HOTS/src/features/cineva-campaigns/stages.ts` dan `stages.test.ts`. Memakai `addWorkingDays` dari Tahap 1.

- Template tahap sebagai data (`defaultStageTemplates`): "Reguler bulanan" (talent 7 hari, barang 7 hari, konten 4 hari, payment 14 hari kerja) dan "Non-barang 30 hari" (30 hari kalender, lalu payment).
- `buildStageCalendar(template, mulai, rules, perpanjangan)` menghasilkan tanggal mulai dan selesai tiap tahap secara berurutan; perpanjangan menggeser tahap itu dan semua tahap sesudahnya.
- `validateExtension`: alasan dan bukti (PNG, JPEG, atau teks) wajib, maksimal 2 hari total per campaign.
- Tafsiran tim belum dikonfirmasi: hari konten 4 (dari "3-4 hari, bisa 1 minggu"); tahap sebelum payment berupa hari kalender (L13); batas 2 hari total per campaign (N28); perpanjangan terpisah dari izin submit terlambat (L18).
- Belum ada: urutan wajib antar tahap dan aksi terkunci jendela tanggal (N17, N18), persetujuan bertingkat (B3), replace creator (L21), dan sambungan ke milestone `Campaign` yang ada.
- Tes menemukan dan memperbaiki bug validasi tanggal di `rules.ts` dan `stages.ts` (bulan 13 melempar `RangeError`).
- Verifikasi: `node --experimental-strip-types --test` pada kedua berkas tes; tsc, lint, build belum (tanpa `node_modules`).

## Tahap 2 (estimator kru berbasis budget) — dikerjakan 1 Nov 2026

Berkas baru, additive: `1.Frontend/HOTS/src/features/cineva-hq/crewEstimator.ts` dan `crewEstimator.test.ts`. `estimateBudget` dan `EstimatorView` yang ada tidak diubah.

- `minimumCrewCost`: perkiraan minimum jasa kru = jumlah x rate minimum per peran (A1) x sesi. Bukan RAB dan bukan harga final.
- `crewBudgetCoverage`: apakah total budget menutup minimum itu; `remaining` negatif berarti kurang.
- `recommendCrew`: memilih pita budget tertinggi yang tercapai dari tabel budget ke komposisi kru, lalu menyertakan kelas project dan cakupan budget.
- Tabel budget ke kru adalah milik Cineva dan belum diberikan (L6): `defaultCrewBands = null` dan `recommendCrew` melempar galat, bukan menebak. Budget di bawah pita terendah ditolak.
- Belum diputuskan client: apakah angka biaya ditampilkan ke Brand atau hanya admin (L8) dan apa arti "benefit" (L7). Karena itu modul ini hanya menghasilkan angka; penayangannya ditentukan saat tampilan dibuat.
- Verifikasi: `node --experimental-strip-types --test` (6 tes baru lulus; total 21 lulus, 1 todo). tsc, lint, build belum (tanpa `node_modules`).
