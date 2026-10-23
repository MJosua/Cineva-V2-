# Online Order Kantor: Flavour 2 tersangkut

## Implementasi setelah persetujuan pengguna

Pengguna menyetujui perbaikan dengan jawaban "ya" setelah pembahasan reset Flavour 2 di Kantor. Pengecualian sesi ini terbatas pada source komponen E-Order tersebut dan validasi build lokal. Dokumentasi/laporan/script tetap disimpan di Cineva. Tidak deploy atau menulis database/CMS.

- Handler membandingkan SKU lintas tipe dengan String. Bila slot awal mengambil SKU slot berikutnya, slot yang bentrok dan slot dependen sesudahnya direset ke sku "-1", qty "0", tolling/pallet nol dan MOQ/kapasitas kosong.
- Filter per-slot tetap menolak SKU milik slot sebelumnya. Penghapusan filter includes global mempertahankan opsi aktif serta memungkinkan Flavour 1 mengambil SKU Flavour 2, yang kini dibersihkan oleh handler.
- Reset existing pada jalur pallet sekarang menggunakan helper yang sama, mengganti SKU 0 menjadi "-1" dengan metadata kosong.
- ContainerRuleEngine dan aturan kapasitas/MOQ/rasio tidak diubah. Form biasa dan Container Groups memakai editor yang sama.
- Reproduksi sebelum patch gagal: Flavour 2 masih SKU numeric 200, expected "-1". Setelah patch, pemeriksaan handler aktual lulus untuk bentrok lintas tipe, reset slot dependen/metadata, pilihan berbeda, clear manual dan pallet. Script: ../scripts/check_online_order_flavour_reset_2026_10_22.cjs.
- Sembilan tes containerGroups existing lulus. Build Vite E-Order lulus (1840 modules, 21.29 detik) dengan warning dependency pdfjs eval dan ukuran bundle. Browser authenticated, backend submit, data DB dan production belum diverifikasi.

Bagian audit di bawah adalah bukti kondisi sebelum perbaikan.

## Klarifikasi lanjutan

Pengguna menegaskan filter Flavour 2 agar tidak memilih Flavour 1 adalah fitur yang disengaja. Jangan menghapus aturan anti-duplikat.

Source non-bulk: saat Flavour 1 berubah pada pallet === 0, baris 533-536 hanya mereset quantity slot berikutnya, tidak SKU. Jika perubahan ke SKU yang sama berhasil masuk, kedua SKU dapat tetap sama dalam state, dengan quantity slot kedua nol. Filter baris 731-732 menyembunyikan opsi yang sama dari Flavour 2, tetapi tidak mengubah state menjadi -1. Apakah Flavour 1 bisa memilih SKU Flavour 2 melalui UI juga bergantung pemeriksaan includes yang sensitif tipe pada baris 751.

Pada jalur pallet selain numeric 0, baris 551 memanggil updateFlavour(nextFlavour, 0, "-1", ...), sehingga SKU berikutnya menjadi numeric 0, bukan string -1. Ini berbeda dari placeholder.

Usulan sesuai pertanyaan pengguna: jika SKU Flavour 1 yang baru sama dengan Flavour 2, kosongkan slot Flavour 2 secara eksplisit dengan sku string -1 dan quantity nol, beserta metadata dependen. Pertahankan filter anti-duplikat. Belum implementasi atau reproduksi runtime.

Tanggal: 22 Oktober 2026. Audit source read-only Kantor. Tidak mengubah aplikasi/database.

Pengguna melaporkan Flavour 2 bisa dikosongkan setelah memilih flavour lain, kemudian Choose Flavour. Lokasi kasus adalah Online Order Kantor, bukan Cineva.

Source: D:/Kantor/1.Frontend/E-Order/src/features/orders/components/AddMoreContainer/FlavourNonBulk_Component.jsx.

- Baris 703 mengikat nilai select ke SKU state. Baris 748-752 membuang opsi jika SKU ditemukan pada seluruh slot terpilih, termasuk slot aktif. Pemeriksaan includes sensitif tipe string/number. Ini kandidat penyebab opsi aktif hilang sementara SKU tetap tersimpan.
- Baris 430-454: memilih -1 mereset SKU/quantity slot aktif dan berikutnya, serta mengembalikan quantity flavour sebelumnya. Ini menjelaskan mengapa workaround pengguna dapat membersihkan slot.
- Jalur reset lain memakai SKU 0 atau string kosong, sedangkan placeholder memakai -1. Normalisasi nilai kosong perlu diaudit bersama filter opsi.

Belum dibuktikan: reproduksi browser, versi production, tipe SKU runtime, payload transaksi, dan data DB. Jangan menganggap dua flavour terbukti tersimpan pada order tertentu.

Dampak usulan: perbaikan lokal state/select pada adapter E-Order, tetap memakai containerRuleEngine. Pertahankan opsi aktif, cegah duplikat hanya antar-slot, normalisasi kosong dan reset dependent fields. Tidak perlu perubahan schema. Implementasi belum dilakukan karena Kantor read-only dari workspace ini.
