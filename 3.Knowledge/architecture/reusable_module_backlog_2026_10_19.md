# Backlog capability reusable HOTS dari Cineva dan Meetingbook

Rancangan 19 Oktober 2026, dokumentasi saja di Cineva. Tidak mengubah source/DB/Git/build/deploy/index HOTS Kantor. Tujuan: mengambil capability lintas vendor secara additive, bukan memindahkan seluruh program Cineva ke core.

## Bukti fondasi existing

Reference `programs/hots/meetingbook/module.json` mendokumentasikan HOTS service 13 sebagai source of truth, rooms pada resource_m_data, reminder PIC/creator dan create/cancel melalui engine HOTS. `routes/bookings.js` memberi read adapter untuk date/start_time/end_time dan menonaktifkan create langsung dengan 410. `services/hotsBookings.js` membaca ticket EAV. Frontend MeetingRoomStandalone sudah mengomposisi UI/form/Gantt. Pemeriksaan source ini bukan bukti runtime production atau audit seluruh aturan overlap.

## Daftar capability

Nama di bawah adalah usulan logical module; bukan instruksi membuat satu npm package per baris. Setiap module bisa memiliki engine backend, client contract dan komponen frontend sesuai kebutuhan. Reuse ticket/form/workflow/auth/document/trigger existing; hindari engine kedua untuk fungsi sama.

| ID | Prioritas | Capability | Isi umum | Adapter/policy domain |
|---|---|---|---|---|
| M01 | P1 | Calendar UI | Month/week/day/list, range, all-day, timezone, event/deadline, recurrence display | Meeting, visit, shoot, milestone, hotel occupancy |
| M02 | P1 | Resource & availability | Resource unit/type, capacity, operating hours, blackout, buffer, allocation, availability query | Ruang meeting, crew, gear, studio, kamar/unit atau tipe kamar |
| M03 | P1 | Reservation engine | Hold expiry, confirm/reschedule/cancel, overlap/capacity, idempotency, atomic allocation, ticket reference | Meeting service 13 adapter tetap; Cineva/hotel adapter baru |
| M04 | P1 | Workspace/access adapter | Server owner/member/role/resource scope dan tenant context ke engine | HQ/Creator, perusahaan/cabang/properti hotel; reuse IAM existing |
| M05 | P2 | Plan/milestone/assignment preset | Parent-child work, batches, multiple assignees, deliverables, deadlines | Campaign/talent, produksi, task lintas departemen; reuse assignment engine |
| M06 | P2 | Review/approval preset | Versioned submission, revision reason, approve/reject, audit, output references | QC creator, dokumen, desain; configure workflow engine existing |
| M07 | P2 | Quote/rate-card module | Configurable items/units, quantity, versioned quote snapshot, acceptance revision | Crew/gear/day, jasa, room-night; hotel revenue/yield rules bukan default core |
| M08 | P2 | Financial document/ledger adapter | Cash/non-cash separated, partial payments, immutable entries, evidence, provider port | Creator payout, deposit hotel, vendor invoice; bukan accounting/bank engine baru |
| M09 | P2 | Reminder/notification adapter | Schedule event, timezone, provider port, retry/dedup, cancel/reschedule behavior | Meeting reminder existing, deadline visit/QC, check-in reminder |
| M10 | P2 | Import/mapping/provenance adapter | Raw source + normalized values, type mapping, source cell, review conflicts, dry-run | Excel creator, guest/room imports; Lifestyle→niche adalah mapping domain |
| M11 | P3 | Portable demo/document export | Seed JSON, storage interface, offline HTML, import/export validation | Client trial/vendor demos; tidak mengganti persistence/auth production |
| M12 | P1/P3 | Shared UI/metadata extensions | Unique form IDs P1; semantic field renderers/tags/filtering/view composition P3 | Vendor labels/theme remain adapters; compare local forks before port |

Cross-cutting P1: expected revision/optimistic concurrency, immutable accepted snapshots, audit events, idempotency keys, schema validation, transaction + rollback. Ini kontrak yang dipakai beberapa modul, bukan harus satu engine/paket baru per guard.

## Kalender bukan reservasi

Event yang terlihat di kalender tidak otomatis memesan resource. Deadline/QC/insight dapat tanpa resource sama sekali. Reservation harus memeriksa kapasitas/overlap dalam operasi server atomik; frontend check tidak mencegah dua user memesan slot bersamaan.

Meeting/crew menggunakan interval waktu dan timezone/buffer. Hotel membutuhkan date-only stay dalam timezone properti, jumlah malam dan interval `[check_in, check_out)` sehingga hari checkout dapat menjadi check-in berikutnya. Room type inventory dengan quantity tidak sama dengan satu named meeting room. Hold, expiry, occupancy/maintenance, cancel/no-show, tarif/deposit/refund adalah policy adapter hotel; jangan menyamakan room_capacity tamu dengan jumlah kamar tersedia. Property pricing/pajak/regulasi belum dirancang atau diverifikasi di sini.

## Urutan dan acceptance

1. Audit & contract extraction Meetingbook: pertahankan service 13, EAV, create/cancel/envelope/approval/reminder. Buat adapter kompatibel dan tes baseline dummy sebelum refactor.
2. P1 calendar/resource/reservation + server access dan concurrency. Uji jam bersebelahan tidak bentrok, overlap ditolak, timezone, buffer/blackout, multi-resource all-or-nothing rollback, simultaneous confirmation, hold expiry, retries tidak menduplikasi.
3. Consumer kedua Cineva memakai deadline/visit/crew tanpa hardcode room. Consumer proof hotel dengan fixture sintetis unit/type inventory, consecutive stays, multi-night, quantity/capacity dan cancel release; bukan booking hotel production.
4. P2 assignment/QC/quote/ledger/reminder/import menggunakan engine existing serta extension contracts. Uji stale acceptance, snapshot lock, partial/overpay, cancel-reminder dedup dan raw/mapped data.
5. P3 demo export/layout extensions. Uji file URL offline, localStorage blocked fallback, edited HTML fresh browser, no external requests dan metadata compatibility.

Jangan membuat SQL dari daftar ini. Physical schema, service contract dan tenant policy harus diperiksa oleh project Kantor sebelum backend implementation. Semua tes memakai DB/fixture dummy; meeting room lama harus tetap lulus regresi. Sebagian capability sudah tersedia parsial; label kandidat bukan klaim semuanya belum ada. Implementasi Cineva saat ini banyak berupa frontend dummy/demo, bukan modul server yang tinggal dicopy.
