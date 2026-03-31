# SeaRates Optimized Tracking Logic (`/fetch`)

This document explains the workflow and data flow of the `/fetch` command (and the automated cron) after the system optimization implemented in March 2026.

## Overview
The `/fetch` command (and the daily cron job) triggers a smart, localized batch tracking process. Instead of tracking containers one-by-one and wasting API quota, the system pools containers, bundles them by Bill of Lading (BL) or Booking numbers, and updates all associated orders simultaneously.

## Step-by-Step Logic Flow

### 1. Command Initiation
*   **Trigger**: User types `/fetch` in the console.
*   **Entry Point**: Calls `manualTrackLimited()`, which triggers `runBatchJob(limit: 2)`.
*   **Smart Limit**: For manual runs, the system is prioritized for high-speed feedback and uses a limit of **2 unique tracking numbers**. 
*   **Cron Note**: The automated daily job uses `runBatchJob(25)` to update a larger batch of shipments.

### 2. Pooling (Candidate Selection)
The system identifies which shipments need an update using two primary functions:
*   **`findBLNumber()`**: 
    *   Looks for BL and Booking numbers in `iod.trs_realization` joined with `iod.trs_invoice`.
    *   **Priority 1**: ETA/ETD is within ±1 day from now (immediate attention).
    *   **Priority 2**: Standard tracking (updated periodically).
    *   **Optimization**: Joins with `sea_rates.m_shipping_line` to get official SCAC codes and determines the correct tracking mode (BL vs BK vs CT) based on carrier preference.
*   **`findCTNumber()`**:
    *   Finds individual containers that are NOT linked to a BL/Booking but still require tracking.

### 3. Smart Bundling & De-duplication
*   The system combines results from both pools.
*   **Logic**: It de-duplicates by `tracking_number` (cont_id).
*   **Result**: If 10 containers in the database share 1 BL, the system only identifies **one unit** for the API call. This saves up to 90% of your API quota on large shipments.

### 4. API Execution & Rate Limiting
*   **Quota Check**: Consults `sea_rates.api_quota_config` and `sea_rates.api_usage_log`. If you are over your daily cap (usually 200/day), it stops and creates a **HOTS Alert Ticket** (Service ID 7) to notify the team.
*   **Request**: Sends a request to `tracking.searates.com`.
*   **Informative Logging**: Prints a green log showing: `[Time] Tracking Number (Type) | SO: [ID] | Status: [Status] | ETA: [Date] | ETD: [Date]`.

### 5. Broadcast Synchronization (Real-time)
When a response is valid, `_syncToOnlineOrder(number, data)` executes:
*   **Target**: `iod.trs_realization`
*   **Action**: Finds **all SO IDs** sharing that tracking number.
*   **Broadcast**: Updates `iod.trs_realization_searates` with `ata` (Actual Arrival), `atd` (Actual Departure), and `scac` for **every** related unit.
*   **Auto-Delivery**: If Actual Arrival exists, it automatically updates `iod.m_order.status = 4` (Delivered) for all associated Sales Orders.

### 6. Local Archival
`saveToDatabase()` stores granular details in the `sea_rates` database for future reference and UI display.
*   **Tables used**:
    *   `sea_rates.shipments`: Master record of the tracking status.
    *   `sea_rates.events`: Step-by-step physical movement (Vessel Loading, Discharged, etc.).
    *   `sea_rates.vessel`: Vessel names and IMOs.
    *   `sea_rates.locations`: Port and state details.
    *   `sea_rates.pol` / `sea_rates.pod`: Port of Loading and Port of Discharge timestamps.
    *   `sea_rates.route`: Latitude/Longitude for map display.

## Summary Table of Databases & Tables
| Component | Database.Table | Purpose |
| :--- | :--- | :--- |
| **Source Data** | `iod.trs_realization` | Contains original BL, Booking, and Container IDs from orders. |
| **Carrier Mapping**| `sea_rates.m_shipping_line`| Maps internal names to SCAC codes and forces tracking modes. |
| **Tracking Cache** | `iod.trs_realization_searates`| Stores confirmed ATA/ATD used by the Online Order system. |
| **Order Status** | `iod.m_order` | Automatically updated to status '4' upon confirmed arrival. |
| **Granular History**| `sea_rates.*` | Stores all physical events, vessel info, and route points. |
| **API Quota** | `sea_rates.api_usage_log` | Tracks daily hits to prevent over-billing. |
| **Exclusions** | `iod.mst_container` | Filters out non-sea shipments (Truck/Air). |

---

## Tracking Exclusion Rules (New)
To preserve API quota and prevent incorrect data mapping, the system automatically excludes the following identifiers from SeaRates tracking:
*   **Domestic/Trucking Identifiers**: Any number starting with `TOLL-` is treated as a domestic shipment and ignored.
*   **Non-Sea Containers**: Any container size/type matching `TRUCK`, `PLANE`, `AIR` (including variants like `1 TRUCK` or `1 FLIGHT`) is excluded.
*   **Historical Filter**: Containers with an ETA more than 5 days in the past are excluded to prevent tracking "dirty" or reused container numbers.

---

## Technical & Security Deep Dive (Bahasa Indonesia)

Berikut adalah penjelasan mendalam mengenai sistem SeaRates yang telah dioptimasi:

### 1. Keamanan Quota (Quota Security)
Sistem ini menggunakan **Dual-Layer Protection** untuk menjaga kuota API Anda:
*   **Pre-Hit Validation**: Setiap request (baik dari Cron Job maupun klik tombol Refresh di UI) akan mengecek tabel `sea_rates.api_quota_config` dan `api_usage_log`. Jika hit sudah mencapai limit (default 200), request akan dibatalkan **SESEBELUM** memanggil SeaRates API.
*   **Cooldown Mechanism**: Untuk navigasi user, terdapat cooldown 24 jam. User tidak bisa melakukan "Spam Refresh" yang menghabiskan kuota.
*   **HOTS Alert**: Jika kuota habis, sistem otomatis membuat **Tiket Service 7 (IT Support)** agar tim Anda segera tahu jika ada anomali atau kebutuhan penambahan limit.

### 2. Penyimpanan & Logging (Data Completeness)
*   **Logging Gagal Search**: Ya, setiap kegagalan (nomor tidak valid, service down) dicatat di `api_usage_log` dengan status `FAIL`. Detail error disimpan dalam format JSON di kolom `error_details_json` untuk audit.
*   **Broadcast Logic**: Satu response sukses untuk satu BL akan mengupdate **seluruh** Container dan Sales Order (SO) yang terkait di database `iod`. Ini sangat menghemat kuota.
*   **Data Penting yang Disimpan**:
    *   **Events**: Semua histori pergerakan fisik (Loading, Discharged, dsb).
    *   **Vessel & Route**: Nama kapal, nomor IMO, dan koordinat GPS untuk peta.
    *   **ETA/ETD**: Tanggal estimasi dan aktual yang disingkronkan ke sistem Online Order.

### 3. Data yang Masih "Tertinggal" (Potensi Pengembangan)
Meskipun sudah mencakup data penting, berikut adalah data yang saat ini *belum* dihandle secara granular:
*   **Historical ETA Audit**: Saat ini kita hanya menyimpan ETA terbaru. Jika kapal delay 3 kali, kita tidak mencatat "History Perubahan ETA" (hanya yang terakhir).
*   **AIS Tracking**: Data posisi kapal secara real-time via satelit dimatikan (`ais=false`) untuk menghemat biaya per request, karena fokus utama kita adalah status ETA/ETD.
*   **Carrier Mapping**: Jika ada Shipping Line baru yang belum terdaftar di `m_shipping_line`, sistem akan menggunakan mode `auto`. Ini terkadang kurang akurat dibanding mode paksa (BL/CT).

### 4. Cara Memunculkan Data di Online Order
Frontend (`ContainerTracking.jsx`) memanggil API backend di `/searates/searatesTrackByNumber/:number/:so_id`.
*   **Backend Controller**: Menggabungkan data dari 7 tabel berbeda menjadi satu objek JSON yang rapi.
*   **UI Elements**: 
    *   **Map**: Menggunakan Leaflet untuk memplot koordinat dari `sea_rates.route`.
    *   **Stepper**: Menunjukkan progress perjalanan berdasarkan event terakhir.
    *   **Details**: Menampilkan info Vessel, Port, dan Histori Event.

---

## Detailed Data Flow & Logic (Bahasa Indonesia)

Berikut adalah alur kerja teknis langkah-demi-langkah dari saat request dimulai hingga data tersimpan:

### Step 1: Inisiasi & Identifikasi (Identification)
*   **Trigger**: Bisa dari Cron Job (Bulk) atau Klik UI (Single/Manual).
*   **Database**:
    *   `iod.trs_realization` & `iod.trs_invoice`: Mencari nomor BL, Booking, atau Container berdasarkan `so_id`.
    *   `sea_rates.m_shipping_line`: Mencari SCAC kode (misal: MSKU, COSU) berdasarkan nama shipping line di realization.

### Step 2: Validasi & Ticketing (Security & Mapping)
*   **Logic**: Jika shipping line **tidak ditemukan** di `m_shipping_line`, sistem tetap lanjut menggunakan mode `auto`.
*   **Automated Action**: Sistem langsung membuat **Tiket HOTS di Service 7** dan di-**Assign ke Tim IT (Team ID 2)** secara otomatis untuk update mapping agar lebih akurat di masa depan.
*   **Quota Check**: Cek `sea_rates.api_usage_log`. Jika hit harian > limit, request dihentikan dan tiket alert dibuat.

### Step 3: API Request (Fetch)
*   Sistem memanggil SeaRates API dengan parameter yang sudah dioptimasi (`type`, `sealine`, `force_update=false`).
*   Jika request pertama gagal (karena mapping salah), sistem akan melakukan **Fallback** otomatis ke mode `auto`.

### Step 4: Normalisasi & Data Storage (Persistence)
Setelah data diterima, sistem akan menyimpannya ke struktur tabel berikut di database `sea_rates`:
1.  `shipments`: Data utama shipment (status, nomor, carrier).
2.  `containers`: List container yang ada di bawah nomor tersebut.
3.  `events`: Histori perjalanan fisik dari setiap container.
4.  `locations`: Detail lokasi (Lat/Long, Country) berdasarkan LoCode.
5.  `vessel`: Detail kapal (Name, IMO) yang membawa shipment.
6.  `route`: Titik koordinat GPS (`lat`, `long`) terbaru untuk tampilan peta.
7.  `pod` / `pol`: Detail pelabuhan keberangkatan (POL) dan tujuan (POD) serta estimasi/aktual tanggal.

### Step 5: Sinkronisasi ke Online Order (Synchronization)
Setelah data `sea_rates` tersimpan, sistem menjalankan `_syncToOnlineOrder`:
*   **Update**: Mengisi kolom `ata`, `atd`, dan `scac` di `iod.trs_realization_searates`.
*   **Auto-Close**: Jika status sudah "Arrived", secara otomatis mengupdate `iod.m_order.status = 4` (Delivered).

### Step 6: Visualisasi Frontend
Frontend memanggil backend, backend melakukan JOIN dari ke-7 tabel di atas dan mengirimkan satu paket JSON besar ke browser untuk dirender ke Map dan Stepper.
