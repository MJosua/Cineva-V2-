# Knowledge Base - Job Marketplace Kanban & Timeline Integration

Dokumen ini menjelaskan bagaimana fitur Job Marketplace berintegrasi dengan engine penugasan (Assignment) HOTS, khususnya untuk otomatisasi Kanban Task dan Timeline.

## 1. Skema Database Utama

### a. Marketplace (DB: `job_marketplace_hots`)
- **`data_job_campaign`**: Menyimpan template pekerjaan.
    - `assignment_todo`: Kolom `TEXT` berisi JSON array atau teks baris-baru yang mendefinisikan daftar tugas (To-Do).
- **`user_profile`**: Tabel EAV yang menyimpan atribut talent (niche, followers, dll).

### b. HOTS Core (DB: `hots`)
- **`t_ticket_work_data`**: Tabel EAV utama untuk unit kerja (`data_type: 'task'`) dan timeline (`data_type: 'timeline_update'`).
- **`t_ticket_work_data_env`**: Tabel struktural untuk Kanban. Menyimpan `status`, `sort_order`, dan `parent_entity_id` untuk setiap `entity_id` tugas.
- **`t_ticket_work_data_report`**: Menyimpan laporan WYSIWYG detail. Digunakan untuk menyimpan ringkasan profil talent saat approval.

## 2. Alur Automasi (PIC Approval)

Proses ini terjadi di `JobPICController.approveApplicant`:

1. **Trigger**: PIC menekan tombol "Approve" pada pendaftar.
2. **Identification**: Sistem mencari `ticket_id` di `t_ticket_detail` yang memiliki `job_id` yang sesuai.
3. **Kanban Generation**:
    - Membaca `assignment_todo` dari kampanye.
    - Melakukan loop dan membuat `entity_id` untuk setiap tugas (`TASK_AUTO_...`).
    - Insert ke `t_ticket_work_data_env` (status default 'todo').
    - Insert ke `t_ticket_work_data` (field 'title').
4. **Talent Profile Injection**:
    - Mengambil data dari `job_marketplace_hots.user_profile` untuk talent yang bersangkutan.
    - Mengonversi data EAV menjadi list HTML (`<li>`).
    - Menyimpan list tersebut ke `t_ticket_work_data_report` agar tersimpan secara permanen sebagai log "Approval".
5. **Activity Feed Update**:
    - Membuat entri `timeline_update` di `t_ticket_work_data` agar muncul di feed aktivitas utama ticket tersebut.

## 3. Catatan Implementasi untuk Developer/Model

- **ID Ticket**: Marketplace menggunakan format Ticket HOTS terbaru (BigInt numeric) yang disimpan sebagai string di kolom `ticket_id`.
- **WYSIWYG**: Konten di `t_ticket_work_data_report` dan `t_ticket_work_data` (timeline) mendukung HTML.
- **Service ID**: Ticket pendaftaran talent menggunakan **Service ID 19**.
