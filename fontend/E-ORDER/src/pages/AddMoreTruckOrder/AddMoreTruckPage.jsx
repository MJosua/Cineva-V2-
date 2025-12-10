import React, { useState, useEffect } from 'react';

import AddMoreTruckHeader from '../../components/AddMoreTruck/AddMoreTruckHeader';
import AddMoreTruckBody from '../../components/AddMoreTruck/AddMoreTruckBody';
import AddmoreTruckFooter from '../../components/AddMoreTruck/AddMoreTruckFooter';

import { useNavigate } from 'react-router-dom';
import { Tooltip, Spinner, useToast } from '@chakra-ui/react';
import { AiFillCloseCircle } from 'react-icons/ai';

import Axios from 'axios';
import { API_URL } from '../../config';
import { seasonOut, loginAction, logoutAction } from "../../action/userAction";
import { useDispatch, useSelector } from 'react-redux';
import { useData } from '../../components/CheckToken/FetchData/DataContext';


function AddMoreTruck({ mode }) {

    const { flavours, flavoursTrucking, ports, shipToParties } = useData();


    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();

    const [loading, setLoading] = useState(false)

    const { company_id, user } = useSelector((state) => {
        return {
            company_id: state.userReducer.company_id,
            user: state.userReducer.user
        };
    });



    const [billtoparties, setbilltoparties] = useState([]);

    const [stuffingDate, setStuffingDate] = useState([]);

    const initialOrders = [{
        po_buyer: '',
        po_url: '',
        delv_date: '',
        port: ports[0] ? ports.harbour_id : "",
        final_dest: ports[0] ? ports[0].final_dest : "",
        notify_to_1: "",
        notify_to_2: "",
        bill_to: company_id,
        detail_id: "1",
        shipToParty: shipToParties[0]?.keyy ? shipToParties[0]?.keyy : "",
        po_url: '',
        flavors: [{
            sku: '',
            qty: 0
        }],
        remark: '',
    }];

    const [truckOrders, setTruckOrders] = useState(() => {
        const storedOrders = sessionStorage.getItem('truckOrders');
        return storedOrders || storedOrders === ([]) ? JSON.parse(storedOrders) : initialOrders;
    });

    useEffect(() => {
        sessionStorage.setItem('truckOrders', JSON.stringify(truckOrders));
    }, [truckOrders, user]);



    const incrementPoBuyer = (po_buyer) => {
        let carry = 1;
        let result = "";
        let digits = po_buyer.split("").reverse();

        for (let i = 0; i < digits.length; i++) {
            let char = digits[i];
            if (/\d/.test(char)) { // Check if char is a digit
                let newDigit = parseInt(char, 10) + carry;
                if (newDigit === 10) {
                    result = "0" + result;
                    carry = 1;
                } else {
                    result = newDigit + result;
                    carry = 0;
                }
            } else if (/[A-Z]/i.test(char)) { // Check if char is a letter
                let newChar = String.fromCharCode(char.charCodeAt(0) + carry);
                if (newChar === "Z" + 1) {
                    result = "A" + result;
                    carry = 1;
                } else if (newChar === "z" + 1) {
                    result = "a" + result;
                    carry = 1;
                } else {
                    result = newChar + result;
                    carry = 0;
                }
            } else {
                result = char + result;
            }
        }
        if (carry > 0) {
            result = carry + result;
        }
        return result;
    };
    const [reset, setReset] = useState(false);

    const addOrder = () => {
        let newPoBuyer = ""

        if (!hasError) {
            if (truckOrders.length > 0) {
                const lastOrder = truckOrders[truckOrders.length - 1];
                if (lastOrder.po_buyer) {
                    newPoBuyer = incrementPoBuyer(lastOrder.po_buyer);
                }
            }

            if (truckOrders.length < 20) {
                const newOrder = {
                    po_buyer: newPoBuyer,
                    delv_date: '',
                    shipToParty: '', // Initially set to empty
                    shipToPartyIndex: '',
                    portIndex: 0, // Initially set to 0
                    portName: '',
                    port: '', // Initially set to empty
                    final_dest: '',
                    detail_id: truckOrders.length + 1,
                    po_url: '',
                    flavors: [{
                        skuIndex: '',
                        skuName: '',
                        sku: '',
                        qty: 0
                    }],
                    remark: '',
                };

                // Add the new order to truckOrders
                setTruckOrders([...truckOrders, newOrder]);

                // Now fetch ship-to parties and ports
                // Make sure to update the new order with fetched values

                // Fetch ship-to parties


            } else {
                toast({
                    title: "Error!",
                    description: hasError,
                    status: "error",
                    duration: 6000,
                    isClosable: true
                });
            }
        };
    };





    useEffect(() => {
        getExistingPo();
    }, [user]);














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
                setLoading(false);
            })
            .catch((err) => {
            });
    };
    const [refresh, setrefresh] = useState(false);

    const [hasError, setHasError] = useState(false);
    const handleCheckout = () => {

        if (!hasError) {
            const key = 'truckOrders';
            try {
                // Parse the session storage item as JSON
                const value = JSON.parse(sessionStorage.getItem(key));

                // Check if the value is an array
                if (Array.isArray(value)) {
                    let hasError = false;

                    // Create a lookup for the flavors based on ID
                    const flavorLookup = flavoursTrucking.reduce((lookup, flavor) => {
                        lookup[flavor.product_code] = flavor;
                        return lookup;
                    }, {});

                    value.forEach((item, index) => {
                        const poBuyer = item.po_buyer;
                        const port = item.port;
                        const delvDate = item.delv_date;
                        const flavors = item.flavors || [];


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

                        if (delvDate < new Date()) {
                            toast({
                                title: "Error!",
                                description: `Order at Truck ${index + 1} has an empty delv_date.`,
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
                        flavors.forEach((flavor, flavorIndex) => {
                            const qty = flavor.qty;

                            if (!qty || qty === 0) {
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
                                    description: `Order at Truck ${index + 1}, flavor ${flavorIndex + 1} has a quantity less than the minimum order quantity (MOQ) of ${existingFlavor.truck_moq}.`,
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
                        navigate("/e-order/truckorder/confirmation");
                    }
                } else {
                    setLoading(false)
                }
            } catch (e) {
                // Handle the case where parsing fails (not JSON data)
            }
        }
    };







    const checkAndResetOrders = () => {
        if (Array.isArray(truckOrders) && truckOrders.length === 0) {
            setTruckOrders(initialOrders);
        }

    };

    useEffect(() => {
        checkAndResetOrders();
    }, []);




    const { max_truck } = useSelector((state) => {
        return {
            max_truck: state.userReducer.max_truck,
        };
    });

    return (
        <>

            <div>
                {/* Navbar */}
                {loading === "True" ? (
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
                ) :
                    (
                        <div>



                            <div className="">
                                {/* Header */}


                                <div className="container-fluid px-0 pb-3">
                                    <div className="row">
                                        <div className="col-12">
                                            {/* <div className="grey_text_bold fs-6 mb-2">Order Details</div> */}

                                            <div>
                                                {truckOrders.map((order, orderIndex) => (
                                                    <div key={orderIndex} className='card position-relative  border_radius_10px shadow-sm mb-4 py-3'>

                                                        <AddMoreTruckHeader
                                                            orderIndex={orderIndex}
                                                            truckOrders={truckOrders}
                                                            shipToParties={shipToParties}
                                                            shipToParty={order.shipToPartyIndex}
                                                            ports={ports}
                                                            order={order}
                                                            stuffingDate={stuffingDate}
                                                            setLoading={setLoading}
                                                            setTruckOrders={setTruckOrders}
                                                            seasonOut={seasonOut}
                                                            setStuffingDate={setStuffingDate}
                                                            toast={toast}
                                                            reset={reset}
                                                            billtoparties={billtoparties}
                                                            setbilltoparties={setbilltoparties}
                                                        />

                                                        <AddMoreTruckBody
                                                            order={order}
                                                            truckOrders={truckOrders}
                                                            orderIndex={orderIndex}
                                                            flavours={flavoursTrucking}
                                                            seasonOut={seasonOut}
                                                            toast={toast}
                                                            setTruckOrders={setTruckOrders}
                                                            reset={reset}
                                                            incrementPoBuyer={incrementPoBuyer}
                                                        />
                                                    </div>
                                                ))}

                                                <div className='px-2 pb-4 col-12 d-flex justify-content-start mt-4 pt-1 '>
                                                    <Tooltip
                                                        label={`Maximum ${max_truck ? max_truck : 20} Truck`}
                                                        hasArrow
                                                        arrowSize={15}
                                                    >
                                                        <button
                                                            className={"fw-bold btn btn-danger py-1  border_radius_10px"}
                                                            onClick={addOrder}
                                                            disabled={truckOrders.length === (max_truck ? max_truck : 20)}
                                                        >
                                                            Add Truck
                                                        </button>
                                                    </Tooltip>
                                                </div>


                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
            <AddmoreTruckFooter
                handleCheckout={handleCheckout}
                TruckOrderDetail={truckOrders}
                mode={mode}
                setContainerOrders={setTruckOrders}
                setLoading={setLoading}
                loading={loading}
                initialOrders={initialOrders}
                setReset={setReset}
                setrefresh={setrefresh}
                buttonLoading={loading}
                setButtonLoading={setLoading}
            />
        </>
    );
}

export default AddMoreTruck;
