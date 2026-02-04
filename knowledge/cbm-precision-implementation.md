# CBM Precision Implementation

**Date:** 2026-01-30
**Context:** Fix for CBM decimal precision issue in E-Order system

## Problem

The original `cbmCalculator.js` truncated CBM values too aggressively:
- `calculateFlavourCBM` → 2 decimals (`Math.floor(cbm * 100) / 100`)
- `calculateContainerCBM` → 1 decimal (`Math.floor(total * 10) / 10`)
- `calculateTruckCBM` → 1 decimal (`Math.floor(total * 10) / 10`)

This caused values like `63.31461` and `63.9` to produce the same comparison result when checked against CBM limits defined in `containerRules.js`.

## Solution

Separated **calculation precision** from **display formatting**:

| Function | Usage | Precision |
|----------|-------|-----------|
| `calculateFlavourCBM()` | Comparison logic | 10 decimals |
| `calculateContainerCBM()` | Comparison logic | 10 decimals |
| `calculateTruckCBM()` | Comparison logic | 10 decimals |
| `formatCBMForDisplay()` | UI display | 1 decimal |

## Files Modified

### `fontend/E-Order/src/utils/cbmCalculator.js`
- Added `PRECISION_MULTIPLIER = 10000000000` constant
- Internal `calculateFlavourCBMPrecise()` function for high precision
- All calculation functions now use 10-decimal precision
- Added `formatCBMForDisplay(cbmValue)` export for UI display

### `fontend/E-Order/src/components/RumuscbmContainer.jsx`
- Import `formatCBMForDisplay` alongside `calculateContainerCBM`
- Display CBM value using `formatCBMForDisplay(cbm)` (shows 1 decimal)

## Usage

```javascript
// For COMPARISON (uses 10 decimals internally)
const cbm = calculateContainerCBM(container, flavourLookup);
if (cbm > allowedCBM) { /* over limit */ }

// For DISPLAY (shows 1 decimal like "63.3")
<span>{formatCBMForDisplay(cbm)} CBM</span>
```

## Related Files
- `containerRules.js` - Contains CBM limits like `63.31461`
- `containerRuleEngine.js` - `resolveCBM()` returns the CBM limit, `hasSpecificCBMRule()` detects specific rules
- `AddMoreContainerBody.jsx` - Uses CBM comparison for validation
- `FlavourNonBulk_Component.jsx` - Uses `hasSpecificCBMRule()` to skip rounding

---

## Skip Rounding for Specific CBM Rules (2026-01-30)

### Problem
For Company 116 with SKU 401538, the expected combination is:
- Flavour 1: **2,272** ctns
- Flavour 2: **2,354** ctns
- Total CBM: **63.31461** (exact limit)

But the "round to 10" logic was producing:
- Flavour 2: **2,350** ctns (4 ctns short)

### Solution
Added `hasSpecificCBMRule()` function to detect when a company-specific CBM rule applies:

```javascript
// Returns true if a specific CBM rule is found for the flavours
hasSpecificCBMRule({ flavours, companyId, rules })
```

When `true`, the quantity calculation skips the `Math.floor(qty / 10) * 10` rounding.

### Files Modified
- `containerRuleEngine.js` - Added `hasSpecificCBMRule()` export
- `FlavourNonBulk_Component.jsx` - Uses function at 3 locations to conditionally skip rounding

### Behavior
| Scenario | Rounding |
|----------|----------|
| Company 116 + SKU 401538 | **No rounding** (precise qty) |
| Other companies / default CBM | **Round to 10** |

## Validation Tolerance (2026-01-30)
Added `0.00001` epsilon tolerance to validation logic in `AddMoreContainerBody.jsx`.
This prevents "Red Border" validation errors when the calculated Total CBM is infinitesimally larger than the limit due to floating-point precision differences, especially when using the precise `Math.round` logic.
