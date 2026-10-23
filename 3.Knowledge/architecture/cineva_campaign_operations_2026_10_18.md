# Cineva Campaign Operations

## Scope dan batas arsitektur

Implementasi 18 Oktober 2026 mengikuti mapping WB01–WB11 pada [referensi workbook](workbook_reference_2026_10_18.md). Campaign adalah objek bisnis, batch membagi pelaksanaan dan assignment adalah unit kerja talent. Ticket tetap container workflow HOTS. Modul preview tidak menghasilkan tabel atau menebak DDL/EAV: integrasi server harus menunggu schema fisik dan mempertahankan `cstm_col/lbl_col/value` serta kontrak assignment existing.

Komposisi baru berada di `1.Frontend/HOTS/src/features/cineva-campaigns`. UI memakai layout, controls dan form HOTS; penyimpanan dummy memakai app-core. Halaman legacy `JobMarketplaceCampaigns`, `JobMarketplaceBatches`, `JobMarketplaceTalentAssignments` dan service Production/Content Shoot tetap tersedia. Adapter operasional ini adalah kontrak frontend dummy, bukan pengganti engine backend kedua.

HOTS `D:/Kantor` hanya referensi read-only. Tidak ada perubahan backend, database, auth, upload atau provider. Data contoh sintetis; nama/kontak/alamat/link pribadi workbook tidak disalin. Workbook sumber tetap utuh. Identitas demo bukan bukti isolasi multi-tenant di server.

## Grup implementasi

1. Foundation: campaign brief, batch, milestone, assignment dan snapshot akun sosial. HQ mengelola campaign miliknya; Creator memperoleh brief dan assignment miliknya saja. Perubahan harus memeriksa actor dan versi terbaru, bukan hanya menyembunyikan tombol.
2. Execution: pilihan produk/fulfillment terpisah dari deliverable, draft–revision–QC–post. Deliverable untuk brand tanpa posting berbeda dari publikasi di akun creator. URL referensi hanya disimpan, tanpa menghubungi layanan eksternal.
3. Finance/insight: cash payout creator terpisah dari quote client, biaya marketing dan benefit produk. Requested bukan Paid. Riwayat pembayaran dan snapshot insight tidak ditimpa. ER adalah `(likes + comments + shares + saves + reposts) / views * 100` dalam poin persentase; denominator tidak tersedia/0 menghasilkan belum tersedia, bukan nol atau Infinity. Tidak menetapkan kategori engagement tanpa aturan bisnis.

## Validasi dan kelanjutan

Acceptance mencakup persist/reload, dua HQ dan dua Creator, kegagalan storage, konflik perubahan stale, revisi konten, bukti pembayaran, metrik invalid dan browser E2E desktop/mobile dengan backend/external traffic diblokir. Semua tes memakai data dummy.

Perintah dan hasil final dicatat setelah verifikasi di `3.Knowledge/reports/cineva_campaigns_2026_10_18`. Integrasi DB, tenant authentication, real upload/payment, reminder delivery dan sinkronisasi assignment/ticket server tetap pekerjaan berikutnya; preview lokal tidak membuktikannya.

## Kontrak implementasi

- Route preview `#/hq/campaigns` dan `#/creator/campaigns`; menu Campaign operations / Assignment campaign. Penyimpanan `cineva_campaigns_dummy_v1_campaigns` memakai envelope app-core. Reset dummy workspace lama tidak menghapus campaign bersama secara implisit.
- `repository.ts` memeriksa actor, owner dan expected campaign revision. Tab lama ditolak. Setiap mutasi assignment menjalankan `assertExecutionMutation` dan `assertFinanceMutation`; callback tidak dapat memalsukan QC atau menulis ulang ledger. Master campaign hanya menambah assignment baru tanpa history; perubahan assignment existing melalui jalur assignment. Output yang sudah memiliki execution/finance dipertahankan, output baru tetap additive.
- Creator projection menghapus assignment/batch asing dan biaya marketing internal. Ini kontrak adapter dummy; localStorage tetap ada di browser pengguna dan bukan batas keamanan server.
- `execution.ts` mempertahankan draft/review berversi. Posting wajib setelah QC dan tanggal posting tidak mendahului tanggal persetujuan WIB. Output brand tanpa posting tidak mempunyai form publikasi. Katalog produk/HQ order dan tanda diterima independen dari konten dan cash.
- `finance.ts` menjadikan ledger authoritative, retry ID stabil dan exact-content; pembayaran sebagian/lunas dihitung dari ledger. Bukti payout adalah referensi teks dummy, bukan unggahan atau konfirmasi bank. Insight snapshot terkait post dan tanggal pengambilan; reminder H+7 baru indikator lokal, belum scheduler/pesan otomatis.
- Form baru memakai `HotsForm`. E2E menemukan benturan DOM ID ketika beberapa form memakai nama `deadline`; fork lokal dynamic-form **0.1.0-cineva.2** menambahkan optional `inputId` untuk label custom renderer. Adapter memberi `useId()` per form, nama/nilai field tetap utuh dan default package lama tetap berlaku. Tidak mengubah paket original HOTS.
- Regresi finance: guard semula menyerahkan seluruh metadata ke validator nominal. Diperbaiki dengan tiga nominal eksplisit dan tes repository configure → request → process → partial payout; array history tidak diperlakukan sebagai rupiah.

## Cara verifikasi

`npm.cmd run test:campaigns` menjalankan suite foundation/execution/finance dan guard file 1.000 baris. `npm.cmd run test:campaigns:e2e` menggunakan preview 48174; set `CINEVA_PRODUCTS_ORIGIN=http://127.0.0.1:48175` untuk build production. Browser context baru memakai fixture sintetis dan memblokir backend/external requests. Report final mengandung jumlah tes saat ini, origin, lint/feature diagnostics dan keterbatasan full-app TypeScript.

Hasil final: **19 domain campaign dan 12 browser campaign lulus**, browser pada production preview 48175. Regresi services 15 dan maturity 9 juga lulus pada build production; produk A/B 19 serta komponen 19 lulus pada fixture/dev. Kontrak paket 17 dan domain produk 9 lulus. Production Vite build berhasil. Lint features 0 error/0 warning dan feature TypeScript diagnostics 0; full app masih 101 diagnostics lama. Semua feature code di bawah 1.000 baris, terbesar execution.ts 144; reusable table terbesar 674. Tidak ada tes DB, tenant server, bank atau provider nyata.

Perbaikan form mempertahankan schema yang dihias menggunakan `useMemo`: schema baru pada setiap keystroke sempat me-reset brief existing, ditemukan oleh regresi services dan diperbaiki sebelum build final. Browser creation/setup memverifikasi DOM ID form unik; test stale campaign memakai dua tab dengan draft disiapkan sebelum perubahan tab lain. Satu percobaan parallel browser mengalami `ERR_NO_BUFFER_SPACE` saat navigasi; pengulangan berurutan lulus. Ini kegagalan resource test runner, bukan klaim defect aplikasi.

Laporan: `reports/cineva_campaigns_2026_10_18/Cineva_Campaign_Operations.xlsx`, `validation.json`, `contracts-results.txt`, `e2e-results.json`. Screenshot mobile dan report dirender serta diperiksa; report tidak memiliki formula error pada scan. Riwayat gagal sementara diarsipkan terpisah, tidak dipakai sebagai bukti hasil final.
