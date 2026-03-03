import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios'
import { API_URL } from '../../../config';
import { useSelector } from 'react-redux';


import {
    Select,
    Image,
    Card,
    Box
} from '@chakra-ui/react';

const ListTransactionPage = () => {

    const navigate = useNavigate();

    // ======================================================== GET DATA ========================================================
    const { company_id } = useSelector((state) => {
        return { company_id: state.userReducer.company_id }
    });

    // // get company_id from localstorage
    // let getCompanyId = JSON.parse(userData);
    // const company_id = getCompanyId[0].company_id;
    // console.log("company_id at listTransactionPage", company_id)

    // get order header
    const [orderHeader, setOrderHeader] = useState([]);
    const [orderDetails, setOrderDetails] = useState({});

    const getOrderHeader = async () => {
        let userToken = (localStorage.getItem('tokek'));
        try {
            const res = await Axios.get(`${API_URL}/order/get_header`, {
                params: {
                    limit: 1,
                    desc: 1,
                    status: '0,1,2,3,4', // correct format
                },
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            const headers = res.data.packet;
            if (headers.length > 0) {
                setOrderHeader(headers);
                const orderIds = headers.map(order => order.order_id);
                if (orderIds.length > 0) {
                    getOrderDetails(orderIds);
                }
            }
        } catch (err) {
            console.error("Error fetching order headers", err);
        }
    };

    const getOrderDetails = async (orderIds) => {
        let userToken = (localStorage.getItem('tokek'));
        try {
            const promises = orderIds.map(orderId =>
                Axios.get(`${API_URL}/order/get_order_detail/${orderId}`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                }).then(res => ({ orderId, details: res.data }))
            );

            const results = await Promise.all(promises);

            // Convert results into an object { order_id: [details] }
            const detailsMap = results.reduce((acc, { orderId, details }) => {
                acc[orderId] = details;
                return acc;
            }, {});

            setOrderDetails(detailsMap);
        } catch (err) {
            console.error("Error fetching order details", err);
        }
    };

    useEffect(() => {
        getOrderHeader();
    }, []); // Runs once on mount



    const printOrderDetails = (headerOrderId) => {
        return Object.entries(orderDetails)
            .map((details, idx) => {
                return (


                    (details === headerOrderId) ?

                        <div key={idx} className="card-body  me-2 ms-1 border border_radius_10px shadow shadow-sm my-2">

                            <div className="row ps-2">
                                <div className="col-12 d-flex position-absolute ms-4">
                                    {details.bulk ?
                                        <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 grey_background">
                                            {`${details.cont_qty} x ${details.container_name}`}
                                        </div>
                                        :
                                        <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 grey_background">
                                            {`1 x ${details.container_name}`}
                                        </div>
                                    }
                                </div>
                            </div>

                            <div className="row my-1 pt-2">
                                <div className="col-6 col-md-9 d-flex">
                                    {/* <div className="grey_text_bold fs-6">
                                    Item
                                </div> */}
                                </div>

                                <div className="col-6 col-md-3 d-flex">
                                    <div className="grey_text_bold fs-6">
                                        Total Cartons
                                    </div>
                                </div>
                            </div>

                            <div className="row pb-3">
                                <div className="col-4 col-md-5 col-lg-3 d-flex justify-content-center ">
                                    <Image
                                        className="d-flex position-absolute gambarproduk justify-content-center p-1"
                                        src={details.url_1}
                                        boxSize=''
                                        width="100%"
                                        maxWidth="110"
                                        maxHeight="111"
                                        // fallbacksrc={require("../assets/images/emptyplate.PNG")} />
                                        fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />
                                </div>

                                <div className="col-12   ratakiri col-md-5 col-lg-6 d-flex text-left red_text_bold my-4">
                                    <div>
                                        <div className=" d-flex ">
                                            {details.product_name_1}
                                        </div>
                                        <div className="d-flex text-muted">
                                            {(details.prod_sku_1)}
                                        </div>
                                    </div>
                                </div>

                                <div className="col-2 col-md-2 col-lg-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                    {details.qty1.toLocaleString()}
                                </div>
                            </div>

                            {details.qty2 > 0 && (
                                <div className="row pb-3">
                                    <div className="col-4 col-md-5 col-lg-3 d-flex justify-content-center ">
                                        <Image
                                            className="d-flex position-absolute gambarproduk justify-content-center p-1"
                                            src={details.url_2}
                                            boxSize=''
                                            width="100%"
                                            maxWidth="110"
                                            maxHeight="111"
                                            // fallbacksrc={require("../assets/images/emptyplate.PNG")} />
                                            fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />

                                    </div>

                                    <div className="col-5 ratakiri col-md-5 col-lg-6 d-flex text-left red_text_bold my-4">
                                        <div>
                                            <div className=" d-flex">
                                                {details.product_name_2}
                                            </div>
                                            <div className="d-flex text-muted">
                                                {details.prod_sku_2}
                                            </div>
                                        </div>
                                    </div>



                                    <div className="col-2 col-md-2 col-lg-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                        {details.qty2.toLocaleString()}
                                    </div>
                                </div>
                            )}

                            <div className="row">
                                <div className="col-12 d-flex">
                                    <span className='grey_text_bold fs-6'>
                                        Remarks:&nbsp;
                                    </span>

                                    <span className="grey_text fs-6">
                                        {details.remarks}
                                    </span>
                                </div>
                            </div>
                        </div>
                        :
                        null
                )
            })
    }

    const printOrderDetails2 = (headerOrderId) => {
        return Object.entries(orderDetails)
            .filter(([orderId]) => orderId == headerOrderId) // Ensure the correct order_id
            .flatMap(([orderId, detailsArray]) =>
                detailsArray.map((details, idx) => (
                    <div key={idx} className="card-body me-2 ms-1 border border_radius_10px shadow shadow-sm my-2">
                        <div className="row ps-2">
                            <div className="col-12 d-flex position-absolute ms-4">
                                <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 grey_background">
                                    {details.bulk ? `${details.cont_qty} x ${details.container_name}` : `1 x ${details.container_name}`}
                                </div>
                            </div>
                        </div>

                        <div className="row my-1 pt-2">
                            <div className="col-6 col-md-9 d-flex">
                                {/* Title for items */}
                            </div>
                            <div className="col-6 col-md-3 d-flex">
                                <div className="grey_text_bold fs-6">Total Cartons</div>
                            </div>
                        </div>

                        <div className="row pb-3">
                            <div className="col-4 col-md-5 col-lg-3 d-flex justify-content-center">
                                <Image
                                    className="d-flex position-absolute gambarproduk justify-content-center p-1"
                                    src={details.url_1}
                                    boxSize=""
                                    width="100%"
                                    maxWidth="110"
                                    maxHeight="111"
                                    fallbackSrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                />
                            </div>

                            <div className="col-12 ratakiri col-md-5 col-lg-6 d-flex text-left red_text_bold my-4">
                                <div>
                                    <div className="d-flex">{details.product_name_1}</div>
                                    <div className="d-flex text-muted">{details.prod_sku_1}</div>
                                </div>
                            </div>

                            <div className="col-2 col-md-2 col-lg-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                {details.qty1.toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))
            );
    };

    const printOrderHeader = () => {
        return orderHeader
            .filter(transformedItem => [0, 1, 2, 3, 4].includes(transformedItem.is_status))

            .map((header, idx) => {
                return (
                    <div key={idx} className="card-body border border_radius_10px shadow shadow-sm mt-3 mr-1 ml-1">

                        <div className="row">
                            <div className="col-12 col-md-8 d-flex mt-1">

                                <span className='grey_text_bold fs-6 text-start'>
                                    Stuffing Week&nbsp;
                                </span>

                                <span className="grey_text fs-6">
                                    {header.delv_week_desc}
                                </span>
                            </div>

                            <div className="col-12 col-md-4 d-flex justify-content-end">
                                <button
                                    className='btn-outline-danger border-2 border-danger border_radius_10px red_text_bold fs-6 px-2 py-1'
                                    onClick={(value) => {
                                        sessionStorage.setItem('showDetailsOrderId', header.order_id)
                                        setTimeout(() => {
                                            navigate('/e-order/transaction/details')
                                        }, 1500)
                                    }}
                                >
                                    Show Details
                                </button>
                            </div>
                        </div>

                        <div className="row my-2">
                            <div className="border-bottom border-secondary"></div>
                        </div>

                        <div className="row">
                            <div className="col-8  d-flex mt-1">
                                <div className='container-fluid px-0'>
                                    <div className="row">
                                        <div className="col-6 col-md-12 col-lg-12 d-flex  justifyc-content-start">
                                            <div className='container-fluid px-0'>
                                                <div className='row ps-1'>
                                                    <div className="col-3 text-start ">
                                                        <span className='grey_text_bold fs-6 text-start'>
                                                            PO Buyer&nbsp;
                                                        </span>
                                                    </div>
                                                    <div className="col-9  text-start">
                                                        <span className="grey_text text-start fs-6">
                                                            {header.po_buyer}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-6 col-md-12 col-lg-12 d-flex  justifyc-content-start">
                                        <div className='container-fluid px-0'>
                                            <div className='row ps-1'>
                                                <div className="col-3 text-start ">
                                                    <span className='grey_text_bold fs-6 text-start'>
                                                        Port&nbsp;
                                                    </span>
                                                </div>
                                                <div className="col-9  text-start">
                                                    <span className="grey_text text-start fs-6">

                                                        {header.port_shipment}

                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>

                            <div className="col-4 bg d-flex justify-content-end ">
                                <div className="d-flex align-items-center">
                                    {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
                                        <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 yellow_background">
                                            {header.status_name}
                                        </div>
                                        :
                                        header.is_status === 4 ?
                                            <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 green_background">
                                                {header.status_name}
                                            </div>
                                            :
                                            <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 red_background">
                                                {header.status_name}
                                            </div>
                                    }
                                </div>
                            </div>
                        </div>

                        {printOrderDetails2(header.order_id)}

                    </div >
                )
            })
    }

    // const printOrderHeader2 = () => {
    //     return orderHeader
    //         .filter(
    //             transformedItem => transformedItem.status_name !== 77
    //         )
    //         .map((header, idx) => {
    //             return (

    //                 <div key={idx} className="card-body border border_radius_10px w-100 shadow shadow-sm mt-3 mr-1 ml-1">
    //                     {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
    //                         <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 yellow_background">
    //                             {header.status_name}
    //                         </div>
    //                         :
    //                         header.is_status === 4 ?
    //                             <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 green_background">
    //                                 {header.status_name}
    //                             </div>
    //                             :
    //                             <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 red_background">
    //                                 {header.status_name}
    //                             </div>
    //                     }
    //                     <div className="row">
    //                         <div className="col-12 col-md-9 d-flex mt-1">

    //                             <span className='grey_text_bold fs-6'>
    //                                 Stuffing Week:&nbsp;
    //                             </span>

    //                             <span className="grey_text fs-6">
    //                                 {header.delv_week_desc}
    //                             </span>
    //                         </div>


    //                     </div>

    //                     <div className="row my-2">
    //                         <div className="border-bottom border-secondary"></div>
    //                     </div>

    //                     <div className="row">
    //                         <div className="col-12 d-flex mt-1">
    //                             <div className='container px-0'>
    //                                 <div className="row px-0 ">
    //                                     <div className='col-5 justify-content-start d-flex'>
    //                                         <span className='grey_text_bold fs-6 text-start'>
    //                                             PO Buyer&nbsp;
    //                                         </span>
    //                                     </div>

    //                                     <div className='col-7 px-0 d-flex justify-content-start'>
    //                                         <span className="grey_text fs-6 text-start">
    //                                             {header.po_buyer}
    //                                         </span>
    //                                     </div>
    //                                 </div>
    //                             </div>




    //                         </div>

    //                         <div className="col-12 d-flex mt-1">
    //                             <div className='container px-0'>
    //                                 <div className="row px-0 ">
    //                                     <div className='col-5 justify-content-start d-flex'>
    //                                         <span className='grey_text_bold fs-6 text-start'>
    //                                             Port&nbsp; asdasd
    //                                         </span>
    //                                     </div>

    //                                     <div className='col-7 px-0 d-flex justify-content-start'>
    //                                         <span className="grey_text fs-6 text-start">
    //                                             {header.port_shipment}
    //                                         </span>
    //                                     </div>
    //                                 </div>

    //                             </div>

    //                         </div>

    //                         <div className="col-12 d-flex justify-content-end mt-1">
    //                             <button
    //                                 className='btn-outline-danger border-2 border-danger border_radius_10px red_text_bold fs-6  px-2 py-1'
    //                                 onClick={(value) => {
    //                                     sessionStorage.setItem('showDetailsOrderId', header.order_id)
    //                                     setTimeout(() => {
    //                                         navigate('/e-order/transaction/details')
    //                                     }, 1500)
    //                                 }}
    //                             >
    //                                 Show Details
    //                             </button>
    //                         </div>
    //                     </div>
    //                     {printOrderDetails2(header.order_id)}

    //                 </div>
    //             )
    //         })
    // }

    return (
        <div className=''>


            <div >
                <Card className="border shadow dashboard_Card  w-100">

                    <div className="col-11 w-90 PC-ver">


                        {/* CONTENT BELOW */}

                        <div className=" col-md-12  ms-5 ">



                            <div className="pb-3 pt-4 ">


                                {/* HEADER */}
                                <div className="row pb-3 w-100 ">




                                    {printOrderHeader()}


                                    <div className={orderHeader > [] ? "d-none" : "d-block pt-5 mt-5 w-100"} >

                                        <h1 className='text-muted fw-bold pb-3 fs-1'>
                                            There are no order yet.
                                        </h1>

                                        <h5 className='text-muted'>
                                            Checkout an order and it will appear here!
                                        </h5>
                                    </div>
                                </div>
                                <div
                                    onClick={() => navigate("/e-order/transaction")}
                                >
                                    <span className="text_merah"> Show More Transaction... </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Mobile Version */}
                    <div className="col-11 w-90 mobile-ver">


                        {/* CONTENT BELOW */}

                        <div className=" col-md-12 mt-3 ms-5 ">



                            <div className="pb-5 pt-4 ">


                                {/* HEADER */}
                                <div className="row pb-3">








                                    {/* {printOrderHeader2()} */}

                                    <div className={orderHeader > [] ? "d-none" : "d-block pt-5 mt-5"} >

                                        <h1 className='text-muted fw-bold pb-3 fs-1'>
                                            There are no order yet.
                                        </h1>

                                        <h5 className='text-muted'>
                                            Checkout an order and it will appear here!
                                        </h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </Card>
            </div>

        </div >

    )
}

export default ListTransactionPage;




