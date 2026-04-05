# Job Marketplace Roadmap

Dokumen ini adalah roadmap pengerjaan bertahap untuk transformasi HOTS menjadi Job Marketplace KOL Specialist.

---

## Phase 0 - Alignment

Tujuan:
- menyepakati domain baru,
- menyamakan istilah,
- memastikan module existing yang dipakai ulang,
- menetapkan pseudo account pattern.

Output:
- knowledge base final,
- naming convention,
- daftar role,
- daftar menu,
- daftar status.

---

## Phase 1 - Foundation

Target:
- job entity dasar,
- ticket internal mapping,
- CMS job create,
- job list dan job detail,
- pseudo account flow.

Fungsi yang dibuat:
- createJob
- publishJob
- createSystemTicket
- routeTicketToPseudoAccount
- attachJobToTicket

UI yang dibuat:
- job list
- job detail
- create job CMS
- job summary ticket

---

## Phase 2 - Assignment Core

Target:
- assignment ke PIC,
- progress worker,
- work tools PIC,
- attachment dan timeline.

Fungsi:
- createAssignment
- splitAssignmentToWorkers
- updateAssignmentProgress
- submitAssignment
- approveAssignment
- rejectAssignment

UI:
- PIC dashboard
- assignment detail
- progress matrix
- worker tracker
- timeline feed

---

## Phase 3 - Marketplace Flow

Target:
- user pickup job,
- client create job,
- auto or semi-auto approval,
- public marketplace.

Fungsi:
- pickJob
- releaseJob
- validateRoleScope
- normalizeJobStatus
- mapJobToTicketStatus

UI:
- marketplace landing
- pickup confirmation
- my pickups
- my jobs
- client job request page

---

## Phase 4 - CMS Expansion

Target:
- template job,
- PIC management,
- category and platform management,
- workflow rules,
- status mapping rules.

Fungsi:
- createJobTemplate
- updateJobTemplate
- setPIC
- setVisibility
- setQuota
- setDeadline

UI:
- template builder
- PIC management
- category management
- workflow rules page
- status mapping page

---

## Phase 5 - Reporting

Target:
- marketplace reporting,
- PIC performance,
- talent performance,
- SLA monitoring,
- export data.

Fungsi:
- summarizeJobStatus
- summarizePICPerformance
- summarizeTalentPerformance
- calculateSLA
- exportReport

UI:
- reporting dashboard
- job analytics
- PIC analytics
- talent analytics
- export center

---

## Phase 6 - Talent System

Target:
- database talent,
- profile talent,
- rating,
- history performa,
- matching sederhana.

Fungsi:
- registerTalentProfile
- updateTalentProfile
- scoreTalent
- recommendTalentForJob

UI:
- talent directory
- talent profile
- talent ranking
- talent availability

---

## Phase 7 - Client Self-Service

Target:
- client login,
- client create job,
- client lihat progress,
- client lihat history.

Fungsi:
- createClientJob
- listClientJobs
- getClientJobStatus
- submitClientRevision

UI:
- client dashboard
- client create job
- client job history
- client review page

---

## 8. Urutan Implementasi Yang Disarankan

Kalau ingin cepat masuk produksi, urutan paling aman:
1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 5
6. Phase 4
7. Phase 6
8. Phase 7

Alasan:
- foundation dan assignment harus stabil dulu,
- marketplace flow baru masuk setelah data model aman,
- reporting lebih penting daripada fitur lanjutan talent matching,
- client self-service menyusul setelah permission matang.

