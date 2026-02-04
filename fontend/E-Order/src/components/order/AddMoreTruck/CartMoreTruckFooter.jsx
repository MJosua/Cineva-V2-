import { Tooltip, useToast, Button } from "@chakra-ui/react"
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../../config";
import Axios from "axios";
import { useEffect, useState } from "react";

function CartMoreTruckFooter(
    {
        handleCheckoutTruck,
        handleCheckoutContainer,
        containerOrders,
        containerOrdersInformation,
        TruckOrderDetail,
        mode,
        userToken,
        setContainerOrders,
        initialOrders,
        setReset,
        setContainerOrdersInformation,
        onCloseModalEdit,
        handleToggle,
        selectedCreation_date,
        selectedCompanyId,
        buttonLoading,
        active,
        setButtonLoading,
        selectedCartId,
        setCheckout,
    }
) {

    const navigate = useNavigate();
    const toast = useToast();


    const [loading, setLoading] = useState(false)


    const inputCard = (data) => {
        Axios.post(`${API_URL}/cart/add_cart`, data, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                console.log('POST sent Data:', data);

                if (res.data.success) {
                    setContainerOrders([]);
                    toast({
                        title: 'Cart Created.',
                        description: res.data.message,
                        status: 'success',
                        duration: 4500,
                        isClosable: true,
                    })
                    setLoading(false);
                    setButtonLoading(false)

                    onCloseModalEdit();
                    handleToggle();
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
                setButtonLoading(false)

            });
    };



    const handleSaveDraftContainer = async () => {


        const backendDataMaking = {
            cart: containerOrders.map(containerOrder => {
                const { header, detail, summary } = containerOrder.order;
                console.log("Checking bulk value:", detail.bulk);
                return {
                    jenis: "container",
                    delv_year: containerOrdersInformation.delv_year,
                    delv_week_desc: containerOrdersInformation.delv_week_desc,
                    delv_week: containerOrdersInformation.delv_week,
                    po_buyer: header.po_buyer,
                    stuffing_date: "",
                    port_shipment: header.port_shipment,
                    ship_to: header.ship_to,
                    bill_to: header.bill_to,
                    notify_to_1: header.notify_to_1,
                    notify_to_2: header.notify_to_2,
                    po_url: containerOrdersInformation.po_url,
                    final_dest: header.final_dest,
                    remarks: detail.remarks,
                    detail: !detail.bulk || detail.bulk === "0"
                        ? detail.containerList.map(container => ({
                            detail_id: container.detail_id,
                            cont_size: detail.cont_size,
                            cont_qty: detail.cont_qty,
                            custom: container.custom === false || container.custom.toLocaleString() === "0" || container.custom === null ? 0 : 1,
                            bulk: "0",
                            Flavour: container.Flavour.map(flavour => ({
                                sku: flavour.sku,
                                qty: flavour.qty
                            }))
                        }))
                        : [{
                            detail_id: detail.bulkList.detail_id,
                            cont_size: detail.cont_size,
                            cont_qty: detail.cont_qty,
                            bulk: "1",
                            Flavour: detail.bulkList.Flavour.map(flavour => ({
                                sku: flavour.sku,
                                qty: flavour.qty
                            }))
                        }],
                    summary: summary.Flavour.map((sum, sumIdx) => ({
                        detail_id: sumIdx + 1,
                        sku: sum.sku,
                        qty: sum.qty
                    }))
                };
            })
        };
        // Validation checks
        if (backendDataMaking.cart.some(order => !order.po_buyer)) {
            toast({
                title: 'Error',
                description: 'A draft needs to have a PO Buyer filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            return;
        }

        if (backendDataMaking.cart.some(order => !order.delv_year)) {
            toast({
                title: 'Error',
                description: 'A draft needs to have Date filled.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            return;
        }

        // Handle cart deletion and save
        try {
            if (containerOrders.some(order => !order.order.header.cart_id)) {
                // No cart_id present, directly save the new cart
                await inputCard(backendDataMaking);
                console.log("backendDataMaking", backendDataMaking)
            } else {
                // Cart ID present, delete previous carts and then save
                const created_date = selectedCreation_date;
                const company_id = selectedCompanyId;

                for (const cartId of selectedCartId) {
                    try {
                        await Axios.delete(`${API_URL}/cart/delete?cart_id=${cartId}`, {
                            headers: { Authorization: `Bearer ${userToken}` },
                            data: { company_id, created_date },
                        });

                    } catch (deleteError) {
                        toast({
                            title: 'Error!',
                            description: `Failed to delete item, ${cartId}`,
                            status: 'error',
                            duration: 3000,
                            isClosable: true,
                            className: 'pb-5',
                        });
                        console.error(deleteError);
                    }
                }

                await inputCard(backendDataMaking);
            }

            // Optionally, handle success response here
        } catch (saveError) {
            toast({
                title: 'Error',
                description: 'Failed to save the draft.',
                status: 'error',
                duration: 4500,
                isClosable: true,
            });
            console.error(saveError);
        } finally {
        }
    };




    const handleSaveDraftTrucking = async () => {
        const backendDataMaking = {
            cart: TruckOrderDetail.map(order => {
                const delv_year = new Date(order.delv_date).getFullYear();

                return {
                    "jenis": "Truck",
                    "delv_year": delv_year,
                    "delv_week_desc": "",
                    "delv_week": 0,
                    "po_buyer": order.po_buyer,
                    "stuffing_date": order.delv_date,
                    "port_shipment": order.port,
                    "ship_to": order.shipToParty,
                    "po_url": order.po_url,
                    "bill_to": order.bill_to,
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

        console.log("backendDataMaking", backendDataMaking)

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

        const checkCartorNot = TruckOrderDetail.some(order => {
            // Extract po_buyer from the current order
            const cart_id = order.cart_id;

            // Check if po_buyer is empty
            return cart_id === "";
        });

        if (!checkCartorNot) {
            // If cart_id is present, delete the previous cart_id
            try {
                const created_date = selectedCreation_date;
                const company_id = selectedCompanyId;
                const response = await Axios.delete(
                    `${API_URL}/cart/delete?cart_id=${selectedCartId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${userToken}`,
                        },
                        data: { company_id, created_date },
                    }
                );

                // Handle the response and show success toast
                // toast({
                //     title: "Success!",
                //     description: "Item Successfully deleted!",
                //     status: "success",
                //     duration: 5000,
                //     isClosable: true,
                //     className: "pb-5",
                // });


                // Proceed to save the new cart
                try {
                    const saveResponse = await inputCard(backendDataMaking);
                    sessionStorage.setItem("truckOrders", JSON.stringify([]));

                    // Optionally, navigate or perform other actions upon successful save
                } catch (saveError) {
                    console.log(saveError);
                    // Handle error during save operation
                }

            } catch (deleteError) {
                // Handle delete error and show error toast
                toast({
                    title: "Error!",
                    description: `Failed to delete item, ${selectedCartId}`,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                    className: "pb-5",
                });
                console.log(deleteError);
            }
        } else {
            // If no cart_id, directly save the new cart
            try {
                const saveResponse = await inputCard(backendDataMaking);
                sessionStorage.setItem("truckOrders", JSON.stringify([]));

                // Optionally, navigate or perform other actions upon successful save
            } catch (saveError) {
                console.log(saveError);
                setButtonLoading(false)
                // Handle error during save operation
            }
        }


    }


    return (
        <>
            <div className=" 
          
            ">
                <div
                    className="
                row 
                d-flex 
                justify-content-evenly 
                bg-white 
                py-2 
                px-0  
                ">

                    <div className="col-6 px-5 d-flex justify-content-start">
                        <Button
                            className="btn btn-outline-secondary shadow w-50 mt-1 p-2 fw-bold"

                            onClick={() => {
                                setLoading(true);

                                mode === "Truck" ?
                                    // <AddMoreContainerTest />
                                    handleSaveDraftTrucking()
                                    :
                                    console.log("pasti error")

                            }
                            }
                            isLoading={loading}
                        >
                            Save draft
                        </Button>
                    </div>

                    <div className="col-6 px-5 d-flex justify-content-end ">
                        <div className="col-md-6">
                            {buttonLoading === false && (
                                <button
                                    className="btn btn-danger shadow w-75 mt-1 p-2 fw-bold"
                                    onClick={() => {
                                        if (active === 1) {
                                            setButtonLoading(true);
                                            {
                                                mode === "Truck" ?
                                                    handleCheckoutTruck()
                                                    :
                                                    console.log("pasti error")


                                            }
                                        } else {
                                            toast({
                                                title: "Oopsie!",
                                                description: `Your Account is not allowed to proceed order (Inactive). Please contact your admin.`,
                                                status: "error",
                                                duration: 6000,
                                                isClosable: true,
                                            });
                                        }
                                    }}
                                    disabled={selectedCartId === 0}
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
            </div >
        </>
    )
}

export default CartMoreTruckFooter




