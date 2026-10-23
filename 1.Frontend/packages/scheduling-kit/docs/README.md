Current release: 0.1.0-cineva.2. Originally implemented in Cineva, then promoted with explicit user authorization to D:/Kantor/1.Frontend/packages on 19 October 2026. The matching Cineva snapshot is 0.1.0-cineva.2. Existing HOTS applications/backend were not changed.

# @hots/scheduling-kit

Additive capability created in Cineva and promoted to HOTS with user authorization.

Pure TypeScript targeting ES2020: no React, database, network, storage, application clock, vendor names, or room/crew-specific policy. Source exports are intended for the existing TypeScript/Vite host. Tests use Node 24's native TypeScript support.

## Intervals and availability

```ts
import { checkAvailability, intervalsOverlap } from '@hots/scheduling-kit';

const issues = checkAvailability({
  resources: [{ id: 'unit', capacity: 2 }],
  reservations: [{ id: 'existing', resourceId: 'unit', start: 100, end: 200,
    quantity: 1, status: 'confirmed' }],
  requests: [{ resourceId: 'unit', start: 150, end: 250, quantity: 1 }],
  now: 0,
});
// []: one existing unit plus one requested unit equals capacity.
```

`Interval` is `{ start:number, end:number }`, finite with `start < end`. All intervals are half-open `[start,end)`: adjacent end/start values do not overlap. `intervalsOverlap(left,right)` throws `RangeError` for malformed intervals.

`checkAvailability(input)` returns `Issue[]`. Empty means the supplied candidate set fits the supplied snapshot. It never changes inputs. Resources require unique non-empty IDs and positive safe integer capacity. Reservations require unique IDs, an existing resource, a valid interval, positive safe integer quantity, status `hold|confirmed|cancelled`, and optional finite `expiresAt`. Requests require an existing resource, valid interval and positive safe integer quantity. Repeated candidate resource/interval pairs are legitimate separate demands and count together.

The explicit finite `now` clock controls hold expiry. A hold occupies capacity while `expiresAt > now`; equality releases it. A hold without expiry remains active until the caller changes it. Confirmed reservations remain active regardless of expiry metadata. Cancelled reservations release capacity. Malformed cancelled/expired/excluded rows still produce validation issues rather than silently hiding corrupt snapshot data. `excludeReservationId` omits that one existing reservation from load calculations for an update; it does not disable input validation.

Capacity uses a sweep over concurrent occupied windows, including all candidates together. It does not sum all reservations that happen to overlap some part of a long request: disjoint prior bookings can share capacity correctly. Existing overcapacity outside candidate windows is not reported as candidate unavailability. Each resource produces at most one capacity issue (the first offending window); blackout issues identify individual requests. BigInt accumulation preserves safe-integer quantity comparisons even when aggregate load exceeds Number's safe range.

Optional non-negative finite `bufferBefore` and `bufferAfter` expand both existing and candidate occupied intervals. Thus the gap between two raw intervals must accommodate the earlier interval's after-buffer plus the later interval's before-buffer. Exact buffered adjacency is allowed. Resource `blackouts` are raw intervals during which the whole resource is unavailable; expanded candidates are compared against them. Represent partial-capacity maintenance using quantity reservations, not whole-resource blackouts.

Issue fields:

| Field | Meaning |
|---|---|
| `code` | `INVALID_INPUT`, `DUPLICATE_ID`, `UNKNOWN_RESOURCE`, `BLACKOUT`, `CAPACITY_EXCEEDED` |
| `message` | Generic English explanation; adapters translate/domain-format it |
| `resourceId`, `reservationId`, `requestIndex` | Optional location of the relevant input |
| `start`, `end` | Optional offending half-open window or blackout |

Validation issues return before availability calculation. Buffers that overflow numeric interval bounds are rejected. Numeric endpoints, `now`, expiry and buffers must use compatible caller-chosen units; no timezone or unit conversions are guessed. Prefer epoch milliseconds for timed meetings/shoots. Model tenant scope, operating hours, recurrence, permissions and domain labels in the consumer adapter.

## Hotel date-only adapter

```ts
const first = stayInterval('2028-02-28', '2028-03-01');
// { start:21242, end:21244, nights:2 } (date ordinal units)
```

`stayInterval(checkIn,checkOut)` strictly validates `YYYY-MM-DD` calendar dates and requires checkout after check-in. The result is `{start,end,nights}` with **integer date ordinals measured in days since 1970-01-01**, calculated using UTC solely as calendar arithmetic. These are not arrival timestamps, epoch milliseconds, local midnight instants or a guessed property timezone. Checkout is exclusive, allowing same-date turnover. A consumer must first obtain property-local check-in/check-out dates and consistently use ordinal days (including buffers/expiry/clock if used in that model), or explicitly convert its entire model to a different unit. Do not mix this result directly with epoch-millisecond reservations.

Room type capacity means available units, not guest count. Rates, deposits, refunds, occupancy, no-show, property timezone and maintenance policy belong in a hotel adapter.

## Safety and acceptance limits

This is a deterministic availability policy over a snapshot. Passing all resources together evaluates the entire candidate set before the caller applies a change, but does not reserve anything or provide persistence atomicity. There is no claim of concurrent booking safety, transaction/rollback, locks, idempotency storage, authorization or production booking readiness. A server adapter must recheck under its authoritative transaction/locking policy and atomically commit all allocations; failures must roll back the whole operation.

Run `npm.cmd --prefix 1.Frontend/packages/scheduling-kit test` from the Cineva root. Sixteen synthetic tests cover meeting/crew/type inventory, multi-resource checks, disjoint versus concurrent occupancy, adjacency, holds, cancellation, exclusion, buffers, blackouts, validation, duplicate IDs, hotel date boundaries and numeric precision. No source workbook rows or live systems are used.
