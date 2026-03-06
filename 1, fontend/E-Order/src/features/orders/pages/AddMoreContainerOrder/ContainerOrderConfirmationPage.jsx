import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../../../../config";
import Axios from "axios";

import SearchBarComponent from "../../../../components/inputs/SearchBarComponent.jsx";
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
import { useData } from "../../../auth/components/CheckToken/FetchData/DataContext";

const ContainerOrderConfirmationPage = ({ edit = false }) => {

  const { flavours: allFlavours, ports, shipToParties, ostp } = useData();

  const flavours = allFlavours.filter(p =>
    Array.isArray(p.shipment_type) && p.shipment_type.includes(0)
  );


  const location = useLocation();
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

  const [billtoparties, setbilltoparties] = useState([]);
  const [notifytoparties, setnotifytoparties] = useState([]);

  useEffect(() => {
    if (ostp?.BillTP?.length > 0 || ostp?.Notify?.length > 0) {
      setbilltoparties(ostp.BillTP);
      setnotifytoparties(ostp.Notify);
    } else {
      setbilltoparties([]);
      setnotifytoparties([]);
    }
  }, [ostp]);



  useEffect(() => {
    getExistingPo();
  }, []);

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
    const storedOrders = sessionStorage.getItem('containerOrders');
    return storedOrders ? JSON.parse(storedOrders) : [];
  });

  const [containerOrdersInformation, setContainerOrdersInformation] = useState(() => {
    const storedOrdersInformation = sessionStorage.getItem('containerOrdersInformation');
    return storedOrdersInformation ? JSON.parse(storedOrdersInformation) : [];
  });

  const [created_date, setCreatedDate] = useState();


  const dispatch = useDispatch();

  //get user_id and company_id from redux
  const { user_id, user, company_id } = useSelector((state) => {
    return {
      user_id: state.userReducer.user_id,
      company_id: state.userReducer.company_id,
      user: state.userReducer.user,
    };
  });

  // const [prevOrderId, setPrevOrderId] = useState([]);
  // const getOrderCartId = () => {
  //   let userToken = localStorage.getItem("tokek");
  //   const delv_year = containerOrdersInformation.delv_week_id ? containerOrdersInformation.delv_week_id.toString().slice(0, 4) : "";
  //   Axios.get(API_URL + `/order/get_id?year=${delv_year}`, {
  //     headers: {
  //       Authorization: `Bearer ${userToken}`,
  //     },
  //   })
  //     .then((res) => {
  //       setPrevOrderId(res.data[0].LATEST);
  //     })
  //     .catch((err) => {
  //     });
  // };


  // useEffect(() => {
  //   getOrderCartId();

  // }, [user]);


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

  const [backendData, setBackendData] = useState({ order: [] })

  const [triggerBackendDatamaking, setTriggerBackendDatamaking] = useState(false)


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
    sessionStorage.setItem("containerOrders", JSON.stringify(newOrders));
    // Update state with newOrders
    setTriggerBackendDatamaking(prev => !prev);
    setContainerOrders(newOrders);
  }, []);

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
          "stuffing_date": containerOrdersInformation.stuffing_date,
          "po_buyer": header.po_buyer,
          "port_shipment": header.port_shipment,
          "ship_to": header.ship_to,
          "bill_to": header.bill_to,
          "notify_to_1": header.notify_to_1,
          "notify_to_2": header.notify_to_2,
          "po_url": header.po_url,
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
    if (edit) {
      containerOrders.forEach(order => {
        addCartId(order.order.header.cart_id);
      });
      setCreatedDate(containerOrders[0].order.header.created_date)
    }
    setBackendData(backendDataMaking);
  }, [triggerBackendDatamaking])
  const isAnySummaryEmpty = (backendData) => {
    return backendData.order.some((item) => {
      const flavourArray = item.summary;
      return !flavourArray || flavourArray.length === 0;
    });
  };

  const checkSummaryEmpty = () => {
    if (isAnySummaryEmpty(backendData)) {
      setSessionStorageTrigger(prev => !prev);
    }
  };


  const handleOrder = () => {
    setButtonLoading(true); // Set loading before making API calls
    let userToken = localStorage.getItem("tokek");

    Axios.post(`${API_URL}/order/add_order`, backendData, {
      // Axios.post(`${API_URL}/debugRouter/add_order`, backendData, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then(async (res) => {
        if (res.status === 200) {
          console.log("POST request successful:", res);

          if (edit) {
            console.log("Cart Mode, waiting for deleting Cart ID");

            // Array of delete requests
            const deleteRequests = cart_id.map((id) =>
              Axios.delete(`${API_URL}/cart/delete?cart_id=${id}`, {
                headers: { Authorization: `Bearer ${userToken}` },
                data: { company_id, created_date },
              })
            );

            try {
              const results = await Promise.allSettled(deleteRequests);

              // Check if any deletions failed
              const failedDeletions = results.filter((r) => r.status === "rejected");

              if (failedDeletions.length > 0) {
                console.error("Some DELETE requests failed:", failedDeletions);
                toast({
                  title: "Error!",
                  description: "Some drafts failed to delete.",
                  status: "warning",
                  duration: 3000,
                  isClosable: true,
                  className: "pb-5",
                });
              }

              setButtonLoading(false);

              navigate("/e-order/order/confirmation/done");


            } catch (deleteErr) {
              console.error("Error in DELETE requests:", deleteErr);
              setButtonLoading(false);
              toast({
                title: "Error!",
                description: "Failed to delete cart items.",
                status: "error",
                duration: 3000,
                isClosable: true,
                className: "pb-5",
              });
            }
          } else {
            setButtonLoading(false);
            navigate("/e-order/order/confirmation/done");
          }
        }
      })
      .catch((err) => {
        console.error("Error making POST request:", err);
        setButtonLoading(false);
        toast({
          title: "Error!",
          description: "Failed to Input Data",
          status: "error",
          duration: 3000,
          isClosable: true,
          className: "pb-5",
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

  const billtoLookup = billtoparties.reduce((lookup, ostp) => {
    lookup[String(ostp.company_id)] = ostp;
    return lookup;
  }, {});



  const notifytoLookup = notifytoparties.reduce((lookup, ostp) => {
    lookup[String(ostp.company_id)] = ostp;
    return lookup;
  }, {});



  const formatNumber = (value) => {
    if (value === '') return '';
    if (value === undefined) return '';
    return parseFloat(value).toLocaleString(); // Format number with commas
  };

  const [sessionStorageTrigger, setSessionStorageTrigger] = useState(false)

  useEffect(() => {
    setContainerOrders(prevOrders => {
      const newOrders = prevOrders.map((order, orderIndex) => {
        const summary = {};

        // Summarize containerList Flavours only if bulk is not true
        if (!order.order.detail.bulk) {
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

      // Optionally, store the updated orders in session storage

      return newOrders;
    });
  }, [sessionStorageTrigger]);

  return (
    <div>
      {/* NAVBAR */}
      <SearchBarComponent />

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
                By confirming your order, you understand that any modifications
                or cancellations may be subject to our terms and conditions.
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
                const billtoDetails = billtoLookup[orderItem.order.header.bill_to.toLocaleString()];
                const notifytoDetails1 = notifytoLookup[String(orderItem.order.header.notify_to_1)];


                const notifytoDetails2 = notifytoLookup[orderItem.order.header.notify_to_2];

                return (
                  <div key={orderIndex} className="card-body border border_radius_10px shadow shadow-sm mt-1 mb-3">
                    <div className="grey_text_bold fs-5 my-2">
                      Order {orderIndex + 1}
                    </div>
                    <div className="row ">
                      <Header
                        orderItem={orderItem}
                        currentDate={currentDate}
                        portsDetails={portsDetails}
                        shiptoDetails={shiptoDetails}

                        billtoDetails={billtoDetails}
                        notifytoDetails1={notifytoDetails1}
                        notifytoDetails2={notifytoDetails2}

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
                          if (!edit) {
                            navigate("/e-order/order?mode=Container");
                          } else {
                            navigate("/e-order/cart");

                          }
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

                        const containerPoBuyers = containerOrders.map(order =>
                          order?.order?.header?.po_buyer?.trim().toLowerCase()
                        );
                        console.log("containerPoBuyers", containerPoBuyers)
                        const existingPoBuyers = existingPo.map(po =>
                          po?.po_buyer?.trim().toLowerCase()
                        );
                        console.log("existingPoBuyers", existingPoBuyers)

                        const duplicatePoBuyers = containerPoBuyers.filter(po =>
                          existingPoBuyers.includes(po)
                        );
                        console.log("containerPoBuyers", containerPoBuyers)


                        console.log("duplicatePoBuyers", duplicatePoBuyers);
                        const hasDuplicate = duplicatePoBuyers.length > 0;

                        setMatchingPoRef(hasDuplicate);

                        setSessionStorageTrigger(prev => !prev);

                        setTriggerBackendDatamaking(prev => !prev);
                        checkSummaryEmpty();


                        if (hasDuplicate) {
                          toast({
                            id,
                            title: "Oopsie!",
                            description: `Has Duplicate ! check on PO ${duplicatePoBuyers.map(data => data).join(', ')}`,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                          });
                        }

                        if (isAnySummaryEmpty(backendData)) {
                          toast({
                            id,
                            title: "Oopsie!",
                            description: `Please go back and make changes to your data before submitting.`,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                          });



                        }

                        if (isAnySummaryEmpty(backendData) === false && hasDuplicate === false) {
                          setTriggerBackendDatamaking(prev => !prev);
                          onOpenModalConfirm();
                          console.log("isAnySummaryEmpty(backendData)", isAnySummaryEmpty(backendData))
                          console.log("matchingPoRef", matchingPoRef)
                        }

                        // Call any other functions here if needed.
                      }
                      }
                      disabled={!timeoutDisable || !backendData.order || backendData.order.length === 0}
                    >
                      Submit
                    </button>
                  )}
                  {buttonLoading === true && (
                    <Button
                      colorscheme="red"
                      variant="background"
                      className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                      isLoading={buttonLoading}
                      isDisabled={buttonLoading || !backendData.order || backendData.order.length === 0}
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
                          {
                            edit ?
                              navigate("/e-order/cart")
                              :
                              navigate("/e-order/order")
                          }


                        }, 1000);
                      }}
                      disabled={!timeoutDisable}
                    >
                      {edit ? "Back to Cart" : "Back to Place Order"}
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

                        const containerPoBuyers = containerOrders.map(order =>
                          order?.order?.header?.po_buyer?.trim().toLowerCase()
                        );
                        console.log("containerPoBuyers", containerPoBuyers)
                        const existingPoBuyers = existingPo.map(po =>
                          po?.po_buyer?.trim().toLowerCase()
                        );
                        console.log("existingPoBuyers", existingPoBuyers)

                        const duplicatePoBuyers = containerPoBuyers.filter(po =>
                          existingPoBuyers.includes(po)
                        );
                        console.log("containerPoBuyers", containerPoBuyers)


                        console.log("duplicatePoBuyers", duplicatePoBuyers);
                        const hasDuplicate = duplicatePoBuyers.length > 0;

                        setMatchingPoRef(hasDuplicate);

                        setSessionStorageTrigger(prev => !prev);

                        setTriggerBackendDatamaking(prev => !prev);
                        checkSummaryEmpty();


                        if (hasDuplicate) {
                          toast({
                            id,
                            title: "Oopsie!",
                            description: `Has Duplicate ! check on PO ${duplicatePoBuyers.map(data => data).join(', ')}`,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                          });
                        }

                        if (isAnySummaryEmpty(backendData)) {
                          toast({
                            id,
                            title: "Oopsie!",
                            description: `Please go back and make changes to your data before submitting.`,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                          });



                        }

                        if (isAnySummaryEmpty(backendData) === false && hasDuplicate === false) {
                          setTriggerBackendDatamaking(prev => !prev);
                          onOpenModalConfirm();
                          console.log("isAnySummaryEmpty(backendData)", isAnySummaryEmpty(backendData))
                          console.log("matchingPoRef", matchingPoRef)
                        }

                        // Call any other functions here if needed.
                      }
                      }
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

export default ContainerOrderConfirmationPage







