# Pertanyaan dan jawaban client Cineva

Diperbarui: 1 November 2026 (setelah batch jawaban jam layanan, kelas project, dan langganan). Dasar: [review assessment dan DP](../architecture/client_assessment_dp_review_2026_11_01.md) dan [voice note 1 Nov](../architecture/voice_requirements_2_2026_11_01.md). Jawaban di bawah adalah **ucapan client** (diparafrase); catatan "Celah" adalah pengamatan kami, bukan keputusan. Prioritas: **P1** menentukan arsitektur, **P2** menentukan angka/aturan, **P3** bisa menyusul.

# Bagian 1. Jawaban yang sudah masuk

## A. Estimasi biaya produksi

| No | Jawaban client | Celah / dampak |
|---|---|---|
| A1 | Rate beda per orang. Minimum untuk 6 jam kerja: Videografer dan Fotografer mulai Rp700 rb, Editor Basic mulai Rp500 rb, Editor Profesional mulai Rp1 jt. Paket komersial **Basic / Compact / Premium** dilampirkan setelah deal resmi menurut budget dan kebutuhan. | Rate per orang dengan batas minimum per peran; paket adalah label komersial, bukan paket jam. |
| A2 | Kelebihan di bawah 1 jam dikenai setengah biaya; di atas 30 menit dihitung 1 jam. Foto/video Rp100 rb per jam. Editor: change fee Rp500 rb bila revisi melebihi 3 kali. | Tafsiran kami: sampai 30 menit Rp50 rb, lebih dari itu Rp100 rb. Perlu konfirmasi. |
| A3 | Setup adalah bagian layanan; jatah 10 sampai 15 menit (pemasangan dan pembongkaran). | Per sesi atau masing-masing? (L2) |
| A4 | Editor Basic dan Compact standby; Sabtu/Minggu tambahan Rp100 sampai 300 rb per project; rate weekday Rp200 sampai 500 rb. Editor Profesional tidak standby; bila project masuk minimal Rp1 jt (Compact dan Premium). Jam buka: Jumat sampai 15.00, Sabtu sampai 11.00. | Arti "rate weekday Rp200 sampai 500 rb" belum jelas (L1). |
| A5 | RAB detail hanya lewat konsultasi langsung. Web menyediakan perhitungan instan **campaign kreator/buzzer**. Production: hanya jumlah kru, rekomendasi kru, dan benefit jika client menulis nominal budget. | Arah production adalah budget ke komposisi kru. |

## B. Timeline Creator

| No | Jawaban client | Celah / dampak |
|---|---|---|
| B1 | Submit tertutup setelah timeline. Terbuka hanya bila admin/petugas Cineva menyetujui; Creator wajib mengisi alasan pada form pengajuan submit keterlambatan. | Alur: tertutup, diajukan, disetujui/ditolak. |
| B2 | Tidak ada satu angka standar. Campaign 2 minggu sampai 5 bulan. Reguler bulanan: dealing dan approval talent 1 minggu; barang dan kirim sekitar 1 minggu; membuat konten 3 sampai 4 hari (bisa 1 minggu). Non-barang: 30 hari dari cari talent sampai beres. Payment menambah maksimal 14 hari kerja (Sabtu/Minggu/libur nasional tidak dihitung). Kru dibayar H+1 sampai H+14 setelah project selesai. | Butuh template tahap per campaign dan tabel libur nasional. |
| B3 | Campaign marketing creator: PIC campaign memperpanjang. Produksi: Account Manager Produksi bersama Director dan client ("semua keputusan di Clients"). Alasan: sakit, bencana alam, krisis digital, dan sejenisnya. Biasanya berujung replace creator / change kru. | Persetujuan bertingkat; alur penggantian belum ditentukan. |

## C. Kualitas akun dan grade

| No | Jawaban client | Celah / dampak |
|---|---|---|
| C1 | Data lengkap dari database. Perubahan username harus disinkron otomatis ke sosial media: database ikut berubah, termasuk followers dan Engagement Rate. | Butuh ID akun tetap, izin pemilik akun atau penyedia data, dan job terjadwal. |
| C2 | **Tier** (followers): Nano 1 sampai 9,9K; Mikro 10K sampai 99,9K; Makro lebih dari 100K; Mega lebih dari 1 juta. **Grade** (engagement rate): 0 sampai 4% Grade B/C; lebih dari 7% Grade A; lebih dari 20% Premium. Rata-rata likes terlihat dari rumus ER di Assessment. Perhitungan sama untuk performa 1 postingan; ER keseluruhan dari **10 postingan terakhir**. | Celah: rentang 4 sampai 7% tidak punya grade; pemisah B dan C belum ada; batas atas Makro belum tegas (N1, N2). |
| C3 | Kualitas konten memakai **median**; ER keseluruhan memakai **mean**. | ER mana yang dipakai grade belum jelas (N1). |
| C4 | "Itu rumus yang dibutuhkan menghitung ER dan masuk kategori standart hingga awesome." | Aturan penanda Periksa (angka tidak cocok) belum dijawab; label "standart sampai awesome" belum dipetakan (N2, N3). |
| C5 | Crew: client mengisi feedback performa setelah project. Ada penilaian mingguan, bulanan, tahunan oleh founder Cineva / kepala divisi. | Butir dan skala penilaian belum ada (N4). |
| C6 | Production harus Full HD dan 4K. Konten sosmed Creator minimal 1080 dan tetap clean. | Arti "clean" belum didefinisikan (N5). |

## D. DP, pembatalan, pembayaran

| No | Jawaban client | Celah / dampak |
|---|---|---|
| D1 | Brand membayar ke **Cineva**; Cineva menghitung RAB dan menerbitkan invoice. | Cineva menjadi perantara uang. Finance saat ini hanya HQ ke Creator. |
| D2 | Barter: Brand deposit minimal Rp1 jt, nominal produk yang diberikan dicatat, dikembalikan setelah selesai; ditambah **TOR / MOU**. | Deposit tetap atau naik mengikuti nilai produk? (N8) |
| D3 | Pembayaran 30 sampai 50% (paling lambat H-3) bila deal mengambil jasa Cineva; pelunasan H+3 sampai 7 hari maksimal setelah pengiriman data selesai. | Kapan 30% dan kapan 50% belum jelas (N7). |
| D4 | Berlaku dua arah. Pembatalan dikenai **15%**, baik ke Cineva maupun ke creator, berbentuk transfer. Talent/kru yang tidak memenuhi kewajiban dan menimbulkan kerugian barang mengganti nominal barang. | 15% dari apa dan dibayar ke siapa belum jelas (N6). |
| D5 | Semua pembayaran antar partner (creator/vendor) dilakukan oleh Cineva. DP **hangus** secara sistem saat batal. | Hubungan "DP hangus" dengan "15%" belum jelas (N6). |
| D6 | Ada simulasi, tetapi hanya **1 kali** gratis; lebih dari itu dikenai change fee (jika otomatis). Saat DP masuk, client diarahkan menghubungi penanggung jawab Cineva. | Tanpa payment gateway untuk alur DP; jumlah change fee belum ada (N9, N10). |

## E. Langganan dan produk

| No | Jawaban client | Celah / dampak |
|---|---|---|
| E1 | Dua produk: **CAPEXA** (Budgeting) dan **CIN-PACT** (KOL). | Domain dan akun belum jelas (N14). |
| E2 | CAPEXA: Rp50 rb/bulan (Basic), Rp150 rb/bulan (Profesional). CIN-PACT: Rp20 rb/bulan (Basic), Rp50 rb/bulan (Profesional). Pembagian fitur Basic/Pro diserahkan ke kami. **Kode referral: gratis 1 bulan.** | Cara bayar langganan dan aturan referral belum jelas (N9, N11, N12). |
| E3 | Watermark aplikasi dan **approval Tim**. | Yang diunduh dan siapa menyetujui belum jelas (N13). |
| E4 | Tim Cineva menagih lewat Lark / WhatsApp. | Di luar aplikasi. Selesai. |
| E5 | Admin boleh menolak pilihan Brand bila budget tidak masuk, lalu menyesuaikan dengan Creator/kru yang cocok. | Selesai. Perlu alur "penyesuaian". |

## F. RAB

| No | Jawaban client | Celah / dampak |
|---|---|---|
| F1 | Disesuaikan kebutuhan; diekspor dari sheet offline yang dibuat Cineva. | RAB tidak dihitung di aplikasi. |
| F2 | Sama seperti F1. | Apakah file RAB diunggah ke aplikasi (N15). |

## G. Jam layanan, biaya tambahan, dan posisi aplikasi (batch terbaru)

| No | Jawaban client | Celah / dampak |
|---|---|---|
| G1 | Jam usaha WhatsApp Business: Senin sampai Kamis 09.00-17.00, Jumat 09.00-15.00, Sabtu dan Minggu tutup. Instruksi yang berlaku untuk sistem: **konsultasi dan operasional layanan 09.00-18.00**; jadwal shoot dan event **mengikuti project**, dihitung per project. | Jam layanan hanya berlaku untuk konsultasi dan admin; booking kru tidak dikunci jam usaha. Jam editor Sabtu (A4) dianggap tetap. |
| G2 | Kelas project dari **total budget**: kecil di bawah Rp5 jt; sedang di atas Rp5 jt; profesional di atas Rp100 jt. Biaya tambahan: kecil Rp100-300 rb; sedang mulai Rp300 rb; profesional dibahas dengan tim dan klien. | Menggantikan pemahaman awal (Rp100 rb untuk project kecil, Rp300 rb untuk event). Rincian per peran dan per jam belum ada (N51). |
| G3 | Di luar jam kerja ada **biaya operasional**; permintaan di luar jam kerja berarti jadwal ulang. | Besaran dan aturan jadwal ulang belum ada (N51). |
| G4 | Harga langganan aplikasi **ditetapkan Cineva**; Brand hanya menetapkan budget bila memakai jasa Cineva, bukan untuk aplikasinya. | Menjawab sebagian N33. |
| G5 | Aplikasi untuk orang yang mau bekerja sama dengan Cineva: pengalaman dari web dahulu, lalu pada produksi atau campaign memakai tools untuk biaya marketing. Analoginya CapCut, tetapi untuk budgeting dan perencanaan produksi guna memaksimalkan budget bersama layanan Cineva. | CAPEXA cukup jelas; CIN-PACT belum (N30). |
| G6 | Langganan boleh untuk **calon klien baru dan klien lama**. Tools masuk tahap berbayar setelah ada pembahasan RAB dan layanan lanjutan, dan **meeting sudah di atas 3 kali**. | Apakah memicu penagihan atau akses, dan siapa mencatat meeting, belum jelas (N52). |


## H. Batch jawaban 2 November 2026 (rate card, timeline, grade, pembayaran, produk)

Jawaban client dipetakan ke ID pertanyaan. Screenshot sheet KOL (kolom No, Nama KOL, Link socmed, Tier, SOW, Produk, Domisili, Rate, Status "Locked") dipakai sebagai bukti; nama KOL tidak disalin ke knowledge. Link Google Sheets dari client belum dibuka. Status: **Tuntas** / **Sebagian** (masih ada celah) / **Konflik** (bertentangan dengan jawaban atau fakta sebelumnya).

| ID | Jawaban client (parafrase) | Status | Catatan |
|---|---|---|---|
| L5, N37, N22 | Rate bukan tabel tetap: berasal dari total estimasi budget client atau kesepakatan antara PIC dan client. Pengajuan awal: Nano Rp300 rb, Mikro Rp700 rb, Makro di atas Rp800 rb. Sheet yang dikirim adalah sumbernya. | Sebagian | Screenshot menunjukkan nilai "Locked" yang berbeda dari pengajuan awal (Upper/Lower Micro Rp650 rb, Lower Macro Rp700 rb, Nano Reels Rp300 rb, Nano VT Rp250 rb). Jadi pengajuan awal adalah titik awal negosiasi, rate final per orang per SOW. Belum dijawab: fee KOL atau harga ke Brand, output total atau range. |
| N38 | Tidak dijawab langsung. | Terbuka | Screenshot hanya memuat 1 Reels dan 1 VT. |
| N40 | Tidak dijawab. | Terbuka | Pada sampel screenshot, Nano VT sama (Rp250 rb) di Jogja dan Bandung, jadi tidak terlihat pengaruh domisili. Ini inferensi, bukan jawaban. |
| N10, N21, N51 | Tidak dijawab. | Terbuka | |
| L21, N6 | PIC bertanggung jawab atas setiap project atau campaign. Bila kru atau tim batal: wajib mencarikan pengganti, menanggung biaya pergantian produk (jika ada), dan membayar denda **15% dari total fee yang mereka terima**. Bila client batal: DP hangus. | Sebagian | "15% dari apa" terjawab (total fee kru). Belum: denda dibayar ke siapa, siapa memutuskan pihak bersalah, arti "maks 7 hari". |
| N7 | DP dipakai untuk membooking jadwal/timeline; bila batal, hangus. | Sebagian | Penentu 30% atau 50% dan pembatalan otomatis di H-3 belum eksplisit. |
| N17, N18, L11, N20 | Jadwal timeline semuanya sudah ada. | Terbuka | Tidak menjawab aksi yang dikunci, urutan tahap, jumlah submit terlambat, maupun kalender production. |
| N27 | ACC konten atau hasil shoot: **client pemegang utama**, tetap ada kesepakatan owner Cineva. | Tuntas | Persetujuan dua lapis, client utama. |
| N28 | Perpanjangan hanya 1 kali, tambahan 2 hari. | Tuntas | Anggap total 2 hari, sekali pengajuan. Cakupan (per tahap atau per campaign) tidak disebut. |
| N41, N42, N44, N45 | Data campaign mengikuti kebutuhan brand, sehingga sheet berbeda per campaign. Yang boleh melihat: client dan Cineva, setelah creator mengisi data kerja sama. Data dilindungi tim Cineva. Client dilarang bekerja sama dengan pihak di luar Cineva memakai data Cineva. Kendala diinfokan otomatis dari pengajuan. | Sebagian | Syarat per campaign dikonfigurasi (batas usia dan lainnya tetap perlu nilai). Belum: kunci pendaftar ganda, masa simpan data, persetujuan eksplisit, konfirmasi legal, siapa mengisi ACC/REJECT dan alasan penolakan. |
| N1, N2, N24, N25 | "Jika ER di atas 7% Premium, 5% Grade A, di bawahnya Grade C dan B." | **Konflik** | Lihat K1. Rumus ER yang dipakai, isi "Total Engagements", dan label "standart sampai awesome" belum dijawab. |
| N3 | "Periksa" dipakai untuk pengecekan hasil kerja kru atau creator: status on check, client approval, ACC atau reject menurut brief. | Tuntas (arti berubah) | Lihat K2. |
| N4 | Tidak dijawab. | Terbuka | |
| L22 | Assessment = hasil final yang diterima client: seluruh campaign dari awal sampai penilaian performa akun, kinerja tim/creator, dan feedback client (lanjut kerja sama atau tidak). Per brand ada satu master rekap. | Tuntas | Master per brand; berisi level campaign, akun, tim, dan feedback. |
| L24 | Sementara data diupdate manual oleh tim Cineva; nanti baru membayar jasa pihak ketiga untuk otomatisasi. | Tuntas | Tanpa izin akun Creator saat ini; sinkron otomatis ditunda. |
| N26 | ER Reach dan Impression: perlu semua. | Tuntas (dengan akibat) | Lihat K4. |
| L25 | Tidak dijawab. | Terbuka | |
| N39 | Normalisasi otomatis boleh dan wajib bila tidak memenuhi kriteria atau data diisi asal. | Tuntas | Kriteria batas nilai tetap perlu angka (terkait N3 versi lama). |
| N30 | CAPEXA = alat perhitungan estimasi production/project. CIN-PACT = tools pengerjaan dari estimasi budget yang sudah disepakati. | **Konflik** | Lihat K3. |
| N31 | Sistem tertutup. | Sebagian | Cara akun dibuat dan referral belum rinci. |
| N12, N32, N33 | Basic untuk pengalaman awal sebagai daya tarik kerja sama. PH (production house) memiliki tools perhitungan budget dan sistem kerja otomatis. Trial: fitur profesional (seperti standard, pro, ultra pada CapCut). Fitur premium aktif selama project berlangsung dan kembali normal setelah selesai. Harga dan diskon paket: "berlaku selama masa percobaan web". | Sebagian | Pembagian fitur tetap perlu mock visual. Harga paket 1/3/12 bulan dan angka promo referral belum jelas. Trial otomatis dan sekali per Brand belum eksplisit. |
| N52 | Tidak dijawab langsung. Premium aktif selama project, lalu kembali ke tier normal. | Terbuka | |
| N35 | Boleh hanya ditampilkan di web. | Tuntas | Tanpa unduh. |
| N34 | Tanpa respons, transaksi dibatalkan; bila e-wallet tersangkut, dikembalikan otomatis. Penyedia pembayaran tidak disebut. | Sebagian | Nama penyedia dan tenggang belum ada. |
| N19 | Pada campaign creator, insight dan post tayang wajib sebelum pengajuan payment. | Tuntas | |
| N43 | Payment dilakukan setelah semua kewajiban creator terpenuhi. | Tuntas | Tidak menyebut hitungan hari; pakai aturan 14 hari kerja yang lama (B2). |
| N29 | S&K payment per client dan jendela bayar kru disimpan sebagai pengaturan; Cineva memegang kendali tanpa perlu persetujuan client. | Tuntas | |
| N36 | Dana talangan disetujui owner dari pihak finance. | Tuntas | Batas nominal per kasus belum disebut. |

Hitungan setelah batch: **13 tuntas** (L22, L24, N3, N19, N26, N27, N28, N29, N35, N36, N39, N43, plus N31 sebagai keputusan tertutup), **31 masih terbuka**, termasuk sekitar 14 yang terjawab sebagian. Bagian 2 di bawah adalah daftar sebelum batch ini; untuk status terkini gunakan tabel H.

### Konflik dan temuan yang perlu dikonfirmasi

- **K1 Ambang grade.** Jawaban 2 Nov: di atas 7% Premium, 5% Grade A, di bawah itu C dan B. Jawaban C2 sebelumnya: di atas 7% Grade A, di atas 20% Premium, 0 sampai 4% B/C. Dua versi berbeda, dan keduanya tetap menyisakan celah (5 sampai 7%, 4 sampai 5%, pemisah B dan C). Jangan implementasi sebelum client menegaskan satu tabel.
- **K2 Arti "Periksa".** Kami memakainya sebagai penanda angka tidak saling cocok. Client memakainya sebagai status review hasil kerja. Dua konsep: status approval (alur kerja) dan validasi data (aturan normalisasi N39) harus dipisah.
- **K3 CAPEXA dan CIN-PACT.** Jawaban 2 Nov mendefinisikan keduanya sebagai alat estimasi dan alat pengerjaan. Jawaban E1 dan G5 sebelumnya menyebut CIN-PACT sebagai KOL. Deskripsi desain di paste terakhir memuat anggaran film, ROI, dan audience engagement, serta palet deep navy/emas, sedangkan tema vendor Cineva adalah coklat/emas/putih (AGENTS.md) dan client sebelumnya meminta style Cineva yang sekarang. Deskripsi itu tidak diadopsi sampai client memastikan.
- **K4 ER Reach dan Impression.** Client menyatakan keduanya diperlukan, padahal reach dan impression bukan data publik dan sinkron otomatis ditunda. Akibatnya Creator atau tim Cineva harus memasukkan data insight (misalnya dari screenshot), dengan pembersihan data wajib (N39).
- **K5 Rate.** Rate adalah hasil negosiasi per orang per SOW (status Locked), bukan tabel tarif per tier. Kalkulator instan hanya bisa memberi rentang awal (Nano Rp300 rb, Mikro Rp700 rb, Makro di atas Rp800 rb), bukan harga final.

### Implementasi bagian non-konflik (2 Nov 2026)

Hanya jawaban yang tidak bertentangan yang diterapkan; K1 (ambang grade), K2, K3 dan K4 sengaja tidak disentuh. Logika generik masuk package (tambahan additive, semua aturan berupa parameter), angka client tetap data di Cineva:

| Jawaban | Package (Kantor 1.Frontend/packages, disalin ke snapshot Cineva) | Cineva |
|---|---|---|
| N28 perpanjangan 1 kali, 2 hari | `@hots/scheduling-kit` 0.3.0: `evaluateExtension` (maxTotalDays, maxRequests, proof) | `cineva-campaigns/stages.ts`: `defaultExtensionRules = { maxTotalDays: 2, maxRequests: 1 }` |
| B2 hari kerja | `@hots/scheduling-kit` 0.3.0: `addWorkingDays`, `isWorkingDay` (daftar libur wajib eksplisit) | `cineva-services/rules.ts` mendelegasikan; daftar libur tetap belum diisi client |
| D4/D5/N6 pembatalan | `@hots/domain-kit` 0.2.0: `evaluateCancellation` | `cineva-services/policies.ts`: client batal = DP hangus; kru/creator batal = pengganti + biaya produk + 15% total fee. Penerima denda sengaja kosong |
| N27 ACC, N19/N43 syarat payment | `@hots/domain-kit` 0.2.0: `evaluateGate` | kunci `client`+`owner`; `post_live`+`insight_submitted`+`obligations_complete` |
| L5/N37 rate | tanpa package | `defaultKolRateCard`: estimasi awal Nano 300 rb, Mikro 700 rb, Makro di atas 800 rb; Makro tanpa batas atas jadi `openEnded`; label sheet dipetakan lewat alias; bukan harga final |
| N39 normalisasi | tanpa package | `normalizeMetric`: koma desimal, %, K/M; status `out_of_range`. Aturan pemisah adalah asumsi tim |

**Keputusan 2 Nov (pemilik proyek):** K3 sisi desain selesai: tampilan mengikuti Cineva yang berjalan (coklat/emas/putih); palet navy tidak dipakai. Arti fungsi CAPEXA dan CIN-PACT tetap mengikuti jawaban client terbaru (estimasi dan alat pengerjaan) sampai dikonfirmasi.

**Pemasangan UI (2 Nov, preview dummy, tanpa backend/DB):** estimator HQ memuat kartu estimasi KOL dan simulasi pembatalan; `FinancePanel` menampilkan syarat payout dan `requestPayout` menolak pengajuan bila syarat kurang (juga di guard repository); QC memerlukan dua persetujuan (`client` dan `owner`, disimpan pada review sebagai `approvals`; review lama tanpa field tetap terbaca); `CampaignDesk` memuat `StagePlanPanel` (kalender tahap, daftar libur diisi HQ, perpanjangan 1 kali 2 hari; `Campaign.stagePlan` opsional); insight menerima angka berformat (1.200, 12K) dengan penanda tidak terbaca. Penjelasan pertanyaan untuk client: [PENJELASAN_PERTANYAAN_CLIENT_2026_11_02.md](PENJELASAN_PERTANYAAN_CLIENT_2026_11_02.md).

Tes: scheduling-kit 27 (Kantor dan Cineva), domain-kit 21 (Kantor dan Cineva), fitur Cineva 27 lulus, 1 todo (pembulatan lembur A2, belum dijawab). Typecheck file yang disentuh bersih. Belum diverifikasi: build Vite penuh, UI, dan penerapan ke backend/DB.

## I. Batch jawaban 3 November 2026

| ID | Jawaban client (parafrase) | Status | Catatan |
|---|---|---|---|
| K1 | "Perhitungannya yang kemarin saya screenshot." | Terbuka | Gambar skala dari pemilik proyek (3 Nov) menunjukkan potongan umum "Standar Persentase ER yang Baik" (sumber tertera Dealls): kurang dari 1% Low, 1-3% Average/Good, 3-6% High, lebih dari 6% Very High. Ini skala industri umum, bukan tabel grade Cineva; angkanya mirip tetapi tidak sama dengan ambang client (Premium di atas 7%, A sekitar 5%). Screenshot asli tidak ada di repo (hanya deskripsi di [review 1 Nov](../architecture/client_assessment_dp_review_2026_11_01.md)). Skala di screenshot (Low kurang dari 1%, Average 1-3%, High 3-6%, Very High lebih dari 6%) berbeda dari kedua versi ambang grade. Perlu satu pertanyaan ya/tidak: apakah Very High, High, Average, Low = Premium, A, B, C? |
| N6 | Kru yang membatalkan membayar denda bila sebelumnya menyanggupi. Alasan penting (kecelakaan, sakit, dan sejenisnya) boleh membatalkan. Pihak yang salah diputuskan PIC Campaign (campaign) atau Account Manager Produksi (produksi); persetujuan akhir owner. Bencana alam atau di luar kendali manusia didiskusikan: biasanya jadwal mundur atau pengembalian setengah dari total yang dibayarkan. | Sebagian | Diterapkan di `defaultCancellationPolicy` (alasan `not_committed`, `valid_reason`, `force_majeure`) dan simulator. Belum dijawab: denda dibayar ke siapa, apakah brand yang batal juga kena 15%, arti "maks 7 hari". Alasan penting tetap dikenai biaya pergantian produk (tafsiran tim). |
| N17 | Sistem buka-tutup mengikuti timeline terjadwal; submit draft yang melewati batas timeline otomatis tidak berfungsi. | Sebagian | Hanya draft yang disebut. Belum diterapkan di UI karena jalur pengajuan submit terlambat (B1, L11) belum lengkap; mengunci tanpa jalur buka akan membuat Creator macet. |
| N18, L11, N38 | Tidak dijawab (jawaban nomor 6 dipakai untuk N17). | Terbuka | |
| A2 | "Sudah dijawab kemarin." Aturan A2: di bawah 1 jam setengah biaya, di atas 30 menit dihitung 1 jam, Rp100 rb per jam. | Diterapkan dengan tafsiran | `overtimeBillableHours`: jam penuh dihitung penuh, sisa 1-30 menit = 0,5 jam, sisa lebih dari 30 menit = 1 jam (70 menit = 1,5 jam; 100 menit = 2 jam). Ambang 30 menit adalah parameter. |
| N51 | "Sudah dijawab kemarin" (G2). | Dianggap selesai | Rentang per kelas dan "mulai Rp300 rb" tetap sebagai konfigurasi; per orang atau per tim, batas atas sedang, dan tabel pita (N53) tidak dijawab dan tidak ditanya lagi. |
| N4 | Butir penilaian tergantung penanggung jawab project atau program. | Tuntas (konfigurasi) | Form penilaian crew harus dapat dikonfigurasi per project/program oleh PIC; pemetaan nilai ke grade belum ada. |

# Bagian 2. Pertanyaan yang masih terbuka (daftar sebelum batch 2 Nov)

Total 44 pertanyaan terbuka: P1 20, P2 22, P3 2. Dari total 79 (L1-L27, N1-N52), 35 sudah tuntas. Daftar ini sama dengan dokumen kuesioner live dan file Excel sisa pertanyaan.

## Estimasi dan rate (8)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| L5 | P1 | Perhitungan instan campaign kreator/buzzer: file atau screenshot rate card mana yang dimaksud, input apa (jumlah talent, tier, platform, deliverable), dan output apa (total atau range)? | Database rate card sudah ada offline. Sheet daftar KOL menunjukkan tarif per paket: 1 Reels Rp500 rb; 1 VT Rp200-500 rb; 1 Reels + 1 VT Rp450 rb sampai 1 jt. | Talent per tier x deliverable; output berupa range per tier dan SOW |
| N37 | P1 | "Rate Deal" di sheet KOL itu fee yang dibayar ke KOL atau harga ke Brand (sudah termasuk margin Cineva)? Satu angka per orang per SOW, atau tarif standar per tier? | Tarif tidak ditentukan tier saja: Lower Micro dengan 1 Reels + 1 VT berkisar Rp750 rb sampai 1 jt. | Client menjelaskan; belum ada usulan |
| N10 | P2 | Simulasi 1 kali gratis: berapa besar change fee untuk simulasi berikutnya? | Dihitung per proyek dan ditagih lewat invoice digital. | Client menentukan besar change fee |
| N21 | P2 | Penyesuaian rate saat pelunasan: siapa yang menyetujui, dan apakah perlu persetujuan client tertulis di luar aplikasi? | Rate dibicarakan ulang saat pelunasan bila ada tambahan. | Persetujuan founder; client menyetujui di luar aplikasi |
| N22 | P2 | Rate card offline: file atau screenshot yang mana, dan kolomnya apa saja (tier, platform, jenis deliverable)? | Sheet daftar KOL punya kolom tier IG, tier TikTok, domisili, SOW, dan Rate Deal. | Client mengirim file rate card final |
| N38 | P2 | Apakah SOW baku hanya "1 Reels", "1 VT", dan "1 Reels + 1 VT"? Ada SOW lain (story, feed, live, YouTube) atau tambahan (hak pakai konten)? | Sheet KOL memuat tiga SOW itu. | Tiga SOW itu sebagai awal; SOW lain ditambah lewat konfigurasi |
| N51 | P2 | Pada project kecil, apa yang menentukan biaya tambahan Rp100 rb sampai Rp300 rb (peran kru, jam, atau kesepakatan)? Apakah per jam dan per orang kru? Pada project sedang, apa batas atasnya? Bagaimana biaya di luar jam kerja dan aturan jadwal ulang? | Kelas project dari total budget: kecil di bawah Rp5 jt, sedang di atas Rp5 jt, profesional di atas Rp100 jt. Biaya tambahan: kecil Rp100-300 rb, sedang mulai Rp300 rb, profesional dibahas dengan tim dan klien. Konsultasi dan layanan 09.00-18.00; jadwal shoot mengikuti project. | Rentang ditentukan peran kru; per jam per orang; batas sedang disepakati per project |
| N40 | P3 | Apakah tarif dipengaruhi domisili atau niche? | Sheet KOL memuat 6 kota: Surabaya, Bandung, Semarang, Malang, Solo, Yogyakarta. | Tidak dipengaruhi, kecuali client menyebut |

## Timeline dan approval (7)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| L21 | P1 | Replace creator / change kru: siapa yang memulai, bagaimana nasib fee dan DP yang sudah dibayar, dan tenggat pengganti? | Sanksi bila tidak ada kejelasan; bila ada alasan, ada diskusi lebih lanjut. | Fee proporsional atas pekerjaan selesai; pengganti dapat tenggat baru |
| N17 | P1 | Aksi Creator mana yang dikunci jendela tanggal (storyline, draft, posting, insight, pengajuan payment)? | Dua template tahap ("Reguler bulanan", "Non-barang 30 hari") yang bisa diubah per campaign. | Semua aksi terkunci pada jendelanya |
| N18 | P1 | Apakah tahap harus berurutan? Storyline maksimal 5 Nov, tetapi jendela draft dibuka 1 Nov. Storyline harus disetujui dulu sebelum draft? | Contoh timeline sembilan tahap bertanggal, dari seleksi talent sampai pengajuan payment. | Storyline disetujui sebelum draft diterima |
| L11 | P2 | Pengajuan submit terlambat: berapa kali boleh, dan apa dampaknya ke grade atau payout Creator? | Admin manusia merekap yang tidak terdeteksi sistem, pada jam kerja. | Dicatat di profil Creator |
| N20 | P2 | Apakah production punya kalender tahap seperti contoh campaign kreator? | Contoh timeline yang diberikan adalah untuk campaign kreator. | Ya, dengan template terpisah |
| N27 | P2 | "Owner" yang ACC tertinggi itu siapa: pemilik Brand/client atau founder Cineva? Berlaku untuk produksi saja? | Bila owner sudah ACC, itu persetujuan tertinggi tanpa menunggu semua pihak. | Owner client untuk produksi |
| N28 | P2 | Perpanjangan "2 hari saja": sekali pengajuan atau total akumulasi? Per tahap atau per campaign? | Maksimal 2 hari; payment ikut bergeser; wajib bukti PNG, JPEG, atau teks; terpisah dari izin submit terlambat. | Total 2 hari per campaign |

## Seleksi talent dan syarat brand (4)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| N41 | P1 | Alur seleksi: pendaftar, lalu penilaian, lalu ACC/REJECT. Siapa yang mengisi ACC/REJECT (Brand atau Cineva)? Apakah ada alasan penolakan, dan apakah talent diberi tahu otomatis? PIC di "Info Job" per talent atau per campaign? | Formulir pendaftar campaign vape: 47 baris, 20 ACC, 26 REJECT, 1 belum diputuskan; semua baris berisi satu nama PIC. | Cineva mengonfirmasi pilihan Brand; alasan penolakan wajib; talent diberi tahu otomatis |
| N42 | P1 | Syarat brand vape: batas usia minimum (18 atau 21)? Wajib pengguna pod/vape, batas followers, domisili? Apakah syarat dicek otomatis per campaign? Apakah verifikasi usia dan ketentuan iklan produk ini sudah dipastikan brand atau bagian hukum? | Pendaftar berumur 20 sampai 38; satu orang berumur 20. | Syarat dikonfigurasi per campaign; batas usia mengikuti keputusan brand dan legal |
| N44 | P2 | Pendaftar ganda (orang sama, akun berbeda): kunci pencocokan nomor WhatsApp atau akun? Satu orang boleh mendaftar dengan dua akun? | 47 baris mewakili 44 orang; 3 orang muncul dua kali. | Kunci pencocokan nomor WhatsApp; satu orang satu pendaftaran |
| N45 | P2 | Data pribadi pendaftar (usia, gender, domisili, status pengguna vape): siapa yang boleh melihat, berapa lama disimpan, perlu persetujuan eksplisit? | Formulir memuat usia, gender, domisili, nomor kontak, dan status pengguna vape. | Hanya PIC dan Brand terkait; persetujuan eksplisit saat mendaftar |

## Grade dan ER (6)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| N1 | P1 | Dari lima rumus ER di screenshot, mana yang dipakai untuk grade? (Di Assessment: engagement terhadap followers 19,19% menjadi Grade A; ER by views 6,62% menjadi B atau C.) | Lima rumus: ERR (reach), ER Post (followers), ER Impression, Daily ER, ER View. ER keseluruhan memakai mean dari 10 post terakhir; kualitas konten memakai median. | ER terhadap followers untuk grade; ER by views sebagai pendamping |
| N2 | P1 | Celah ambang: rentang 4 sampai 7% masuk grade apa? Pemisah Grade B dan C? Tier lengkap dan batasnya per platform? Apa arti label "standart sampai awesome"? | Tier dari client: Nano 1-9,9K; Mikro 10-99,9K; Makro lebih dari 100K; Mega lebih dari 1 juta. Grade: 0-4% B/C; lebih dari 7% A; lebih dari 20% Premium. Sheet KOL memakai Nano, Lower Micro, Upper Micro, Lower Macro; batas Lower/Upper Micro kemungkinan 50K (disimpulkan dari data). | Client melengkapi tabel; label dipetakan ke grade |
| N24 | P1 | "Total Engagements" terdiri dari apa: likes + comments saja, atau plus shares, saves, reposts? | Angka 19,19% di Assessment cocok dengan (rata-rata likes + comments) / followers. Kode Cineva saat ini menghitung lima komponen terhadap views. | Likes + comments |
| N25 | P1 | Hubungan skala umum ER (Low kurang dari 1%, Average 1-3%, High 3-6%, Very High lebih dari 6%) dengan grade B/C, A, Premium dan label "standart sampai awesome". | Skala umum di screenshot berbeda dari ambang grade client (A di atas 7%, Premium di atas 20%). | Client memetakan skala ke grade |
| N3 | P2 | Kapan angka satu post ditandai "Periksa" (tidak saling cocok)? Batas aman rasio likes per views dan comments per likes? | Client menyebut rumus ER dan kategori "standart hingga awesome" sebagai jawabannya. Sheet KOL memuat nilai janggal (ER Instagram 98311 dan ER TikTok 140,87%). | Batas dari client atau rumus file Assessment |
| N4 | P2 | Rating crew: apa butir penilaiannya? Form penilaian mingguan, bulanan, tahunan oleh founder, dan cara menjadi grade crew (label sama dengan Creator)? | Skala 1-5; diisi client setelah payment selesai. | Rata-rata skala ke grade |

## Sinkronisasi akun dan data (5)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| L22 | P1 | Mohon kirim contoh file atau skema "Assessment Performa". Satu file master atau per campaign? Apakah berisi data per post? | Sumber data adalah assessment performa setiap campaign yang dijadikan satu. | Mulai dari file Assessment sebagai master Creator dan kru |
| L24 | P1 | Cara sinkron: Creator menghubungkan akunnya (izin), atau penyedia data pihak ketiga berbayar? | Biaya sinkron dihitung dari pembayaran bulanan pengguna. Platform: Instagram dan TikTok (YouTube hanya untuk campaign YouTube). | Creator menghubungkan akun; penyedia berbayar hanya jika perlu |
| N26 | P1 | ER Reach dan ER Impression butuh data insight milik akun (perlu diverifikasi ke dokumentasi platform). Apakah wajib (Creator harus menghubungkan akun), atau cukup ER Post dan ER View? | Followers, likes, comments, dan views bersifat publik; reach dan impression tampaknya tidak. | Cukup ER Post dan ER View |
| L25 | P2 | Bagaimana penanganan sinkron yang gagal, akun privat, atau akun dihapus? | Refresh dilakukan per 3 bulan. Username berubah: riwayat tetap tertaut dan admin diberi tahu. | Simpan data terakhir dan beri tanda tidak terbarui |
| N39 | P2 | Aturan pembersihan data: nilai seperti 98311 dan 140,87% dianggap salah dan ditandai "Periksa"? Boleh dinormalisasi otomatis (koma desimal, tanda %, satuan K dan M)? | Sheet KOL: dari 58 sel ER, 7 kosong; format campur koma dan titik; 3 tanpa tanda %. | Normalisasi otomatis; nilai di luar batas ditandai Periksa |

## DP dan pembatalan (2)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| N6 | P1 | Bila Creator atau kru yang batal: 15% dari apa (nilai deal, fee, DP) dan dibayar ke siapa? Siapa yang memutuskan pihak yang bersalah? Apa maksud "maks 7 hari" pada pembatalan Brand? | Brand batal: DP 30 atau 50% hangus (sesuai estimasi, maks 7 hari). Denda 15% berlaku dua arah. | Creator batal: 15% dari fee ke Cineva |
| N7 | P2 | DP 30% atau 50%: ditentukan oleh apa? Bila DP tidak masuk sampai H-3, deal batal otomatis? Pelunasan dihitung sejak kapan? | DP 30-50% paling lambat H-3; pelunasan H+3 sampai 7 hari setelah pengiriman data selesai. | 50% produksi, 30% campaign; batal otomatis |

## Produk dan langganan (7)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| N30 | P1 | CIN-PACT sebenarnya mengukur apa: dampak (resonansi, sentimen, skor naratif), alat KOL (tier, grade, ER, assessment akun), atau keduanya? CAPEXA mencakup apa (budget saja, atau juga realisasi dan ROI)? | Jawaban sebelumnya: CIN-PACT = KOL. Pesan terbaru: CAPEXA = Capital Expenditure by Cineva, CIN-PACT = Cineva Impact. HTML referensi memuat skor film, bukan metrik KOL. | CIN-PACT = analisis akun KOL dan dampak campaign; CAPEXA = budget dan ROI |
| N31 | P1 | Aplikasi B2B tertutup: bagaimana akun Brand dibuat (diundang atau dibuat Cineva)? Bagaimana referral berjalan di sistem tertutup? | Hanya untuk brand yang bekerja sama atau sedang di-pitching; bukan untuk umum. | Akun dibuat atau disetujui Cineva; referral berlaku untuk undangan |
| N12 | P1 | Pembagian fitur Basic dan Pro: setujui usulan setelah mock visual dibuat tim? | Client meminta divisualisasikan dulu. Harga per bulan: CAPEXA Rp50 rb dan Rp150 rb; CIN-PACT Rp20 rb dan Rp50 rb. Tampilan memakai style Cineva yang sekarang; HTML hanya referensi. | Tim membuat mock Basic dan Pro untuk dikomentari client |
| N52 | P1 | Syarat "meeting di atas 3 kali": apakah memicu penagihan langganan atau pembukaan akses tools? Dihitung mulai meeting ke-4? Siapa yang mencatat jumlah meeting? | Langganan boleh untuk calon klien baru dan klien lama. Tools masuk tahap berbayar setelah ada pembahasan RAB dan layanan lanjutan, dan meeting sudah di atas 3 kali. | Memicu penagihan; mulai meeting ke-4; dicatat PIC Cineva |
| N32 | P2 | Trial 1 minggu: otomatis saat akun dibuat? Memakai fitur Basic atau Pro? Setelah selesai tanpa bayar, akses ditutup? Sekali per Brand? | Trial 1 minggu untuk CAPEXA dan CIN-PACT. | Otomatis; fitur Pro; akses ditutup setelah trial; sekali per Brand |
| N33 | P2 | Harga dan diskon paket 1, 3, 12 bulan untuk tiap produk dan tier. Promo referral tepatnya 5% atau 10%? | Pemberi kode gratis 1 bulan; pengguna baru dapat promo 5-10% dari biaya bulanan, berlaku sekali. | Client menentukan harga dan diskon |
| N35 | P2 | RAB yang diunggah (xlsx atau pdf): apakah Brand melihatnya di dalam web (tampil saja tanpa unduh), atau hanya internal Cineva? | Semua unduhan dilarang di web; unduh dilakukan setelah ACC di luar web. | Brand melihat tampilan saja tanpa unduh |

## Pembayaran (5)

| No | P | Pertanyaan | Sudah diketahui | Usulan tim |
|---|---|---|---|---|
| N34 | P1 | Penyedia pembayaran mana yang dipakai? "Jika tidak ada respons otomatis dihentikan": respons terhadap apa, dan berapa tenggangnya? | Metode: transfer bank, e-wallet, QRIS. Penagihan otomatis dengan persetujuan pengguna. | Penyedia berizin yang mendukung ketiga metode; tenggang ditentukan client |
| N19 | P2 | Apakah insight harus sudah masuk dan post sudah tayang sebelum pengajuan payment? Bila insight telat, payment tertunda? | 14 hari kerja dihitung sejak laporan assessment rekap Cineva dan invoice disetor serta di-ACC client. | Ya, keduanya jadi syarat |
| N43 | P2 | Persetujuan payment "H+14 setelah insight" di formulir vape: hari kalender sejak insight dikirim, atau 14 hari kerja sejak rekap dan invoice di-ACC (jawaban sebelumnya)? Mana yang berlaku di campaign ini? | Formulir vape: 47 dari 47 pendaftar menyatakan bersedia. | Mengikuti aturan 14 hari kerja dari jawaban sebelumnya |
| N29 | P2 | S&K payment tiap client dan jendela bayar kru per jasa: disimpan sebagai pengaturan per client dan per jasa? Bisa dikirim daftarnya? | Libur dan aturan 14 hari kerja mengikuti S&K client; pembayaran kru tergantung jasanya. | Ya; client mengirim daftar |
| N36 | P3 | Dana talangan "jika ada case": siapa yang menyetujui dan apa batasnya? | Pembayaran kru menunggu pelunasan Brand; talangan hanya pada kasus khusus. | Persetujuan founder; batas per kasus ditentukan client |

# Bagian 3. Usulan pembagian Basic dan Pro (untuk N12)

Ini usulan kami; client menyerahkan keputusannya. Belum ada angka atau fitur final.

| Produk | Basic | Pro |
|---|---|---|
| CIN-PACT (Rp20 rb / Rp50 rb) | Cari dan filter Creator, lihat tier dan grade, profil ringkas | Assessment 10 post (mean/median, kewajaran angka), sinkron akun otomatis, riwayat performa, unduh berwatermark dengan approval |
| CAPEXA (Rp50 rb / Rp150 rb) | Perhitungan budget dasar dan template | Banyak format, versi revisi, lampiran RAB dari sheet offline, perbandingan antar versi |

# Yang perlu dibawa client

Rumus dan tabel di file Assessment (sumber panel ER dan kewajaran angka), tabel lengkap tier dan grade, contoh RAB per format, daftar rate crew, template TOR/MOU, dan contoh form penilaian crew.
