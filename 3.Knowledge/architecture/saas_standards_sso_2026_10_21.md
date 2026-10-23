# Standar utama SaaS dan SSO

Tanggal 21 Oktober 2026. Rancangan dan pembacaan source, belum implementasi atau verifikasi deployment.

Update implementasi: [fondasi package dan consumer baru](tenant_foundation_2026_10_21.md) sudah dibuat dan diuji lokal. Keputusan pengguna: target cineva.com; personal Client mandiri langsung aktif, company/campaign lewat undangan. Seluruh standar dan production SSO belum dinyatakan selesai.

## Definisi authoritative dari pengguna

- Tenant adalah lingkungan program terpisah: HOTS Normal, Overseas, Cineva.
- Company adalah perusahaan: Indofood, IndoUSA, dan seterusnya. Satu company dapat terdaftar pada lebih dari satu tenant program.
- Satu user merupakan global identity yang dapat masuk beberapa company dan program sesuai membership.
- Role Client/Company Admin/Company Staff menentukan kemampuan pada membership tenant–company, bukan tabel login terpisah dan bukan bukti kepemilikan semua data.
- Company tetap batas akses data bisnis di dalam tenant sesuai policy. Bila nanti satu pelanggan memiliki beberapa company yang perlu dikelompokkan, model grup/workspace tambahan harus diputuskan; tidak diasumsikan sudah ada.

Definisi ini menggantikan bagian rekomendasi audit sebelumnya yang menggunakan tenant sebagai pelanggan. Fakta schema, nilai default, mismatch company dan temuan source pada audit awal tetap berlaku; interpretasi ownership target sekarang harus memakai **tenant program + company bisnis**, bukan tenant pelanggan yang dipaksakan.

## Standar wajib dan acceptance

| Urutan | Standar | Acceptance utama |
|---|---|---|
| 1 | Kamus domain dan ownership | Tenant/company/user/program/business relation tidak ambigu; setiap aggregate memiliki owner dan klasifikasi global/public/private |
| 2 | Tenant-company registry dan membership | Program-company yang sah serta user-company-role aktif terverifikasi server; default deny; invitation, approval, expiry dan revoke eksplisit |
| 3 | Identity dan SSO pusat | Global user, issuer+subject mapping; program OIDC clients terpisah; berhasil login tidak berarti memiliki membership |
| 4 | Authorization | Capability/permission scoped tenant-company-resource-action; platform admin dibedakan; Client dibatasi relasi campaign/perusahaan |
| 5 | Isolasi package | tenant-contracts/client/server dipakai engine dan aplikasi nyata; storage/cache/files/jobs/SSE tercakup; context browser tidak dipercaya |
| 6 | Database integrity | Ownership legacy dipetakan berdasarkan bukti; root/child/FK/unique/index tepat; semua DML transaksi/rollback; DDL punya backout |
| 7 | JSON config dan branding | Schema version, precedence tenant/company/user, asset ownership, visual editor, draft/preview/publish/history/rollback; tanpa secrets di config public |
| 8 | Kontrak API dan workflow | Version/error/pagination konsisten; input tervalidasi; mandatory sync atomic atau outbox eksplisit; idempotency dan concurrency diuji |
| 9 | Account dan session lifecycle | Invite/activate/suspend/revoke; recovery aman; MFA/step-up untuk operasi sensitif; logout app dibedakan logout SSO global |
| 10 | Hak fitur dan billing | Entitlement terpisah dari role; pembayaran subscription terpisah dari billing campaign/payout; provider signature/replay/idempotency bila billing diaktifkan |
| 11 | Audit dan operasi | Actor asli + tenant/company/resource/request tercatat via SSE logger existing; redaksi token/PII; backup/restore, retention dan release rollback diuji |
| 12 | Acceptance lintas konteks | Dua tenant, dua company, multi-role; negative read/write/list/count/export/file/job/event; tab/switch/revoke; backward compatibility PAR/Cineva |

Role tidak menggantikan entitlement: user dapat berhak sebagai admin tetapi fitur masih tidak tersedia pada program/company tersebut. Kebutuhan paid SaaS billing dapat bertahap, tetapi isolation, identity, membership dan audit tidak boleh bergantung pada payment mock.

## Rancangan SSO yang direkomendasikan

Pusat identitas menjadi shared platform service, meskipun saat ini implementasinya berada dalam backend HOTS. UI login boleh tetap melalui HOTS; ini tidak boleh menjadi alasan memberi akses ke seluruh data tenant HOTS Normal. Satu issuer melayani OIDC client terpisah untuk tiap program/deployment dengan daftar redirect URI yang exact. OIDC client adalah identitas aplikasi protokol; tidak selalu relasi satu-ke-satu dengan tenant jika ada mobile/admin/client tambahan.

Alur:

1. User membuka Cineva/Overseas/HOTS Normal. Server menentukan program dari registry host/client, bukan menerima tenant bebas dari query sebagai bukti izin.
2. Aplikasi memulai Authorization Code + PKCE S256 ke IdP. Simpan transaksi login terikat browser/session; verifikasi callback, state, lifetime dan nonce bila digunakan sesuai flow. Periksa signature/algoritme, issuer, audience, expiry dan subject.
3. Backend memetakan `(issuer, subject)` ke user canonical. Jangan menggabungkan akun otomatis hanya karena email sama. `sub` adalah opaque identity; parsing numeric source sekarang hanya cocok dengan provider internal existing, bukan aturan umum semua IdP.
4. Backend memeriksa user aktif, membership program dan daftar company. Satu company sah dapat dipilih otomatis; beberapa company menampilkan pilihan dari server. Company yang diingat browser harus divalidasi ulang.
5. Backend membuat session aplikasi dengan tenant program, company aktif, subject, role/permission context dan versi izin. Tokens terikat audience resource yang sesuai; ID token bukan access token API. Shared backend dapat memakai resource audience bersama bila desainnya eksplisit dan tetap memeriksa tenant/company.
6. Request selanjutnya selalu divalidasi. Switch company adalah operasi backend terotorisasi; respons lama/cache/SSE harus dibuang sesuai package lifecycle.

Pusat SSO berbagi identity session, bukan satu mutable active-company global untuk seluruh browser. Membuka Cineva company A dan Overseas company B pada tab lain harus dapat berjalan bersamaan tanpa saling mengganti company diam-diam. Context aplikasi/tab/request harus eksplisit dan terikat session yang sesuai. Prefix storage bukan security boundary terhadap script dalam origin sama; pilihan origin, BFF/cookie dan trust boundary MFE harus jelas.

Untuk browser, targetkan session aplikasi melalui backend/BFF dengan cookie HttpOnly/Secure dan SameSite sesuai topology, serta CSRF protection untuk operasi yang menggunakan cookie. Hindari token jangka panjang di localStorage sebagai default target. Session/refresh lifecycle, absolute/idle timeout, key rotation/JWKS refresh, revocation dan log redaction harus mempunyai acceptance. Secret client hanya di server. MFA/step-up dibutuhkan untuk admin/finance/aksi sensitif sesuai policy; pilihan metode perlu perancangan terpisah.

Logout dari aplikasi mengakhiri session aplikasi; logout seluruh perangkat/program membutuhkan revocation dan koordinasi IdP/RP yang eksplisit. Suspend membership company harus memblokir akses company itu tanpa mematikan akses sah user ke company lain. Revoke user global memblokir seluruh session. Token lama tidak boleh mempertahankan izin tanpa batas sampai expiry panjang.

## Source existing yang diperiksa read-only

Kantor tidak diedit. Bukti source tanggal audit, bukan bukti runtime atau conformance certification:

- `D:/Kantor/1.Frontend/HOTS/src/services/oidc.ts`: membuat state acak, PKCE S256, simpan transaksi, validasi state dan expiry 10 menit, hapus transaksi saat callback; code exchange ke backend. Reauth memakai fallback transaksi localStorage dan hasil ID token disimpan localStorage. Audit transport/XSS/session perlu dibahas sebelum target cookie/BFF dianggap diterapkan.
- `D:/Kantor/2.Backend/Integrated-API/app/modules/oidc/ssoCallback.js`: backend exchange code dengan verifier; verify RS256, issuer, audience, clock tolerance; memetakan numeric sub ke user dan mengeluarkan token HOTS legacy. Ini jembatan kompatibilitas, belum membership program-company baru.
- `.../oidc/config.js`: PKCE default true; cookie key validation ada; `OIDC_NULL_ACCESS_ALLOW_ALL` default true; home client memiliki pengecualian akses program. Deployment env tidak dibaca. Untuk SaaS, akses ke halaman login pusat dan akses resource HOTS harus dibedakan.
- `.../oidc/accountStore.js`: akses program memakai user.sso_program_access, opsi null allow-all dan pengecualian home client. Role global 1/2/4 membatasi query login existing; role Client Cineva harus dipetakan sesuai model identity/membership, tidak menambah bypass.

Belum diaudit end-to-end: exact redirect matching provider, callback replay/reuse, nonce sesuai flow, key rotation failure, MFA, reset/password recovery, refresh reuse/revoke, global logout, domain/cookie policy dan failover IdP. Tidak ditemukannya nonce pada source client yang dibaca bukan klaim otomatis bahwa seluruh Code Flow tidak valid; flow dan binding lengkap harus diuji.

## Referensi protokol

- [OAuth Security BCP RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html): PKCE, exact redirect matching, token/session protections.
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html): identity claims dan ID token validation.

## Urutan pelaksanaan

Fase A: sahkan domain/ownership + membership/permission + kontrak session. Fase B: package isolation dan adapter identity/SSO berdasarkan fondasi existing. Fase C: migrasi ownership/constraints dan adopsi engine/produk secara additive. Fase D: config brand/editor, operational lifecycle dan billing bila diperlukan. Semua fase memerlukan acceptance dua tenant/company; build atau unit test saja bukan bukti keamanan produksi. Tidak ada perubahan DB/package/source aplikasi dalam dokumen ini.
