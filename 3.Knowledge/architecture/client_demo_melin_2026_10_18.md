# Paket demo client: dokumen Melin dan HTML mandiri

Pengguna mengizinkan export data referensi Melin Riswana Putri dan campaign sheet terkait menjadi JSON/NoSQL dummy, HTML editable dan localStorage untuk diunduh serta ditunjukkan ke client. Output berada di `5.Client-Demo/Melin-Cineva/`. Ini memperluas izin sebelumnya yang hanya mengizinkan pembacaan live lokal; output sekarang memang memuat profil/link asli pilihan pengguna. Tidak mengirim ke pihak lain, tidak mengubah workbook, DB, HOTS kantor atau akun production.

## Komposisi modular

`1.Frontend/HOTS/src/features/cineva-offline/` terdiri dari model/validation, documentStore app-core, portableExport, OfflineDemo shell, DataPanel, DocumentPanels, CalendarPanel dan entry. Form menggunakan `HotsForm`/dynamic-form lokal; Card/Button/Input/Badge memakai ui-kit snapshots yang sama, theme coklat/emas/putih dari CinevaVendorTheme. Tidak membuat mesin form atau kalender transaksi backend baru. Setiap source file <1.000 baris. Output JS/CSS dipaketkan inline ke satu HTML; generated bundle bukan source yang diedit manual.

JSON adalah kontrak dokumen demo, bukan DDL atau physical schema. User, campaign, insight, deliverable, events dan payments menjadi dokumen utama. `collections` menyimpan workspace, brand, batch, ticket dan assignment yang direferensikan lewat ID. Ticket mempertahankan struktur EAV `cstm_col`, `lbl_col`, `value`; field fee/paid/status disinkronkan saat edit melalui adapter. Nominal kas sumber null tidak diubah menjadi 0 terverifikasi. Ledger pembayaran tambahan adalah simulasi tersendiri. Backend kelak harus memakai schema fisik yang disahkan, transaction/rollback dan tenant auth.

## Mapping sumber dan ketidakpastian

Sumber: SIMPLY JUUN.xlsx / Assesment Simply Juun 3, roster baris 36 dan insight baris 61. Pemilihan diverifikasi nama sebelum export. Raw cell observations disimpan pada `rawSource` di output JSON; knowledge/report/fixture tidak menyalin kontak/alamat/link pribadi. Extractor memakai bridge reader langsung tanpa HTTP dan tidak menulis workbook.

- Fee mengikuti brief per creator S19/S21, bukan bukti kontrak individual. Benefit non-cash S21 terpisah dari retail SKU T16 dan marketing S20.
- Payment sumber AA36 tetap Diajukan, `paidAmount:null`, ledger kosong. Ticket demo wait_pay merupakan mapping simulasi dari konteks pengajuan, bukan kesimpulan QC atau kas nyata.
- Niche pribadi tidak disimpulkan dari kategori target campaign. Followers numerik dan Instagram tetap data profil sumber.
- Kalender menggunakan tanggal detail S24:T24 sebagai milestone all-day, tanpa jam atau visit asumsi. Ringkasan periode S17 berbeda dengan detail dan tetap ditampilkan dalam catatan.
- Posting dengan pemisah rentang ambigu belum diberi tanggal pasti; tanggal payment sebelum produksi ditandai review tanpa otomatis diperbaiki. Drafting/insight rentang antarbulan dipertahankan.
- Link output menunjukkan referensi tersedia, tidak otomatis QC approved atau bukti waktu publikasi. ER memakai helper existing berdasarkan views; kategori sumber tidak dihitung ulang dengan threshold rekaan.

## Persistensi dan export

HTML memuat JSON seed, CSS dan JS inline, tanpa CDN, font remote, backend atau bridge Excel. Dapat dibuka melalui file URL di browser modern. Edit dokumen diverifikasi sebelum save; localStorage memiliki namespace dan storage ID per seed/export. Jika browser memblokir localStorage, perubahan sesi tetap terlihat disertai peringatan untuk export.

Export JSON mengeluarkan dokumen terbaru. **Export HTML terbaru** mengganti JSON seed dan storage ID serta membersihkan root DOM sebelum serialisasi, sehingga client dengan browser kosong menerima data edit terbaru. Script-like text di JSON di-escape dan hanya dirender React sebagai teks. Import divalidasi sebelum mengubah state; JSON invalid tidak mengganti dokumen terakhir. File asli disk tidak ditimpa otomatis; user menyimpan hasil download.

Output include HTML, JSON dan README; ZIP adalah paket kirim. File tersebut berisi data asli yang pengguna minta, jadi tidak otomatis dipublikasikan atau dimasukkan Git remote. Tidak ada auth/password/token. Lampiran Excel audit bersifat opsional untuk reviewer, bukan dependency menjalankan demo.

## Bukti verifikasi

Semua tes memakai fixture sintetis: tujuh kontrak dokumen, sepuluh browser E2E melalui **file URL tanpa server**. E2E mencakup edit/reload, kalender review/add visit, payout/overpay, insight denominator, invalid JSON, HTML export pada context baru tanpa storage lama, JSON export, mobile overflow, script-like string inert dan localStorage blocked fallback. Tidak memakai row asli Melin sebagai fixture.

Hasil dan screenshot sintetis ada di `reports/client_demo_2026_10_18`. Struktur seed aktual diverifikasi terhadap JSON output; pembukaan file aktual lewat browser dalam aplikasi dibatasi protokol file oleh kebijakan browser. Tidak mencoba bypass; layout diperiksa dari screenshot E2E sintetis dan file dapat diunduh untuk dibuka pengguna. Full-app TypeScript baseline lama dicatat terpisah dari feature diagnostics. Source Excel dan HOTS kantor tetap read-only.

Hasil akhir: 7 kontrak + 10 E2E sintetis lulus, build frontend berhasil, lint fitur 0 error/0 warning, feature TypeScript diagnostics 0; full-app baseline 101 diagnostic lama tetap ada. Seed dalam HTML sama persis dengan JSON output, hash workbook tetap sama saat export, seluruh source baru di bawah batas 1.000 baris. ZIP berisi tepat HTML, JSON dan README. Excel audit terpisah `reports/client_demo_2026_10_18/Cineva_Client_Demo_Report.xlsx` dirender/diperiksa tanpa formula error.

Perintah root: `npm.cmd run test:client-demo`, `npm.cmd run test:client-demo:e2e`, `npm.cmd run demo:client:build`. Builder hanya membaca JSON output saat ini; tidak mengambil Excel ulang secara implisit. `scripts/client_demo_2026_10_18/extract.py` adalah extractor sekali pakai; menjalankannya lagi mengganti seed JSON dari workbook, bukan cara menyimpan edit client. Edit client disimpan dengan export pada UI.
