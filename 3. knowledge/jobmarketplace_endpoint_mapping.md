# Endpoint Mapping - HOTS to Job Marketplace

Dokumen ini memetakan endpoint existing HOTS ke arah Job Marketplace agar pengembangan tetap konsisten dan tidak membuat route baru secara acak.

---

## 1. Prinsip Mapping

- Jangan hapus endpoint lama dulu jika masih dipakai modul lain.
- Tambahkan endpoint baru secara bertahap.
- Gunakan adapter atau alias jika perilaku lama masih dibutuhkan.
- Pisahkan public, admin, PIC, dan client endpoint.

---

## 2. Ticketing / Workflow

### Existing
- `POST /hots_ticket/create/ticket/:service_id`
- `GET /hots_ticket/my_ticket`
- `GET /hots_ticket/all_ticket`
- `GET /hots_ticket/task_list`
- `GET /hots_ticket/detail/:ticket_id`
- `POST /hots_ticket/approve/:ticket_id`
- `POST /hots_ticket/reject/:ticket_id`

### Marketplace Target
- `POST /marketplace/job/create`
- `GET /marketplace/job/my-jobs`
- `GET /marketplace/job/all`
- `GET /marketplace/assignment/inbox`
- `GET /marketplace/job/detail/:job_id`
- `POST /marketplace/job/approve/:job_id`
- `POST /marketplace/job/reject/:job_id`

### Catatan
- approval bisa dibuat auto flow jika job marketplace tidak memerlukan approval manual.
- ticket tetap dipakai di belakang layar.

---

## 3. Assignment

### Existing
- `GET /engine/tickets/my-approvals`
- `POST /engine/ticket/approve`
- `POST /engine/ticket/reject`

### Marketplace Target
- `GET /marketplace/pic/assignments`
- `GET /marketplace/pic/assignment/:assignment_id`
- `POST /marketplace/pic/assignment/:assignment_id/start`
- `POST /marketplace/pic/assignment/:assignment_id/progress`
- `POST /marketplace/pic/assignment/:assignment_id/submit`
- `POST /marketplace/pic/assignment/:assignment_id/review`

### Catatan
- ini adalah layer kerja utama PIC.
- assignment harus mendukung worker breakdown.

---

## 4. CMS

### Existing
- `GET /cms/...`
- controller CMS di `controller/hots_controller/cms`

### Marketplace Target
- `POST /cms/job`
- `PUT /cms/job/:job_id`
- `DELETE /cms/job/:job_id`
- `POST /cms/job/:job_id/publish`
- `POST /cms/job/:job_id/close`
- `GET /cms/job/templates`
- `POST /cms/job/templates`
- `GET /cms/job/pic`

### Catatan
- CMS menjadi pusat admin membuat job dan memilih PIC.

---

## 5. Public Marketplace

### Existing
- `GET /hots_public/departments`

### Marketplace Target
- `GET /public/jobs`
- `GET /public/jobs/:job_id`
- `GET /public/talents`
- `GET /public/talents/:talent_id`
- `GET /public/job-categories`
- `GET /public/platforms`

### Catatan
- public endpoint harus ringan dan aman.
- ini akan jadi pintu marketplace utama.

---

## 6. Pickup Flow

### New Endpoint Set
- `POST /marketplace/job/:job_id/pick`
- `POST /marketplace/job/:job_id/release`
- `GET /marketplace/job/:job_id/pickups`
- `GET /marketplace/me/pickups`

### Catatan
- pickup adalah fitur kunci untuk job marketplace.
- perlu anti double-pick dan reserved state.

---

## 7. Reporting

### Existing
- `GET /hots_reporting/...`
- engine reporting existing

### Marketplace Target
- `GET /marketplace/reporting/jobs`
- `GET /marketplace/reporting/pic`
- `GET /marketplace/reporting/talent`
- `GET /marketplace/reporting/sla`
- `GET /marketplace/reporting/export`

### Catatan
- reporting harus membaca dari agregasi, bukan hitung berat setiap request.

---

## 8. Authentication dan Role

### Existing
- `routers/auth.js`
- token decode dan session existing

### Marketplace Target
- `POST /auth/login`
- `POST /auth/client-login`
- `POST /auth/pic-login`
- `GET /auth/me`
- `POST /auth/logout`

### Catatan
- client login bisa menyusul setelah role model stabil.

---

## 9. Recommended Naming Convention

- `job` untuk objek bisnis.
- `ticket` untuk workflow internal.
- `assignment` untuk work execution.
- `pickup` untuk user action mengambil job.
- `talent` untuk profil specialist.
- `pic` untuk penanggung jawab operasional.

---

## 10. Migration Strategy

Langkah aman:
1. Tambah route baru di samping route lama.
2. Buat adapter ke engine lama.
3. Uji flow job create dan assignment.
4. Pindahkan UI ke marketplace page baru.
5. Perlahan kurangi dependency ke endpoint ticket lama.

---

## 11. Prioritas Endpoint MVP

Kalau mau mulai minimal:
- `POST /cms/job`
- `GET /public/jobs`
- `GET /marketplace/job/:job_id`
- `POST /marketplace/job/:job_id/pick`
- `GET /marketplace/pic/assignments`
- `POST /marketplace/pic/assignment/:assignment_id/progress`
- `GET /marketplace/reporting/jobs`

