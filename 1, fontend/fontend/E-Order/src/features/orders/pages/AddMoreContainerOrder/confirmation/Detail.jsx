function Detail({

    orderItem,
    flavorLookup,
    Image,
    formatNumber,

}) {
    return (
        <>
            {!orderItem.order.detail.bulk ?
                (
                    orderItem.order.detail.containerList.map((container, containerIndex) => (
                        <div key={containerIndex} className="card-body border border_radius_10px shadow shadow-sm mt-2 mb-3 mx-3">
                            <div className="grey_text_bold fs-5 my-2">
                                Container {containerIndex + 1}
                            </div>

                            <div className="row pb-1">


                                <div className="col-10 d-flex">
                                    <div className="grey_text_bold fs-6">
                                        Product Description
                                    </div>
                                </div>

                                <div className="col-2  d-flex justify-content-center grey_text_bold fs-6">
                                    Total Cartons
                                </div>
                            </div>
                            {container.Flavour
                                .filter(flavour => flavour.sku !== "-1")
                                .map((flavour, flavorIndex) => {
                                    const flavourDetails = flavorLookup[flavour.sku];
                                    return (
                                        <div className="row pb-1" key={flavorIndex}>
                                            <div className="col-5 d-none d-md-block  col-md-3 d-flex justify-content-center">

                                                <Image
                                                    className="d-flex justify-content-center p-2"
                                                    src={`https://www.indofoodinternational.com/iod/images/uploads/${flavour.sku}-1.png`}

                                                    width="100%"
                                                    maxWidth="130"
                                                    maxHeight="131"


                                                    fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                                />
                                            </div>

                                            <div className="col-5 d-block d-md-none  col-md-3 d-flex justify-content-center">
                                                <Image
                                                    className="d-flex justify-content-center p-2"
                                                    src={`https://www.indofoodinternational.com/iod/images/uploads/${flavour.sku}-1.png`}

                                                    width="100%"
                                                    maxWidth="130"
                                                    maxHeight="111"


                                                    fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                                />
                                            </div>

                                            <div className="col-4 col-md-5  my-4 fs-6">
                                                <div className="row text-start d-flex red_text_bold">
                                                    {flavourDetails ? flavourDetails.product_name_complete : "Loading..."}

                                                </div>
                                                <div className="row d-flex text-secondary fw-bold">
                                                    {flavourDetails ? flavourDetails.product_sku : "Loading..."}
                                                </div>
                                            </div>

                                            <div className="col-md-2 col-1"></div>

                                            <div className="col-2  d-flex justify-content-center grey_text_bold my-4 fs-6">
                                                {formatNumber(flavour.qty)}
                                            </div>




                                        </div>
                                    )
                                })
                            }




                        </div>



                    ))
                )
                :
                <div className="card-body border border_radius_10px shadow shadow-sm mt-2 mb-3 mx-3">
                    <div className="grey_text_bold fs-5 my-2">
                        Container Details
                    </div>

                    <div className="row pb-1">


                        <div className="col-10 d-flex">
                            <div className="grey_text_bold fs-6">
                                Product Description
                            </div>
                        </div>

                        <div className="col-2  d-flex justify-content-center grey_text_bold fs-6">
                            Total Cartons
                        </div>
                    </div>
                    {
                        orderItem.order.detail.bulkList.Flavour
                            .filter(flavour => flavour.sku !== "-1")
                            .map((bulklist, bulkListIndex) => {
                                const flavourDetails = flavorLookup[bulklist.sku];
                                return (
                                    <div className="row pb-1" key={bulkListIndex}>
                                        {/* Desktop Image */}
                                        <div className="col-5 d-none d-md-block col-md-3 d-flex justify-content-center">
                                            <Image
                                                className="d-flex justify-content-center p-2"
                                                src={`https://www.indofoodinternational.com/iod/images/uploads/${bulklist.sku}-1.png`}
                                                width="100%"
                                                maxWidth="130"
                                                maxHeight="131"
                                                fallbackSrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                            />
                                        </div>

                                        {/* Mobile Image */}
                                        <div className="col-5 d-block d-md-none col-md-3 d-flex justify-content-center">
                                            <Image
                                                className="d-flex justify-content-center p-2"
                                                src={`https://www.indofoodinternational.com/iod/images/uploads/${bulklist.sku}-1.png`}
                                                width="100%"
                                                maxWidth="130"
                                                maxHeight="111"
                                                fallbackSrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                            />
                                        </div>

                                        {/* Flavour Details */}
                                        <div className="col-4 col-md-5 my-4 fs-6">
                                            <div className="row text-start d-flex red_text_bold">
                                                {flavourDetails ? flavourDetails.product_name_complete : "Loading..."}
                                            </div>
                                            <div className="row d-flex text-secondary fw-bold">
                                                {flavourDetails ? flavourDetails.product_sku : "Loading..."}
                                            </div>
                                        </div>

                                        <div className="col-md-2 col-1"></div>

                                        {/* Quantity */}
                                        <div className="col-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                            {formatNumber(bulklist.qty)}
                                        </div>
                                    </div>
                                );
                            })
                    }
                </div>
            }

        </>
    )
}

export default Detail




