# Review pandangan client: assessment kualitas akun dan DP anti-cancel

Tanggal: 1 November 2026. Sumber: dua screenshot dan penjelasan chat client, serta dua situs referensi (kolsprite.com, easykol.com). Hanya review dan pencatatan; tidak ada perubahan runtime, CSS, package atau DB.

## Pandangan client

1. **Gambar 1 — kualitas akun.** Panel perhitungan di Assessment client: Followers, Following, Avg likes/comments/views, Engagement (terhadap followers), ER by views, toggle Rata-rata/Median, blok "Kewajaran angka" (likes per views, comments per likes) dan peringatan "N dari 10 post angkanya tidak saling cocok" dengan tanda Periksa per post.
2. **Gambar 2 — DP di awal.** Brand sering membatalkan kolaborasi barter di hari-H tanpa konsekuensi. Web dengan DP di awal dimaksudkan mencegah pembatalan sepihak.

## Posisi implementasi Cineva (frontend dummy)

| Kebutuhan | Status | Bukti |
|---|---|---|
| ER by views | Ada | `cineva-campaigns/finance.ts` `engagementRate()` |
| Followers | Ada, snapshot manual | `CampaignDesk.tsx`, `cineva-reference/profileMapping.ts` |
| Following, avg likes/comments/views, engagement vs followers | Belum | insight hanya per deliverable |
| Rata-rata vs median, kewajaran angka, flag Periksa, skor kualitas akun | Belum | tidak ada di `src/features` |
| DP / escrow / refund / penalti | Belum | grep `deposit|uang muka|refund|penalt` nol hasil |
| Pembatalan setelah deal | Belum | `accepted` terminal di `cineva-inquiries/domain.ts`; pembatalan hanya sebelum accepted |
| Barter sebagai jaminan | Belum | hanya `productBenefitAmount` nominal rupiah |

Catatan: ER Cineva berasal dari insight campaign yang dicatat manual setelah posting. Yang dimaksud client adalah **assessment akun sebelum kerja sama**; fungsi berbeda dan belum ada. Alur finance saat ini satu arah HQ ke Creator (`recordPayout`), tanpa pembayaran Brand di muka.

## Situs referensi

- **EasyKOL:** pencarian KOL berbasis AI, kartu kreator (audiens, engagement, estimasi harga), deteksi follower palsu dan engagement digelembungkan, dashboard campaign (views, CPM, ROI), outreach email massal.
- **KOLSprite:** pool influencer, kontak massal, manajemen campaign, prediksi risiko kolaborasi.
- Halaman publik keduanya **tidak menyebut** escrow, DP atau pembatalan. Referensi hanya mendukung gambar 1; mekanisme DP perlu didefinisikan dari client.

## Pertanyaan terbuka untuk client

1. Siapa yang membayar DP: Brand ke platform (escrow) atau Brand ke Creator langsung?
2. Untuk barter, DP berbentuk apa?
3. Persentase DP yang hangus, batas cut-off (H-7, H-3), dan apakah berlaku dua arah termasuk Creator yang membatalkan?
4. Sumber data assessment: input manual 10 post atau tarik otomatis dari API platform sosial?

## Usulan urutan jika disetujui

(a) Panel assessment akun dengan input manual 10 post, rata-rata/median dan flag kewajaran sebagai fungsi murni di modul campaigns; (b) model DP dan aturan pembatalan berstatus dummy memakai pola ledger append-only seperti `assertFinanceMutation`. Aturan persentase dan cut-off adalah keputusan bisnis, bukan angka dari sumber ini.
