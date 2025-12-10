import React, { useEffect, useState } from 'react';

function formatNumberWithDots(number) {
    // Check if the input is undefined, null, or not a number
    if (number === undefined || number === null || isNaN(number)) {
        return "";
    }

    // If it's a valid number, proceed with formatting
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function AddMoreContainerSummary({
    flavours,
    containerOrders,
    containerOrdersInformation,
    setContainerOrders,
    sessionStorageTrigger
}) {
    // Calculate the grand total quantity
    const [grandTotalQty, setGrandTotalQty] = useState(0);

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

    useEffect(() => {
        const totalQty = containerOrders.reduce((acc, order) => {
            if (Array.isArray(order.order.summary.Flavour)) {
                order.order.summary.Flavour.forEach(flavour => {
                    acc += parseInt(flavour.qty, 10) || 0;
                });
            }
            return acc;
        }, 0);

        setGrandTotalQty(totalQty);
    }, [containerOrders]);


    const flavorLookup = flavours.reduce((lookup, flavor) => {
        lookup[flavor.product_code] = flavor;
        return lookup;
    }, {});

    return (
        <>

            {!grandTotalQty ? "" : (

                <div className="card-body border border_radius_10px shadow shadow-sm my-4">

                    <div className="row px-2">
                        <div className="d-flex grey_text_bold fs-6 col-6">
                            Order Summary
                        </div>

                        <div className="d-flex justify-content-end grey_text_bold fs-6 col-6">
                            {`ETS: ${containerOrdersInformation.delv_week_desc}`}
                        </div>
                    </div>

                    <hr />

                    <div className="col-12">
                        <table className="table table-borderless">
                            <thead>
                                <tr>
                                    <th scope="col" className="grey_text_bold border-none text-center">
                                        Total Container
                                    </th>
                                    <th scope="col" className="grey_text_bold border-none text-start">
                                        Flavour
                                    </th>
                                    <th scope="col" className="grey_text_bold border-none">
                                        MOQ (ctns)
                                    </th>
                                    <th scope="col" className="grey_text_bold border-none">
                                        Total Qty (ctns)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {containerOrders.map((order, orderIndex) => (

                                    <React.Fragment key={orderIndex}>

                                        {Array.isArray(order.order.summary.Flavour) && order.order.summary.Flavour
                                            .filter(flavour => flavour.sku !== "-1")
                                            .map((flavour, flavourIndex) => {

                                                const flavourDetails = flavorLookup[flavour.sku];
                                                return (

                                                    <tr key={flavourIndex} >
                                                        <td className="mb-0 py-0 ">
                                                            {flavourIndex === 0 ? (
                                                                <div className="d-flex justify-content-center row my-1">
                                                                    <div className="container_summary_text w-75 border border_radius_10px">
                                                                        {order.order.detail.cont_qty} x {
                                                                            order.order.detail.cont_size === "1" ? "20 ft" :
                                                                                order.order.detail.cont_size === "2" ? "40 ft" :
                                                                                    order.order.detail.cont_size === "4" ? "40 HC" : ""
                                                                        }
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                ""
                                                            )}

                                                        </td>
                                                        <td className="mb-0 py-0">
                                                            <div className="grey_text text-start fs-6">
                                                                {flavourDetails ? flavourDetails.product_name_complete : flavour.sku}
                                                            </div>
                                                        </td>
                                                        <td className="mb-0 py-0">
                                                            <div className="d-flex justify-content-center grey_text fs-6">
                                                                {formatNumberWithDots(flavour.moq || 0)}
                                                            </div>
                                                        </td>
                                                        <td className="mb-0 py-0">
                                                            {parseInt(flavour.qty, 10) < parseInt(flavour.moq, 10) ? (
                                                                <div>
                                                                    <div className="red_text_bold fs-6 d-flex justify-content-center">
                                                                        {formatNumberWithDots(flavour.qty)}
                                                                    </div>
                                                                    {/* <div className="red_info_text">
                                                                        * MOQ not fulfilled
                                                                    </div> */}
                                                                </div>
                                                            ) : (
                                                                <div className="grey_text fs-6 text-center d-flex justify-content-center">
                                                                    {formatNumberWithDots(flavour.qty)}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                    </React.Fragment>
                                ))}

                                <tr>
                                    <td></td>
                                    <td>
                                        <div className="grey_text_bold text-start fs-6 pt-3 pb-1">
                                            Grand Total 
                                        </div>
                                    </td>
                                    <td></td>
                                    <td>
                                        <div className="grey_text_bold fs-6 pt-3 pb-1">
                                            {formatNumberWithDots(grandTotalQty)}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div >
            )
            }
        </>
    );
}

export default AddMoreContainerSummary;
