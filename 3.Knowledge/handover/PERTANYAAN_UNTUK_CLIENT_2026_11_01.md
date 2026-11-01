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


# Bagian 2. Pertanyaan yang masih terbuka

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
