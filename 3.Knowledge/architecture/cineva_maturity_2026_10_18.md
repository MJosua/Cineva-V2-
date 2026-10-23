# Pemantapan Cineva: workflow, penawaran, CS dan booking

Tanggal: 18 Oktober 2026. Pengguna meminta pengerjaan dalam grup paralel tanpa konfirmasi untuk melanjutkan. Tiga grup mengerjakan batas file terpisah: (1) brief/workflow, (2) quote negotiation, (3) operasi CS/booking. Integrasi, review gabungan, regresi dan laporan dilakukan setelah penggabungan. Seluruh perubahan tetap lokal Cineva, frontend/data dummy; tidak mengubah HOTS Kantor, paket engine upstream, backend atau database.

## Perilaku baru

### Brief dan workflow per layanan

`cineva-services/catalog.ts` mempertahankan field wajib sebelumnya dan menambahkan detail opsional agar draft/request lama tetap valid. Campaign memiliki SOW, rencana deliverable per periode dan frekuensi laporan. Production memiliki detail persiapan/script/storyboard, rencana shooting dan pascaproduksi. Content Shoot memiliki jumlah sesi, rincian shot list/output dan ketentuan sesi. Jumlah sesi adalah definisi brief; kalender multi-sesi terpisah belum dibuat otomatis.

`workflow.ts` adalah konfigurasi/proyeksi domain vendor di atas job existing, bukan engine ticket kedua. Campaign: SOW/periode → pelaksanaan → review/laporan → selesai. Production: pra-produksi → produksi → pascaproduksi → penyerahan → selesai. Content Shoot: persiapan → sesi → seleksi/editing → selesai. `ServiceWorkflow.tsx` mengomposisi Button HOTS dan menyimpan lewat `WorkspaceContext.mutate` existing.

Job lama tanpa metadata tampil pada tahap awal tanpa write otomatis. Transisi divalidasi ulang dalam callback mutation terhadap state terkini, hanya boleh maju satu tahap, menolak skip/repeat/reverse dan riwayat rusak. Tahap layanan tidak otomatis mengubah Running/Wait Pay/Done atau pembayaran. Ganti jenis project melalui editor menghapus state workflow lama dan konfirmasi booking; perubahan fee saja tidak membatalkan booking.

### Penawaran, revisi dan persetujuan versi

Status inquiry tambahan `changes_requested`. Pemilik request dapat mengirim alasan perubahan untuk quote yang sedang ditampilkan. HQ tujuan merevisi tarif serta jumlah hari/crew/gear khusus penawaran, lalu mengirim ulang. Quantity quote disimpan dalam `Quote.scope`, terpisah dari brief client awal; rate card tidak perlu diubah hanya untuk mengurangi crew satu penawaran.

`quotes.ts` membuat snapshot item dan scope terpisah untuk setiap versi, menolak perubahan snapshot pada nomor revisi sama, dan mengikat acceptance ke revisi yang ditampilkan. Tab browser lama yang masih menampilkan versi sebelumnya tidak dapat menyetujui revisi baru tanpa membaca ulang. UI `QuoteNegotiation.tsx` menampilkan rincian, alasan perubahan dan riwayat versi, serta menghilangkan kontrol revisi saat accepted.

`repository.update` memberi clone ke callback dan mempertahankan baseline terpisah sebelum membandingkan ownership, histori dan quote accepted. Ini penting: callback yang memutasi quote serta history secara in-place sebelumnya dapat mengubah data pembanding dan melewati guard. Review paralel menemukan kasus tersebut; regression test direproduksi gagal sebelum clone ditambahkan, lalu lulus setelah perbaikan.

Konversi mengambil `acceptedQuoteSnapshot`, menyimpan `Job.sourceQuote` sebagai snapshot dan menggunakan quantity yang disepakati pada brief project. Fee awal project sama dengan total versi accepted. Request accepted lama tanpa metadata revision tetap dapat dibaca melalui fallback eksplisit ke quote lamanya; bila metadata revision sudah ada tetapi history hilang/tidak konsisten, konversi ditolak. Retry konversi tetap memakai ID project deterministik. Field ini view model, bukan DDL/EAV mapping fisik.

### Antrean dan riwayat CS

`SupportQueue.tsx` memfilter pencarian judul/brand/pesan, mode AI/menunggu/manusia/selesai dan agen. Scope owner/destination diterapkan sebelum hasil/filter/count. Counter antrean menunggu tidak hilang hanya karena filter pencarian dipilih.

`assignment.ts` mencatat perubahan mode, actor, waktu, agen sebelumnya dan agen baru pada `supportEvents`. HQ dapat mengambil dan mengalihkan percakapan antara dua agen dummy; resolve dan return-to-AI eksplisit. Tidak ada pesan eksternal atau user/role server nyata. Teks agent di dropdown ditangkap sebelum callback asynchronous agar select terkontrol tidak mengembalikan nilai agen lama.

`support.ts` mempertahankan API lama sambil mengarahkan handover/claim ke helper audit. Balasan AI tertunda diabaikan jika mode berubah, ada pesan lebih baru, atau generasi `supportEvents` berubah—termasuk jika human handover sudah kembali ke AI saat inference lama selesai. Provider tetap fake lokal; bukan local LLM nyata.

### Alokasi dan booking eksplisit

Dummy repository menambahkan resource Fotografer/Videografer secara additive saat seed/load, tanpa menghapus job, pembayaran atau alokasi lama. Kebutuhan tenaga dari brief `specialist` dipetakan ke `Job.requiredRoles`. ID workspace kedua tetap mempunyai storage sendiri.

`ResourceScheduler.tsx` memakai `validateDraft` existing untuk memperlihatkan ketersediaan/bentrok berdasarkan jadwal dan durasi. Checkbox masih dapat menyusun kandidat alokasi, tetapi save menolak bentrok. Alokasi tersimpan tidak otomatis menjadi booking.

`BookingConfirmation.tsx` memakai `booking.ts` untuk memeriksa job aktif, resource, role fotografer/videografer, overlap dan fingerprint jadwal/durasi/resource/role. Konfirmasi menyimpan actor dan waktu. Draft perubahan alokasi harus disimpan dahulu sebelum tombol konfirmasi dapat dipakai. Mengubah jadwal/durasi/resource membatalkan konfirmasi sebelumnya; konfirmasi stale ditolak. Booking lama tanpa requiredRoles tetap kompatibel, tetapi tetap memerlukan resource dan bebas bentrok.

## Lokasi integrasi

Source di bawah `1.Frontend/HOTS/src/features/`:

| Area | File |
|---|---|
| Brief/workflow | cineva-services/catalog.ts, workflow.ts, ServiceWorkflow.tsx |
| Quote | cineva-services/pricing.ts, QuoteBreakdown.tsx; cineva-inquiries/quotes.ts, QuoteNegotiation.tsx |
| Inquiry integration | cineva-inquiries/domain.ts, repository.ts, InquiryDetail.tsx, ServiceDesk.tsx |
| CS | cineva-support/assignment.ts, SupportQueue.tsx, support.ts, ConversationPanel.tsx |
| Booking | cineva-hq/booking.ts, BookingConfirmation.tsx, ResourceScheduler.tsx |
| Host/view model | cineva-shared/model.ts, dummyRepository.ts, JobDetail.tsx, JobEditor.tsx, CalendarView.tsx, CinevaProgram.tsx |

Tidak mengubah global CSS/theme. Form tetap dynamic-form, kontrol memakai ui-kit/forwarder HOTS, storage app-core, mutation dan job adapter existing. Versi paket reusable tidak berubah. ResourceScheduler sebelum penggantian disimpan pada `3.Knowledge/_archive/cineva_maturity_2026_10_18/ResourceScheduler.before.tsx.txt`; pemulihan harus disertai revert integrasi booking/props terkait, bukan menyalin kode upstream lama.

## Menjalankan dan bukti

```powershell
npm.cmd run test:maturity       # 16 kontrak baru + batas source fitur 1.000 baris
npm.cmd run test:services       # 9 kontrak layanan sebelumnya
npm.cmd run test:products       # 9 domain produk + lint/diagnostics
npm.cmd run test:packages       # 17 package contracts
npm.cmd run test:components     # 19 browser checks komponen
npm.cmd run build:frontend
$env:CINEVA_PRODUCTS_ORIGIN='http://127.0.0.1:48175'
npm.cmd run test:maturity:e2e    # 9 browser scenarios baru, termasuk dua tab stale quote
npm.cmd run test:services:e2e    # 15 service-flow scenarios
npm.cmd run test:vendor-theme   # 19 A/B + 8 theme checks
```

Bukti terkini ada di `reports/cineva_maturity_2026_10_18/`: kontrak, ukuran source, production E2E, workbook dan validation JSON. Tes hanya memakai data sintetis; network guard menolak backend/external requests. Tidak ada database yang dipakai. Build dan tes lulus tidak membuktikan server-side tenant authorization.

Total coverage yang dijalankan: 51 tes domain/kontrak (16+9+9+17) dan 70 browser checks (9+15+19+19+8). Lint fitur nol error/warning dan tidak ada diagnostic TypeScript fitur baru; 101 diagnostic aplikasi sebelumnya masih ada. Batas 1.000 baris berlaku untuk file fitur yang disentuh; tidak mengklaim seluruh legacy aplikasi sudah memenuhi batas.

## Batas lanjutan

Belum mengaktifkan DB/backend, auth/membership/role CS server, real inbox/SSE, durable transaction/idempotency, local LLM, upload/CMS publishing, provider reminder/kalender atau checkout. Tarif tetap dummy. Multi-sesi pada brief belum membuat beberapa booking terjadwal otomatis; Campaign berperiode juga tidak memperlakukan satu job sebagai resource terkunci sepanjang periode. Perlu kontrak sesi/resource terpisah sebelum memperluas kalender. Riwayat workflow tersimpan berurutan sebagai view model; bukan event audit server.

Integrasi nyata tetap memakai physical schema terverifikasi, EAV `cstm_col/lbl_col/value`, HOTS engine services existing dan transaction + commit + rollback. Database hanya dummy setelah scope DB dibuka pengguna. Original HOTS di Kantor tetap read-only; pengembangan upstream additive melalui project pemiliknya.
