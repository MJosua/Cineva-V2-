function Remarks({
    orderItem
}) {
    return (
        <>
            <div className="row">
                <div className="col-md-10 col-9  text-secondary fs-6 ">
                    <div className="container-fluid px-0">
                        <div className="row px-0 text-start">
                            <div className="col-12 text-start fw-bold">
                                Remarks:
                            </div>
                            <div className="col-12 text-start">
                                {!orderItem.order.detail.remarks ? "-" : orderItem.order.detail.remarks}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-2  justify-content-end d-flex align-items-start">
                    <div className="container_summary_text w-100   border border_radius_10px ">
                        {` ${orderItem.order.detail.cont_qty} x ${orderItem.order.detail.cont_size.toLocaleString() === "1"
                            ? "20 ft"
                            : orderItem.order.detail.cont_size.toLocaleString() === "2"
                                ? "40 ft"
                                : "40 HC"
                            }`}

                    </div>
                </div>


            </div>
        </>
    )
}
export default Remarks




