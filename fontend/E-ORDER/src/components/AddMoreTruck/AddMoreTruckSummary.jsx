function AddMoreTruckSummary({
    TruckOrderDetail,
    grandTotal,
    flavorLookup
}) {


    const formatNumber = (value) => {
        if (value === '') return '';
        if (value === undefined) return '';
        return parseFloat(value).toLocaleString(); // Format number with commas
    };
    return (
        <>
            <div className='card border_radius_10px shadow-sm mb-4 py-3'>
                <div className='row px-5'>
                    <div className='col-12 mb-3  fw-bold'>
                        Order Summary
                    </div>
                    <div className='px-3 '>
                        <table className='table  table-borderless text-grey'>
                            <tr className='fw-light'>
                                <th
                                    className="
                                                                        pb-2
                                                                        align-top border-bottom"
                                >
                                    Truck No.
                                </th>
                                <th
                                    className="align-top border-bottom"

                                >
                                    Delivery Date
                                </th>
                                <th
                                    className="align-top ps-2 border-bottom text-start"

                                >
                                    Flavour
                                </th>
                                <th
                                    className="align-top border-bottom"

                                >
                                    Total Qty Ctns
                                </th>

                            </tr>

                            {TruckOrderDetail.map((order, orderIndex) => {
                                let subtotal = 0; // Initialize subtotal inside the map function
                                return (
                                    <tbody key={orderIndex}>
                                        <tr>
                                            <td className={orderIndex !== (TruckOrderDetail.length - 1) ?
                                                "align-top border-bottom fw-bold" : "align-top  fw-bold"}>
                                                {orderIndex + 1}
                                            </td>
                                            <td className={orderIndex !== (TruckOrderDetail.length - 1) ?
                                                "align-top border-bottom" : "align-top"}>
                                                {order.delv_date}
                                            </td>
                                            <td className={orderIndex !== (TruckOrderDetail.length - 1) ?
                                                "align-top text-start border-bottom fw-normal" : "fw-normal align-top text-start"}>
                                                {order.flavors.map((flavor, fidx) => {
                                                    subtotal += parseInt(flavor.qty); // Accumulate subtotal here
                                                    const flavourDetails = flavorLookup[flavor.sku];
                                                    return (
                                                        <>
                                                            <div key={fidx}>
                                                                { flavourDetails ? flavourDetails.product_name : "Loading..." }
                                                            </div>
                                                        </>
                                                    );
                                                })}
                                                {order.flavors.length > 1 ?
                                                    <div className=" text-start fw-bold pt-0">
                                                        {!subtotal ? "" : "Sub-Total"}
                                                    </div>
                                                    :
                                                    ""
                                                }

                                            </td>
                                            <td className={orderIndex !== (TruckOrderDetail.length - 1) ? "align-top border-bottom" : "align-top"}>
                                                {order.flavors.map((flavor, fidx) => (
                                                    <div key={fidx}>{ formatNumber(flavor.qty)}</div>
                                                ))}
                                                {order.flavors.length > 1 ?
                                                    <div className=" text-center fw-bold pt-0">
                                                        {!subtotal ? "" : formatNumber(subtotal)}
                                                    </div>
                                                    :
                                                    ""
                                                }
                                            </td>
                                        </tr>
                                    </tbody>
                                );
                            })}

                            {TruckOrderDetail.map((order) => {
                                order.flavors.forEach((flavor) => {
                                    grandTotal += parseInt(flavor.qty); // Accumulate grand total
                                });
                            })}
                            <tr>
                                <td className='border-top'>

                                </td>
                                <td className='border-top'>

                                </td>
                                <td className='border-top ps-2 pt-2  px-0 fw-bold text-start'>
                                    Grand Total
                                </td>
                                <td className='border-top fw-bold px-0 '>
                                    {formatNumber(grandTotal)}
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

            </div>
        </>
    )
}
export default AddMoreTruckSummary