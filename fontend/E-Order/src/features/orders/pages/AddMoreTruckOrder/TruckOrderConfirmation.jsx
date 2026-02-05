import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../../../../config";
import Axios from "axios";

import {
  Image,
  useToast,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Tooltip,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";

import { useDispatch, useSelector } from "react-redux";

import Sidebar from "../../../../components/layout/Sidebar.jsx";

import { seasonOut, loginAction, logoutAction } from "../../../../action/userAction";
import AddMoreTruckSummary from "../../components/AddMoreTruck/AddMoreTruckSummary";
import { useData } from "../../../auth/components/CheckToken/FetchData/DataContext";
import { AiFillFile } from "react-icons/ai";
import PdfViewer from "../../../../components/media/PDFViewer/PdfViewer";

function TruckOrderConfirmation() {

  const { flavours, flavoursTrucking, ports, shipToParties } = useData();


  const TruckOrderDetail = JSON.parse(sessionStorage.getItem("truckOrders"));

  const formatNumber = (value) => {
    if (value === '') return '';
    if (value === undefined) return '';
    return parseFloat(value).toLocaleString(); // Format number with commas
  };


  const portsLookup = ports.reduce((lookup, port) => {
    lookup[port.md_id] = port;
    return lookup;
  }, {});



  const shiptoLookup = shipToParties.reduce((lookup, stp) => {
    lookup[stp.keyy] = stp;
    return lookup;
  }, {});


  const [loading, setLoading] = useState(false)

  const { user_id, company_id, user } = useSelector((state) => {
    return {
      user_id: state.userReducer.user_id,
      company_id: state.userReducer.company_id,
      user: state.userReducer.user,
    };
  });
  const navigate = useNavigate();
  const toast = useToast();
  const id = "hello-toast";

  const d = new Date();
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var mm = month[d.getMonth()]; // Use d.getMonth() directly without adding 1
  var dd = d.getDate();
  var yy = d.getFullYear();
  var currentDate = mm + ' ' + dd + ', ' + yy;


  const [prevOrderId, setPrevOrderId] = useState([]);
  const getOrderCartId = () => {
    let userToken = localStorage.getItem("tokek");
    Axios.get(API_URL + "/order/get_id", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setPrevOrderId(res.data[0].LATEST);
      })
      .catch((err) => {
      });
  };

  useEffect(() => {
    getOrderCartId();

  }, []);
  const [backendData, setBackendData] = useState([])

  useEffect(() => {
    const backendDataMaking = {
      order: TruckOrderDetail.map(order => {
        const delv_year = new Date(order.delv_date).getFullYear();
        return {
          "delv_year": delv_year,
          "delv_week_desc": "",
          "delv_week": 0,
          "po_url": order.po_url,
          "po_buyer": order.po_buyer,
          "stuffing_date": order.delv_date,
          "port_shipment": order.port,
          "ship_to": order.shipToParty,
          "bill_to": order.bill_to ? order.bill_to : user.company_id,
          "notify_to_1": order.notify_to_1,
          "notify_to_2": order.notify_to_2,
          "tolling_id": 1,
          "final_dest": order.final_dest,
          "remarks": order.remark || "-",
          "detail": order.flavors.map((flavour, flavourIdx) => ({
            "detail_id": flavourIdx + 1,
            "cont_size": 8,
            "cont_qty": 0,
            "bulk": 0,
            "custom": 0,
            "Flavour":
              [{
                "sku": flavour.sku,
                "qty": flavour.qty
              }]
          })),
          "summary": order.flavors.map((sum, sumIdx) => ({
            "detail_id": sumIdx + 1,
            "sku": sum.sku,
            "qty": sum.qty
          }))
        };
      })
    };
    console.log("To be Order", backendDataMaking);
    setBackendData(backendDataMaking);
  }, [])

  const handleOrder = () => {
    setLoading(true);
    let userToken = localStorage.getItem("tokek");

    Axios.post(API_URL + `/order/add_order`, backendData, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        console.log('POST request successful:', res);
        if (res.data.success === true) {
          setLoading(false);
          navigate("/e-order/order/confirmation/done");
        }
      })
      .catch((err) => {
        console.error('Error making POST request:', err);
        toast({
          title: `Error!`,
          description: `Failed to Input item, please reload, if the problem still occur, contact your country representative`,
          status: "error",
          duration: 3000,
          isClosable: true,
          className: "pb-5",
        });

      });
  }


  const [buttonLoading, setButtonLoading] = useState(false);

  const {
    isOpen: isOpenModalConfirm,
    onOpen: onOpenModalConfirm,
    onClose: onCloseModalConfirm,
  } = useDisclosure();

  const flavorLookup = flavoursTrucking.reduce((lookup, flavor) => {
    lookup[flavor.product_code] = flavor;
    return lookup;
  }, {});

  const closemodal = () => {
    setButtonLoading(false);
    setLoading(false);
    onCloseModalConfirm()
  }

  const {
    isOpen: isOpenModalImage,
    onOpen: onOpenModalImage,
    onClose: onCloseModalImage,
  } = useDisclosure();

  const fileUrl = API_URL + TruckOrderDetail[0].po_url;
  const lowerUrl = TruckOrderDetail[0].po_url.toLowerCase();
  // Check if the URL ends with a PDF extension
  const isPdf = lowerUrl.endsWith('.pdf');

  // Check for common image extensions (png, jpg, jpeg, gif)
  const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);

  return (
    <div>

      <Modal
        // initialFocusRef={initialRefConfirm}
        isOpen={isOpenModalImage}
        onClose={onCloseModalImage}
        motionPreset="slideInBottom"
        size="xl"
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>PO File</ModalHeader>
            <ModalCloseButton onClick={onCloseModalImage} />
            <ModalBody>
              {isImage && (
                <Image src={fileUrl} className="mb-2" alt="Document" />
              )}

              {isPdf && (
                <PdfViewer file={fileUrl} style={{ width: '100%' }} />
              )}

              {!isPdf && !isImage && (
                <p>Unsupported file format</p>
              )}
            </ModalBody>

          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* NAVBAR */}
      <div>
        <div className="py-5 mt-2 stick-left">
          <div className="row">
            <div className="col-6 col-sm-12"></div>
            <div className="col-6 col-sm-12">
              <Sidebar />
            </div>
          </div>
        </div>

        <div className="py-5">
          <div className=" col-md-11 mt-3 padding_start_custom">
            <div className="pb-5 pt-4">
              {/* ================================================================= CONTENT BELOW ================================================================= */}

              {/* BACK ARROW */}
              <div className="row my-2">
                <div className="d-flex justify-content-center  grey_text_bold fs-4">
                  Order Confirmation
                </div>
              </div>



              {TruckOrderDetail.map((order, orderIndex) => {
                const portsDetails = portsLookup[order.port];
                const shiptoDetails = shiptoLookup[order.shipToParty];

                return (
                  <div key={orderIndex} className="card-body border border_radius_10px shadow shadow-sm mt-1 mb-3">
                    <div className="grey_text_bold fs-5 my-2">
                      Truck {orderIndex + 1}
                    </div>

                    <div className="row">
                      <div className="col-6">

                        <div className="row">
                          <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                            PO Buyer
                          </div>

                          <div className="col-12 col-md-8  grey_text fs-6 text-start ">
                            {order.po_buyer}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                            PO Date
                          </div>

                          <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">
                            {
                              (() => {
                                const date = new Date(order.delv_date);
                                const formattedDate = date.toLocaleDateString('en-US', {
                                  month: 'short', // Short month name (e.g., Jan)
                                  day: 'numeric', // Numeric day of the month (e.g., 24)
                                  year: 'numeric'
                                });
                                return formattedDate;
                              })()
                            }
                          </div>
                        </div>
                        {order.tolling_id === 1 ?

                          <div className="row">
                            <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                              Document
                            </div>

                            <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">

                            </div>
                          </div>
                          :
                          <>
                          </>
                        }
                      </div>

                      <div className="col-6">

                        {order.po_url ?
                          <div className="row">
                            <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                              Document
                            </div>
                            <div className="col-md-8 ps-0 col-12 d-flex  justify-content-start grey_text fs-6 text-start"

                              onClick={() => onOpenModalImage()}>
                              <Tooltip
                                label="Click to show PO"
                                hasArrow
                                arrowSize={15}
                              >
                                <div className="">
                                  <span className="grey_text fs-6  btn">
                                    <AiFillFile className="pointer" size={15} />
                                  </span>
                                  <span className="grey_text_bold fs-6 pointer">
                                    Document &nbsp;
                                  </span>
                                </div>
                              </Tooltip>
                            </div>

                          </div>


                          :
                          <div className="row">
                            <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                              Document
                            </div>

                            <div className="col-md-8  col-12 d-flex grey_text fs-6 text-start">
                              No PO file&nbsp;
                            </div>
                          </div>


                        }

                        <div className="row">
                          <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                            Destination
                          </div>

                          <div className="col-md-8 col-12 d-flex grey_text fs-6 text-start">
                            {order.final_dest}
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                            Ship to Party
                          </div>

                          <div className="col-md-8 col-12 d-flex grey_text fs-6 text-start">
                            {shiptoDetails ? shiptoDetails.txt : " Loading... "}
                          </div>
                        </div>
                      </div>

                    </div>
                    <div className="col-12 card-body border border_radius_10px shadow shadow-sm mt-3 mb-2 ">
                      <div className="row mb-1">
                        <div className="col-10 d-flex">
                          <div className="grey_text_bold fs-6">
                            Product Description
                          </div>
                        </div>

                        <div className="col-2 d-flex justify-content-center grey_text_bold fs-6">
                          Total Cartons
                        </div>


                        {order.flavors.map((orderDetails, containerIndex) => {
                          const flavourDetails = flavorLookup[orderDetails.sku];
                          return (
                            <div>
                              <div className="row pb-1">
                                <div className="col-5 d-none d-md-block  col-md-3 d-flex justify-content-center">
                                  <Image
                                    className="d-flex justify-content-center p-2"
                                    src={`https://www.indofoodinternational.com/iod/images/uploads/${orderDetails.sku}-1.png`}

                                    width="100%"
                                    maxWidth="130"
                                    maxHeight="131"


                                    fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                  />
                                </div>



                                <div className="col-4 col-md-5  my-4 fs-6">
                                  <div className="row text-start d-flex red_text_bold">
                                    <div className="row text-start d-flex red_text_bold">
                                      {flavourDetails ? flavourDetails.product_name : "Loading..."}
                                    </div>
                                    <div className="row d-flex text-secondary fw-bold">
                                      {flavourDetails ? flavourDetails.product_sku : "Loading..."}
                                    </div>

                                  </div>


                                </div>

                                <div className="col-md-2 col-1"></div>

                                <div className="col-2  d-flex justify-content-center grey_text_bold my-4 fs-6">
                                  {orderDetails.qty ?
                                    formatNumber(orderDetails.qty)
                                    :
                                    formatNumber(orderDetails.qty)
                                  }
                                </div>
                              </div>

                            </div>
                          )
                        })}

                        <div className="row">
                          <div className="col-md-10 col-9  text-secondary fs-6 ">
                            <div className="container-fluid px-0">
                              <div className="row px-0 text-start">
                                <div className="col-12 text-start fw-bold">
                                  Remarks:
                                </div>
                                <div className="col-12 text-start">
                                  {!order.remark ? "-" : order.remark}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                )
              })}



              <AddMoreTruckSummary
                flavorLookup={flavorLookup}
                TruckOrderDetail={TruckOrderDetail}
                grandTotal={0}
              />


            </div>
          </div>
        </div>

        <div className=" shadow-none fixed-bottom button_bottom_sticky d-none d-sm-none d-md-block d-lg-block d-xl-block d-xxl-block">
          <div className=" shadow-lg row d-flex justify-content-evenly bg-white py-2 px-0 border-top">
            <div className="col-6 px-5 d-flex justify-content-start">
              <button
                className="btn btn-outline-secondary shadow w-50 mt-1 p-2 fw-bold"
                onClick={() => navigate("/e-order/order?mode=Trucking")}
              >
                Back to place Order
              </button>

            </div>


            <div className="col-6 px-5 d-flex justify-content-end">

              <Button
                className="btn btn-danger shadow w-50 mt-1 p-2 fw-bold"
                onClick={() => {
                  onOpenModalConfirm();
                  console.log("backendDataMaking", backendData);
                }

                }
                isLoading={loading}
                disabled={loading}
                colorscheme="red"
              >
                Submit
              </Button>

            </div>
          </div>
        </div>

      </div>

      <Modal
        // initialFocusRef={initialRefConfirm}
        isOpen={isOpenModalConfirm}
        onClose={closemodal}
        motionPreset="slideInBottom"
        size="xl"
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>Confirmation</ModalHeader>
            <ModalCloseButton onClick={onCloseModalConfirm} />
            <ModalBody>
              <span className=" py-2">
                â€œBy confirming your order, you understand that any modifications
                or cancellations may be subject to our terms and conditions.â€
              </span>
            </ModalBody>
            <ModalFooter className="px-3">
              <button
                className="btn btn-outline-danger px-2 mx-1"
                onClick={() => {
                  onCloseModalConfirm();
                  setButtonLoading(false);
                  setLoading(false);
                }}
              >
                Cancel
              </button>
              {buttonLoading === false && (
                <button
                  className="btn btn-danger px-2 mx-1"
                  onClick={() => {
                    setButtonLoading(true);
                    handleOrder();
                  }}
                >
                  Confirm
                </button>
              )}
              {buttonLoading === true && (
                <Button
                  colorscheme="red"
                  variant="background"
                  className="btn btn-danger px-3 mx-1"
                  isLoading
                />
              )}
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </div>


  )
}

export default TruckOrderConfirmation






