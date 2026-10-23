import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import Axios from "axios"; // Correct import statement for Axios
import { API_URL } from "../../config";
import { useState, useEffect } from "react";
import Truckperpackcomponent from "./Truckperpackcomponent";


function OrderVolumeComponent({ userToken, seasonOut, formatNumberWithDots, optiontype, week, datetype }) {
    const [orderVolume, setOrderVolume] = useState({}); // Initialize orderVolume state with an empty object

    const getOrderVolume = () => {
        Axios.get(`${API_URL}/spectator/total_order/${optiontype}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setOrderVolume(res.data);
            })
            .catch((err) => {
                seasonOut();
            });
    };

    useEffect(() => {
        getOrderVolume();
    }, [optiontype]); // Empty dependency array to ensure useEffect runs only once

    return (
        <div className='row ps-3'>
            <div className="col-5 ">

                <div className="container h-100">
                    <div className="row position-relative h-100 ">
                        <div className="col-12 text-start ps-0 mb-3 pt-2">
                            <span className="grey_text_16px">ORDER VOLUME</span>
                        </div>

                        <div className="col-12 position-absolute h-100">
                            <div className="row align-items-center h-100">
                                <div className="col ps-0 pe-0  text-start position-relative fw-bold fs-2">
                                    {
                                        orderVolume && orderVolume.ttl_order_now ?
                                            <div className="position-absolute d-flex align-items-center h-100 bg-danger">
                                                {
                                                    formatNumberWithDots(orderVolume.ttl_order_now.toLocaleString())
                                                }
                                            </div>
                                            : ''}

                                </div>
                                <span className="col d-flex align-items-center position-relative justify-content-center">
                                    {
                                        orderVolume   ?



                                            (!orderVolume.increase ?
                                                <FaArrowTrendDown className="text-danger position-absolute fs-1" />
                                                :
                                                <FaArrowTrendUp className="text-primary position-absolute fs-1" />
                                            )

                                            :

                                            ""
                                    }


                                </span>
                            </div>
                        </div>

                        <div className="col-12 text-start position-absolute  px-0 d-flex justify-content-start ps-0 bottom-0" style={{ fontSize: "12px" }}>

                            {
                                orderVolume  ?

                                    (!orderVolume.increase ?
                                        <span className="text-danger">
                                            {orderVolume.diffPercent}% &nbsp;
                                        </span>
                                        :
                                        <span className="text-primary">
                                            {orderVolume.diffPercent}% &nbsp;


                                        </span>
                                    )

                                    :

                                    ""
                            }



                            <span className="grey_text"> total orders compared last month</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-7">
                <Truckperpackcomponent
                    orderVolume={orderVolume}
                    formatNumberWithDots={formatNumberWithDots}
                    optiontype={optiontype}
                />
            </div>
        </div>
    );
}

export default OrderVolumeComponent;
