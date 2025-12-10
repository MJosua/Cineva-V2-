function Information({
    containerOrdersInformation
}) {
    return (
        <>
            <div className="row mt-2">
                <div className="d-flex justify-content-center  grey_text_bold fs-4">
                    Order Confirmation
                </div>
            </div>

            {/* STUFFING DATE - UPLOAD PO */}
            <div className="row mt-4 mb-2 ">
                <div className="col-9 col-md-9  d-flex align-items-center row">
                    <div className="col-12 d-md-none d-block text-start ">
                        <span className="grey_text_bold fs-6 text-start">
                            Stuffing Week&nbsp;
                        </span>
                    </div>
                    <div className="col-12 d-block d-md-none text-start ">
                        <span className="grey_text fs-6 text-start">
                            {containerOrdersInformation.delv_week_desc}
                        </span>
                    </div>
                    <div className="d-md-block d-none text-start">
                        <span className="grey_text_bold fs-6 text-start">
                            Stuffing Week&nbsp;
                        </span>
                        <span className="grey_text fs-6 text-start">
                            {containerOrdersInformation.delv_week_desc}
                        </span>
                    </div>
                </div>


            </div>
        </>
    )
}

export default Information