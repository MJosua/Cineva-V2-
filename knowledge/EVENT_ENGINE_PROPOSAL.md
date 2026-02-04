# Event Engine: Comprehensive Overview
## 1. Executive Summary
**Event Engine** adalah sistem manajemen kampanye digital yang modular, terukur, dan real-time. Dirancang untuk mempercepat peluncuran aktivitas pemasaran seperti **Lucky Draw**, **Distribusi Voucher**, **Pendaftaran Event (RSVP)**, dan **Kompetisi**.

Sistem ini memisahkan logika bisnis (Backend API) dari tampilan (Frontend/Headless), memungkinkan tim untuk meluncurkan berbagai jenis event dengan cepat tanpa membangun sistem dari nol setiap saat.

---

## 2. Core Concepts (Konsep Utama)

Sistem Event Engine dibangun di atas 4 pilar utama:

### A. Campaign (Kampanye)
Unit dasar dari setiap aktivitas. Sebuah Campaign memiliki:
*   **Slug Unik**: URL ramah pengguna (misal: `event.com/promo-imlek`).
*   **Konfigurasi Tema**: Warna, font, dan aset visual yang dinamis.
*   **Waktu Aktif**: Jadwal mulai dan selesai otomatis.

### B. Reward Pools (Kolam Hadiah)
Mesin insentif yang fleksibel. Mendukung tiga tipe mekanisme:
1.  **VOUCHER (Generic)**: Satu kode (misal `SAVE10`) yang bisa dipakai banyak orang. Cocok untuk promo umum.
2.  **SERIAL (Unique)**: Ribuan kode unik (misal `A1-B2-C3`) yang masing-masing hanya bisa dipakai sekali. Cocok untuk hadiah eksklusif atau tracking ketat.
3.  **WHITELIST**: Daftar akses khusus (misal Email atau No HP) yang diperbolehkan berpartisipasi.

### C. Submission (Partisipasi)
Data yang dikirimkan oleh user (Peserta).
*   Mendukung form dinamis (Nama, Kontak, Receipt Number, Foto, dll).
*   Validasi otomatis terhadap aturan Campaign.
*   Status Approval workflow (Pending -> Approved/Rejected).

### D. Winner & Draw (Pemenang & Pengundian)
Sistem penentuan pemenang yang adil dan transparan.
*   **Random Draw**: Algoritma pengacakan sisi server.
*   **Instant Win**: Mekanisme menang langsung saat submit.
*   **Selection**: Pemilihan manual oleh admin.

---

## 3. Key Flows (Alur Kerja)

### Flow 1: Voucher Redemption (Klaim Voucher)
1.  User masuk ke landing page Campaign.
2.  User mengisi form data diri.
3.  System memvalidasi ketersediaan Pool VOUCHER.
4.  User mendapatkan kode Voucher dan tercatat sebagai partisipan.

### Flow 2: Lucky Draw (Undian Berhadiah)
1.  User submit data "Submission" (misal: nomor struk belanja).
2.  Admin memverifikasi (Approve) submission tersebut.
3.  Di akhir periode, Admin melakukan **"Draw Winners"** pada Pool Hadiah.
4.  System mengacak Submission yang Approved dan memasangkannya dengan Item Hadiah.

---

## 4. Technical Advantages (Keunggulan Teknis)

Untuk tim IT dan Developer:

*   **Real-time Updates (SSE)**: Dashboard Admin dan User Interface diperbarui secara langsung (live) tanpa refresh halaman, menggunakan teknologi Server-Sent Events. Sangat krusial untuk memantau stok voucher atau hitungan peserta saat peak traffic.
*   **Headless Architecture**: Backend hanya menyediakan API. Frontend bisa berupa Web (React/Vue), Mobile App, atau bahkan integrasi ke POS.
*   **High Performance Locking**: Menangani perebutan stok hadiah (Race Conditions) dengan aman menggunakan transaksi database, memastikan tidak ada over-issue hadiah.
*   **Audit Trail**: Setiap perubahan status, pengambilan hadiah, dan edit konfigurasi tercatat untuk keamanan.

---

## 5. Use Cases (Contoh Penggunaan)

| Skenario | Solusi Event Engine |
| :--- | :--- |
| **Peluncuran Produk Baru** | Buat Campaign "Early Bird" dengan tipe Pool **WHITELIST** untuk mengumpulkan email peminat sebelum launch. |
| **Promo Akhir Tahun** | Buat Campaign dengan Pool **VOUCHER** unlimted usage untuk diskon umum, dan Pool **SERIAL** terbatas untuk hadiah Grand Prize. |
| **Event Offline (Booth)** | Gunakan QR Code yang mengarah ke Campaign Slug. User scan untuk check-in dan instan dapat "Digital Goodie Bag" (Item dari Pool). |
| **Internal Reward** | Distribusi bonus tahunan karyawan menggunakan kode unik (**SERIAL**) yang dikirim ke email masing-masing. |

---

## 6. Pitching Points (Poin Penjualan)

*   **"Launch in Minutes, Not Weeks"**: Tidak perlu coding backend untuk setiap event baru. Cukup konfigurasi di Admin Panel.
*   **"Data Ownership"**: Semua data peserta tersimpan rapi di database sendiri, bukan platform pihak ketiga.
*   **"Flexible Logic"**: Rule engine yang bisa dikustomisasi (misal: "Hanya user dengan email @kantor.com yang bisa menang").
