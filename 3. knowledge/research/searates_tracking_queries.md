# SeaRates Tracking: Logic & Query Guide ⚓

Because we have a **200/day limit**, we don't track everyone every day. Instead, the system uses a **Unified Priority Query** that splits shipments into two pools: **Priority 1 (Daily)** and **Priority 2 (5-Day Cycle)**.

---

## � 1. The Logic Breakdown

### 🚀 Priority 1: Milestone Booster (DAILY)
- **Who**: Shipments with an ETA or ETD within **1 day of today** (Yesterday, Today, or Tomorrow).
- **Rule**: These are tracked **every 24 hours**. We prioritize these first so "Arriving Today" shipments always have the latest data.
- **Goal**: Zero lag on critical arrival and departure events.

### 🐢 Priority 2: Standard Transit (5-DAY CYCLE)
- **Who**: Shipments deep at sea (No milestone today).
- **Rule**: These are tracked **once every 5 days**. 
- **Goal**: Quota preservation. We update them weekly to verify their position without wasting all 200 hits on shipments that are still in the middle of the ocean.

---

## 🔍 2. How to Test (Full Smart Queries)

To get accurate results that match the automation (No duplicates, correct B/L vs CT grouping), use these full queries in your SQL client.

### A. The "Daily Booster" Report (Priority 1)
**Purpose**: Run this to see exactly what the system will track **TODAY**. These are shipments with milestones today +/- 1 day.
```sql
SELECT tracking_number, final_tracking_type, sealine, so_id, eta, etd, ata, atd
FROM (
    SELECT 
        CASE 
            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
            ELSE i.bl_no
        END as tracking_number,
        CASE 
            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN 'ct'
            ELSE 'bl'
        END as final_tracking_type,
        msl.scac as sealine,
        r.so_id, r.eta, r.etd, ts.ata, ts.atd
    FROM iod.trs_realization r
    JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
    LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
    LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
    WHERE ts.ata IS NULL 
      AND r.etd <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND YEAR(r.etd) >= YEAR(CURDATE()) - 1
      AND msl.scac IS NOT NULL -- CARRIER VALVE
      AND (
          (DATE(r.eta) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 1 DAY))
       OR (DATE(r.etd) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 1 DAY))
      )
) AS sub
GROUP BY tracking_number; -- DEDUPLICATION
```

### B. The "5-Day Cycle" Report (Priority 2)
**Purpose**: Run this to see the "Waitlist". These are active shipments deep at sea that are processed once every 5 days.
```sql
SELECT tracking_number, final_tracking_type, sealine, so_id, eta, etd, ata, atd
FROM (
    SELECT 
        CASE 
            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
            ELSE i.bl_no
        END as tracking_number,
        CASE 
            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN 'ct'
            ELSE 'bl'
        END as final_tracking_type,
        msl.scac as sealine,
        r.so_id, r.eta, r.etd, ts.ata, ts.atd
    FROM iod.trs_realization r
    JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
    LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
    LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
    WHERE ts.ata IS NULL 
      AND r.etd <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND YEAR(r.etd) >= YEAR(CURDATE()) - 1
      AND msl.scac IS NOT NULL -- CARRIER VALVE
      AND NOT (
          (DATE(r.eta) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 1 DAY))
       OR (DATE(r.etd) BETWEEN DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL 1 DAY))
      )
) AS sub
GROUP BY tracking_number; -- DEDUPLICATION
```

---

## ⚙️ 3. The Unified Production Query (Full Automation)
This is the combined logic with the **200 limit** and **Automatic Priority Sorting**.

```sql
SELECT * FROM (
    SELECT 
        tracking_number, final_tracking_type, so_id, sealine, last_updated_date, eta, etd, ata, atd,
        /* CASE: Decide Priority */
        CASE 
            WHEN (DATE(eta) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
                 OR (DATE(etd) BETWEEN DATE_SUB(NOW(), INTERVAL 1 DAY) AND DATE_ADD(NOW(), INTERVAL 1 DAY))
            THEN 1 ELSE 2 
        END as priority
    FROM (
        SELECT 
            r.so_id, r.eta, r.etd, msl.scac as sealine, s.last_updated_date,
            ts.ata, ts.atd,
            CASE 
                WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
                WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
                ELSE i.bl_no
            END as tracking_number,
            CASE 
                WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN 'bk'
                WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN 'ct'
                ELSE 'bl'
            END as final_tracking_type
        FROM iod.trs_realization r
        LEFT JOIN iod.trs_invoice i ON r.invoice_id = i.invoice_id
        LEFT JOIN iod.trs_realization_searates ts ON r.so_id = ts.so_id
        LEFT JOIN sea_rates.m_shipping_line msl ON msl.i2i_shipline LIKE CONCAT('%', r.ship_line, '%') OR msl.i2i_shipline LIKE CONCAT('%', r.fwd, '%')
        LEFT JOIN sea_rates.shipments s ON REPLACE(CASE 
            WHEN LOWER(msl.type) = 'bk' AND r.book_no IS NOT NULL AND TRIM(r.book_no) != '' THEN r.book_no
            WHEN LOWER(msl.type) = 'ct' AND r.cont_id IS NOT NULL AND TRIM(r.cont_id) != '' THEN r.cont_id
            ELSE i.bl_no
        END, '-', '') = s.number
        WHERE i.bl_no IS NOT NULL 
          AND r.eta < '9000-01-01' 
          AND r.etd <= DATE_ADD(NOW(), INTERVAL 30 DAY) 
          AND YEAR(r.etd) >= YEAR(NOW()) - 1
          AND msl.scac IS NOT NULL
          AND ts.ata IS NULL
          AND (s.status IS NULL OR (s.status NOT LIKE '%arrival%' AND s.status NOT LIKE '%delivered%'))
    ) AS sub1
) AS pool
WHERE 
    (last_updated_date IS NULL) OR -- Always track if never tracked before
    (priority = 1 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 1 DAY)) OR -- Daily for Milestones
    (priority = 2 AND last_updated_date < DATE_SUB(NOW(), INTERVAL 5 DAY))    -- 5-Day for Standard
GROUP BY tracking_number
ORDER BY priority ASC, last_updated_date ASC -- Milestones first!
LIMIT 200;
```

---
> [!NOTE]  
> The **ORDER BY priority ASC** is the most important part. Even if we have 1,000 shipments ready for refresh, the system will always fill the daily 200 slots with Priority 1 (Milestones) first, and then use the remaining space for Priority 2.
