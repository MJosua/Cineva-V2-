# Kompatibilitas komponen Cineva — 18 Oktober 2026

## Scope dan keputusan

Pengguna meminta pekerjaan dikelompokkan dan diuji E2E dengan data dummy, kemudian secara eksplisit mengecualikan database: "database jangan dulu, komponen kompatibel saja dulu". Perubahan ini frontend saja. Tidak ada DB, SQL, server backend, cron, auth migration, deployment atau perubahan di D:/Kantor. Data browser dan respons API semuanya sintetis; request diintersep pada loopback, tujuan eksternal ditolak.

## Dampak arsitektur dan implementasi

- `@hots/engine-client` 0.2.0-cineva.1: public TriggerFunctionFilter memakai function_type/category/search/is_active; alias type deprecated dinormalisasi, canonical menang, boolean menjadi string true/false sesuai controller Cineva. categories bertipe TriggerFunctionCategory[] (`category`, `count`). Transport tetap di-inject aplikasi; package tidak membaca storage/token.
- `HOTS/src/hooks/useTriggerFunction.ts`: memakai kontrak paket, menghapus double cast categories, tetap mendukung public alias dan active=true default, bereaksi terhadap perubahan search/canonical/active.
- `@hots/dynamic-form` 0.1.0-cineva.1: whitelist berlaku pada creation dan generic inspector. Existing unknown/unsupported type tetap terpilih sebagai opsi disabled dan metadata/rules dipertahankan. Empty whitelist tidak membuat field; default child/root memakai first allowed type bila text tidak diizinkan. Custom inspector menerima optional policy; custom implementer tetap bertanggung jawab menghormatinya.
- Host `UnifiedFormStructureEditor.tsx` memakai registry lengkap dengan domain QR extension dan public whitelist; workaround listFields filtering dihapus.
- Fork table-engine Escape dan ui-kit subpath sebelumnya dipertahankan. Tidak ada runtime engine baru, perubahan EAV atau backend bisnis.
- Versi di workspace lock, registry, compatibility, README dan CHANGELOG lokal disinkronkan. Snapshot original 14 Oktober tetap menjadi provenance historis, bukan status source terkini. Jangan rerun snapshot/copy untuk menimpa fork ini.

## Validasi

- 17 contract tests lulus.
- Component E2E headless memakai React host dan paket aktual dengan HTTP dummy di browser. Meliputi alias/canonical filter, false/search query, structured categories, whitelist create/inspector, unknown field round-trip, empty whitelist, child/root creation, custom inspector, default catalog, draft lifecycle, host adapter, Escape tanpa save request, Enter save sekali, isolasi detail, HTTP 200 rejection restore, pencarian lintas halaman, parent search, exact filter dan XLSX seluruh 11 matching rows pada dua halaman. File browser export dibaca ulang untuk memeriksa jumlah dan isi, bukan sekadar berhasil download.
- Production frontend build lulus; peringatan bundle besar, mixed dynamic/static imports, Browserslist dan pdfjs eval masih ada.
- Typecheck aplikasi: 101 diagnostics tersisa; hasil seluruhnya bukan sertifikasi legacy. File implementasi yang berubah diperiksa terpisah dalam validation.json.
- Lint shared-package rules dan perbandingan backend terhadap baseline tersedia di laporan. Warning fungsi panjang pada builder legacy harus dilaporkan terpisah, bukan disembunyikan.

Reproduksi dari root:

```powershell
npm.cmd --prefix 1.Frontend ci
npm.cmd run test:packages
npm.cmd run build:frontend
npm.cmd run test:components
node 3.Knowledge/scripts/package_upgrade_2026_10_14/typecheck.mjs
node 3.Knowledge/scripts/component_compatibility_2026_10_18/verify.mjs
npm.cmd run knowledge:index
```

Runner E2E menggunakan bundled Playwright; override lokasinya dengan CINEVA_TEST_RUNTIME (directory Node runtime berisi node_modules) dan CINEVA_TEST_CHROMIUM (absolute path executable) bila berbeda. Port fixture 127.0.0.1:48173; runner menutup browser/server miliknya setelah selesai. Build diperlukan untuk CSS fixture. Fixture bukan route produksi dan bukan E2E backend/database; login nyata, isolation tenant dan upload/provider belum dibuktikan.

## Sisa pekerjaan

Primary service-form runtime/rules/submit dan domain widget/editor khusus belum dimigrasi. Auth/SSE, backend transaction-kit, tenant enforcement, finansial dan AI ticket creation ditunda sesuai scope terbaru. Client tambahan harus berasal dari kontrak route terverifikasi. Page-engine masih helper, bukan full renderer. Knowledge/Excel memisahkan fixed, compatibility adapter dan pending; keberadaan paket tidak berarti seluruh aplikasi sudah mengonsumsinya.

Laporan: `3.Knowledge/reports/component_compatibility_2026_10_18/validation.json`, `e2e-results.json`, `lint-results.txt` dan `Cineva_Component_Compatibility.xlsx`.
