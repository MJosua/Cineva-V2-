# Analisa Infrastruktur: DNS Timeout & Failover Strategy

## 1. Masalah Utama: "Zombie" A-Record
Domain `backend.indofoodinternational.com` memiliki 2 IP (A-record). Salah satunya (`202.158.15.82`) tidak merespon/lambat.
Dalam standard Networking (TCP/IP), ketika client mencoba konek ke IP yang down:
- Client mengirim **TCP SYN**.
- Jika tidak ada respon, client akan melakukan retransmit (RTO).
- Di Windows/Linux, total waktu tunggu sebelum akhirnya menyerah (timeout) biasanya berkisar antara 18-21 detik.
- Baru setelah timeout, client akan mencoba IP kedua dalam list DNS.

Inilah penyebab delay 18 detik yang dialami.

---

## 2. Jawaban Pertanyaan

### Q1: Apakah penggunaan 2 A-record tanpa LB tepat?
**Tidak tepat untuk High Availability (HA).** 
- **Round-Robin DNS** hanya berfungsi membagi beban jika semua server SEHAT.
- DNS tidak tahu jika satu IP mati. DNS hanya memberikan list IP.
- Tanpa Load Balancer, beban failover dibebankan ke CLIENT (browser/Node.js), yang mana default timeout-nya sangat lama.

### Q2: Bagaimana cara implement Health Check yang benar?
Health check harus dilakukan di level yang AKTIF mengarahkan traffic:
1. **DNS Level (DNS Failover)**: Provider DNS (seperti Cloudflare, Route53) nge-ping server Anda. Jika mati, IP dihapus dari record secara otomatis.
2. **Reverse Proxy (Nginx/HAProxy)**: Nginx mengecek backend. Jika backend A mati, langsung lempar ke backend B tanpa jeda.
3. **Cloud Load Balancer**: Menyediakan IP Virtual (VIP). Client hanya tahu 1 IP, failover terjadi di belakang layar.

### Q3: Mana yang lebih baik (Reverse Proxy vs LB vs DNS Failover)?
- **Terbaik & Termudah**: **Cloudflare Proxy (Orange Cloud)**. Karena Anda sudah menggunakan Cloudflare, aktifkan proxy pada record domain tersebut. Cloudflare akan menangani failover di edge mereka. Client hanya konek ke Cloudflare, dan Cloudflare yang akan "berantem" dengan IP yang lambat, lalu membelokkannya ke IP yang sehat secara instan.
- **Alternatif**: Gunakan **Nginx** sebagai entry point tunggal yang melakukan load balancing ke IP-IP internal.

### Q4: Failover di sisi Node.js (Client Side)
Jika infrastruktur tidak bisa diubah, Anda bisa memaksa Node.js untuk failover lebih cepat:
1. **Perpendek Connection Timeout**: Jangan gunakan default (menunggu OS). Set connection timeout ke 2-3 detik.
2. **Happy Eyeballs Implementation**: Coba konek ke semua IP dari DNS secara paralel, gunakan yang paling cepat merespon.

---

## 3. Rekomendasi Teknis

### Solusi Infrastruktur (Prioritas Utama)
- Aktifkan **Cloudflare Proxy (Orange Cloud)** untuk domain tersebut.
- Pastikan SSL (Port 2468) terpasang dengan benar di Cloudflare (mode Full/Strict).

### Solusi Kode (Jika dipaksa dari sisi Client)
Gunakan snippet berikut pada Node.js client untuk bypass OS Timeout:

```javascript
const axios = require('axios');
const http = require('http');
const https = require('https');

// Buat agent dengan timeout koneksi yang agresif
const fastAgent = new https.Agent({
    keepAlive: true,
    timeout: 3000, // 3 detik
});

// Gunakan pada request
axios.get('https://backend.indofoodinternational.com:2468/api', {
    httpsAgent: fastAgent,
    timeout: 5000, // Total request timeout
}).catch(err => {
    console.error("Failover manual logic goes here");
});
```

> [!NOTE]
> Untuk hasil terbaik, setiap frontend harus melakukan resolusi awal melalui `apiResolver` sebelum React di-render.

---

## 4. Prosedur Wajib: Frontend API Resolution (MANDATORY)

**Status: ✅ IMPLEMENTED** — Berlaku sejak 2026-02-20.

Semua aplikasi frontend (HOTS, E-Order, Event) **WAJIB** mengikuti prosedur ini:

### A. File yang Diimplementasikan
| Frontend | apiResolver | Entry Point | Config File |
|--|--|--|--|
| **E-Order** | `src/utils/apiResolver.js` | `src/index.js` | `src/config.js` |
| **HOTS** | `src/utils/apiResolver.ts` | `src/index.js` | `src/config/sourceConfig.jsx` |
| **Event** | `src/utils/apiResolver.js` | `src/main.jsx` | `src/services/eventEngineApi.js` |

### B. Cara Kerja
1. `resolveApiBase()` dipanggil **sebelum** `ReactDOM.createRoot().render()`.
2. Script melakukan `GET /auth/ping` ke daftar IP kandidat dengan timeout **2 detik**.
3. URL pertama yang merespon digunakan sebagai `API_URL` selama session berlangsung.
4. Jika semua gagal, fallback ke domain utama untuk error handling normal.

### C. Pembaruan IP
Jika ada perubahan IP server, update `FALLBACK_URLS` di masing-masing `apiResolver`:
- `http://110.35.82.52:2864` — IP sehat saat ini (HTTP, fast)
- `http://10.126.106.105` — Local network fallback

### D. Pola Import di Komponen (tidak berubah)
```javascript
// Tetap sama — tidak perlu ubah komponen yang sudah ada
import { API_URL } from './config';   // E-Order
import { API_URL } from '@/config/sourceConfig'; // HOTS
// Sekarang API_URL adalah fungsi getApiBase() → selalu return URL yang aktif
```
