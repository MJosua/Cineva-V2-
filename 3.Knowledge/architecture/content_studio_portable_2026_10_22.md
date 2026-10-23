# Content Studio: HTML mandiri untuk demo kirim dokumen

Tanggal 22 Oktober 2026. Pengguna meminta kemasan compact HTML siap pakai untuk demo melalui WhatsApp. Scope ini membuat file untuk dikirim pengguna, tidak mengirim pesan, mengunggah ke akun eksternal, atau mengaktifkan backend/provider.

## Deliverable

- `5.Client-Demo/Content-Studio/Cineva-Content-Studio-Demo.html`: satu file HTML sekitar 1,01 MB decimal. React/JS/CSS, seed, template dan renderer ter-inline; tanpa CDN, module import, web font remote, API, server atau login.
- `5.Client-Demo/Content-Studio/Cineva-Content-Studio-Demo.zip`: sekitar 258 KB decimal, berisi tepat HTML dan CARA-DEMO.txt. Ini alternatif paket kirim, bukan dependency menjalankan HTML.
- `CARA-DEMO.txt`: kirim sebagai dokumen, unduh dan buka HTML di browser, urutan demo dan cara menyertakan edit.

## Dampak arsitektur

Reuse komponen `ContentStudio`, HotsForm/dynamic-form, ui-kit, `@hots/content-kit`, renderer SVG/PNG/ZIP, dan theme adapter Cineva existing. Tidak membuat engine atau UI simulasi pengganti dengan logika berbeda. Perubahan production-facing hanya optional `storage`/`seed` pada createStudioPreview serta optional initialDocumentId pada ContentStudio; default lama dipertahankan. Tidak mengubah backend, HOTS Kantor, database, EAV atau provider.

Source wrapper offline terpisah di `1.Frontend/HOTS/src/features/content-studio/offline`: entry/shell, synthetic seed, envelope validation, storage fallback dan portable export. Semua build/test/report scripts ada di `3.Knowledge/scripts/content_studio_portable_2026_10_22`. HTML memakai emas/putih/gelap dari adapter vendor; tidak menyalin warna aplikasi screenshot client.

Demo memuat empat contoh konten per workspace, empat akun sosial sintetis, empat post contoh + satu jadwal dan metrik sintetis. HQ dan Creator memiliki state terpisah, HQ dapat review dan Creator tidak dapat approve. Ada delapan desain aktual, bukan 64 desain client. Bahasa/format, editor/foto/logo/template, Brand Kit dan PNG export bekerja lokal; parser teks, akun, publish dan metrik diberi label simulasi.

## Edit, storage dan export

localStorage menggunakan namespace hash build terpisah dari aplikasi preview. Jika diblokir/penuh, memory fallback tetap memungkinkan edit dan export, dengan peringatan untuk mengunduh HTML sebelum menutup browser. Data invalid tidak menimpa dokumen terakhir yang valid.

Unduh HTML terbaru membaca state yang sudah disimpan untuk kedua workspace, mengganti seed JSON, memberi storage ID baru dan membersihkan root DOM sebelum serialisasi. Penerima dengan browser kosong mendapat isi edit terbaru, bukan seed lama atau localStorage perangkat pengirim. Perubahan editor yang belum diklik Simpan belum ikut export; ini dijelaskan di panduan. Export/impor JSON memakai envelope validation. Script-like text di-escape pada seed dan dirender sebagai teks React, tidak menjadi kode.

File HTML awal tidak dapat ditimpa otomatis oleh browser. Pengguna harus mengirim file hasil download terbaru bila ingin menyertakan perubahan. Reset contoh mengembalikan seed bawaan file yang sedang dibuka, dengan konfirmasi lokal.

## Verifikasi

15 browser E2E langsung melalui file URL, jaringan offline, lulus: startup self-contained/seed terpilih; theme light/dark Cineva; analytics contoh; galeri template; edit/reload; actual PNG ZIP dimensions/order; HQ QC/schedule; panduan; inert script-like text; export HTML buka pada fresh context; invalid JSON tidak menimpa state; viewport 390px tanpa overflow; isolasi/role Creator; blocked storage fallback+HTML export; zero HTTP requests/browser errors.

PNG dalam ZIP benar-benar 1080x1350 dengan urutan tiga slide dan caption. Backend tidak diperlukan. Mobile coverage adalah **Chromium viewport emulation**, bukan pengujian perangkat fisik atau viewer lampiran WhatsApp. Aplikasi pembuka lampiran penerima tetap harus menjalankan JavaScript pada file HTML; jangan mengklaim preview dokumen statis mampu menjalankan demo.

42 kontrak/service existing lulus setelah penambahan optional props/storage. Type diagnostics fitur baru 0; full app tetap 113. Scoped ESLint 0 error/0 warning. Build HTML menggunakan esbuild browser IIFE production dan CSS build HOTS yang tersedia; file URL E2E membuktikan resource tidak bergantung localhost/internet.

Bukti `3.Knowledge/reports/content_studio_portable_2026_10_22/build.json`, `e2e.json`, screenshot, edited-HTML fresh-context dan ZIP PNG. Laporan Excel teknis terpisah dari paket customer.

Perintah: `npm.cmd run demo:content-studio:build` kemudian `npm.cmd run test:content-studio:portable`. Builder memakai seed sintetis baru; perubahan penerima disimpan lewat tombol Unduh HTML terbaru, bukan menjalankan ulang builder.
