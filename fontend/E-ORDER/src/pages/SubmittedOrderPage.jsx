import React, { useEffect, useState } from 'react';
// import {
//     IconButton
// } from "@chakra-ui/react";

import { clearSeasonStorage } from '../action/cartAction'

import {
    useNavigate
} from 'react-router-dom';


import { useLocation } from "react-router-dom"
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";

const SubmittedOrderPage = () => {

    const navigate = useNavigate();
    const location = useLocation();
    // ========================= CLEAR SESSION STORAGE =================================


    const [initialise, setInitialise] = React.useState(false)
    const order = []

    if (initialise === false) {
        clearSeasonStorage(order)
        sessionStorage.clear()
        setInitialise(true)
    }
    const meta = {
        title: `${location.pathname} page Indofood`,
        description: `Page of ${location.pathname} from Indofood`,
        canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
        meta: {
            charset: 'utf-8',
            name: {
                keywords: 'react,meta,document,html,tags'
            }
        }
    };
    // ==========================================================================

    const [resetOrder, setResetOrder] = useState(false);
    const getOrderDetails = JSON.parse(sessionStorage.getItem("orderDetails"));
    const orderDetails = [];

    const { type_id, user_type, uid, transport } = useSelector((state) => {
        return {
            type_id: state.userReducer.type_id,
            uid: state.userReducer.uid,
            user_type: state.userReducer.user_type,
            transport: state.userReducer.transport,
        };
    });

    if (resetOrder === true) {
        clearSeasonStorage(order)
        sessionStorage.clear()


        navigate(
            transport === 1 || 3 ?
                "/e-order/order?mode=Container"
                :
                transport === 2 ?
                    "/e-order/order?mode=Trucking"
                    :
                    "/e-order/order?mode=Container"
        );
        setResetOrder(false);
    }

    useEffect(() => {
        sessionStorage.clear();
    }, [])

    return (
        <div>

            {/* navbar */}

            <div>
                <div className='py-5 mt-2 stick-left'>
                    <div className='row'>
                        <div className='col-6 col-sm-12'>
                        </div>
                        <div className='col-6 col-sm-12'>
                            <Sidebar />
                        </div>

                    </div>
                </div>

                <div className="py-5">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 padding_start_custom">
                        <div className="pb-5">

                            <div className="row mt-5 d-flex justify-content-center mx-5">
                                <svg viewBox="-16.8 0 58 20" >
                                    <circle
                                        className="circle"
                                        fill="none"
                                        stroke="rgba(25, 135, 84, 1)"
                                        strokeWidth="0.8"
                                        cx="12"
                                        cy="12"
                                        r="4.5"
                                    />
                                    <path
                                        className="checkmark"
                                        fill="none"
                                        stroke="rgba(25, 135, 84, 1)"
                                        strokeWidth="0.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9.8,12.5 L11.8,14.1 L14.2,10.5"
                                    />
                                </svg>
                            </div>

                            <div className="row d-flex justify-content-center grey_text_20px">
                                Your order has been submitted successfully!
                            </div>

                            <div className="row d-flex justify-content-center my-2">
                                <div
                                    className="submitted_order_button btn btn-danger border border_radius_10px w-md-25 w-75 py-2"
                                    onClick={() => {
                                        setResetOrder(true);

                                    }}
                                >
                                    Order Again
                                </div>
                            </div>

                            <div className="row d-flex justify-content-center mb-4">
                                <div
                                    className="submitted_order_button btn btn-secondary border border_radius_10px w-md-25 w-75 py-2"
                                    onClick={() =>

                                        navigate('/e-order/transaction')}
                                >
                                    View Transaction List
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default SubmittedOrderPage;
