# SeaRates IOD Sync Protocol & Data Integrity

## Core Data Truth
The single source of truth for Actual Time of Arrival (ATA) and Actual Time of Departure (ATD) fetched from SeaRates is the **`iod.trs_realization_searates`** table.

While `trs_realization` and `trs_invoice` tables historically have `ata` and `atd` columns, those are considered **unused/legacy** for automated SeaRates tracking data. Any tracking milestone logic or joining must target `trs_realization_searates` for accurate automated tracking milestones.

## Schema Update (invoice_id)
To maintain data integrity and allow the frontend (Online Order system) to properly query and trace the tracking back to the invoice, the middle-table `trs_realization_searates` requires the `invoice_id` column matching the data type from `trs_realization`.

**Required Schema Alteration:**
```sql
ALTER TABLE iod.trs_realization_searates
ADD COLUMN invoice_id VARCHAR(100) AFTER so_id;
```

## Backend Synchronization Flow
Both the **Child Backend** (`OtherBackend/Searates/automation/Modul/Searates_API.js`) and the **Main Backend** (`controller/searates/srtsController.js`) contain a `_syncToOnlineOrder()` logic block.

Whenever SeaRates tracking data is successfully retrieved, the synchronization logic MUST:
1. Identify the `so_id` AND `invoice_id` from the source `trs_realization` / `trs_invoice` tables using the tracking number (B/L, Booking, or Container).
2. Insert/Update the `trs_realization_searates` table, saving BOTH `so_id` and `invoice_id`, along with `cont_id`, `ata`, `atd`, and `scac`.

## Frontend Implication (Online Order)
The Online Order frontend will need to be audited and potentially updated to ensure it fetches shipping milestones from or joins with `trs_realization_searates` (via `invoice_id` or `so_id`), rather than relying on the legacy `ata`/`atd` columns in the primary invoice/realization tables.
