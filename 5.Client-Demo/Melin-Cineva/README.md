# Cineva — demo Creator Space Melin

1. Download dan ekstrak ZIP, lalu buka **Cineva-Melin-Demo.html** di Chrome atau Edge. Tidak perlu server, login, database atau koneksi internet.
2. Gunakan menu Dashboard, Campaign & brief, Deliverable, Kalender & visit, Pembayaran, Insight dan Profil Creator. Form dapat diedit; perubahan hanya simulasi.
3. Perubahan disimpan di localStorage browser/perangkat yang sama. Jika storage tidak tersedia, halaman memberi pemberitahuan dan perubahan tetap ada selama sesi dibuka.
4. Setelah mengedit, klik **Export HTML terbaru**. Kirim file hasil download tersebut ke client: data terakhir sudah tertanam di HTML, tanpa bergantung pada storage komputer Anda.
5. **Export JSON** untuk backup dokumen. Menu **Data JSON** menyediakan import/editor lanjutan. `cineva-melin-data.json` adalah data awal; HTML sudah memuat salinannya.

Paket memuat profil, kontak dan link asli Melin dari workbook yang dipilih, serta contoh dokumen workspace/brand/campaign/ticket/assignment. Sel sumber tetap tersedia di `rawSource` JSON. Ini bukan akun production dan tidak melakukan pembayaran nyata.

Kalender berisi milestone Excel, bukan booking visit terkonfirmasi. Ada konflik periode ringkasan/detail, tanggal posting ambigu, dan payment sebelum produksi; lihat catatan halaman dan sesuaikan setelah konfirmasi. Tidak ada jam visit yang dikarang. Fee brief, benefit non-cash dan harga retail terpisah. Status Diajukan bukan kas diterima.

Browser tidak menimpa HTML/JSON di disk secara otomatis. Simpan hasil export untuk membawa edit ke perangkat lain. Tombol **Pulihkan data bawaan** kembali ke seed yang tertanam pada file HTML yang sedang dibuka.
