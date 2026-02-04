# Core Engine Migration Audit

## Ringkasan

| Router | Controller | Status | Jumlah Endpoint |
|---|---|---|---|
| `routers/engine.js` | `engineTicket.js` | ✅ **CORE ENGINE** | 12 endpoints |
| `routers/hots/hotsTicket.js` | `hotsTicket.js` | ❌ **LEGACY** | ~40 endpoints |

---

## ✅ Endpoints Menggunakan Core Engine (`/engine/...`)

| Endpoint | Method | Fungsi |
|---|---|---|
| `/engine/ticket/create/:moduleKey` | POST | Create ticket (generic) |
| `/engine/ticket/status/:ticket_id` | GET | Get ticket status |
| `/engine/ticket/approve` | POST | Approve via workflow |
| `/engine/ticket/reject` | POST | Reject via workflow |
| `/engine/tickets` | GET | List all tickets |
| `/engine/tickets/my-requests` | GET | My requests |
| `/engine/tickets/my-approvals` | GET | My approvals |
| `/engine/tickets/dashboard-summary` | GET | Dashboard summary |
| `/engine/ticket/cancel` | POST | Cancel ticket |
| `/engine/ticket/return` | POST | Request revision |
| `/engine/ticket/resubmit` | POST | Resubmit ticket |
| `/engine/ticket/revisions/:ticket_id` | GET | List revisions |

---

## ❌ Legacy Endpoints Yang BELUM Pakai Core Engine (`/hots_ticket/...`)

### Ticket Creation (Per-Service Switch-Case)
| Endpoint | Method | Service |
|---|---|---|
| `/hots_ticket/create/ticket/:service_id` | POST | Generic (switch-case) |
| `/hots_ticket/setTicket/:service_id` | POST | Generic (switch-case) |
| `/hots_ticket/it_support_ticket` | POST | IT Support |
| `/hots_ticket/pc_request` | POST | PC Request |

### Ticket Lists (Hardcoded Queries)
| Endpoint | Method | Deskripsi |
|---|---|---|
| `/hots_ticket/my_ticket` | GET | My tickets (new) |
| `/hots_ticket/my_tiket` | GET | My tickets (old) |
| `/hots_ticket/all_ticket` | GET | All tickets (new) |
| `/hots_ticket/all_tiket` | GET | All tickets (old) |
| `/hots_ticket/task_list` | GET | Task list (new) |
| `/hots_ticket/task_list_old` | GET | Task list (old) |

### Approval Actions (Manual Logic)
| Endpoint | Method | Deskripsi |
|---|---|---|
| `/hots_ticket/approve/:ticket_id` | POST | Approve (new) |
| `/hots_ticket/approve/:service_id/:ticket_id` | POST | Approve (old) |
| `/hots_ticket/reject/:ticket_id` | POST | Reject |
| `/hots_ticket/close/:ticket_id` | PUT | Close ticket |
| `/hots_ticket/status_change/:ticket_id` | POST | Change status |
| `/hots_ticket/assingto_change/:ticket_id` | POST | Change assignee |

### Other Legacy
| Endpoint | Method | Deskripsi |
|---|---|---|
| `/hots_ticket/detail/:ticket_id` | GET | Ticket detail |
| `/hots_ticket/comment/:ticket_id` | GET/POST | Comments |
| `/hots_ticket/attachment/:ticket_id` | GET | Attachments |
| `/hots_ticket/email/:ticket_id` | GET/POST/DELETE | Email management |

---

## 🎯 Rekomendasi Migrasi

### Prioritas Tinggi (Sering Dipakai)
1. `/hots_ticket/my_ticket` → `/engine/tickets?mine=true`
2. `/hots_ticket/all_ticket` → `/engine/tickets`
3. `/hots_ticket/task_list` → (perlu endpoint engine baru)
4. `/hots_ticket/approve/:ticket_id` → `/engine/ticket/approve`
5. `/hots_ticket/reject/:ticket_id` → `/engine/ticket/reject`

### Prioritas Rendah (Bisa Bertahap)
- Ticket creation per service
- Comments, emails, attachments

---

## Frontend Impact

Frontend perlu diganti dari:
- `POST /hots_ticket/setTicket/:service_id` → `POST /engine/ticket/create/:moduleKey`
- `POST /hots_ticket/approve/:ticket_id` → `POST /engine/ticket/approve`
- `GET /hots_ticket/my_ticket` → `GET /engine/tickets?mine=true`

Atau buat **Adapter Layer** di Backend yang meneruskan request legacy ke Engine.
