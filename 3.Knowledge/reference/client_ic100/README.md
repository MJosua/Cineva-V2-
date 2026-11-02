# Referensi client: campaign Vape Liquid IC 100 (Okt–Nov 2026)

Sumber: dikirim client lewat WhatsApp, 2 Nov 2026. Berkas asli: [IC100_brief_mekanisme_2026_10.pdf](IC100_brief_mekanisme_2026_10.pdf) (20 halaman, Arcova.Co / Cineva Creative House). Sheet Google (progress, assessment, contoh agency) tidak disalin karena berisi data pribadi creator; tautannya ada di chat client.

## Brief
- Produk: liquid saltnic 30mg, 30ml, buah segar dengan hint sour; "dosis kesegaran harian". Filosofi #ISEENOLIMIT. MSRP Rp110.000.
- Varian: Fresh Lemon, Strawberry, Grape, Red Apple, Mango.
- Vibe: gaya hidup sehat, aktif, sporty; IC 100 seperti "minuman isotonik/vitamin". Storytelling natural dan enerjik, bukan seperti membaca brosur.
- Talking points wajib: #ISEENOLIMIT; rasa buah natural (tidak kimia), dingin me-recharge mood; "super ramah di cartridge, anti cepat gosong"; MSRP; "Dapatkan IC 100 di vapestore terdekat di kota kamu".
- SOW: 1x Instagram Reels **atau** 1x TikTok, minimal 30 detik. Tag akun resmi + #IC100 #ISEENOLIMIT #StayFreshLimitless #LiquidSporty.
- 9 style konten (kuota VT/Reels per style): 1 Active lifestyle vlog, 2 Freshness ASMR, 3 Post-workout reward, 4 What's in my gym bag, 5 Desk to gym, 6 Cart challenge, 7 Healthy pairing, 8 Match your active wear, 9 POV action. Style 1–6: 3 VT + 3 Reels; 7–8: 2 + 2; 9: 1 + 1.
- Do: produk jelas dan terang, ekspresi enerjik, review jujur keawetan cartridge, properti olahraga/buah. Don't: sebut/bandingkan kompetitor, vibe malas/ruangan gelap, produk vape lain dalam frame, hapus konten < 7 bulan.
- Hak brand: Indonesia Creative Labs boleh mengunduh, repost, dan iklankan konten dengan kredit username; creator tidak boleh menjual lisensi ke pihak lain.

## Mekanisme (aturan)
- Creator terpilih tidak boleh cancel setelah campaign berjalan.
- Isi alamat rumah lengkap, penerima, dan telepon aktif.
- Produk cacat/salah kirim dilaporkan ke KOL Manager maks **1x24 jam** setelah diterima, dengan foto.
- Setor storyline, draft, insight ke Google Drive "IC.100 DRIVE"; isi progress di sheet "IC.100 Progress".
- Alur kerja: storyline → ACC KOL Manager → produksi → draft di Drive untuk review → posting setelah approval final.
- Payment setelah insight H+7 tiap batch; durasi payment maks **14 hari kerja** (Jumat, Sabtu, Minggu, dan libur nasional tidak dihitung).

## Timeline di brief vs assessment
| Tahap | Brief PDF | Sheet assessment |
|---|---|---|
| Alamat | 9–10 Okt | — |
| Pengiriman produk | 10–14 Okt | CO 9 Okt |
| Storyline | 10–11 Okt | — |
| Draft | 12–18 Okt | Drafting 11–20 Okt |
| Posting serentak | 21–22 Okt | 21–22 Okt |
| Rekap insight | 30 Okt | 29 Okt |
| Payment | 11 Nov | 11 Nov |

Template `kol-produk-ic100` mengikuti sheet assessment. Tanggal brief berbeda dan tumpang-tindih (storyline dan pengiriman berjalan bersamaan), jadi perlu dikonfirmasi ke client mana yang dipakai.

**Bertentangan:** "14 hari kerja, Jumat–Minggu tidak dihitung" berbeda dengan hari kerja Senin–Jumat di `cineva-services/rules.ts`. Belum diubah; tanyakan ke client apakah ini khusus IC 100.

## Dipakai di kode
- `cineva-campaigns/seed.ts` (campaign IC 100), `stages.ts` (template), `workflow.ts` (alamat, 1x24 jam, storyline, ACC KOL Manager), `registration.ts` (kolom pendaftaran mengikuti sheet progress).
