# Proposal: Reusing Core Engine for Event CMS

**Context:** The user wants to know if we can reuse the existing HOTS "Core Engine" (Ticket/Workflow/Transaction Engine) for the new Event CMS instead of building a separate backend.

## Executive Summary

**YES**, reusing the Core Engine is possible and recommended for the **Management Layer** (Campaigns, Approvals), but **NO**, you should not use `t_ticket` for every single participant submission (high volume).

**Recommendation:** A **Hybrid Approach**.
1.  **Event Campaign = Ticket**: Use Core Engine to manage the event lifecycle (Draft -> Approved -> Active -> Ended).
2.  **Participant Submission = Custom Table**: Store high-volume submissions in a dedicated table, linked to the Event Ticket ID.
3.  **Admins = HOTS Users**: Reuse `t_user` / `t_entity`.

---

## 1. Can we reuse the existing engine?
**Answer:** Yes. The `Transaction Engine` allows registering new types.

You can register a new transaction type `event_campaign` similar to `ticketing`.
*   **Controller:** `EventController` calls `transactionEngine.begin('event_campaign', ...)`
*   **Workflow:** Use existing workflow engine for "Event Approval" (Marketing Manager must approve the campaign before it goes live).

**Why NOT strictly "Ticket" for everything?**
*   **Volume:** If you have 100,000 participants, creating 100,000 rows in `t_ticket` (and triggering 100,000 workflow checks) is heavy.
*   **Semantics:** A "Submission" is simple data. It rarely needs complex multi-step approval like a corporate ticket.

---

## 2. Detailed Data Mapping

Here is how your proposed data maps to the existing Core Schema:

### A. Users (Admins / Operators)
**Storage:** `t_user` (HOTS User Table)
*   **Why:** You already have authentication, role management (`m_role`), and department logic there.
*   **Implementation:** The Event CMS Admin login simply authenticates against the HOTS system.

### B. The Event Campaign (e.g., "Taiwan 2024")
**Storage:** `t_ticket` (Core Engine)
*   **Service ID:** Create a new Service "Event Campaign".
*   **Ticket ID:** Becomes the `event_id`.
*   **Workflow:** Draft -> Reviewed -> Published -> Closed.
*   **Metadata:** Use `t_ticket_work_data` for config (JSON or Key-Value).
    *   `start_date`
    *   `end_date`
    *   `theme_config` (JSON)
    *   `block_schema` (JSON)
*   **Benefit:** deeply integrated with existing approval flows.

### C. Participant Submissions (The Receipts)
**Storage:** `t_event_submissions` (NEW TABLE)
*   **Link:** `ticket_id` (Foreign Key to the Campaign Ticket).
*   **Why:**
    *   `t_work_data` is Key-Value (EAV). Storing 5 fields x 100,000 users = 500,000 rows of EAV data. **Querying reports will be slow.**
    *   A dedicated flat table is much faster for Reporting (`SELECT count(*) WHERE event_id = ...`).

**Proposed Schema:**
```sql
CREATE TABLE t_event_submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id VARCHAR(50) NOT NULL, -- Links to the Event Campaign (t_ticket)
    user_data JSON, -- Stores {name, phone, receipt}
    status VARCHAR(20), -- pending, approved, rejected
    submitted_at DATETIME,
    ip_address VARCHAR(45),
    INDEX (ticket_id, status)
);
```

### D. Coupons / Codes
**Storage:** `t_entity`? -> **Maybe, but likely `t_event_coupons`**
*   `t_entity` is usually for Master Data (Companies, Vendors).
*   If coupons are unique per event, a dedicated table linked to the `ticket_id` is cleaner.

---

## 3. The "Pseudo Service" Architecture

You suggested a "Pseudo Service" to cover it all. Here is the blueprint:

**1. The Controller (`EventEngineController`)**
Instead of a standalone backend, create this inside the existing Backend:
```javascript
// backend/controllers/EventEngineController.js
const { transactionEngine } = require('../core/transaction');

// 1. Create Event (Uses Core Engine)
exports.createEvent = async (req, res) => {
    // Starts a workflow for a new Event Campaign
    const result = await transactionEngine.begin('event_campaign', req.body);
    return res.json(result);
};

// 2. Public Submission (Bypasses Complex Engine, optimized for speed)
exports.submitEntry = async (req, res) => {
    // 1. Validate Event exists (check t_ticket status)
    // 2. Insert into t_event_submissions
    // 3. (Optional) Trigger simplified notification
};
```

**2. The "Pseudo Ticket"**
Yes, every Event Page is a Ticket.
*   **Ticket ID:** `EVT-2024-001`
*   **Title:** "Taiwan CNY Campaign"
*   **Status:** "Published"

**3. Tracking Data**
*   **Admin View:** `SELECT * FROM t_ticket WHERE service_id = 'EVENT'`
*   **Report View:** `SELECT * FROM t_event_submissions WHERE ticket_id = 'EVT-2024-001'`

---

## 4. Pros & Cons of this Approach

| Feature | Reuse Core Engine (Proposed) | Standalone Silo |
| :--- | :--- | :--- |
| **User Mgmt** | ✅ Ready (Single Sign On) | ❌ Need to build Auth |
| **Approval** | ✅ Ready (Workflow Engine) | ❌ Need to build Logic |
| **Performance** | ⚠️ Risk if using `t_work_data` for everything | ✅ Optimized for specific use |
| **Speed** | ✅ Fast (Boilerplate exists) | 🐢 Slower (Start from scratch) |
| **Report Query** | ⚠️ Complex if purely EAV | ✅ Simple SQL |

## 5. Decision Guide

**Use the Core Engine for:**
*   The "Event" itself (Lifecycle, Approvals, Config).
*   The "Admin Users" (Permissions).

**Do NOT use the Core Engine for:**
*   The "Participants" (Submissions). Use a dedicated table linked by `ticket_id`.

This "Hybrid" approach gives you the best of both worlds: Enterprise-grade management for the admins, and high-performance data collection for the public.
