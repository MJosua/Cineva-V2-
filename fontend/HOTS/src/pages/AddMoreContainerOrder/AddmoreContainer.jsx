import { useEffect, useState } from "react"
import { Spinner, Tooltip, useToast } from "@chakra-ui/react"
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../config";
import Axios from "axios";
import { seasonOut, loginAction, logoutAction } from "../../action/userAction";
import { AiFillCloseCircle } from "react-icons/ai";
import AddMoreContainerHeader from "../../components/AddMoreContainer/AddMoreContainerHeader";
import AddMoreContainerBody from "../../components/AddMoreContainer/AddMoreContainerBody";
import AddMoreContainerInformation from "../../components/AddMoreContainer/AddMoreContainerInformation";
import AddmoreTruckFooter from "../../components/AddMoreTruck/AddMoreTruckFooter";
import AddMoreContainerSummary from "../../components/AddMoreContainer/AddMoreContainerSummary";
import { Button } from "bootstrap";
import { useData } from "../../components/CheckToken/FetchData/DataContext";
function AddMoreContainerTest({ mode }) {

    const { flavours, ports, shipToParties, container, globalLoading, ostp } = useData();

    const [billtoparties, setbilltoparties] = useState([]);
    const [stuffingWeeks, setStuffingWeeks] = useState([]);

    const { user_id, user, company_id, active, max_sku, pallet, company_name } = useSelector((state) => {
        return {
            user_id: state.userReducer.user_id,
            company_id: state.userReducer.company_id,
            active: state.userReducer.active,
            max_sku: state.userReducer.max_sku,
            pallet: state.userReducer.pallet,
            company_name: state.userReducer.company_name,
            user: state.userReducer.user,
        };
    });

    const toast = useToast();

    const [reset, setReset] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();




    const initialOrderInformation = {

        
        delv_week: stuffingWeeks && stuffingWeeks.length > 0 ? stuffingWeeks[0].week : "",
        delv_week_id: stuffingWeeks &&  stuffingWeeks.length > 0 ? stuffingWeeks[0].id : "",
        delv_week_desc: stuffingWeeks &&  stuffingWeeks.length > 0 ? `Week ${stuffingWeeks[0].week} (${stuffingWeeks[0].startingDate} - ${stuffingWeeks[0].endingDate})` : "",
        delv_year:  stuffingWeeks &&  stuffingWeeks.length > 0 ? stuffingWeeks[0].year : "",
        po_url: "",
        fileOriginalName: ""



    }

    const initialOrders = [
        {
            "order": {
                "header": {
                    "po_buyer": "",
                    "port_shipment": ports[0] ? ports[0].md_id : "",
                    "ship_to": shipToParties[0] ? shipToParties[0].keyy : "",
                    "final_dest": ports[0] ? ports[0].final_dest : "",
                    "notify_to_1": "",
                    "notify_to_2": "",
                    "bill_to": ostp.BillTP?.[0]?.company_id || "",
                    "po_url": "",

                },

                "detail": {
                    "cont_size": "",
                    "cont_qty": "1",
                    "bulk": false,
                    "remarks": "",
                    "containerList": [
                        {
                            "detail_id": "1",
                            "custom": false,
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
                                    "custom": false,
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
                        "custom": false,
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


    const [containerOrders, setContainerOrders] = useState(() => {
        const storedOrders = sessionStorage.getItem('containerOrders');
        return storedOrders ? JSON.parse(storedOrders) : initialOrders;
    });

    const checkAndResetOrders = () => {
        if (Array.isArray(containerOrders) && containerOrders.length === 0) {
            setContainerOrders(initialOrders);
        }
    };

    useEffect(() => {
        checkAndResetOrders();
    }, []);

    const [containerOrdersInformation, setContainerOrdersInformation] = useState(() => {
        const storedOrders = sessionStorage.getItem('containerOrdersInformation');
        return storedOrders ? JSON.parse(storedOrders) : initialOrderInformation;
    });



    useEffect(() => {
        sessionStorage.setItem('containerOrders', JSON.stringify(containerOrders));
    }, [containerOrders, user])

    useEffect(() => {
        sessionStorage.setItem('containerOrdersInformation', JSON.stringify(containerOrdersInformation));
    }, [containerOrdersInformation, user])

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

    const [refresh, setrefresh] = useState(false);

    const addOrder = () => {
        let newPoBuyer = ""

        if (!hasError) {
            if (containerOrders.length > 0) {
                const lastOrder = containerOrders[containerOrders.length - 1];
                if (lastOrder.order.header.po_buyer) {
                    newPoBuyer = incrementPoBuyer(lastOrder.order.header.po_buyer);
                }
            }

            if (containerOrders.length < 20) {
                setContainerOrders([...containerOrders, {
                    order: {
                        header: {
                            po_buyer: newPoBuyer,
                            po_url: "",
                            port_shipment: "",
                            ship_to: "",
                            final_dest: "",
                            notify_to_1: "",
                            notify_to_2: "",
                            bill_to: ostp ? ostp.BillTP[0].company_id.toLocaleString() : "",
                        },
                        detail: {
                            cont_size: "",
                            cont_qty: "1",
                            bulk: false,
                            remarks: "",
                            containerList: [{
                                detail_id: containerOrders.length + 1,
                                custom: false,
                                Flavour: [{
                                    sku: "-1",
                                    qty: 0,
                                    Flavour_tollingID: 0,
                                    qty_max: "",
                                    moq: "",
                                    palete_qty: 0,

                                }, {
                                    sku: "-1",
                                    qty: 0,
                                    Flavour_tollingID: 0,
                                    qty_max: "",
                                    moq: "",
                                    palete_qty: 0,

                                }]
                            }],
                            bulkList: {
                                detail_id: 1,
                                custom: false,
                                Flavour: [{
                                    sku: "-1",
                                    qty: 0,
                                    Flavour_tollingID: 0,
                                    qty_max: "",
                                    moq: "",
                                    palete_qty: 0,
                                    qty_real: "",

                                }, {
                                    sku: "-1",
                                    qty: 0,
                                    Flavour_tollingID: 0,
                                    qty_max: "",
                                    moq: "",
                                    palete_qty: 0,
                                    qty_real: "",

                                }]
                            }
                        },
                        summary: {
                            detail_id: "",

                        }
                    }
                }]);
            }
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













    const [loading, setLoading] = useState(false)


    const [existingPo, setExsitingPo] = useState([]);
    const getExistingPo = async () => {
        let userToken = localStorage.getItem("tokek");
        Axios.get(API_URL + "/order/get_po", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setExsitingPo(res.data);
                // console.log("diajalan lagi")
            })
            .catch((err) => {
            });
    };
    
    useEffect(() => {
        getExistingPo();
    }, []);

    const [sessionStorageTrigger, setSessionStorageTrigger] = useState(false)






    const [hasError, setHasError] = useState(false);
    const [errors, setErrors] = useState([]);


    const handleCheckout = async () => {
        await getExistingPo();
        // console.log("✅ Refreshed existing PO:");
        let errors = [];
        if (!hasError) {
            const key = 'containerOrders';
            const key2 = 'containerOrdersInformation';
            try {
                // Parse the session storage item as JSON
                const value = JSON.parse(sessionStorage.getItem(key));
                const value2 = JSON.parse(sessionStorage.getItem(key2));



                // Check if the value is an array
                if (Array.isArray(value)) {
                    let hasError = false;

                    // Create a lookup for the flavors based on ID
                    const flavorLookup = flavours.reduce((lookup, flavor) => {
                        lookup[flavor.product_code] = flavor;
                        return lookup;
                    }, {});

                    const aggregatedFlavors = {};

                    value.flatMap((item, index) => {
                        const bulkStatus = item.order.detail.bulk
                        let flavors = [];
                        flavors = item.order.detail.containerList.flatMap(container => container.Flavour);


                        // First pass to aggregate quantities
                        flavors.forEach((flavor, flavorIndex) => {
                            const sku = flavor.sku;
                            const qty = Number(flavor.qty); // Convert qty to number for summation

                            if (!aggregatedFlavors[sku]) {
                                aggregatedFlavors[sku] = { qty: 0, moq: flavor.moq, flavorIndex: flavorIndex };
                            }

                            aggregatedFlavors[sku].qty += qty;

                        });




                    })

                    const notifiedSkus = new Set();
                    const poBuyerSet = new Set();


                    value.forEach((item, index) => {
                        const poBuyer = item.order.header.po_buyer;
                        const delvDate = value2.delv_week; // Assuming delv_date is a property inside order (adjust if different)
                        const bulkStatus = item.order.detail.bulk
                        let flavors = [];
                        flavors = item.order.detail.containerList.map(container => container.Flavour);
                        if (bulkStatus === false) {
                            Object.entries(aggregatedFlavors).forEach(([sku, { qty, moq, flavorIndex }]) => {
                                const existingFlavor = flavorLookup[sku];

                                if (moq && qty < moq) {
                                    // Check if a toast has already been shown for this SKU
                                    if (!notifiedSkus.has(sku)) {
                                        toast({
                                            title: "Error!",
                                            description: `Flavor ${existingFlavor.product_name} has a quantity (${qty}) less than the minimum order quantity (MOQ) of ${moq}.`,
                                            status: "error",
                                            duration: 6000,
                                            isClosable: true
                                        });
                                        // Add SKU to the Set to prevent duplicate toasts
                                        notifiedSkus.add(sku);
                                        hasError = true;
                                    }
                                }
                            });
                        }
                        else {

                        }

                        if (poBuyerSet.has(poBuyer)) {
                            toast({
                                title: "Error!",
                                description: `Po_buyer "${poBuyer}" at Container ${index + 1} already exists.`,
                                status: "error",
                                duration: 6000,
                                isClosable: true
                            });
                            hasError = true;
                            errors.push({ orderIndex: index, errorType: 'existing_po_buyer' });
                        } else {
                            // Add the po_buyer to the Set
                            poBuyerSet.add(poBuyer);
                        }



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
                        }


                        if (!delvDate) {
                            toast({
                                title: "Error!",
                                description: `Order at Container ${index + 1} has an empty delivery date.`,
                                status: "error",
                                duration: 6000,
                                isClosable: true
                            });
                            hasError = true;
                            errors.push({ orderIndex: index, errorType: 'delivery date' });
                        }

                        if (!delvDate) {
                            toast({
                                title: "Error!",
                                description: `Order at Container ${index + 1} has an empty delivery date.`,
                                status: "error",
                                duration: 6000,
                                isClosable: true
                            });
                            hasError = true;
                            errors.push({ orderIndex: index, errorType: 'delivery date' });
                        }



                        // Check flavors array
                        if (bulkStatus === false) {

                            // const aggregatedFlavors = {};

                            // // First pass to aggregate quantities
                            // flavors.forEach((flavor, flavorIndex) => {
                            //     flavor.forEach((flavorList) => {
                            //         const sku = flavorList.sku;
                            //         const qty = Number(flavorList.qty); // Convert qty to number for summation

                            //         if (!aggregatedFlavors[sku]) {
                            //             aggregatedFlavors[sku] = { qty: 0, moq: flavorList.moq, flavorIndex: flavorIndex };
                            //         }

                            //         aggregatedFlavors[sku].qty += qty;
                            //     });
                            // });

                            // Second pass to validate quantities
                            // Object.entries(aggregatedFlavors).forEach(([sku, { qty, moq, flavorIndex }]) => {
                            //     if (qty < moq) {
                            //         toast({
                            //             title: "Error!",
                            //             description: `Order at Container ${index + 1}, flavor ${flavorIndex + 1} has a quantity less than the minimum order quantity (MOQ) of ${moq}.`,
                            //             status: "error",
                            //             duration: 6000,
                            //             isClosable: true
                            //         });
                            //         hasError = true;
                            //         errors.push({ orderIndex: index, flavorIndex, errorType: 'moq' });
                            //     }
                            // });



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
                                    errors.push({ orderIndex: index, bulkFlavor, errorType: 'moq' });
                                }

                            });




                        }



                    });

                    setErrors(errors);
                    if (!hasError) {
                        // Proceed with navigation
                        // navigate("/e-order/truckorder/confirmation");

                        if (active === 1) {

                            setTimeout(() => {
                                navigate("/e-order/order/confirmation");
                            }, 800);
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






    const [customable, setCustombale] = useState(false)



    return (
        <div>
            <div className="container ">
                <div className="row px-0 ">
                    <div className="col-12 mb-2">
                        <AddMoreContainerInformation
                            stuffingWeeks={stuffingWeeks}
                            setStuffingWeeks={setStuffingWeeks}
                            containerOrders={containerOrders}
                            setContainerOrders={setContainerOrders}
                            containerOrdersInformation={containerOrdersInformation}
                            setContainerOrdersInformation={setContainerOrdersInformation}
                        />
                        <div className="col-12 grey_text_bold fs-6 pt-4 ">
                            Order Details
                        </div>
                    </div>
                </div>
            </div>
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
                <div >
                    <div className="container  ">
                        <div className="row px-0 pb-3 ">
                            {containerOrders.map((order, orderIndex) => {
                                const hasPoBuyerError = errors.some(error => error.orderIndex === orderIndex && error.errorType === 'po_buyer');

                                return (

                                    <div key={orderIndex} className='col-12 position-relative mb-3 card-body border shadow shadow-sm top_card_order_page '>

                                        <AddMoreContainerHeader
                                            order={order}
                                            orderIndex={orderIndex}
                                            setContainerOrders={setContainerOrders}
                                            containerOrders={containerOrders}
                                            ports={ports}
                                            shipToParties={shipToParties}
                                            billtoparties={billtoparties}
                                            setbilltoparties={setbilltoparties}
                                            hasPoBuyerError={hasPoBuyerError}
                                            errors={errors}
                                            reset={reset}
                                            setCustombale={setCustombale}
                                            customable={customable}
                                            company_id={company_id}
                                            setSessionStorageTrigger={setSessionStorageTrigger}
                                            company_name={company_name}
                                            refresh={refresh}
                                            flavours={flavours}

                                        />
                                        <AddMoreContainerBody
                                            order={order}
                                            orderIndex={orderIndex}
                                            containerOrders={containerOrders}
                                            setContainerOrders={setContainerOrders}
                                            flavours={flavours}
                                            errors={errors}
                                            reset={reset}
                                            setSessionStorageTrigger={setSessionStorageTrigger}
                                            customable={customable}
                                            incrementPoBuyer={incrementPoBuyer}
                                        />




                                    </div>
                                )
                            })}





                        </div>

                    </div>

                    <div className='px-0 px-md-2 pb-4 col-12 d-flex justify-content-start mt-4 pt-1 '>
                        <Tooltip
                            label="Maximum 20 Container"
                            hasArrow
                            arrowSize={15}
                        >
                            <button
                                className={"fw-bold btn btn-danger py-1  border_radius_10px"}
                                onClick={() => { addOrder(); }}
                                disabled={containerOrders.length > 20 || containerOrders[0]?.order.header.po_buyer === "" || hasError === true}
                            >
                                Add Order
                            </button>
                        </Tooltip>
                    </div>
                </div>
            }

            <AddMoreContainerSummary
                flavours={flavours}
                containerOrders={containerOrders}
                containerOrdersInformation={containerOrdersInformation}
                setContainerOrders={setContainerOrders}
                sessionStorageTrigger={sessionStorageTrigger}
            />


            <AddmoreTruckFooter
                setReset={setReset}
                handleCheckout={handleCheckout}
                containerOrders={containerOrders}
                containerOrdersInformation={containerOrdersInformation}
                mode={mode}
                setContainerOrders={setContainerOrders}
                initialOrders={initialOrders}
                setContainerOrdersInformation={setContainerOrdersInformation}
                initialOrderInformation={initialOrderInformation}
                loading={loading}
                setLoading={setLoading}
                refresh={refresh}
                setrefresh={setrefresh}
            />
        </div >
    )
}

export default AddMoreContainerTest