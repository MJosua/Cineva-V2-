# Job Marketplace Knowledge Base

Dokumen ini adalah acuan kerja untuk transformasi sistem HOTS menjadi **Job Marketplace KOL Specialist** dengan tetap memakai modul yang sudah ada sebisa mungkin.

Tujuan utama:
- Memakai ulang engine HOTS sebagai fondasi workflow.
- Mengubah makna domain dari ticketing layanan menjadi job marketplace.
- Menyediakan basis pengetahuan untuk pengembangan fitur, database, menu, halaman, dan flow baru.
- Menjadi referensi agar implementasi antar environment tetap konsisten.
- Menjadi target data yang mampu menampung seluruh struktur workbook referensi operasional.

---

## 1. Gambaran Project

Sistem baru adalah marketplace pekerjaan untuk KOL Specialist dan pihak terkait. Model utamanya bukan lagi approval ticket yang berat, tetapi alur kerja yang lebih ringan:

- Admin atau client membuat job.
- User dapat mengambil job jika tersedia.
- Job menghasilkan ticket internal sebagai container workflow.
- Assignment dibuat ke PIC atau pengurus.
- Progress pekerja dilacak melalui assignment dan work tools.
- Reporting menjadi layer lanjutan untuk analitik, performance, dan database talent.

Prinsip desain:
- Ticket adalah wadah workflow internal.
- Job adalah objek bisnis marketplace.
- Assignment adalah unit kerja operasional.
- Pseudo account dipakai untuk routing sistem agar halaman ticket tidak "kotor" oleh approval manual.

---

## 2. Prinsip Transformasi Dari HOTS Ke Job Marketplace

Yang dipertahankan:
- Ticket engine.
- Assignment engine.
- CMS engine.
- Reporting engine.
- Notification/SSE.
- File upload dan timeline data.

Yang berubah:
- Nama domain dari service/ticket support menjadi job marketplace.
- Alur approval dibuat implicit atau auto-approved.
- Penekanan UI berpindah dari tiket ke job listing dan progress assignment.
- PIC menjadi pusat operasional kerja.

Yang ditambahkan:
- Job post management.
- Pickup job flow.
- Client self-service job creation.
- Work tools untuk PIC.
- Talent/KOL database.
- Reporting khusus marketplace.

Yang harus ikut tertampung dari workbook referensi:
- Campaign / project master.
- Batch-based execution.
- Lokasi outlet dan jadwal visit.
- Talent profile lengkap dengan sosial account dan kontak.
- Workflow draft, revisi, approval, dan posting.
- Form response intake untuk talent onboarding.

---

## 3. Struktur Domain Inti

### 3.1 Job
Representasi pekerjaan yang ditampilkan di marketplace.

Contoh atribut:
- job_id
- title
- description
- objective
- category
- platform
- deadline
- budget
- quota
- job_status
- visibility
- created_by
- company_id
- pic_id

Catatan semantik:
- `t_job_list` adalah job master / listing utama.
- semua atribut pekerjaan masuk ke job level, bukan ke user atau talent.
- user dan talent hanya berperan sebagai pelaku atau pemilik akun.

### 3.2 Ticket
Container workflow internal untuk melacak jalannya job.

Ticket dipakai untuk:
- histori perubahan status.
- timeline activity.
- attachment.
- internal approval log bila diperlukan.
- integrasi notifikasi.

### 3.3 Assignment
Unit kerja yang diberikan ke PIC atau pekerja.

Assignment dipakai untuk:
- task breakdown.
- progress worker.
- status kerja.
- upload bukti.
- komentar.
- review dan completion.

### 3.4 Pseudo Account
Akun sistem yang mewakili marketplace secara administratif.

Fungsi:
- semua ticket masuk ke akun pseudo.
- user tidak perlu melihat approval internal.
- assignment tetap mengarah ke PIC nyata.
- memisahkan identitas sistem dan identitas manusia.

### 3.5 Talent / KOL Specialist
Database pihak yang mengerjakan job.

Data yang relevan:
- nama
- skill/category
- platform specialty
- rating
- performance history
- availability
- assigned job history

Catatan dari workbook:
- talent dipetakan lewat IG/TikTok account, follower count, tier, niche, WA, HB, dan WA MG.
- satu talent boleh punya lebih dari satu account platform, tetapi tidak wajib.
- tier disimpan sebagai label dan angka follower sekaligus.
- `HB` artinya HB.
- `WA MG` artinya WA Management.
- `user_profile` memang sudah dipakai sebagai EAV attribute store untuk profil user.
- karena talent bisa login, atribut talent paling aman disimpan di `user_profile` bersama atribut user lain.
- pola ini sudah selaras dengan controller profile yang membaca dan menulis `attribute_name` / `attribute_value`.

### 3.6 Workbook Reference Reality
Workbook referensi menunjukkan data operasional yang harus ditampung tidak berhenti di job master.
Data nyata yang perlu tersedia juga mencakup:
- Nama campaign / project.
- Brand / klien terkait.
- PIC client dan PIC internal.
- No WhatsApp / CP client.
- Nama brand.
- Product brand yang dituju.
- Categories / niche / interest.
- Tier followers talent.
- Platform tujuan.
- Content type.
- Job deskripsi.
- Incentive.
- Timeline duration.
- Capacity team / talent.
- Deadline posting / project.
- Batch.
- Lokasi.
- Visit date.
- Draft link.
- Feedback client.
- Revisi link.
- Status approval.
- Link posting.
- Code boosting bila ada.

---

## 4. Basis Data Konseptual

Bagian ini belum final sebagai schema fisik, tetapi menjadi acuan desain database.

### 4.1 Master Tables

#### `data_m_job_category`
Daftar kategori job.

Field contoh:
- category_id
- category_name
- description
- is_active

#### `data_m_job_platform`
Daftar platform target.

Field contoh:
- platform_id
- platform_name
- is_active

#### `data_m_job_template`
Template job untuk CMS.

Field contoh:
- template_id
- template_name
- template_type
- default_content
- is_active

#### `user_profile`
Database talent atau KOL specialist sebaiknya ditambah sebagai atribut user profile yang sudah ada.

Field contoh tambahan:
- user_id
- attribute_name
- attribute_value
- speciality
- platform
- rating
- availability_status
- is_verified
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

#### `data_m_job_role`
Peran dalam marketplace.

Field contoh:
- role_id
- role_name
- role_type
- description

### 4.2 Transaction Tables

#### `t_job_list`
Tabel utama job marketplace.

Relasi penting:
- terhubung ke creator.
- terhubung ke company.
- terhubung ke PIC.
- terhubung ke ticket internal.

#### `data_t_job_pickup`
Catatan user mengambil job.

Field contoh:
- pickup_id
- job_id
- user_id
- pickup_status
- picked_at
- released_at

#### `data_job_campaign`
Master campaign/project yang menjadi payung satu atau banyak job operasional.

Field contoh:
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

#### `data_job_batch`
Kelompok eksekusi dalam satu campaign/job, dipakai untuk batch 1, batch 2, batch 3, dan seterusnya.

Field contoh:
- batch_id
- campaign_id
- batch_name
- batch_order
- batch_description
- start_date
- end_date
- status
- created_at

#### `data_job_location`
Lokasi outlet atau titik visit yang menjadi target campaign.

Field contoh:
- location_id
- batch_id
- outlet_name
- address
- gmaps_url
- opening_date
- operational_hours
- location_status
- created_at

#### `data_job_talent_assignment`
Mapping talent ke campaign, batch, dan lokasi tertentu.

Field contoh:
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

#### `data_job_content_log`
Log workflow konten per talent / lokasi.

Field contoh:
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

#### `t_ticket`
Tetap dipakai sebagai workflow container.

Catatan:
- ticket bisa diarahkan ke pseudo account.
- ticket tidak harus menampilkan approval manual.

#### `t_ticket_assignment`
Unit kerja untuk PIC dan worker.

Field penting:
- assignment_status
- assigned_type
- assigned_id
- progress_status
- due_date
- completed_at

#### `t_ticket_work_data`
Penyimpanan progress, timeline, form output, dan log kerja.

#### `t_ticket_file`
File attachment final.

#### `t_ticket_file_temp`
File sementara sebelum dipakai menjadi bagian timeline/worklog.

#### `data_t_job_form_response`
Hasil intake dari form pendaftaran talent atau form operasional lain yang menjadi sumber data awal database.

Field contoh:
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

#### `data_t_job_reporting`
Tabel agregasi untuk analytics dan reporting marketplace.

#### `data_t_job_audit_log`
Audit log perubahan penting:
- create
- pickup
- assign
- release
- submit
- approve
- reject
- close

---

## 5. Relasi Data Yang Disarankan

Urutan relasi yang paling aman:

`job -> ticket -> assignment -> work_data -> reporting`

Artinya:
- Job adalah objek bisnis.
- Ticket menyimpan lifecycle internal.
- Assignment menyimpan eksekusi kerja.
- Work data menyimpan progress detail.
- Reporting membaca hasil akhir dan metrik.

Tambahan relasi:
- job bisa punya banyak assignment.
- satu job bisa punya satu PIC utama.
- satu assignment bisa punya banyak worker bila perlu.
- satu ticket bisa dipakai sebagai parent workflow.
- satu campaign bisa punya banyak batch.
- satu batch bisa punya banyak lokasi.
- satu lokasi bisa punya banyak talent assignment.
- satu talent assignment bisa punya banyak log konten.
- form response harus bisa dipetakan ke talent profile.

### 5.1 Catatan Final Kecukupan Data
Hasil akhir dianggap belum selesai kalau belum bisa menampung:
- semua kolom workbook referensi,
- semua status revisi dan approval,
- semua link aset kerja,
- semua data lokasi dan batch,
- semua kontak internal dan client,
- dan semua data intake talent dari form.

Kalau ada data yang belum punya tabel khusus, gunakan pola berikut:
- data master campaign masuk ke tabel `data_job_campaign`.
- data batch masuk ke tabel `data_job_batch`.
- data lokasi masuk ke tabel `data_job_location`.
- data relasi talent ke job masuk ke `data_job_talent_assignment`.
- data workflow konten masuk ke `data_job_content_log`.
- data intake form masuk ke `data_t_job_form_response`.

---

## 6. Flow Baru Sistem

### 6.1 Flow Admin
1. Admin login ke CMS.
2. Admin membuat job baru.
3. Admin memilih template job.
4. Admin menentukan PIC.
5. Sistem membuat ticket internal.
6. Ticket diarahkan ke pseudo account marketplace.
7. Sistem membuat assignment untuk PIC.
8. PIC menerima notifikasi.
9. PIC memecah assignment ke worker bila perlu.
10. Progress dipantau sampai selesai.

### 6.2 Flow User Ambil Job
1. User login ke marketplace.
2. User melihat job yang tersedia.
3. User mengambil job.
4. Sistem membuat pickup record.
5. Sistem membuat ticket atau mengikat user ke ticket yang ada.
6. Assignment PIC tetap berjalan.
7. User dapat melihat status job.

### 6.3 Flow Client Create Job
1. Client login.
2. Client membuat job request.
3. Sistem validasi role dan company scope.
4. Job masuk ke CMS review atau auto-create tergantung mode.
5. PIC ditentukan.
6. Ticket dan assignment dibuat.

### 6.4 Flow PIC Work Tools
1. PIC membuka dashboard assignment.
2. PIC melihat semua worker dan progresnya.
3. PIC membuat sub-assignment bila perlu.
4. PIC memberi update timeline.
5. PIC melakukan review progress.
6. PIC menutup assignment jika selesai.

---

## 7. Menu Baru Yang Disarankan

### 7.1 Menu Public / Marketplace
- Job Marketplace
- Job Detail
- My Jobs
- My Pickups
- Job Status
- Talent Profile

### 7.2 Menu Client
- Create Job
- My Job Requests
- Job Drafts
- Job History
- Billing or Budget Info

### 7.3 Menu PIC
- Assignment Inbox
- Work Board
- Team Progress
- Submit Review
- File Evidence
- Work Timeline

### 7.4 Menu Admin / CMS
- Job CMS
- Template Job
- PIC Management
- Talent Management
- Category Management
- Reporting
- Audit Log

### 7.5 Menu System
- Pseudo Account Settings
- Workflow Rules
- Status Mapping
- Notification Rules
- Access Control

---

## 8. Halaman Baru Yang Disarankan

### 8.1 Marketplace Pages
- Landing job marketplace
- Job list page
- Job detail page
- Pickup confirmation page
- Talent directory page

### 8.2 CMS Pages
- Create job page
- Edit job page
- Template builder page
- PIC assignment page
- Job review page

### 8.3 PIC Pages
- PIC dashboard
- Assignment detail
- Progress matrix
- Worker tracker
- Completion review

### 8.4 Reporting Pages
- Job performance report
- Talent performance report
- PIC performance report
- SLA report
- Revenue or campaign summary

### 8.5 Ticket Pages
- Ticket summary
- Timeline view
- Attachment view
- Internal notes
- System-generated ticket history

---

## 9. Fungsi Baru Yang Perlu Disiapkan

### 9.1 Job Functions
- createJob
- updateJob
- deleteJob
- publishJob
- closeJob
- cloneJobFromTemplate
- pickJob

### 9.2 Assignment Functions
- createAssignment
- splitAssignmentToWorkers
- updateAssignmentProgress
- submitAssignment
- approveAssignment
- rejectAssignment
- reassignPIC

### 9.3 Ticket Functions
- createSystemTicket
- routeTicketToPseudoAccount
- attachJobToTicket
- logTimelineEvent
- closeSystemTicket

### 9.4 CMS Functions
- createJobTemplate
- updateJobTemplate
- setPIC
- setVisibility
- setQuota
- setDeadline

### 9.5 Reporting Functions
- summarizeJobStatus
- summarizePICPerformance
- summarizeTalentPerformance
- calculateSLA
- exportReport

### 9.6 Utility Functions
- normalizeJobStatus
- mapJobToTicketStatus
- mapAssignmentStatus
- generateMarketplaceJobCode
- validateRoleScope

---

## 10. Ide Kreatif Untuk UI / UX

### 10.1 Ticketing
- Buat tampilan ticket seperti control room.
- Gunakan timeline visual vertikal.
- Tampilkan pseudo account sebagai sumber sistem, bukan user biasa.
- Gunakan badge status yang sederhana dan jelas.
- Jadikan attachment, note, dan progress sebagai tab terpisah.

### 10.2 Job Marketplace
- Gunakan card job yang bisa diambil seperti marketplace modern.
- Tampilkan deadline, fee, platform, dan level kesulitan.
- Tambahkan indikator urgency, quota, dan priority.
- Sediakan filter cepat untuk kategori dan status.

### 10.3 CMS Job Page
- Buat page seperti job composer.
- Field penting ditata bertahap:
  - basic info
  - target
  - PIC
  - workflow
  - reward
  - visibility
- Sediakan preview sebelum publish.

### 10.4 PIC Work Tools
- Gunakan dashboard ringkas seperti mission control.
- Tampilkan semua worker dalam grid atau kanban.
- Tambahkan progress heatmap.
- Tampilkan siapa yang overdue, in review, dan completed.

### 10.5 Reporting
- Gunakan grafik ringan dan jelas.
- Tampilkan tren mingguan dan bulanan.
- Tambahkan ranking talent dan PIC.
- Tambahkan export PDF atau XLSX.

---

## 11. Relevansi Modul Existing

Modul yang paling relevan untuk reuse:
- `hotsTicket`
- `engineTicket`
- `engineAssignment`
- `engineWorkData`
- `CMSController`
- `hotsPublicController`
- `hotsReportingController`
- notifikasi dan SSE
- upload file dan attachment

Modul yang kemungkinan perlu adaptasi besar:
- naming convention service/ticket lama
- approval flow lama
- dashboard ticket lama
- status mapping lama

Modul yang bisa tetap dipakai dengan sedikit perubahan:
- auth/login
- file handling
- notification pipeline
- reporting export
- timeline log

---

## 12. Roadmap Pengerjaan

### Phase 1 - Foundation
- Definisikan domain job marketplace.
- Buat pseudo account.
- Mapping ticket ke job.
- Buat CMS job creation.
- Buat halaman job list dan job detail.

### Phase 2 - Assignment Core
- Assignment untuk PIC.
- Work tools PIC.
- Worker progress tracking.
- Timeline dan attachment.
- Status mapping baru.

### Phase 3 - Marketplace Flow
- User pickup job.
- Client create job.
- Approval dibuat ringan atau otomatis.
- Notifikasi marketplace.
- Basic reporting.

### Phase 4 - Talent System
- Tambahkan atribut talent ke `user_profile`.
- Profil talent.
- Rating dan performance history.
- Matching engine sederhana.

### Phase 5 - Advanced Analytics
- SLA.
- Job conversion.
- PIC performance.
- Revenue/campaign insights.
- Export laporan.

---

## 13. Risiko Dan Catatan Penting

- Jangan ubah seluruh ticketing jadi job tanpa layer mapping.
- Pastikan pseudo account tidak mengganggu audit log.
- Hindari approval manual yang tidak diperlukan agar halaman ticket tetap bersih.
- Perlu role access yang jelas untuk admin, PIC, client, dan worker.
- Data reporting harus dirancang sejak awal supaya tidak menumpuk di akhir.
- Jika client bisa create job, perlu validasi company scope dan pembatasan visibility.

---

## 14. Kesimpulan

Transformasi HOTS menjadi Job Marketplace KOL Specialist sangat memungkinkan dan secara struktur sudah didukung oleh fondasi engine yang ada.

Strategi yang paling aman adalah:
- mempertahankan engine lama,
- mengganti makna domain,
- menambah job layer di atas ticket/assignment,
- lalu membangun CMS, marketplace, PIC tools, dan reporting secara bertahap.

Dokumen ini menjadi acuan awal. Jika implementasi dimulai, knowledge ini bisa dipecah lagi menjadi:
- schema fisik database,
- daftar endpoint,
- status machine,
- spesifikasi UI,
- dan sprint plan teknis.

---

## 15. Mapping Workbook Ke Schema

Bagian ini memetakan field workbook referensi ke tabel target yang disarankan.

### 15.1 Campaign / Project
- Nama Campaign / Project -> `data_job_campaign.campaign_name` / `project_name`
- Brand / Klien terkait -> `data_job_campaign.brand_name`
- Penanggung Jawab / PIC Clients -> `data_job_campaign.client_code`
- PIC Cineva -> `data_job_campaign.cineva_pic_code`
- No WhatsApp / CP Clients -> `data_job_campaign.client_phone`
- Nama Brand -> `data_job_campaign.brand_name`
- Product Brand yang dituju -> `data_job_campaign.target_product`

### 15.2 Scope Pekerjaan
- Categories / Niche / Interest -> `data_m_job_category` dan `user_profile.niche`
- Tier followers talent -> `user_profile.tier_ig`, `user_profile.tier_tt`, dan `data_job_talent_assignment.followers_tier`
- Platform yang dituju -> `data_job_talent_assignment.platform_target`
- Content Type -> `data_job_campaign.content_type`
- Job Deskripsi -> `data_job_campaign.job_description`
- Incentive / Timelines duration -> `data_job_campaign.incentive` dan `data_job_campaign.timeline_duration`
- Capacity Team / Talent -> `data_job_campaign.capacity_team`
- Deadline Posting / Project -> `data_job_campaign.deadline_at` dan `data_job_talent_assignment.posting_deadline`

### 15.3 Batch Dan Lokasi
- Batch 1 / 2 / 3 -> `data_job_batch.batch_name` dan `batch_order`
- Nama Outlet -> `data_job_location.outlet_name`
- Alamat -> `data_job_location.address`
- Titik Gmaps -> `data_job_location.gmaps_url`
- Tanggal Pembukaan -> `data_job_location.opening_date`
- Jam Operasional -> `data_job_location.operational_hours`
- Visit date / range visit -> `data_job_talent_assignment.visit_date`

### 15.4 Talent / KOL
- Nama talent -> `user.firstname` / `user_profile.attribute_value`
- Link Akun -> `user_profile.instagram_link` / `tiktok_link`
- Folls IG / TT -> `user_profile.followers_ig` / `followers_tt`
- Tier IG / TT -> `user_profile.tier_ig` / `tier_tt`
- Username IG / TT -> `user_profile.instagram_username` / `tiktok_username`
- Niche -> `user_profile.niche`
- WA KOL -> `user_profile.whatsapp` atau `data_t_job_form_response.wa_kol`
- HB -> `user_profile.hb_name`
- WA MG -> `user_profile.wa_mg`
- NDA / komitmen -> `user_profile.nda_status`
- Availability visit -> `user_profile.availability_visit`

### 15.5 Workflow Konten
- SOW -> `data_job_talent_assignment.sow`
- Visit -> `data_job_talent_assignment.status_visit` dan `visit_date`
- STL / Preview Draft -> `data_job_content_log.preview_link`
- Feedback Client -> `data_job_content_log.feedback_client`
- Status -> `data_job_content_log.content_status`
- Revisi -> `data_job_content_log.revision_link`
- Link Posting -> `data_job_content_log.posting_link`
- Code Boosting -> `data_job_content_log.boosting_code`

### 15.6 Form Intake
- Timestamp -> `data_t_job_form_response.created_at`
- Email Address -> `data_t_job_form_response.email_address`
- Nama -> `data_t_job_form_response.name`
- Domisili -> `data_t_job_form_response.domicile`
- Availability visit -> `data_t_job_form_response.availability_visit`
- Username / Link IG / TT -> `data_t_job_form_response.instagram_username`, `instagram_link`, `tiktok_username`, `tiktok_link`
- Followers / tier -> `data_t_job_form_response.followers_ig`, `tier_ig`, `followers_tt`, `tier_tt`
- Niche -> `data_t_job_form_response.niche`
- NDA -> `data_t_job_form_response.nda_status`
- WA KOL / HB / WA MG -> `data_t_job_form_response.wa_kol`, `hb`, `wa_mg`

---

## 16. Gap Analysis Dan Catatan Yang Masih Janggal

### 16.1 Sudah Ter-cover
- Campaign / project master.
- Brand dan client contact.
- PIC client dan PIC internal.
- Niche / category / interest.
- Tier follower talent.
- Platform target.
- Content type.
- Job description, incentive, deadline, capacity.
- Batch, lokasi, dan jadwal visit.
- Draft, feedback, revisi, approval, posting link.
- Form intake talent.

### 16.2 Masih Perlu Ditegaskan
- Apakah `HB` adalah user internal, agency, atau kode operasional.
- Apakah `WA MG` selalu satu nomor tetap atau per tim.
- Satu talent tidak wajib punya dua account platform.
- `tier` disimpan sebagai label teks dan angka follower.
- `content_type` boleh berkembang dalam jangka panjang dan tidak dikunci ke dua opsi saja.
- Apakah setiap lokasi selalu punya batch terpisah atau satu batch bisa memuat beberapa lokasi.

### 16.3 Yang Sebaiknya Jangan Dicampur
- `job_description` jangan dicampur dengan `SOW`.
- `campaign` jangan dicampur langsung dengan `location`.
- `talent profile` jangan dicampur langsung dengan `form response`.
- `workflow content` jangan dipaksa jadi field tunggal di `t_job_list`.
- `brand_name` dan `client_code` jangan dianggap sama.

### 16.4 Prinsip Data Final
- Semua field workbook harus punya tempat.
- Kalau bukan master, masuk ke relasi detail.
- Kalau berubah per item, simpan di log workflow.
- Kalau datang dari form, simpan sebagai intake raw plus hasil mapping.
- Jangan hilangkan link dokumen/drive/posting karena itu bagian audit operasional.
- Untuk talent yang login, simpan atribut sosial dan performa di `user_profile` sebagai EAV, bukan di tabel talent terpisah.

---

## 17. Flow Frontend Sebagai Acuan

### 17.1 Public / Marketplace
Halaman yang perlu disiapkan:
- Job marketplace list.
- Job detail.
- My pickup jobs.
- Talent profile.
- Search dan filter kategori, platform, tier, niche.

Fokus UI:
- tampilkan campaign name, brand, deadline, platform, dan capacity.
- tampilkan batch/lokasi jika job memang berbasis visit.
- tampilkan status approval dan progress dengan jelas.

### 17.2 Client
Halaman yang perlu disiapkan:
- Create campaign / job.
- Draft campaign.
- Campaign detail.
- Batch editor.
- Location editor.
- Talent assignment editor.
- Content approval board.

Fokus UI:
- input campaign master dulu.
- lanjut batch dan lokasi.
- pilih talent atau import dari form.
- masukkan draft, revisi, feedback, dan posting link.

### 17.3 PIC / Internal Operations
Halaman yang perlu disiapkan:
- Assignment inbox.
- Batch board.
- Location board.
- Talent assignment board.
- Content workflow board.
- Timeline dan evidence viewer.

Fokus UI:
- lihat semua proses per campaign.
- drag status dari visit ke draft, revisi, approved, posted.
- tampilkan siapa PIC, siapa talent, dan lokasi mana yang aktif.

### 17.4 Admin / CMS
Halaman yang perlu disiapkan:
- Campaign master.
- Category management.
- Platform management.
- Template management.
- Talent management.
- Form response management.
- Reporting dan audit log.

Fokus UI:
- CRUD master harus cepat.
- semua relasi harus bisa ditrace dari campaign sampai log konten.

---

## 18. Flow Backend Sebagai Acuan

### 18.1 Inisiasi Campaign
1. Client atau admin membuat campaign master.
2. Sistem menyimpan ke `data_job_campaign`.
3. Sistem menyiapkan `t_job_list` sebagai container workflow.
4. Jika perlu, sistem membuat ticket internal.
5. PIC ditentukan dan assignment dibuat.

### 18.2 Batch Dan Lokasi
1. Campaign dipecah ke batch.
2. Setiap batch menyimpan range kerja dan aturan operasional.
3. Lokasi outlet ditambahkan ke batch.
4. Sistem menyimpan jadwal visit dan operasional lokasi.

### 18.3 Talent Assignment
1. Talent dipilih dari `user_profile` atau form response.
2. Sistem membuat mapping ke campaign, batch, dan lokasi.
3. Platform target, tier, niche, SOW, dan contact internal disimpan.
4. Status visit dan deadline kerja ditetapkan.

### 18.4 Workflow Konten
1. Talent melakukan visit.
2. Draft / preview dikirim.
3. Client memberi feedback.
4. Revisi disimpan.
5. Status berubah ke approved atau revisi lagi.
6. Posting link dan code boosting dicatat.

### 18.5 Intake Form
1. Form masuk dari registrasi atau onboarding talent.
2. Raw response disimpan ke `data_t_job_form_response`.
3. Data penting dipetakan ke `user_profile`.
4. Talent bisa dipakai ulang untuk campaign berikutnya.

### 18.6 Reporting Dan Audit
1. Semua perubahan penting masuk ke audit log.
2. Reporting membaca data campaign, batch, lokasi, assignment, dan content workflow.
3. Data final dipakai untuk analitik, SLA, dan evaluasi PIC atau talent.

---

## 19. Catatan Tentang `t_job_list`

`t_job_list` dipilih karena lebih jelas secara semantik untuk job listing / job master yang terlihat di frontend.

Alasannya:
- `t_job_list` adalah container utama workflow, bukan sekadar data lookup.
- tabel core seperti `t_ticket`, `t_ticket_assignment`, `t_ticket_work_data`, dan `t_job_list` tetap mengikuti pola inti engine yang sudah dipakai.
- tabel tambahan yang sifatnya domain khusus atau supporting data memakai pola `data_`.
- kalau `t_job_list` diganti jadi `data_t_job`, kita berisiko memutus konsistensi dengan core engine dan query existing yang memang sudah menganggapnya tabel transaksi utama.

Prinsip praktis:
- core transaksi utama tetap `t_job_list`.
- detail campaign operasional masuk ke `data_job_campaign`.
- detail batch, lokasi, talent assignment, dan workflow konten masuk ke tabel `data_job_*`.
- data intake form masuk ke `data_t_job_form_response`.

### 19.1 Batas Semantik
- `user` = credential dan identitas login.
- `user_profile` = atribut profil kustom milik user.
- `t_job_list` = atribut dan konteks pekerjaan.
- `data_job_*` = detail operasional pekerjaan.
- `t_ticket*` = workflow engine internal HOTS yang tetap dipakai.

### 19.2 Implikasi Implementasi
- jangan simpan IG, follower, tier, alamat, atau niche talent di `t_job_list`.
- jangan simpan title campaign, brand, location, atau deadline job di `user_profile`.
- gunakan `t_job_list` untuk semua data job master yang perlu muncul di listing dan detail job.

---

## 20. Flow Backend Endpoint Sebagai Acuan

Berikut urutan endpoint yang disarankan sebagai acuan backend:

### 20.1 Campaign
- `POST /campaign`
- `GET /campaign`
- `GET /campaign/:id`
- `PUT /campaign/:id`
- `DELETE /campaign/:id`

### 20.2 Batch
- `POST /campaign/:id/batch`
- `GET /campaign/:id/batch`
- `PUT /batch/:id`
- `DELETE /batch/:id`

### 20.3 Location
- `POST /batch/:id/location`
- `GET /batch/:id/location`
- `PUT /location/:id`
- `DELETE /location/:id`

### 20.4 Talent Assignment
- `POST /campaign/:id/assignment`
- `GET /campaign/:id/assignment`
- `PUT /assignment/:id`
- `DELETE /assignment/:id`

### 20.5 Content Workflow
- `POST /assignment/:id/content-log`
- `GET /assignment/:id/content-log`
- `PUT /content-log/:id`
- `PATCH /content-log/:id/status`

### 20.6 Form Intake
- `POST /form-response`
- `GET /form-response`
- `GET /form-response/:id`
- `POST /form-response/:id/map-to-profile`

### 20.7 Master Support
- `GET /categories`
- `POST /categories`
- `GET /platforms`
- `POST /platforms`
- `GET /templates`
- `POST /templates`
- `GET /talents`
- `POST /talents`

### 20.8 Reporting
- `GET /reporting/campaign`
- `GET /reporting/batch`
- `GET /reporting/location`
- `GET /reporting/talent`
- `GET /reporting/content-workflow`

Prinsip backend:
- endpoint master terpisah dari endpoint workflow.
- endpoint workflow harus menyimpan relasi parent-child yang jelas.
- response API harus menyertakan `id`, `code`, `status`, `created_at`, dan relasi yang relevan.

---

## 21. Final Flow Decision

Keputusan final untuk implementasi:

- Campaign dan job dibuat lewat CMS, bukan lewat service konvensional.
- Ticket internal untuk semua proses non-talent dipusatkan ke pseudo user `job_bot`.
- Talent hanya melihat tiket `Talent Request Join Job`.
- Semua tiket operasional lain tidak boleh masuk ke inbox talent atau mengotori `My Ticket` talent.
- `job_bot` menjadi owner teknis untuk pembuatan campaign, assignment internal, batch, location, dan workflow maintenance.
- HOTS ticket engine tetap dipakai sebagai workflow backbone di belakang layar.

### 21.1 Job Bot Pattern
Pseudo user `job_bot` digunakan untuk:
- menerima ticket pembuatan campaign.
- menerima ticket internal assignment.
- menerima ticket workflow yang tidak relevan untuk talent.
- menjaga agar ticket list talent tetap bersih.
- memisahkan workflow sistem dari workflow talent.

### 21.2 Talent Ticket Visibility
Yang tampil ke talent hanya:
- `Talent Request Join Job`

Yang tidak tampil ke talent:
- create/update campaign
- batch management
- location management
- assignment internal
- content workflow internal
- audit and maintenance ticket

### 21.3 Admin / Internal Visibility
Admin, PIC, dan internal operator dapat melihat:
- campaign master
- batch
- location
- talent assignment
- content workflow
- audit log
- ticket join request dari talent

### 21.4 Visibility Matrix
- `user` login credential: semua role.
- `user_profile` profile EAV: semua role yang membutuhkan profil.
- `t_job_list`: admin, PIC, internal operator, dan talent hanya jika job terbuka untuk dilihat.
- `data_job_*`: admin, PIC, internal operator.
- `t_ticket` internal operational tickets: admin, PIC, internal operator, dan `job_bot`.
- `Talent Request Join Job`: talent, admin, PIC, internal operator.

### 21.5 Implementation Rule
- jangan tampilkan internal tickets ke talent.
- gunakan `job_bot` sebagai pseudo owner internal.
- gunakan CMS sebagai pintu input utama untuk campaign/job.
- gunakan `job_bot` untuk menjembatani HOTS ticket engine dengan job marketplace workflow.

### 21.6 Pseudo Service Strategy
- cukup satu pseudo user `job_bot`.
- tidak perlu banyak pseudo user untuk membedakan konteks workflow.
- pemisahan konteks dilakukan lewat pseudo service / service key.
- semua ticket tetap terikat ke `ticket_id`, sehingga `t_ticket_work_data` dan `t_ticket_assignment` tetap konsisten.

Pseudo service yang disarankan:
- `job_page` = pembuatan halaman / CMS block / campaign builder.
- `job_pic` = assignment dan inspeksi PIC.
- `job_talent` = assignment dan execution talent.

### 21.7 Service ID Configuration Final
Konfigurasi `service_id` baru untuk job marketplace dibakukan sebagai berikut:
- `30` = `JOB_PAGE` / `job_page`
- `31` = `JOB_PIC` / `job_pic`
- `32` = `JOB_TALENT` / `job_talent`

Catatan:
- ini adalah pseudo service, bukan service bisnis umum.
- ticket internal yang dibuat `job_bot` harus memakai salah satu service_id ini sesuai konteks.
- `service_id` menentukan widget registry, visibility, dan halaman yang ditampilkan.
- backend wajib menganggap tiga ID ini sebagai namespace workflow job marketplace.

### 21.8 Why Backend First
- service_id adalah kontrak routing ticket.
- widget assignment bergantung pada service_id.
- frontend baru bisa final setelah service_id dan visibility rule stabil.
- karena itu eksekusi dimulai dari backend, lalu frontend mengikuti mapping yang sudah dibakukan.

Aturan:
- `job_bot` membuat dan mengelola ticket internal.
- ticket diberi service key sesuai konteks.
- service key menentukan widget, halaman, dan visibility.
- talent hanya melihat ticket yang memang relevan dengan `job_talent` atau join request yang memang ditampilkan.
- PIC menggunakan `job_pic` untuk inspeksi dan monitoring.
- authoring halaman campaign/job menggunakan `job_page`.

---

## 22. Widget Context Model

Widget di HOTS terbagi menjadi tiga konteks utama:

### 22.1 Widget Pada Ticket Detail
- dipakai ketika ticket sudah terbentuk.
- menampilkan request information, approval, timeline, komentar, attachment, dan data ticket.
- konteks ini adalah `ticket_detail`.

### 22.2 Widget Pada Service Form
- dipakai saat user mengisi service form atau CMS form.
- menampilkan field, helper, preview, dynamic block, dan input tambahan.
- konteks ini adalah `form`.

### 22.3 Widget Pada Assignment
- dipakai saat assignment sudah terbentuk.
- assignment hanya bertindak sebagai loader/container data kerja.
- widget yang menentukan tampilan berdasarkan service/context/role.
- konteks ini adalah `assignment_detail`.

### 22.4 Prinsip Final
- widget membaca konteks service.
- assignment hanya load seluruh informasi dan meneruskan konteks.
- service key menentukan komposisi widget, bukan assignment secara langsung.
- job marketplace harus memanfaatkan pola ini agar modular HOTS tetap utuh.

### 22.5 Implikasi Job Marketplace
- `job_page` lebih banyak mengisi widget form.
- `job_pic` dominan di ticket detail dan assignment detail PIC.
- `job_talent` dominan di ticket detail dan assignment detail talent.
- job_bot hanya mengelola routing ticket dan tidak mengubah logika widget.

### 22.6 Widget Registry Final Mapping
Widget registry job marketplace harus mengikuti pola context berikut:

#### Form Context
- `job_join_request`
- `job_page_builder`
- `cms_block_preview`
- `dynamic_helper_widget`

#### Ticket Detail Context
- `job_campaign_summary`
- `job_join_request`
- `request_information`
- `timeline`
- `discussion`
- `attachment`
- `approval`

#### Assignment Context - Talent
- `job_talent_timeline`
- `task_list`
- `status`
- `attachment`
- `discussion`
- `progress`

#### Assignment Context - PIC
- `job_pic_kanban`
- `job_gantt_planner`
- `job_campaign_summary`
- `performance`
- `inspection`
- `audit`
- `discussion`

### 22.7 Registry Rules
- widget harus selalu menyaring diri berdasarkan `service_id`.
- assignment tidak boleh menentukan widget secara hardcoded, hanya meneruskan context data.
- service form, ticket detail, dan assignment detail harus bisa memakai widget berbeda dengan sumber data yang konsisten.
- widget boleh dipakai lintas context jika memang relevan.
- job marketplace harus menambah widget baru hanya jika konteksnya benar-benar dibutuhkan.

---

## 23. Final Frontend Structure

Frontend harus mengikuti visibility matrix dan membagi halaman ke tiga lapisan: public/talent, internal, dan admin.

### 23.1 Talent Facing
Halaman yang tampil untuk talent:
- `Job Marketplace`
- `Job Detail`
- `Talent Request Join Job`
- `My Assignments` bila talent sudah diterima

Tujuan:
- talent hanya melihat pekerjaan yang relevan.
- ticket internal tidak muncul di inbox talent.
- aksi utama talent adalah join request, lihat detail job, dan melihat assignment yang memang miliknya.

### 23.2 Internal / PIC Facing
Halaman yang tampil untuk internal:
- `Campaigns`
- `Batches`
- `Locations`
- `Talent Flow`
- `Content Flow`
- `My Assignments`
- `Ticket Detail` untuk internal workflow

Tujuan:
- memantau campaign dari CMS sampai content posting.
- mengelola batch, lokasi, talent assignment, dan workflow konten.
- melihat audit dan status internal tanpa mengganggu talent.

### 23.3 Admin Facing
Halaman admin tetap memakai modul HOTS existing yang relevan:
- CMS editor
- service catalog jika masih dipakai sebagai wrapper engine
- user management
- reporting
- workflow admin
- audit log

Tujuan:
- admin mengontrol struktur dan master data.
- admin tidak perlu melihat semua ticket internal secara mentah di talent context.

### 23.4 Route Map Final
- `/job-marketplace` = marketplace landing
- `/job-marketplace/detail/:job_id` = detail job/campaign
- `/job-marketplace/campaigns` = campaign master
- `/job-marketplace/batches` = batch board
- `/job-marketplace/locations` = location board
- `/job-marketplace/talent-assignments` = talent flow board
- `/job-marketplace/content-workflow` = content workflow board

### 23.5 Menu Map Final
Sidebar menu yang dipakai:
- Job Marketplace
- Campaigns
- Batches
- Locations
- Talent Flow
- Content Flow
- My Assignments

Prinsip menu:
- menu talent harus minim dan fokus.
- menu internal boleh lebih kaya.
- menu admin tetap tersentralisasi pada CMS dan master data.

---

### 23.6 Final Flow Job Page
1. Admin/PIC membuka `job_page`.
2. Job bot membuat page / block / request join form melalui CMS.
3. Widget form membaca `service_id 30` dan menampilkan komponen authoring yang relevan.
4. Saat campaign dipublish, job list muncul di marketplace.
5. Talent melihat job dan join lewat `Request Join Job`.
6. Join request dibuat sebagai ticket yang tetap terikat ke `job_bot`.

### 23.7 Final Flow PIC
1. PIC membuka `job_pic`.
2. Widget assignment membaca `service_id 31`.
3. PIC melihat campaign summary, kanban, gantt, inspection, dan performance.
4. PIC mengelola semua talent yang join ke satu campaign.
5. PIC dapat melakukan monitoring dan evaluasi tanpa mengganggu talent inbox.

### 23.8 Final Flow Talent
1. Talent membuka `job_talent`.
2. Widget assignment membaca `service_id 32`.
3. Talent melihat timeline umum, task list, status, attachment, dan submission area.
4. Talent hanya melihat ticket yang relevan dengan job yang diikuti atau assignment miliknya.
5. Talent tidak melihat workflow internal PIC atau routing sistem.

### 23.9 Visibility by Context
- `job_page`:
  - authoring CMS
  - page/block building
  - join request setup
- `job_pic`:
  - PIC inspection
  - performance monitoring
  - kanban and gantt
- `job_talent`:
  - execution
  - join request
  - task handling
  - timeline and submission

## 24. Final Backend Endpoint Matrix

Endpoint backend harus dipisah berdasarkan domain agar frontend mudah memanggilnya.

### 23.1 Job Marketplace Core
- `GET /hots_jobmarketplace/jobs`
- `GET /hots_jobmarketplace/detail/:job_id`
- `GET /hots_jobmarketplace/profile-summary`

### 23.2 Campaign
- `GET /hots_jobmarketplace/campaigns`
- `POST /hots_jobmarketplace/campaigns`
- `PUT /hots_jobmarketplace/campaigns/:id`
- `DELETE /hots_jobmarketplace/campaigns/:id`

### 23.3 Batch
- `GET /hots_jobmarketplace/batches`
- `POST /hots_jobmarketplace/batches`
- `PUT /hots_jobmarketplace/batches/:id`
- `DELETE /hots_jobmarketplace/batches/:id`

### 23.4 Location
- `GET /hots_jobmarketplace/locations`
- `POST /hots_jobmarketplace/locations`
- `PUT /hots_jobmarketplace/locations/:id`
- `DELETE /hots_jobmarketplace/locations/:id`

### 23.5 Talent Assignment
- `GET /hots_jobmarketplace/assignments`
- `POST /hots_jobmarketplace/assignments`
- `PUT /hots_jobmarketplace/assignments/:id`
- `DELETE /hots_jobmarketplace/assignments/:id`

### 23.6 Content Workflow
- `GET /hots_jobmarketplace/content-logs`
- `POST /hots_jobmarketplace/content-logs`
- `PUT /hots_jobmarketplace/content-logs/:id`
- `DELETE /hots_jobmarketplace/content-logs/:id`

### 23.7 Form Intake
- `POST /hots_jobmarketplace/form-response`
- `GET /hots_jobmarketplace/form-response`
- `GET /hots_jobmarketplace/form-response/:id`
- `POST /hots_jobmarketplace/form-response/:id/map-to-profile`

### 23.8 Rules
- endpoint core job marketplace harus jelas membedakan listing, detail, dan workflow.
- endpoint internal hanya dipakai oleh admin/PIC/operator.
- endpoint talent hanya boleh membaca job terbuka dan mengirim join request.
- semua tiket sistem tetap dibungkus oleh `job_bot` dan tidak exposed mentah ke talent.

---

## 24. Assignment Planning, Timeline, Kanban, Dan Gantt

Sistem assignment harus mendukung perencanaan kerja yang lebih visual dan mudah dibaca oleh talent maupun PIC.

### 24.1 Tujuan
- membuat schedule job pertama sebelum eksekusi detail dimulai.
- membuat timeline umum pertama sebagai ringkasan informasi campaign/job.
- memudahkan talent melihat urutan kerja tanpa harus membuka detail teknis terlalu dalam.
- memudahkan PIC melihat performa, progress, dan bottleneck semua talent dalam satu board.

### 24.2 Tampilan Yang Wajib Didukung
- assignment list page compact.
- assignment list page mode list.
- kanban board untuk status kerja.
- Gantt chart untuk timeline dan dependensi waktu.

### 24.3 Pemakaian Untuk Talent
- talent melihat jadwal umum job.
- talent melihat urutan kerja yang harus diikuti.
- talent melihat deadline, status, dan assignment yang menjadi miliknya.
- talent tidak perlu melihat seluruh workflow internal yang tidak relevan.

### 24.4 Pemakaian Untuk PIC
- PIC melihat semua talent yang join ke campaign.
- PIC melihat schedule, timeline, dan dependensi kerja.
- PIC memantau kanban status semua talent.
- PIC menggunakan Gantt chart untuk inspeksi keterlambatan, overlap, dan progress.

### 24.5 Data Yang Harus Disiapkan
- schedule start.
- schedule end.
- timeline label.
- task order.
- assignee.
- due date.
- status board.
- kanban lane.
- progress percent.
- dependency relation.

### 24.6 Implementasi UI
- assignment list page harus punya toggle compact/list.
- assignment detail page harus bisa menampilkan timeline umum terlebih dahulu.
- kanban board dipakai untuk status visual cepat.
- Gantt chart dipakai untuk planning dan audit time-based.

### 24.7 Implementasi Backend
- assignment data harus menyimpan field untuk scheduling.
- setiap assignment harus bisa punya start, end, due date, dan status.
- relasi assignment ke campaign, batch, dan location harus tetap terbaca.
- data timeline harus bisa dipakai untuk board dan chart tanpa perlu transformasi berat di frontend.

### 24.8 Prinsip Final
- schedule job dibuat sebelum assignment detail selesai.
- timeline umum pertama ditampilkan di assignment list agar cepat dipahami.
- kanban dan Gantt chart bukan fitur tambahan, tapi bagian inti sistem assignment.
- talent dan PIC melihat data yang sama, tetapi dalam level detail yang berbeda.

---

## 25. Assignment Data Contract

Untuk mendukung schedule, kanban, dan Gantt, assignment harus punya kontrak data yang konsisten.

### 25.1 Field Minimum
- `assignment_id`
- `ticket_id`
- `job_id`
- `campaign_id`
- `batch_id`
- `location_id`
- `assigned_to`
- `assigned_type`
- `assignment_status`
- `status_lane`
- `start_date`
- `end_date`
- `due_date`
- `timeline_label`
- `task_order`
- `progress_percent`
- `priority`
- `notes`
- `created_at`
- `updated_at`

### 25.2 Field Pendukung Kanban
- `kanban_lane`
- `kanban_order`
- `kanban_color`
- `kanban_group`
- `is_blocked`
- `blocked_reason`

### 25.3 Field Pendukung Gantt
- `gantt_start`
- `gantt_end`
- `gantt_dependency`
- `gantt_milestone`
- `gantt_weight`

### 25.4 Field Timeline Umum
- `timeline_title`
- `timeline_description`
- `timeline_type`
- `timeline_visibility`
- `timeline_status`

### 25.5 Prinsip Data
- list page harus dapat menampilkan data dari field minimum tanpa request berlapis.
- kanban board memakai `status_lane` dan `kanban_lane`.
- Gantt memakai `start_date`, `end_date`, dan dependency.
- timeline umum dipakai untuk ringkasan informasi pertama sebelum user masuk ke detail.

---

## 26. Final Assignment Page Design

Halaman assignment harus dibedakan untuk talent dan PIC, tetapi tetap memakai data contract yang sama.

### 26.1 Assignment List - Talent
Tujuan:
- memberi tampilan cepat dan ringkas.
- menampilkan job yang aktif, deadline, dan status.
- hanya menampilkan assignment milik talent tersebut.

Elemen wajib:
- kartu compact
- job title
- campaign name
- deadline
- status
- progress bar
- tombol detail
- filter status
- toggle compact / list

### 26.2 Assignment List - PIC
Tujuan:
- melihat seluruh talent yang join dalam satu campaign.
- memantau performa, bottleneck, dan progres.
- membandingkan banyak talent sekaligus.

Elemen wajib:
- board summary
- total talent
- progress rata-rata
- overdue count
- kanban lanes
- timeline ringkas
- filter campaign / batch / location
- toggle compact / list

### 26.3 Assignment Detail - Talent
Urutan tampilan:
1. ringkasan job
2. timeline umum
3. tugas yang harus dilakukan
4. status dan deadline
5. aksi submit / update

Karakter UI:
- sederhana
- fokus ke apa yang harus dikerjakan
- tidak menampilkan inspeksi semua talent

### 26.4 Assignment Detail - PIC
Urutan tampilan:
1. ringkasan campaign
2. timeline umum
3. kanban semua talent
4. Gantt chart
5. performa per talent
6. audit dan note

Karakter UI:
- lebih informatif
- cocok untuk inspeksi
- mendukung pengawasan banyak talent dalam satu view

### 26.5 Panel Yang Perlu Dipisah
- summary panel
- timeline panel
- kanban panel
- gantt panel
- detail panel
- discussion / note panel

### 26.6 Prinsip UX
- talent tidak boleh kewalahan oleh detail internal.
- PIC harus bisa melihat semua talent dalam bentuk list dan board.
- assignment list page harus nyaman dalam mode compact maupun list.
- timeline umum selalu muncul sebelum detail teknis.
- Gantt chart dan kanban board adalah alat utama, bukan fitur tambahan.

---

## 27. Modular HOTS Reuse Strategy

Sistem job/talent marketplace harus memanfaatkan seluruh modular system HOTS yang sudah ada, bukan mengganti semuanya dengan halaman statis baru.

### 27.1 Assignment As Modular Container
- assignment harus tetap menjadi container utama untuk workflow operasional.
- di dalam assignment, `work data` modular dapat menampung widget yang berbeda tergantung service atau konteks job.
- widget dapat diaktifkan, dinonaktifkan, atau diubah sesuai kebutuhan campaign/job yang sedang berjalan.

### 27.2 Work Data Widget Pattern
- assignment page harus bisa membaca widget work data berdasarkan service.
- setiap widget bisa punya form, task, timeline, attachment, atau status sendiri.
- satu assignment dapat menampung beberapa widget tanpa harus membuat page baru.
- perubahan service akan mengubah komposisi widget, bukan menghancurkan struktur assignment.

### 27.3 Reuse Rules
- gunakan engine assignment yang sudah ada.
- gunakan widget work data yang sudah modular.
- gunakan ticket workflow yang sudah ada untuk approval, audit, dan notification.
- gunakan CMS block untuk membentuk campaign/job page dan join request page.
- gunakan `user_profile` untuk atribut talent yang fleksibel.
- gunakan `job_bot` untuk internal ticket routing.

### 27.4 Benefit Reuse
- tidak perlu membuat ulang seluruh workflow engine.
- job marketplace bisa mengikuti kekuatan HOTS yang sudah modular.
- page talent dan PIC bisa memakai komponen yang sama tetapi konfigurasi widget yang berbeda.
- maintenance lebih ringan karena perubahan service cukup mengubah konfigurasi widget/work data.

### 27.5 Implementation Principle
- jangan kunci assignment menjadi satu layout tetap.
- jangan hardcode form job atau talent jika bisa dipetakan ke widget modular.
- setiap service/job type boleh punya komposisi widget yang berbeda.
- semua komposisi tetap berada dalam kerangka HOTS modular system.

---

## 28. Assignment Widget Map

Assignment page harus memilih widget berdasarkan peran user dan tipe service/job, bukan memakai satu layout tetap.

### 28.1 Widget Inti Untuk Talent
- `SummaryWidget`
- `TimelineWidget`
- `TaskListWidget`
- `DeadlineWidget`
- `StatusWidget`
- `AttachmentWidget`
- `DiscussionWidget`
- `ProgressWidget`

### 28.2 Widget Inti Untuk PIC
- `SummaryWidget`
- `TimelineWidget`
- `KanbanWidget`
- `GanttWidget`
- `TaskListWidget`
- `PerformanceWidget`
- `InspectionWidget`
- `AttachmentWidget`
- `DiscussionWidget`
- `AuditWidget`

### 28.3 Widget Tambahan Berdasarkan Service
- `ContentDraftWidget`
- `PostingLinkWidget`
- `LocationVisitWidget`
- `BatchPlanWidget`
- `TalentRosterWidget`
- `JoinRequestWidget`
- `ApprovalWidget`
- `RevisionWidget`

### 28.4 Widget Selection Rules
- kalau user adalah talent, prioritaskan widget tugas, timeline, status, dan submission.
- kalau user adalah PIC, prioritaskan widget inspeksi, kanban, Gantt, dan performance.
- kalau service memiliki content workflow, tambahkan widget draft/revision/posting.
- kalau service memiliki batch/location, tambahkan widget batch plan dan location visit.
- kalau ada join request, tambahkan widget approval.

### 28.5 Widget Registry Principle
- widget harus terdaftar di registry HOTS.
- registry menentukan widget mana yang tampil pada context assignment tertentu.
- service configuration menentukan widget apa saja yang aktif.
- frontend tidak boleh hardcode layout khusus untuk setiap service.

---

## 29. Service To Widget Configuration

Pemetaan service ke widget harus bisa diatur secara konfiguratif.

### 29.1 Default Mapping
- `assignment_detail` -> `SummaryWidget`, `TimelineWidget`, `TaskListWidget`, `DiscussionWidget`
- `assignment_talent` -> `SummaryWidget`, `TimelineWidget`, `TaskListWidget`, `StatusWidget`, `AttachmentWidget`
- `assignment_pic` -> `SummaryWidget`, `TimelineWidget`, `KanbanWidget`, `GanttWidget`, `PerformanceWidget`, `AuditWidget`

### 29.2 Job Marketplace Mapping
- `job_marketplace_join_request` -> `JoinRequestWidget`, `SummaryWidget`, `TimelineWidget`
- `job_marketplace_talent_assignment` -> `SummaryWidget`, `TimelineWidget`, `TaskListWidget`, `StatusWidget`, `AttachmentWidget`
- `job_marketplace_pic_inspection` -> `SummaryWidget`, `TimelineWidget`, `KanbanWidget`, `GanttWidget`, `PerformanceWidget`, `DiscussionWidget`
- `job_marketplace_content_workflow` -> `ContentDraftWidget`, `RevisionWidget`, `PostingLinkWidget`, `AttachmentWidget`, `DiscussionWidget`
- `job_marketplace_location_visit` -> `LocationVisitWidget`, `TimelineWidget`, `AttachmentWidget`
- `job_marketplace_batch_plan` -> `BatchPlanWidget`, `TimelineWidget`, `GanttWidget`

### 29.3 Configuration Fields
- `context_key`
- `service_key`
- `role_key`
- `widget_name`
- `widget_order`
- `is_active`
- `display_mode`
- `visibility_scope`

### 29.4 Data Source Rules
- widget data harus berasal dari assignment/work data/ticket engine atau CMS block.
- widget tidak boleh bergantung pada hardcoded page state yang tidak bisa direuse.
- widget harus bisa dipakai baik untuk compact list maupun detail view.

### 29.5 Final Principle
- halaman assignment adalah komposisi widget, bukan satu halaman statis.
- talent dan PIC memakai registry yang sama, tetapi role key yang berbeda.
- service/job type dapat mengubah komposisi widget tanpa mengubah engine inti.

### 29.6 Job Marketplace Widget-Service Mapping
- `service_id 30` / `job_page` memakai widget join request, campaign summary, dan planner.
- `service_id 31` / `job_pic` memakai widget campaign summary, kanban, gantt, inspection, dan performance.
- `service_id 32` / `job_talent` memakai widget join request, timeline, task list, status, dan submission.

### 29.7 Execution Priority
- backend tetap prioritas utama karena widget selection dan visibility dibaca dari service_id.
- frontend mengikuti backend service mapping supaya page, menu, dan registry konsisten.
