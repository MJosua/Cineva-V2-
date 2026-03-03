// 1ï¸âƒ£ Type resolver (derived from data)
export function resolveSkuType(flavour) {
    if (!flavour?.cont40hc) return null;

    if (flavour.cont40hc >= 4100) return "soup";
    if (flavour.cont40hc <= 3900) return "dry";

    return "unknown";
}

// 2ï¸âƒ£ CBM resolver
export function resolveCBM({ flavours, companyId, rules }) {
    // 1. Same Load Exception: If flavours have identical 40HC capacity, trust the Quantity Limit, not CBM.
    if (flavours.length === 2 && flavours[0]?.cont40hc && flavours[1]?.cont40hc) {
        if (flavours[0].cont40hc === flavours[1].cont40hc) {
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


// 3ï¸âƒ£ Quantity cap resolver
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

// 4ï¸âƒ£ Specific CBM Rule detector (used to skip rounding to 10)
export function hasSpecificCBMRule({ flavours, companyId, rules }) {
    const companyRules = rules.companies[companyId]?.cbmRules || [];

    for (const rule of companyRules) {
        const skuMatch = flavours.some(f =>
            rule.when.skuPair.includes(String(f.product_code))
        );

        if (skuMatch) {
            return true;  // Specific rule found - skip rounding
        }
    }

    return false;  // Using default CBM (66) - apply rounding
}




