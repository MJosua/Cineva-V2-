# Changelog — @hots/calc-kit

Format: Keep a Changelog · Versioning: SemVer (pre-1.0: minor may break).

## [Unreleased]

## [0.5.1] - 2026-10-13
### Changed
- `evaluateContainerLoad`: when there is one flavour, or every flavour has the same container load, the check is "sum of qty <= container load" (error `qty_cap_exceeded`) and the CBM limit is not applied (result `basis: 'qty'`, `cbm_limit: null`, per-flavour `max_qty` = load minus the others). Different loads keep the CBM limit (`basis: 'cbm'`). Result gains the `basis` field (additive); the old same-load shortcut (CBM limit 100) is replaced by this rule.

## [0.5.0] - 2026-10-13
### Added (additive)
- `validateOrderLoad`, `skuTotals`, `moqOf` (`cbm/validateOrderLoad.js`): E-Order submit check ported - Flavour I of every container needs a SKU and qty > 0, MOQ per SKU summed over all containers (20 FT uses `moq20`); `onlySkus` limits the MOQ check to changed SKUs; applies in Custom Mode too.
- Tests: `test/validateOrderLoad.test.js` (6 cases).

## [0.4.0] - 2026-10-13
### Added (additive)
- `selectFlavour`, `setFlavourQty`, `removeFlavour`, `flavourEditability`, `capacityOf`, `emptyFlavour` (`cbm/autoBalance.js`): pure port of the E-Order Add More Container auto-balance. Custom Mode off: flavour I = full container capacity, later rows start at 0, typing I computes II (remaining CBM, rounded down to 10; `round` for conditions 23/25), III is always computed; with two rows II is computed, with one row I is locked. Custom Mode on: every value open and stored as typed. Covers condition 25 ratio mix, company mixed 40HC pair, total-qty cap and the same-load rule (limit 100).
- Deviation from E-Order: the total-qty cap (e.g. company 116: 3800) also bounds the computed flavour II.
- Tests: `test/autoBalance.test.js` (12 cases).

## [0.3.0] - 2026-10-13
### Added (additive, no existing export changed)
- `evaluateContainerLoad({ flavours, containerSize, custom, catalog, companyId, rules, specialConditions })` — checks one container card: CBM limit (`resolveCBM`), qty cap (`resolveMaxQty`), mixed 40HC pair, per-flavour `max_qty`; `custom: true` releases only these container-load rules; missing capacity data → `skipped` + warning, never an error.
- `palletPlan`, `remainderPallets`, `palletQty` — pallet mode: pallets of a container must total the maximum exactly (last flavour = remainder); unknown total (20 FT) is reported as skipped.
- Tests: `test/evaluateContainerLoad.test.js` (11 cases).

## [0.2.0] - 2026-10-06
### Added
- `evaluateApprovalThreshold`, `convertToUsd`, `PAR_EXCOM_RULE` — PAR EXCOM required when total USD **> 2000** (decision 2026-10-06); config-driven rule, units-per-USD rates, no default rate; tests for 1999.99 / 2000.00 / 2000.01.

## [0.1.0] - 2026-10-06
### Added
- Initial version (see README for sources and verification).
