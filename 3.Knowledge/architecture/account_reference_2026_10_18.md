# Preview tiga akun referensi Excel

**Superseded untuk runtime**: pengguna kemudian meminta data asli tanpa penyamaran dan pembacaan live. Lihat [bridge Excel live](live_excel_reference_2026_10_18.md). Bagian berikut adalah riwayat implementasi snapshot, bukan perilaku halaman terbaru.

Pengguna pada 18 Oktober 2026 mengizinkan memilih tiga akun acak untuk melihat tampilan berdasarkan data Excel. Ini pengecualian terbatas terhadap aturan sebelumnya yang hanya mengizinkan workbook sebagai referensi: hanya tiga snapshot tersamarkan ditambahkan, bukan import workbook penuh atau penggunaan data asli untuk tes.

`src/features/cineva-reference/ReferenceAccounts.tsx` compose Card/Badge dan layout vendor existing, route `#/creator/reference?account=ref-1` sampai `ref-3`, menu **Akun referensi Excel** serta link dashboard. Tampilan hanya baca, terpisah dari repository dummy, identitas demo, ledger dan backend. Source JSON tersamarkan dibundel frontend; karena itu jangan memasukkan nama, handle, URL, kontak, alamat atau bukti transaksi pribadi ke file tersebut. Snapshot bukan batas keamanan atau akun login server.

Pemilihan memakai SystemRandom: tiga cohort dari empat sheet, masing-masing satu baris roster, nama terpilih berbeda pada tiga sample. Nama hanya dipakai sementara di memori untuk deduplikasi/pencocokan unik dalam sheet dan tidak diekspor. Pemilihan disimpan di `reports/account_reference_2026_10_18/selection.json`; jangan rerun extractor jika hanya menguji atau build karena akan mengganti sampel. Tidak mengklaim sampel representatif statistik atau identitas stabil lintas campaign.

Snapshot menyimpan alias Akun Referensi 1–3, provenance file/sheet/baris/hash, angka follower valid, pilihan produk, observasi progress yang di-whitelist dan insight yang cocok secara unik. Sel berisi URL hanya menghasilkan catatan ketersediaan, tanpa URL asli. Teks tidak dikenal diringkas sebagai catatan perlu review. Telepon/alamat/nama/handle tidak dibaca ke output. Tidak mengunjungi link workbook.

Cash fee dan paid_amount tetap belum tersedia: tanggal/teks `STATUS PAYMENT` bukan bukti kas atau nominal. DONE pada kolom drive bukan otomatis QC approved/posted. Insight SUM(likes:reposts)/views ×100 hanya jika semua input numerik non-negatif dan views >0; missing tetap null. Hasil merupakan pembacaan cache Excel, bukan recalculation native. Konflik tanggal campaign tidak dijadikan deadline otomatis.

Script sekali pakai `scripts/account_reference_2026_10_18/extract.py` membaca workbook dengan bundled openpyxl read-only, memeriksa hash sebelum/sesudah dan hanya mengekspor whitelist. Workbook asli, database dan HOTS kantor tidak diubah. JSON tidak ditulis ke localStorage.

Tes `scripts/account_reference_2026_10_18/e2e.mjs` mengganti import accounts.json pada saat bundling dengan tiga fixture sintetis; hasil bundle diperiksa agar tidak memuat nama file workbook asli. Empat E2E memverifikasi pergantian akun/deep-link/reload, null cash/insight, provenance dan tanpa storage/backend/external request. Tes tidak memakai baris real. Build/lint/TypeScript mengikuti pipeline Cineva existing. Report Excel hanya alias/provenance, bukan data pribadi.

Hasil final: empat E2E referensi lulus dengan fixture sintetis; sembilan domain produk existing lulus, lint fitur 0 error/0 warning dan feature TypeScript diagnostics 0 (full app tetap 101 diagnostic baseline). Production build berhasil. Tampilan snapshot tersamarkan pertama dan ketiga diperiksa langsung di browser lokal; ini pemeriksaan visual sumber yang diizinkan, bukan tes transaksi dengan data asli. Report Excel dirender/diperiksa tanpa formula error. Preview disajikan di 48175; tidak ada perubahan DB atau HOTS kantor.
