# Requirement Cineva dari dua voice note dan satu video (1 November 2026)

Sumber di `4. Refrence/`: dua OGG WhatsApp 1 Nov 2026 (masing-masing sekitar 6 menit), dan `WhatsApp Video 2026-10-31 at 2.58.51 AM.mp4` (1:05). Teks mentah ASR dan checksum: [reports/voice_requirements_2026_11_01](../reports/voice_requirements_2026_11_01/). Hanya analisis dan pencatatan; tidak ada perubahan runtime, CSS, package atau DB.

## Provenance dan batas bukti

Transkripsi lokal: faster-whisper `small`, CPU int8, bahasa Indonesia ditetapkan, VAD aktif, audio tidak dikirim ke provider. Rata-rata avg_logprob -0,24 dan -0,25 (cukup, bukan sempurna). Teks belum diverifikasi dengan mendengar ulang. Istilah yang hampir pasti salah tangkap: "Yos/Josua/Yosua" (nama penerima pesan), "si Neva/sinema" = Cineva, "koal/QOL" = KOL, "red/RED card" kemungkinan **rate card**, "kru" = crew, "to credital" (00:54 VN1) tidak terbaca jelas. Nama pembicara tidak diketahui dari file.

**Audio MP4 bukan requirement:** isinya lagu (lirik bahasa Inggris), bukan narasi. Isi video ada di visualnya: rekaman layar dashboard manajemen KOL berbasis Google Sheet ("Your data stays in your own Google Sheet"), dengan menu Dashboard, Artist List, Campaigns, To-Do List, Calendar, Setting. Terlihat: overview brand (follower per platform, rekap artist/campaign/budget/engagement), kartu campaign (funnel TOFU/MOFU, budget spent, target reach/ER), kartu artist dengan tier (Nano/Micro/Mid/Macro/Mega), klasifikasi KOL/Creator, rate card ("belum diisi"), tombol Visit/Contact, filter platform/kategori/tier, tabel, grafik kelengkapan data, dan pilihan tema. Ini referensi UX, bukan spesifikasi.

## VN1 (9.30, 6:08): cara hitung production house dan timeline

| ID | Waktu | Isi (diparafrase dari ASR) |
|---|---|---|
| V2-01 | 00:18–00:57 | Crew PH dihitung **per jam dengan paket** (4 / 6 / 8 jam per crew), tiap paket rate berbeda. Di luar estimasi paket kena **charge jam tambahan**. |
| V2-02 | 01:05–02:11 | Ada **gatekeeper kalkulasi**: input jam mulai (dan selesai), sistem menampilkan kelebihan/kekurangan waktu otomatis. **Call crew ±10 menit** tidak dihitung; lebih dari itu masuk jam kerja. |
| V2-03 | 02:11–02:55 | Kebijakan pembulatan: kelebihan **kurang dari sejam** (kira-kira setengah jam) diperlakukan khusus; **setting up / bongkar alat ±10 menit** tidak dihitung, lebih dari itu (mendekati sejam) masuk jam kerja. Angka persis kurang jelas di ASR. |
| V2-04 | 02:48–03:29 | Di Creator disebut **timeline**: setelah produk dikirim, pengerjaan konten ±3 hari sampai seminggu. Keinginan: **di luar timeline, Creator tidak bisa submit**. Pembicara menanyakan mekanisme terbaik ke penerima pesan. |
| V2-05 | 03:35–04:40 | **Editing**: minimal 3 hari sampai seminggu **hari kerja**; Jumat setengah hari (sampai 11.00), Minggu libur untuk editor kecuali freelance; rate berbeda bila job jatuh di hari libur. Perlu kalender kerja. |
| V2-06 | 04:40–05:27 | PH intinya **estimasi waktu pengerjaan**; contoh pengajuan estimasi produksi (rincian alat dan biaya). Pertanyaan: total estimasi diintegrasikan dengan Google Sheet atau angka dimasukkan langsung di web. |
| V2-07 | 05:27–06:06 | Profil tim/crew dan profil Creator: **performa**, **kualitas akun**, **kualitas konten** (resolusi Full HD atau 4K). |

## VN2 (9.42, 6:15): model bisnis dan kualitas akun

| ID | Waktu | Isi (diparafrase dari ASR) |
|---|---|---|
| V2-08 | 00:00–00:23 | Produk yang dijual memakai **nama aplikasi berbeda**; web utama tetap Cineva. Ada **laman khusus Brand dan Klien**. |
| V2-09 | 00:35–01:17 | **Kualitas akun Creator** lewat rate card dan database range: kategori **Premium, Grade A, B, C**. Berlaku juga untuk crew (performa kerja). Ini sejalan dengan screenshot assessment client di [review 1 Nov](client_assessment_dp_review_2026_11_01.md). |
| V2-10 | 01:17–01:51 | Parameter Creator: followers, following, **average like per posting**. Parameter crew: **kekuatan, kekurangan, keterangan gear** (kamera, lensa yang sering dipakai), pengalaman terakhir. |
| V2-11 | 01:51–02:43 | **Dua laman berlangganan**: Brand berlangganan untuk menjelajah dan mencocokkan Creator/crew dulu; baru lanjut bicara ke admin/Cineva. **Tidak bisa di-download** walau sudah berlangganan. |
| V2-12 | 02:43–03:24 | Aplikasi kedua untuk **KOL specialist** (agency KOL yang masih manual): aplikasi utama Cineva melayani brand (estimasi rate, biaya produksi, biaya campaign); produk jualan: cek kualitas akun, kualitas crew, **RAB** (rencana anggaran produksi) TVC, iklan komersil, billboard, videoklip. |
| V2-13 | 04:10–04:44 | Aplikasi tambahan **terhubung ke website utama** (about/developer mengarah ke web Cineva, kredit di bagian bawah) dan ada **biaya langganan bulanan** untuk pemeliharaan web. |
| V2-14 | 04:44–06:15 | Target pasar: umum, KOL specialist, brand/UMKM dengan budget minim (dibantu produksi). Saran pemasaran: tawarkan ke tim marketing Indofood sebagai tools; jika perusahaan besar pakai, yang lain mengikuti. Ini saran go-to-market, bukan requirement fitur. |

## Perbandingan dengan Cineva sekarang

Dasar: `cineva-services/pricing.ts`, `catalog.ts`, `cineva-shared/model.ts`, `scheduling.ts`, `cineva-campaigns/*`, dan [review 1 Nov](client_assessment_dp_review_2026_11_01.md).

| Kebutuhan | Status | Catatan |
|---|---|---|
| Estimator crew | Sebagian | `estimate()` memakai **crew × hari** dan gear × hari (`defaultRates` crew 350000, gear 250000). Belum ada paket per jam (4/6/8), charge jam tambahan, call crew, setup, atau gatekeeper jam mulai/selesai. `durationHours` hanya ada di job/booking untuk jadwal. |
| Timeline Creator dan blok submit | Sebagian | Ada deadline per milestone (`CampaignEditor`) dan QC draft (`execution.ts`). Tidak ada aturan "lewat timeline tidak bisa submit". |
| Kalender kerja editor (Jumat setengah hari, Minggu libur, rate hari libur) | Belum | `scheduling.ts` hanya deteksi bentrok jadwal. |
| Rate card dan grade Premium/A/B/C untuk Creator dan crew | Belum | `RateCard` hanya tarif tunggal per versi. |
| Profil kualitas akun (followers, following, avg likes), kualitas konten (resolusi), profil crew (gear, kekuatan, pengalaman) | Belum | hanya followers snapshot dan niche. |
| Laman Brand/Klien | Sebagian | ada inquiry/quote untuk client (`cineva-inquiries`); belum laman jelajah Creator/crew. |
| Langganan Brand, akses jelajah tanpa download, biaya bulanan | Belum | tidak ada konsep subscription/paywall. |
| Produk kedua untuk KOL specialist, RAB per jenis produksi (TVC, billboard, videoklip) | Belum | `catalog.ts` punya Campaign / Project Production / Shoot Content; belum ada RAB per format. |
| Integrasi Google Sheet | Belum | dibahas sebagai opsi, belum diputuskan. |

## Yang masih ambigu (tanyakan sebelum membangun)

1. Paket jam: nilai rate per paket, aturan pembulatan persis (30 menit? 60 menit?), dan apakah call crew/setup tepat 10 menit.
2. "Di luar timeline Creator tidak bisa submit": hard block, atau submit ditandai terlambat dengan penalti?
3. Apakah RAB (V2-12) dihitung otomatis dari katalog tarif atau diisi manual (Google Sheet vs web)?
4. Skema langganan: harga, durasi, apa yang dibuka (daftar Creator/crew apa saja), apa arti "tidak bisa download" secara teknis.
5. Apakah aplikasi KOL specialist produk terpisah (nama dan domain sendiri) atau mode lain dari Cineva; siapa penagih biaya bulanan.
6. Kriteria grade Premium/A/B/C: ambang followers/ER/performa. Tidak disebut angka di audio.

## Hubungan dengan catatan sebelumnya

Memperkuat dan menambah [voice note 18 Okt](voice_requirements_2026_10_18.md): estimasi biaya produksi kini punya aturan jam dan RAB; assessment kualitas akun (gambar client 1 Nov) kini punya skema grade. Belum mengubah keputusan: database ditunda, HOTS Kantor read-only, tema coklat/emas/putih tetap, tanpa payment provider.

## Urutan usulan jika diminta implementasi

(1) estimator jam: paket per jam, gatekeeper mulai/selesai, charge tambahan; (2) rate card dan grade Creator/crew termasuk panel assessment akun; (3) kalender kerja editor dan aturan timeline submit; (4) laman Brand berlangganan; (5) RAB per format produksi. Semua dummy dahulu, memakai engine HOTS yang ada.
