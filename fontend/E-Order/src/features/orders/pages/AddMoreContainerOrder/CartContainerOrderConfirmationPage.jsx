import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../../../../config";
import Axios from "axios";

import Sidebar from "../../../../components/layout/Sidebar.jsx";

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

// import { BsFillArrowLeftCircleFill } from "react-icons/bs";

import { seasonOut } from "../../../../action/userAction";

import { useDispatch, useSelector } from "react-redux";

import { AiFillFile } from "react-icons/ai";
import { useLocation } from "react-router-dom"
import Information from "./confirmation/Information";
import Header from "./confirmation/Header";
import Detail from "./confirmation/Detail";
import Remarks from "./confirmation/Remarks";
import { useData } from "../../../../components/auth/CheckToken/FetchData/DataContext";

const CartContainerOrderConfirmationPage = () => {

  const { flavours, ports, shipToParties } = useData();


  const location = useLocation();
  console.log("location.pathname ", location.pathname)
  useEffect(() => {
    return () => {
      if (location.pathname !== "/e-order/cart/confirmation") {
        sessionStorage.clear();
      }
    };
  }, [location]);

  // navigate hook
  const navigate = useNavigate();
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
  // toast hook
  const [matchingPoRef, setMatchingPoRef] = useState(false);
  const toast = useToast();
  const id = "hello-toast";
  // validator state hook
  const [validator, setValidator] = useState(false);

  const [existingPo, setExsitingPo] = useState([]);
  console.log("existingPo",existingPo)
  const getExistingPo = () => {
    let userToken = localStorage.getItem("tokek");
    Axios.get(API_URL + "/order/get_po", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setExsitingPo(res.data);
      })
      .catch((err) => {
      });
  };
  // get ports based on company id


  useEffect(() => {
    getExistingPo();
  }, [user]);

  // get current date
  // let  = new Date().toLocaleDateString('en-US');
  const d = new Date();
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var mm = month[d.getMonth()]; // Use d.getMonth() directly without adding 1
  var dd = d.getDate();
  var yy = d.getFullYear();
  var currentDate = mm + ' ' + dd + ', ' + yy;

  // get order details from local storage
  const [containerOrders, setContainerOrders] = useState(() => {
    const storedOrders = sessionStorage.getItem('orderDetails');
    return storedOrders ? JSON.parse(storedOrders) : [];
  });

  const [containerOrdersInformation, setContainerOrdersInformation] = useState(() => {
    const storedOrdersInformation = sessionStorage.getItem('orderDetailsInformation');
    return storedOrdersInformation ? JSON.parse(storedOrdersInformation) : [];
  });

  const [created_date, setCreatedDate] = useState();
  useEffect(() => {
    sessionStorage.setItem('orderDetails', JSON.stringify(containerOrders));
  }, [containerOrders]);

  useEffect(() => {
    sessionStorage.setItem('orderDetailsInformation', JSON.stringify(containerOrdersInformation));
  }, [containerOrdersInformation]);


  const dispatch = useDispatch();

  //get user_id and company_id from redux
  const { user_id, user, company_id } = useSelector((state) => {
    return {
      user_id: state.userReducer.user_id,
      company_id: state.userReducer.company_id,
      user: state.userReducer.user,
    };
  });

  const [prevOrderId, setPrevOrderId] = useState([]);
  const getOrderCartId = () => {
    let userToken = localStorage.getItem("tokek");
    const delv_year = containerOrdersInformation.delv_week ? containerOrdersInformation.delv_week.toString().slice(0, 4) : "";
    Axios.get(API_URL + `/order/get_id?year=${delv_year}`, {
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

  }, [user]);

  useEffect(() => {
    const newOrders = containerOrders.map((order, orderIndex) => {
      const summary = {};

      // Summarize containerList Flavours only if bulk is not true
      if (!order.order.detail.bulk || order.order.detail.bulk.toString() === "0") {
        order.order.detail.containerList.forEach(container => {
          container.Flavour.forEach(flavour => {
            const sku = flavour.sku;
            const qty = parseInt(flavour.qty, 10);
            const moq = flavour.moq;

            if (summary[sku]) {
              summary[sku].qty += qty;
              summary[sku].moq = moq;  // Assuming `moq` is consistent for the same SKU
            } else {
              summary[sku] = { qty, moq };
            }
          });
        });
      }

      // Summarize bulkList Flavours if bulk is true
      if (order.order.detail.bulk) {
        order.order.detail.bulkList.Flavour.forEach(flavour => {
          const sku = flavour.sku;
          const qty = parseInt(flavour.qty, 10);
          const moq = flavour.moq;

          if (summary[sku]) {
            summary[sku].qty += qty;
            summary[sku].moq = moq;  // Assuming `moq` is consistent for the same SKU
          } else {
            summary[sku] = { qty, moq };
          }
        });
      }

      // Convert summary into the required format
      const summaryArray = {
        detail_id: (orderIndex + 1).toString(),
        Flavour: Object.keys(summary).filter(sku => summary[sku].qty > 0).map(sku => ({
          sku,
          qty: summary[sku].qty.toString(),
          moq: summary[sku].moq
        }))
      };

      // Update the order with the new summary
      return {
        ...order,
        order: {
          ...order.order,
          summary: summaryArray
        }
      };
    });

    // Update state with newOrders
    setContainerOrders(newOrders);

  }, []); // Added containerOrders as a dependency
  // =================================================== POST TO AXIOS ======================================================

  // const [rawOrderID, setRawOrderID] = useState()

  // setTimeout(() => {
  //     setRawOrderID(prevOrderId[0].LATEST)

  // }, 1500)

  const [successfulOrder, setSuccessfulOrder] = useState(true);
  const [cart_id, setCart_id] = useState([]);
  const addCartId = (newId) => {
    setCart_id(prevCartIds => [...prevCartIds, newId]);
  };


  const [backendData, setBackendData] = useState([])
  useEffect(() => {

    const backendDataMaking = {
      order: containerOrders.map(containerOrder => {
        const header = containerOrder.order.header;
        const detail = containerOrder.order.detail;
        const summary = containerOrder.order.summary;

        return {
          "delv_year": containerOrdersInformation.delv_year,
          "delv_week_desc": containerOrdersInformation.delv_week_desc,
          "delv_week": containerOrdersInformation.delv_week,
          "po_buyer": header.po_buyer,
          "stuffing_date": "",
          "port_shipment": header.port_shipment,
          "ship_to": header.ship_to,
          "po_url": containerOrdersInformation.po_url,
          "final_dest": header.final_dest,
          "remarks": detail.remarks,
          "detail": detail.bulk === false ?
            detail.containerList.map((container, containerIdx) => ({
              "detail_id": containerIdx + 1,
              "cont_size": detail.cont_size,
              "cont_qty": detail.cont_qty,
              "bulk": detail.bulk,
              "custom": container.custom === false || container.custom.toLocaleString() === "0" || container.custom === null ? 0 : 1,
              "Flavour":
                container.Flavour.map(flavour => ({
                  "sku": flavour.sku,
                  "qty": flavour.qty
                }))
            }))
            :
            [{
              "detail_id": detail.bulkList.detail_id,
              "cont_size": detail.cont_size,
              "cont_qty": detail.cont_qty,
              "bulk": detail.bulk,
              "Flavour": detail.bulkList.Flavour.map(flavour => ({
                "sku": flavour.sku,
                "qty": flavour.qty
              }))
            }],
          "summary": summary.Flavour.map((sum, sumIdx) => ({
            "detail_id": sumIdx + 1,
            "sku": sum.sku,
            "qty": sum.qty
          }))
        };
      })
    };
    containerOrders.forEach(order => {
      addCartId(order.cart_id);
    });
    setCreatedDate(containerOrders[0].order.header.created_date)
    setBackendData(backendDataMaking)
  }, [containerOrders])

  const formatNumber = (value) => {
    if (value === '') return '';
    if (value === undefined) return '';
    return parseFloat(value).toLocaleString(); // Format number with commas
  };

  const handleOrder = () => {
    setButtonLoading(true);
    let userToken = localStorage.getItem("tokek");
    console.log("data", backendData)
    Axios.post(`${API_URL}/order/add_order`, backendData, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        console.log('POST request successful:', res);
        if (res.data.success === true) {

          cart_id.forEach((cart_id) => {
            Axios.delete(`${API_URL}/cart/delete?cart_id=${cart_id}`, {
              headers: {
                Authorization: `Bearer ${userToken}`,
              },
              data: { company_id, created_date },
            })
              .then((deleteRes) => {
                console.log('DELETE request successful:', deleteRes);
                setButtonLoading(false);
                navigate("/e-order/order/confirmation/done");
              })
              .catch((deleteErr) => {
                console.error('Error making DELETE request:', deleteErr);
                setButtonLoading(false);
                toast({
                  title: 'Error!',
                  description: 'Failed to delete draft',
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
                  className: 'pb-5',
                });
              });
          })
        }
      })
      .catch((err) => {
        console.error('Error making POST request:', err);
        setButtonLoading(false);
        toast({
          title: 'Error!',
          description: 'Failed to input item',
          status: 'error',
          duration: 3000,
          isClosable: true,
          className: 'pb-5',
        });
      });
  };



  const [buttonLoading, setButtonLoading] = useState(false);

  const {
    isOpen: isOpenModalConfirm,
    onOpen: onOpenModalConfirm,
    onClose: onCloseModalConfirm,
  } = useDisclosure();


  const [timeoutDisable, setTimeoutDisable] = useState(false);
  const [initialiseTimeoutDisable, setInitialiseTimeoutDisable] =
    useState(false);

  if (!initialiseTimeoutDisable) {
    setTimeout(() => {
      setTimeoutDisable(true);
    }, 1500);
    setInitialiseTimeoutDisable(true);
  }


  const flavorLookup = flavours.reduce((lookup, flavor) => {
    lookup[flavor.product_code] = flavor;
    return lookup;
  }, {});

  const portsLookup = ports.reduce((lookup, port) => {
    lookup[port.md_id] = port;
    return lookup;
  }, {});

  const shiptoLookup = shipToParties.reduce((lookup, stp) => {
    lookup[stp.keyy] = stp;
    return lookup;
  }, {});

  return (
    <div>
      {/* NAVBAR */}

      <Modal
        // initialFocusRef={initialRefConfirm}
        isOpen={isOpenModalConfirm}
        onClose={onCloseModalConfirm}
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
                }}
              >
                Cancel
              </button>
              {buttonLoading === false && (
                <button
                  className="btn btn-danger px-2 mx-1"
                  onClick={() => {
                    if (matchingPoRef) {
                      if (!toast.isActive(id)) {
                        toast({
                          id,
                          title: "Oopsie!",
                          description: `You cannot put an existing PO Buyer., please input a different PO Buyer.`,
                          status: "error",
                          duration: 6000,
                          isClosable: true,
                        });
                      }
                    } else if (!matchingPoRef) {
                      setValidator(false);
                      setButtonLoading(true);
                      handleOrder();
                    }
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
              <Information
                containerOrdersInformation={containerOrdersInformation}
              />
              {/* ORDER */}
              {containerOrders.map((orderItem, orderIndex) => {

                const portsDetails = portsLookup[orderItem.order.header.port_shipment];
                const shiptoDetails = shiptoLookup[orderItem.order.header.ship_to];
                return (
                  <div className="card-body border border_radius_10px shadow shadow-sm mt-1 mb-3">
                    <div className="grey_text_bold fs-5 my-2">
                      Order {orderIndex + 1}
                    </div>

                    <div className="row ">

                      <Header
                        orderItem={orderItem}
                        currentDate={currentDate}
                        portsDetails={portsDetails}
                        shiptoDetails={shiptoDetails}
                        API_URL={API_URL}
                        Tooltip={Tooltip}
                        AiFillFile={AiFillFile}
                      />

                      <Detail
                        orderItem={orderItem}
                        flavorLookup={flavorLookup}
                        Image={Image}
                        formatNumber={formatNumber}
                      />

                    </div>
                    <Remarks
                      orderItem={orderItem}
                    />
                  </div>
                );
              })}


            </div>

            <div className=" shadow-none fixed-bottom button_bottom_sticky d-none d-sm-none d-md-block d-lg-block d-xl-block d-xxl-block">
              <div className=" shadow-lg row d-flex justify-content-evenly bg-white py-2 px-0 border-top">
                <div className="col-6 px-5 d-flex justify-content-start">
                  {buttonLoading === false && (
                    <button
                      className="btn btn-outline-secondary shadow w-50 mt-1 p-2 fw-bold"
                      onClick={() => {
                        setButtonLoading(true);
                        setTimeout(() => {
                          navigate("/e-order/cart");
                        }, 1000);
                      }}
                      disabled={!timeoutDisable}
                    >
                      Back to Draft Order
                    </button>
                  )}
                  {buttonLoading === true && (
                    <Button
                      colorscheme="grey"
                      variant="outline"
                      className="btn shadow w-50 mt-1 p-2 fw-bold"
                      isLoading
                    />
                  )}
                </div>


                <div className="col-6 px-5 d-flex justify-content-end">
                  {buttonLoading === false && (
                    <button
                      className="btn btn-danger shadow w-50 mt-1 p-2 fw-bold"
                      onClick={() => {
                        const isMatching =
                          existingPo.some((item) =>
                            item.po_buyer === containerOrders[0].poRef);
                        setMatchingPoRef(isMatching);
                        onOpenModalConfirm();
                        console.log("ORDER", backendData)



                        // Call any other functions here if needed.
                      }}
                      disabled={!timeoutDisable}
                    >
                      Submit
                    </button>
                  )}
                  {buttonLoading === true && (
                    <Button
                      colorscheme="red"
                      variant="background"
                      className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                      isLoading
                    />
                  )}
                </div>
              </div>
            </div>

            <div className=" shadow-none fixed-bottom  d-block bg-white border-top d-md-none vw-100 " >
              <div className=" shadow-lg row d-flex justify-content-center  py-2 px-0 ">
                <div className="col-12">
                  {buttonLoading === false && (
                    <button
                      className="btn btn-outline-secondary shadow w-75 mt-1 p-2 fw-bold"
                      onClick={() => {
                        setButtonLoading(true);
                        setTimeout(() => {
                          navigate("/e-order/order");
                        }, 1000);
                      }}
                      disabled={!timeoutDisable}
                    >
                      Back to Place Order
                    </button>
                  )}
                  {buttonLoading === true && (
                    <Button
                      colorscheme="grey"
                      variant="outline"
                      className="btn shadow w-75 mt-1 p-2 fw-bold"
                      isLoading
                    />
                  )}
                </div>


                <div className="col-12">
                  {buttonLoading === false && (
                    <button
                      className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                      onClick={() => {
                        const isMatching =
                          existingPo.some((item) =>
                            item.po_buyer === containerOrders[0].poRef);
                        setMatchingPoRef(isMatching);
                        onOpenModalConfirm();


                        // Call any other functions here if needed.
                      }}
                      disabled={!timeoutDisable}
                    >
                      Submit
                    </button>
                  )}
                  {buttonLoading === true && (
                    <Button
                      colorscheme="red"
                      variant="background"
                      className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                      isLoading
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );

};

export default CartContainerOrderConfirmationPage







