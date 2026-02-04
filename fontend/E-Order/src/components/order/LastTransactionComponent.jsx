import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import { API_URL } from "../../config";

// import ControlBar from "../components/ControlBar";

import { Select, Image, Card, Box } from "@chakra-ui/react";

import { useSelector } from "react-redux";

const ListTransactionPage = () => {
  const navigate = useNavigate();
  // ======================================================== GET DATA ========================================================


  const company_id = useSelector((state) => state.userReducer.company_id);

  // get company_id
  // let getCompanyId = JSON.parse(userData);
  // const company_id = getCompanyId[0].company_id;
  // console.log("company_id at listTransactionPage", company_id);

  // get order header
  const [orderHeader, setOrderHeader] = useState([]);
  const getOrderHeader = () => {
    let userToken = localStorage.getItem("tokek");
    Axios.get(API_URL + `/order/get_header?limit=${1}&status=4`, {

      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setOrderHeader(res.data.packet);
      })
      .catch((err) => {
      });
  };

  // get order details
  const [orderDetails, setOrderDetails] = useState([]);
  const getOrderDetails = () => {
    let userToken = localStorage.getItem("tokek");
    Axios.get(API_URL + `/order/get_detail_2?limit=1&desc=1`, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setOrderDetails(res.data);
      })
      .catch((err) => {
      });
  };


  useEffect(() => {
    getOrderHeader();
    getOrderDetails();

  }, []);

  const printOrderDetails = (headerOrderId) => {
    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return <p>No order details available.</p>;
    }

    return orderDetails.map((details, idx) => {


      return (


        (details.order_id === headerOrderId) ?

          <div className="card-body me-2 ms-1 border border_radius_10px shadow shadow-sm my-2">

            <div className="row">
              <div className="col-12 d-flex">
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

            <div className="row my-1">
              <div className="col-6 col-md-10 d-flex">
                {/* <div className="grey_text_bold fs-6">
                            Item
                        </div> */}
              </div>

              <div className="col-6 col-md-2 d-flex">
                <div className="grey_text_bold fs-6">
                  Total Cartons
                </div>
              </div>
            </div>

            <div className="row pb-3">
              <div className="col-4 col-md-5 col-lg-3 d-flex justify-content-end ">
                <Image
                  className="d-flex position-absolute gambarproduk justify-content-center p-1"
                  src={details.url_1}
                  boxSize=''
                  width="100%"
                  maxWidth="130"
                  maxHeight="131"
                  // fallbacksrc={require("../assets/images/emptyplate.PNG")} />
                  fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />

              </div>

              <div className="col-5 ratakiri col-md-5 col-lg-7 d-flex text-left red_text_bold my-4">
                <div>
                  <div className=" d-flex">
                    {details.product_name_1}
                  </div>
                  <div className="d-flex text-muted">
                    {details.prod_sku_1}
                  </div>
                </div>
              </div>



              <div className="col-2 col-md-2 col-lg-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                {details.qty1}
              </div>
            </div>

            {details.qty2 > 0 && (
              <div className="row pb-3">
                <div className="col-4 col-md-5 col-lg-3 d-flex justify-content-end ">
                  <Image
                    className="d-flex position-absolute gambarproduk justify-content-center p-1"
                    src={details.url_2}
                    boxSize=''
                    width="100%"
                    maxWidth="130"
                    maxHeight="131"
                    // fallbacksrc={require("../assets/images/emptyplate.PNG")} />
                    fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />

                </div>

                <div className="col-5 ratakiri col-md-5 col-lg-7 d-flex text-left red_text_bold my-4">
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
                  {details.qty2}
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
    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return <p>No order details available.</p>;
    }
    return orderDetails.map((details, idx) => {
      return (


        (details.order_id === headerOrderId) ?
          <div key={idx} className="card-body me-2 ms-1 border border_radius_10px shadow shadow-sm my-2">

            <div className="row pb-3">
              <div className="col-12 col-sm-4 col-md-3 col-lg-5 px-sm-0 px-md-0 px-lg-0 px-5 d-flex justify-content-center">
                <Image
                  className="d-flex position-absolute gambarproduk justify-content-center p-1"
                  src={details.url_1}
                  boxSize=''
                  width="100%"
                  maxWidth="130"
                  maxHeight="131"
                  // fallbacksrc={require("../assets/images/emptyplate.PNG")}>
                  fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />

              </div>

              <div className="col-6 col-sm-4  col-md-7 col-lg-5 ratakiri  d-flex text-left red_text_bold my-4">
                <div>
                  <div className=" d-flex">
                    {details.product_name_1}
                  </div>
                  <div className="d-flex text-muted">
                    {details.prod_sku_1}
                  </div>
                </div>
              </div>



              <div className="col-6 col-sm-4 col-lg-2 col-md-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                {details.qty1}
              </div>
            </div>

            {details.qty2 > 0 && (
              <div className="row pb-3">
                <div className="col-12 col-sm-4 col-md-3 col-lg-5 px-sm-0 px-md-0 px-lg-0 px-5 d-flex justify-content-center">
                  <Image
                    className="d-flex position-absolute gambarproduk justify-content-center p-1"
                    src={details.url_2}
                    boxSize=''
                    width="100%"
                    maxWidth="130"
                    maxHeight="131"
                    // fallbacksrc={require("../assets/images/emptyplate.PNG")}>
                    fallbacksrc='https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG' />

                </div>

                <div className="col-6  col-sm-4  col-md-7 col-lg-5 ratakiri  d-flex text-left red_text_bold my-4">
                  <div>
                    <div className=" d-flex">
                      {details.product_name_2}
                    </div>
                    <div className="d-flex text-muted">
                      {details.prod_sku_2}
                    </div>
                  </div>
                </div>



                <div className="col-6 col-sm-4 col-lg-2 col-md-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                  {details.qty2}
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

  const searchTerm = "4";
  const filteredHeaders = orderHeader.filter((header) =>
    String(header.is_status).includes(searchTerm)
  );

  const printOrderHeader = () => {
    return (
      orderHeader
        .slice(0, 1)

        // .filter((header) => (

        //     String(header.is_status).includes('4')

        // ))

        .map((header, idx) => {
          return (
            <div key={idx} className="card-body border border_radius_10px shadow shadow-sm mt-3 mr-1 ml-1">
              {filteredHeaders.length === 0 ? (
                <div>
                  <div>
                    <h1 className="text-muted fw-bold  fs-6">
                      There are no completed order yet
                    </h1>


                  </div>
                </div>
              ) : (
                <div>
                  {filteredHeaders.slice(0, 1).map((header, index) => (
                    <div key={index}>
                      {
                        <div>
                          <div className="row">
                            <div className="col-12 col-md-9 d-flex mt-1">
                              <span className="grey_text_bold fs-6">
                                Stuffing Week:&nbsp;
                              </span>

                              <span className="grey_text fs-6">
                                {header.delv_week_desc}
                              </span>
                            </div>

                            <div className="col-12 col-md-3 d-flex justify-content-end">
                              <button
                                className="btn-outline-danger border-2 border-danger border_radius_10px red_text_bold fs-6 px-2 py-1"
                                onClick={(value) => {
                                  sessionStorage.setItem(
                                    "showDetailsOrderId",
                                    header.order_id
                                  );
                                  setTimeout(() => {
                                    navigate("/e-order/transaction/details");
                                  }, 1500);
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
                            <div className="col-6 d-flex mt-1">
                              <span className="grey_text_bold fs-6">
                                PO Buyer:&nbsp;
                              </span>

                              <span className="grey_text fs-6">
                                {header.po_buyer}
                              </span>
                            </div>

                            <div className="col-6 d-flex justify-content-end ">
                              {header.is_status === 1 ||
                                header.is_status === 2 ||
                                header.is_status === 3 ? (
                                <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 yellow_background">
                                  {header.status_name}
                                </div>
                              ) : header.is_status === 4 ? (
                                <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 green_background">
                                  {header.status_name}
                                </div>
                              ) : (
                                <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 red_background">
                                  {header.status_name}
                                </div>
                              )}
                            </div>
                          </div>

                          {printOrderDetails(header.order_id)}
                        </div>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
    );
  };

  const printOrderHeader2 = () => {
    return (
      orderHeader
        .slice(0, 1)

        //   .filter((header) => (

        //         String(header.is_status).includes('4')

        //     ))

        .map((header, idx) => {
          return (
            <div key={idx} className="card-body border border_radius_10px w-100 shadow shadow-sm mt-3 mr-1 ml-1">
              {filteredHeaders.length === 0 ? (
                <div>
                  <div>
                    <h1 className="text-muted fw-bold pb-3 fs-1">
                      There are no completed order yet.
                    </h1>

                    <h5 className="text-muted">
                      Checkout an order and it will appear here!
                    </h5>
                  </div>
                </div>
              ) : (
                <div>
                  {filteredHeaders.map((header, index) => (
                    <div key={index}>
                      {
                        <div>
                          {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
                            (
                              <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 yellow_background">
                                {header.status_name}
                              </div>
                            ) : header.is_status === 4 ? (
                              <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 green_background">
                                {header.status_name}
                              </div>
                            ) : (
                              <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 red_background">
                                {header.status_name}
                              </div>
                            )}
                          <div className="row">
                            <div className="col-12 col-md-9 d-flex mt-1">
                              <span className="grey_text_bold fs-6">
                                Stuffing Week:&nbsp;
                              </span>

                              <span className="grey_text fs-6">
                                {header.delv_week_desc}
                              </span>
                            </div>
                          </div>

                          <div className="row my-2">
                            <div className="border-bottom border-secondary"></div>
                          </div>

                          <div className="row">
                            <div className="col-6 d-flex mt-1">
                              <span className="grey_text_bold fs-6">
                                PO Buyer:&nbsp;
                              </span>

                              <span className="grey_text fs-6">
                                {header.po_buyer}
                              </span>
                            </div>

                            <div className="col-6 d-flex justify-content-end ">
                              <div className="col-12 col-md-3  d-flex justify-content-start">
                                <button
                                  className="btn-outline-danger border-2 border-danger border_radius_10px red_text_bold fs-6  px-2 py-1"
                                  onClick={(value) => {
                                    sessionStorage.setItem(
                                      "showDetailsOrderId",
                                      header.order_id
                                    );
                                    setTimeout(() => {
                                      navigate("/e-order/transaction/details");
                                    }, 1500);
                                  }}
                                >
                                  Show Details
                                </button>
                              </div>
                            </div>
                          </div>

                          {printOrderDetails2(header.order_id)}
                        </div>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
    );
  };

  return (
    <div>
      <div>
        <Card className="border shadow dashboard_Card  w-100">
          <div className="col-11 w-90 PC-ver">
            {/* CONTENT BELOW */}

            <div className=" col-md-12 mt-3 ms-5 ">
              <div className="pb-5 pt-4 ">
                {/* HEADER */}
                <div className="row pb-3 w-100 ">
                  {printOrderHeader()}
                  <div
                    className={
                      orderHeader > [] ? "d-none" : "d-block pt-5 mt-5"
                    }
                  >
                    <h1 className="text-muted fw-bold pb-3 fs-1">
                      There are no completed order yet.
                    </h1>

                    <h5 className="text-muted">
                      Checkout an order and it will appear here!
                    </h5>
                  </div>
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
                  {printOrderHeader2()}

                  <div
                    className={
                      orderHeader > [] ? "d-none" : "d-block pt-5 mt-5"
                    }
                  >
                    <h1 className="text-muted fw-bold pb-3 fs-1">
                      There are no completed order yet.
                    </h1>

                    <h5 className="text-muted">
                      Checkout an order and it will appear here!
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ListTransactionPage;





