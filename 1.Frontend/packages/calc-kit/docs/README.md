---
app: @hots/calc-kit
purpose: Shared package @hots/calc-kit: CBM/container load rules and the PAR EXCOM threshold helper (pure ESM)
domain: Shared Platform
owner: iod.it
status: active
base: -
port: -
api_prefix: -
owns_tables: []
reads_tables: []
writes_tables: []  # shared tables this app also writes
emits: []
listens: []
depends_on: []
must_not: ["write:*"]
---

# @hots/calc-kit

Pure calculation utils (ESM, no React, no DB) — the same code runs in the browser and on the server, so a backend can re-check exactly what the UI calculated.

- **Version:** 0.5.0 · **Source:** `E-Order/src/utils/{cbmCalculator,containerRuleEngine,containerRules}.js` copied 2026-10-06 (logic unchanged). E-Order unchanged.

## Exports
| Export | Purpose |
|---|---|
| `calculateFlavourCBM`, `calculateFlavourUnitCBM`, `calculateContainerCBM`, `calculateTruckCBM`, `formatCBMForDisplay` | carton volume (+1 cm tolerance per side) → CBM, 10-decimal precision, floor to 1 decimal for display |
| `resolveCBM({ flavours, companyId, rules, specialConditions })` | CBM limit: special condition 23 mixing load → same-load bypass (100) → company rule → `rules.default.cbm` |
| `resolveMaxQty`, `resolveMixedContainerLimit`, `resolveSkuType`, `hasSpecificCBMRule` | qty caps, mixed 40HC pairs, dry/soup type, rounding skip |
| `evaluateContainerLoad({ flavours, containerSize, custom, catalog, companyId, rules, specialConditions })` | one container card vs load rules → `{ ok, released, skipped, cbm_used, cbm_limit, per_flavour[{max_qty}], messages[] }`; Custom releases only these rules (0.3.0) |
| `selectFlavour`, `setFlavourQty`, `removeFlavour`, `flavourEditability` | E-Order auto-balance of the flavours of one container (Custom Mode off = computed values, on = all open) (0.4.0) |
| `validateOrderLoad`, `skuTotals`, `moqOf` | order-level check: no empty container, MOQ per SKU over all containers (0.5.0) |
| `palletPlan`, `remainderPallets`, `palletQty` | pallet mode: pallets must total the container maximum, last flavour = remainder; unknown total (20 FT) → skipped (0.3.0) |
| `evaluateApprovalThreshold({ amount, currency, rates, rule })`, `convertToUsd`, `PAR_EXCOM_RULE` | PAR EXCOM required when total USD **> 2000** (exactly 2000.00 → not required); rates = units per USD; missing rate → error; rule is config (threshold / operator / role) |
| `defaultContainerRules` | E-Order defaults (default 66 CBM, company 116 / 195 overrides) — **pass your own `rules` object** for other programs |

## Used by
- `@hots/transaction-kit` E-Order type: `validateLoad` re-checks CBM on the server (test: `2.Backend/packages/transaction-kit/test/programs.test.js`).

## Tests
`npm test` → 10/10 (5 CBM + 5 threshold) (includes the original `3.Knowledge/test_eorder_same_load_cbm_rule.mjs` cases; that old file points to a stale path `../1, fontend/…`).
