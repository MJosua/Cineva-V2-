import React, { useEffect, useState } from "react";

import {
    useToast,
    Input,
    Select,
    FormControl,
    NumberInput,
    NumberInputField,
    Button,
    Tooltip,
    Checkbox,
} from "@chakra-ui/react";
import { AiFillCloseCircle } from "react-icons/ai";
import { useSelector } from "react-redux";
import { calculateFlavourCBM, calculateFlavourUnitCBM } from "../../../../utils/cbmCalculator";
import { resolveCBM, resolveMixedContainerLimit, resolveMaxQty, hasSpecificCBMRule } from "../../../../utils/containerRuleEngine";
import containerRules from "../../../../utils/containerRules";

const Flavour1_NonBulkcomponent = ({
    orderIndex,
    flavorIndex,
    flavour,
    containerIndex,
    removeFlavor,
    container,
    isPreviousFlavourEmpty,
    containerOrders,
    setContainerOrders,
    flavours,
    hasFlavorMoQError,
    isPreviousFlavourQtyEmpty,
    pallet,
    isNextFlavourEmpty,
    setSessionStorageTrigger,
    customable,
    company_id,
    sessionStorageTrigger,
    specialConditions = []
}) => {



    function toRoman(num) {
        if (typeof num !== 'number') return false;
        const romanNumerals = [
            { value: 1000, numeral: 'M' },
            { value: 900, numeral: 'CM' },
            { value: 500, numeral: 'D' },
            { value: 400, numeral: 'CD' },
            { value: 100, numeral: 'C' },
            { value: 90, numeral: 'XC' },
            { value: 50, numeral: 'L' },
            { value: 40, numeral: 'XL' },
            { value: 10, numeral: 'X' },
            { value: 9, numeral: 'IX' },
            { value: 5, numeral: 'V' },
            { value: 4, numeral: 'IV' },
            { value: 1, numeral: 'I' }
        ];

        let result = '';

        for (let i = 0; i < romanNumerals.length; i++) {
            while (num >= romanNumerals[i].value) {
                result += romanNumerals[i].numeral;
                num -= romanNumerals[i].value;
            }
        }

        return result;
    }


    const formatNumber = (value) => {
        if (value === '') return '';
        if (value === undefined) return '';
        return parseFloat(value).toLocaleString(); // Format number with commas
    };

    // REMOVED LOCAL MIXED RULES - Now handled by containerRuleEngine
    // const MIXED_CONTAINER_RULES = ...
    // const getMixedContainerRule = ...

    const handleFlavorQtyChange = (orderIndex, containerIndex, flavourIndex, value) => {
        const newOrders = [...containerOrders];
        const detail = newOrders[orderIndex]?.order.detail.containerList[containerIndex];
        let newLength = parseInt(value, 10) || 0;

        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});

        if (newLength < 0) newLength = 0;

        const selectedFlavor = flavorLookup[detail.Flavour[flavourIndex].sku];
        const selectedFlavor1 = flavorLookup[detail.Flavour[0].sku];
        const selectedFlavor2 = flavorLookup[detail.Flavour[1].sku];

        // 1. Initial Clamping based on single-flavor max
        if (flavorIndex === 0) {
            if (newLength > detail.Flavour[flavourIndex].qty_max) {
                newLength = detail.Flavour[flavourIndex].qty_max;
            }
        }

        // 2. Mixed Container Rule Check (Taiwan/Company 195)
        const contSize = containerOrders[orderIndex]?.order.detail?.cont_size;
        const mixedRule = (contSize === "4") ? resolveMixedContainerLimit({
            flavours: [selectedFlavor1, selectedFlavor2].filter(Boolean),
            companyId: company_id,
            rules: containerRules
        }) : null;

        if (mixedRule) {
            const MIXED_MAX = mixedRule.maxTotal;

            if (flavorIndex === 0) {
                if (newLength > MIXED_MAX) newLength = MIXED_MAX;

                const remainingQty = MIXED_MAX - newLength;
                detail.Flavour[1].qty = remainingQty.toString();
            } else if (flavorIndex === 1) {
                const usedQty = parseInt(detail.Flavour[0].qty || 0, 10);
                const maxAllowed = Math.max(0, MIXED_MAX - usedQty);
                if (newLength > maxAllowed) newLength = maxAllowed;
            }

            const qty = newLength === '' ? null : parseInt(newLength, 10);
            detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';
            setContainerOrders(newOrders);
            return;
        }

        // 3. Resolve Max Quantity Sum (e.g. China 3800 Rule)
        const maxQtySum = resolveMaxQty({
            flavours: [selectedFlavor1, selectedFlavor2].filter(Boolean),
            companyId: company_id,
            rules: containerRules
        });

        if (maxQtySum) {
            if (newLength > maxQtySum) newLength = maxQtySum;

            if (flavorIndex === 0) {
                const qty2 = parseInt(detail.Flavour[1].qty || 0, 10);
                if (newLength + qty2 > maxQtySum) {
                    const rem = Math.max(0, maxQtySum - newLength);
                    detail.Flavour[1].qty = rem > 0 ? rem.toString() : '0';
                }
            } else if (flavorIndex === 1) {
                const qty1 = parseInt(detail.Flavour[0].qty || 0, 10);
                const maxAllowed = Math.max(0, maxQtySum - qty1);
                if (newLength > maxAllowed) newLength = maxAllowed;
            }
        }

        // 4. Resolve CBM Limit
        const CBM_LIMIT = resolveCBM({
            flavours: [selectedFlavor1, selectedFlavor2].filter(Boolean),
            companyId: company_id,
            rules: containerRules,
            specialConditions: specialConditions
        });

        // 4. Standard Logic with CBM Limit
        // If customizing (no constraints), just set value
        if (detail.custom === true || detail.custom.toLocaleString() === "1") {
            if (newLength > detail.Flavour[flavourIndex].qty_max) {
                newLength = detail.Flavour[flavourIndex].qty_max;
            }
            detail.Flavour[flavourIndex].qty = newLength.toString();
            setContainerOrders(newOrders);
            return;
        }

        // 5. Auto-Balance Logic (Original Behavior)
        // If not custom, we must respect CBM limit

        // Determine available space
        const qty = newLength;

        if (flavorIndex === 0) {
            // Changing Flavor 1
            const cbm1 = calculateFlavourCBM({ sku: selectedFlavor1.product_code, qty: qty }, selectedFlavor1);
            const remainingCBM = CBM_LIMIT - cbm1;

            // Update Flavor 1
            detail.Flavour[0].qty = qty.toString();

            // Update Flavor 2 if it exists
            if (detail.Flavour[1].sku !== "-1") {
                const unitCbm2 = calculateFlavourUnitCBM(selectedFlavor2);

                // Skip rounding to 10 if specific CBM rule applies (e.g., Company 116)
                const useSpecificRule = hasSpecificCBMRule({
                    flavours: [selectedFlavor1, selectedFlavor2].filter(Boolean),
                    companyId: company_id,
                    rules: containerRules,
                    specialConditions: specialConditions
                });

                let finalQty2;
                if (useSpecificRule) {
                    // Use Math.round for specific CBM rules to handle floating-point precision
                    finalQty2 = unitCbm2 > 0 ? Math.round(remainingCBM / unitCbm2) : 0;
                } else {
                    // Default: floor and round to 10
                    const maxQty2FromCBM = unitCbm2 > 0 ? Math.floor(remainingCBM / unitCbm2) : 0;
                    finalQty2 = Math.floor(maxQty2FromCBM / 10) * 10;
                }
                if (finalQty2 < 0) finalQty2 = 0;

                // Check for "Same SKU Max Cap" special case (from original code: qtyMax1 === qtyMax2)
                const qtyMax1 = detail.Flavour[0].qty_max;
                const qtyMax2 = detail.Flavour[1].qty_max;

                if (qtyMax1 === qtyMax2 && qtyMax1 > 0) {
                    // Original logic for equal max qty (likely same product or group) was: max - qty1
                    // This overrides CBM calculation? The original code had an if/else.
                    // "qtyMax1 - qty" seems to imply a total quantity cap shared between them.
                    // But let's trust the CBM calc primarily unless it matches the specific legacy condition.
                    // Legacy: if (qtyMax1 === qtyMax2) detail.Flavour[1].qty = (qtyMax1 - qty)

                    finalQty2 = Math.min(finalQty2, qtyMax1 - qty); // Cap by shared limit if applicable
                }

                detail.Flavour[1].qty = finalQty2.toString();

                // Clear Flavor 3 if exists (legacy behavior)
                if (detail.Flavour.length === 3) detail.Flavour[2].qty = 0;
            }

        } else if (flavorIndex === 1) {
            // Changing Flavor 2 - Calculate C2
            const cbm2 = calculateFlavourCBM({ sku: selectedFlavor2.product_code, qty: qty }, selectedFlavor2);

            // In Flavor 2 change, we usually Check if it fits, or adjust Flavor 3?
            // Original logic for Index 1:
            // It calculates C2.
            // If length is 3, it calculates Flavor 3 from remaining CBM (CBM - C1 - C2).
            // If length is 2, it just sets the value?
            // Wait, original code for flavorIndex === 1:
            // "detail.Flavour[flavourIndex].qty = qty"
            // But it checks limits earlier?
            // Ah, line 168: if ([1, 2].includes(flavorIndex) ... check max qty)
            // But line 120 (flavorIndex === 1): It checks "batasMax" derived from Flavor 0 allowed space?

            // Re-implementing "Limit Checking" for Flavor 2:
            // Max Qty for Flavor 2 = (Limit - CBM1) / UnitCBM2
            const qty1 = parseInt(detail.Flavour[0].qty || 0, 10);
            const cbm1 = calculateFlavourCBM({ sku: selectedFlavor1.product_code, qty: qty1 }, selectedFlavor1);
            const remainingCBM = CBM_LIMIT - cbm1;
            const unitCbm2 = calculateFlavourUnitCBM(selectedFlavor2);

            let maxAllowedQty2;
            // Skip rounding to 10 if specific CBM rule applies
            const useSpecificRule2 = hasSpecificCBMRule({
                flavours: [selectedFlavor1, selectedFlavor2].filter(Boolean),
                companyId: company_id,
                rules: containerRules,
                specialConditions: specialConditions
            });
            if (useSpecificRule2) {
                // Use Math.round for specific CBM rules to handle floating-point precision
                maxAllowedQty2 = unitCbm2 > 0 ? Math.round(remainingCBM / unitCbm2) : 0;
            } else {
                // Default: floor and round to 10
                maxAllowedQty2 = unitCbm2 > 0 ? Math.floor(remainingCBM / unitCbm2) : 0;
                maxAllowedQty2 = Math.floor(maxAllowedQty2 / 10) * 10;
            }

            if (newLength > maxAllowedQty2) newLength = maxAllowedQty2;

            detail.Flavour[1].qty = newLength.toString();

            // Handle Flavor 3
            if (detail.Flavour.length === 3 && detail.Flavour[2].sku !== "-1") {
                const cbm2_new = calculateFlavourCBM({ sku: selectedFlavor2.product_code, qty: newLength }, selectedFlavor2);
                const remainingFor3 = CBM_LIMIT - cbm1 - cbm2_new;
                const f3 = flavorLookup[detail.Flavour[2].sku];
                const unitCbm3 = calculateFlavourUnitCBM(f3);

                let qty3;
                // Skip rounding to 10 if specific CBM rule applies
                const useSpecificRule3 = hasSpecificCBMRule({
                    flavours: [selectedFlavor1, selectedFlavor2, f3].filter(Boolean),
                    companyId: company_id,
                    rules: containerRules,
                    specialConditions: specialConditions
                });
                if (useSpecificRule3) {
                    // Use Math.round for specific CBM rules
                    qty3 = unitCbm3 > 0 ? Math.round(remainingFor3 / unitCbm3) : 0;
                } else {
                    // Default: floor and round to 10
                    qty3 = unitCbm3 > 0 ? Math.floor(remainingFor3 / unitCbm3) : 0;
                    qty3 = Math.floor(qty3 / 10) * 10;
                }
                if (qty3 < 0) qty3 = 0;

                detail.Flavour[2].qty = qty3.toString();
            }
        }

        setContainerOrders(newOrders);
    };

    const handleFlavorQtyChangeChina = (orderIndex, containerIndex, flavourIndex, value) => {
        const newOrders = [...containerOrders];
        const detail = newOrders[orderIndex]?.order.detail.containerList[containerIndex];
        let newLength = parseInt(value, 10) || 0;
        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        // Ensure the value is within the range 1 to 20
        if (newLength < 0) {
            newLength = 0;
        }

        const selectedFlavor = flavorLookup[detail.Flavour[flavourIndex].sku];
        const selectedFlavor1 = flavorLookup[detail.Flavour[0].sku];
        const selectedFlavor2 = flavorLookup[detail.Flavour[1].sku];


        if (flavorIndex === 0) {
            if (newLength > detail.Flavour[flavourIndex].qty_max) {
                newLength = detail.Flavour[flavourIndex].qty_max;
            }
        } else if (flavorIndex === 1 && (detail.custom === false || detail.custom.toLocaleString() === "0")) {
            const batasMax = Math.floor((detail.Flavour[0].qty
                ?
                (((66) - (detail.Flavour[0].qty
                    *
                    (((selectedFlavor1.ctn_height + 1)
                        *
                        (selectedFlavor1.ctn_length + 1)
                        *
                        (selectedFlavor1.ctn_width + 1))
                        /
                        1000000000)))
                    /
                    (((selectedFlavor1.ctn_height + 1)
                        *
                        (selectedFlavor1.ctn_length + 1)
                        *
                        (selectedFlavor1.ctn_width + 1))
                        /
                        1000000000)) / 10
                :
                0) < 0 ? 0 :
                (detail.Flavour[0].qty
                    ?
                    (((66) - (detail.Flavour[0].qty
                        *
                        (((selectedFlavor1.ctn_height + 1)
                            *
                            (selectedFlavor1.ctn_length + 1)
                            *
                            (selectedFlavor1.ctn_width + 1))
                            /
                            1000000000)))
                        /
                        (((selectedFlavor1.ctn_height + 1)
                            *
                            (selectedFlavor1.ctn_length + 1)
                            *
                            (selectedFlavor1.ctn_width + 1))
                            /
                            1000000000)) / 10
                    :
                    0)) * 10

            if (newLength > batasMax) {
                newLength = batasMax;
            }

        } else if ([1, 2].includes(flavorIndex) && (detail.custom === true || detail.custom.toLocaleString() === "1")) {
            if (newLength > detail.Flavour[flavourIndex].qty_max) {
                newLength = detail.Flavour[flavourIndex].qty_max;
            }

        }

        const qty = newLength === '' ? null : parseInt(newLength, 10);

        const qtyMax1 = detail.Flavour[0].qty_max;
        const qtyMax2 = detail.Flavour[1].qty_max;

        const qty1 = detail.Flavour[0].qty;
        const qty2 = detail.Flavour[1].qty;

        if (detail && detail.Flavour && detail.Flavour[flavourIndex] && (detail.custom === false || detail.custom.toLocaleString() === "0")) {

            if (flavorIndex === 0) {

                if (detail.Flavour[flavourIndex + 1].sku === "-1") {
                    detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';
                }
                else {

                    detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';



                    if (qtyMax1 === qtyMax2) {
                        const hitung =
                            qtyMax1 - qty
                        console.log(`Step 1 || ${qtyMax1} - ${qty} = ${hitung}`)

                        detail.Flavour[flavourIndex + 1].qty = qty !== null ? hitung.toString() : '';
                    } else {
                        const hitung =
                            qty / qtyMax1

                        const hitung2 =
                            1 - parseFloat(hitung.toFixed(2))

                        const hitung3 =
                            Math.floor(hitung2 * qtyMax2)

                        detail.Flavour[flavourIndex + 1].qty = qty !== null ? hitung3.toString() : '';
                        console.log(`Step 1 || ${qty} / ${qtyMax1} = ${hitung}`)
                        console.log(`Step 2 || 1 / ${parseFloat(hitung.toFixed(2))} = ${hitung2}`)
                        console.log(`Step 3 || ${hitung2} * ${qtyMax2} = ${hitung3}`)


                    }

                    if (detail.Flavour.length === 3) {
                        detail.Flavour[flavourIndex + 2].qty = qty !== null ? 0 : '';
                    }

                }
            } else if (flavourIndex === 1) {

                if (detail.Flavour.length === 3) {
                    detail.Flavour[flavourIndex + 1].qty = qty !== null ? (qtyMax2 - qty1 - qty).toString() : '';
                } else {
                    detail.Flavour[flavourIndex].qty = qty !== null ? (qty).toString() : '';

                }
            }

            setContainerOrders(newOrders);

        } else {
            detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';

            setContainerOrders(newOrders);
        }

    }

    const handleFlavorQtyPalletChange = (orderIndex, containerIndex, flavourIndex, value) => {

        let newLength = parseInt(value, 10) || 0;

        // Ensure the value is within the range 0 to 20
        if (containerOrders[orderIndex].order.detail.cont_size === "1") {
            if (newLength > 10) {
                newLength = 10;
            } else if (newLength < 0) {
                newLength = 0;
            }
        } else {
            if (newLength > 20) {
                newLength = 20;
            } else if (newLength < 0) {
                newLength = 0;
            }
        }

        // Ensure the value is within the range 1 to 20

        const newOrders = [...containerOrders];
        const qty = newLength === '' ? null : parseInt(newLength, 10);
        const flavor = newOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[flavorIndex]
        const nextFlavour = newOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[flavorIndex + 1]
        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        const detail = newOrders[orderIndex]?.order.detail.containerList[containerIndex];
        const selectedFlavor = flavorLookup[flavor.sku];
        // if (flavorIndex === 0) {

        const contSize = containerOrders[orderIndex]?.order.detail?.cont_size;
        const palletQty = contSize === "1" ? 10 : 20;


        if (detail && detail.Flavour && detail.Flavour[flavourIndex]) {
            detail.Flavour[flavourIndex].palete_qty = qty !== null ? qty.toString() : '';
            detail.Flavour[flavourIndex].qty = qty !== null ? qty * selectedFlavor.qty_per_pallet : '';
            detail.Flavour[flavourIndex].qty_perpallet = selectedFlavor.qty_perpallet;
            nextFlavour.palete_qty = qty !== null ? (palletQty - qty).toString() : '';
            nextFlavour.qty = (palletQty - qty) * nextFlavour.qty_perpallet;
            setContainerOrders(newOrders);
        }

        setContainerOrders(newOrders);



        // } 

    };

    const handleFlavourChange = (flavorIndex, containerIndex, orderIndex, value, flavourtollingid, flavorLength) => {
        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        const selectedFlavor = flavorLookup[value];
        const newOrders = [...containerOrders];
        const container = newOrders[orderIndex]?.order.detail.containerList[containerIndex];
        const flavour = container?.Flavour[flavorIndex];
        const nextFlavour = container?.Flavour[flavorIndex + 1];
        const previousFlavour = container?.Flavour[flavorIndex - 1];
        const firstFlavour = container?.Flavour[0];
        const contSize = newOrders[orderIndex]?.order.detail?.cont_size;

        if (!flavour) return;

        const updateFlavour = (flavour, sku, qty_perpallet, qty, qty_max, moq, palete_qty = 0) => {
            Object.assign(flavour, { sku, Flavour_tollingID: flavourtollingid, qty_perpallet, qty, qty_max, moq, palete_qty });
        };

        const getContainerCapacity = (flavor, size) => {
            if (size === "1") return { qty: flavor.cont20, moq: flavor.moq20 };
            if (size === "2") return { qty: flavor.cont40, moq: flavor.moq };
            if (size === "4") return { qty: flavor.cont40hc, moq: flavor.moq };
            return { qty: "", moq: "" };
        };



        console.log("Selected flavor", selectedFlavor)


        if (value === "-1") {
            if (flavorIndex === 0) {
                // Reset all flavours when the first one is set to -1
                container?.Flavour.forEach((flavour) => {
                    flavour.sku = "-1";
                    flavour.Flavour_tollingID = 0;
                    flavour.qty = "0";
                    flavour.qty_perpallet = 0;
                    flavour.qty_max = "";
                    flavour.palete_qty = 0;
                });
            } else {
                // Only update the current and next flavour normally
                updateFlavour(flavour, value, 0, "0", "", "", 0);
                if (nextFlavour) updateFlavour(nextFlavour, value, 0, "0", "", "", 0);

                // If it's the second flavour, restore the previous one
                if (flavorIndex !== 0 && previousFlavour) {
                    previousFlavour.qty = previousFlavour.qty_max;
                }
                if (flavorIndex !== 1 && flavorIndex !== 0 && previousFlavour) {
                    previousFlavour.qty = 0;
                }
            }
        } else {
            let { qty, moq } = getContainerCapacity(selectedFlavor, contSize);
            let pengaliPalet = selectedFlavor?.qty_per_pallet;

            // SPECIAL RULE: 3840 (Dry) + 4182 (Soup) combination => MOQ 1920
            const SKU_DRY = "3840";
            const SKU_SOUP = "4182";
            let isSpecialPair = false;

            if (flavorIndex === 1 && previousFlavour) {
                // Check if current + prev form the pair
                const prevSku = previousFlavour.sku;
                const currSku = value;
                if (
                    (prevSku === SKU_DRY && currSku === SKU_SOUP) ||
                    (prevSku === SKU_SOUP && currSku === SKU_DRY)
                ) {
                    isSpecialPair = true;
                }
            } else if (flavorIndex === 0 && nextFlavour && nextFlavour.sku !== "-1") {
                // Check if current + next form the pair (less likely trigger order but good for safety)
                const nextSku = nextFlavour.sku;
                const currSku = value;
                if (
                    (nextSku === SKU_DRY && currSku === SKU_SOUP) ||
                    (nextSku === SKU_SOUP && currSku === SKU_DRY)
                ) {
                    isSpecialPair = true;
                }
            }

            if (isSpecialPair) {
                moq = 1920;
            }

            // Check for Taiwan mixed container rule when selecting second flavour
            if (flavorIndex === 1 && contSize === "4" && previousFlavour) {
                const prevFlavorData = flavorLookup[previousFlavour.sku];
                // Using rule engine for mixed limit
                const mixedRule = resolveMixedContainerLimit({
                    flavours: [prevFlavorData, selectedFlavor].filter(Boolean),
                    companyId: company_id,
                    rules: containerRules
                });

                if (mixedRule) {
                    const MIXED_MAX = mixedRule.maxTotal;

                    // RESET FLAVOR 1 to MAX (User Requirement)
                    if (previousFlavour) {
                        previousFlavour.qty = previousFlavour.qty_max;
                    }

                    // Set Flavor 2 to 0
                    updateFlavour(flavour, value, 0, "0", MIXED_MAX, moq, 0);
                    setContainerOrders(newOrders);
                    return;
                }
            }

            if (pallet === 0) {
                updateFlavour(flavour, value, 0, flavorIndex === 0 ? qty : "0", qty, moq, 0);
                if (flavorIndex !== 0 && previousFlavour) {

                    container?.Flavour.slice(1).forEach((flavour) => {
                        flavour.qty = "0";
                    });

                    firstFlavour.qty = firstFlavour.qty_max;
                    if (flavorIndex === 1) { // If Flavor 2 is changed
                        // Reset Flavor 1 to its max
                        if (previousFlavour) {
                            previousFlavour.qty = previousFlavour.qty_max;
                        }
                        // Set current (Flavor 2) to 0
                        flavour.qty = "0";
                    }
                }

                if (flavorIndex === 0 && nextFlavour) {
                    container?.Flavour.slice(1).forEach((flavour) => {
                        flavour.qty = "0";
                    });
                }
            } else {
                const palletQty = contSize === "1" ? 10 : 20;

                if (flavorIndex !== 0 && previousFlavour) {
                    updateFlavour(flavour, value, pengaliPalet, 0, qty, moq, palletQty);
                    //perhatikan
                    previousFlavour.qty = palletQty * previousFlavour.qty_perpallet;
                    previousFlavour.palete_qty = palletQty;
                } else {
                    updateFlavour(flavour, value, pengaliPalet, palletQty * pengaliPalet, qty, moq, palletQty);
                }

                if (nextFlavour) {
                    updateFlavour(nextFlavour, 0, "-1", "0", "", "", 0);
                }
            }
        }

        setContainerOrders(newOrders);
    };


    const handleSetCustom = (orderIndex, containerIndex) => {
        const newOrders = [...containerOrders];
        const container = newOrders[orderIndex]?.order.detail.containerList[containerIndex];

        Object.assign(container, { custom: !container.custom });
        setContainerOrders([...containerOrders]);

        if (container.custom === false) {
            if (container.Flavour?.[0]) {
                container.Flavour[0].qty = '';
                container.Flavour[0].sku = '';

            }
            if (container.Flavour?.[1]) {
                container.Flavour[1].qty = '';
                container.Flavour[1].sku = '';

            }
            if (container.Flavour?.[2]) {
                container.Flavour[2].qty = '';
                container.Flavour[2].sku = '';

            }
        }
        setContainerOrders(newOrders);
        setSessionStorageTrigger(prevState => !prevState)

    }

    useEffect(() => {
        setContainerOrders(prevOrders => {
            const newOrders = prevOrders.map((order, orderIndex) => {
                const summary = {};

                // Summarize containerList Flavours only if bulk is not true
                if (!order.order.detail.bulk) {
                    order.order.detail.containerList.forEach(container => {
                        container.Flavour.forEach(flavour => {
                            const sku = flavour.sku;
                            const qty = parseInt(flavour.qty, 10);
                            const moq = flavour.moq;

                            if (summary[sku]) {
                                summary[sku].qty += qty;
                                summary[sku].moq = moq;  // Assuming `moq` is consistent for the same SKU
                            } else {
                                summary[sku] = { qty, moq };
                            }
                        });
                    });
                }

                // Summarize bulkList Flavours if bulk is true
                if (order.order.detail.bulk) {
                    order.order.detail.bulkList.Flavour.forEach(flavour => {
                        const sku = flavour.sku;
                        const qty = parseInt(flavour.qty, 10);
                        const moq = flavour.moq;

                        if (summary[sku]) {
                            summary[sku].qty += qty;
                            summary[sku].moq = moq;  // Assuming `moq` is consistent for the same SKU
                        } else {
                            summary[sku] = { qty, moq };
                        }
                    });
                }

                // Convert summary into the required format
                const summaryArray = {
                    detail_id: (orderIndex + 1).toString(),
                    Flavour: Object.keys(summary).filter(sku => summary[sku].qty > 0).map(sku => ({
                        sku,
                        qty: summary[sku].qty.toString(),
                        moq: summary[sku].moq
                    }))
                };

                // Update the order with the new summary
                return {
                    ...order,
                    order: {
                        ...order.order,
                        summary: summaryArray
                    }
                };
            });

            // Optionally, store the updated orders in session storage

            return newOrders;
        });
    }, [sessionStorageTrigger]);

    return (
        <>
            <div className={`
                col-12 position-absolute start-0 px-2 py-2 d-flex justofy-content-start top-0 
                ${containerOrders[orderIndex].order.detail.containerList[containerIndex].custom === false || containerOrders[orderIndex].order.detail.containerList[containerIndex].custom.toLocaleString() === "0" ? "text-disabled2 " : ""}
                ${customable ? "" : "d-none"}
                
                `}>
                <Checkbox
                    isChecked={containerOrders[orderIndex].order.detail.containerList[containerIndex].custom === true || containerOrders[orderIndex].order.detail.containerList[containerIndex].custom === 1}
                    onChange={() => { handleSetCustom(orderIndex, containerIndex) }}

                >
                    <div className="pointer">Custom Mode</div>
                </Checkbox>
            </div >

            <div className={
                (flavorIndex === 0 && containerOrders[orderIndex]?.order.detail.cont_size === "1" && container.custom === false || container.custom === "0") || (container.custom === true) || containerOrders[orderIndex]?.order.detail.cont_size === "2" || containerOrders[orderIndex]?.order.detail.cont_size === "4"
                    ?
                    "row d-flex mx-2 mt-1 position-relative"
                    :
                    "d-none"
            }
            >
                <div className="grey_text_bold fs-6 d-flex col-12 col-md-2 mt-1">
                    Flavour {toRoman(flavorIndex + 1)}&nbsp;
                    {flavorIndex === 0 ?
                        <span className="color_red">
                            *
                        </span>
                        :
                        ""
                    }
                </div>



                <div className="col-8 col-md-6">
                    <Select
                        className={`grey_text fs-6 ${hasFlavorMoQError ? 'border-danger' : 'border'}`}
                        size="sm"
                        onChange={(e) => {
                            const selectedOption = e.target.options[e.target.selectedIndex];
                            const flavourtollingid = selectedOption.getAttribute('flavourtollingid');
                            const flavorLength = containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.length;
                            handleFlavourChange(flavorIndex, containerIndex, orderIndex, selectedOption.value, flavourtollingid, flavorLength);
                            setSessionStorageTrigger(prevState => !prevState)

                        }}
                        value={containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].sku}
                        isDisabled={isPreviousFlavourEmpty()}
                    >
                        <option value={-1}>Choose Flavour</option>
                        {flavours
                            .sort((a, b) =>
                                (a.cat_name ?? '').localeCompare(b.cat_name ?? '')
                            )
                            .filter((flavourlist, flavourlistIndex) => {
                                // Fungsi ini untuk memfilter flavour yang tersedia ( saat ini di set 1, sampai 3 belum dinamis) --Yosua 
                                const tolling_id = flavourlist.tolling_id;




                                const selectedFlavors1 =
                                    containerOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[0]?.sku || "";
                                const selectedFlavors2 =
                                    containerOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[1]?.sku || "";
                                const selectedFlavors3 =
                                    containerOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[2]?.sku || "";

                                if (flavorIndex === 0) {
                                    return true;
                                }


                                if (flavorIndex === 1) {
                                    return String(flavourlist.product_code) !== String(selectedFlavors1);
                                }

                                if (flavorIndex === 2) {
                                    return String(flavourlist.product_code) !== String(selectedFlavors1) &&
                                        String(flavourlist.product_code) !== String(selectedFlavors2);
                                }

                                if (flavorIndex === 3) {
                                    return String(flavourlist.product_code) !== selectedFlavors1 &&
                                        String(flavourlist.product_code) !== selectedFlavors2 &&
                                        String(flavourlist.product_code) !== selectedFlavors3;
                                }

                            })
                            .map((flavourlist, index) => {
                                const selectedFlavors = containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.map(f => f.sku);

                                // Exclude the already selected flavors
                                if (selectedFlavors.includes(flavourlist.product_code)) {
                                    return null;
                                }

                                // Check tolling ID condition if flavorIndex is not 0
                                if (flavorIndex !== 0) {
                                    const flavor0tolling = containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[0].Flavour_tollingID ? parseInt(containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[0].Flavour_tollingID) : 0;

                                    if (flavourlist.tolling_id === flavor0tolling) {
                                        return (
                                            <option
                                                key={index}
                                                value={flavourlist.product_code}
                                                flavourtollingid={flavourlist.tolling_id}
                                            >
                                                {flavourlist.product_name_complete}
                                            </option>
                                        );
                                    }
                                } else {
                                    // Render the option if flavorIndex is 0
                                    return (
                                        <option
                                            key={index}
                                            value={flavourlist.product_code}
                                            flavourtollingid={flavourlist.tolling_id}
                                        >
                                            {flavourlist.product_name_complete}
                                        </option>
                                    );
                                }

                                return null; // Default case where no option is returned
                            })
                        }
                    </Select>
                </div>




                {pallet === 1 ?
                    <div className="col-4 col-md-2">
                        <FormControl>
                            <NumberInput
                                size="sm"
                                value={flavour.palete_qty}
                            >

                                <NumberInputField
                                    className={`grey_text fs-6 text-center form-control px-1  ${hasFlavorMoQError ? 'border-danger' : 'border'}`}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/,/g, ''); // Remove commas from input
                                        if (!isNaN(value)) { // Check if the value is a valid number
                                            handleFlavorQtyPalletChange(orderIndex, containerIndex, flavorIndex, value); // Update state
                                        }
                                        setSessionStorageTrigger(prevState => !prevState)
                                    }}
                                    disabled={isPreviousFlavourQtyEmpty() || flavorIndex !== 0 || (flavorIndex === 0 && isNextFlavourEmpty()) || flavour.sku === "-1"}
                                />
                            </NumberInput>
                        </FormControl>

                    </div>

                    :
                    ""
                }

                <div className="col-4 col-md-2">
                    <FormControl>
                        <NumberInput
                            size="sm"
                            value={formatNumber(flavour.qty)}

                        >

                            <NumberInputField
                                className={`grey_text fs-6 text-center form-control px-1  ${hasFlavorMoQError ? 'border-danger' : 'border'}`}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/,/g, ''); // Remove commas from input
                                    if (!isNaN(value)) { // Check if the value is a valid number
                                        handleFlavorQtyChange(orderIndex, containerIndex, flavorIndex, value); // Update state
                                    }
                                    setSessionStorageTrigger(prevState => !prevState)

                                }}
                                onBlur={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, '');
                                    let currentVal = parseInt(rawValue) || 0;

                                    // SPECIAL RULE: 3840 (Dry) + 4182 (Soup) => MOQ 1920 on Blur
                                    const SKU_DRY = "3840";
                                    const SKU_SOUP = "4182";
                                    let isSpecialPair = false;

                                    const thisFlavor = container.Flavour[flavorIndex];
                                    const prevFlavor = container.Flavour[flavorIndex - 1];
                                    const nextFlavor = container.Flavour[flavorIndex + 1];

                                    if (thisFlavor) {
                                        const mySku = thisFlavor.sku;

                                        if (mySku === SKU_DRY || mySku === SKU_SOUP) {
                                            // Check Previous
                                            if (prevFlavor && (prevFlavor.sku === SKU_DRY || prevFlavor.sku === SKU_SOUP) && prevFlavor.sku !== mySku) {
                                                isSpecialPair = true;
                                            }
                                            // Check Next
                                            if (nextFlavor && (nextFlavor.sku === SKU_DRY || nextFlavor.sku === SKU_SOUP) && nextFlavor.sku !== mySku) {
                                                isSpecialPair = true;
                                            }
                                        }
                                    }

                                    if (isSpecialPair && currentVal > 0 && currentVal < 1920) {
                                        handleFlavorQtyChange(orderIndex, containerIndex, flavorIndex, "1920");
                                    }
                                }}
                                disabled={(
                                    (container.custom === false || container.custom === "false" || container.custom.toLocaleString() === "0") && isPreviousFlavourQtyEmpty())
                                    ||
                                    isPreviousFlavourEmpty()
                                    ||
                                    pallet === 1
                                    ||
                                    ((container.custom === false || container.custom === "false" || container.custom.toLocaleString() === "0") && flavorIndex === 0 && isNextFlavourEmpty())
                                    ||
                                    ((container.custom === false || container.custom === "false" || container.custom.toLocaleString() === "0") && container.Flavour.length === 2 && flavorIndex === 1)
                                    ||
                                    flavour.sku === "-1"

                                }

                            />
                        </NumberInput>
                    </FormControl>

                </div>
                {containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].sku !== "-1" ?
                    <>
                        <div className="row">
                            <div className="col-4 col-md-2"></div>

                            <div className="d-flex red_info_text col-6 ps-4">

                                {containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].qty_max ?
                                    ` * Container Load : ${containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].qty_max.toLocaleString()} ctns `
                                    :
                                    ``
                                }
                                {containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].moq ?
                                    ` | * MOQ : ${containerOrders[orderIndex].order.detail.containerList[containerIndex].Flavour[flavorIndex].moq.toLocaleString()} ctns `
                                    :
                                    ``
                                }
                            </div>
                        </div>


                    </>
                    :
                    ""
                }
                <button
                    className={flavorIndex !== 0 && flavorIndex !== 1 ? " position-absolute top-0 end-0 mt-md-1 mt-4  translate-middle" : "d-none"}
                    onClick={() => removeFlavor(orderIndex, containerIndex, flavorIndex)}
                    style={{ width: 20 }}
                    disabled={
                        container.Flavour[flavorIndex].length === 3}
                >
                    <AiFillCloseCircle
                        className="text-danger"
                        size={20}
                    />
                </button>
            </div >
        </>
    );
};

export default Flavour1_NonBulkcomponent;




