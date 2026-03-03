import { Button, Checkbox, Input, Textarea, Tooltip } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react"
import { BsFillPlusCircleFill } from "react-icons/bs";
import { AiFillCloseCircle } from "react-icons/ai";
import { API_URL } from "../../../../config";
import Flavour1_Bulkcomponent from "./FlavourBulk_component";
import Flavour1_NonBulkcomponent from "./FlavourNonBulk_Component";
import { useSelector } from "react-redux/es/hooks/useSelector";
import Rumuscbm from "../RumuscbmContainer";
import { CopyIcon } from "@chakra-ui/icons";
import { createSelector } from '@reduxjs/toolkit';
import { calculateContainerCBM, calculateFlavourCBM, calculateFlavourUnitCBM } from "../../../../utils/cbmCalculator";
import { resolveCBM } from "../../../../utils/containerRuleEngine";
import containerRules from "../../../../utils/containerRules";

function AddMoreContainerBody({

    order,
    orderIndex,
    containerOrders,
    setContainerOrders,
    userToken,
    flavours,
    errors,
    setSessionStorageTrigger,
    sessionStorageTrigger,
    customable,
    incrementPoBuyer,


    REQUIRED_CBM,
}) {



    const flavourLookup = useMemo(
        () => Object.fromEntries(flavours.map(f => [f.product_code, f])),
        [flavours]
    );

    const cbmMap = useMemo(() => {
        const map = {};

        containerOrders.forEach((order, oi) => {
            order.order.detail.containerList.forEach((container, ci) => {
                map[`${oi}_${ci}`] = calculateContainerCBM(
                    container,
                    flavourLookup
                );
            });
        });

        return map;
    }, [containerOrders, flavourLookup]);

    const user_id = useSelector((state) => state.userReducer.user_id);
    const company_id = useSelector((state) => state.userReducer.company_id);
    const active = useSelector((state) => state.userReducer.active);
    const max_sku = useSelector((state) => state.userReducer.max_sku);
    const pallet = useSelector((state) => state.userReducer.pallet);
    const spc_condition_details = useSelector((state) => state.userReducer.spc_condition_details);

    const handleRemarkChange = (orderIndex, value) => {
        const newOrders = [...containerOrders];

        const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\/\:-_(),.]/g, "");

        const detail = newOrders[orderIndex]?.order.detail;
        if (detail) {
            detail.remarks = sanitizedValue;
            setContainerOrders(newOrders);
        }
    };


    const addFlavors = (orderIndex, containerIndex, containercustom) => {
        const newOrders = [...containerOrders];

        if (
            newOrders[orderIndex] &&
            newOrders[orderIndex].order.detail
        ) {
            // Add to detail
            if (containercustom === false) {
                if (newOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.length < 3) {
                    newOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.push({
                        sku: "-1",
                        qty: 0,
                        Flavour_tollingID: "",
                        qty_max: "",
                        moq: "",
                        palete_qty: 0,
                    });


                }
            }
            else {
                if (newOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.length < 5) {
                    newOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.push({
                        sku: "-1",
                        qty: 0,
                        Flavour_tollingID: "",
                        qty_perpallet: "",
                        qty_max: "",
                        moq: "",
                        palete_qty: 0,
                    });


                }
            }


        }

        setContainerOrders(newOrders);
    };


    const removeFlavor = (orderIndex, containerIndex, flavorIndex) => {
        const newOrders = [...containerOrders];
        const flavor1 = newOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[0]
        const flavor2 = newOrders[orderIndex]?.order.detail.containerList[containerIndex].Flavour[1]

        // Ensure the nested structure exists before trying to access the array
        if (
            newOrders[orderIndex] &&
            newOrders[orderIndex].order



        ) {
            flavor1.qty = flavor1.qty_max;
            flavor2.qty = 0;
            // Remove the flavor at the specified index
            newOrders[orderIndex].order.detail.containerList[containerIndex].Flavour.splice(flavorIndex, 1);
            setContainerOrders(newOrders);
        }
        setSessionStorageTrigger(prevState => !prevState)

    };

    const duplicateOrder = (data) => {

        console.log("data", data)

        let newPoBuyer = ""


        if (containerOrders.length > 0) {
            const lastOrder = containerOrders[containerOrders.length - 1];
            if (lastOrder.order.header.po_buyer) {
                newPoBuyer = incrementPoBuyer(lastOrder.order.header.po_buyer);
            }

            setTimeout(() => {
                setSessionStorageTrigger(prevState => !prevState);
            }, 500);

        }

        if (containerOrders.length < 20) {
            setContainerOrders([...containerOrders, {
                order: {
                    header: {
                        po_buyer: newPoBuyer,
                        po_url: "",
                        port_shipment: data.header.port_shipment,
                        ship_to: data.header.ship_to,
                        notify_to_1: data.header.notify_to_1,
                        notify_to_2: data.header.notify_to_2,
                        bill_to: data.header.bill_to,
                        final_dest: data.header.final_dest,
                    },
                    detail: {
                        cont_size: data.detail.cont_size,
                        cont_qty: data.detail.cont_qty,
                        bulk: data.detail.bulk,
                        remarks: data.detail.remarks,
                        containerList:
                            data.detail.containerList.map((container, containerIndex) => ({
                                detail_id: containerIndex,
                                custom: container.custom === false || container.custom.toLocaleString() === "0" || container.custom === "" || container.custom === null || !container.custom || container.custom === undefined ? 0 : 1,
                                bulk: "0",
                                Flavour: container.Flavour.map(flavour => ({
                                    Flavour_tollingID: flavour.Flavour_tollingID,
                                    moq: flavour.moq,
                                    palete_qty: flavour.palete_qty,
                                    qty_perpallet: flavour.qty_per_pallet,
                                    qty: flavour.qty,
                                    qty_max: flavour.qty_max,
                                    sku: flavour.sku,
                                }))
                            })),

                        bulkList: {
                            detail_id: 1,
                            custom: false,
                            Flavour: data.detail.bulkList.Flavour.map(flavour => ({
                                Flavour_tollingID: flavour.Flavour_tollingID,
                                moq: flavour.moq,
                                palete_qty: flavour.palete_qty,
                                qty_perpallet: flavour.qty_per_pallet,
                                qty: flavour.qty,
                                qty_max: flavour.qty_max,
                                qty_real: flavour.qty_real,
                                sku: flavour.sku,
                            }))
                        }
                    },
                    summary: {
                        detail_id: "",

                    }
                }
            }]);

            setTimeout(() => {
                setSessionStorageTrigger(prevState => !prevState);
            }, 500);

        }
        setTimeout(() => {
            setSessionStorageTrigger(prevState => !prevState);
        }, 500);
    };



    return (
        <div className="container-fluid">
            <div className="row d-flex  justify-content-center grey_text_bold fs-6">
                {order.order.header.cart_id ?
                    <>
                    </>
                    :
                    <div className="col-12 top-0 position-absolute d-flex justify-content-end">
                        <Tooltip label="Duplicate this order">
                            <Button
                                size="sm"
                                className="mt-2"
                                onClick={() => { duplicateOrder(order.order) }}

                            >
                                <CopyIcon />
                            </Button>
                        </Tooltip>
                    </div>
                }

                {order.order.detail.bulk === false || order.order.detail.bulk === "0" ? (

                    order.order.detail.containerList.map((container, containerIndex) => {
                        const cbm = calculateContainerCBM(container, flavourLookup);
                        const validFlavourCount = container.Flavour.filter(
                            f => Number(f.sku) > 0 || Number(f.qty) > 0
                        ).length;

                        // Resolve dynamic CBM limit (handles Company rules & Same Load Exception)
                        const allowedCBM = resolveCBM({
                            flavours: container.Flavour.filter(f => f.sku !== "-1" && flavourLookup[f.sku]).map(f => flavourLookup[f.sku]),
                            companyId: company_id,
                            rules: containerRules,
                            specialConditions: spc_condition_details
                        });

                        const isRedBorder = cbm > 0 &&
                            cbm > (allowedCBM + 0.00001) && // Use dynamic limit with epsilon tolerance for floating point
                            !container.custom &&
                            validFlavourCount > 1;

                        return (
                            <div
                                key={containerIndex}
                                className={`card-body border border_radius_10px shadow shadow-sm my-3 mx-3 pb-5 position-relative ${isRedBorder ? "border-danger" : ""}`}
                            >
                                <div className="mb-4 mt-4 mt-md-1 d-flex justify-content-center">
                                    Container {containerIndex + 1}
                                </div>
                                <div className="row mx-0 mx-md-2">

                                    <div className="col-8  text-start d-flex justiy-content-start">
                                        <div

                                        >
                                            <Rumuscbm
                                                flavours={flavours}
                                                container={container}
                                                allowedCBM={allowedCBM}
                                            />



                                        </div>
                                    </div>

                                    <div className=
                                        {pallet === 1 ?
                                            "grey_text fs-6 d-flex justify-content-center col-6 col-md-2"
                                            :
                                            "d-none"
                                        }
                                    >
                                        {pallet === 1 ? "" : "Total Pallet"}
                                    </div>
                                    <div className="text-secondary fs-6 d-flex justify-content-center col-6 d-none d-md-block col-md-2">
                                        Total Ctns
                                    </div>
                                </div>
                                {container.Flavour.map((flavour, flavorIndex) => {

                                    const isPreviousFlavourQtyEmpty = () => {
                                        if (flavorIndex === 0) return false;
                                        if (flavorIndex === 2) return true; // If it's the first flavor, it should not be disabled
                                        const previousFlavour = container.Flavour[flavorIndex - 1];
                                        const currentFlavour = container.Flavour[flavorIndex];
                                        return !previousFlavour || previousFlavour.qty === " "
                                            || previousFlavour.qty === null
                                            || previousFlavour.qty === 0
                                            || previousFlavour.qty === ""
                                            || currentFlavour.sku === "-1";
                                    };

                                    const isPreviousFlavourEmpty = () => {
                                        if (flavorIndex === 0) return false;
                                        const previousFlavour = container.Flavour[flavorIndex - 1];
                                        return !previousFlavour || previousFlavour.sku === "-1"
                                            || previousFlavour.sku === null
                                            || previousFlavour.sku === 0
                                            || previousFlavour.sku === "";
                                    };

                                    const isNextFlavourEmpty = () => {
                                        const nextFlavour = container.Flavour[flavorIndex + 1];
                                        return !nextFlavour || nextFlavour.sku === "-1"
                                            || nextFlavour.sku === null
                                            || nextFlavour.sku === 0
                                            || nextFlavour.sku === "";
                                    };

                                    const hasFlavorMoQError = errors.some(error => error.orderIndex === orderIndex && error.flavorIndex === flavorIndex && error.errorType === 'moq');
                                    return (
                                        <div key={flavorIndex}>
                                            <Flavour1_NonBulkcomponent
                                                flavorIndex={flavorIndex}
                                                company_id={company_id}
                                                orderIndex={orderIndex}
                                                containerIndex={containerIndex}
                                                removeFlavor={removeFlavor}
                                                flavour={flavour}
                                                container={container}
                                                isPreviousFlavourEmpty={isPreviousFlavourEmpty}
                                                isPreviousFlavourQtyEmpty={isPreviousFlavourQtyEmpty}
                                                containerOrders={containerOrders}
                                                setContainerOrders={setContainerOrders}
                                                flavours={flavours}
                                                hasFlavorMoQError={hasFlavorMoQError}
                                                pallet={pallet}
                                                isNextFlavourEmpty={isNextFlavourEmpty}
                                                setSessionStorageTrigger={setSessionStorageTrigger}
                                                customable={customable}
                                                sessionStorageTrigger={sessionStorageTrigger}
                                                specialConditions={spc_condition_details}
                                            />


                                        </div>
                                    )
                                }
                                )}

                                <div className=
                                    {
                                        max_sku.toString() === "3" && (order.order.detail.cont_size !== "1" || container.custom === true || container.custom === "1")
                                            ?
                                            "col-md-5 col-8 d-flex mt-4 "
                                            :
                                            "d-none"




                                    }
                                    style={{ marginBottom: "-20px" }}
                                >
                                    <Tooltip
                                        label="Normally Maximum 3 Flavours"
                                        hasArrow
                                        arrowSize={15}
                                    >
                                        <button
                                            onClick={() => addFlavors(orderIndex, containerIndex, container.custom)}
                                            className="btn btn-danger border_radius_10px"

                                            disabled={container.custom ? container.Flavour.length === 5 : container.Flavour.length === 3}
                                        // {
                                        //     cont20
                                        //         ? "d-none"
                                        //         : cont40
                                        //             ? "d-none"
                                        //             : "btn btn-danger border_radius_10px"
                                        // }
                                        >


                                            <div className="row">
                                                <div className="col-2 pt-1">
                                                    <BsFillPlusCircleFill />
                                                </div>
                                                <div className="col-10">
                                                    Add Flavour
                                                    {/* {flavourIIIHidden[orderIndex][
                                                    detailIndex
                                                ]
                                                    ? "Add Flavour"
                                                    : "Hide Flavour"} */}
                                                </div>
                                            </div>
                                        </button>
                                    </Tooltip>


                                </div>


                            </div>
                        )
                    })

                )
                    :
                    (
                        <div className="card-body border border_radius_10px shadow shadow-sm my-3 mx-3 pb-5 position-relativee">
                            <div className="mb-4 mt-1">
                                {`Container Details`}
                            </div>



                            {order.order.detail.bulkList.Flavour.map((flavour, flavorIndex) => {

                                const isPreviousFlavourQtyEmpty = () => {
                                    if (flavorIndex === 0) return false;
                                    if (flavorIndex === 2) return true; // If it's the first flavor, it should not be disabled
                                    const previousFlavour = order.order.detail.bulkList.Flavour[flavorIndex - 1];
                                    return !previousFlavour || previousFlavour.qty === " "
                                        || previousFlavour.qty === null
                                        || previousFlavour.qty === 0
                                        || previousFlavour.qty === ""

                                };

                                const isPreviousFlavourEmpty = () => {
                                    if (flavorIndex === 0) return false;
                                    const previousFlavour = order.order.detail.bulkList.Flavour[flavorIndex - 1];
                                    const currentFlavour = order.order.detail.bulkList.Flavour[flavorIndex];
                                    return !previousFlavour || previousFlavour.sku === "-1"
                                        || previousFlavour.sku === null
                                        || previousFlavour.sku === 0
                                        || previousFlavour.sku === ""
                                        || currentFlavour.sku === " ";
                                };

                                const isNextFlavourEmpty = () => {
                                    const nextFlavour = order.order.detail.bulkList.Flavour[flavorIndex + 1];
                                    return !nextFlavour || nextFlavour.sku === "-1"
                                        || nextFlavour.sku === null
                                        || nextFlavour.sku === 0
                                        || nextFlavour.sku === "";
                                };

                                const hasFlavorMoQError = errors.some(error => error.orderIndex === orderIndex && error.flavorIndex === flavorIndex && error.errorType === 'moq');



                                return (
                                    <div key={flavorIndex} >



                                        <Flavour1_Bulkcomponent
                                            flavorIndex={flavorIndex}
                                            order={order}
                                            orderIndex={orderIndex}
                                            removeFlavor={removeFlavor}
                                            flavour={flavour}
                                            containerOrders={containerOrders}
                                            setContainerOrders={setContainerOrders}
                                            flavours={flavours}
                                            hasFlavorMoQError={hasFlavorMoQError}
                                            pallet={pallet}
                                            isPreviousFlavourEmpty={isPreviousFlavourEmpty}
                                            isPreviousFlavourQtyEmpty={isPreviousFlavourQtyEmpty}
                                            isNextFlavourEmpty={isNextFlavourEmpty}
                                            setSessionStorageTrigger={setSessionStorageTrigger}
                                            company_id={company_id}
                                        />
                                    </div>

                                )
                            }
                            )}

                        </div>
                    )

                }

            </div >

            <div className="card-body border border_radius_10px shadow shadow-sm my-3 mx-2  position-relative">

                <div className="row mx-2 my-2">
                    <div className="grey_text_bold fs-6 d-flex col-12 col-md-2 mt-1">
                        Remarks
                    </div>

                    <div className="col-12 col-md-8">


                        <Textarea
                            className="grey_text fs-6 pt-3 pt-md-0"
                            type="text"
                            placeholder="Insert your remarks here..."
                            size="sm"
                            onChange={(e) => handleRemarkChange(orderIndex, e.target.value)}
                            style={{ minHeight: "45px", }}
                            value={order.order.detail.remarks}
                            resize="vertical"
                        />
                    </div>




                </div>
            </div>

        </div>
    )
}
export default AddMoreContainerBody




