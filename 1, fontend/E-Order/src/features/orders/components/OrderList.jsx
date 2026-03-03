import React from "react";

import {

    Box
    // Text
} from '@chakra-ui/react'

const OrderList = () => {

    return (
        <div className=" mb-3">
            <Box className=" card card-body btn border  ">
                <div className="row ">
                    <div className="col-3" >
                        <img className=""
                            src={require('../../../../assets/images/container_opening.jpg')}
                            width='100%' alt="container" />
                    </div>
                    <div className="col-9 text-start pe-3" >
                        <h5 className="card-title  fw-bold">
                            Status Order:
                            User Draft
                        </h5>
                        <h6 className="card-subtitle mb-1">
                            Order Number
                        </h6>
                        <h6 className="card-subtitle mb-1">
                            qty container
                        </h6>
                        <h6 className="card-subtitle mb-1
                                                    text-muted">
                            qty sku
                        </h6>

                    </div>
                </div>

            </Box>

            {/* <div className="card my-2">
                <div className="card-body ">
                    <span className="text-muted">
                        Order in Progress?
                    </span>
                </div>
            </div> */}
        </div >
    )
}

export default OrderList;



