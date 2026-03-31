# SeaRates Tracking Engine Audit

Date: March 13, 2026

Scope:
- `controller/searates/srtsController.js`
- `2. OtherBackend/Searates/automation/Modul/Searates_API.js`

## Architecture

```text
IOD orders / realization
    |
    +--> srtsController HTTP endpoints
    |       |
    |       +--> local SeaRates cache tables (`shipments`, `events`, `route`, `pol`, `pod`, `vessel`)
    |       +--> mapping lookup (`trs_realization`, `trs_invoice`, `m_shipping_line`)
    |       +--> quota guard (`sea_rates.api_usage_log`, `api_quota_config`)
    |       +--> SeaRates live tracking API
    |       +--> SeaRates history API fallback
    |       +--> sync back to `iod.trs_realization_searates` / `iod.m_order`
    |
    +--> child backend batch worker
            |
            +--> candidate selection (`findBLNumber`, `findCTNumber`)
            +--> in-memory in-flight dedupe
            +--> quota guard
            +--> SeaRates live tracking API
            +--> SeaRates history API fallback
            +--> save granular sea_rates tables
            +--> sync back to IOD
```

## Current State Summary

### SeaRates call pattern
- Live tracking uses `https://tracking.searates.com/tracking`.
- Historical lookup uses `https://tracking.searates.com/history`.
- Requests consistently use `route=true`.
- Requests consistently use `force_update=false`.
- Requests currently keep `ais=false`.

### Capability coverage
- Container tracking: supported.
- Historical lookup: supported in the batch worker and controller paths; controller matching is now unified around the same live-then-history strategy.
- Route data retrieval: supported through `route=true` and persisted in `sea_rates.route`, `sea_rates.pol`, `sea_rates.pod`.
- AIS vessel data: not actively used; the engine keeps `ais=false` to preserve quota.

### Existing safeguards
- Quota reservation exists through `sea_rates.api_usage_log`.
- Network timeout retry exists in `_callSeaRatesAPI`.
- Batch worker already had in-memory duplicate suppression.
- Local cache existed implicitly through `sea_rates.shipments` timestamps.

### Gaps found during audit
- The HTTP controller and the child backend implement the same business logic twice, with drift between them.
- `GetSeaRatesTrackNumberandsoid` had a broken path where `scacCandidates` was referenced without being defined.
- `GetSeaRatesTrackNumber` used a weaker fallback path than the worker and could miss historical matches.
- Voyage matching was mostly ETD-only. Vessel and route evidence were not used as tie-breakers.
- There was no dedicated negative cache table for repeated misses or recently matched voyages.
- Controller-side duplicate suppression was missing before the audit patch.

## What Changed In `srtsController.js`

- Added controller-side in-flight request deduplication with `inFlightSeaRatesRequests`.
- Added optional `container_tracking_cache` support with graceful fallback when the table does not exist.
- Unified refresh windows around:
  - active shipment: 6 hours
  - delivered shipment: 7 days
  - historical match: 14 days
  - negative cache: 6 hours
- Added live candidate scoring by:
  - ETD delta
  - vessel name
  - POL / POD if internal data becomes available
  - route presence and route validation hints
- Added historical candidate scoring with the same matcher instead of ETD-only selection.
- Patched controller routes to use live first, then historical fallback, then cache upsert.

## Matching Logic

Primary:
- tracking number
- internal ETD with a hard tolerance of plus/minus 7 days

Secondary:
- vessel name
- POL and POD when internal source data is available
- route presence / route validation hint

Tie-break:
- highest score wins
- if scores tie, smallest ETD delta wins
- if ETD ties, route-validated candidates win

## Weaknesses Still Present

- POL/POD matching is only partially active because current IOD lookup data reliably exposes ETD and vessel name, but not strong expected POL/POD fields in the current query set.
- The batch worker and controller still duplicate a lot of code. They should share one service module.
- Historical detail fetching is still one-request-per-snapshot. That is correct but can be slow on long-lived reused containers.
- AIS is still disabled globally. This is intentional for quota efficiency, but it means no AIS tie-breaker is attempted on ambiguous voyages.

## Recommended Next Steps

1. Extract a shared `service/searates/trackingEngine.js` used by both the controller and child backend.
2. Extend internal mapping queries so expected POL/POD are available from business data, not only ETD and vessel.
3. Enable `ais=true` only for ambiguous matches after live plus history scoring still leaves a tie.
4. Add a small worker-pool wrapper for historical snapshot details if history scans become a bottleneck.
5. Move the remaining dead duplicated controller code out after the new path is stable in production.

## Refactored Pseudocode

```text
load local shipment rows
load dedicated cache row

if local rows fresh:
    return local rows

if no local rows and cache has fresh payload:
    return cache payload

load internal mapping context
resolve tracking number + tracking type + SCAC candidates

for each SCAC candidate:
    call live SeaRates with route=true, ais=false, force_update=false
    score candidate by ETD, vessel, POL/POD, route
pick best live candidate

if no valid live candidate:
    fetch SeaRates history list
    fetch history details
    score each historical candidate
    pick best historical candidate

if matched:
    save sea_rates granular tables
    sync iod.trs_realization_searates / iod.m_order
    upsert container_tracking_cache
    return normalized payload

store negative cache entry
return not found / mismatch response
```

## Suggested Cache Schema

The SQL file is stored at `3. knowledge/container_tracking_cache.sql`.

Core columns:
- `container_number`
- `so_id`
- `tracking_number`
- `tracking_type`
- `voyage_id`
- `vessel_name`
- `etd`
- `eta`
- `pol`
- `pod`
- `last_updated`
- `tracking_status`
- `expires_at`
- `is_historical`
- `last_error_code`
- `payload_json`

## Example Improved Request Strategy

```text
GET /tracking
  number=<resolved container or BL>
  type=<ct|bk|bl>
  sealine=<mapped SCAC candidate>
  force_update=false
  route=true
  ais=false
```

Use `ais=true` only when:
- ETD and vessel scoring still leave multiple viable voyages
- route data is absent or insufficient
- the shipment is high-value enough to justify the extra API cost
