# Analysis of `srtsRouter.js` and `srtsController.js`

## 1. Function Priority Check
**Request:** Check if the controller runs the "backend check" first before checking on "searates".

**Finding:** **Yes, the priority is correct.**
In all examined controller functions (`GetSeaRatesTrackUser`, `GetSeaRatesTrackNumber`, `SearatesCheck`), the logic consistently follows this pattern:
1.  **Query Local Database**: The code first attempts to retrieve shipment/tracking data from the local MySQL database.
2.  **Evaluate Freshness**: It checks if the data exists and if it is "fresh" enough (based on different criteria like 5-hour expiry or 2-week validity).
3.  **External API Call**: Only if the local data is missing or stale does the code proceed to call the external SeaRates API (`tracking.searates.com`).

**Detail by Function:**
*   `GetSeaRatesTrackNumber`: Queries DB -> Checks if `diffHours >= 5` -> calls API if needed.
*   `SearatesCheck`: Queries DB with criteria (updated < 2 weeks ago OR delivered) -> calls API if no result found.

---

## 2. Anomalies & Critical Issues
While the priority logic is correct, there are several **critical anomalies** and technical debts in `controller/searates/srtsController.js`.

### 🛑 A. Security Vulnerabilities (SQL Injection)
The code uses template literals to inject user input directly into SQL queries in `SearatesCheck`. This is a high-severity security risk.
*   **Location:** `SearatesCheck` (Lines 1415, 1432 of `srtsController.js`)
*   **Code:** `WHERE tso.e_order = ${number}`
*   **Risk:** `number` comes from `req.params.number`. An attacker could inject malicious SQL.
*   **Fix:** Must use parameterized queries (`?`) like the other functions in the file.

### ♻️ B. Severe Code Duplication
The core logic for making HTTP requests (`callaxios`) and saving data (`saveSearatesRecord`) is **copy-pasted 3 times** inside the file instead of being reused.
*   **Global Scope:** `callaxios` defined at line 20 (unused/shadowed).
*   **Inside `GetSeaRatesTrackNumber`:** Defines its own `callaxios` and `saveSearatesRecord`.
*   **Inside `GetSeaRatesTrackNumberandsoid`:** Defines its own `callaxios` and `saveSearatesRecord`.
*   **Inside `SearatesCheck`:** Defines its own `callaxios` and `saveSearatesRecord`.
*   **Impact:** Maintenance nightmare. Any bug fix or schema change must be applied in 4 places.

### ❓ C. Inconsistent Data Handling (Response Structure)
There is a discrepancy in how the SeaRates API response is accessed between functions, suggesting potential bugs.
*   `GetSeaRatesTrackNumber`: Accesses `searatesRes.data` (e.g., `record.data.metadata`).
*   `SearatesCheck`: Accesses `searatesRes.data.data` (e.g., `record.data.data.metadata`).
*   **Impact:** If the API returns a consistent structure, one of these functions is likely failing to extract data correctly. Assumes `callaxios` returns `res.data`.

### 📉 D. Inconsistent Caching Logic
*   `GetSeaRatesTrackNumber` refreshes data if it is older than **5 hours**.
*   `SearatesCheck` considers data valid if updated within **2 weeks**.
*   **Impact:** Users might see vastly different data freshness depending on which endpoint they hit.

### 🐢 E. Performance Issues (N+1 Queries)
The `saveSearatesRecord` function (in all its duplicates) uses `await` inside loops to insert Containers and Events one by one.
*   **Code:** `for (const c of containers) { await dbQuerySR(...) }`
*   **Impact:** Slow performance for shipments with many containers/events. Should use bulk `INSERT`.

### 🐛 F. Hardcoded Magic Values
In `SearatesCheck`, the code inserts a dummy "First time API-CALL" event with hardcoded IDs (`0`).
*   **Code:** `VALUES (0,0,'First time API-CALL'...)`
*   **Impact:** May violate foreign key constraints (if `location_id` 0 doesn't exist) or pollute data.

## Recommendations
1.  **Refactor**: Extract `callaxios` and `saveSearatesRecord` into a separate helper file or utility methods within the controller to eliminate duplication.
2.  **Secure**: Immediately replace `${variable}` interpolation with `?` placeholders in all SQL queries.
3.  **Verify API**: Check the actual response structure of SeaRates API to determine if `.data` or `.data.data` is correct, and standardize.
4.  **Standardize Cache**: Agree on a single "freshness" policy (e.g., 5 hours) and apply it globally.
