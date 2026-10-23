# Cineva layanan, inquiry dan CS — implementasi frontend dummy

Update lanjutan: [pemantapan workflow, penawaran, CS dan booking](cineva_maturity_2026_10_18.md) menambahkan detail layanan, negosiasi versi, antrean/assignment CS dan konfirmasi resource. Angka serta perilaku di bawah adalah snapshot implementasi awal; baca dokumen terbaru untuk coverage dan kontrak tambahan.

Implementasi: 18 Oktober 2026, memenuhi Paket 1–4 [rencana voice note](implementation_plan_voice_2026_10_18.md) pada batas frontend/repository dummy. Paket 5 tetap ditunda sesuai instruksi pengguna. Tidak ada source/build/DB HOTS Kantor yang diedit; tidak ada SQL atau migrasi.

## Cara mencoba

Preview produksi lokal: `http://127.0.0.1:48175/hots/cineva-preview.html#/creator/services`, HQ: `#/hq/services`. Di sidebar B ada **Layanan Cineva** dan **Bantuan & CS**; di A ada **Layanan & inquiry** dan **Inbox CS**. Browser yang sama dapat berpindah produk; dropdown Workspace dummy memilih creator-1/creator-2 atau hq-1/hq-2. Identitas ini kontrol simulasi, bukan login/authorization.

Alur: Creator atau client langsung dari HQ membuat brief → estimasi awal → kirim request → HQ review → opsional revisi tarif/quote → kirim penawaran → pemilik request menyetujui → HQ menjadikannya project. Project kemudian memakai halaman Projects, Crew & schedule, deliverable/payment/archive existing. Pengiriman request dan persetujuan quote bukan booking resource otomatis; validasi bentrok tetap dilakukan pada alokasi crew/gear.

Untuk mencoba handover: buka request, kirim pesan (fake AI memberi balasan), pilih Bantuan manusia, pindah ke HQ tujuan → Inbox CS → Ambil percakapan → balas sebagai agen dummy → Selesaikan percakapan. Kembali ke AI adalah tindakan eksplisit. Percakapan terselesaikan menonaktifkan pengiriman sampai dibuka kembali.

## Modul dan reuse

Semua source di bawah `1.Frontend/HOTS/src/features/`:

| Modul | File | Tanggung jawab |
|---|---|---|
| cineva-services | catalog.ts | Tiga layanan dan schema brief per tipe, contoh graduation/iklan/birthday dan jasa fotografer/videografer |
| cineva-services | pricing.ts | Rate card terkonfigurasi dan quote item/quantity/rate/subtotal/total dengan versi/revisi |
| cineva-services | ServiceBriefForm.tsx | Shared HOTS form, pergantian tipe, draft, estimasi awal dan kirim |
| cineva-services | QuoteBreakdown.tsx, RateCardEditor.tsx | Rincian biaya dan konfigurasi tarif dummy per HQ |
| cineva-inquiries | domain.ts | Validasi brief, transisi inquiry dan konversi ke existing createJob view-model adapter |
| cineva-inquiries | repository.ts | Request envelope, private draft per actor/tujuan, rate card, storage read-back dan scoped read |
| cineva-inquiries | ServiceDesk.tsx, InquiryDetail.tsx | Queue, detail, keputusan, pemilihan workspace simulasi dan komposisi |
| cineva-support | support.ts | Provider interface/fake provider, handover/claim, idempotency pesan dan pengabaian balasan AI terlambat |
| cineva-support | ConversationPanel.tsx | Riwayat dan input pesan AI/manusia pada inquiry |

Reuse `HotsForm` → `@hots/dynamic-form`, UI forwarders → ui-kit dan storage → app-core. Tidak ada package snapshot upstream yang diubah oleh fitur ini. `HotsForm.onValuesChange` optional/additive. `createDummyRepository(namespace?)` mempertahankan namespace default existing; identity kedua memakai namespace tersendiri. `Job.sourceInquiryId` optional hanyalah view-model reference, bukan kolom fisik. Brief project ditampilkan sebagai teks label/nilai, bukan raw JSON. Ticket/assignment/EAV backend lama tidak diganti.

## Aturan domain dan penyimpanan

- Brief bersama: brand/PIC, lokasi, jadwal WIB/durasi, deliverable, tenaga, hari/crew/gear dan budget indikatif. Campaign menambahkan tujuan/periode; Production menambahkan jenis kebutuhan/konsep; Content Shoot menambahkan platform. Pergantian tipe mempertahankan input, tetapi envelope yang dikirim hanya berisi field schema tipe terpilih.
- Draft disimpan per author/tujuan dan dapat dipulihkan setelah reload. Draft pribadi tidak masuk list request penerima. Input belum dikirim tidak menjadi inquiry.
- Default rate card DUMMY-1: base Campaign Rp3 juta, Production Rp7,5 juta, Content Shoot Rp1,5 juta; crew Rp350 ribu/orang/hari; gear Rp250 ribu/unit/hari. Semua simulasi. Perubahan harga membutuhkan versi tarif baru. Harga resmi/pajak/discount belum ditetapkan.
- Request menyimpan snapshot estimasi. Edit tarif tidak mengubah quote terdahulu. HQ dapat menghitung revisi eksplisit saat reviewing. Budget client, quote dan fee project adalah nilai terpisah. Saat diterima, fee project diambil dari total quote; barter tidak diasumsikan untuk jasa ini.
- State: submitted → reviewing → quoted → accepted; rejected/cancelled terminal dari tahap yang sesuai. Review/reject milik HQ tujuan; accept milik owner. Status pekerjaan dan pembayaran tetap independen.
- Envelope menyimpan owner/destination dan field brief yang diizinkan; tidak menyalin job/keuangan pribadi Creator. Read untuk Creator hanya owner, untuk HQ hanya destination. Ini perilaku repository dummy, bukan batas keamanan terhadap pengguna yang dapat mengedit localStorage.
- Konversi memakai ID project deterministik `inquiry-<request ID>`. Jika save workspace sukses tetapi acknowledgement inquiry gagal, retry menemukan project yang sama. Reset workspace menghapus project dummy, tetapi inquiry/quote/percakapan tetap disimpan terpisah dan tombol konversi dapat memulihkannya tanpa inquiry baru.
- Pesan mempunyai ID stabil untuk retry. Fake AI memakai brief; tidak memanggil provider/model. Respons yang kembali setelah handover atau setelah pesan lain diabaikan. Kegagalan provider mempertahankan pesan pengguna tanpa balasan sukses palsu. UI menangani error; tidak ada runtime console logging baru.
- Storage baru `cineva_services_dummy_v1_shared-requests`; workspace legacy tetap `cineva_dummy_v1`, actor kedua mempunyai namespace tersendiri; pilihan actor `cineva_demo_identity_v1_selected`. Semua sintetis/non-secret. Tidak ada token atau data produksi di storage baru.

## Verifikasi

Perintah:

```powershell
npm.cmd run test:services       # 9 kontrak domain dan batas 1.000 baris source fitur
npm.cmd run test:products       # 9 domain existing, scoped lint dan filter diagnostics
npm.cmd run test:packages       # 17 kontrak paket dan batas baris table-engine
npm.cmd run test:components     # 19 component browser checks
npm.cmd run build:frontend
$env:CINEVA_PRODUCTS_ORIGIN='http://127.0.0.1:48175'
npm.cmd run test:services:e2e    # 15 skenario layanan pada produksi lokal
npm.cmd run test:vendor-theme   # 19 A/B + 8 theme checks pada produksi lokal
```

Fitur baru diuji dengan 9 kontrak domain: schema/validasi, hitungan/snapshot, dua Creator/dua HQ, filter envelope, deduplikasi/failure storage, acceptance/konversi, stale AI handover, provider failure, retry pesan dan draft (beberapa aturan berada dalam satu test case). 15 browser checks mencakup journey sampai resource/delivery/payment/archive, cancel client HQ, draft reload, save failure, reset recovery, pemisahan project HQ, CS resolve, mobile/focus dan vendor scope. Backend/external network guard aktif, browser exceptions nol.

Regresi existing: 17 package contracts, 9 product domain tests, 19 component browser checks, 19 A/B browser checks dan 8 theme checks lulus. Build produksi lulus. Scoped lint nol error/warning dan tidak ada feature TypeScript diagnostics; aplikasi keseluruhan masih 101 diagnostics. Jumlah baris diverifikasi di `reports/cineva_service_flow_2026_10_18/line-counts.json`; batas fitur tidak mengklaim semua file legacy aplikasi sudah sesuai 1.000 baris.

## Batas lanjutan

Belum tersedia server-side tenant isolation/membership/role CS, shared live inbox/SSE, durable transaction/outbox, local LLM nyata, upload/CMS publishing, kalender/notifikasi provider, checkout/paywall, tarif komersial maupun database. Tidak ada pesan WhatsApp/email dikirim. Subscription simulator dan assistant job parser sebelumnya dipertahankan. Tidak semua detail audio sudah diverifikasi manual; istilah meragukan tidak dimasukkan menjadi aturan baru.

Integrasi nyata harus memakai HOTS ticket/workflow service existing dan EAV berdasarkan schema fisik terbaru, bukan menyalin view-model menjadi DDL. Semua DB write memakai transaction + commit + rollback; tesnya hanya dummy DB setelah scope DB dibuka. Uji tenant server harus mencakup list/mutate/export/attachments/cache/SSE/background jobs. Lulusnya simulasi tidak membuktikan hal tersebut.
