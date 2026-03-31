# Decision Guide: Event CMS Schema Strategy

## 1. Where to store the "Campaign"? (`EVENT_t_campaign` vs `cms_m_page`)

You asked if we should use the existing `cms_m_page` instead of creating `EVENT_t_campaign`.

### Analysis of `cms_m_page`
If `cms_m_page` was designed for static content (Privacy Policy, About Us, dynamic landing pages), it likely has columns like:
*   `page_id`
*   `slug`
*   `content_json` (or blocks)
*   `title`

### The "Event Campaign" Difference
An Event is **MORE** than just a Page. It has:
*   **Lifecycle:** Start Date, End Date, Status (Draft/Active/Paused).
*   **Logic:** "One submission per person", "Winning Probability", "Prize Pool ID".
*   **Workflow:** Needs approval before going live.

### Decision: **Create `EVENT_t_campaign` but LINK it to `cms_m_page`** (or embedding).

**Option A: Separation of Concerns (Recommended)**
*   `EVENT_t_campaign`: Stores the **Business Logic** (Dates, Rules, Ticket ID, Status).
*   `cms_m_page`: Stores the **Visual Content** (Blocks, Images, Text).
*   **Link:** `EVENT_t_campaign.page_id` -> `cms_m_page.page_id`.

**Verdict:** **Go with `EVENT_t_campaign` + `cms_m_page`.**

---

## 2. Dynamic Pool Table (`t_entity` vs `EVENT_m_pool`)

You asked: *"Will it be better to be `t_entity`... or since `t_entity` will be EAV, it will destroy the report?"*

**Answer:** **YES, `t_entity` (EAV) will destroy performance and reporting.** Do not use it for Coupon Codes.

### Why EAV (`t_entity`) implies "Danger" for this use case:

1.  **Unique Validation (The Critical Flaw):**
    *   *Scenario:* User enters code "ABC-123". You must check if it's valid and unused.
    *   *Flat Table:* `SELECT * FROM EVENT_m_pool_item WHERE value = 'ABC-123'`. (0.01ms with Index).
    *   *EAV:* `SELECT * FROM t_entity_characteristic WHERE value = 'ABC-123' AND attribute_id = (SELECT id FROM m_attribute WHERE name='code')`.
    *   *Problem:* EAV tables grow roughly 10x faster (1 entity = 10 attributes = 10 rows). Indexing "Value" columns (usually TEXT/VARCHAR 255) is slower than specific columns. **Enforcing uniqueness** across 10 million rows in EAV is technically difficult.

2.  **Reporting Pain:**
    *   *Scenario:* "Export all 50,000 Unused Coupons for Company X".
    *   *Flat Table:* `SELECT value FROM EVENT_m_pool_item WHERE status='unused'`. Simple.
    *   *EAV:* Requires multiple JOINs to reconstruct the "Entity" from its fragments.
    *   *Result:* Reports time out or kill the database CPU.

3.  **Volume:**
    *   `t_entity` is great for "Settings" or "Master Profiles" (low volume, high variance).
    *   Coupon Pools are "High Volume, Low Variance" (1 million rows, all look the same). This demands a **Flat Table**.

### Decision: **Use `EVENT_m_pool` + `EVENT_m_pool_item`**

**1. `EVENT_m_pool` (The Header)**
*   Acts like a "Folder".
*   Columns: `pool_id`, `name` ("Adidas Serial Codes"), `company_id`.

**2. `EVENT_m_pool_item` (The Data)**
*   Columns: `item_id`, `pool_id`, `value` ("ABC-123"), `is_used` (0/1).
*   **Performance:** You can put a `UNIQUE INDEX (pool_id, value)` to guarantee no duplicate codes exist. This is impossible in `t_entity`.
*   **Speed:** Checking a code is instantaneous.

### Revised Schema Recommendation

```sql
/* 
   3. GENERIC POOL (Master Data)
   Instead of just "Coupons", this is "Lists of Things".
*/
CREATE TABLE EVENT_m_pool (
    pool_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),          -- "Bottle Cap Codes 2024"
    type VARCHAR(50),           -- 'SERIAL_NUMBERS', 'VOUCHERS', 'EMAILS'
    company_id INT              -- If pools belong to specific tenants
);

CREATE TABLE EVENT_m_pool_item (
    item_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pool_id INT,
    
    value VARCHAR(255) NOT NULL, -- The Code / Serial / Email
    
    is_used TINYINT DEFAULT 0,
    used_at DATETIME,
    used_by_submission_id INT,   -- Link to who used it
    
    FOREIGN KEY (pool_id) REFERENCES EVENT_m_pool(pool_id),
    UNIQUE INDEX idx_pool_value (pool_id, value) -- GUARANTEES UNIQUENESS FAST
);
```

### Summary
*   **Config/Settings:** `t_work_data` or `t_entity` is fine (Low volume).
*   **Transaction Data (Codes, Submissions):** **MUST** be Flat Tables (`EVENT_t_...`). EAV will fail at scale.
