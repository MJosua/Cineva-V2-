# Job Marketplace Schema Draft

Dokumen ini adalah draft schema teknis untuk basis data Job Marketplace KOL Specialist. Tujuannya adalah memberi acuan struktur tabel, relasi, status, dan data yang perlu disiapkan saat implementasi.

Catatan target:
- schema harus mampu menampung seluruh data workbook referensi operasional.
- job tidak cukup hanya menyimpan title dan description; perlu layer campaign, batch, lokasi, talent assignment, dan content workflow.

---

## 1. Prinsip Schema

- Gunakan ticket sebagai workflow container.
- Gunakan job sebagai objek bisnis utama.
- Gunakan assignment sebagai unit kerja.
- Gunakan audit log untuk semua perubahan penting.
- Gunakan pseudo account untuk routing ticket internal.

---

## 2. Entitas Inti

### 2.1 `user`
Tabel user existing atau user utama sistem.

Field penting:
- user_id
- email
- firstname
- lastname
- role_id
- company_id
- status

### 2.2 `m_role`
Role akses sistem.

Contoh nilai:
- admin
- client
- pic
- worker
- talent
- pseudo_system

### 2.3 `m_company`
Company atau tenant.

Field penting:
- company_id
- company_name
- company_code
- is_active

### 2.4 `data_m_job_category`
Kategori job.

Field:
- category_id
- category_name
- slug
- description
- is_active

### 2.5 `data_m_job_platform`
Target platform job.

Field:
- platform_id
- platform_name
- is_active

### 2.6 `data_m_job_template`
Template job CMS.

Field:
- template_id
- template_name
- template_body
- default_budget
- default_quota
- is_active

### 2.7 `user_profile`
Database talent / KOL specialist sebaiknya ditambahkan sebagai atribut pada profil user yang sudah ada.
Tabel ini dipakai sebagai EAV store untuk atribut user.

Field tambahan yang disarankan:
- user_id
- attribute_name
- attribute_value
- specialty
- platform_focus
- rating
- availability_status
- verified_at
- instagram_username
- instagram_link
- tiktok_username
- tiktok_link
- followers_ig
- followers_tt
- tier_ig
- tier_tt
- niche
- nda_status
- whatsapp
- hb_name
- wa_mg
- availability_visit

---

## 3. Transaction Tables

### 3.1 `t_job_list`
Tabel utama job marketplace.

Field penting:
- job_id
- job_code
- title
- description
- objective
- category_id
- platform_id
- template_id
- company_id
- created_by
- owner_type
- owner_id
- pic_id
- job_status
- visibility
- budget_min
- budget_max
- quota
- deadline_at
- published_at
- closed_at
- created_at
- updated_at

Catatan:
- `t_job_list` adalah container utama.
- data yang berubah per batch, per lokasi, atau per talent sebaiknya dipisah ke tabel turunan.

### 3.1.1 `data_job_campaign`
Master campaign/project.

Field penting:
- campaign_id
- campaign_name
- project_name
- brand_name
- client_code
- cineva_pic_code
- client_phone
- target_product
- job_description
- incentive
- timeline_duration
- deadline_at
- capacity_team
- content_type
- created_at

### 3.1.2 `data_job_batch`
Batch eksekusi per campaign.

Field penting:
- batch_id
- campaign_id
- batch_name
- batch_order
- batch_description
- start_date
- end_date
- status
- created_at

### 3.1.3 `data_job_location`
Lokasi outlet / titik visit.

Field penting:
- location_id
- batch_id
- outlet_name
- address
- gmaps_url
- opening_date
- operational_hours
- location_status
- created_at

### 3.1.4 `data_job_talent_assignment`
Relasi talent ke campaign/batch/lokasi.

Field penting:
- assignment_id
- campaign_id
- batch_id
- location_id
- user_id
- platform_target
- followers_tier
- niche
- sow
- wa_kol
- hb_code
- status_visit
- visit_date
- draft_deadline
- posting_deadline
- created_at

### 3.1.5 `data_job_content_log`
Workflow konten per talent / lokasi.

Field penting:
- content_log_id
- assignment_id
- draft_link
- preview_link
- feedback_client
- revision_link
- content_status
- posting_link
- boosting_code
- notes
- created_at

### 3.2 `data_t_job_pickup`
Catatan job diambil oleh user.

Field:
- pickup_id
- job_id
- user_id
- pickup_status
- picked_at
- released_at
- note

### 3.2.1 `data_t_job_form_response`
Data intake dari form pendaftaran talent atau form operasional lain.

Field penting:
- response_id
- email_address
- name
- domicile
- availability_visit
- instagram_username
- instagram_link
- followers_ig
- tier_ig
- tiktok_username
- tiktok_link
- followers_tt
- tier_tt
- niche
- nda_status
- wa_kol
- hb
- wa_mg
- raw_payload
- created_at

Status saran:
- available
- reserved
- confirmed
- released
- cancelled

### 3.3 `t_ticket`
Tetap dipakai sebagai workflow internal.

Field yang penting untuk marketplace:
- ticket_id
- ticket_type
- service_id
- created_by
- assigned_to
- status_id
- root_ticket_id
- ticket_depth
- company_id
- pseudo_owner_id
- related_job_id

### 3.4 `t_ticket_assignment`
Assignment kerja untuk PIC atau worker.

Field:
- id
- ticket_id
- assignment_code
- title
- description
- assigned_type
- assigned_id
- created_by
- assignment_status
- progress_status
- due_date
- started_at
- completed_at
- unassigned_at
- priority

Status saran:
- active
- completed
- cancelled
- paused

### 3.5 `t_ticket_work_data`
Timeline, progress, form output.

Field:
- id
- ticket_id
- assignment_id
- service_id
- data_type
- entity_id
- field_name
- field_value
- created_by
- revision
- is_latest
- is_hidden
- company_id
- created_at

### 3.6 `t_ticket_file`
File attachment final.

Field:
- id
- entity_type
- entity_id
- ticket_id
- uploaded_by
- filename
- original_name
- file_path
- mime_type
- file_size
- created_at

### 3.7 `t_ticket_file_temp`
File sementara.

Field:
- upload_id
- uploaded_by
- filename
- original_filename
- file_path
- is_used
- created_at

### 3.8 `data_t_job_audit_log`
Audit perubahan job.

Field:
- log_id
- job_id
- ticket_id
- action_type
- actor_id
- old_value
- new_value
- note
- created_at

Catatan:
- audit log tetap penting untuk track perubahan campaign, batch, lokasi, assignment, dan workflow konten.

### 3.9 `data_t_job_reporting`
Agregasi reporting.

Field:
- report_id
- job_id
- company_id
- pic_id
- total_assignment
- completed_assignment
- pending_assignment
- late_assignment
- avg_completion_time
- avg_rating
- period_start
- period_end
- created_at

---

## 4. Relasi Utama

- `t_job_list.category_id -> data_m_job_category.category_id`
- `t_job_list.platform_id -> data_m_job_platform.platform_id`
- `t_job_list.template_id -> data_m_job_template.template_id`
- `t_job_list.created_by -> user.user_id`
- `t_job_list.pic_id -> user.user_id`
- `data_t_job_pickup.job_id -> t_job_list.job_id`
- `t_ticket.related_job_id -> t_job_list.job_id`
- `t_ticket_assignment.ticket_id -> t_ticket.ticket_id`
- `t_ticket_work_data.assignment_id -> t_ticket_assignment.id`
- `t_ticket_file.ticket_id -> t_ticket.ticket_id`
- `data_job_campaign` berelasi ke `data_job_batch`
- `data_job_batch` berelasi ke `data_job_location`
- `data_job_location` berelasi ke `data_job_talent_assignment`
- `data_job_talent_assignment` berelasi ke `data_job_content_log`
- `data_t_job_form_response` dipetakan ke `user_profile`

---

## 5. Mapping Status

### 5.1 Job Status
- draft
- pending_publish
- published
- pickup_open
- in_progress
- review
- completed
- closed
- cancelled

### 5.2 Ticket Status
- open
- active
- waiting_assignment
- in_progress
- resolved
- closed

### 5.3 Assignment Status
- active
- paused
- completed
- cancelled

### 5.4 Pickup Status
- available
- reserved
- confirmed
- released
- cancelled

---

## 6. Pseudo Account Pattern

Pseudo account dapat disimpan sebagai user biasa dengan role `pseudo_system`.

Gunakan untuk:
- created_by ticket internal.
- owner sistem.
- routing notifikasi.
- identitas marketplace internal.

Aturan:
- pseudo account tidak dipakai sebagai pekerja real.
- pseudo account tidak tampil sebagai PIC.
- audit log tetap mencatat actor asli.

---

## 7. Minimal Field Yang Harus Ada Di MVP

Kalau ingin mulai cepat, tabel paling penting adalah:
- `t_job_list`
- `t_ticket`
- `t_ticket_assignment`
- `t_ticket_work_data`
- `data_t_job_pickup`
- `data_m_job_category`
- `data_m_job_platform`
- `data_m_job_template`
- `user_profile` untuk data talent
- `data_job_campaign`
- `data_job_batch`
- `data_job_location`
- `data_job_talent_assignment`
- `data_job_content_log`
- `data_t_job_form_response`
- `data_t_job_audit_log`

---

## 8. Catatan Implementasi

- Jangan memaksa schema ticket lama dihapus.
- Tambahkan kolom relasi job secara bertahap.
- Pastikan query reporting tidak menghajar tabel transaksi utama.
- Siapkan index untuk `job_status`, `company_id`, `pic_id`, dan `created_by`.
- Simpan history perubahan status untuk audit dan debugging.
- Pastikan struktur database bisa menampung workbook referensi tanpa kehilangan kolom penting seperti tier, niche, WA, HB, draft link, revisi, status approval, dan lokasi visit.
