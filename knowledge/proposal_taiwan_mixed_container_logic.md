# Proposal: Taiwan (company_id: 106) Mixed Container Control

**Created:** 2026-01-27  
**Status:** Proposed  
**Reference File:** `refrences/test.js`

---

## Background

Currently in `handleFlavorQtyChange` (line 178-185), there's a special CBM override:

```javascript
let CBM;

if (((detail.Flavour[0].sku === "401538" && detail.Flavour[1].qty_max === 4708) || 
     (detail.Flavour[1].sku === "401538" && detail.Flavour[0].qty_max === 4708))
) {
    CBM = 63.31461;
} else {
    CBM = 66;
}
```

This logic is not company-specific and applies globally.

---

## Proposed New Feature

### Objective
Create a **Taiwan-specific** (company_id: 106) mixed container logic that caps the total qty when two specific SKUs are combined.

### Conditions
| Condition | Value |
|-----------|-------|
| Company ID | `106` (Taiwan) |
| Container Size | `cont40hc` (size = "4") |
| SKU A `cont40hc` | `3840` |
| SKU B `cont40hc` | `4182` |

### Behavior
When **company_id === 106** and container is `40HC`:
- If Flavour[0] has `selectedFlavor.cont40hc === 3840` AND Flavour[1] has `selectedFlavor.cont40hc === 4182` (or vice versa)
- Then: **Max total qty (Flavour[0].qty + Flavour[1].qty) = 3920**

### Logic Flow
```
1. Check if company_id === 106
2. Check if cont_size === "4" (40HC container)
3. Get cont40hc values for both selected flavours
4. If (cont40hc_A === 3840 AND cont40hc_B === 4182) OR (cont40hc_A === 4182 AND cont40hc_B === 3840):
   - Apply mixed max logic: total_qty <= 3920
   - Adjust qty_max dynamically based on other flavour's qty
5. Else:
   - Use normal qty_max from flavour data
```

---

## Where to Implement

### Primary Location: `handleFlavorQtyChange`
- Add company_id check at the start
- Before calculating CBM or qty limits, check for the mixed container condition

### Affected Functions
| Function | Purpose |
|----------|---------|
| `handleFlavorQtyChange` | Main qty calculation for non-bulk |
| `handleFlavorQtyChangeChina` | Similar function but for China logic |
| `handleFlavourChange` | Sets initial qty_max when flavour is selected |

---

## Access Pattern

The `cont40hc` value is accessed via:
```javascript
const flavorLookup = flavours.reduce((lookup, flavor) => {
    lookup[flavor.product_code] = flavor;
    return lookup;
}, {});

const selectedFlavor1 = flavorLookup[detail.Flavour[0].sku];
const selectedFlavor2 = flavorLookup[detail.Flavour[1].sku];

// Access cont40hc:
selectedFlavor1.cont40hc  // e.g., 3840
selectedFlavor2.cont40hc  // e.g., 4182
```

---

## Pseudo-code Implementation

```javascript
// Inside handleFlavorQtyChange, after getting selectedFlavor1 and selectedFlavor2

const TAIWAN_COMPANY_ID = 106;
const CONT40HC_A = 3840;
const CONT40HC_B = 4182;
const MIXED_MAX_QTY = 3920;

let isTaiwanMixedContainer = false;

if (company_id === TAIWAN_COMPANY_ID && contSize === "4") {
    const cont40hc_A = selectedFlavor1?.cont40hc;
    const cont40hc_B = selectedFlavor2?.cont40hc;
    
    if ((cont40hc_A === CONT40HC_A && cont40hc_B === CONT40HC_B) ||
        (cont40hc_A === CONT40HC_B && cont40hc_B === CONT40HC_A)) {
        isTaiwanMixedContainer = true;
    }
}

if (isTaiwanMixedContainer) {
    // For Flavour[0]: max = MIXED_MAX_QTY
    // For Flavour[1]: max = MIXED_MAX_QTY - Flavour[0].qty
    
    if (flavorIndex === 0) {
        if (newLength > MIXED_MAX_QTY) {
            newLength = MIXED_MAX_QTY;
        }
        // Auto-calculate Flavour[1] qty
        const remainingQty = MIXED_MAX_QTY - newLength;
        detail.Flavour[1].qty = remainingQty.toString();
    } else if (flavorIndex === 1) {
        const maxAllowed = MIXED_MAX_QTY - parseInt(detail.Flavour[0].qty || 0);
        if (newLength > maxAllowed) {
            newLength = maxAllowed;
        }
    }
}
```

---

## Confirmed Requirements

| Question | Answer |
|----------|--------|
| Combined vs Individual cap | **Combined** - The 3920 is a cap for `Flavour[0].qty + Flavour[1].qty`. Second flavour with 0 qty wouldn't happen in practice. |
| Apply to `handleFlavourChange`? | **Yes** - Must also validate when initially selecting flavour. |
| Other cont40hc pairs? | **Maybe** - Keep logic extensible for future pairs. |

---

## Implementation Scope

### Functions to Modify:
1. **`handleFlavorQtyChange`** - Apply mixed cap when user changes qty
2. **`handleFlavourChange`** - Set correct initial qty_max when selecting flavour

### Suggested Design (Extensible)
```javascript
// Configuration for company-specific mixed container rules
const MIXED_CONTAINER_RULES = {
    106: { // Taiwan
        pairs: [
            { cont40hc_A: 3840, cont40hc_B: 4182, maxTotal: 3920 }
        ]
    }
    // Future: add more companies/pairs here
};

function getMixedContainerRule(company_id, cont40hc_A, cont40hc_B) {
    const companyRules = MIXED_CONTAINER_RULES[company_id];
    if (!companyRules) return null;
    
    return companyRules.pairs.find(rule => 
        (rule.cont40hc_A === cont40hc_A && rule.cont40hc_B === cont40hc_B) ||
        (rule.cont40hc_A === cont40hc_B && rule.cont40hc_B === cont40hc_A)
    );
}
```

---

## Other Companies

Other companies (not 106) will NOT be affected by this logic. They will continue to use:
- Standard qty_max from flavour data
- Existing CBM calculations (66 or 63.31461 for specific SKU conditions)
