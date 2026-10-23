---
category: Overseas PAR
status: active
superseded_by: null
tags: [par, approval, remark, executor, latest-pic, paid]
relates_to: [file:D:/Kantor/1.Frontend/overseas_module/par/src/views/ApprovalFlowSection.tsx, file:D:/Kantor/1.Frontend/overseas_module/par/src/views/ParListViews.tsx, file:D:/Kantor/2.Backend/Integrated-API/app/modules/par-document/parDocument.service.parts/support/attach-par-business-columns.js]
evidence_kind: source-and-isolated-tests-and-read-only-db
observed_at: 2026-10-22
---

# Upgrade approval remark dan Latest PIC PAR

## Follow-up: desain Email Activity

Pengguna menunjukkan screenshot Email Activity tanpa styling yang konsisten. `ParEmailStatus.tsx` kini memakai header ikon Mail, tombol refresh berlabel aksesibilitas, state loading/disabled, info SMTP ringkas, ikon dan badge status per event serta metadata retry yang lebih tenang. CSS di `styles/detail-feedback.css` scoped ke widget, memakai border/background putih dan aksen biru HOTS. Tidak mengubah API, recipient, queue, DB atau klaim SMTP acceptance vs inbox delivery.

Verifikasi follow-up: frontend typecheck dan build 1.645 modules lulus; preview memakai renderer TSX aktual dengan state React sintetis dan API dinonaktifkan, lalu dibuka headless Chromium. Lebar 408/320 px tidak overflow; 3 event accepted dirender, serta state missing recipient/failed/sending/skipped diperiksa. Screenshot `reports/par_approval_pic_2026_10_22/email-preview.png`; bukan bukti runtime API atau deployment. Script satu kali `scripts/par_approval_pic_2026_10_22/email-preview.cjs`. Build follow-up di `reports/par_email_style_2026_10_22/build-par`.

## Izin dan cakupan

Pengguna secara eksplisit mengizinkan edit Kantor untuk sesi ini: "ya edit, tolong untuk sesi ini". Ini pengecualian terbatas untuk perubahan Overseas/PAR berikut; bukan perubahan default batas read-only Cineva. Source diubah pada frontend Overseas/PAR dan backend module par-document Kantor. Cineva application source dan package HOTS shared tidak diubah. Tidak ada deployment, perubahan schema, atau DB write.

## Perilaku yang disepakati

- Kartu approver menampilkan nama, tanggal, kemudian `remark : ${pesan}` ketika remark tidak kosong. Isi menggunakan teks React yang di-escape, whitespace/newline dipertahankan, kata panjang dibungkus.
- Approval masih berjalan: Latest PIC = approver aktif. Setelah seluruh approval assigned berstatus approved/skipped dan tidak ada approval pending, Latest PIC = executor pembayaran. Executor tidak ditambahkan ke jumlah/progres approval.
- Executor dipilih dari assignment payment aktif terbaru; fallback ID menggunakan konfigurasi `par.payment_assignment` / `par.executor_assignment.user_fields`, default `executor_user_id` / `approval_6_user_id`, beserta varian `_id`. Latest work-data mengungguli EAV.
- Executor kosong setelah approval selesai: `Executor belum ditentukan`. Rejected/cancelled/closed/deleted tidak punya PIC aktif. Paid (execution_date sesuai kontrak existing) selalu Latest PIC `-`.
- Paid List mengganti kolom `Paid` existing menjadi `Tanggal Paid`, dengan nilai `execution_date`. Tidak menambah kolom; kolom Status tiket tetap. Kolom ini bisa diurutkan berdasarkan tanggal dan tidak lagi menampilkan teks step. All PAR dan tabel lain tetap memiliki kolom Paid/Unpaid existing.
- Ekspor All PAR memakai resolver label PIC yang sama. Paid List saat ini tidak mempunyai tombol ekspor; tidak menambahkan fitur ekspor baru.

## Arsitektur dan kontrak

Backend menambah field `latest_pic_id`, `latest_pic_name`, `latest_pic_role`, `latest_pic_stage` (`approval`, `payment`, `none`) melalui helper pure modular `resolve-latest-pic.js`. Field `current_step`, `current_step_approver_id`, `total_steps`, `approved_steps` lama tetap khusus approval dan tidak diubah semantiknya.

Hydration memakai existing paginated ticket set, query konfigurasi/assignment terikat ticket IDs dan satu batch lookup user (maksimal 100 executor), tanpa query per tiket. Status event skipped = 3, approved = 1 dari HOTS constants; event rejected/void tidak diperlakukan selesai. `t_ticket_event.event_id` tetap identitas event, bukan `id`. `m_service.assignment_config`, kolom EAV/work-data, assignment/user diverifikasi pada schema knowledge HOTS tanggal 22 Oktober 2026 sebelum mengubah SQL baca.

## Verifikasi

- `npm.cmd run typecheck` PAR: lulus.
- `npm.cmd run build -- --outDir D:/Project/Cineva-V2-/3.Knowledge/reports/par_approval_pic_2026_10_22/build-par`: lulus, 1.645 modules; build disimpan sebagai evidence, bukan deploy output aktif.
- Syntax check tiga backend files: lulus.
- `node --test 3.Knowledge/scripts/test_par_approval_pic_2026_10_22.cjs` dari Cineva: 9 tes lulus. Mencakup lifecycle approval/executor/paid/rollback, missing executor, terminal status, custom executor fields, assignment vs EAV, latest payment override, batch 100 tiket, actual React SSR Paid List/remark, HTML escaping dan jumlah kolom.
- Existing backend tests `par-visibility-scope.test.js` + `company-scope.test.js`: 16 tes lulus.
- SQL current/PIC hydration dari source dijalankan melalui MCP read-only untuk 5 tiket service 108: berhasil, 5 rows, field assignment executor terisi pada sample. Tidak menampilkan identitas user pada laporan.
- Belum membuktikan end-to-end approve/reject/payment nyata lewat browser, perubahan historis payment, CMS publication, PM2 reload atau production deployment. SSR shell drag diganti stub; hasilnya tidak membuktikan interaksi drag/browser.

## File dan rollback

Frontend: `src/views/ApprovalFlowSection.tsx`, `src/styles/approval-flow.css`, `src/views/ParListViews.tsx`, `src/types/par.ts`. Backend: `parDocument.service.js`, `support/attach-par-business-columns.js`, `support/resolve-latest-pic.js`.

Repo sudah dirty sebelum sesi. Jangan reset seluruh file/repo untuk rollback. Hapus hanya field/renderer/resolver yang ditambahkan sesi ini; field approval dan schema tidak membutuhkan migrasi balik. Tes/builder satu kali dan Excel report berada di knowledge Cineva. Metadata hash akhir ada pada `reports/par_approval_pic_2026_10_22/evidence.json`.
