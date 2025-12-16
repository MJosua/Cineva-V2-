//ReactJS utility
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom"
import Axios from "axios";
//chakra_ui
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  useToast,
  useDisclosure,
  Button,
  Tooltip,
  Spinner,
} from "@chakra-ui/react";

import { AiFillCloseCircle } from "react-icons/ai";

import Sidebar from "../components/Sidebar";

//components

import ControlBar from "../components/ControlBar";
// import DesktopSideMenu from "../DesktopSideMenu";
// import ControlBar from "../ControlBar";

////Action
import { seasonOut, logoutAction, loginAction } from "../action/userAction";
import { clearSeasonStorage } from "../action/cartAction";
// import { clearSeasonStorage } from "../../action/cartAction";
// import { seasonOut, logoutAction, loginAction } from "../../action/userAction";

//for back end communication
import { API_URL } from "../config";
// import { API_URL } from "../../config";
import {
  getCartDetails,
  getCartHeader,
  getCreationDetails,
} from "../action/reqAction";

import AddMoreContainerBody from "../components/AddMoreContainer/AddMoreContainerBody";
import AddMoreContainerHeader from "../components/AddMoreContainer/AddMoreContainerHeader";
import AddMoreContainerInformation from "../components/AddMoreContainer/AddMoreContainerInformation";
import CartMoreContainerFooter from "../components/AddMoreContainer/CartMoreContainerFooter";

import {
  AiFillFile
}
  from "react-icons/ai"
import {
  BsThreeDotsVertical,
  // , BsFillDashCircleFill
  // , BsFillCheckCircleFill
} from "react-icons/bs";

import AddMoreTruckBody from "../components/AddMoreTruck/AddMoreTruckBody";
import AddMoreTruckHeader from "../components/AddMoreTruck/AddMoreTruckHeader";
import CartMoreTruckFooter from "../components/AddMoreTruck/CartMoreTruckFooter";
import { useData } from "../components/CheckToken/FetchData/DataContext";

const TestCart = () => {

  const { ports, shipToParties, container, ostp, flavours, flavoursTrucking } = useData();


  const [buttonLoading, setButtonLoading] = useState(false);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  const dispatch = useDispatch();
  //get user data from redux
  const { user_id, company_id, active, max_sku, pallet, company_name } = useSelector((state) => {
    return {
      user_id: state.userReducer.user_id,
      company_id: state.userReducer.company_id,
      active: state.userReducer.active,
      max_sku: state.userReducer.max_sku,
      pallet: state.userReducer.pallet,
      company_name: state.userReducer.company_name,
    };
  });


  let userToken = localStorage.getItem("tokek");
  const navigate = useNavigate();
  const toast = useToast();
  const id = "hello-toast";
  const [mode, setMode] = useState("")
  const [selectedCreationTime, setSelectedCreationTime] = useState("");
  const [selectedCartId, setSelectedCartId] = useState(0);


  // ================================================== GET DATA ====================================================




  // get user data from localstorage
  // let userData = localStorage.getItem('userLogStore');
  // let getUserData = JSON.parse(userData);
  const [saveDraft, setSaveDraft] = useState(false);
  // const user_id = getUserData[0].user_id;
  // const company_id = getUserData[0].company_id
  const getOrderDetails = JSON.parse(sessionStorage.getItem("containerOrders"));

  const initialOrderInformation = {

    delv_week: "",
    delv_week_desc: "",
    delv_year: "",
    delv_week_id: "",
    po_url: "",

  }

  const initialOrders = [
    {
      "order": {
        "header": {
          "po_buyer": "",
          "port_shipment": "",
          "ship_to": "",
          "final_dest": ""
        },
        "detail": {
          "cont_size": "4",
          "cont_qty": "1",
          "bulk": false,
          "remarks": "",
          "containerList": [
            {
              "detail_id": "1",
              "Flavour": [
                {
                  "sku": "-1",
                  "qty": 0,
                  "Flavour_tollingID": 0,
                  "qty_max": "",
                  "moq": "",
                  "palete_qty": 0
                },
                {
                  "sku": "-1",
                  "qty": 0,
                  "Flavour_tollingID": 0,
                  "qty_max": "",
                  "moq": "",
                  "palete_qty": 0
                }
              ]
            }
          ],
          "bulkList": {
            "detail_id": 1,
            "Flavour": [
              {
                "sku": "-1",
                "qty": 0,
                "Flavour_tollingID": 0,
                "qty_max": "",
                "moq": "",
                "palete_qty": 0,
                "qty_real": ""
              },
              {
                "sku": "-1",
                "qty": 0,
                "Flavour_tollingID": 0,
                "qty_max": "",
                "moq": "",
                "palete_qty": 0,
                "qty_real": ""
              }
            ]
          }
        },
        "summary": {
          "detail_id": "1",
          "Flavour": []
        }
      }
    }
  ];

  const [orderDetails, setOrderDetails] = useState([]);

  const [orderDetailsInformation, setOrderDetailsInformation] = useState([]);



  useEffect(() => {
    sessionStorage.setItem('containerOrders', JSON.stringify(orderDetails));
  }, [orderDetails])

  useEffect(() => {
    sessionStorage.setItem('containerOrdersInformation', JSON.stringify(orderDetailsInformation));
  }, [orderDetailsInformation])

  const initialTruckOrders = [];

  const [truckOrderDetails, setTruckOrders] = useState([]);

  useEffect(() => {
    sessionStorage.setItem('truckOrders', JSON.stringify(truckOrderDetails));
  }, [truckOrderDetails]);


  const [existingPo, setExsitingPo] = useState([]);
  const getExistingPo = () => {
    Axios.get(API_URL + "/order/get_po", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setExsitingPo(res.data);
        setLoading(false);
      })
      .catch((err) => {
      });
  };


  useEffect(() => {
    if (flavours.length > 1) {
      const sortedData1 = flavours.sort((a, b) => a.cat_name.localeCompare(b.cat_name));
      setFlavours(prevFlavours => [...prevFlavours, ...sortedData1]);

    }
    if (flavoursTrucking.length > 1) {

      const sortedData2 = flavoursTrucking.sort((a, b) => a.cat_name.localeCompare(b.cat_name));
      setFlavours(prevFlavours => [...prevFlavours, ...sortedData2]);
    }

  }, [flavours, flavoursTrucking])



  useEffect(() => {
    getExistingPo();
  }, [])

  const [selectedCreation_date, setSelectedCreation_date] = useState();
  const [selectedCompanyId, setSelectedCompanyId] = useState(0);
  // get order header
  const [cartHeader, setCartHeader] = useState([]);
  // get order details
  const [cartDetails, setCartDetails] = useState([]);

  const [flavoursData, setFlavours] = useState([]);


  const [billtoparties, setbilltoparties] = useState([]);
  // get Creation Detail
  const [creationDetails, setCreationDetails] = useState([]);
  // get stuffingWeeks Detail
  const [actionDelete, setActionDelete] = useState(false);
  const handleToggle = () => {
    setActionDelete(prevState => !prevState); // Toggle the state
    setSelectedCartId(0);
  };
  // trigger to rerender page
  useEffect(() => {
    Promise.all([
      getCartHeader(userToken),
      getCartDetails(userToken)
    ])
      .then(([headerRes, detailsRes]) => {
        setCartHeader(headerRes.data);
        console.log("DATA", headerRes.data)
        setCartDetails(detailsRes.data);
        console.log("Details", detailsRes.data)
        // console.log("====================Order===============================")
        // console.log("Cart header data:", headerRes.data);
        // console.log("Cart details data:", detailsRes.data);
        // console.log("====================------===============================")
      })
      .catch(error => {
        // console.error("Error fetching cart data:", error);
      });


    Promise.all([
      getCreationDetails(userToken),
    ])
      .then(([creationDetailsRes]) => {
        setLoading(false);
        setCreationDetails(creationDetailsRes.data);
        // console.log("Creation details data:", creationDetailsRes.data);
        // console.log("====================------===============================")

      })
      .catch(error => {
        console.error("Error fetching data:", error);
      });
  }, [saveDraft, actionDelete]);
  //  ==================================================== STUFFING WEEK =================================




  const currentDate = new Date();



  // get current week number
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const [stuffingWeeks, setStuffingWeeks] = useState([]);
  // stuffing week state hook
  const [hasError, setHasError] = useState(false);
  const [errors, setErrors] = useState([]);


  const flavorLookup = flavoursData.reduce((lookup, flavor) => {
    lookup[flavor.product_code] = flavor;
    return lookup;
  }, {});


  const portLookup = ports.reduce((lookup, ports) => {
    lookup[ports.md_id] = ports;
    return lookup;
  }, {});


  const handleCheckoutTruck = () => {

    if (!hasError) {
      const key = 'truckOrders';
      try {
        // Parse the session storage item as JSON
        const value = JSON.parse(sessionStorage.getItem(key));

        // Check if the value is an array
        if (Array.isArray(value)) {
          let hasError = false;

          // Create a lookup for the flavors based on ID


          value.forEach((item, index) => {
            const poBuyer = item.po_buyer;
            const port = item.port;
            const delvDate = item.delv_date;
            const flavors = item.flavors || [];

            if (new Date(delvDate) < new Date()) {
              toast({
                title: "Error!",
                description: `Delv_date Order at Truck ${index + 1} is too old . Unable to checkout order. The selected delivery date has already passed the allowed delivery timeline. Please reselect a valid date..`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }

            if (!poBuyer) {
              toast({
                title: "Error!",
                description: `Order at Truck ${index + 1} has an empty po_buyer.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }

            if (existingPo.some(existing => existing.po_buyer === poBuyer)) {
              toast({
                title: "Error!",
                description: `Po_buyer "${poBuyer}" found at Truck ${index + 1} already exists.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }



            if (!delvDate) {
              toast({
                title: "Error!",
                description: `Order at Truck ${index + 1} has an empty delv_date.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }




            if (!port) {
              toast({
                title: "Error!",
                description: `Order at Truck ${index + 1} has an empty destination.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }
            // Check flavors array
            item.flavors.forEach((flavor, flavorIndex) => {
              const qty = flavor.qty;
              if (!qty || qty.toLocaleString() === "0") {
                toast({
                  title: "Error!",
                  description: `Order at Truck ${index + 1}, flavor ${flavorIndex + 1} can't be empty or zero.`,
                  status: "error",
                  duration: 6000,
                  isClosable: true
                });
                hasError = true;
              }

              // Check if flavor ID exists in the lookup
              const existingFlavor = flavorLookup[flavor.sku];
              if (existingFlavor && qty < existingFlavor.truck_moq) {
                toast({
                  title: "Error!",
                  description: `Order at Truck ${index + 1}, flavor ${flavorIndex + 1} has a quantity less than the minimum order quantity (MOQ) of ${existingFlavor.moq}.`,
                  status: "error",
                  duration: 6000,
                  isClosable: true
                });
                hasError = true;
              }
            });
          });

          if (!hasError) {
            // Proceed with navigation
            navigate("/e-order/cart/truckorder/confirmation");
          } else {
            setLoading(false)
            setButtonLoading(false)
          }
        } else {
        }
      } catch (e) {
        // Handle the case where parsing fails (not JSON data)
      }
    }
  };

  const handleCheckoutContainer = () => {
    let errors = [];
    if (!hasError) {
      const key = 'containerOrders';
      const key2 = 'containerOrdersInformation';
      try {
        // Parse the session storage item as JSON
        const value = JSON.parse(sessionStorage.getItem(key));
        const value2 = JSON.parse(sessionStorage.getItem(key2));

        const aggregatedFlavors = {};


        // Check if the value is an array
        if (Array.isArray(value)) {
          let hasError = false;

          // Create a lookup for the flavors based on ID



          value.forEach((item, index) => {
            const poBuyer = item.order.header.po_buyer;
            const delvDate = value2.delv_week; // Assuming delv_date is a property inside order (adjust if different)
            const bulkStatus = item.order.detail.bulk
            let flavors = [];
            flavors = item.order.detail.containerList.map(container => container.Flavour);




            if (!poBuyer) {
              toast({
                title: "Error!",
                description: `Order at Container ${index + 1} has an empty po_buyer.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
              errors.push({ orderIndex: index, errorType: 'po_buyer' });
              setButtonLoading(false)

            }

            if (existingPo.some(existing => existing.po_buyer === poBuyer)) {
              toast({
                title: "Error!",
                description: `Po_buyer "${poBuyer}" found at Container ${index + 1} already exists.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
              errors.push({ orderIndex: index, errorType: 'existing_po_buyer' });
              setButtonLoading(false)

            }

            if (!delvDate) {
              toast({
                title: "Error!",
                description: `Order at Container ${index + 1} has an empty delv_date.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
              errors.push({ orderIndex: index, errorType: 'delv_date' });
              setButtonLoading(false)

            }



            // Check flavors array
            if (bulkStatus === false) {


              // First pass to aggregate quantities
              flavors.forEach((flavor, flavorIndex) => {
                flavor.forEach((flavorList) => {
                  const sku = flavorList.sku;
                  const qty = Number(flavorList.qty); // Convert qty to number for summation

                  if (!aggregatedFlavors[sku]) {
                    aggregatedFlavors[sku] = { qty: 0, moq: flavorList.moq, flavorIndex: flavorIndex };
                  }

                  aggregatedFlavors[sku].qty += qty;
                });

              });



              flavors.forEach((flavor, flavorIndex) => {
                flavor.forEach((flavorList, flavorListIndex) => {

                  const qty = flavorList.qty; // Convert qty to number for comparison

                  // Check for empty or zero qty
                  if (flavorListIndex === 0) {
                    if (!qty || qty === 0 || qty === "0") {
                      toast({
                        title: "Error!",
                        description: `Order No ${index + 1}, Container ${flavorIndex + 1} can't be empty or zero.`,
                        status: "error",
                        duration: 6000,
                        isClosable: true
                      });
                      errors.push({ orderIndex: index, flavorIndex, errorType: 'qty' });
                      hasError = true;

                    }
                  }

                  // Check if flavor ID exists in the lookup and validate qty against MOQ


                }
                )

              });
              setTimeout(() => {
                setButtonLoading(false);
              }, 1000);

            } else {
              item.order.detail.bulkList.Flavour.forEach((bulkFlavor, bulkFlavorIndex) => {
                const qty = bulkFlavor.qty; // Convert qty to number for comparison

                // Check for empty or zero qty
                if ((!qty || qty === 0 || qty === "0") && (bulkFlavorIndex === 0 || bulkFlavorIndex === "0")) {
                  toast({
                    title: "Error!",
                    description: `Order No ${index + 1}, Bulk Flavour ${bulkFlavorIndex + 1} can't be empty or zero.`,
                    status: "error",
                    duration: 6000,
                    isClosable: true
                  });
                  errors.push({ orderIndex: index, bulkFlavorIndex, errorType: 'bulk_qty' });
                  hasError = true;
                  setButtonLoading(false)

                }

                const existingFlavor = flavorLookup[bulkFlavor.sku];
                if (existingFlavor && qty < existingFlavor.moq) {
                  toast({
                    title: "Error!",
                    description: `Order at Order ${index + 1}, flavor ${bulkFlavorIndex + 1} has a quantity less than the minimum order quantity (MOQ) of ${existingFlavor.moq}.`,
                    status: "error",
                    duration: 6000,
                    isClosable: true
                  });
                  hasError = true;
                  setButtonLoading(false)

                  errors.push({ orderIndex: index, bulkFlavor, errorType: 'moq' });
                }

              });




            }



          });

          console.log("aggregatedFlavors", aggregatedFlavors)

          // Second pass to validate quantities
          Object.entries(aggregatedFlavors).forEach(([sku, { qty, moq, flavorIndex }]) => {
            if (qty < moq) {
              toast({
                title: "Error!",
                description: `Order ${qty} has a quantity less than the minimum order quantity (MOQ) of ${moq}.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
              errors.push({ orderIndex: flavorIndex, errorType: 'moq' });
            }
          });

          setErrors(errors);
          if (!hasError) {
            // Proceed with navigation
            // navigate("/e-order/truckorder/confirmation");

            if (active === 1) {

              {
                navigate("/e-order/cart/confirmation");
              }
            } else {
              toast({
                title: "Error!",
                description: `Your Account is not allowed to proceed order (Inactive). Please contact your admin.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
            }



          }
        } else {
        }
      } catch (e) {

        // Handle the case where parsing fails (not JSON data)
      }
    }
  };


  // ========================= CLEAR SESSION STORAGE =================================

  // //Action
  // import { seasonOut } from '../action/userAction'
  // import { clearSeasonStorage } from '../action/cartAction'

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

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

  if (initialise === false) {
    clearSeasonStorage(order);
    setInitialise(true);
  }

  // ==========================================================================

  // ============================================= DELETE DRAFT MODAL ===============================================

  // modal
  const {
    isOpen: isOpenModalConfirm,
    onOpen: onOpenModalConfirm,
    onClose: onCloseModalConfirm,
  } = useDisclosure();

  const {
    isOpen: isOpenModalEdit,
    onOpen: onOpenModalEdit,
    onClose: onCloseModalEdit,
  } = useDisclosure();

  const autoReload = () => {
    // return window.location.reload(val)
    getCreationDetails(userToken);
    getCartHeader(userToken);
    getCartDetails(userToken);
  };

  const onEdit = () => {
    <>
    </>
  }

  const onConfirm = () => {

    const created_date = selectedCreationTime;
    if (selectedCartId.length > 0) {
      selectedCartId.forEach((cartId) => {
        Axios.delete(
          `${API_URL}/cart/delete?cart_id=${cartId}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
            data: { company_id, created_date },
          }
        )
          .then((res) => {
            console.log("res in delete cart", res);
            onCloseModalConfirm();
            toast({
              title: `Success!`,
              description: `Successfull to delete item with cart ID ${cartId}`,
              status: "success",
              duration: 3000,
              isClosable: true,
              className: "pb-5",
            });

            handleToggle();
            setSelectedCartId(0);
          })
          .catch((err) => {
            console.log("error in delete cart", err);
            toast({
              title: `Error!`,
              description: `Failed to delete item with cart ID ${cartId}`,
              status: "error",
              duration: 3000,
              isClosable: true,
              className: "pb-5",
            });
          });
      });
    }
  };



  // ================================================ EDIT DRAFT ====================================================

  // Go through all of cart headers
  // Check if cart header creation time = selected creation time
  // If true, set the first array of orderDetails into the cart header

  const [editDraft, setEditDraft] = useState(false);
  const [checkout, setCheckout] = useState(false);
  // console.log('selectedCreationTime', selectedCreationTime)
  // console.log('cartHeader[i].created_date', cartHeader)


  const handleConfirmClose = () => {

    setOrderDetails([])
    setOrderDetailsInformation([])
    setTruckOrders([])

    sessionStorage.setItem('containerOrders', JSON.stringify([]));
    sessionStorage.setItem('containerOrdersInformation', JSON.stringify([]));
    sessionStorage.setItem('truckOrders', JSON.stringify([]));


    onCloseModalEdit();
  }

  const [cart_id, setCart_id] = useState([]);


  useEffect(() => {
    let cart_id = [];
    for (let i = 0; i < cartHeader.length; i++) {
      if (selectedCreationTime === cartHeader[i].created_date) {
        cart_id.push(cartHeader[i].cart_id);
      }
    }
    setSelectedCartId(cart_id)
    setCart_id(cart_id)
  }, [selectedCreationTime])

  //To Reset Cart Id


  if (editDraft) {


    onOpenModalEdit()

    let editStatus = true;


    let created_date = selectedCreationTime;
    let editDetails = { editStatus, cart_id, created_date };

    sessionStorage.setItem("editDraft", JSON.stringify(editDetails));



    cart_id.sort((a, b) => a - b).forEach((cart_id) => {
      const cartHeaderSelect = cartHeader.find(item => item.cart_id === cart_id);
      if (cartHeaderSelect) {
        console.log("cartHeaderSelect", cartHeaderSelect)
        const cartDetailSelect = cartDetails.filter(item => item.cart_id === cart_id);

        const created_date = cartHeaderSelect.created_date;
        //Belum Dipake


        const delv_week = cartHeaderSelect.delv_week;
        const delv_week_desc = cartHeaderSelect.delv_week_desc;
        const delv_year = cartHeaderSelect.delv_year;
        const po_url = cartHeaderSelect.po_url;
        const delivery_date = cartHeaderSelect.stuffing_date;
        const formatted = delivery_date.split('T')[0];

        const initialOrderInformation = {

          delv_week: delv_week,
          delv_week_desc: delv_week_desc,
          delv_year: delv_year,
          po_url: po_url,
          delv_week_id: parseInt(`${delv_year}${delv_week}`, 10)
        }

        if (cartDetailSelect) {
          const selectedFlavor1 = flavorLookup[cartDetailSelect[0].sku1];
          const selectedFlavor2 = flavorLookup[cartDetailSelect[0].sku2];
          const selectedFlavor3 = flavorLookup[cartDetailSelect[0].sku3];
          const cont_qty = cartDetailSelect[0].cont_qty;

          const container_name = cartDetailSelect[0].container_name;

          const company_id = cartDetailSelect[0].company_id;



          setSelectedCreation_date(created_date)
          setSelectedCompanyId(company_id)




          const initialOrders = [{
            order: {
              header: {
                cart_id: cart_id || "",
                po_buyer: cartHeaderSelect.po_buyer || "",
                po_url: cartHeaderSelect.po_url || "",
                port_shipment: cartHeaderSelect.port_shipment ? cartHeaderSelect.port_shipment.toString() : "",
                ship_to: cartHeaderSelect.ship_to ? cartHeaderSelect.ship_to.toString() : "",
                bill_to: cartHeaderSelect.bill_to ? cartHeaderSelect.bill_to.toString() : "",
                notify_to_1: cartHeaderSelect.notify1 ? cartHeaderSelect.notify1.toString() : "",
                notify_to_2: cartHeaderSelect.notify2 ? cartHeaderSelect.notify2.toString() : "",
                final_dest: cartHeaderSelect.final_dest || "",
                created_date: created_date,
                company_id: cartHeaderSelect.company_id
              },
              detail: {
                cont_size: cartDetailSelect[0].cont_size ? cartDetailSelect[0].cont_size.toString() : "",
                cont_qty: cartDetailSelect[0].cont_qty ? cartDetailSelect[0].cont_qty.toString() : "",
                bulk: cartDetailSelect[0].bulk.toString() === "1" ? true : false,
                remarks: cartDetailSelect[0].remarks || "",
                containerList: (cartDetailSelect[0].bulk === false || cartDetailSelect[0].bulk === 0) ? cartDetailSelect.map((container, containerIndex) => {
                  const sku1 = container.sku1.toString();
                  const qty1 = container.qty1.toString();
                  const sku2 = container.sku2.toString();
                  const qty2 = container.qty2.toString();
                  const sku3 = container.sku3.toString();
                  const qty3 = container.qty3.toString();
                  return {
                    custom: container.custom,
                    detail_id: (containerIndex + 1).toString(),
                    Flavour: [
                      {
                        sku: sku1,
                        qty: qty1,
                        Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
                        qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
                        moq: selectedFlavor1 && cartDetailSelect[0].cont_size.toString() !== "1" ? selectedFlavor1.moq : selectedFlavor1 && cartDetailSelect[0].cont_size.toString() === "1" ? selectedFlavor1.moq20 : 0,
                        palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0,
                        qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,

                      },
                      ...(sku2 !== "0" ? [{
                        sku: sku2,
                        qty: qty2,
                        Flavour_tollingID: selectedFlavor2 ? selectedFlavor2.tolling_id : 0,
                        qty_max: selectedFlavor2 ? selectedFlavor2.cont40hc : 0,
                        moq: selectedFlavor2 && cartDetailSelect[0].cont_size.toString() !== "1" ? selectedFlavor2.moq : selectedFlavor2 && cartDetailSelect[0].cont_size.toString() === "1" ? selectedFlavor2.moq20 : 0,
                        qty_perpallet: selectedFlavor2 ? selectedFlavor2.qty_per_pallet : 0,
                        palete_qty: selectedFlavor2 ? qty2 / selectedFlavor2.qty_per_pallet : 0,
                      }] : [{
                        sku: "-1",
                        qty: "0",
                        Flavour_tollingID: "0",
                        qty_max: "",
                        moq: "",
                        palete_qty: "0",
                        qty_real: "0",
                      }]),
                      ...(sku3 !== "0" ? [{
                        sku: sku3,
                        qty: qty3,
                        Flavour_tollingID: selectedFlavor3 ? selectedFlavor3.tolling_id : 0,
                        qty_max: selectedFlavor3 ? selectedFlavor3.cont40hc : 0,
                        moq: selectedFlavor3 && cartDetailSelect[0].cont_size.toString() !== "1" ? selectedFlavor3.moq : selectedFlavor3 && cartDetailSelect[0].cont_size.toString() === "1" ? selectedFlavor3.moq20 : 0,
                        qty_perpallet: selectedFlavor3 ? selectedFlavor3.qty_per_pallet : 0,
                        palete_qty: selectedFlavor3 ? qty2 / selectedFlavor3.qty_per_pallet : 0,
                      }] : [{
                      }] : [])
                    ]
        };
      }) :
    [
      {
        detail_id: "1",
        Flavour: [
          {
            sku: "-1",
            qty: "0",
            Flavour_tollingID: "0",
            qty_max: "",
            moq: "",
            palete_qty: "0"
          },
          {
            sku: "-1",
            qty: "0",
            Flavour_tollingID: "0",
            qty_max: "",
            moq: "",
            palete_qty: "0"
          }
        ]
      }
    ],
      bulkList: {
      detail_id: "1",
        Flavour: (cartDetailSelect[0].bulk === true || cartDetailSelect[0].bulk === 1) ?
          cartDetailSelect.flatMap((container) => {
            const sku1 = container.sku1.toString();
            const qty1 = (container.qty1 / cont_qty).toString();
            const sku2 = container.sku2.toString();
            const qty2 = (container.qty2 / cont_qty).toString();
            const sku3 = container.sku3.toString();
            const qty3 = (container.qty3 / cont_qty).toString();

            return [
              {
                sku: sku1,
                qty: container.qty1.toString(),
                Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
                qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
                moq: selectedFlavor1 ? selectedFlavor1.moq : 0,
                qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,
                palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0,
                qty_real: qty1
              },
              ...(sku2 !== "0" ? [{
                sku: sku2,
                qty: container.qty2.toString(),
                Flavour_tollingID: selectedFlavor2 ? selectedFlavor2.tolling_id : 0,
                qty_max: selectedFlavor2 ? selectedFlavor2.cont40hc : 0,
                moq: selectedFlavor2 ? selectedFlavor2.moq : 0,
                qty_perpallet: selectedFlavor2 ? selectedFlavor2.qty_per_pallet : 0,
                palete_qty: selectedFlavor2 ? qty2 / selectedFlavor2.qty_per_pallet : 0,
                qty_real: qty2
              }] : [{
                sku: "-1",
                qty: "0",
                Flavour_tollingID: "0",
                qty_max: "",
                moq: "",
                palete_qty: "0",
                qty_real: "0"
              }]),
              ...(sku3 !== "0" ? [{
                sku: sku3,
                qty: container.qty3.toString(),
                Flavour_tollingID: selectedFlavor3 ? selectedFlavor3.tolling_id : 0,
                qty_max: selectedFlavor3 ? selectedFlavor3.cont40hc : 0,
                moq: selectedFlavor3 ? selectedFlavor3.moq : 0,
                qty_perpallet: selectedFlavor3 ? selectedFlavor3.qty_per_pallet : 0,
                palete_qty: selectedFlavor3 ? qty3 / selectedFlavor3.qty_per_pallet : 0,
                qty_real: qty3
              }] : [])
            ];
          }) :
          [
            {
              sku: "-1",
              qty: 0,
              Flavour_tollingID: 0,
              qty_max: "",
              moq: "",
              palete_qty: 0,
              qty_real: ""
            },
            {
              sku: "-1",
              qty: 0,
              Flavour_tollingID: 0,
              qty_max: "",
              moq: "",
              palete_qty: 0,
              qty_real: ""
            }
          ]
    }

  },
  summary: {
    detail_id: "1",
      Flavour: []
  }
}
          }];

const initialTruckOrders = [{
  cart_id: cart_id || "",
  po_buyer: cartHeaderSelect.po_buyer || "",
  delv_date: formatted || "",
  shipToParty: cartHeaderSelect.ship_to ? cartHeaderSelect.ship_to.toString() : "",
  shipToPartyIndex: '',
  portIndex: '',
  created_date: created_date || "Kosong",
  company_id: cartHeaderSelect.company_id || "Kosong",
  portName: '',
  notify_to_1: cartHeaderSelect.notify1 ? cartHeaderSelect.notify1.toString() : "",
  notify_to_2: cartHeaderSelect.notify2 ? cartHeaderSelect.notify2.toString() : "",
  port: cartHeaderSelect.port_shipment ? cartHeaderSelect.port_shipment.toString() : ports.md_id,
  final_dest: cartHeaderSelect.final_dest || "",
  detail_id: "1",
  po_url: cartHeaderSelect.po_url,
  flavors: cartDetailSelect.map((container, containerIndex) => {
    const sku1 = container.sku1.toString();
    const qty1 = container.qty1.toString();

    return {
      sku: sku1,
      qty: qty1,
      Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
      qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
      moq: selectedFlavor1 ? selectedFlavor1.moq : 0,
      qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,
      palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0
    };
  }),
  remark: cartDetailSelect[0].remarks || ""
}];


// console.log("initialOrders", initialOrders)
// sessionStorage.setItem("orderDetails", JSON.stringify(initialOrders));
// setOrderDetails(initialOrders);
// sessionStorage.setItem("orderDetailsInformation", JSON.stringify(initialOrderInformation));
// setOrderDetailsInformation(initialOrderInformation)



if (container_name === "Truck") {

  let existingTruckOrders = JSON.parse(sessionStorage.getItem("truckOrders")) || [];
  let updatedTruckOrders = [...existingTruckOrders, ...initialTruckOrders];

  sessionStorage.setItem("truckOrders", JSON.stringify(updatedTruckOrders));
  setTruckOrders(updatedTruckOrders);
}
else {
  let existingOrderDetails = JSON.parse(sessionStorage.getItem("containerOrders")) || [];
  let updatedOrderDetails = [...existingOrderDetails, ...initialOrders];

  sessionStorage.setItem("containerOrders", JSON.stringify(updatedOrderDetails));
  setOrderDetails(updatedOrderDetails);

}
setMode(container_name);
        }

      } else {
  console.log(`No matching entry found for cart_id ${cart_id}.`);
}

    });

// const cartHeaderSelect = cartHeader.find(item => item.created_date === selectedCreationTime);

// if (cartHeaderSelect) {
//   const cart_id = cartHeaderSelect.cart_id;
//   console.log("cartHeaderSelect", cartHeaderSelect)
//   const cartDetailSelect = cartDetails.filter(item => item.cart_id === cart_id);
//   // console.log("cartDetails filtered", cartDetailSelect)
//   //Belum dipake Header

// } else {
//   console.log("No matching entry found.");
// }

setEditDraft(false);
  }
const [sessionStorageTrigger, setSessionStorageTrigger] = useState(false)

// ================================================================================================================



if (checkout) {
  let hasError = false;
  let editStatus = true;

  let created_date = selectedCreationTime;
  let editDetails = { editStatus, cart_id, created_date };

  let container_name = "";

  sessionStorage.setItem("editDraft", JSON.stringify(editDetails));

  // Initialize quantities object to store aggregated quantities
  const quantities = {};

  const aggregateQuantities = (cartDetails) => {
    cartDetails.forEach(detail => {
      const updateQuantity = (sku, qty) => {
        if (sku) {
          if (!quantities[sku]) {
            quantities[sku] = 0;
          }
          quantities[sku] += qty;
        }
      };

      // Adjust these according to your actual SKU and quantity properties
      updateQuantity(detail.sku1, detail.qty1);
      updateQuantity(detail.sku2, detail.qty2);
      updateQuantity(detail.sku3, detail.qty3);
    });
  };



  cart_id.forEach((cart_id) => {
    const cartHeaderSelect = cartHeader.find(item => item.cart_id === cart_id);
    console.log("cartHeaderSelect", cartHeaderSelect)
    if (cartHeaderSelect) {
      const cart_id = cartHeaderSelect.cart_id;
      const cartDetailSelect = cartDetails.filter(item => item.cart_id === cart_id);

      // Ensure this function correctly aggregates quantities
      const aggregatedQuantities = aggregateQuantities(cartDetailSelect);

      const created_date = cartHeaderSelect.created_date;
      const delv_week = cartHeaderSelect.delv_week;
      const delv_week_desc = cartHeaderSelect.delv_week_desc;
      const delv_year = cartHeaderSelect.delv_year;
      const po_url = cartHeaderSelect.po_url;
      const bill_to = cartHeaderSelect.bill_to;
      const delivery_date = cartHeaderSelect.stuffing_date;
      const formatted = delivery_date.split('T')[0];

      const initialOrderInformation = {
        delv_week,
        delv_week_desc,
        delv_year,
        po_url,
        delv_week_id: parseInt(`${delv_year}${delv_week}`, 10)
      };
      if (cartDetailSelect.length > 0) {
        const selectedFlavor1 = flavorLookup[cartDetailSelect[0].sku1];
        const selectedFlavor2 = flavorLookup[cartDetailSelect[0].sku2];
        const selectedFlavor3 = flavorLookup[cartDetailSelect[0].sku3];
        console.log("selectedFlavor1", selectedFlavor1)

        const prod_sku1 = cartDetailSelect[0].prod_sku1;
        const po_buyer = cartHeaderSelect.po_buyer;
        const port_shipment = cartHeaderSelect.port_shipment;
        const final_dest = cartHeaderSelect.final_dest;
        const ship_to = cartHeaderSelect.ship_to;
        const remarks = cartDetailSelect[0].remarks;
        const custom = cartDetailSelect[0].custom;
        console.log("cartDetailSelect", cartDetailSelect)
        container_name = cartDetailSelect[0].container_name;
        const company_id = cartDetailSelect[0].company_id;
        // Set state
        setSelectedCreation_date(created_date);
        setSelectedCompanyId(company_id);
        console.log("custom", custom)

        const initialOrders = [{
          order: {
            header: {
              cart_id: cart_id || "",
              po_buyer: po_buyer || "",
              port_shipment: port_shipment ? port_shipment.toString() : "",
              ship_to: ship_to ? ship_to.toString() : "",
              final_dest: final_dest || "",
              po_url: po_url,
              bill_to: bill_to,

              created_date,
              // tolling_id: cartHeaderSelect.tolling_id,
              company_id: cartHeaderSelect.company_id
            },
            detail: {
              cont_size: cartDetailSelect[0].cont_size ? cartDetailSelect[0].cont_size.toString() : "",
              cont_qty: cartDetailSelect[0].cont_qty ? cartDetailSelect[0].cont_qty.toString() : "",
              bulk: cartDetailSelect[0].bulk === "1",
              remarks: remarks || "",
              containerList: (cartDetailSelect[0].bulk === false || cartDetailSelect[0].bulk === 0) ? cartDetailSelect.map((container, containerIndex) => {
                const sku1 = container.sku1.toString();
                const qty1 = container.qty1.toString();
                const sku2 = container.sku2.toString();
                const qty2 = container.qty2.toString();
                const sku3 = container.sku3.toString();
                const qty3 = container.qty3.toString();

                return {
                  custom: custom === false || custom.toLocaleString() === "0" || custom === null ? 0 : 1,
                  detail_id: (containerIndex + 1).toString(),
                  Flavour: [
                    {
                      sku: sku1,
                      qty: qty1,
                      Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
                      qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
                      moq: selectedFlavor1 ? selectedFlavor1.moq : 0,
                      qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,
                      palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0
                    },
                    ...(sku2 !== "0" ? [{
                      sku: sku2,
                      qty: qty2,
                      Flavour_tollingID: selectedFlavor2 ? selectedFlavor2.tolling_id : 0,
                      qty_max: selectedFlavor2 ? selectedFlavor2.cont40hc : 0,
                      moq: selectedFlavor2 ? selectedFlavor2.moq : 0,
                      qty_perpallet: selectedFlavor2 ? selectedFlavor2.qty_per_pallet : 0,
                      palete_qty: selectedFlavor2 ? qty2 / selectedFlavor2.qty_per_pallet : 0
                    }] : [{
                      sku: "-1",
                      qty: "0",
                      Flavour_tollingID: "0",
                      qty_max: "",
                      moq: "",
                      palete_qty: "0",
                      qty_real: "0",
                    }]),
                    ...(sku3 !== "0" ? [{
                      sku: sku3,
                      qty: qty3,
                      Flavour_tollingID: selectedFlavor3 ? selectedFlavor3.tolling_id : 0,
                      qty_max: selectedFlavor3 ? selectedFlavor3.cont40hc : 0,
                      moq: selectedFlavor3 ? selectedFlavor3.moq : 0,
                      qty_perpallet: selectedFlavor3 ? selectedFlavor3.qty_per_pallet : 0,
                      palete_qty: selectedFlavor3 ? qty3 / selectedFlavor3.qty_per_pallet : 0
                    }] : [])
                  ]
                };
              }) :
                [{
                  detail_id: "1",
                  Flavour: [
                    {
                      sku: "-1",
                      qty: "0",
                      Flavour_tollingID: "0",
                      qty_max: "",
                      moq: "",
                      palete_qty: "0"
                    },
                    {
                      sku: "-1",
                      qty: "0",
                      Flavour_tollingID: "0",
                      qty_max: "",
                      moq: "",
                      palete_qty: "0"
                    }
                  ]
                }],
              bulkList: {
                detail_id: "1",
                Flavour: (cartDetailSelect[0].bulk === true || cartDetailSelect[0].bulk === 1) ?
                  cartDetailSelect.flatMap((container) => {
                    const sku1 = container.sku1.toString();
                    const qty1 = (container.qty1 / cartDetailSelect[0].cont_qty).toString();
                    const sku2 = container.sku2.toString();
                    const qty2 = (container.qty2 / cartDetailSelect[0].cont_qty).toString();
                    const sku3 = container.sku3.toString();
                    const qty3 = (container.qty3 / cartDetailSelect[0].cont_qty).toString();

                    return [
                      {
                        sku: sku1,
                        qty: container.qty1.toString(),
                        Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
                        qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
                        moq: selectedFlavor1 ? selectedFlavor1.moq : 0,
                        qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,
                        palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0,
                        qty_real: qty1
                      },
                      ...(sku2 !== "0" ? [{
                        sku: sku2,
                        qty: container.qty2.toString(),
                        Flavour_tollingID: selectedFlavor2 ? selectedFlavor2.tolling_id : 0,
                        qty_max: selectedFlavor2 ? selectedFlavor2.cont40hc : 0,
                        moq: selectedFlavor2 ? selectedFlavor2.moq : 0,
                        qty_perpallet: selectedFlavor2 ? selectedFlavor2.qty_per_pallet : 0,
                        palete_qty: selectedFlavor2 ? qty2 / selectedFlavor2.qty_per_pallet : 0,
                        qty_real: qty2
                      }] : [{
                        sku: "-1",
                        qty: "0",
                        Flavour_tollingID: "0",
                        qty_max: "",
                        moq: "",
                        palete_qty: "0",
                        qty_real: "0"
                      }]),
                      ...(sku3 !== "0" ? [{
                        sku: sku3,
                        qty: container.qty3.toString(),
                        Flavour_tollingID: selectedFlavor3 ? selectedFlavor3.tolling_id : 0,
                        qty_max: selectedFlavor3 ? selectedFlavor3.cont40hc : 0,
                        moq: selectedFlavor3 ? selectedFlavor3.moq : 0,
                        qty_perpallet: selectedFlavor3 ? selectedFlavor3.qty_per_pallet : 0,
                        palete_qty: selectedFlavor3 ? qty3 / selectedFlavor3.qty_per_pallet : 0,
                        qty_real: qty3
                      }] : [])
                    ];
                  }) :
                  [{
                    sku: "-1",
                    qty: 0,
                    Flavour_tollingID: 0,
                    qty_max: "",
                    moq: "",
                    palete_qty: 0,
                    qty_real: ""
                  },
                  {
                    sku: "-1",
                    qty: 0,
                    Flavour_tollingID: 0,
                    qty_max: "",
                    moq: "",
                    palete_qty: 0,
                    qty_real: ""
                  }]
              }
            },
            summary: {
              detail_id: "1",
              Flavour: []
            }
          }
        }];

        const initialTruckOrders = [{
          cart_id: cart_id || "",
          po_buyer: po_buyer || "",
          delv_date: formatted || "",
          shipToParty: ship_to ? ship_to.toString() : "",
          shipToPartyIndex: '',
          portIndex: '',
          created_date: created_date || "Kosong",
          company_id: company_id || "Kosong",
          portName: '',
          port: cartHeaderSelect.port_shipment ? cartHeaderSelect.port_shipment.toString() : ports.md_id,
          final_dest: final_dest || "",
          detail_id: "1",
          po_url: po_url,
          flavors: cartDetailSelect.map((container, containerIndex) => {
            const sku1 = container.sku1.toString();
            const qty1 = container.qty1.toString();

            if (!selectedFlavor1) {
              toast({
                title: "Error!",
                description: `Flavour 1 not found in lookup.`,
                status: "error",
                duration: 6000,
                isClosable: true
              });
              hasError = true;
            }

            return {
              sku: sku1,
              qty: qty1,
              Flavour_tollingID: selectedFlavor1 ? selectedFlavor1.tolling_id : 0,
              qty_max: selectedFlavor1 ? selectedFlavor1.cont40hc : 0,
              moq: selectedFlavor1 ? selectedFlavor1.moq : 0,
              qty_perpallet: selectedFlavor1 ? selectedFlavor1.qty_per_pallet : 0,
              palete_qty: selectedFlavor1 ? qty1 / selectedFlavor1.qty_per_pallet : 0
            };
          }),
          remark: remarks
        }];

        // Error checking
        if (!po_buyer || po_buyer === "") {
          toast({
            title: "Error!",
            description: `Order has an empty po_buyer.`,
            status: "error",
            duration: 6000,
            isClosable: true
          });
          hasError = true;
        }

        if (existingPo.some(existing => existing.po_buyer === po_buyer)) {
          toast({
            title: "Error!",
            description: `Po_buyer already exists.`,
            status: "error",
            duration: 6000,
            isClosable: true
          });
          hasError = true;
        }

        if (!delivery_date || delivery_date === "") {
          toast({
            title: "Error!",
            description: `Order has an empty delv_date.`,
            status: "error",
            duration: 6000,
            isClosable: true
          });
          hasError = true;
        }



        if (!prod_sku1) {
          toast({
            title: "Error!",
            description: `Order ${prod_sku1} flavor can't be empty or zero.`,
            status: "error",
            duration: 6000,
            isClosable: true
          });
          hasError = true;
        }

        if (!hasError) {
          if (container_name === "Truck") {
            let existingTruckOrders = JSON.parse(sessionStorage.getItem("truckOrders")) || [];
            let updatedTruckOrders = [...existingTruckOrders, ...initialTruckOrders];

            sessionStorage.setItem("truckOrders", JSON.stringify(updatedTruckOrders));
            setTruckOrders(updatedTruckOrders);
          } else {
            let existingOrderDetails = JSON.parse(sessionStorage.getItem("containerOrders")) || [];
            let updatedOrderDetails = [...existingOrderDetails, ...initialOrders];

            sessionStorage.setItem("containerOrders", JSON.stringify(updatedOrderDetails));
            setOrderDetails(updatedOrderDetails);
            sessionStorage.setItem("containerOrdersInformation", JSON.stringify(initialOrderInformation));
          }
        } else {
          setCheckout(false);
          setTimeout(function () {
            setLoading(false);
            setButtonLoading(false);
          }, 500);
        }
      }
    } else {
      console.log("No matching entry found.");
    }
  });

  Object.keys(quantities).forEach(sku => {
    const qty = quantities[sku];
    const existingFlavor = flavorLookup[sku];

    if (existingFlavor && qty < existingFlavor.moq) {
      toast({
        title: "Error!",
        description: `Flavor ${existingFlavor.product_name} has a quantity less than the minimum order quantity (MOQ) of ${existingFlavor.moq}.`,
        status: "error",
        duration: 6000,
        isClosable: true
      });
      hasError = true;
    }
  });

  if (!hasError) {

    // Validate aggregated quantities


    setMode(container_name);
    console.log("container_name", container_name)
    console.log("mode", mode)
    setTimeout(() => {
      container_name === "Truck" ?
        navigate("/e-order/cart/truckorder/confirmation")
        :
        navigate("/e-order/cart/confirmation");
    }, 1500);
  } else {
    setCheckout(false);
    setTimeout(function () {
      setLoading(false);
      setButtonLoading(false);
    }, 500);
  }

  setCheckout(false);
}


// ================================================ PRINT DRAFTS ==================================================

function formatNumberWithDots(number) {
  // Check if the input is undefined, null, or not a number
  if (number === undefined || number === null || isNaN(number)) {
    return "Invalid input. Please provide a valid number.";
  }

  // If it's a valid number, proceed with formatting
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const [customable, setCustombale] = useState(false)


const separateByCreationDetails = () => {
  // Group cart IDs by created_date
  const validCartIds = new Set(cartHeader.map(item => item.cart_id));

  // Filter out creationDetails that are not in `data`
  const filteredCreationDetails = creationDetails.filter(item => validCartIds.has(item.cart_id));

  // Group cart IDs by created_date
  const groupedCartHeaders = filteredCreationDetails.reduce((acc, item) => {
    const dateKey = item.created_date.trim();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    if (!acc[dateKey].includes(item.cart_id)) {
      acc[dateKey].push(item.cart_id);
    }
    return acc;
  }, {});
  return Object.entries(groupedCartHeaders).map(([createdDate, cartIds], groupIdx) => (
    <div key={groupIdx}>
      <div className="form-check PC-ver">
        <div className="card-body border border_radius_10px shadow shadow-sm my-2">




          {cartIds.map((cartId, idx) => {
            // Find the cart details based on the cart_id
            const details = creationDetails.find(item => item.cart_id === cartId);
            if (!details) return null;
            // console.log("details ISI", details)
            return (
              <div key={details.cart_id}>
                {idx === 0 &&
                  <>
                    <div className="d-flex justify-content-between">

                      <div className="ms-4">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="flexRadioDefault"
                          readOnly
                          onClick={() => setSelectedCreationTime(details.created_date)}
                          value={details.cart_id}
                          checked={(selectedCartId || []).includes(details.cart_id)}
                        />
                      </div>

                      <div className="me-4">
                        <span className="grey_text_bold fs-6">Stuffing Week:&nbsp;</span>
                        <span className="grey_text fs-6 ps-2">{details.delv_week_desc}</span>
                      </div>

                      <div>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            size="sm"
                            icon={<BsThreeDotsVertical size={20} />}
                            onClick={async () => {
                              await clearSeasonStorage(order);
                              setSelectedCreationTime(details.created_date);
                            }}
                          />
                          <MenuList>
                            <MenuItem onClick={() => setEditDraft(true)}>Edit</MenuItem>
                            <MenuItem onClick={onOpenModalConfirm}>Delete</MenuItem>
                          </MenuList>
                        </Menu>
                      </div>
                    </div>
                    <div className="row my-2">
                      <div className="border-bottom border-secondary"></div>
                    </div>
                  </>
                }


                <div >
                  {printCartHeader(details.cart_id)}
                </div>
              </div>
            );
          })}

        </div>
      </div>



    </div >
  ));
};



const printCartHeader = (cart_id) => {
  return cartHeader.map((header, idx) => {
    const port = portLookup[header.port_shipment];

    return header.cart_id === cart_id ?
      (
        <div key={header.cart_id} className="d-flex position-relative">
          <div className="card-body shadow border border_radius_10px shadow shadow-sm mt-3">
            <div className="row">
              <div className="col-12 col-md-10">
                <div className="row">
                  <div className="col-5 col-md-3 col-xxl-2  d-flex grey_text_bold fs-6">
                    PO Buyer
                  </div>

                  <div className="col-7 col-md-9 col-xxl-10  d-flex grey_text fs-6 px-2">
                    : {header.po_buyer}
                  </div>
                </div>
                <div className="row">
                  <div className="col-5 col-md-3 col-xxl-2  d-flex grey_text_bold fs-6">
                    {header.container_name === "Truck" ?
                      `Destination`
                      :
                      `Port`}
                  </div>
                  <div className="col-7 col-md-9 col-xxl-10 d-flex grey_text fs-6 px-2">
                    :  {

                      header.container_name === "Truck" ?
                        `${header.final_dest}`
                        :
                        `${port.harbour_name}`
                    }
                  </div>
                </div>
                <div className="row">
                  <div className="ratakiri col-5 col-md-3 col-xxl-2 d-flex grey_text_bold fs-6">
                    Ship to Party
                  </div>

                  <div className="col-7 col-md-9 col-xxl-10 d-flex grey_text fs-6 px-2">
                    :  {header.harbour_id ? header.company_name : header.ship_to_name}
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-2">
                <div className="border border_radius_10px py-1 px-2 white_text_bold fs-6 bg-grey ">
                  {header.container_name === "Truck" ?
                    `${header.container_name}`
                    :
                    `${header.cont_qty} x ${header.container_name}`}


                </div>

                {header.po_url ?
                  <div className="d-none btn d-md-block">
                    <Tooltip
                      label="Click file icon to preview"
                      hasArrow
                      arrowSize={15}
                    >
                      <div onClick={() => window.open(API_URL + header.po_url)} className="row">
                        <div className="col-8 d-flex justify-content-end">
                          Po.File
                        </div>
                        <div className="col-2 pt-1 justify-content-start">
                          <AiFillFile />
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                  :
                  null
                }
              </div>
            </div>

            {printCartDetails(header.cart_id)}
          </div>
        </div>
      ) :
      null
      ;
  });
};

const printCartDetails = (headerCartId) => {
  return cartDetails
    .filter(container => container.sku1 !== 0 || container.sku2 !== 0)
    .map((details, idx) => {
      return details.cart_id === headerCartId ? (
        <div
          className="card-body border border_radius_10px shadow shadow-sm my-2 shadow"
          key={details.detail_id}
        >
          <div className="row">
            <div className="col-12 d-flex">
              {details.bulk === 0 ? (
                <div className="fw-bold fs-5 grey_text_bold ">
                  {details.container_name === "Truck" ?
                    `Flavour `
                    :
                    `Container `}

                  {details.detail_id}
                </div>
              ) : (
                <div className="fw-bold fs-5  grey_text_bold  ">
                  Container Details
                </div>
              )}
            </div>
          </div>

          <div className="row my-1">
            <div className="col-9 d-flex">
              <div className="grey_text_bold fs-6">
                Product Description
              </div>
            </div>

            <div className="col-3 d-flex justify-content-center pe-1">
              <div className="grey_text_bold fs-6 ratakanan">Total Cartons</div>
            </div>
          </div>

          <div className="row pb-3 mt-4">
            <div className="col-4 px-0 col-sm-3 d-flex justify-content-center">
              <Image
                className="d-flex  gambarproduk justify-content-center p-3  ms-lg-4 ms-md-0"
                src={details.url_1 || undefined}
                fallback={
                  <img
                    src="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                    alt="Fallback"
                    width="130"
                    height="131"
                  />
                }
                boxSize=""
                width="100%"
                maxWidth="130"
                maxHeight="131"
              />
            </div>

            <div className="col-6 ratakiri d-flex pt-lg-3 mt-lg-3 pt-sm-4  col-md-7 d-flex red_text_bold pt-3">
              <div>
                <div className=" d-flex">
                  {details.product_name_1}
                </div>
                <div className="d-flex text-muted">
                  {details.prod_sku1}
                </div>
              </div>
            </div>

            <div className="col-2 col-md-2 col-lg-2 d-flex ps-1 justify-content-center grey_text_bold my-4 fs-6">
              {formatNumberWithDots(details.qty1)}
            </div>
          </div>


          {details.qty2 > 0 && (
            <div className="row pb-3">
              <div className="col-4 px-0 col-sm-3 d-flex justify-content-center">
                <Image
                  className="d-flex  gambarproduk justify-content-center p-3 ms-lg-4 ms-md-0"
                  src={details.url_2}
                  boxSize=""
                  width="100%"
                  maxWidth="130"
                  maxHeight="131"
                  fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                />
              </div>

              <div className="col-6 ratakiri d-flex pt-lg-3 mt-lg-3 pt-sm-4  col-md-7 d-flex red_text_bold pt-3">
                <div>
                  <div className=" d-flex">
                    {details.product_name_2}
                  </div>
                  <div className="d-flex text-muted">
                    {details.prod_sku2}
                  </div>
                </div>
              </div>

              <div className="col-2 col-md-2 col-lg-2 d-flex ps-1 justify-content-center grey_text_bold my-4 fs-6">
                {formatNumberWithDots(details.qty2)}
              </div>
            </div>
          )}

          {details.qty3 > 0 && (
            <div className="row pb-3">
              <div className="col-4 px-0 col-sm-3 d-flex justify-content-center">
                <Image
                  className="d-flex  gambarproduk justify-content-center p-3 ms-lg-4 ms-md-0"
                  src={details.url_3}
                  boxSize=""
                  width="100%"
                  maxWidth="130"
                  maxHeight="131"
                  fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                />
              </div>

              <div className="col-6 ratakiri d-flex pt-lg-3 mt-lg-3 pt-sm-4  col-md-7 d-flex red_text_bold pt-3">
                <div>
                  <div className=" d-flex">
                    {details.product_name_3}
                  </div>
                  <div className="d-flex text-muted">
                    {formatNumberWithDots(details.prod_sku3)}
                  </div>
                </div>
              </div>

              <div className="col-2 col-md-2 col-lg-2 d-flex ps-1 justify-content-center grey_text_bold my-4 fs-6">
                {details.qty3}
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-12 d-flex">
              <span className="grey_text_bold fs-6">Remarks:&nbsp;</span>

              <span className="grey_text fs-6">{!details.remarks ? "-" : details.remarks}</span>
            </div>
          </div>
        </div>
      ) : null;
    });
};


return (
  <div>
    {/* navbar */}

    <div>
      <div className="py-5 mt-2 stick-left">
        <div className="row">
          <div className="col-6 col-sm-12"></div>
          <div className="col-6 col-sm-12">
            <Sidebar />
          </div>
        </div>
      </div>

      <div className="py-5 w-100">

        <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
          <div className="pb-5 pt-4 ">
            <div>
              <div className="row user-select-none">

                <div className="col-12 text-secondary d-flex  pt-1 ps-4 ps-md-0">
                  <span
                    onClick={() => navigate("/e-order/dashboard")}
                    className="pointer  grey_text_normal_20px">
                    e-order
                  </span>
                  <span className="grey_text_20px">
                    &nbsp;/ Draft
                  </span>
                </div>
              </div>

              <div className="container">
                <div className="row px-1 px-md-2 px-lg-3 d-flex justify-content-start mt-2">

                  {separateByCreationDetails()}


                  {loading ? (
                    <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center align-items-center row pt-5">
                      <Spinner
                        className="d-flex justify-content-center "
                        thickness="10px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.500"
                        size="xl"
                        spacing={4}
                      />

                    </div>
                  ) : (
                    <div
                      className={cartHeader > [] ? "d-none" : "d-block pt-5 mt-5"}
                    >
                      <h1 className="text-muted fw-bold pb-3 fs-1">
                        There are no drafts yet.
                      </h1>

                      <h5 className="text-muted">
                        Click "Save Draft" on "Place Order" menu, it will appear
                        here!
                      </h5>
                    </div>
                  )}
                </div>
              </div>
            </div>



            <div className=" shadow-none fixed-bottom button_bottom_sticky d-none d-sm-none d-md-block d-lg-block d-xl-block d-xxl-block ">
              <div className="row shadow-lg d-flex justify-content-evenly bg-white py-2 px-0 border-top">
                <div className="col-md-9"></div>

                <div className="col-md-3">
                  {buttonLoading === false && (
                    <button
                      className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                      onClick={() => {
                        if (active === 1) {
                          setButtonLoading(true);
                          setCheckout(true);


                        } else {
                          if (!toast.isActive(id)) {
                            toast({
                              id,
                              title: "Oopsie!",
                              description: `Your Account is not allowed to proceed order (Inactive). Please contact your admin.`,
                              status: "error",
                              duration: 6000,
                              isClosable: true,
                            });
                          }
                        }
                      }}
                      disabled={selectedCartId === 0 || !selectedCartId || selectedCartId === "0" || selectedCartId.length === 0}
                    >
                      Checkout
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

            <div className="shadow-none d-md-none d-block fixed-bottom mb-5 ">
              <div className="col-md-3">
                {buttonLoading === false && (
                  <button
                    className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                    onClick={() => {
                      if (active === 1) {
                        setButtonLoading(true);
                        setCheckout(true);

                      } else {
                        if (!toast.isActive(id)) {
                          toast({
                            id,
                            title: "Oopsie!",
                            description: `Your Account is not allowed to proceed order (Inactive). Please contact your admin.`,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                          });
                        }
                      }
                    }}
                    disabled={selectedCartId === 0 || !selectedCartId || selectedCartId === "0" || selectedCartId.length === 0}
                  >
                    Checkout
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
    <ControlBar />

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
            <span className="fw-bold py-2">
              Are you sure want to delete this item?
            </span>
          </ModalBody>
          <ModalFooter className="px-3">
            <button
              className="btn btn-outline-danger px-2 mx-1"
              onClick={onCloseModalConfirm}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger px-2 mx-1"
              onClick={onConfirm}
            >
              Delete
            </button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>


    <Modal
      // initialFocusRef={initialRefConfirm}
      isOpen={isOpenModalEdit}
      onClose={() => { handleConfirmClose() }}
      motionPreset="slideInBottom"

    >
      <ModalOverlay>
        <ModalContent maxW="900px">
          <ModalHeader>Edit</ModalHeader>
          <ModalCloseButton onClick={handleConfirmClose} />
          <ModalBody>
            <div className="container-fluid ">

              {mode === "Truck" ?
                <>
                  <div>
                    {/* Navbar */}
                    {loading === "True" ? (
                      <div className=" pt-5 pb-5 m-4 px-4 d-flex justify-content-center align-items-center row ">
                        <Spinner
                          className="d-flex justify-content-center "
                          thickness="10px"
                          speed="0.65s"
                          emptyColor="gray.200"
                          color="blue.500"
                          size="xl"
                          spacing={4}
                        />

                      </div>
                    ) :
                      (

                        <div className='card border_radius_10px shadow-sm mb-4 py-3'>

                          {truckOrderDetails.map((order, orderIndex) => (
                            <div key={orderIndex} >
                              <AddMoreTruckHeader
                                orderIndex={orderIndex}
                                truckOrders={truckOrderDetails}
                                shipToParties={shipToParties}
                                shipToParty={order.shipToPartyIndex}
                                ports={ports}
                                order={order}
                                stuffingDate={stuffingWeeks}
                                userToken={userToken}
                                billtoparties={billtoparties}
                                setbilltoparties={setbilltoparties}
                                setLoading={setLoading}
                                setTruckOrders={setTruckOrders}
                                seasonOut={seasonOut}
                                setStuffingDate={setStuffingWeeks}

                              />
                              <AddMoreTruckBody
                                order={order}
                                truckOrders={truckOrderDetails}
                                orderIndex={orderIndex}
                                flavours={flavoursTrucking}
                                userToken={userToken}
                                seasonOut={seasonOut}
                                setTruckOrders={setTruckOrders}

                              />
                            </div >
                          ))}



                        </div>
                      )
                    }
                  </div>
                </>
                :
                <div className="container ">
                  <div className="row px-3 ">
                    <div className="col-12 mb-2">
                      <AddMoreContainerInformation
                        stuffingWeeks={stuffingWeeks}
                        setStuffingWeeks={setStuffingWeeks}
                        userToken={userToken}
                        containerOrdersInformation={orderDetailsInformation}
                        setContainerOrdersInformation={setOrderDetailsInformation}
                      />
                      <div className="col-12 grey_text_bold fs-6 pt-4 ">
                        Order Details
                      </div>
                    </div>
                  </div>
                </div>
              }


              {mode !== "Truck" ?
                <div className="container  ">
                  <div className="row px-3 pb-3 ">
                    {orderDetails.map((order, orderIndex) => {
                      const hasPoBuyerError = errors.some(error => error.orderIndex === orderIndex && error.errorType === 'po_buyer');

                      return (

                        <div key={orderIndex} className='col-12 position-relative mb-3 card-body border shadow shadow-sm top_card_order_page '>





                          <>
                            <AddMoreContainerHeader
                              order={order}
                              orderIndex={orderIndex}
                              setContainerOrders={setOrderDetails}
                              containerOrders={orderDetails}
                              userToken={userToken}
                              ports={ports}
                              shipToParties={shipToParties}
                              billtoparties={billtoparties}
                              setbilltoparties={setbilltoparties}
                              hasPoBuyerError={hasPoBuyerError}
                              errors={errors}
                              setCustombale={setCustombale}
                              customable={customable}
                              company_id={company_id}
                              setSessionStorageTrigger={setSessionStorageTrigger}
                            />



                            <AddMoreContainerBody
                              order={order}
                              orderIndex={orderIndex}
                              containerOrders={orderDetails}
                              setContainerOrders={setOrderDetails}
                              userToken={userToken}
                              flavours={flavours}
                              errors={errors}
                              setSessionStorageTrigger={setSessionStorageTrigger}
                              sessionStorageTrigger={sessionStorageTrigger}
                              customable={customable}


                            />
                          </>







                        </div>

                      )
                    }
                    )
                    }
                  </div>
                </div>
                :
                <>
                </>
              }


              {mode !== "Truck" ?
                <CartMoreContainerFooter
                  TruckOrderDetail={truckOrderDetails}
                  containerOrders={orderDetails}
                  setContainerOrders={setOrderDetails}
                  containerOrdersInformation={orderDetailsInformation}
                  mode={mode}
                  userToken={userToken}
                  initialOrders={initialOrders}
                  setContainerOrdersInformation={setOrderDetailsInformation}
                  initialOrderInformation={initialOrderInformation}
                  onCloseModalEdit={onCloseModalEdit}
                  handleToggle={handleToggle}
                  selectedCreation_date={selectedCreation_date}
                  selectedCompanyId={selectedCompanyId}
                  buttonLoading={buttonLoading}
                  active={active}
                  setButtonLoading={setButtonLoading}
                  setCheckout={setCheckout}
                  handleCheckoutTruck={handleCheckoutTruck}
                  handleCheckoutContainer={handleCheckoutContainer}
                  selectedCartId={selectedCartId}
                />
                :
                <CartMoreTruckFooter
                  TruckOrderDetail={truckOrderDetails}
                  containerOrders={orderDetails}
                  setContainerOrders={setOrderDetails}
                  containerOrdersInformation={orderDetailsInformation}
                  mode={mode}
                  userToken={userToken}
                  initialOrders={initialOrders}
                  setContainerOrdersInformation={setOrderDetailsInformation}
                  initialOrderInformation={initialOrderInformation}
                  onCloseModalEdit={onCloseModalEdit}
                  handleToggle={handleToggle}
                  selectedCreation_date={selectedCreation_date}
                  selectedCompanyId={selectedCompanyId}
                  buttonLoading={buttonLoading}
                  active={active}
                  setButtonLoading={setButtonLoading}
                  setCheckout={setCheckout}
                  handleCheckoutTruck={handleCheckoutTruck}
                  handleCheckoutContainer={handleCheckoutContainer}
                  selectedCartId={selectedCartId}
                />
              }



            </div>
          </ModalBody>
          <ModalFooter className="px-3">

          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>

  </div >
);
};

export default TestCart
