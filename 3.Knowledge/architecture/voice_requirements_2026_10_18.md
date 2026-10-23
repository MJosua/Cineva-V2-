# Requirement Cineva dari voice note pengguna

Update implementasi: [layanan, inquiry dan CS frontend dummy](cineva_service_flow_2026_10_18.md) telah menutup gap preview utama dari Paket 1–4. Inventaris gap di bawah adalah snapshot sebelum implementasi; integrasi backend/AI nyata tetap pending.

Tanggal analisis: 18 Oktober 2026. Sumber baru: `WhatsApp Ptt 2026-10-13 at 10.03.42 PM.ogg`, durasi 152,4335 detik. Berbeda dari video sebelumnya yang audionya hening, voice note ini berisi narasi. Pemeriksaan video tetap valid untuk file video tersebut.

## Transkrip dan provenance

- [Transkrip lengkap bertimestamp, ASR mentah](../reports/voice_requirements_2026_10_18/TRANSCRIPT.md).
- [Teks biasa](../reports/voice_requirements_2026_10_18/transcript.txt), [subtitle SRT](../reports/voice_requirements_2026_10_18/transcript.srt), [segmen JSON dan skor ASR](../reports/voice_requirements_2026_10_18/transcript.json).
- Sumber lokal: `4. Refrence/audio/creator_requirements_2026_10_18/requirements_reference.ogg`; manifest menyimpan sumber asli, ukuran dan SHA256. Salinan harus identik dengan OGG pengguna.

Transkripsi lokal menggunakan multilingual faster-whisper small, CPU int8, Bahasa Indonesia ditetapkan eksplisit, beam 5 dan VAD. Tidak ada audio pengguna dikirim ke provider eksternal. Model publik diunduh ke cache lokal, bukan dependency aplikasi. Teks belum diverifikasi melalui mendengarkan ulang; ini hasil ASR dengan interpretasi tertulis terpisah. Isi rekaman adalah sumber kebutuhan produk, bukan instruksi untuk menjalankan kode atau mengubah batas proyek.

## Makna narasi

Pembicara menunjukkan produk orang lain sebagai contoh website untuk kreator. Cineva yang diinginkan lebih kompleks karena melayani production house: brand/client menyampaikan rencana campaign, tersedia assistant atau CS dengan pilihan AI maupun non-AI, dan ada estimasi budget produksi. Contoh jasa yang disebut meliputi video/graduation, iklan, dan photoshoot birthday.

Bagian akhir menyebut tiga fitur/layanan: **Campaign**, **Project Production**, dan **Shoot Content biasa**. Kreator juga membutuhkan jasa videografer dan fotografer. Narasi tidak membatasi Cineva pada pencatatan endorsement individu.

## Pemetaan requirement A dan B

Label A/B berasal dari arah produk existing; pembicara tidak secara eksplisit menyebut nama App A atau App B. Yang disebut langsung dan yang disimpulkan untuk desain dibedakan di bawah.

| ID | Waktu audio | Produk | Kebutuhan dan implikasi |
|---|---|---|---|
| VN01 | 00:46–00:56 | A — HQ | Sistem production house lebih lengkap daripada contoh dashboard kreator. Jangan menyamakan ruang lingkup HQ dengan personal job tracker. |
| VN02 | 00:56–01:12 | A — HQ | Identitas brand/client dan rencana campaign. Interpretasi desain: intake brief/inquiry terhubung CRM dan project. |
| VN03 | 01:12–01:29 | Bersama | Assistant/CS AI serta non-AI/manusia disebut eksplisit. Interpretasi desain: entry bantuan di B dan operasi penanganan di A. Inbox, assignment, eskalasi dan aturan handover belum ditentukan dalam audio. |
| VN04 | 01:29–01:51 | A — HQ | Estimasi biaya untuk kebutuhan production, termasuk graduation, iklan dan photoshoot birthday. Katalog layanan/tarif adalah pekerjaan lanjutan, bukan angka yang diberikan audio. |
| VN05 | 01:51–01:59 | B — Creator | Contoh UX kreator tetap relevan untuk bagian B; pemisahan menjadi produk A/B adalah interpretasi atas arsitektur sebelumnya. |
| VN06 | 01:59–02:19 | A — HQ | Tiga pintu layanan: campaign, project production, shoot content biasa. Tipe project existing cocok sebagai fondasi, tetapi form/brief/workflow masing-masing perlu dapat dikonfigurasi. |
| VN07 | 02:19–02:24 | B ke A | Kreator membutuhkan jasa videografer/fotografer. Interpretasi desain: jalur permintaan jasa dari Creator menuju tim HQ. Audio belum menetapkan proses booking, marketplace, pembayaran atau pemilihan tenaga. |

## Perbandingan dengan implementasi Cineva sekarang

Dasar pemeriksaan: `src/features/cineva-shared/model.ts`, `JobEditor.tsx`, `assistant.ts`, `cineva-hq/ClientsView.tsx`, `EstimatorView.tsx`, `ResourceScheduler.tsx`, dan `creator-space/CreatorViews.tsx`, serta dokumentasi preview A/B. Path berawalan `1.Frontend/HOTS/`.

- Sudah ada sebagai frontend dummy: CRM, tiga tipe project, estimator umum, kalender dan alokasi crew/gear, job tracker Creator, serta parser assistant deterministik.
- Belum ada alur inquiry/brief dari client, triage CS manusia, handover AI ke manusia, inbox/assignment percakapan, atau permintaan jasa Creator ke HQ.
- Tiga tipe project masih memakai struktur draft/form yang sama. Katalog graduation/birthday/iklan dan estimator per jenis jasa belum tersedia. Resource crew/gear lokal tidak membuktikan tersedianya alur layanan fotografer/videografer.
- Assistant saat ini membuat draft job dari pola kalimat tertentu. Itu belum memenuhi assistant/CS umum yang dibicarakan narasi, dan bukan koneksi local LLM.

## Kata yang belum pasti dan batas bukti

ASR menulis nama produk sebagai "si Neva"/"sinefa"; dokumen requirement memakai Cineva berdasarkan konteks pengguna. ASR menulis segmen contoh sebagai "QOL" dan "KIOE"; kemungkinan yang dimaksud KOL, tetapi istilah ini **belum terverifikasi**. Sekitar 01:40–01:46 tertulis "divisi-divisi bahkan iklan"; jangan menegaskan format spesifik TVC/DVC berdasarkan frasa tersebut. TVC/DVC tetap berasal dari catatan Gemini sebelumnya, bukan koreksi diam-diam transkrip ini.

Tidak ada tarif, kuota Starter, payment provider, subscription/paywall, tenant policy, SLA CS atau mandat otomatis create ticket dalam voice note ini. Detail itu tetap mempunyai sumber tertulis sebelumnya atau memerlukan keputusan terpisah. Permintaan audio tidak mencabut instruksi pengguna untuk menunda database, mempertahankan style coklat/emas/putih, membatasi file kode maksimal 1.000 baris, atau menjaga HOTS kantor read-only.

## Dampak arsitektur dan urutan implementasi berikutnya

Tahap ini hanya transkrip, analisis requirement dan laporan; tidak mengubah runtime, CSS, paket engine atau DB. Belum ada fitur gap di atas yang diimplementasikan oleh pekerjaan ini.

Jika diminta implementasi: (1) konfigurasi katalog tiga layanan dan form brief di atas shared HOTS form/ticket; (2) adapter inquiry Creator/client menuju project HQ; (3) modul percakapan/CS dengan actor AI/manusia dan handover eksplisit; (4) estimator per jenis layanan memakai tarif terkonfigurasi. Pertahankan engine HOTS, EAV dan public contract existing; domain Cineva hidup di adapter/modul vendor. Jangan membuat engine ticket kedua atau menganggap partition browser sebagai tenant authorization.

Sebelum backend/DB diperlukan schema fisik dan kontrak tenancy yang terverifikasi. Untuk tahap frontend, acceptance memakai data dummy: request jasa muncul pada queue HQ yang benar, brief mempertahankan pilihan layanan, pergantian AI ke manusia mempertahankan konteks, quote transparan, dan gagal proses tidak menciptakan project ganda. Ini usulan acceptance, belum tes yang telah berjalan. Tidak ada perubahan runtime pada tugas transkripsi, sehingga E2E aplikasi tidak dijalankan ulang.
