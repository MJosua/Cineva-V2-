# Crosscheck Excel live lokal

Pengguna secara eksplisit meminta data tidak disamarkan dan live dari Excel pada 18 Oktober 2026. Keputusan ini menggantikan preview snapshot tersamarkan pada `account_reference_2026_10_18.md`. Tiga pemilihan semula dipertahankan dari `reports/account_reference_2026_10_18/selection.json`, bukan diacak ulang. Nama dan isi sel asli boleh ditampilkan di browser lokal untuk crosscheck; tidak diekspor ke report, knowledge, fixture tes atau bundle source.

## Batas arsitektur

- `scripts/live_reference_2026_10_18/server.py` adalah bridge lokal hanya baca pada **127.0.0.1:48176**. Endpoint tetap `/accounts`, allowlist dua nama workbook, tidak menerima parameter path/file dan tidak memiliki write endpoint. Host serta Origin dibatasi untuk preview lokal. Tidak menghubungkan database, engine transaksi, upload atau HOTS kantor.
- Vite dev/preview proxy `/hots/reference-excel/accounts` ke bridge; ini konfigurasi preview lokal, bukan endpoint backend production yang dideploy. Jalankan preview dengan host 127.0.0.1. Tidak menjadikan file workbook endpoint download publik.
- Setiap request membaca byte file terbaru lalu membuka formula dan cached values dari byte yang sama. Tidak memakai output snapshot lama, tidak menulis workbook. UI membaca saat dibuka, setiap 30 detik dan lewat tombol **Muat ulang dari Excel**. Perubahan Excel perlu disimpan lebih dahulu. Bridge harus tetap berjalan; restart command menggunakan bundled Python.
- `ReferenceAccounts.tsx` memakai Card/Badge/Button dan theme vendor existing. `liveSource.ts` menyediakan fetch adapter no-store/omit credentials. Tidak menyimpan respons di localStorage, aplikasi dummy, data ledger atau DB. Respons no-store, tanpa log nilai pribadi.
- Roster dan tabel lanjutan dicocokkan dengan nama unik dalam sheet. Nama duplikat ditandai dan tidak digabung. Sheet/baris/hash saat baca ditampilkan. Pemilihan mengacu koordinat roster semula: jika struktur/baris berubah, perlu review pemilihan; bukan identity reconciliation engine.

## Nilai sumber dan maknanya

Roster menampilkan semua kolom berheader termasuk nama, sosial, telepon, alamat, produk dan progress sumber sesuai izin pengguna. Tabel lanjutan menampilkan progress/engagement asli. Brief/budget/timeline memuat isi S:U di bagian overview terkait. Setiap field mempunyai label, koordinat, tipe, number format dan formula jika ada.

Sel null/empty ditandai **Kosong di Excel**, bukan generik belum tersedia. Angka 0 dipertahankan. Teks kategori pada FOLLOWERS tidak diubah menjadi null/0. URL ditampilkan utuh sebagai teks, tanpa membuka atau mengambil konten link. Error cache seperti `#DIV/0!` terlihat bersama rumusnya. Native Excel recalculation tidak dilakukan; nilai formula bergantung pada cache hasil simpan Excel. Currency/budget campaign tidak dianggap fee pribadi dan STATUS PAYMENT tidak otomatis menjadi paid_amount.

### Klarifikasi pengguna: followers dan niche

Pengguna menegaskan FOLLOWERS adalah jumlah pengikut Instagram; jawaban **Lifestyle** harus masuk niche/kategori konten. `profileMapping.ts` memisahkan angka followers valid (integer non-negatif, termasuk 0 dan string angka/grouped ribuan) dari teks niche. FOLLOWERS TIKTOK tidak diambil sebagai jumlah Instagram. `ReferenceSummary.tsx` menampilkan **Followers Instagram** hanya numerik; jika belum ada angka, ditulis **Jumlah belum tercatat**. **Niche / kategori konten** menampilkan Lifestyle sebagai tag dengan koordinat sumber.

Header sumber yang keliru tetap bisa diperiksa dalam detail: `Niche konten (header Excel: FOLLOWERS)` disertai nilai, koordinat dan format aslinya. Excel tidak diedit. Mapping dilakukan pada adapter tampilan; bukan DB migration atau perubahan engine. Satu E2E tambahan memakai Lifestyle sintetis untuk membuktikan kategori tidak tampil sebagai jumlah pengikut; total suite live sekarang **6 E2E**.

Sebelumnya banyak placeholder timbul dari penyederhanaan adapter: identitas disamarkan, string selain whitelist diganti catatan generik, follower kategori menjadi null, dan cash pribadi tidak memiliki sumber nominal. Preview live menghilangkan penyederhanaan itu untuk pemeriksaan sumber; data yang benar-benar kosong tetap kosong.

## Pengujian dan operasi

Empat unit test Python memakai workbook objects sintetis/mocked: raw link/category/error/formula, zero versus blank, duplicate-name ambiguity dan path allowlist; tidak membaca workbook asli. Lima browser E2E memakai endpoint sintetis untuk nama/raw/formula, tiga deep-link, refresh data baru, failure/recovery dan tanpa localStorage/external request. Data nyata hanya dibaca runtime untuk crosscheck yang diizinkan, bukan fixture tes.

Perintah: bundled Python `3.Knowledge/scripts/live_reference_2026_10_18/server.py`; `node 3.Knowledge/scripts/live_reference_2026_10_18/e2e.mjs`; bundled Python `reader_test.py`. Preview production menggunakan 48175, route Creator/reference tetap sama. Tidak ada perubahan HOTS kantor atau DB. Laporan Excel turunan hanya mencatat kontrak, jumlah tes dan provenance non-personal.

Hasil: 4 unit pembaca dan 5 E2E live-adapter lulus dengan data sintetis. Sembilan domain produk existing lulus, lint features 0 error/0 warning, feature TypeScript diagnostics 0; full app baseline tetap 101 diagnostics. Production build berhasil. Runtime bridge/proxy dan isi sumber asli diperiksa langsung pada browser lokal sesuai izin pengguna. File fitur baru <1.000 baris. Snapshot/component/extractor lama diarsipkan dengan provenance pada `3.Knowledge/_archive/live_reference_2026_10_18`; entry E2E lama meneruskan ke suite baru, extractor snapshot lama dihentikan agar tidak mengacak atau mengekspor snapshot lagi.

Laporan `reports/live_reference_2026_10_18/Cineva_Live_Excel_Reference.xlsx` dirender/diperiksa, tanpa formula error pada scan. Report tidak berisi nama/kontak/alamat/baris transaksi asli. Bridge 48176 dan preview 48175 dibiarkan berjalan untuk crosscheck pengguna.
