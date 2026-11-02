# Aturan batch J: pembatalan, jendela tahap, pendaftar ganda (2 Nov 2026)

Sumber: jawaban kuesioner client batch J, dicatat di [dokumen pertanyaan](../handover/PERTANYAAN_UNTUK_CLIENT_2026_11_01.md) bagian J. Commit `e69a0e1`. Vendor-only (Cineva), tanpa perubahan package `@hots/*`, tanpa perubahan backend/DB.

## 1. Informasi baru dari client

| Topik | Aturan client | Tafsiran tim (belum dikonfirmasi) |
|---|---|---|
| Brand batal (alasan tidak masuk akal) | Denda 15% **atau** DP hangus | Basis 15% = total nilai deal; sistem tidak memilih, PIC/owner memilih |
| Tim/kru batal | Bayar 15% dari total pembayaran | Sama dengan aturan lama: 15% total fee |
| KOL/creator batal | Bayar 15% dari total pembayaran fee | Sama dengan aturan lama |
| Lampiran | Alasan batal wajib dilampirkan | Berlaku untuk semua pihak; bentuk PNG/JPEG/teks |
| "Maks 7 hari" | Kewajiban diselesaikan maks 7 hari setelah project | Hari kalender sejak tanggal selesai project |
| Kru sakit | Tim backup; owner mencari pengganti; fee diatur belakangan | Sengaja belum ada di kode |
| ACC storyline | Bisa wajib atau tidak, parameter fleksibel | `jobRules.storylineApprovalRequired` |
| Jendela tahap | Tombol terbuka sesuai timeline, otomatis tertutup setelah lewat; buka-tutup oleh PIC campaign dengan persetujuan klien | Storyline + draft bisa berbagi satu jendela |
| Izin sakit/bencana | Maksimal 2x; klarifikasi: 2 kali di waktu berbeda, 2 hari berturut-turut = 1 kali | K6 selesai: maks 2 izin, maks 2 hari per izin, total 4 hari per campaign |
| Biaya | Per SOW / per 1x suruhan; besaran fleksibel per job | `jobRules.sowFee` diisi per campaign |
| Syarat usia | Fleksibel per job; lampiran legal + KTP bila brand meminta | `jobRules.minAge`, `requireLegalDoc`, `requireIdCard` |
| Pendaftar ganda | Dicek dari username sosmed, WhatsApp, nama | Username/WA = pasti; nama saja = kandidat |
| Penyimpanan data creator | Selamanya, tetapi IG id, followers, dan lainnya bisa diupdate | Tidak ada penghapusan otomatis; snapshot akun (`socialProfiles.capturedAt`) diperbarui. Persetujuan dan jalur hapus atas permintaan tetap disarankan (UU PDP) |

## 2. Kode dan cara pakai

### Pembatalan — `1.Frontend/HOTS/src/features/cineva-services/policies.ts`

```ts
brandCancellationOptions({ deposit: 3_000_000, totalDeal: 10_000_000 })
// -> { forfeitDeposit: {total: 3_000_000, ...}, penalty15: {total: 1_500_000, depositForfeited: 0, ...} }
assertCancellationProof('Sakit', { kind: 'text', text: 'Surat dokter' }) // throw bila alasan/lampiran kosong
cancellationSettlementDue('2026-11-28') // '2026-12-05'
```

- `brandPenaltyPolicy` (`CLIENT-BATCH-J-brand-15`) adalah kebijakan terpisah; `defaultCancellationPolicy` lama tidak berubah.
- Aturan kru/creator tetap di `defaultCancellationPolicy` (15% `totalFee`, alasan `not_committed`/`valid_reason`/`force_majeure`).

### Pendaftar ganda — `policies.ts`

```ts
findDuplicateRegistrations([{ id, name, whatsapp, accounts: [{ platform, username }] }, ...])
// -> [{ ids: [a, b], by: ['whatsapp'|'username'|'name'], confirmed }]
```

- Username: per platform, tanpa `@`, huruf kecil. WhatsApp: `0812…`, `+62 812…`, `62812…` dinormalisasi ke `62…` (minimal 8 digit lokal).
- `confirmed: false` bila hanya nama sama: perlu dicek manual.
- Belum ada layar pendaftaran, jadi fungsi ini belum dipanggil UI.

### Jendela tahap — `1.Frontend/HOTS/src/features/cineva-campaigns/stages.ts`

```ts
stageWindowState(calendar, 'draft', '2026-11-10', plan.reopens)
// -> { open: true, via: 'timeline' | 'reopen' } | { open: false, why: 'not_started' | 'closed' }
assertStageReopen({ stageKey, until, openedBy: 'pic_campaign', clientApproved: true, reason }, calendar)
```

- `StagePlan.reopens` opsional (data lama tetap valid); divalidasi di `assertStagePlan`.
- Perbandingan tanggal string `YYYY-MM-DD`, batas akhir inklusif.

## 3. Flow

**Pembatalan**
1. Pihak yang batal mengisi alasan + lampiran (wajib).
2. PIC Campaign (campaign) / Account Manager Produksi (produksi) menentukan pihak bersalah; owner menyetujui.
3. Brand: sistem menampilkan opsi A (DP hangus) dan B (15% total deal); PIC/owner memilih. Kru/creator: 15% total fee + biaya pergantian produk + wajib pengganti, kecuali alasan sah.
4. Kewajiban diselesaikan paling lambat 7 hari setelah project selesai.

**Jendela tahap**
1. HQ menyusun kalender tahap dari template.
2. Tiap tahap berstatus Belum dibuka → Terbuka → Tertutup otomatis.
3. Bila perlu, PIC campaign (di UI: aktor HQ) membuka ulang tahap sampai tanggal tertentu, dengan alasan dan centang persetujuan klien.

**Pendaftar ganda**: pendaftar dibandingkan berpasangan; pasangan `confirmed` ditolak/digabung, kandidat nama dicek admin.

### Izin/perpanjangan (K6) — `stages.ts` dan backend `config.mjs`

- `defaultExtensionRules = { maxTotalDays: 4, maxRequests: 2 }`, `maxExtensionDaysPerRequest = 2`. Backend: `extensionLimits` sama + `maxExtensionDaysPerRequest`, issue `per_request_limit`.

### Aturan per job — `cineva-campaigns/model.ts`

```ts
campaign.jobRules = { sowFee: 500_000, minAge: 21, requireLegalDoc: true, requireIdCard: true, storylineApprovalRequired: true }
assertJobRules(rules); meetsAgeRule(20, rules) // false
```

- Diisi di form **Buat campaign** (biaya per SOW, usia minimum, dokumen pendaftar, ACC storyline). Semua opsional.
- Flag `storylineApprovalRequired` dan `requireLegalDoc/IdCard` baru disimpan; alur eksekusi dan pendaftaran belum memaksakannya.

## 4. UI

- Estimator HQ → kartu **Simulasi pembatalan** (`PolicySimulators.tsx`): isian total nilai deal (Brand), alasan + lampiran wajib, opsi A/B, tenggat 7 hari.
- Campaign → **Kalender tahap** (`StagePlanPanel.tsx`): label status per tahap, form "Buka ulang tahap" untuk HQ.

## 5. Batasan

- Mode API: perubahan `reopens` ditolak di `apiMapping.ts` ("Membuka ulang tahap belum didukung API percobaan") karena belum ada endpoint/tabel. Mode dummy berfungsi.
- Label status tahap belum mengunci tombol aksi Creator di layar eksekusi.
- Mode API: `jobRules` ditolak saat membuat/mengubah campaign (belum ada kolom DB).
- Belum diterapkan: fee kru sakit (diatur belakangan), penegakan ACC storyline dan dokumen di alur, UI pendaftar ganda. Tes backend `test:cineva` butuh DB uji (dilewati lokal).
- Tes: `npx tsx --test src/features/cineva-campaigns/*.test.ts src/features/cineva-services/*.test.ts` (36 lulus). Belum diverifikasi di browser.
