import { Tooltip, useToast, Button } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../../config";
import Axios from "axios";
import { useState } from "react";
import { clearSeasonStorage } from "../../../../action/cartAction";
import { useData } from "../../../auth/components/CheckToken/FetchData/DataContext";
function AddmoreTruckFooter({
    handleCheckout,
    containerOrders,
    containerOrdersInformation,
    TruckOrderDetail,
    mode,
    userToken,
    setContainerOrders,
    initialOrders,
    initialOrderInformation,
    refresh,
    setrefresh,

}) {
    const navigate = useNavigate();
    const toast = useToast();



    const [loading, setLoading] = useState(false)


    const inputCard = (data) => {

        let userToken = localStorage.getItem("tokek");

        Axios.post(`${API_URL}/cart/add_cart`, data, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                console.log("backenDATACART", data)

                if (res.data.success) {
                    clearSeasonStorage()
                    setContainerOrders(initialOrders)
                    setrefresh(prev => !prev)
                    setLoading(false)
                    toast({
                        title: 'Cart Created.',
                        description: res.data.message,
                        status: 'success',
                        duration: 4500,
                        isClosable: true,
                    })
                }


            })
            .catch((err) => {
                console.error('Error making POST request:', err);
                toast({
                    title: 'Error',
                    description: 'Failed to save draft. Please refresh the page or check your stuffing date.',
                    status: 'error',
                    duration: 4500,
                    isClosable: true,
                });
                setLoading(false)

            });
    };

    const handleSaveDraftContainer = async () => {
        const backendDataMaking = {
            cart: containerOrders.map(containerOrder => {
                const header = containerOrder.order.header;
                const detail = containerOrder.order.detail;
                const summary = containerOrder.order.summary;
                console.log("detail from save draft", detail)
                console.log("containerOrdersInformation.delv_year", containerOrdersInformation.delv_year)
                return {
                    "jenis": "kontainer",
                    "delv_year": containerOrdersInformation.delv_year,
                    "delv_week_desc": containerOrdersInformation.delv_week_desc,
                    "delv_week": containerOrdersInformation.delv_week,
                    "po_buyer": header.po_buyer,
                    "stuffing_date": "",
                    "port_shipment": header.port_shipment,
                    "ship_to": header.ship_to,
                    "po_url": header.po_url,
                    "bill_to": header.bill_to,
                    "notify_to_1": header.notify_to_1,
                    "notify_to_2": header.notify_to_2,
                    "final_dest": header.final_dest,
                    "remarks": detail.remarks,
                    "detail": !detail.bulk ?
                        detail.containerList.map((container, containerIndex) => ({
                            "detail_id": (containerIndex + 1),
                            "cont_size": detail.cont_size,
                            "cont_qty": detail.cont_qty,
                            "bulk": detail.bulk,
                            "custom": detail.custom === false || detail.custom === null || !detail.custom || detail.custom.toLocaleString() === "false" || detail.custom.toLocaleString() === "0" ? 0 : 1,
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

        const checkEmptyPoBuyer = backendDataMaking.cart.some(order => {
            // Extract po_buyer from the current order
            const poBuyer = order.po_buyer;

            // Check if po_buyer is empty
            return poBuyer === "";
        });

        if (checkEmptyPoBuyer) {
            // Handle case where a po_buyer is empty
            toast({
                title: 'Error',
                description: 'A draft needs to have a PO Buyer filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            setLoading(false)
            return; // Exit function early
        }


        const checkEmptyDate = backendDataMaking.cart.some(order => {
            // Extract po_buyer from the current order
            const delv_year = order.delv_year;

            // Check if po_buyer is empty
            return delv_year === "";
        });

        if (checkEmptyDate) {
            // Handle case where a po_buyer is empty
            toast({
                title: 'Error',
                description: 'A draft needs to have Date filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            setLoading(false)
            return; // Exit function early
        }


        try {
            const response = await inputCard(backendDataMaking);


            // Optionally, navigate or perform other actions upon successful save
        } catch (error) {
            // Handle error (e.g., show error message to user)
            console.log(error)
        }
    }




    const handleSaveDraftTrucking = async () => {
        console.log("yang jalan truck")
        const backendDataMaking = {
            cart: TruckOrderDetail.map(order => {
                const delv_year = new Date(order.delv_date).getFullYear();
                return {
                    "jenis": "trucking",
                    "delv_year": delv_year,
                    "delv_week_desc": "",
                    "delv_week": 0,
                    "po_buyer": order.po_buyer,
                    "stuffing_date": order.delv_date,
                    "port_shipment": order.port,
                    "bill_to": order.bill_to,
                    "notify_to_1": order.notify_to_1,
                    "notify_to_2": order.notify_to_2,
                    "ship_to": order.shipToParty,
                    "po_url": order.po_url,
                    "tolling_id": 1,
                    "final_dest": order.final_dest,
                    "remarks": order.remark,
                    "detail": order.flavors.map((flavour, flavourIdx) => ({
                        "detail_id": flavourIdx + 1,
                        "cont_size": 8,
                        "cont_qty": 0,
                        "bulk": 0,
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

        const checkEmptyPoBuyer = backendDataMaking.cart.some(order => {
            // Extract po_buyer from the current order
            const poBuyer = order.po_buyer;

            // Check if po_buyer is empty
            return poBuyer === "";
        });



        if (checkEmptyPoBuyer) {
            // Handle case where a po_buyer is empty
            toast({
                title: 'Error',
                description: 'A draft needs to have a PO Buyer filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            setLoading(false)
            return; // Exit function early
        }

        const checkEmptyDate = backendDataMaking.cart.some(order => {
            // Extract po_buyer from the current order
            const delv_year = order.delv_year;
            console.log(delv_year)

            // Check if po_buyer is empty
            return delv_year === "";
        });

        if (checkEmptyDate) {
            // Handle case where a po_buyer is empty
            toast({
                title: 'Error',
                description: 'A draft needs to have Date filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            setLoading(false)
            return; // Exit function early
        }

        try {
            const response = await inputCard(backendDataMaking);
            console.log("backendDataMaking", backendDataMaking)
            // Optionally, navigate or perform other actions upon successful save
        } catch (error) {
            console.error('Error making POST request:', error);
            // Handle error (e.g., show error message to user)
            toast({
                title: 'Error',
                description: 'Failed to save draft. Please try again later.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            setLoading(false)

        }


    }




    return (
        <>
            <div className=" 
            shadow-none  
            fixed-bottom 
            button_bottom_sticky 
            background-position 
            ">
                <div
                    className="
                row 
                shadow
                d-flex 
                justify-content-evenly 
                bg-white 
                py-2 
                px-0  
                border-top
                ">
                    <div className="col-6  px-5 d-flex justify-content-start">
                        <Button
                            className="btn btn-outline-secondary btn-save-draft w-100 w-md-50 mt-1 p-2 fw-bold"
                            id="tombolSaveDraft"
                            style={{ maxWidth: "130px" }}
                            onClick={() => {
                                setLoading(true);
                                mode === "Container" ?
                                    // <AddMoreContainerTest />
                                    handleSaveDraftContainer()
                                    :
                                    handleSaveDraftTrucking()
                            }
                            }
                            isLoading={loading}
                        >
                            Save draft
                        </Button>
                    </div>

                    <div className="col-6 px-5 d-flex justify-content-end ">
                        <button
                            className="btn w-100 w-md-50 btn-checkout  shadow mt-1 p-2 fw-bold"
                            style={{ maxWidth: "130px" }}
                            colorscheme="red"
                            onClick={() => {

                                handleCheckout()

                            }
                            }
                        >
                            Checkout
                        </button>


                    </div>
                </div>
            </div >
        </>
    )
}

export default AddmoreTruckFooter




