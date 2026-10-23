# Implementasi fondasi tenant/company, SSO dan onboarding

Tanggal 21 Oktober 2026. Ini **implementasi lokal fase fondasi**, bukan aktivasi SaaS/SSO production dan bukan migrasi seluruh endpoint legacy.

Update lanjutan: [aktivasi pilot](saas_pilot_activation_2026_10_21.md) mencatat izin pengguna terbaru untuk DB additive melalui script, 4 tabel nyata, grant/hierarki Kevin dan pemeriksaan SSH production. Pernyataan read-only DB/persistence belum dibuat di bawah adalah batas historis fase fondasi, bukan status terbaru. Source dan deployment HOTS tetap tidak diubah.

## Keputusan pengguna yang diterapkan

Tenant adalah program HOTS Normal/Overseas/Cineva; company adalah Indofood/IndoUSA dan badan usaha lainnya. Satu user dapat memiliki banyak membership tenant-company dengan role berbeda. Client/Company Admin/Company Staff bukan sistem login terpisah.

Target domain Cineva adalah `cineva.com`. Client boleh mendaftar mandiri langsung aktif sebagai **akun pribadi**; company/campaign hanya didapat melalui undangan. Identitas aktif tidak memberi grant company otomatis. Kampanye tetap memerlukan business relation/policy domain tambahan.

Instruksi lanjutan pengguna: cek konfigurasi koneksi read-only dan gunakan MCP. Tidak ada izin penulisan baru ke HOTS. `.env` backend Cineva lokal hanya 2 byte dan tidak mempunyai konfigurasi DB/SSO. Inventory `.env` referensi Kantor dilakukan dengan parser, tanpa menampilkan host/user/password/secret; `DB_NAME_HT` dan `DEV_DB_NAME_HT` menunjuk `hots`. MCP mengonfirmasi `hots`, MySQL 8.0.20. Kandidat schema yang ditanyakan (`hots`, `job_marketplace_hots`, `cineva`) hanya menampilkan `hots`; ini bukan bukti schema lain tidak ada di luar privilege connector. Pencarian nama Cineva/Overseas/HOTS pada katalog `m_company_program_list.system_name` tidak mengembalikan row, sehingga program IDs tidak ditebak. Ini bukan audit seluruh registrasi SSO client/view/IdP.

## Package dan perubahan source

| Package | Versi | Implementasi |
|---|---|---|
| `@hots/tenant-contracts` | 0.1.0-cineva.1 | Universal CJS/ESM contract version 1, strict company/context, collision-safe scope key, ownership, JSON theme/asset validation |
| `@hots/tenant-client` | 0.1.0-cineva.1 | Provider/context per instance, bootstrap/select, scoped HTTP, accept invite, abort/dispose/SSE cleanup, stale response rejection, brand provider |
| `@hots/tenant-server` | 0.1.0-cineva.1 | Server-authorized opaque context, current membership/version checks, scoped repositories, schema-based membership reads, OIDC/session/registration/invitation/transaction adapters |

Semua package adalah **baru lokal Cineva**, bukan fork/version upstream Kantor. Contract universal berada secara fisik pada frontend workspace, tetapi tidak bergantung React/browser/DB; backend mengonsumsi source canonical yang sama. Tidak ada engine validasi duplikat. Existing `app-core` HTTP/CSRF dan `transaction-kit` dipakai ulang. EAV dan data bisnis existing tidak diubah.

Consumer frontend: route `/platform/workspaces` pada Vite base existing `/hots/`, berarti URL sekarang `/hots/platform/workspaces`. Halaman mengandalkan bootstrap BFF API untuk autentikasi, bukan gate token localStorage legacy. Default endpoint adalah origin sendiri, dengan override eksplisit `VITE_TENANT_API_ORIGIN`; tidak menggunakan failover backend Kantor untuk fitur baru ini. User memilih daftar company dari server, menerima undangan dan melihat brand yang resolved. Palette existing Cineva tetap vendor adapter; JSON semantic token overrides dipasang/restored oleh TenantBrand. Logo harus matching asset ID/program/company, HTTPS, PNG/JPEG/WebP; SVG belum didukung tanpa sanitization adapter.

Consumer backend: modul `app/modules/tenant-platform` dan mount `/api/tenant/v1`, baik normal maupun minimal route profile. CORS menambah header CSRF/workspace/request ID sambil mempertahankan origin policy existing. Logger di-inject dari SSE logger existing. Endpoint baru mengembalikan Cache-Control no-store dan error code tanpa credential/payload.

## Contract API baru

| Endpoint | Tujuan | Syarat |
|---|---|---|
| GET `/bootstrap` | Identity dan daftar company yang dapat diakses dalam program server | Identity aktif; personal client sah dapat mendapat daftar kosong |
| POST `/context` | Pilih company dan buat context ID opaque terikat session | Origin/CSRF, membership aktif; body tidak dapat memilih owner program |
| GET `/brand` | JSON semantic tokens + resolved brand asset | X-Workspace-Context dan permission brand.read; membership diperiksa ulang |
| GET `/sso/start` | Authorization Code + PKCE redirect dengan browser binding | OIDC bridge telah dikonfigurasi; HTTPS binding cookie |
| GET `/sso/callback` | Verify code/state/nonce/claims, resolve/register identity, issue BFF cookie | OIDC + canonical identity service + persistent session adapters |
| POST `/logout` | Cabut session aplikasi dan hapus cookie | Origin/CSRF + session valid; bukan global IdP logout |
| POST `/invitations` | Buat undangan ke user yang ditentukan | memberships.invite, current delegation policy, transaksi |
| POST `/invitations/accept` | Terima undangan milik account/program yang cocok | Identity/session aktif, CSRF, token hash lookup lock dan transaksi |

Runtime **tidak** menyimpulkan identity dari req.body atau JWT decode. `registerRoutes(App, {tenantRuntime, tenantLogger})` menerima runtime terpercaya; startup sekarang hanya memasang logger, sehingga seluruh endpoint baru tetap 503 sampai adapter dikonfigurasi. Tidak ada default account, DB connection atau fixture fallback. Halaman workspace tetap dapat menampilkan kondisi tidak tersedia/SSO dengan benar.

## Security/persistence boundaries

- Context server diikat user/session/program/company/membership version dengan TTL; cookie/header context bukan grant mandiri. Context hasil serialize browser tidak dapat dipakai sebagai verified repository context.
- Repository/brand memeriksa membership lagi, sehingga object context lama tidak menghindari revoke. Update memakai UoW, validasi parent owner, larangan owner patch dan revalidation sebelum callback transaksi selesai. Penutupan race lintas database/session store tetap memerlukan transaction/lock policy di adapter nyata.
- Perpindahan context client membatalkan request, membersihkan snapshots, melepas subscription dan menolak respons terlambat. Cache tidak melewati server membership revalidation. Dua client instance/tab tidak berbagi active-company global.
- Adapter MySQL membership hanya SELECT berdasarkan physical snapshot HOTS: user_t_program_access + active user/company + scoped user_permission. Program IDs dan permission-module mapping wajib eksplisit; global role_id tidak otomatis menjadi platform grant. Duplicate access rows ditolak, tidak dipilih LIMIT 1. Tidak ada grant/backfill otomatis.
- OIDC: verifier/state/nonce dibuat server dan transaksi login dikonsumsi atomically sekali; endpoint HTTPS eksplisit, PKCE S256, injected RS256 cryptographic verifier, issuer/audience/azp/nonce/expiry/iat validation, opaque subject. ID/access tokens tidak diberikan ke browser oleh bridge. JWKS discovery/rotation, MFA, refresh dan global logout belum disediakan oleh adapter ini.
- Session: per-app __Host cookie HttpOnly Secure SameSite=Lax, readable app CSRF cookie, exact Origin + constant-time CSRF checks, absolute expiry, active-user revalidation dan logout revoke. Persistent store/cleanup/distributed revocation harus dipasang; test memory store tidak pernah menjadi runtime default.
- Registration: verified identity resolver + transaction-kit UoW membuat active personal Client dan **tidak** menyertakan company/role dari request. Canonical identity creation/password verification/uniqueness/recovery perlu adapter nyata; source ini belum membuat akun di DB.
- Invitation: token random disimpan sebagai hash saja, target user/program/company, expiry 24h, single use lewat row lock/mark accepted. Issuer delegation policy diperiksa ulang saat accept; perubahan membership harus atomic dan tidak meng-overwrite hak existing secara implisit. Persistent invitation schema/adapters belum dibuat/applied. Token tidak dikirim melalui email/Slack atau dicatat ke log.
- Ownership company 0/mismatch legacy dari audit database tetap belum diubah. Seluruh endpoint marketplace/ticket/report/file/SSE lama belum otomatis menjadi tenant-aware karena mount baru hadir.

## Validasi yang dilakukan

- `npm.cmd --prefix 1.Frontend install --package-lock-only --ignore-scripts` menyinkronkan manifest workspace; dependency installation berikutnya memakai workspace `ci`. Tidak dibuat HOTS lockfile standalone.
- `npm.cmd run test:tenant`: 48 tests package + localhost HTTP lulus pada baseline implementasi; lihat checks.json untuk hasil terbaru. Mencakup CSRF/session/revoke, forged/cross-context akses, transaksi rollback, personal onboarding, undangan, stale request, dan synthetic signed OIDC.
- `npm.cmd --prefix 1.Frontend run build`: lulus; warning existing chunk size, dynamic/static imports, pdfjs eval dan Browserslist tetap terlihat. Tidak ada backend runtime/DB yang dinyalakan.
- `npm.cmd run test:tenant:types`: 0 diagnostic pada fitur/package baru dan integrasi App.tsx. Full-app compiler melaporkan 113 diagnostic; tidak diklaim seluruh aplikasi bersih atau seluruh diagnostic tersebut dibuktikan pre-existing oleh baseline sebelum perubahan.
- Scoped ESLint WorkspacePage: 0 warning/error. Browser production preview: 7 skenario dengan API interception sintetis, termasuk tidak ada legacy SSE/Bearer pada workspace; screenshot desktop/mobile diperiksa. Browser tests bukan live backend/IdP acceptance; backend diuji terpisah melalui HTTP lokal tanpa application startup.
- `release-check.mjs`: isolated CJS feature bundle dapat di-load tanpa source-relative atau third-party runtime dependencies, hanya Node builtins. Bukan release lengkap API; pack_for_prod.bat lama hanya menyertakan API folder dan tidak otomatis memuat sibling packages. Tidak ada deployment dilakukan.

Bukti di `3.Knowledge/reports/tenant_foundation_2026_10_21`: checks.json/tests.txt, frontend-build.txt, types.json, browser.json, connection-reference.json, release.json dan screenshot. Test dan packaging scripts hanya di `3.Knowledge/scripts/tenant_foundation_2026_10_21`; reusable package tests tinggal di package masing-masing.

## Yang belum boleh dinyatakan selesai

1. Semua standar SaaS dan semua endpoint legacy belum selesai diadopsi.
2. Domain cineva.com belum diverifikasi DNS/TLS/deploy/IdP. Issuer endpoints, callback/client registration, public-key resolver dan server-only secret belum diisi atau diuji live.
3. Persistent identity/session/context/invitation/brand write adapters serta penetapan program IDs belum aktif. Database HOTS tetap read-only sesuai instruksi; tidak ada registration/undangan/repair nyata.
4. Brand editor/publish/history/rollback, onboarding UI credential/provider, campaign invitation relation, quota/paid billing, MFA/recovery/global logout dan backup/restore tetap pekerjaan lanjutan.

Langkah berikut yang aman: review config/registry aktual via MCP, sahkan persistence target yang memang boleh ditulis di Cineva, kemudian implement adapter/migration dengan acceptance dua program/company. Jangan mengaktifkan multi-tenant produksi hanya karena package dan dummy tests lulus.
