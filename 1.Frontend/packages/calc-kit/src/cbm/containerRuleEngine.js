/**
 * @hots/calc-kit — CBM / qty / mixed-load rule resolvers (rules passed in as a parameter)
 * Head: src/index.js
 * Source: E-Order/src/utils/containerRuleEngine.js (copied 2026-10-06, logic unchanged; BOM/CRLF and garbled emoji comments cleaned). E-Order unchanged.
 */
// Type resolver (derived from data)
export function resolveSkuType(flavour) {
    if (!flavour?.cont40hc) return null;

    if (flavour.cont40hc >= 4100) return "soup";
    if (flavour.cont40hc <= 3900) return "dry";

    return "unknown";
}

// CBM resolver
export function resolveCBM({ flavours, companyId, rules, specialConditions = [] }) {
    // 1. Dynamic Mixing Load Rule (Special Condition ID 23)
    // Rule format: { "loadA": 4545, "loadB": 4708, "limit": 63.31461 }
    const mixingRules = (specialConditions || []).filter(c => String(c.id) === "23");
    
    if (mixingRules.length > 0 && flavours.length === 2) {
        const loads = flavours.map(f => Number(f.cont40hc));
        
        for (const rule of mixingRules) {
            try {
                const config = typeof rule.value === 'string' ? JSON.parse(rule.value) : rule.value;
                if (config && config.loadA && config.loadB && config.limit) {
                    const loadA = Number(config.loadA);
                    const loadB = Number(config.loadB);

                    const hasA = loads.includes(loadA);
                    const hasB = loads.includes(loadB);

                    if (hasA && hasB) {
                        return Number(config.limit);
                    }
                }
            } catch (e) {
                console.error("Failed to parse Mixing Load Rule (ID 23):", e);
            }
        }
    }

    // 2. Same Load Exception: If all active flavours have identical 40HC capacity, trust the Quantity Limit, not CBM.
    const activeFlavours = flavours.filter(f => f && Number(f.cont40hc) > 0);
    if (activeFlavours.length >= 2) {
        const firstLoad = Number(activeFlavours[0].cont40hc);
        const isAllSameLoad = activeFlavours.every(f => Number(f.cont40hc) === firstLoad);
        if (isAllSameLoad) {
            return 100; // Return high CBM to effectively disable the CBM check
        }
    }

    const companyRules = rules.companies[companyId]?.cbmRules || [];

    for (const rule of companyRules) {
        const skuMatch = flavours.some(f =>
            rule.when.skuPair.includes(String(f.product_code))
        );

        if (skuMatch) {
            return rule.then.cbm;
        }
    }

    return rules.default.cbm;
}


// Quantity cap resolver
export function resolveMaxQty({ flavours, companyId, rules }) {
    const companyRules = rules.companies[companyId]?.qtyRules || [];

    const flavourTypes = flavours
        .map(resolveSkuType)
        .filter(Boolean)
        .sort()
        .join(",");

    for (const rule of companyRules) {
        const ruleTypes = [...rule.when.skuTypes].sort().join(",");
        if (flavourTypes === ruleTypes) {
            return rule.then.maxQtySum;
        }
    }

    return null;
}

export function resolveMixedContainerLimit({ flavours, companyId, rules }) {
    if (!flavours || flavours.length < 2) return null;

    const f1 = flavours[0];
    const f2 = flavours[1];

    if (!f1 || !f2 || f1.sku === "-1" || f2.sku === "-1") return null;

    const companyRules = rules.companies[companyId];
    if (!companyRules || !companyRules.mixedRules) return null;

    for (const ruleGroup of companyRules.mixedRules) {
        const match = ruleGroup.pairs.find(pair => {
            const matchA_B = pair.cont40hc_A === f1.cont40hc && pair.cont40hc_B === f2.cont40hc;
            const matchB_A = pair.cont40hc_A === f2.cont40hc && pair.cont40hc_B === f1.cont40hc;
            return matchA_B || matchB_A;
        });

        if (match) {
            return {
                type: 'MIXED_LIMIT',
                maxTotal: match.maxTotal,
                pair: match
            };
        }
    }

    return null;
}

// Specific CBM Rule detector (used to skip rounding to 10)
export function hasSpecificCBMRule({ flavours, companyId, rules, specialConditions = [] }) {
    const companyRules = rules.companies[companyId]?.cbmRules || [];

    for (const rule of companyRules) {
        const skuMatch = flavours.some(f =>
            rule.when.skuPair.includes(String(f.product_code))
        );

        if (skuMatch) {
            return true;  // Specific rule found - skip rounding
        }
    }

    // Check Special Conditions (e.g., ID 23, 25)
    const hasMixingRule = (specialConditions || []).some(c => String(c.id) === "23" || String(c.id) === "25");
    if (hasMixingRule && flavours.length === 2) {
        return true; // Skip rounding for dynamic mixing/ratio rules
    }

    return false;  // Using default CBM (66) - apply rounding
}




