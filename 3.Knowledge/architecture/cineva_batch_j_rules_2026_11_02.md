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

## 6. Data campaign nyata IC 100 dan Gantt tahap (2 Nov 2026, lanjutan)

Sumber dari client (WhatsApp 2 Nov): sheet progress talent Liquid IC 100, sheet assessment (brief brand, timeline, talent terpilih, dashboard engagement), contoh sheet agency (kolom per creator: SOW, produk, storyline, feedback STL, draft, caption, feedback client/zone, link post, tanggal post), brief Canva (tidak terbaca otomatis, perlu login).

- **Template tahap** `kol-produk-ic100` di `stages.ts`: Listing 1 → Info lolos 1 → CO/pengiriman 2 → Drafting 10 → Posting 2 → Insight H+7 7 → Payment serentak 13 (hari kalender). Mulai 7 Okt 2026 menghasilkan tanggal sheet persis sampai 11 Nov (dites).
- **Seed** `seed.ts`: campaign `campaign-ic100` (brand, produk 5 rasa @Rp110.000, SOW, fee Rp100.000 lewat `jobRules.sowFee`, ACC storyline wajib). Delapan talent **disamarkan** (`Kreator IC-01..08`, tanpa WA/alamat/akun asli) karena demo dibagikan; views dari dashboard engagement dicantumkan di judul deliverable. `creatorId` bergantian `creator-1`/`creator-2` karena validasi hanya mengenal dua akun demo.
- **Gantt** `StageGantt.tsx`: meniru pola HOTS `components/assignment/TaskGantt.tsx` (batang per tahap dari tanggal mulai ke akhir, garis hari ini, warna status jendela). Ditampilkan di atas daftar tahap pada `StagePlanPanel`. TaskGantt HOTS tidak dipakai langsung karena terikat API assignment.
- Belum: Gantt per creator (storyline/draft/post per talent seperti sheet agency), alur feedback storyline/caption dua tahap (client + zone), impor sheet otomatis. Data mentah sheet tidak disimpan di repo (berisi data pribadi).

## 7. Alur kerja per creator dan layar pendaftaran (2 Nov 2026, lanjutan)

Referensi: [brief IC 100](../reference/client_ic100/README.md).

**Alur creator** (`cineva-campaigns/workflow.ts`, UI `CreatorWorkflowPanel.tsx`), field opsional `TalentAssignment.workflow`:
1. Alamat: creator mengisi penerima, telepon, alamat lengkap (`saveAddress`).
2. Terima produk: `confirmReceipt`; laporan cacat/salah kirim maks 1x24 jam dengan foto PNG/JPEG (`reportProductIssue`).
3. Storyline: creator setor (`submitStoryline`); HQ mencatat feedback atas nama KOL Manager / Client / Zone (`reviewStoryline`). Status ACC hanya jika KOL Manager menyetujui versi terakhir. Revisi dari siapa pun mengembalikan ke creator.
4–7. Draft, posting, insight H+7, payment: dibaca dari `execution.ts` / `finance.ts` (`workflowSteps` merangkum 7 langkah).
- Gerbang: bila `jobRules.storylineApprovalRequired`, repository menolak draft baru sebelum storyline ACC (`assertStorylineGate`).
- Guard `assertWorkflowMutation`: riwayat storyline/penerimaan append-only; HQ hanya menambah review; creator tidak bisa mereview.
- HQ melihat **Progres per creator** (`WorkflowBoard`): baris creator, kolom langkah, warna status.

**Pendaftaran** (`registration.ts`, UI `RegistrationDesk.tsx`, storage `cineva_registrations_dummy_v1`):
- Kolom mengikuti sheet progress: nama, domisili, umur, gender, WA, pekerjaan, IG/TikTok (username, followers, niche), status Baru/ACC/Ditolak, PIC screening.
- Validasi: usia sesuai `jobRules.minAge`, WA dinormalisasi, minimal satu akun. Creator hanya bisa daftar satu kali per campaign. Akun/followers bisa diperbarui (`updateAccounts`, belum ada UI).
- HQ: filter status, tanda **Ganda** (username/WA) atau **Mirip** (nama), tombol ACC/Tolak (PIC wajib).
- Seed: 13 pendaftar sintetis, termasuk satu daftar ulang.

**Perubahan lain**
- Storage campaign naik ke `cineva_campaigns_dummy_v2`, karena tombol "Reset dummy" hanya mereset data workspace, bukan campaign. Data lama v1 tidak dihapus.

**Belum**
- ACC pendaftar belum otomatis membuat assignment.
- Belum ada lampiran legal/KTP pada form.
- Mode API menolak perubahan `workflow` ("belum didukung API percobaan"), dan pendaftaran hanya mode dummy.
- Perlu konfirmasi client: tanggal brief vs assessment berbeda, dan aturan hari kerja payment (lihat README referensi).
