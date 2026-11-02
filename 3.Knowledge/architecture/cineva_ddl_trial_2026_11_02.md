# Usulan DDL Cineva dan uji coba di database terpisah (2 Nov 2026)

Status: **usulan, belum diterapkan ke `hots`**. Dibuat atas izin pemilik proyek untuk uji coba DDL. Sumber model: view model frontend di `1.Frontend/HOTS/src/features/cineva-campaigns` dan `cineva-services/policies.ts`. Referensi tabel induk: [baseline skema hots](../schema/hots_saas_baseline_2026_10_21.json) (`m_company.company_id`, `m_company_program_list.program_id`, `user.user_id`, semuanya `int`).

## Isi

17 tabel `t_cineva_*`, 23 foreign key, InnoDB, `utf8mb4_unicode_ci`, uang `bigint unsigned` (rupiah bulat), `timestamp(3)` sesuai gaya tambahan hots sebelumnya.

| Kelompok | Tabel |
|---|---|
| Campaign | `t_cineva_campaign` (scope `program_id`+`company_id`), `_campaign_milestone`, `_campaign_batch`, `_campaign_product` |
| Kalender tahap | `t_cineva_stage_holiday` (daftar libur per campaign, diisi HQ), `t_cineva_stage_extension` (bukti teks atau PNG/JPEG, CHECK konsistensi bukti) |
| Assignment | `t_cineva_assignment` (fee, marketing, benefit, status payout), `_social_profile`, `_deliverable` |
| Eksekusi dan QC | `t_cineva_delivery_draft`, `_delivery_review` (satu keputusan per draft), `_review_approval` (kunci `client`/`owner` sebagai baris), `_delivery_posting` |
| Keuangan | `t_cineva_payout` (CHECK nominal lebih dari 0), `_insight_snapshot` |
| Kebijakan | `t_cineva_cancellation` (hasil `evaluateCancellation`; `penalty_payee` NULL sampai client menjawab N6), `_late_submission` (pengajuan submit terlambat, jawaban B1) |

Keputusan desain: tanpa `ON DELETE CASCADE` (riwayat tidak boleh hilang); batas "1 kali, 2 hari" dan batas submit terlambat (L11) tetap konfigurasi aplikasi, bukan constraint; EAV tiket (`cstm_col`, `lbl_col`, `value`) tidak disentuh.

## Hasil uji

Skrip: [run_trial.cjs](../scripts/cineva_db_trial_2026_11_02/run_trial.cjs), DDL: [02_cineva_tables.sql](../scripts/cineva_db_trial_2026_11_02/02_cineva_tables.sql), pembatalan: [99_drop_cineva_tables.sql](../scripts/cineva_db_trial_2026_11_02/99_drop_cineva_tables.sql), tabel induk pengganti hanya untuk uji: [01_stub_parents.sql](../scripts/cineva_db_trial_2026_11_02/01_stub_parents.sql).

Server: MySQL 8.4.9 instance terpisah (`127.0.0.1:3307`, data di scratchpad sesi, root tanpa password, hanya loopback). Instance MySQL 8.0 yang datanya ada di `C:\ProgramData\MySQL\MySQL Server 8.0` **tidak disentuh** (binary server 8.0 tidak terpasang; menjalankan 8.4 di data itu akan menaikkan versi data secara permanen).

19 dari 19 pemeriksaan lulus: tabel dan FK terbentuk; insert lintas semua tabel berhasil lalu rollback mengosongkan tabel; FK yatim ditolak; campaign yang punya anak tidak bisa dihapus; review ganda untuk satu draft ditolak; CHECK untuk payout nol, bukti perpanjangan, rencana tahap tanpa tanggal, persen denda lebih dari 100 dan permintaan terlambat tertunda dengan waktu keputusan; uang negatif ditolak; enum tidak dikenal ditolak; skrip pembatalan menghapus semua tabel dan DDL dapat dipasang ulang. Database uji dihapus setelah selesai.

## Backend (3 Nov 2026, trial)

Modul baru `2.Backend/Integrated-API/app/modules/cineva-campaigns` (routes, service, repository, db, config, bootstrap; lihat `docs/README.md` di modul): 18 endpoint di `/api/cineva/v1`, gagal tertutup (503) tanpa runtime, aktif hanya bila `CINEVA_CAMPAIGNS_ENABLED=1` dengan principal factory dari `config/`. Aturan memakai package yang sama dengan frontend (`evaluateGate`, `evaluateCancellation`, `evaluateExtension`) lewat satu titik impor. Semua tulis memakai transaksi commit/rollback; list dibatasi 100 baris dengan metadata paginasi; scope program+company di setiap query; persetujuan QC dua lapis, gate payout, perpanjangan 1 kali 2 hari, jendela draft dengan pengajuan submit terlambat, dan pembatalan menurut kebijakan `CLIENT-2026-11-03`.

Uji: `npm run test:cineva` di backend, 8 tes terhadap MySQL nyata `cineva_trial` (lulus 8 dari 8), termasuk rollback saat insert anak gagal dan isolasi lintas company/creator. Server percobaan untuk dicoba langsung: `3.Knowledge/scripts/cineva_db_trial_2026_11_02/serve_trial.mjs` (header `x-test-principal`: `hq`, `creator`, `creator2`, `foreignHq`).

## Frontend tersambung ke API percobaan (3 Nov 2026)

`cineva-campaigns/apiRepository.ts` adalah repository dengan bentuk yang sama seperti repository dummy, tetapi membaca dan menulis lewat `/api/cineva/v1`. Pembacaan dari cache sinkron; setiap mutasi menjalankan reducer domain frontend lebih dulu (aturan lokal tetap berlaku), menerjemahkan hasilnya menjadi panggilan API di `apiMapping.ts` (pemetaan murni dan diff), lalu memuat ulang dari server. Server tetap menjadi sumber kebenaran: aturan yang sama dievaluasi ulang di sana. `CampaignSourceDesk` menambahkan pemilih sumber data (Dummy lokal atau API percobaan, preferensi di localStorage); bawaan tetap dummy sehingga perilaku lama tidak berubah. Backend ditambah endpoint batch, milestone, produk, deliverable, pilihan produk, fulfillment, dan daftar assignment, serta insight pada detail assignment.

Uji: `apiRepository.test.ts` menjalankan seluruh alur (buat campaign, kalender tahap dan perpanjangan, assignment, draft, QC dua persetujuan, posting, insight, payout, penolakan server atas kelebihan bayar) melawan API nyata dan dilewati bila API tidak menyala; 38 tes frontend lulus, 9 tes backend lulus; di browser, daftar campaign dari MySQL tampil dan penambahan batch lewat UI tercatat di server.

Batas: identitas dummy (hq-1, hq-2, creator-1, creator-2) dipetakan ke user id lewat header `x-test-principal` hanya untuk server percobaan (bukan autentikasi); perubahan brief/identitas campaign, penghapusan, dan data profil sosial belum didukung API dan ditolak dengan pesan jelas; nomor revisi eksekusi pada sisi frontend diturunkan dari jumlah kejadian, bukan disimpan server.

## Lanjutan 3 Nov 2026: penilaian crew, profil sosial, mock paket

- **Penilaian crew (N4, butir tergantung penanggung jawab project):** 3 tabel baru (`t_cineva_rating_criterion` append-only per campaign, `t_cineva_assignment_rating` per putaran, `t_cineva_rating_score` dengan CHECK 1 sampai 5), sehingga skema menjadi **20 tabel dan 27 foreign key** (uji DDL tetap 19 dari 19). Backend: `addRatingCriterion` dan `recordRating` (HQ saja, semua butir wajib dinilai, butir milik campaign lain ditolak, Creator tidak melihat penilaian). Frontend: `rating.ts` (domain murni dan guard repository), `RatingPanel.tsx` (editor butir dan form penilaian), dipetakan di adapter API. Pemetaan rata-rata ke grade sengaja tidak dihitung karena belum dijawab client.
- **Profil sosial Creator** sekarang dikembalikan API dan ditampilkan di mode API.
- **Mock paket Basic dan Pro** (`cineva-hq/PlansMock.tsx`, menu HQ "Paket Basic & Pro (mock)"): harga dari client, pembagian fitur usulan tim, tanpa penagihan.
- **Indeks knowledge:** konflik merge pada `KNOWLEDGE_INDEX.md` diselesaikan dengan menggabungkan kedua sisi, ditambah tautan dokumen baru.
- Uji akhir: frontend 41, backend 10 (MySQL nyata), domain-kit 23, scheduling-kit 27, semuanya lulus; alur penilaian dan mock dicek di browser (penilaian dari UI tercatat di server).

## Batas verifikasi

- Server produksi hots adalah MySQL 8.0.20 (baseline); uji dijalankan di 8.4.9. Fitur yang dipakai (CHECK) tersedia sejak 8.0.16, tetapi **belum diuji di 8.0.20**.
- Tabel induk adalah pengganti minimal, bukan skema hots asli; relasi ke tabel hots lain (misalnya tenant ticket owner) belum dirancang.
- DDL di MySQL auto-commit sehingga rollback transaksi tidak berlaku; satu-satunya jalan mundur adalah skrip 99.
- Belum ada kode backend yang membaca atau menulis tabel ini; belum ada migrasi ke `hots`; belum ada pengujian beban atau indeks selain yang tertulis.
- Kolom bergantung jawaban client yang belum ada: penerima denda, batas dan dampak submit terlambat.
