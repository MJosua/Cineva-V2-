# Status dan prompt perbaikan Cineva

> Pembaruan 18 Oktober 2026: status di bawah adalah snapshot 14 Oktober. R02 kini diperbaiki di dynamic-form 0.1.0-cineva.1 dan R03 di engine-client 0.2.0-cineva.1; host memakai kontrak paket tanpa workaround. Baca ../architecture/component_compatibility_2026_10_18.md untuk status terkini. Pengguna menunda database/backend dan meminta fokus komponen; jangan menjalankan ulang tahap migrasi DB/auth dari prompt historis ini.

Snapshot source: 14 Oktober 2026. Root: D:/Project/Cineva-V2-. Semua path di bawah relatif terhadap root tersebut. D:/Kantor tetap read-only.

## Status terhadap temuan HOTS original

| ID | Status Cineva | Lokasi / tindakan lanjutan |
|---|---|---|
| R01 Escape | Fixed lokal, mock browser verified | 1.Frontend/packages/table-engine/src/cells/EditableCell.tsx memakai skipBlurSave ref. Jangan ulang patch. |
| R02 whitelist builder | Dilindungi adapter host, belum diperbaiki generik | 1.Frontend/HOTS/src/components/forms/UnifiedFormStructureEditor.tsx memfilter registry; 1.Frontend/dynamic-form/src/UnifiedFormStructureBuilder.tsx masih berbeda kebijakan create/inspector. |
| R03 trigger contract | Runtime hook dimapping; tipe paket belum benar | 1.Frontend/HOTS/src/hooks/useTriggerFunction.ts memakai function_type/is_active dan cast categories. 1.Frontend/packages/engine-client/src/hots/trigger.ts masih type dan string[]. |
| R04 packaging | Integrasi Cineva diperbaiki | 1.Frontend/package.json + package-lock.json, HOTS/vite.config.ts, HOTS/tsconfig.json, packages/ui-kit/package.json. Clean install/build sebelumnya pass; bukan sertifikasi seluruh consumer. |
| R05 docs/status | Registry Cineva tersedia; inherited docs perlu sinkronisasi | 3.Knowledge/packages/REGISTRY.md, COMPATIBILITY.md; 1.Frontend/packages/app-core/docs/README.md dan engine-client/docs/README.md. |
| R06 clients lengkap | Belum | engine-client/src/hots dan HOTS/src/services, api, widgets; perlu kontrak route nyata. |
| R07 extension builder | Adapter advanced dipertahankan; paket belum lengkap | HOTS/src/components/forms/shared/CinevaFormAddonEditors.tsx, FieldEditor.tsx, RowGroupConfigurator.tsx; dynamic-form/src/UnifiedFormStructureBuilder.tsx. |
| R08 auth | Compatibility adapter; belum migrasi cookie | HOTS/src/platform/httpFactory.ts, clients.ts, CinevaCoreProvider.tsx; store/slices/authSlice.ts; hooks/useSSE.ts; utils/apiResolver.ts. |
| R09 adoption | Parsial | 53 UI forwarders, shared builder/report dan selected clients; primary service runtime/backend masih legacy. |
| R10 renderer readiness | Belum; paket helper saja | 1.Frontend/packages/page-engine; kandidat app-template/commerce bukan implementasi tersedia. |

## Prompt siap salin untuk AI project Cineva

Kerjakan perbaikan paket lokal Cineva di D:/Project/Cineva-V2-. D:/Kantor hanya referensi read-only: jangan edit source, knowledge, Git, DB, build/deploy atau PM2 Kantor. Baca AGENTS.md, 3.Knowledge/KNOWLEDGE_INDEX.md, FILE_MAP.md, APP_MAP frontend/backend, architecture/reusable_packages_2026_10_14.md, packages/REGISTRY.md, COMPATIBILITY.md dan handover/HOTS_ORIGINAL_HANDOVER_2026_10_14.md. Audit ulang status dalam dokumen ini; jelaskan dampak arsitektur sebelum mengedit. Jangan menganggap semua temuan HOTS original masih bug Cineva.

Tahap 1 — bereskan kontrak lokal tanpa DB/deploy:

1. Pertahankan fix Escape di 1.Frontend/packages/table-engine/src/cells/EditableCell.tsx. Verifikasi Escape tidak memanggil save/network, Enter/blur menyimpan sekali, rejection restore nilai; jangan mengganti fork dengan snapshot upstream.
2. Perbaiki 1.Frontend/packages/engine-client/src/hots/trigger.ts. Tambah tipe filter canonical function_type/category/search/is_active dan tipe kategori {category,count}. Pertahankan type sebagai alias deprecated, canonical function_type menang bila keduanya ada, lalu kirim nama query backend yang benar. Cocokkan terhadap 2.Backend/Integrated-API/controller/hots_controller/settings/controllers/triggerFunctionController.js dan router aktual Cineva, bukan hanya backend Kantor. Export tipe publik melalui 1.Frontend/packages/engine-client/src/index.ts bila diperlukan. Perbarui HOTS/src/hooks/useTriggerFunction.ts agar memakai tipe canonical dan menghapus cast unknown categories; pertahankan is_active dan public hook contract lama. Jangan ubah DB atau menyalin controller Kantor.
3. Perbaiki kebijakan allowedFieldTypes di 1.Frontend/dynamic-form/src/UnifiedFormStructureBuilder.tsx agar creation catalog dan GenericFieldEditor konsisten. Optional prop default tetap perilaku lama. Field existing di luar whitelist harus tetap terbaca dan metadata-nya tersimpan; jangan silently menghapus/mengonversi field. Sesuaikan HOTS/src/components/forms/UnifiedFormStructureEditor.tsx hanya setelah policy paket teruji; guard host bisa dipertahankan bila dibutuhkan registry domain.
4. Pertahankan konfigurasi workspace/peer/subpath Cineva. Audit 1.Frontend/packages/ui-kit/package.json, HOTS/vite.config.ts, HOTS/tsconfig.json dan konfigurasi Tailwind aktual. Jangan buat lockfile standalone HOTS atau menghapus optional peer secara membabi buta.
5. Catat fork/version CHANGELOG paket yang berubah; sinkronkan README paket, 3.Knowledge/packages/REGISTRY.md dan COMPATIBILITY.md berdasarkan package.json/import aktual. Jangan menyatakan package terpasang berarti sudah dipakai runtime.

Tahap 2 — audit migrasi besar secara terpisah:

- Auth/SSE: petakan HOTS/src/platform/{httpFactory,clients,CinevaCoreProvider}.tsx/ts (cek ekstensi sebenarnya), store/slices/authSlice.ts, hooks/useSSE.ts, utils/apiResolver.ts, serta backend controller/hots_controller/auth/controllers/authController.js, routers/hots/sse.js, core/sse-helper.js dan sse-manager.js. Dokumentasikan Bearer/cookie, refresh/logout, token storage, CORS/CSRF, endpoint origin dan SSE. Transport compatibility saat ini disengaja; jangan langsung menghapus localStorage/Bearer atau memakai factory cookie-only sebelum backend/SSO/MFE siap dan diuji. Minta informasi lingkungan/account bila diperlukan untuk acceptance nyata; jangan memakai database Kantor.
- Clients tambahan: inventory route/method/request/envelope/error/pagination nyata dahulu. Tambah generic ticket/assignment/document/report client pada engine-client dengan injection transport; marketplace tetap domain adapter Cineva. Pertahankan EAV cstm_col/lbl_col/value. Jangan membuat kontrak/schema berdasarkan draft.
- Builder/runtime/adoption: tambah hook inspector/registry opsional setelah requirements minimal dua consumer jelas. Migrasikan satu surface per tahap, pertahankan legacy business rules, row metadata, upload, workflow, permission dan submit. Primary runtime di HOTS/src/components/forms/{DynamicForm,DynamicField,DynamicSection}.tsx belum diganti oleh shared preview. Archive legacy hanya setelah replacement verified. page-engine helper jangan dianggap full renderer.

Validasi tahap 1: tambahkan regression yang bermakna pada 3.Knowledge/scripts/package_upgrade_2026_10_14/contracts.test.ts atau fixture checking baru dalam 3.Knowledge/scripts. Uji canonical/alias query, categories shape, whitelist create/edit, unknown metadata round-trip dan cancel edit. Jalankan npm.cmd run test:packages dan npm.cmd run build:frontend; scoped lint/typecheck untuk file berubah. Full typecheck terakhir 101 diagnostics, jadi bandingkan baseline dan jangan klaim semua pre-existing. Browser test builder/report memakai fixture dan labeli mock; login/DB/upload/SSE membutuhkan lingkungan Cineva nyata. Jika harus install, gunakan npm.cmd --prefix 1.Frontend ci dari workspace canonical.

Semua fitur modular engine; paket tidak mengimpor app store/API/config. Runtime logs mengikuti SSE logger/parser. Jika tahap lanjut membutuhkan SQL, wajib schema fisik terbaru di knowledge; jika tidak ada minta lokasi/schema. DB write wajib transaction + commit + rollback. One-time scripts di knowledge/scripts. Update Markdown dan Excel audit, pisahkan fixed/adapter/pending/tested mock/live. Jalankan npm.cmd run knowledge:index. Laporkan file berubah, alasan, acceptance, gap dan limitation; tidak deploy/restart/DB mutation dari prompt ini.

## Laporan existing

Laporan status integrasi: 3.Knowledge/reports/package_upgrade_2026_10_14/Cineva_Reusable_Packages.xlsx. Prioritas original: 3.Knowledge/handover/HOTS_Original_Handover.xlsx. Prompt ini tidak mengubah kode atau menjalankan pengujian ulang; status fixed merujuk source terkini dan hasil fixture sebelumnya.
