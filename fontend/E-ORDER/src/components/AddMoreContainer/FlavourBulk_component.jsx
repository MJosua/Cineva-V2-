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
} from "@chakra-ui/react";
import { AiFillCloseCircle } from "react-icons/ai";

const Flavour1_Bulkcomponent = ({
    flavorIndex,
    order,
    orderIndex,
    removeFlavor,
    flavour,
    containerOrders,
    setContainerOrders,
    flavours,
    hasFlavorMoQError,
    pallet,
    isPreviousFlavourEmpty,
    isPreviousFlavourQtyEmpty,
    isNextFlavourEmpty,
    setSessionStorageTrigger
}) => {

    const formatNumber = (value) => {
        if (value === '') return '';
        if (value === undefined) return '';
        return parseFloat(value).toLocaleString(); // Format number with commas
    };


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

    const handleFlavorQtyChange = (orderIndex, flavourIndex, value) => {
        const newOrders = [...containerOrders];

        let newLength = parseInt(value, 10) || 0;

        // Ensure the value is within the range 1 to 20
        if (newLength < 1) {
            newLength = 1;
        }
        if (newLength === "") {
            newLength = 1;
        }
        const detail = newOrders[orderIndex]?.order.detail.bulkList;
        const contQty = newOrders[orderIndex]?.order.detail.cont_qty;
        if (newLength > detail.Flavour[flavourIndex].qty_max) {
            newLength = detail.Flavour[flavourIndex].qty_max;
        }

        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        const selectedFlavor = flavorLookup[detail.Flavour[flavourIndex].sku];
        const selectedFlavor1 = flavorLookup[detail.Flavour[0].sku];
        const selectedFlavor2 = flavorLookup[detail.Flavour[1].sku];
        const qty = newLength === '' ? null : parseInt(newLength, 10);



        const C1 =
            parseInt(value) *
            (((selectedFlavor1.ctn_height + 1) *
                (selectedFlavor1.ctn_length + 1) *
                (selectedFlavor1.ctn_width + 1)) /
                1000000000);




        const qtyMax1 = detail.Flavour[0].qty_max;
        const qtyMax2 = detail.Flavour[1].qty_max;

        const qty1 = detail.Flavour[0].qty;
        const qty2 = detail.Flavour[1].qty;

        let CBM;

        if (((detail.Flavour[0].sku === "401538" && detail.Flavour[1].qty_max === 4708) || (detail.Flavour[1].sku === "401538" && detail.Flavour[0].qty_max === 4708))
        ) {
            CBM = 63.31461;
        } else {
            CBM = 66;
        }

        if (detail && detail.Flavour && detail.Flavour[flavourIndex]) {

            if (flavorIndex === 0) {

                if (detail.Flavour[flavourIndex + 1].sku === "-1") {
                    detail.Flavour[flavourIndex].qty = qty !== null ? (qty * contQty).toString() : '';
                    detail.Flavour[flavourIndex].qty_real = qty !== null ? qty.toString() : '';

                } else {
                    detail.Flavour[flavourIndex].qty = qty !== null ? (qty * contQty).toString() : '';
                    detail.Flavour[flavourIndex].qty_real = qty !== null ? qty.toString() : '';


                    const hitung = (Math.floor(
                        (CBM - C1) /
                        (((selectedFlavor2.ctn_height + 1) *
                            (selectedFlavor2.ctn_length + 1) *
                            (selectedFlavor2.ctn_width + 1)) /
                            1000000000) /
                        10
                    ) *
                        10) < 0 ? 0 :
                        (Math.floor(
                            (CBM - C1) /
                            (((selectedFlavor2.ctn_height + 1) *
                                (selectedFlavor2.ctn_length + 1) *
                                (selectedFlavor2.ctn_width + 1)) /
                                1000000000) /
                            10
                        ) *
                            10)


                    if (qtyMax1 === qtyMax2) {
                        detail.Flavour[flavourIndex + 1].qty = qty !== null ? ((qtyMax1 - qty) * contQty).toString() : '';
                        detail.Flavour[flavourIndex + 1].qty_real = qty !== null ? (qtyMax1 - qty).toString() : '';

                    } else {
                        detail.Flavour[flavourIndex + 1].qty = qty !== null ? (hitung * contQty).toString() : '';
                        detail.Flavour[flavourIndex + 1].qty_real = qty !== null ? hitung.toString() : '';
                    }

                    if (detail.Flavour.length === 3) {
                        detail.Flavour[flavourIndex + 2].qty = qty !== null ? 0 : '';

                    }
                }

            } else if (flavourIndex === 1) {
                const C2 =
                    parseInt(value) *
                    (((selectedFlavor2.ctn_height + 1) *
                        (selectedFlavor2.ctn_length + 1) *
                        (selectedFlavor2.ctn_width + 1)) /
                        1000000000);

                if (detail.Flavour.length === 3) {

                    if (detail.Flavour[flavourIndex + 1].sku === "-1") {
                        detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';
                    } else {
                        const qtyMax3 = detail.Flavour[2].qty_max;
                        const selectedFlavor3 = flavorLookup[detail.Flavour[2].sku];

                        detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';

                        const CC3 = (CBM - C1 - C2);

                        const CCC3 = (((selectedFlavor3.ctn_height + 1)
                            *
                            (selectedFlavor3.ctn_length + 1)
                            *
                            (selectedFlavor3.ctn_width + 1))
                            / 1000000000)
                        // console.log('===================Fl1====================');


                        const Qty3 = CC3 / CCC3;
                        const output = Qty3 < 0 ? 0 : Qty3;
                        const ctot = C1 + C2 + CC3;
                        // console.log("ctot", ctot)
                        if (qtyMax2 === qtyMax3) {
                            detail.Flavour[flavourIndex + 1].qty = qty !== null ? (qtyMax2 - qty1 - qty).toString() : '';
                        } else {
                            detail.Flavour[flavourIndex + 1].qty = qty !== null ? (Math.floor(output / 10) * 10).toString() : '';

                        }



                    }
                } else {
                    detail.Flavour[flavourIndex].qty = qty !== null ? qty.toString() : '';
                }
            }





            setContainerOrders(newOrders);
        }
    };

    const handleFlavourChange = (flavorIndex, orderIndex, value, flavourTollingID) => {
        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        const selectedFlavor = flavorLookup[value];

        const newOrders = [...containerOrders];
        const flavour = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex];
        const nextFlavour = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex + 1];
        const previousFlavour = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex - 1];
        const cont_qty = newOrders[orderIndex]?.order.detail.cont_qty;
        if (flavour) {
            // console.log("firstStep")
            if (pallet === 0) {
                if (flavorIndex === 0) {
                    // console.log("secondStep")
                    if (value === "-1") {
                        // console.log("Step if flavour = -1")
                        flavour.sku = value;
                        flavour.Flavour_tollingID = 0;
                        flavour.qty_perpallet = ""
                        flavour.qty = "0";
                        flavour.qty_real = "0";
                        flavour.qty_max = ""
                        flavour.palete_qty = 0;
                        !nextFlavour ? flavour.sku = value : nextFlavour.sku = value;
                        !nextFlavour ? flavour.Flavour_tollingID = 0 : nextFlavour.Flavour_tollingID = 0;
                        !nextFlavour ? flavour.qty = "0" : nextFlavour.qty = "0";
                        !nextFlavour ? flavour.qty_max = "" : nextFlavour.qty_max = ""
                        !nextFlavour ? flavour.palete_qty = 0 : nextFlavour.palete_qty = 0;
                        setContainerOrders(newOrders);
                    } else {
                        if (pallet === 0) {
                            if (newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex + 1].sku === "-1") {
                                // console.log("Step if next flavour 1")

                                if (newOrders[orderIndex]?.order.detail.cont_size === "1") {
                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont20 * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont20;
                                    flavour.qty_max = selectedFlavor.cont20;
                                    flavour.moq = selectedFlavor.moq20;
                                    setContainerOrders(newOrders);
                                } else if (newOrders[orderIndex]?.order.detail.cont_size === "2") {

                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont40 * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont40;
                                    flavour.qty_max = selectedFlavor.cont40;
                                    flavour.moq = selectedFlavor.moq;
                                    setContainerOrders(newOrders);
                                } else if (newOrders[orderIndex]?.order.detail.cont_size === "4") {
                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont40hc * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont40hc;
                                    flavour.qty_max = selectedFlavor.cont40hc;
                                    flavour.moq = selectedFlavor.moq;
                                    setContainerOrders(newOrders);
                                }

                            } else {
                                // console.log("Step if next flavour not -1")

                                if (newOrders[orderIndex]?.order.detail.cont_size === "1") {
                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont20 * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont20;
                                    nextFlavour.qty = 0;
                                    nextFlavour.qty_real = 0;
                                    flavour.qty_max = selectedFlavor.cont20;
                                    flavour.moq = selectedFlavor.moq20;
                                    setContainerOrders(newOrders);
                                } else if (newOrders[orderIndex]?.order.detail.cont_size === "2") {

                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont40 * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont40;
                                    flavour.qty_max = selectedFlavor.cont40;
                                    nextFlavour.qty = 0;
                                    nextFlavour.qty_real = 0;
                                    flavour.moq = selectedFlavor.moq;
                                    setContainerOrders(newOrders);
                                } else if (newOrders[orderIndex]?.order.detail.cont_size === "4") {
                                    flavour.sku = value;
                                    flavour.Flavour_tollingID = flavourTollingID;
                                    flavour.qty = selectedFlavor.cont40 * cont_qty;
                                    flavour.qty_real = selectedFlavor.cont40;
                                    flavour.qty_max = selectedFlavor.cont40hc;
                                    nextFlavour.qty = 0;
                                    nextFlavour.qty_real = 0;
                                    flavour.moq = selectedFlavor.moq;
                                    setContainerOrders(newOrders);
                                }
                            }

                        }
                    }
                }
                else if (flavorIndex === 1) {
                    // step for flavour 2
                    if (pallet === 0) {
                        if (value === "-1") {
                            flavour.sku = value;
                            flavour.Flavour_tollingID = 0;
                            flavour.qty = "0";
                            flavour.qty_real = "0";
                            !nextFlavour ? flavour.sku = value : nextFlavour.sku = value;
                            !nextFlavour ? flavour.Flavour_tollingID = 0 : nextFlavour.Flavour_tollingID = 0;
                            !nextFlavour ? flavour.qty = "0" : nextFlavour.qty = "0";
                            !nextFlavour ? flavour.qty_max = "" : nextFlavour.qty_max = ""
                            !nextFlavour ? flavour.palete_qty = 0 : nextFlavour.palete_qty = 0;
                            previousFlavour.qty = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex - 1].qty_max;
                            setContainerOrders(newOrders);

                        } else {
                            flavour.sku = value;
                            flavour.Flavour_tollingID = flavourTollingID;
                            flavour.qty = "0";


                            if (newOrders[orderIndex]?.order.detail.cont_size === "1") {
                                flavour.palete_qty = 0;
                                flavour.qty_max = selectedFlavor.cont20;

                                flavour.moq = selectedFlavor.moq20;
                                setContainerOrders(newOrders);
                            } else if (newOrders[orderIndex]?.order.detail.cont_size === "2") {

                                flavour.palete_qty = 0;
                                flavour.qty_max = selectedFlavor.cont40;

                                flavour.moq = selectedFlavor.moq;
                                setContainerOrders(newOrders);
                            } else if (newOrders[orderIndex]?.order.detail.cont_size === "4") {
                                flavour.palete_qty = 20;
                                flavour.qty_max = selectedFlavor.cont40hc;

                                flavour.moq = selectedFlavor.moq;
                                setContainerOrders(newOrders);
                            }

                            previousFlavour.qty = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex - 1].qty_max;
                            setContainerOrders(newOrders);
                        }
                    }

                }
                else if (flavorIndex === 2) {
                    // step for flavour 3

                    if (value === "-1") {
                        flavour.sku = value;
                        flavour.Flavour_tollingID = 0;
                        flavour.qty = "0";
                        setContainerOrders(newOrders);

                    } else {

                        flavour.sku = value;
                        flavour.Flavour_tollingID = flavourTollingID;
                        flavour.qty = "0";



                        setContainerOrders(newOrders);

                    }
                }
            }
            else {
                // if pallet is on
                const contSize = newOrders[orderIndex]?.order.detail?.cont_size;
                const palletQty = contSize === "1" ? 10 : 20;
                // console.log("Step if next flavour 1 but pallet")\
                if (value === "-1") {

                    flavour.sku = value;
                    flavour.Flavour_tollingID = 0;
                    flavour.qty = 0;
                    flavour.palete_qty = 0;
                    flavour.qty_max = 0;
                    flavour.moq = 0;

                    if (flavorIndex === 0) {
                        newOrders[orderIndex]?.order.detail.bulkList?.Flavour.forEach((flavour) => {
                            flavour.sku = "-1";
                            flavour.Flavour_tollingID = 0;
                            flavour.qty = "0";
                            flavour.qty_real = "0";
                            flavour.qty_perpallet = 0;
                            flavour.qty_max = "";
                            flavour.palete_qty = 0;
                        });
                    }


                    setContainerOrders(newOrders);

                } else {
                    const pengaliPalet = selectedFlavor.qty_per_pallet


                    if (flavorIndex !== 0 && previousFlavour) {
                        flavour.sku = value;
                        flavour.Flavour_tollingID = flavourTollingID;
                        flavour.qty = "0";
                        flavour.qty_real = "0";
                        flavour.qty_perpallet = pengaliPalet;
                        flavour.palete_qty = 0;
                        flavour.qty_max = selectedFlavor.cont20;
                        flavour.moq = selectedFlavor.moq20;
                        //perhatikan
                        previousFlavour.qty = palletQty * previousFlavour.qty_perpallet * cont_qty;
                        previousFlavour.qty_real = palletQty * previousFlavour.qty_perpallet;
                        previousFlavour.palete_qty = palletQty;
                    } else {
                        flavour.sku = value;
                        flavour.Flavour_tollingID = flavourTollingID;
                        flavour.qty = palletQty * pengaliPalet * cont_qty;
                        flavour.qty_real = palletQty * pengaliPalet;
                        flavour.palete_qty = palletQty;
                        flavour.qty_max = selectedFlavor.cont20;
                        flavour.qty_perpallet = pengaliPalet;
                        flavour.moq = selectedFlavor.moq20;
                    }



                    setContainerOrders(newOrders);
                }

            }
        }

        setSessionStorageTrigger(prev => !prev);

    };




    const handleFlavorQtyPalletChange = (orderIndex, flavourIndex, value) => {

        let newLength = parseInt(value, 10) || 0;


        if (containerOrders[orderIndex].order.detail.cont_size === "1") {
            if (newLength > 10) {
                newLength = 10;
            } else if (newLength < 1) {
                newLength = 1;
            }
        } else {
            if (newLength > 20) {
                newLength = 20;
            } else if (newLength < 1) {
                newLength = 1;
            }
        }

        // Ensure the value is within the range 1 to 20

        const newOrders = [...containerOrders];
        const qty = newLength === '' ? null : parseInt(newLength, 10);
        const flavor = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex]
        const cont_qty = newOrders[orderIndex]?.order.detail.cont_qty
        const nextFlavour = newOrders[orderIndex]?.order.detail.bulkList.Flavour[flavorIndex + 1]
        const flavorLookup = flavours.reduce((lookup, flavor) => {
            lookup[flavor.product_code] = flavor;
            return lookup;
        }, {});
        const detail = newOrders[orderIndex]?.order.detail.bulkList;
        const selectedFlavor = flavorLookup[flavor.sku];
        // if (flavorIndex === 0) {
        const contSize = newOrders[orderIndex]?.order.detail?.cont_size;
        const palletQty = contSize === "1" ? 10 : 20;
        if (detail && detail.Flavour && detail.Flavour[flavourIndex]) {
            detail.Flavour[flavourIndex].palete_qty = qty !== null ? qty.toString() : '';
            detail.Flavour[flavourIndex].qty_perpallet = selectedFlavor.qty_per_pallet;
            detail.Flavour[flavourIndex].qty = qty !== null ? qty * selectedFlavor.qty_per_pallet * cont_qty : '';
            detail.Flavour[flavourIndex].qty_real = qty !== null ? qty * selectedFlavor.qty_per_pallet : '';
            nextFlavour.palete_qty = qty !== null ? (palletQty - qty).toString() : '';
            nextFlavour.qty = (palletQty - qty) * nextFlavour.qty_perpallet * cont_qty;
            nextFlavour.qty_real = (palletQty - qty) * nextFlavour.qty_perpallet;
            setContainerOrders(newOrders);
        }
        console.log("selectedFlavor")


        setContainerOrders(newOrders);



        // } 

    };


    return (
        <>
            <div className={
                (flavorIndex === 0 && order.order.detail.cont_size.toString() === "1") || order.order.detail.cont_size.toString() === "2" || order.order.detail.cont_size.toString() === "4"
                    ?
                    "row d-flex mx-2 mt-1 position-relative"
                    :
                    "d-none"
            }
            >
                <div className="grey_text_bold fs-6 d-flex col-4 col-md-2 mt-1">
                    Flavour {toRoman(flavorIndex + 1)}&nbsp;
                    {flavorIndex === 0 ?
                        <span className="color_red">
                            *
                        </span>
                        :
                        ""
                    }

                </div>

                <div className="col-5 col-md-6">
                    <Select
                        className="grey_text fs-6"
                        size="sm"
                        onChange={(e) => {
                            const selectedOption = e.target.options[e.target.selectedIndex];
                            const flavourTollingID = selectedOption.getAttribute('flavourTollingID');
                            handleFlavourChange(flavorIndex, orderIndex, selectedOption.value, flavourTollingID);
                        }}
                        value={flavour.sku}
                        disabled={isPreviousFlavourEmpty() || isPreviousFlavourQtyEmpty()}
                    >

                        <option value={-1}>Choose Flavour</option>
                        {
                            flavours
                                .sort((a, b) => a.cat_name.localeCompare(b.cat_name))
                                .filter((flavourlist) => {
                                    const selected1 = containerOrders[orderIndex]?.order.detail.bulkList.Flavour[0]?.sku;
                                    const selected2 = containerOrders[orderIndex]?.order.detail.bulkList.Flavour[1]?.sku;
                                
                                    if (flavorIndex === 1) {
                                        return flavourlist.product_code !== selected1;
                                    }
                                
                                    if (flavorIndex === 2) {
                                        return flavourlist.product_code !== selected1 &&
                                               flavourlist.product_code !== selected2;
                                    }
                                
                                    // flavorIndex === 0 → ALLOW ALL
                                    return true;
                                })
                                .map((flavourlist, index) => {



                                    if (flavorIndex !== 0) {
                                        // console.log(typeof flavourlist.tolling_id); // Should output "number"
                                        // console.log(typeof containerOrders[orderIndex].order.detail.bulkList.Flavour[0].Flavour_tollingID); // Should output "number"
                                        const flavor0tolling = containerOrders[orderIndex].order.detail.bulkList.Flavour[0].Flavour_tollingID ? parseInt(containerOrders[orderIndex].order.detail.bulkList.Flavour[0].Flavour_tollingID) : 0;
                                        if (flavourlist.tolling_id === flavor0tolling) {
                                            // console.log("Rendering option for flavour:", flavourlist.product_name_complete);

                                            return (
                                                <option
                                                    key={index}
                                                    value={flavourlist.product_code}
                                                    flavourTollingID={flavourlist.tolling_id}
                                                >
                                                    {flavourlist.product_name_complete}
                                                </option>
                                            );
                                        }
                                        return null;
                                    } else {
                                        return (
                                            <option key={index}
                                                value={flavourlist.product_code}
                                                flavourTollingID={flavourlist.tolling_id}

                                            >
                                                {flavourlist.product_name_complete}
                                            </option>
                                        );
                                    }
                                })
                        }
                    </Select>
                </div>



                {pallet === 1 ?
                    <div className="col-3 col-md-2">
                        <FormControl>
                            <NumberInput
                                size="sm"
                                value={formatNumber(flavour.palete_qty)}
                            >

                                <NumberInputField
                                    className={`grey_text fs-6 text-center form-control px-1  ${hasFlavorMoQError ? 'border-danger' : 'border'}`}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/,/g, ''); // Remove commas from input
                                        if (!isNaN(value)) { // Check if the value is a valid number
                                            handleFlavorQtyPalletChange(orderIndex, flavorIndex, value); // Update state
                                        }
                                    }}
                                    disabled={isPreviousFlavourQtyEmpty() || flavorIndex !== 0 || (flavorIndex === 0 && isNextFlavourEmpty()) || flavour.sku === "-1"}
                                />
                            </NumberInput>
                        </FormControl>

                    </div>

                    :
                    ""
                }

                <div className="col-3 col-md-2">
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
                                        handleFlavorQtyChange(orderIndex, flavorIndex, value); // Update state
                                    }
                                }}
                                disabled={isPreviousFlavourQtyEmpty() || flavour.sku === "-1" || isPreviousFlavourEmpty() || pallet === 1 || (containerOrders[orderIndex].order.detail.bulkList.Flavour.length === 2 && flavorIndex === 1)}
                            />
                        </NumberInput>
                    </FormControl>

                </div>
                {pallet === 0 ?
                    <Tooltip
                        label="Actual Bulk Size"
                        hasArrow
                        arrowSize={15}>

                        <div className="col-3 col-md-2">
                            <FormControl>
                                <NumberInput
                                    size="sm"
                                    value={formatNumber(flavour.qty)}
                                >

                                    <NumberInputField
                                        className={`grey_text fs-6 text-center form-control px-1  ${hasFlavorMoQError ? 'border-danger' : 'border'}`}

                                        disabled
                                    />
                                </NumberInput>
                            </FormControl>

                        </div>
                    </Tooltip>

                    :
                    ""
                }
                {containerOrders[orderIndex].order.detail.bulkList.Flavour[flavorIndex].sku !== "-1" ?
                    <div className="row">
                        <div className="col-4 col-md-2"></div>

                        <div className="d-flex red_info_text col-6 ps-4">
                            * Container Load :{" "}
                            {flavour.qty_max && flavour.qty_max.toLocaleString()} ctns
                            | MOQ : {flavour.moq && flavour.moq.toLocaleString()} ctns
                        </div>
                    </div>
                    :
                    ""
                }

            </div >
        </>
    );
};

export default Flavour1_Bulkcomponent