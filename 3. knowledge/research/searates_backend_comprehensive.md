# Searates Backend: Comprehensive Analysis

## 1. Project Overview
The Searates backend (`2. OtherBackend/Searates`) is a specialized microservice designed to automate container and shipment tracking via the SeaRates API. It integrates directly with the HOTS ecosystem for alerting and data synchronization.

## 2. Architecture & Tech Stack
- **Core**: Node.js with Express.
- **Communication**: Socket.io for real-time status updates (currently used for internal logging/monitoring).
- **Database**: MySQL (dual connection to HOTS and its own `sea_rates` schema).
- **Scheduling**: `node-cron` for periodic tracking checks.

## 3. Security & API Management
- **API Keys**: Managed via `.env` variable (`SEARATES_API_KEY`).
- **Quota Control**: 
  - Centralized configuration in `sea_rates.api_quota_config`.
  - Daily limit is strictly capped at **200** per user's safety requirement via `Math.min(config, 200)`.
  - Attempts are logged in `sea_rates.api_usage_log`.

- **System Alerts**: Upon hitting quota limits, it autonomously creates an **IT Support Ticket (Service 7)** in the HOTS main database to notify administrators.

## 4. Operational Efficiency
- **Batch Processing**: Tracks shipments in batches of 50 to respect rate limits.
- **Adaptive Delay**: Implements dynamic wait times between batches based on `x-ratelimit-reset` headers.
- **Priority Logic**:
  - **Priority 1**: Shipments near ETA/ETD (checked daily).
  - **Priority 2**: Standard shipments (checked every 5 days).
- **Daily Query Safety**:
  - **Technical**: The script is now hard-coded to ignore any database configuration higher than **200**. 
  - **Security**: This ensures that even if the database is modified or corrupted, the system will not exceed the 200-hit safety threshold.

- **Auto-Closing**: Automatically updates Online Order status to "DELIVERED" (Status 4) when Actual Time of Arrival (ATA) is confirmed.

## 5. Reliability & Trigger Mechanics
- **Daily Schedule**: Runs exactly at **00:00 AM** daily via `node-cron`.
- **Startup Behavior**: Calling `Searates.runCheck()` in `index.js` only initializes the scheduler; it does **not** trigger immediate API hits (unless the internal `test()` function is uncommented).
- **Potential Limit Breaks**:
  - **PM2 Cluster Mode**: If the app runs in multiple instances, each instance will start its own 00:00 cron.
  - **Async Race Condition**: Tracking is done in batches of 50. Since quota is checked *before* a batch and logged *after* each hit, a batch could potentially exceed the limit by up to 50 hits if the starting count was near the limit.
  - **Restarts at Midnight**: If PM2 restarts the app exactly at 00:00, the cron might execute multiple times depending on the scheduler's state persistence.


## 5. Runtime Environment
- Deployed on VPS (Server 104).
- Managed by **PM2** (as seen in `ecosystem.config.js`).
- Uses **Cloudflare** for secure exposure and SSL management.
- Production/Development state is determined by local IP detection (`10.126.106.105`).
