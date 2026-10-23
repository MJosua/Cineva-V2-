---
app: @hots/tracking-kit
purpose: Shared package @hots/tracking-kit: container tracking normalizer for SeaRates data and the backend cache
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: [events]
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: ["write:*"]
---

# @hots/tracking-kit

Container-tracking data layer shared by E-Order, SeaRates, CTO and i2i-style screens.

- **Version:** 0.1.0 · **Source:** `E-Order/src/utils/containerTrackingNormalizer.js`, copied 2026-10-06 (E-Order unchanged)
- **Dependencies:** none (pure functions)

## Usage
```ts
import { normalizeContainerTrackingData, calculateProgress } from '@hots/tracking-kit';

const tracking = normalizeContainerTrackingData(apiResponse); // SeaRates live or backend cache
if (tracking) {
  const pct = calculateProgress(tracking.etd, tracking.eta);
  // tracking.orderedLocations → map route in the right order
}
```

## Exports
| Export | Purpose |
|---|---|
| `normalizeContainerTrackingData(raw)` | One shape (`NormalizedTracking`) from SeaRates or backend payloads; unwraps `{ data }` envelopes |
| `extractContainerTrackingPayload(res)` | Envelope unwrapping only |
| `calculateProgress(etd, eta)` | 0–100 voyage progress |
| `findLocationName`, `findVessel` | Lookups that accept every id format |
| types `NormalizedTracking`, `TrackingEvent`, `TrackingLocation`, `TrackingVessel`, `TrackingContainer` | Documented output shape |

## Notes
- Logic is a verbatim copy; it still logs a summary with `console.log` (kept for parity — remove in a minor release if noisy).
- `event.actual` is `0 | 1` (SeaRates `true/false` and backend `1/0` are mapped).
- Not extracted yet: the tracking page/timeline/map UI (`E-Order/src/features/admin/pages/tracking/ContainerTracking.jsx`, 1504 lines, Chakra + Leaflet) — candidate for a `TrackingTimeline` component in this package.
