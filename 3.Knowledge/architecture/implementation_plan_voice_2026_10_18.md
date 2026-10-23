# Rencana pemenuhan requirement Cineva A/B dari voice note

Status awal: rencana 18 Oktober 2026. Update: [Paket 1–4 sudah diimplementasikan dan diuji pada batas frontend dummy](cineva_service_flow_2026_10_18.md); Paket 5 masih ditunda. Bagian di bawah mempertahankan rencana/acceptance awal sebagai konteks, bukan klaim backend live.
Sumber: [voice note dan requirement VN01–VN08](voice_requirements_2026_10_18.md), [arah produk sebelumnya](cineva_dual_product_direction_2026_10_18.md), serta [preview A/B existing](dual_product_preview_2026_10_18.md).

## Hasil yang dituju

App A mengelola kebutuhan production house: client/brand, campaign, production, content shoot, brief, estimasi dan penanganan permintaan jasa. App B mempertahankan personal job tracker dan menambahkan pintu permintaan jasa fotografer/videografer kepada Cineva. Assistant/CS dapat melibatkan AI dan manusia. Label A/B dan desain jalur permintaan adalah interpretasi atas arsitektur produk sebelumnya; detail yang belum pasti pada ASR tidak dijadikan aturan bisnis baru.

Alur sasaran: pilih layanan → isi brief → kirim permintaan → review HQ/CS → estimasi/penawaran → persetujuan → project HOTS → penjadwalan → pelaksanaan → deliverable → pembayaran/arsip. Status inquiry, quote, pekerjaan dan pembayaran terpisah; mengirim permintaan bukan otomatis mengonfirmasi booking.

## Batas dan dampak arsitektur

- HOTS `D:/Kantor` hanya referensi, tidak disentuh. Perubahan vendor di Cineva, memakai snapshot paket lokal dan provenance fork.
- Pertahankan UI coklat/emas/putih dan workflow marketplace legacy. Reuse dynamic-form, ui-kit, table-engine dan app-core. Jangan membuat engine form/ticket/auth/workflow kedua.
- Pisahkan domain ke modul service catalog, inquiry, quoting dan support; komponen tampilan hanya mengomposisi modul. Target 150–350 baris per komponen/hook bila wajar, batas keras 1.000 baris per file baru/diubah. Jangan menekan baris dengan memadatkan kode.
- Tahap 1–4 hanya frontend/repository dummy. Tidak menjalankan backend bisnis, SQL, migrasi, provider pembayaran, pesan eksternal atau database asli.
- Shape domain frontend bukan DDL. Integrasi nyata tetap mengikuti `cstm_col`, `lbl_col`, `value`, physical schema dan transaction + commit + rollback.
- Request lintas workspace harus berbagi field secara eksplisit ke penerima yang dituju; bukan membuka seluruh data Creator kepada HQ atau semua HQ kepada Creator. Simulasi ini tidak membuktikan tenant authorization.

## Paket 1 — Katalog, brief dan estimator dalam satu pekerjaan

Requirement: VN01, VN02, VN04, VN06. Dependensi: fondasi preview existing.

Bangun katalog terkonfigurasi untuk Campaign, Production, Content Shoot. Graduation, birthday, iklan, fotografer/videografer menjadi contoh layanan/opsi dalam katalog; pemetaan finalnya dapat diedit, bukan dikunci sebagai asumsi dari audio. Setiap jenis memiliki field brief yang relevan: brand/PIC, tujuan, deliverable, lokasi, jadwal/durasi, kebutuhan kru/jasa dan budget indikatif. Campaign dapat membawa periode dan lingkup kerja, bukan dipaksa menjadi satu sesi shoot.

Reuse `HotsForm` dan registry dynamic-form. Pisahkan editor brief dari job editor agar tidak memuat semua variasi ke satu file. Estimator memakai rate card dummy yang terlihat dan dapat dikonfigurasi: rincian item, jumlah, satuan, subtotal, total serta versi tarif. Simpan snapshot penawaran; perubahan rate card tidak diam-diam mengubah quote lama. Angka adalah simulasi, belum harga resmi. Jangan memasukkan formula bisnis ke komponen JSX.

Lokasi: `1.Frontend/HOTS/src/features/cineva-services/` untuk `catalog.ts`, `briefSchemas.ts`, `pricing.ts`, `ServicePicker.tsx`, `ServiceBriefForm.tsx`, `QuoteBreakdown.tsx`; adapter/komposisi pada `cineva-hq/EstimatorView.tsx`, `cineva-shared/JobEditor.tsx`, `HotsForm.tsx`. Nama file adalah target rencana, bukan file yang sudah ada.

Acceptance dummy: masing-masing tiga layanan menampilkan dan memvalidasi brief yang benar; berganti layanan mempertahankan field bersama tanpa membawa field tidak relevan; item/total quote benar; angka invalid ditolak; rate card baru tidak mengubah snapshot lama; membuat job manual existing tetap berjalan.

## Paket 2 — Permintaan Creator/client, queue HQ dan konversi project

Requirement: VN02, VN06, VN07. Dependensi: Paket 1.

Tambahkan menu layanan pada B, draft brief, pengiriman request dan pelacakan status. A mempunyai queue inquiry, detail brief, assignment PIC dummy, penyusunan/revisi quote dan keputusan accept/reject. Setelah persetujuan yang sesuai, konversikan inquiry sekali menjadi project melalui adapter yang sama dengan create job existing. Pada dummy gunakan repository; saat live gunakan engine ticket existing, bukan implementasi ticket baru.

Usulan state inquiry: Draft → Submitted → Reviewing → Quoted → Accepted/Rejected/Cancelled. Nama/transisi final perlu dikonfigurasi; bukan state yang disebut lengkap oleh pembicara. Project dan pembayaran tetap state terpisah. Persetujuan quote tidak menjamin resource tersedia; cek konflik lagi saat alokasi/konfirmasi. Bedakan budget permintaan, quote penawaran dan fee project yang disetujui.

Gunakan source request ID, owner workspace dan destination workspace pada view model. Broker dummy hanya mengirim data brief yang dipilih dan balasan yang relevan; jangan membuat seluruh storage A/B dapat dibaca satu sama lain. Percobaan ulang memakai identity request yang sama untuk mencegah duplicate project. Perubahan status hanya terjadi setelah save berhasil. Pertahankan arsip/data dummy lama dengan migrasi storage versi atau fallback yang teruji.

Lokasi target: `cineva-inquiries/{types.ts,transitions.ts,repository.ts,dummyRepository.ts,InquiryEditor.tsx,InquiryDetail.tsx}`, `creator-space/ServiceRequestsView.tsx`, `cineva-hq/InquiryInbox.tsx`; update komposisi `cineva-shared/CinevaProgram.tsx`, `navigation.ts`, `WorkspaceContext.tsx` bila dibutuhkan, tanpa memperbesar tanggung jawabnya.

Acceptance dummy: request B masuk hanya ke HQ tujuan; Creator lain tidak melihatnya; HQ tidak melihat finance/job pribadi yang tidak dibagikan; reload mempertahankan request dan balasan; double submit/convert tidak membuat project ganda; cancel/reject tidak membuat project; gagal save tidak mengubah state; inquiry menjadi project tanpa kehilangan brief; konflik resource ditolak.

## Paket 3 — CS manusia dan assistant melalui adapter

Requirement: VN03. Dependensi: Paket 2 dan identitas request/workspace dummy.

Sediakan percakapan terkait inquiry/project, daftar percakapan HQ, assignment agen dummy, jawaban manusia dan handover AI → manusia. Pengguna dapat memilih bantuan manusia. Konteks brief dan riwayat tetap ada saat handover; assistant tidak terus membalas seolah agen manusia. Status usulan: AI handling, waiting for agent, human handling, resolved. Return-to-AI harus tindakan eksplisit.

Definisikan provider interface terpisah dari UI. Tahap ini menggunakan deterministic fake AI untuk memberi pertanyaan pengumpulan brief dan menyarankan draft; tandai simulasi. Provider lokal nyata baru pada Paket 5. Output AI adalah usulan yang divalidasi; tidak menentukan tenant, role, harga resmi, persetujuan atau status sendiri. Respons terlambat setelah handover harus diabaikan; failure provider tidak mengirim pesan sukses palsu atau mengubah inquiry.

Lokasi target: `cineva-support/{types.ts,repository.ts,provider.ts,dummyProvider.ts,handover.ts,ConversationPanel.tsx,ConversationList.tsx}`, `cineva-hq/SupportInbox.tsx`; pecah assistant dari `creator-space/CreatorViews.tsx` menjadi view kecil yang mengomposisi adapter. Pertahankan fungsi create-job assistant existing sebagai aksi terpisah yang kompatibel.

Acceptance dummy: percakapan sesuai inquiry/workspace; request agent membawa konteks; agen dapat membalas dan menyelesaikan; AI tidak membalas sesudah handover; respons tertunda/retry tidak menggandakan pesan; failure/reload/cancel aman; tidak ada request ke LLM/WhatsApp/email eksternal.

## Paket 4 — Integrasi A/B dan regresi menyeluruh

Dependensi: Paket 1–3; bukan alasan menunda tes pada setiap paket.

Uji journey lengkap B memilih jasa → HQ mereview → CS AI/manusia → quote → diterima → project → jadwal → deliverable → pencatatan pembayaran dummy → arsip. Uji jalur langsung client dari A juga, sehingga layanan tidak mengharuskan semua client mempunyai akun Creator.

E2E tiap paket mencakup desktop/mobile, keyboard/focus, brown/gold/white theme, empty/error/loading, save failure dan reload. Gunakan isolated browser context dan dua Creator serta dua HQ sintetis untuk membuktikan perilaku sharing dummy sesuai target. Browser network guard menolak backend/external calls. Jangan menyebutnya bukti keamanan tenant server.

Regresi: existing package contracts, table/browser component tests, product domain/E2E, vendor theme checks dan production build. Tambahkan guard 1.000 baris untuk modul fitur yang disentuh, bukan hanya table-engine; lint serta TypeScript bandingkan diagnostics terhadap baseline, laporkan debt yang masih ada. Jangan mengubah baseline test agar menutupi failure. Update knowledge, package provenance jika ada fork change, dan Excel evidence setelah setiap paket.

Lokasi test baru: `3.Knowledge/scripts/cineva_service_flow_2026_10_18/`; gunakan fixture/repository dummy. Hasil di `3.Knowledge/reports/`. E2E dan hasil kelulusan pada dokumen ini seluruhnya masih rencana.

## Paket 5 — Integrasi nyata, ditunda sesuai instruksi database

Mulai hanya setelah user membuka kembali scope DB dan tersedia physical schema, membership/tenant ownership, role CS, engine ticket service contract, auth dan konfigurasi provider. Belum ada SQL/Prisma yang dibuat.

Urutan: backend tenancy/authorization dan kontrak → service catalog/inquiry/quote/support domain adapters → transaction-bound ticket conversion dan idempotency → local LLM provider dengan timeout/structured output validation → integrasi CMS/deliverable → dummy DB E2E. LLM dipanggil sebelum transaction write yang singkat; revalidasi otorisasi dan data sebelum commit. SSE/log business events mengikuti parser existing dan dipublikasikan setelah commit. Uji rollback dan retry.

Module backend target di `2.Backend/Integrated-API/programs/cineva/` dan router vendor existing setelah mount/auth ditelusuri. Ini rancangan lokasi, bukan izin membuat service paralel tanpa audit source. Test DB memakai database dummy saja, tidak menjalankan repair/cron atau menyentuh database Kantor.

Subscription/payment gateway, tarif komersial, reminder provider dan SLA CS dicatat sebagai backlog dari arahan sebelumnya; tidak otomatis masuk Paket 1–3 karena tidak dirinci dalam voice note. Jangan menghapus kebutuhan sebelumnya, tetapi beri milestone/acceptance terpisah saat scope siap.

## Definition of done

Setiap paket menghasilkan fitur/modul yang selesai, regresi dan E2E dummy lulus, tidak ada file baru/diubah melebihi 1.000 baris, dokumentasi dan Excel evidence diperbarui, dan boundary original HOTS/DB tetap dipatuhi. Integrasi nyata hanya dinyatakan selesai setelah backend/dummy DB tests, bukan karena preview berfungsi. Rencana ini tidak mengklaim harga final, verifikasi manual seluruh istilah ASR, atau kesiapan produksi.
