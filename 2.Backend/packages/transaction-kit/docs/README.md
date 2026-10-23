---
app: @hots/transaction-kit
purpose: Shared backend package @hots/transaction-kit: transaction engine and types for inventory/POSM, form submit, event coupon and E-Order orders
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: [t_ticket_work_data]
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: []
---

# @hots/transaction-kit

Service-level transaction engine for **HOTS, Form, Event and E-Order**: one way to run a business transaction with a real DB transaction, row/named locks, idempotency, outbox events and a stock ledger. Program rules are **parameters**, not code.

- **Version:** 0.2.0 · **Runtime:** Node (CommonJS), mysql2 · **Status:** new, not wired into any app (existing code unchanged)
- **Basis:** Integrated-API `core/transaction` (registerType / validate / execute / afterCommit), `core/outbox.js`, `core/reservation-engine.js`, PAR `GET_LOCK` sequence, `service/couponService.js`.

## Run a transaction
```js
const kit = require('../packages/transaction-kit');
const engine = kit.createTransactionEngine({
  adapter: kit.createMysqlAdapter(dbHots),        // kit owns BEGIN / COMMIT / ROLLBACK / release
  idempotency: kit.createIdempotencyStore(),      // needs hots.tx_idempotency (DDL proposal in 3.Knowledge)
  outbox: kit.createOutbox(),                     // existing hots.trigger_outbox
});
const ledger = kit.createStockLedger({ store: kit.createHotsResourceStore() });

engine.registerType(kit.createPosmIssueType({ ledger }));
const out = await engine.run('hots.posm_issue', { ticket_id, user_id, items: [{ sku: 'WOB-01', qty: 4 }] });
// out = { ok, replayed, idempotencyKey, result, events }
```

## What `run()` does
```
check(input)                    pure validation, no DB
BEGIN
  idempotency key seen?  → return stored result (replayed: true)
  execute(conn): lock rows (FOR UPDATE, id order) → rule checks on LOCKED data → writes
  outbox.publish(events)        same transaction → event exists iff data committed
  save idempotency result
COMMIT                          (deadlock / lock-wait → retried, max 2)
afterCommit()                   best effort, never undoes the commit
error → ROLLBACK + typed TxError { code, status, details }
```

## Program types (examples = real cases)
| Program | Type | Parameters | Replaces / mirrors |
|---|---|---|---|
| HOTS | `createInventoryMovementType({ ledger, allowNegativeServiceIds:[19] })` → `hots.inventory` | operations receive / issue / adjust / transfer, backorder per service | `core/transaction/types/inventory.js` + engineTicket service 19/14 rule |
| HOTS | `createPosmIssueType({ ledger, resolveItemIds, defaultLocationId, allowNegative })` → `hots.posm_issue` | SKU→id resolver, location, hard block | `script/trigger-functions/deduct_posm_stock.js` |
| Form | `createFormSubmissionType({ repo })` → `form.submit` | `settings_json.max_responses`, `one_response_per_user`, access mode | form-engine public submit |
| Event | `createCouponClaimType({ repo, lookupBy })` → `event.coupon_claim` | `public_hash` or `coupon_code` | `service/couponService.js` redeemCoupon |
| E-Order | `createOrderSubmitType({ repo, validateLoad, orderIdStrategy })` → `eorder.order_submit` | load rules via `@hots/calc-kit`, order id from client or sequence | `controllers/OnlineOrder/serverOrder.js` addOrderHeader + addOrderDetail |

Write your own type: `{ name, check?, idempotencyKey?, execute(conn, input, ctx) → { result, events? }, afterCommit? }`. Table names in every MySQL repo/store are parameters (validated identifiers).

## Errors as RFC 9457 Problem Details (0.2.0)
```js
catch (err) { kit.sendProblem(res, err, { instance: req.originalUrl, traceId: req.get('X-Request-Id') }); }
// → 409 application/problem+json { type, title, status, detail, instance, code: 'TX_INSUFFICIENT_STOCK', details, trace_id, success:false, message }
```
Unknown errors → 500 with a generic detail (no internals). Standard: `3.Knowledge/domains/shared-platform/11_backend_design_principles.md`.

## Building blocks (usable alone)
`withNamedLock`, `selectForUpdate`, `nextSequence` (running numbers under a lock), `createOutbox` (`publish`, worker `claimAtomic` / `claimBatch` / `markDone` / `markFailed`), `createStockLedger`, `TxError` + `TX_ERRORS`.

## Verification (2026-10-06)
`npm test` → 23/23 pass (19 kernel/program + 4 Problem Details) on an in-memory database that emulates InnoDB row locks, rollback and unique keys:
concurrent last-unit issue (1 wins), POSM trigger re-run (no double deduction), form quota under 3 parallel submits (exactly 2), coupon double redeem (1 wins), E-Order line failure (header rolled back), CBM re-check with calc-kit, double submit (one order), deadlock retry, SQL shape of the MySQL stores.
**Not yet run against MySQL** — no local server; first run must be on a dev database.

## Known limits
- Default MySQL repos for Form and E-Order are written from `3.Knowledge/schema/hots.md`; verify defaults (`m_order.is_active`, `schema_snapshot`) against the live services before use.
- HOTS POSM legacy `$.current_stock` path (trigger) and the kit's `stocks` map are two models; the HOTS store migrates `current_stock` → `stocks.DEFAULT` exactly like `core/transaction/types/inventory.js`.

## Structure
```
src/index.js                 HEAD
src/kernel/                  engine, mysqlAdapter, locks, idempotency, outbox, sequence, errors
src/ledger/stockLedger.js
src/stores/                  hotsResourceStore (MySQL), memory (tests)
src/types/{hots,form,event,eorder}/
test/                        kernel.test.js, programs.test.js
```
