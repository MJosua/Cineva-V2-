# Audit struktur dan semantik database untuk SaaS

Tanggal: 21 Oktober 2026. **Baseline yang dipilih pengguna: database HOTS saat ini; Cineva nanti disesuaikan ke bentuk ini.** Kesimpulan: fondasi multi-company, identity mapping, workflow/EAV dan JSON cukup berguna untuk dipertahankan, tetapi belum memadai sebagai shared-database SaaS dengan ownership tenant yang tegas.

Koreksi semantik dari pengguna sesudah audit: tenant = program HOTS Normal/Overseas/Cineva, company = Indofood/IndoUSA; user dapat memiliki banyak membership. [Standar terbaru](saas_standards_sso_2026_10_21.md) menggantikan interpretasi tenant-pelanggan pada rekomendasi historis di bawah. Bukti fisik/agregat tidak berubah; ownership target mengikuti tenant-program + company.

## Scope, sumber dan batas

Audit dilakukan read-only melalui connector HOTS. `DATABASE()` mengembalikan `hots`, versi server `8.0.20`. Metadata aktual disimpan **di Cineva**, bukan Kantor: [snapshot schema](../schema/hots_saas_baseline_2026_10_21.json). Snapshot berisi 180 tabel/view, 176 base table InnoDB, 4 view, 2.010 kolom, 673 bagian index, 302 constraint dan 59 declared FK. Index parts bukan jumlah index. Snapshot information_schema bukan export lengkap DDL/trigger/routine/grants.

Pembacaan metadata langsung menggantikan dugaan schema dari draft Cineva. `SHOW CREATE TABLE` ditolak guard connector; audit memakai SELECT read-only information_schema. Tidak ada upaya mengubah guard. Tidak ada DDL/DML, repair, migration, cron, deploy, edit source/package aplikasi atau penulisan Kantor. Nilai credential, isi profil, email, kontak dan payload pelanggan tidak diambil; pemeriksaan data mengembalikan agregat terbatas.

Bukti hasil: [agregat sampel dan query](../reports/database_saas_2026_10_21/data_checks.json), [temuan dan hash snapshot](../reports/database_saas_2026_10_21/audit_findings.json), dan Excel `reports/database_saas_2026_10_21/outputs/database_saas_2026_10_21/Database_SaaS_Audit.xlsx`. Query pemeliharaan ada di `3.Knowledge/scripts/saas_audit_2026_10_21/database_queries.json`; refresh schema lebih dahulu sebelum rerun. Pembacaan terpisah bukan consistent transaction snapshot. Belum ada EXPLAIN, full-data profiling, audit semua views/routines/triggers atau uji keamanan HTTP.

## Yang sudah baik dan bisa dipertahankan

- Seluruh 176 base table memakai InnoDB: tersedia fondasi transaksi dan FK. Keberadaan InnoDB tidak membuktikan setiap operasi aplikasi memakai transaksi/rollback.
- `user.user_uuid` mempunyai unique index; `user_t_program_identity` memiliki unique external identity gabungan program/subject/company/user, serta FK ke user UUID dan program. Ini fondasi global identity + external mapping yang berguna.
- `m_company_user_profile` mempunyai unique `(company_id, user_id)`; `user_permission` punya unique `(user_id, company_id, permission_key)`. Scope organisasi mulai dimodelkan, bukan hanya disimpan di frontend.
- Ticket detail/event/assignment/work-data/file memiliki FK ticket pada tabel yang diperiksa. EAV `cstm_col`, `lbl_col`, `value`, revision dan work-data dapat dipertahankan.
- `m_company.logo_url`, configuration key/value, `m_service.form_json`, assignment config, workflow JSON, snapshot dan version ticket merupakan pondasi konfigurasi dinamis. Tidak perlu menghapus engine existing untuk SaaS.

## Blocker ownership dari struktur dan data aktual

### 1. Company belum bisa langsung dijadikan tenant

Tidak ada kolom bernama tenant pada snapshot ini, tetapi **ketiadaan nama tenant saja bukan bukti sistem gagal multi-tenant**. Company bisa menjadi batas tenant bila satu company benar-benar satu pelanggan dengan relasi konsisten. Masalah HOTS saat ini adalah makna company juga dipakai sebagai badan usaha/country/IOD mapping dan konteks multi-company Overseas, ditambah data ownership yang tidak konsisten.

`m_company` berisi nama, country, `iod_company_id`, default currency, logo dan license expiry. Ini cocok sebagai organisasi bisnis. Untuk pelanggan SaaS yang memiliki beberapa company, diperlukan boundary tenant terpisah atau mapping equivalent yang eksplisit. Product Cineva/Overseas bukan tenant itu sendiri. Master referensi global seperti currency/country tidak perlu dipaksakan menjadi milik satu tenant.

### 2. Ticket punya ownership yang dapat kosong/invalid

`t_ticket.company_id` nullable, default `0`, tanpa declared FK ke `m_company`. Pada sampel **1.000 ticket dengan `ORDER BY ticket_id DESC`**, 993 bernilai company 0 dan tidak memiliki master company yang cocok. Ini urutan primary key/kolasi, **bukan urutan tanggal dan bukan statistik seluruh tabel**. Nol bisa memiliki makna legacy/internal, tetapi belum menjadi ownership tenant yang dapat dipakai langsung.

Jangan melakukan mass update company 0 ke 1. Pengisian pemilik harus berasal dari bukti bisnis yang disepakati: source program/company, relasi transaksi, histori yang sah dan validasi owner. Ticket yang ambigu harus ditandai untuk review; `created_by` bukan selalu bukti pemilik karena pseudo actor/shared admin dapat membuat data atas nama pihak lain.

### 3. Ownership work-data berbeda dari parent

`t_ticket_work_data.company_id` NOT NULL/default `1`, sedangkan parent ticket default `0`. FK existing hanya `ticket_id`; tidak memaksa kesamaan company.

Pada sampel **1.000 work-data dengan ID terbesar**:

| Work company | Ticket company | Jumlah |
|---|---|---:|
| 1 | 0 | 827 |
| 1 | 1 | 95 |
| 1 | 2 | 78 |

Jadi 905/1.000 berbeda company dari parent. Seluruh ticket parent pada sampel ini ditemukan. Belum ditentukan apakah company di work-data dimaksudkan sebagai pemilik, organisasi actor, atau default legacy. **Jangan mengubahnya sebelum arti field diputuskan.** Jika field menyimpan actor company, ownership tenant harus mempunyai sumber berbeda yang authoritative.

### 4. Assignment dan hierarchy perlu kontrak yang lebih kuat

`t_ticket_assignment.id` bigint; `t_ticket_work_data.assignment_id` int dan tidak mempunyai declared FK ke assignment. Pada sampel yang sama, 20 referensi assignment tidak cocok ternyata semuanya `0`; tidak ditemukan referensi positif yang hilang. Nilai sentinel ini perlu semantik jelas: no assignment sebaiknya tidak dianggap assignment nyata ketika validasi baru diaktifkan. Ini **bukan temuan 20 assignment positif terhapus**.

`ticket_id` varchar36, `parent_ticket_id`/child ticket_id varchar50, `root_ticket_id` varchar32. Perbedaan panjang string tidak otomatis membuat FK MySQL invalid, tetapi root varchar32 tidak menampung UUID 36 karakter jika ID itu kelak dipakai. Sampel ticket tidak menemukan ID >32 atau parent lintas company; risiko kapasitas tetap ada untuk format baru. Perubahan ID bukan syarat wajib SaaS, tetapi kontraknya harus seragam dan opaque/string di adapter.

## Semantik identity dan authorization

1. **Global user dapat dipertahankan.** Satu manusia boleh masuk beberapa tenant; jangan otomatis menggandakan seluruh user. Namun `user.company_id` tunggal/default 1 dan `user.role_id` global tidak cukup mewakili membership serta role yang berbeda per tenant. Pada sampel sampai 1.000 user didapat 258 row; 5 UUID null. Ini bukan bukti login salah, tetapi backfill/mapping UUID diperlukan bila dijadikan kunci identity wajib.
2. **Company profile adalah fondasi, bukan seluruh membership.** Unique pair company/user bagus; belum ada declared FK ke master user/company pada tabel ini. Status aktif, masa berlaku, revocation, tenant membership dan primary company perlu dipisahkan maknanya.
3. **Platform admin dan tenant admin harus dibedakan.** `role_id = 4` existing memiliki arti admin luas pada source PAR. Scoped role baru harus menjaga admin tenant tidak menjadi admin platform. Permission company/module tidak menggantikan pemeriksaan tenant.
4. **Permission key perlu namespace.** `user_permission` menyimpan module_key tetapi unique hanya user/company/permission. Ini benar jika permission_key selalu globally namespaced, misalnya `par.request.create`; bila key lokal modul bisa sama, model ini bentrok. Putuskan kontraknya, jangan langsung menambah module ke unique tanpa audit penggunaan.
5. **Akses program mempunyai dua representasi.** `user_t_program_access` memiliki user/company/program/role/status/revoked_at tetapi tidak unique gabungan dan tidak FK. Pemeriksaan sampai 2.000 row mendapatkan 0 row. Source OIDC `app/modules/oidc/accountStore.js` justru membaca JSON `user.sso_program_access`, dengan opsi `nullAccessAllowAll` default true dan pengecualian homeClientId. Nilai deployment tidak diverifikasi. Jangan menyimpulkan tabel akses program sudah sumber izin aktif; perlu satu authority dan adapter backward-compatible.
6. **External identity bukan owner tenant.** Mapping program/external company/user sudah berguna; `external_company_id` bukan sinonim tenant internal. External account dari issuer/realm berbeda perlu namespace yang jelas sebelum dipakai lintas provider.

## Semantik Cineva saat mengikuti HOTS

### Profil talent tidak boleh seluruhnya global

`user_profile` unique `(user_id, attribute_name)` tanpa company/product. Cocok untuk atribut identitas global yang memang dibagikan, tetapi tidak cukup untuk NDA, negotiated fee, rating internal, status onboarding, catatan client atau hubungan talent dengan tenant tertentu. Dua tenant menulis attribute yang sama akan menarget slot user/attribute yang sama. Buat pemisahan global identity/public talent profile versus tenant relationship/private attributes dengan consent dan visibility yang jelas.

Ada incompatibility source konkret: `TalentProfileController.js:106–108` Cineva memakai `profile_id`, sedangkan schema HOTS actual memakai `user_profile.id`. Ini gap porting ke target HOTS, **bukan bukti schema Cineva lama pasti salah**. Snapshot target juga tidak mempunyai `t_job_list`, campaign/batch/location/talent assignment, t_subscription, m_plan atau t_saas_invoice dari source Cineva. Menyalin controller ke koneksi HOTS saja belum dapat menjalankan domain Cineva.

### Job, workflow ticket dan talent assignment berbeda

- Job/campaign adalah aggregate bisnis milik tenant/company/product.
- Talent assignment menyatakan partisipasi talent pada campaign/batch/location/deliverable.
- Ticket adalah container proses, revision, approval dan histori.
- Ticket assignment adalah tugas user/team engine, bukan otomatis pengganti seluruh talent assignment.
- Pseudo account adalah actor teknis; tidak menentukan customer owner dan tidak boleh menghapus actor manusia asli di audit.

Source `JobPICController` mencari ticket lewat EAV job_id dengan `LIMIT 1`. Untuk beberapa application/talent/ticket pada job yang sama, relasi ini belum deterministik. Tetapkan cardinality eksplisit sesuai proses: apakah ticket per job, per application, atau per assignment. Hubungan inti ini harus tenant-scoped dan dapat divalidasi. EAV tetap untuk atribut form/dinamis, bukan satu-satunya mekanisme referential integrity bisnis.

### Status dan uang tidak boleh disatukan

Status subscription tenant, status company, status job/campaign, approval ticket, assignment progress, publish konten dan payout memiliki lifecycle berbeda. Billing SaaS adalah tagihan platform ke pelanggan; campaign billing adalah tagihan bisnis; payout adalah kewajiban ke talent. Pisahkan payer/payee, currency, amount/rounding, periode, external reference, idempotency dan audit. Jangan menaruh semuanya sebagai satu status generic atau menganggap `m_company.license_expiry` sudah mewakili subscription/entitlement.

## Configuration, brand dan namespace

- `m_company_configuration` memiliki unique `(company_id, config_key)` dan FK company, tetapi company nullable dan value TEXT. Dalam 11 config row yang terbaca, hanya 2 value valid JSON. **Sembilan value lain tidak otomatis rusak**: tabel existing adalah key/value generic dan bisa menyimpan plain text. Kontrak brand JSON perlu key/type/schema_version/revision/validation yang eksplisit, tanpa mengonversi semua value ke JSON secara buta.
- Unique key dengan company NULL tidak menjamin satu global default; MySQL mengizinkan beberapa NULL pada unique. Jika NULL berarti default global, precedence dan uniqueness perlu desain khusus. [MySQL CREATE INDEX](https://dev.mysql.com/doc/refman/8.0/en/create-index.html).
- `m_service` dan `m_service_workflow` bersifat global dari kolom yang tersedia; workflow primary key service_id. Shared defaults boleh global, tetapi perubahan satu tenant harus lewat binding/version/override, tidak menimpa definisi semua pelanggan. Referensi user/team di JSON harus diperiksa terhadap tenant pemilik.
- `cms_m_page.slug` unique global walaupun ada company. Pilih apakah URL memang global atau lokal tenant/product. Global uid unique juga valid bila account identity memang global. Tidak semua unique harus ditambah tenant; keputusan bergantung makna key.
- `m_company_program_list` walau namanya mengandung company berisi katalog program/SSO client, tidak mempunyai company_id. Jangan menganggap row program adalah membership tenant.
- `user_preferences` unique user/category/key: sesuai untuk preference global yang disengaja, tetapi saved filter/layout tenant memerlukan scope context agar tidak saling menimpa.
- Brand aplikasi/logo tenant berbeda dari `brand_name` campaign/client. Logo, config revision, asset ownership, public/private classification dan history publish perlu satu kontrak package yang sudah disepakati. Native JSON memastikan bentuk JSON valid, bukan business schema, ownership atau permission.

## Integritas, event dan index

FK detail/event/assignment/file/work-data ke ticket sudah berguna, tetapi FK ticket saja tidak membuktikan company di child sama atau assignee mempunyai membership sah. Tidak adanya tenant column di child bukan otomatis cacat bila owner dapat diturunkan dari parent yang wajib dan benar. Untuk generic file/document dengan entity_type/entity_id atau temp upload sebelum ticket dibuat, harus ada jalur ownership lain yang tegas; nullable parent tidak boleh membuka jalur tanpa owner.

`t_document` dan `file_t_upload` generic tidak memiliki FK pemilik pada metadata yang diperiksa. `user_notification` hanya user-scoped; outbox memiliki ticket/payload dan unique idempotency_key global nullable. Namespace tenant/operation untuk idempotency, authority payload dan scope penerima harus jelas. Ketiadaan kolom tenant pada event bukan bukti payload tidak mempunyai context; payload isi tidak dibaca dalam audit ini.

Index ticket existing meliputi company, service/date, service/status dan hierarchy root/company/parent. Ada index EAV `(ticket_id,cstm_col,value prefix100)` dan work-data timeline. Ini fondasi yang baik. Namun belum ada ownership tenant untuk mengawali scoped list/count/search; composite index target dipilih setelah query/workload final, lalu diuji EXPLAIN. Tidak ada klaim query lambat/cepat dari daftar index saja. Root identifier capacity dan assignment integer compatibility harus dibereskan bila desain relasi baru memerlukannya. [MySQL FK restrictions](https://dev.mysql.com/doc/refman/8.0/en/create-table-foreign-keys.html).

## Keputusan arsitektur dan urutan perbaikan

1. Tetapkan semantics tenant/company/product/global identity; tulis ownership matrix per aggregate, termasuk public marketplace sharing yang eksplisit.
2. Putuskan sumber authority untuk identity, membership/role, akses program dan entitlement. Preserve compatibility untuk OIDC dan Overseas/PAR.
3. Profiling ownership legacy secara terkendali dan mapping berdasarkan bukti; tandai ambiguous, jangan repair otomatis. Sampel audit ini bukan mapping seluruh data.
4. Rancang constraint/unique/index dan scope root/child berdasarkan physical snapshot ini. Migration terpisah, additive dan idempotent; DML memakai transaksi/commit/rollback. DDL MySQL memerlukan backout karena implicit commit.
5. Implementasikan kontrak melalui `tenant-contracts`, `tenant-client`, `tenant-server` yang telah disepakati. Persistence adapter menangani schema fisik; engine/domain hanya menerima context dan repository scoped. Package tidak boleh menebak field atau menyamakan company default dengan tenant.
6. Port domain Cineva lewat adapter dan relasi bisnis yang deterministik; jangan membuang campaign/batch/location/talent untuk memaksakan semuanya menjadi ticket.
7. Acceptance: tenant kosong/forged ditolak; cross-tenant parent/child/assignee/file/slug/config/event ditolak; tenant admin terbatas; valid multi-company PAR tetap bekerja; concurrent writes/idempotency/rollback diuji; brand JSON dan private talent attributes terpisah. Lakukan integration dua tenant sebelum aktivasi pooling.

**Kesimpulan operasional:** gunakan HOTS sebagai fondasi target, bukan schema SaaS yang dianggap selesai. Prioritas pertama adalah semantics dan ownership legacy, kemudian constraints dan package enforcement. Menambahkan tenant_id di semua tabel tanpa menyelesaikan arti company/work-data/identity tidak cukup.
