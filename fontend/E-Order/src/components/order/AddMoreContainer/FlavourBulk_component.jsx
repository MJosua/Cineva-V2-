import React, { useMemo, useState } from "react";
import {
    Select,
    FormControl,
    NumberInput,
    NumberInputField,
    Tooltip,
} from "@chakra-ui/react";
import { calculateFlavourCBM, calculateFlavourUnitCBM } from "../../../utils/cbmCalculator";
import { resolveCBM } from "../../../utils/containerRuleEngine";
import containerRules from "../../../utils/containerRules";

/* ==========================
   CONSTANTS
========================== */
const PALLET_QTY_20 = 10;
const PALLET_QTY_40 = 20;



// Replaced hardcoded constants with Rule Engine logic
// const DEFAULT_CBM = 66;
// const SPECIAL_CBM = 63.31461;
// const CBM_DIVISOR = 1_000_000_000;

/* ==========================
   FLAVOUR BEHAVIOUR CONFIG
========================== */


const getDraftKey = (orderIdx, flavourIdx) =>
    `${orderIdx}_${flavourIdx}`;

const FLAVOUR_BEHAVIOUR = {
    0: { affects: [1, 2], resetOnClear: true },
    1: { affects: [0, 1, 2], resetOnClear: true },
    2: { affects: [0, 1, 2], resetOnClear: true },
};

/* ==========================
   UTILS
========================== */
const formatNumber = (v) => (v === "" || v == null ? "" : Number(v).toLocaleString());

const toRoman = (num) => {
    const map = [
        [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
        [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
        [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
    ];
    let res = "";
    for (const [v, s] of map) while (num >= v) { res += s; num -= v; }
    return res;
};



// Replaced local calcCBM with imported utils
// const calcCBM = (f, qty) => ...

const resetFlavour = (f) => ({
    ...f,
    sku: "-1",
    Flavour_tollingID: 0,
    qty: "0",
    qty_real: "0",
    qty_max: "",
    palete_qty: 0,
    qty_perpallet: 0,
    moq: 0,
});

const getContainerRule = (size, f) => {
    if (size === "1") return { max: f.cont20, moq: f.moq20 };
    if (size === "2") return { max: f.cont40, moq: f.moq };
    if (size === "4") return { max: f.cont40hc, moq: f.moq };
    return { max: 0, moq: 0 };
};

/* ==========================
   COMPONENT
========================== */
const Flavour1_Bulkcomponent = ({
    flavorIndex,
    orderIndex,
    flavour,
    containerOrders,
    setContainerOrders,
    flavours,
    pallet,
    isPreviousFlavourEmpty,
    isPreviousFlavourQtyEmpty,
    isNextFlavourEmpty,
    hasFlavorMoQError,

    setSessionStorageTrigger,
    company_id,
}) => {
    const [draftQty, setDraftQty] = useState({});

    /* lookup */
    const flavourLookup = useMemo(
        () => Object.fromEntries(flavours.map(f => [f.product_code, f])),
        [flavours]
    );

    /* ==========================
       FLAVOUR SELECT CHANGE
    ========================== */
    const handleFlavourChange = (idx, orderIdx, value, tollingID) => {
        setContainerOrders(prev => {
            const orders = structuredClone(prev);
            const detail = orders[orderIdx]?.order.detail;
            if (!detail) return prev;

            const arr = detail.bulkList.Flavour;
            const behaviour = FLAVOUR_BEHAVIOUR[idx];
            const current = arr[idx];

            // RESET
            if (value === "-1") {
                arr[idx] = resetFlavour(current);

                if (behaviour?.resetOnClear) {
                    behaviour.affects.forEach(i => {
                        if (arr[i]) arr[i] = resetFlavour(arr[i]);
                    });
                }
                return orders;
            }

            const selected = flavourLookup[value];
            if (!selected) return prev;

            const contQty = detail.cont_qty;
            const contSize = detail.cont_size;

            // NON PALLET
            if (pallet === 0) {
                const { max, moq } = getContainerRule(contSize, selected);

                arr[idx] = {
                    ...current,
                    sku: value,
                    Flavour_tollingID: tollingID,
                    qty: max * contQty,
                    qty_real: max,
                    qty_max: max,
                    moq,
                };

                behaviour.affects.forEach(i => {
                    if (arr[i]) {
                        arr[i].qty = "0";
                        arr[i].qty_real = "0";
                    }
                });

                return orders;
            }

            // PALLET MODE
            const palletQty = contSize === "1" ? PALLET_QTY_20 : PALLET_QTY_40;
            const perPallet = selected.qty_per_pallet;

            arr[idx] = {
                ...current,
                sku: value,
                Flavour_tollingID: tollingID,
                palete_qty: palletQty,
                qty_perpallet: perPallet,
                qty_real: palletQty * perPallet,
                qty: palletQty * perPallet * contQty,
                qty_max: selected.cont20,
                moq: selected.moq20,
            };

            return orders;
        });

        setSessionStorageTrigger(p => !p);
    };

    /* ==========================
       QTY INPUT CHANGE
    ========================== */
    const handleFlavorQtyChange = (orderIdx, idx, raw) => {
        setContainerOrders(prev => {
            const orders = structuredClone(prev);
            const detail = orders[orderIdx]?.order.detail;
            if (!detail) return prev;

            const arr = detail.bulkList.Flavour;
            const current = arr[idx];
            if (!current || current.sku === "-1") return prev;

            const contQty = detail.cont_qty;

            const minQty = 0;
            const maxQty = Number(current.qty_max) || minQty;

            let qty = parseInt(raw || 0, 10);
            qty = Math.max(minQty, Math.min(qty, maxQty));

            current.qty_real = qty.toString();
            current.qty = (qty * contQty).toString();

            const behaviour = FLAVOUR_BEHAVIOUR[idx];

            behaviour.affects.forEach(i => {
                if (!arr[i] || arr[i].sku === "-1") return;

                const f1 = flavourLookup[current.sku];
                const f2 = flavourLookup[arr[i].sku];



                const usedCBM = calculateFlavourCBM({ sku: current.sku, qty }, f1);

                // Use rule engine to determine total allowed CBM
                const totalCBM = resolveCBM({
                    flavours: [f1, f2].filter(Boolean),
                    companyId: company_id,
                    rules: containerRules
                });

                const remain = totalCBM - usedCBM;
                const perUnit = calculateFlavourUnitCBM(f2);

                const nextQty =
                    perUnit > 0 ? Math.floor((remain / perUnit) / 10) * 10 : 0;

                arr[i].qty_real = nextQty.toString();
                arr[i].qty = (nextQty * contQty).toString();
            });

            return orders;
        });

        setSessionStorageTrigger(p => !p);
    };


    const selectedSkusExceptMe =
        containerOrders?.[orderIndex]?.order?.detail?.bulkList?.Flavour
            ?.filter((_, idx) => idx !== flavorIndex) // EXCLUDE myself
            ?.map(f => f.sku)
            ?.filter(sku => sku && sku !== "-1")
        || [];

    /* ==========================
       JSX
    ========================== */
    return (
        <div className="row mx-2 mt-1">
            <div className="col-4 col-md-2">
                Flavour {toRoman(flavorIndex + 1)}
                {flavorIndex === 0 && <span className="text-danger">*</span>}
            </div>

            <div className="col-5 col-md-6">
                <Select
                    size="sm"
                    value={flavour.sku}
                    disabled={isPreviousFlavourEmpty() || isPreviousFlavourQtyEmpty()}
                    onChange={(e) => {
                        const opt = e.target.options[e.target.selectedIndex];
                        handleFlavourChange(
                            flavorIndex,
                            orderIndex,
                            opt.value,
                            opt.getAttribute("flavourTollingID")
                        );
                    }}
                >
                    <option value="-1">Choose Flavour </option>
                    {flavours
                        .filter((flavourlist) => {
                            const selected1 = containerOrders[orderIndex]?.order.detail.bulkList.Flavour[0]?.sku;
                            const selected2 = containerOrders[orderIndex]?.order.detail.bulkList.Flavour[1]?.sku;


                            if (flavorIndex === 1) {

                                return Number(flavourlist.product_code) !== Number(selected1);

                            }

                            if (flavorIndex === 2) {

                                return Number(flavourlist.product_code) !== Number(selected1) &&
                                    Number(flavourlist.product_code) !== Number(selected2);
                            }

                            // flavorIndex === 0 â†’ ALLOW ALL
                            return true;
                        })
                        .map(f => (
                            <option
                                key={f.product_code}
                                value={f.product_code}
                                flavourTollingID={f.tolling_id}
                            >
                                {f.product_name_complete}
                            </option>
                        ))}
                </Select>
            </div>

            <div className="col-3 col-md-2">
                <FormControl>
                    <NumberInput size="sm" value={draftQty[getDraftKey(orderIndex, flavorIndex)] ?? formatNumber(flavour.qty_real)}>
                        <NumberInputField
                            className={hasFlavorMoQError ? "border-danger" : ""}
                            disabled={
                                pallet === 1 ||
                                flavour.sku === "-1" ||
                                isPreviousFlavourQtyEmpty()
                                ||
                                flavorIndex === 1
                            }
                            onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                setDraftQty(prev => ({
                                    ...prev,
                                    [getDraftKey(orderIndex, flavorIndex)]: raw
                                }));
                            }}
                            onBlur={(e) => {
                                const raw = draftQty[getDraftKey(orderIndex, flavorIndex)];
                                handleFlavorQtyChange(orderIndex, flavorIndex, raw);

                                // cleanup draft after commit
                                setDraftQty(prev => {
                                    const next = { ...prev };
                                    delete next[getDraftKey(orderIndex, flavorIndex)];
                                    return next;
                                });
                            }}
                        />
                    </NumberInput>
                </FormControl>
            </div>



            {pallet === 0 && (
                <Tooltip label="Actual Bulk Size">
                    <div className="col-3 col-md-2">
                        <NumberInput size="sm" value={formatNumber(flavour.qty)}>
                            <NumberInputField disabled />
                        </NumberInput>
                    </div>
                </Tooltip>
            )}

            {containerOrders[orderIndex].order.detail.bulkList.Flavour[flavorIndex].sku !== "-1" ? <div className="row"> <div className="col-4 col-md-2"></div> <div className="d-flex red_info_text col-6 ps-4"> * Container Load :{" "} {flavour.qty_max && flavour.qty_max.toLocaleString()} ctns | MOQ : {flavour.moq && flavour.moq.toLocaleString()} ctns </div> </div> : ""}

        </div>
    );
};

export default Flavour1_Bulkcomponent;




