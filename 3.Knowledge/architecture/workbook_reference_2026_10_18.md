# Workbook operasional asli sebagai referensi Cineva

Tanggal pemeriksaan: 18 Oktober 2026. Pengguna menunjuk dua workbook pada `4. Refrence` untuk referensi data asli. Pemeriksaan ini hanya membaca struktur/data/formula, memetakan kebutuhan dan menghasilkan laporan turunan. Tidak mengubah workbook sumber, source aplikasi, engine, backend, database atau HOTS Kantor. Tidak memasukkan baris asli ke preview/test dummy atau mengunjungi link pada workbook.

## Sumber dan granularitas

| Workbook | Sheet | Baris talent terpilih | Bagian lanjutan |
|---|---|---:|---|
| SIMPLY JUUN.xlsx | Assesment Simply Juun 1 | 20 (Q30:AA49) | Engagement Q52:AC72, 20 baris |
| SIMPLY JUUN.xlsx | Assesment Simply Juun 2 | 5 (Q31:AA35) | Final Progress Creator Q38:AB43, 5 baris yang harus direkonsiliasi dengan daftar terpilih, bukan dihitung sebagai cohort tambahan |
| SIMPLY JUUN.xlsx | Assesment Simply Juun 3 | 22 (Q30:AA51) | Engagement Q54:AC76, 22 baris |
| Assesment Vape IC 100.xlsx | Assesment IC 100 LIQUID 1 | 24 (Q31:AA54) | Engagement Q57:AC81, 24 baris |

Ada 71 baris pada empat daftar talent terpilih. **Ini bukan jumlah orang unik**: identitas dapat muncul kembali antar-sheet/campaign dan tabel progress/engagement adalah representasi lain dari partisipasi tersebut. Sheet bukan ID batch yang sudah terverifikasi; pemetaan campaign/batch harus menjaga konteks sumber dan tidak menggabungkan hanya berdasarkan nama brand.

Provenance, hash SHA256, extent aktual dan header/cell ranges disimpan dalam `reports/workbook_reference_2026_10_18/structure_profile.json`. Sumber diperiksa hash sebelum/sesudah pembacaan. Workbook tidak mempunyai dimension metadata yang dapat dipakai langsung oleh read-only reader, sehingga extent dihitung dari sel non-kosong, bukan dari format kosong. Ekstraksi hanya menyimpan label/koordinat, tipe/count dan formula; tidak menyalin nama talent, nomor telepon, alamat atau link pribadi ke knowledge/report.

## Mapping requirement dan gap

Nama konsep di bawah bukan schema fisik/DDL. Mapping harus menggunakan batas job/ticket/assignment existing di `jobmarketplace_knowledge.md` dan menunggu physical schema bila DB diaktifkan.

| ID | Bukti sumber | Konsep yang diperlukan | Dampak A/B dan gap sekarang |
|---|---|---|---|
| WB01 | Semua sheet R5:S12 | Brand/PIC, kategori creator, lokasi, objective, audience dan key messaging | HQ membutuhkan campaign brief marketing yang lebih kaya; B menerima ringkasan brief yang terkait assignment sendiri |
| WB02 | Product block Simply 1/3 R13:U16, Simply 2 R13:U17, IC100 R13:T17 | Katalog SKU/varian, harga acuan, pilihan produk | Product selection dan benefit per talent belum dimodelkan pada preview service flow |
| WB03 | Timeline overview dan milestone S24:T24 atau S25:T25 | Campaign/batch dan deadline Listing, Lolos, CO/pengiriman, Drafting, Posting/ACC, Insight H+7, Payment | Bukan satu tanggal shoot; perlu milestone per campaign dan progress per talent. Kalendarnya belum diimplementasikan dari workbook |
| WB04 | Semua tabel TALENT TERPILIH | Campaign participation/assignment untuk banyak talent | Satu campaign HQ mengelola banyak assignment; B melihat assignment miliknya. Jangan menyalin satu campaign menjadi satu personal job untuk semua talent |
| WB05 | Simply 2 Q30:W35 dan Q38:W43; akun platform di sheet lain | Profil talent + akun sosial per platform + follower snapshot | Instagram/TikTok/Shopee mempunyai kebutuhan berbeda. Jangan memakai satu string platform dan satu angka followers sebagai semua akun/history |
| WB06 | Budget KOL, Budget Marketing, Benefit Creator; S19:S21 atau S20:S22 | Creator fee cash, biaya marketing, benefit produk/non-cash dan basis valuasi | Fee agency/client quote, payout creator, biaya marketing, nilai produk dan checkout bukan satu ledger. Preview saat ini baru fee/paid/barter umum |
| WB07 | Simply 2 AA30:AA35; SOW menyebut CO/payment by Brand | Fulfillment produk per assignment dan pihak penanggung pembelian | Status produk terpisah dari draft/post/payment; source tidak membuktikan adanya nomor resi/carrier atau integrasi toko |
| WB08 | Simply 1 X29:Z49; Simply 3 X29:Z51; Simply 2 X38:Z43; IC100 X30:Z54 | Deliverable per platform: review, draft/drive, storyline, QC, post URL | Beberapa output per talent; output milik brand/non-posting berbeda dari publikasi di akun creator. Catatan deliverable teks sekarang belum mencukupi |
| WB09 | Simply 2 Z38:AB43 | QC content quality dan performa creator | Perlu approval/revision dan penilaian terpisah dari status pekerjaan global; kriteria/skalanya belum bisa disimpulkan dari header saja |
| WB10 | Semua AA pada tabel talent/final progress | Payout per talent: diajukan, diproses, dibayar, bukti/tanggal sesuai kontrak | Tanggal/teks pada kolom STATUS PAYMENT tidak otomatis menjadi bukti kas diterima. `Diajukan` tidak boleh dipetakan Paid |
| WB11 | Header engagement Q52:AC52, Q54:AC54, Q57:AC57 | Insight snapshot per post/platform/waktu pengambilan | Likes, comment, share, save, repost, views dan ER perlu metrics module; belum tersedia pada preview |
| WB12 | Referensi Sheet Data Progress/File Rekapan S25:S27 (varian row) | Hubungan sumber dan export/report | Sel tersebut label referensi; bukan bukti workbook/file lain sudah dibaca. Jangan mengasumsikan isi file rekapan eksternal |

Target konseptual: Brand → Campaign/Batch → Talent Assignment → Product/Fulfillment + Deliverables/QC/Post + Insight Snapshots + Creator Payout. Ticket tetap container workflow HOTS dan assignment unit operasional. Ini melengkapi jasa Production/Content Shoot, bukan menghapusnya atau membangun engine marketplace kedua.

## Definisi metrik yang benar-benar terlihat

Formula sumber `=SUM(V53:Z53)/AA53*100` dan pola baris serupa menjumlahkan LIKE, COMMENT, SHARE, SAVE, REPOST lalu membaginya dengan VIEWS. Jadi metrik ini **ER berdasarkan views**, bukan followers. Angka disimpan sebagai poin persentase (misalnya hasil 6 berarti 6%), bukan rasio 0,06; jangan mengalikan 100 dua kali ketika memformat tampilan.

Kategori engagement adalah kolom tersendiri, tetapi pemeriksaan ini tidak menemukan aturan threshold otomatis yang dapat dijadikan kontrak aplikasi. Jangan membuat kategori otomatis hanya dari beberapa contoh nilai. Data kurang/denominator kosong harus menjadi belum tersedia, bukan nol engagement atau `Infinity`.

Cache Excel dibaca dengan `data_only=True`; formula tidak dieksekusi/recalculate di Excel. Profil memeriksa ulang formula ER yang dikenali terhadap input numerik dengan toleransi 0,000001 poin persentase. Ini pemeriksaan formula terbatas, bukan pembuktian seluruh formula/native workbook feature.

## Temuan kualitas data sebelum import

| Temuan | Koordinat | Penanganan yang direncanakan |
|---|---|---|
| Simply 3 heading menyebut 20 orang tetapi ada 22 baris terisi | Q28 dan Q30:Q51 | Review roster/quota; jangan membuang dua baris atau menganggap semua baris adalah orang unik |
| Simply 2 mempunyai daftar terpilih dan final progress terpisah | Q29:AA35 dan Q37:AB43 | Rekonsiliasi identity assignment, bukan append menjadi 10 talent |
| Timeline Simply 3 overview berbeda periode dari milestone detail | S17 dibanding S24:T24 | Tandai konflik; jangan memilih tanggal otomatis dari judul atau sheet number |
| Salah satu tanggal Simply 2 berisi tahun berbeda | T25 baris teks Info Lolos, sementara S18 berperiode 2026 | Simpan raw text dan minta review sebelum tanggal menjadi deadline |
| Label FOLLOWERS pada IC100 berisi kategori teks pada 24 baris | T30 dan T31:T54 | Jangan coercion menjadi nol. Perlu mapping kategori terpisah dan follower value yang valid |
| LINK DRIVE ALL berisi DONE, bukan URL | Simply 2 Y38:Y43 | Pisahkan completion status dari attachment URL; bukan sekadar membuang sebagai link invalid |
| Link TikTok tidak mempunyai bentuk URL valid pada satu baris yang muncul di dua tabel | Simply 2 V31 dan V39 | Simpan raw, tandai validasi dan koreksi eksplisit; jangan membuka link saat audit |
| STATUS PAYMENT memuat tanggal/teks atau kosong | Kolom AA tiap tabel terkait | Bedakan payment status, paid_at dan payment evidence; jangan mengisi paid_amount tanpa sumber nominal |
| 20 cache formula menunjukkan #DIV/0! dengan denominator kosong/0 | IC100 AB58:AB77, denominator AA58:AA77 | Tampilkan ER belum tersedia, jangan mengimpor error sebagai angka |
| Satu sel ER kosong di antara 22 baris engagement | Simply 3 AB68 | Review sebabnya; tidak otomatis mengisi dari template tanpa keputusan |

Nomor WhatsApp ada yang disimpan sebagai angka dan ada yang teks. Normalizer harus memperlakukan nomor sebagai string, mempertahankan raw value, dan tidak mengarang nol awal/country code yang hilang. Harga berbentuk teks IDR/per creator perlu pemisahan amount, currency dan unit. Nilai benefit produk yang dinyatakan dalam brief tidak boleh otomatis disamakan dengan harga SKU atau cash payout.

## Tahap berikut yang didukung referensi ini

1. Siapkan modul Campaign operations: master/batch/milestone, talent roster/assignment dan akun sosial; tetap compose existing job/ticket/assignment patterns.
2. Tambahkan deliverable checklist, fulfillment produk, QC/revisi dan payout per talent; B hanya melihat datanya sendiri.
3. Tambahkan insight snapshot/ER views dan reporting dengan state belum tersedia, serta import-preview yang menampilkan mapping/error/provenance sebelum commit.

Semua implementasi/test berikut tetap memakai fixture sintetis yang menyerupai struktur, bukan nama, kontak, alamat, link atau nominal transaksi nyata. Jangan otomatis mengimpor kedua workbook ke runtime/localStorage/DB. Exact-file import dapat diidentifikasi dari hash, sheet, section dan row, tetapi identitas talent/campaign lintas versi perlu strategi rekonsiliasi tersendiri; nama saja bukan stable ID.

Hanya dokumen/profil/laporan yang ditambahkan pada pekerjaan ini, sehingga E2E aplikasi tidak dijalankan ulang dan tidak ada fitur gap di atas yang diklaim sudah diimplementasikan. Source workbook tidak diperbaiki. Re-index knowledge dilakukan tanpa memasukkan baris data pribadi ke dokumen pencarian.
