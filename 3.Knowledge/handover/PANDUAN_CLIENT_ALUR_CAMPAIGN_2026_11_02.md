# Panduan Cineva: Alur Campaign dari Awal sampai Dibayar

2 Nov 2026 · Salinan dari dokumen Claude Docs: https://claude.ai/artifact/WsqmAqrr6XXrNA6PfqwQtZ (versi dokumen bisa lebih baru). Demo: `cineva_full_demo_2026_11_02_03.html`. Referensi brief: [../reference/client_ic100/README.md](../reference/client_ic100/README.md).

## 1. Pengantar

Cineva mencatat satu campaign dari awal sampai creator dibayar, di satu tempat. Panduan ini menjelaskannya dari dua sisi: **Kantor Cineva** yang menjalankan campaign, dan **Member (creator)** yang mengerjakan, melapor, lalu dibayar.

### Dua sisi aplikasi

| Sisi | Di aplikasi disebut | Siapa | Tugas utama |
| --- | --- | --- | --- |
| Kantor Cineva | **Cineva HQ** | PIC campaign, KOL Manager, admin, owner | Membuat campaign, memilih creator, mereview, membayar |
| Member | **Creator Space** | Creator / KOL / talent | Mendaftar, mengisi alamat, setor storyline dan draft, posting, lapor insight, mengajukan pembayaran |

### Cara membuka demo

1. Buka file **cineva_full_demo_2026_11_02_03.html** dengan Chrome atau Edge. Tidak perlu internet atau login.
2. Di menu kiri bagian **BERALIH PRODUK**, klik **Cineva HQ** untuk sisi kantor, atau **Creator Space** untuk sisi member.
3. Klik **Campaign operations** (sisi HQ) atau **Assignment campaign** (sisi Creator).
4. Di atas daftar campaign ada pilihan **Workspace dummy**. Pilih **hq-1** atau **hq-2** di sisi HQ, dan **creator-1** atau **creator-2** di sisi Creator, untuk berganti akun contoh.

Semua data di demo tersimpan hanya di browser yang membukanya. Tidak ada uang, pesan, atau data yang benar-benar dikirim ke mana pun.

### Istilah penting

| Istilah | Artinya |
| --- | --- |
| Campaign | Satu pekerjaan dari brand, misalnya Campaign Vape Liquid IC 100 |
| Batch | Kelompok creator dalam satu campaign, misalnya "Talent terpilih" |
| Talent assignment | Satu creator yang ditugaskan di campaign, lengkap dengan tugasnya |
| Deliverable / output | Hasil kerja yang harus diserahkan, misalnya 1x Reels atau 1x TikTok |
| SOW | Scope of work, daftar tugas creator di campaign itu |
| Storyline | Konsep awal video: scene, visual, voice over, teks layar |
| Draft | Video jadi sebelum diposting, dikirim lewat link Google Drive |
| QC | Pemeriksaan kualitas draft oleh kantor sebelum boleh diposting |
| Insight H+7 | Angka like, komentar, share, save, repost, dan views, 7 hari setelah posting |
| Payout | Pembayaran fee ke creator |
| PIC | Penanggung jawab; PIC campaign memegang jalannya campaign |

## 2. Alur besar dari awal sampai dibayar

Satu campaign berjalan dalam 13 langkah yang bergantian antara member dan kantor. Creator baru bisa mengajukan payout setelah posting tayang, insight H+7 tercatat, dan semua draft lolos QC.

| No | Siapa | Langkah |
| --- | --- | --- |
| 1 | Member | Daftar campaign |
| 2 | Kantor | Saring pendaftar: ACC / Tolak |
| 3 | Kantor | Buat assignment + kalender tahap |
| 4 | Member | Isi alamat, pilih produk |
| 5 | Kantor | Proses dan kirim produk |
| 6 | Member | Terima produk, lapor maks 24 jam bila bermasalah |
| 7 | Member | Setor storyline |
| 8 | Kantor | Review storyline: ACC atau revisi (revisi kembali ke langkah 7) |
| 9 | Member | Kirim draft lewat link Drive |
| 10 | Kantor | QC: client + owner setuju (revisi kembali ke langkah 9) |
| 11 | Member | Posting, lalu insight H+7 |
| 12 | Member | Ajukan payout |
| 13 | Kantor | Catat payout: creator dibayar |

## 3. Alur Kantor Cineva (HQ), langkah demi langkah

Kantor menjalankan sembilan langkah, dari membuat campaign sampai mencatat pembayaran. Semua dilakukan di **Cineva HQ → Campaign operations**.

**Langkah 1. Buat campaign**

1. Klik **Buat campaign**.
2. Isi judul, brand, brief, objective, audience, dan key messaging.
3. Isi aturan per job bila perlu:
   - **Biaya per SOW**: fee untuk satu kali pengerjaan.
   - **Usia minimum**: misalnya 21 tahun.
   - **Dokumen pendaftar**: tidak perlu, legal, atau legal + KTP.
   - **ACC storyline**: wajib atau tidak.
4. Simpan. Campaign muncul sebagai tombol di daftar campaign.

**Langkah 2. Susun kalender tahap**

1. Di kartu **Kalender tahap campaign**, pilih **Template tahap**. Untuk campaign produk seperti IC 100, pilih **KOL produk (pola IC 100)**.
2. Isi **Tanggal mulai** dan, bila ada, daftar libur nasional.
3. Klik **Susun kalender tahap**.
4. Kalender tampil sebagai batang memanjang dari tanggal mulai ke tanggal akhir tiap tahap. Garis merah adalah hari ini.
5. Bila tahap sudah tertutup tetapi klien setuju dibuka lagi, isi form **Buka ulang tahap (PIC campaign)**, centang **Klien sudah menyetujui**, lalu klik **Buka ulang**.
6. Bila creator sakit atau terkena bencana, isi **Catat perpanjangan waktu**. Alasan dan bukti wajib. Tahap setelahnya ikut bergeser otomatis.

**Langkah 3. Terima dan saring pendaftar**

1. Buka kartu **Pendaftaran creator**. Semua pendaftar campaign tampil di tabel.
2. Lihat tanda di bawah nama:
   - **Ganda** (merah): username atau WhatsApp sama dengan pendaftar lain. Hampir pasti orang yang sama.
   - **Mirip** (abu-abu): hanya nama yang sama. Perlu dicek manual.
3. Isi **Nama PIC screening** di kotak atas tabel.
4. Klik **ACC** untuk menerima atau **Tolak** untuk menolak.
5. Pakai tombol filter **Semua / Baru / ACC / Ditolak** untuk melihat per status.
6. Bila pendaftar mendaftar lewat chat, klik **Input pendaftar** dan isi datanya atas nama mereka.

**Langkah 4. Masukkan creator terpilih ke campaign**

1. Klik **Tambah talent assignment**.
2. Pilih batch, creator, akun sosial, dan deliverable (misalnya 1x Reels).
3. Simpan. Kartu creator muncul di bagian **Talent assignments**.

Catatan: di demo, ACC pendaftar belum otomatis membuat assignment. Langkah 4 masih dilakukan manual.

**Langkah 5. Kirim produk**

1. Setelah creator mengisi alamat dan memilih produk, klik **Proses produk** di kartu **Pilihan produk & pemenuhan**.
2. Setelah barang sampai, creator atau kantor menandai **Tandai produk diterima**.
3. Bila creator melaporkan produk rusak, laporannya terlihat di **Alur kerja creator** langkah 2.

**Langkah 6. Review storyline**

1. Storyline yang disetor creator tampil di **Alur kerja creator** langkah 3.
2. Pilih siapa yang memberi feedback: **KOL Manager**, **Client**, atau **Zone**.
3. Tulis catatan di kotak **Feedback STL**.
4. Klik **ACC** atau **Minta revisi**. Catatan wajib diisi bila minta revisi.
5. Storyline baru dianggap lolos bila **KOL Manager** memberi ACC. ACC dari client atau zone dicatat sebagai riwayat.

**Langkah 7. QC draft dan izinkan posting**

1. Draft dari creator tampil di kartu **Deliverable & QC**.
2. Centang **persetujuan client** dan **kesepakatan owner Cineva** setelah keduanya didapat.
3. Klik **Setujui QC** untuk meloloskan, atau **Minta revisi** dengan catatan.
4. Setelah QC disetujui, creator boleh posting.

**Langkah 8. Pantau progres semua creator**

Kartu **Progres per creator** menampilkan satu baris per creator dan satu kolom per langkah. Warnanya:

| Warna | Arti |
| --- | --- |
| Coklat tua | Selesai |
| Coklat muda | Sedang berjalan |
| Merah muda | Perlu tindakan (revisi atau produk bermasalah) |
| Abu-abu | Belum mulai |

Arahkan kursor ke sel untuk melihat detailnya.

**Langkah 9. Bayar creator**

1. Di kartu **Keuangan talent dan insight**, isi **Fee cash Creator**, **Marketing**, dan **Benefit produk**, lalu klik **Simpan nominal talent**.
2. Creator mengajukan payout setelah tiga syarat terpenuhi: posting tayang, insight tercatat, dan semua deliverable lolos QC.
3. Klik **Tandai payout diproses** saat pembayaran mulai diproses.
4. Isi **Nominal payout**, **Tanggal payout**, dan **Referensi bukti payout**, lalu klik **Catat payout**.
5. Bila dibayar bertahap, klik **Pembayaran baru** untuk mencatat tahap berikutnya.
6. Terakhir, isi **Penilaian kinerja** creator untuk campaign berikutnya.

## 4. Alur Member (creator), langkah demi langkah

Creator menjalankan sembilan langkah, dari mendaftar sampai menerima fee. Semua dilakukan di **Creator Space → Assignment campaign**.

**Langkah 1. Daftar campaign**

1. Klik **Daftar campaign ini** di kartu **Pendaftaran creator**.
2. Isi nama lengkap, domisili, umur, gender, nomor WhatsApp, dan pekerjaan.
3. Isi akun Instagram dan/atau TikTok: username, jumlah followers, dan niche. Minimal satu akun.
4. Klik **Kirim pendaftaran**. Status awal **Baru**.
5. Tunggu kantor menyaring. Status berubah menjadi **ACC** atau **Ditolak**.

Yang membuat pendaftaran ditolak sistem:

- Umur di bawah syarat usia campaign.
- Nomor WhatsApp tidak valid.
- Sudah pernah mendaftar di campaign yang sama.

**Langkah 2. Isi alamat pengiriman**

Setelah terpilih, buka kartu nama Anda, lalu bagian **Alur kerja creator**.

1. Di **1. Alamat pengiriman**, isi **Nama penerima**, **Nomor telepon aktif**, dan **Alamat rumah lengkap + patokan**.
2. Klik **Simpan alamat**.

**Langkah 3. Pilih produk**

Di kartu **Pilihan produk & pemenuhan**, pilih varian di **Pilih produk campaign**. Misalnya Fresh Lemon untuk IC 100.

**Langkah 4. Terima produk dan cek kondisinya**

1. Saat paket sampai, klik **Produk sudah saya terima** di **2. Terima produk**.
2. Bila produk rusak atau salah kirim, isi keterangan, unggah foto PNG/JPEG, lalu klik **Laporkan produk tidak sesuai (maks 1x24 jam)**.
3. Lewat 24 jam setelah konfirmasi terima, laporan tidak bisa dikirim lagi.

**Langkah 5. Setor storyline**

1. Di **3. Storyline**, tulis konsep video: scene, visual, voice over, dan teks layar.
2. Klik **Setor storyline**. Status menjadi **Menunggu feedback**.
3. Bila diminta revisi, baca catatannya, perbaiki, lalu klik **Kirim revisi storyline**.
4. Bila campaign mewajibkan ACC storyline, draft baru bisa dikirim setelah KOL Manager memberi ACC.

**Langkah 6. Kirim draft video**

1. Upload video ke Google Drive campaign.
2. Di kartu **Deliverable & QC**, tempel link Drive dan catatan.
3. Klik **Kirim draft**. Status menjadi **Menunggu QC**.
4. Bila status **Perlu revisi**, perbaiki lalu kirim draft versi baru.

**Langkah 7. Posting**

1. Setelah status **QC disetujui**, posting video di akun Anda pada tanggal posting serentak.
2. Tempel link postingan dan isi **Tanggal posting (WIB)**.
3. Klik **Simpan posting**.

**Langkah 8. Lapor insight H+7**

1. Tujuh hari setelah posting, buka **Insight per deliverable**.
2. Isi like, komentar, share, save, repost, dan views, lalu **Tanggal pengambilan insight**.
3. Klik **Simpan snapshot insight**. Untuk angka terbaru, klik **Snapshot baru**. Angka lama tidak bisa diubah.

**Langkah 9. Ajukan pembayaran**

1. Di **Syarat pengajuan payout**, pastikan tiga tanda centang terpenuhi:
   - Semua posting wajib sudah tayang.
   - Insight sudah dicatat untuk setiap posting.
   - Semua deliverable Creator sudah disetujui QC.
2. Klik **Ajukan payout**. Tombol ini abu-abu selama syarat belum lengkap.
3. Pantau **Status payout**: diajukan, diproses, lalu dibayar. Riwayat transfer tampil di **Riwayat cash payout**.

## 5. Fungsi tiap tombol

Tombol dikelompokkan per kartu di layar campaign. Kolom **Siapa** menunjukkan sisi yang melihat tombol itu.

### Menu dan bagian atas

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Cineva HQ / Creator Space | Semua | Pindah antara sisi kantor dan sisi member |
| Campaign operations / Assignment campaign | HQ / Creator | Membuka layar campaign |
| Tema gelap | Semua | Mengganti tampilan terang/gelap |
| Reset dummy | Semua | Mengembalikan data workspace (project, jadwal, pembayaran umum) ke contoh awal. Data campaign tidak ikut direset |
| Workspace dummy | Semua | Berganti akun contoh: hq-1, hq-2, creator-1, creator-2 |
| Sumber data campaign | HQ | Memilih data contoh di browser, atau API percobaan (khusus tim teknis) |
| Buat campaign | HQ | Membuka form campaign baru |
| Tombol judul campaign | Semua | Membuka detail campaign itu |

### Kalender tahap campaign

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Susun kalender tahap | HQ | Membuat jadwal tahap dari template dan tanggal mulai |
| Buka ulang | HQ | Membuka lagi tahap yang sudah tertutup sampai tanggal tertentu; wajib alasan dan centang persetujuan klien |
| Simpan perpanjangan | HQ | Menambah 1–2 hari pada satu tahap karena sakit atau bencana; maksimal 2 kali per campaign |

### Pendaftaran creator

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Daftar campaign ini | Creator | Membuka form pendaftaran |
| Input pendaftar | HQ | Mendaftarkan creator atas nama mereka |
| Kirim pendaftaran | Semua | Menyimpan pendaftaran dan mengecek data ganda |
| Semua / Baru / ACC / Ditolak | HQ | Menyaring tabel per status |
| ACC | HQ | Menerima pendaftar; nama PIC screening wajib diisi |
| Tolak | HQ | Menolak pendaftar; nama PIC screening wajib diisi |

### Talent assignment

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Tambah batch | HQ | Membuat kelompok creator baru |
| Tambah talent assignment | HQ | Memasukkan creator ke campaign beserta tugasnya |
| Tambah output / deliverable | HQ | Menambah tugas baru untuk satu creator |

### Alur kerja creator

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Simpan alamat | Creator | Menyimpan alamat pengiriman produk |
| Produk sudah saya terima | Creator | Mencatat waktu produk diterima; awal hitungan 24 jam |
| Laporkan produk tidak sesuai | Creator | Melapor produk rusak atau salah kirim dengan foto, maksimal 24 jam |
| Setor storyline / Kirim revisi storyline | Creator | Mengirim konsep video untuk direview |
| ACC | HQ | Menyetujui storyline atas nama KOL Manager, Client, atau Zone |
| Minta revisi | HQ | Mengembalikan storyline dengan catatan |

### Pilihan produk & pemenuhan

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Pilih produk campaign | Creator | Memilih varian produk |
| Proses produk | HQ | Menandai produk sedang dipesan atau dikirim |
| Tandai produk diterima | Semua | Menandai barang sudah sampai |

### Deliverable & QC

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Kirim draft | Creator | Mengirim link draft video untuk QC |
| Setujui QC | HQ | Meloloskan draft; aktif setelah persetujuan client dan owner dicentang |
| Minta revisi | HQ | Mengembalikan draft dengan catatan QC |
| Simpan posting | Creator | Mencatat link dan tanggal posting setelah QC lolos |

### Keuangan talent dan insight

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Simpan nominal talent | HQ | Menetapkan fee cash, biaya marketing, dan nilai benefit produk |
| Simpan snapshot insight | Semua | Mencatat angka insight pada satu tanggal |
| Snapshot baru | Semua | Mencatat angka insight berikutnya; angka lama tetap tersimpan |
| Ajukan payout | Creator | Mengajukan pembayaran; aktif bila tiga syarat sudah centang |
| Tandai payout diproses | HQ | Menandai pembayaran sedang diproses |
| Catat payout | HQ | Mencatat nominal, tanggal, dan bukti transfer |
| Pembayaran baru | HQ | Mengosongkan form untuk mencatat pembayaran tahap berikutnya |

### Penilaian kinerja

| Tombol | Siapa | Fungsinya |
| --- | --- | --- |
| Tambah butir | HQ | Menambah kriteria penilaian campaign |
| Simpan penilaian | HQ | Menyimpan nilai, komentar, dan keputusan lanjut kerja sama dengan creator |

## 6. Contoh kasus dari tiga campaign di demo

Demo berisi tiga campaign. Hanya **Campaign Vape Liquid IC 100** yang diambil dari data client (sheet assessment, sheet progress, dan PDF brief). Dua lainnya contoh buatan untuk latihan.

| Campaign | Sumber data | Akun HQ | Creator di dalamnya |
| --- | --- | --- | --- |
| Campaign Vape Liquid IC 100 | Sheet assessment + progress + brief PDF IC 100 | hq-1 | 8 creator (Kreator IC-01 s/d IC-08), dibagi ke creator-1 dan creator-2 |
| Campaign Studio Dummy 1 | Contoh buatan | hq-1 | Kreator Dummy 1 dan 2 |
| Campaign Studio Dummy 2 | Contoh buatan | hq-2 | Kreator Dummy 1 dan 2 |

Nama, WhatsApp, alamat, dan akun creator IC 100 sengaja disamarkan karena demo dibagikan. Data brand, produk, fee, SOW, timeline, dan views insight sesuai sumber.

### Kasus A. Campaign Vape Liquid IC 100 (data asli client)

**Isi campaign di demo**

| Hal | Isi |
| --- | --- |
| Produk | Liquid saltnic 30mg 30ml, 5 rasa: Fresh Lemon, Strawberry, Grape Burst, Red Apple, Mango |
| Harga (MSRP) | Rp110.000 per botol |
| SOW | 1x Reels atau 1x TikTok (owning) + 1x checkout produk (dibayar brand) |
| Benefit creator | 1 botol liquid (nilai Rp110.000) + fee Rp100.000 |
| Budget marketing | Rp30.000 per creator |
| ACC storyline | Wajib |
| Hashtag | #IC100 #ISEENOLIMIT #StayFreshLimitless #LiquidSporty |

**Kalender tahap (sesuai sheet assessment)**

| Tahap | Tanggal |
| --- | --- |
| Listing | 7 Okt 2026 |
| Info lolos | 8 Okt 2026 |
| CO / pengiriman produk | 9–10 Okt 2026 |
| Drafting | 11–20 Okt 2026 |
| Posting serentak | 21–22 Okt 2026 |
| Insight H+7 | 23–29 Okt 2026 |
| Payment serentak | 30 Okt–11 Nov 2026 |

**Posisi tiga creator pertama saat demo dibuka**

| Creator | Akun demo | Alamat | Produk | Storyline |
| --- | --- | --- | --- | --- |
| Kreator IC-01 | creator-1 | Terisi | Diterima | ACC KOL Manager, dengan catatan "Tambahkan anti cepat gosong" |
| Kreator IC-02 | creator-2 | Terisi | Diterima | Diminta revisi oleh Client: "Sebutkan MSRP dan where to buy di akhir" |
| Kreator IC-03 | creator-1 | Terisi | Diterima | Menunggu feedback |

Kreator IC-04 sampai IC-08 belum memulai langkah apa pun.

**Coba jalankan: satu creator dari storyline sampai dibayar**

1. **Kantor, ACC storyline IC-03.** Buka Cineva HQ → Campaign operations → Campaign Vape Liquid IC 100. Di kartu Kreator IC-03, bagian 3. Storyline, pilih **KOL Manager**, tulis feedback, klik **ACC**. Di tabel Progres per creator, kolom Storyline IC-03 berubah menjadi Selesai.
2. **Creator, revisi storyline IC-02.** Pindah ke Creator Space, pilih Workspace dummy **creator-2**. Di kartu Kreator IC-02, baca catatan client, tambahkan MSRP Rp110.000 dan "Dapatkan IC 100 di vapestore terdekat", lalu klik **Kirim revisi storyline**.
3. **Creator, setor storyline IC-05.** Pilih **creator-1**. Di kartu Kreator IC-05, tulis storyline sesuai salah satu dari 9 style brief, misalnya Style 3 "Post-workout reward", lalu klik **Setor storyline**.
4. **Coba aturan wajib ACC.** Masih di IC-05, coba **Kirim draft** sebelum storyline di-ACC. Sistem menolak dengan pesan "Storyline wajib di-ACC KOL Manager sebelum menyetor draft konten".
5. **Creator, draft IC-01.** IC-01 sudah ACC storyline. Pilih produk Fresh Lemon, tempel link Drive draft, klik **Kirim draft**.
6. **Kantor, QC IC-01.** Di Cineva HQ, centang persetujuan client dan owner, klik **Setujui QC**.
7. **Creator, posting dan insight IC-01.** Isi link posting dan tanggal 21 Okt 2026, klik **Simpan posting**. Lalu isi insight, misalnya views 1.229, klik **Simpan snapshot insight**.
8. **Kantor, set fee.** Di Keuangan talent, isi fee cash Rp100.000, marketing Rp30.000, benefit produk Rp110.000. Klik **Simpan nominal talent**.
9. **Creator, ajukan payout.** Ketiga syarat sekarang centang. Klik **Ajukan payout**.
10. **Kantor, bayar.** Klik **Tandai payout diproses**, isi nominal Rp100.000, tanggal 11 Nov 2026, dan referensi bukti, lalu klik **Catat payout**. Status payout menjadi dibayar.

**Coba juga: pendaftaran dan data ganda**

Kartu Pendaftaran creator IC 100 berisi 13 pendaftar contoh: 5 ACC, 4 Ditolak, 4 Baru. **Pendaftar IC 03 (daftar ulang)** ditandai **Ganda** karena username dan WhatsApp-nya sama dengan Pendaftar IC 03. Klik **Tolak** pada salah satunya, dengan nama PIC screening diisi.

### Kasus B. Campaign Studio Dummy 1 (latihan dari awal)

Campaign ini kosong dan cocok untuk latihan langkah-langkah dasar. Akun: hq-1, creator-1, creator-2.

1. Di Cineva HQ, buka Campaign Studio Dummy 1. Kalender tahap belum ada.
2. Pilih template **Reguler bulanan**, tanggal mulai 2 Nov 2026, klik **Susun kalender tahap**. Hasilnya: talent 2–8 Nov, barang 9–15 Nov, konten 16–19 Nov, pembayaran 20 Nov–10 Des.
3. Catat izin sakit untuk tahap konten, 2 hari, dengan bukti teks "Surat dokter". Batang konten memanjang 2 hari dan pembayaran ikut bergeser.
4. Catat izin kedua. Setelah itu form izin hilang dan tertulis "Perpanjangan tersisa: 0 hari, 0 pengajuan", karena maksimal 2 kali per campaign.
5. Lanjutkan Kreator Dummy 1 dengan alur Kasus A langkah 5–10. Karena ACC storyline tidak diwajibkan di campaign ini, draft bisa langsung dikirim.

### Kasus C. Campaign Studio Dummy 2 (akun kantor lain)

Campaign ini milik **hq-2**, untuk menunjukkan bahwa tiap PIC hanya mengubah campaign miliknya.

1. Di Cineva HQ, pilih Workspace dummy **hq-1**. Campaign Studio Dummy 2 tidak tampil.
2. Ganti ke **hq-2**. Campaign Studio Dummy 2 tampil dan bisa diubah.
3. Dari sisi Creator, creator-1 dan creator-2 hanya melihat tugas miliknya sendiri, bukan data creator lain.

## 7. Aturan penting dan yang belum tersedia

### Aturan yang sudah berjalan di sistem

| Aturan | Cara sistem menerapkannya |
| --- | --- |
| Jendela tahap | Tiap tahap hanya terbuka di tanggalnya dan tertutup otomatis setelah lewat. Hanya PIC campaign yang bisa membuka ulang, dengan persetujuan klien |
| Izin sakit / bencana | Maksimal 2 kali di waktu berbeda, tiap izin paling lama 2 hari berturut-turut. Alasan dan bukti (teks, PNG, atau JPEG) wajib |
| Produk bermasalah | Laporan dengan foto maksimal 1x24 jam setelah creator menandai produk diterima |
| ACC storyline | Bila diwajibkan campaign, draft tidak bisa dikirim sebelum KOL Manager ACC |
| QC dua lapis | Draft lolos QC hanya setelah persetujuan client dan kesepakatan owner Cineva |
| Syarat payout | Posting tayang, insight tercatat, dan semua deliverable lolos QC |
| Pendaftar ganda | Username atau WhatsApp sama = Ganda. Hanya nama sama = Mirip, dicek manual |
| Syarat usia | Pendaftar di bawah usia minimum campaign ditolak sistem |
| Riwayat tidak bisa dihapus | Storyline, review, insight, dan payout hanya bisa ditambah, tidak bisa diubah atau dihapus |

### Aturan pembatalan (simulasi di Budget estimator)

- **Brand batal** tanpa alasan masuk akal: pilih DP hangus, atau denda 15% dari total nilai deal. PIC atau owner yang memilih.
- **Tim atau creator batal**: bayar 15% dari total fee, kecuali alasannya sah.
- Alasan batal wajib dilampirkan.
- Semua kewajiban diselesaikan paling lambat 7 hari kalender setelah project selesai.

### Belum tersedia di demo

- ACC pendaftar belum otomatis menjadi talent assignment; kantor masih menambahkannya manual.
- Form pendaftaran belum punya tempat upload dokumen legal atau KTP.
- Status tahap belum mengunci tombol creator; label Terbuka/Tertutup baru sebagai penanda.
- Fee untuk kru pengganti yang sakit belum diatur.
- Semua data hanya tersimpan di browser. Versi dengan database belum menyimpan alur kerja creator dan pendaftaran.

### Perlu konfirmasi dari client

- [ ] Tanggal IC 100 mana yang dipakai? Brief PDF menulis storyline 10–11 Okt dan draft 12–18 Okt; sheet assessment menulis drafting 11–20 Okt. Demo mengikuti sheet assessment.
- [ ] Brief menulis payment maksimal 14 hari kerja dengan Jumat, Sabtu, Minggu, dan libur nasional tidak dihitung. Sistem saat ini menghitung hari kerja Senin–Jumat. Apakah aturan ini khusus IC 100?
- [ ] Apakah ACC pendaftar boleh langsung membuat talent assignment secara otomatis?
