# Changelog — @hots/import-kit

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]
### Added
- IndoVietnam template IV_SP3_DELIVERY_LINE (SP3 delivery order × shop × product group, sales + promo; reconciles to Total Ctn). Template only, no engine change.
- `constants_from_cells` sheet option (constant read from one cell, e.g. report date in B1). Additive.
- IndoVietnam template IV_SP3_DAILY_STOCK_BATCH (SP3 day × movement × expiry batch × product group).
- IndoVietnam template IV_VEHICLE_MASTER (vehicle, capacity ctn, shift, daily capacity).
- IndoVietnam template IV_SP3_DAILY_INPUT (new daily input workbook v1: DELIVERY, STOCK_IN, TRANSFER, STOCK_CLOSING; blocks missing container no. from port and missing transfer destination).
- `enrich/dailyStock.js` — `enrichDailyInput`: IOD container batches → IN per batch, FEFO stock-out, manual expiry override, shortage, transfer-to-self, physical-count check. Pure, no DB.
- `constants_from_cells.<field>.sheet` — read a constant from another sheet (stock point on INFO!B1).
- IndoVietnam template IV_DAILY_INPUT v2 (generic for all stock points; supersedes IV_SP3_DAILY_INPUT).
### Fixed
- `excel_date` / `toIsoDate`: SheetJS cellDates values land at 23:59:48 of the previous day in UTC+7, so every date was one day early. Values within 2 minutes before local midnight now snap to the next day. Staged batches with dates must be reloaded (loader `--reload=`).
- IV_RECEIPT_WEEKLY: values are cartons, not pieces → value field `qty_ctn`, uom CTN (batch 4 staged them under `qty_pcs`; view reads both).

## [0.1.0] - 2026-10-06
### Added
- Template engine (rows + unpivot modes), header detection, transforms, JSON rule DSL, lookups, required fields, statuses valid/warning/blocked.
- Stacked-block support: `carry`, `carry_reset_when`, `carry_backfill`, `constants_from_sheet_name`, `$context` constants.
- File recognition (`recognize`, `scoreFingerprint`) and `validateTemplate`.
- IndoVietnam templates: IV_STT_WEEKLY, IV_OPENING_STOCK_WEEKLY, IV_RECEIPT_WEEKLY, IV_ORDER_REALIZATION.
