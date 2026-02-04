import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";

 

import { clearSeasonStorage } from "../../../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../../../action/userAction";

import { useDispatch } from "react-redux";

import { API_URL } from "../../../config";
import { useLocation } from "react-router-dom"


import {
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Box,
    Image
} from '@chakra-ui/react'

import Sidebar from "../../../components/layout/Sidebar.jsx";

import { MinusIcon, AddIcon } from '@chakra-ui/icons'

const FAQPage = () => {

    const dispatch = useDispatch();
    let userToken = localStorage.getItem("tokek");
    const location = useLocation();
    

    const navigate = useNavigate();





    const [orderPlacement, setOrderPlacement] = useState(false);
    const [shippingDelivery, setShippingDelivery] = useState(false);
    const [accountSupport, setAccountSupport] = useState(false);
    const [complaint, setComplaint] = useState(false);

    function toggleOrderPlacement() {
        setOrderPlacement(prevOrderPlacement => !prevOrderPlacement);
        setAccountSupport(false);
        setShippingDelivery(false);
        setComplaint(false);
    }

    function toggleShippingDelivery() {
        setShippingDelivery(prevOrderPlacement => !prevOrderPlacement);
        setAccountSupport(false);
        setComplaint(false);
        setOrderPlacement(false);
    }

    function toggleAccountSupport() {
        setAccountSupport(prevOrderPlacement => !prevOrderPlacement);
        setComplaint(false);
        setShippingDelivery(false);
        setOrderPlacement(false);
    }

    function toggleComplaint() {
        setComplaint(prevOrderPlacement => !prevOrderPlacement);
        setAccountSupport(false);
        setShippingDelivery(false);
        setOrderPlacement(false);
    }
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

                <div className="py-5">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4">
                            <div>
                                <div className="row user-select-none">

                                    <div className="col-12 d-flex text-secondary  pt-1 ps-4 ps-md-0">
                                        <span
                                            onClick={() => navigate("/e-order/dashboard")}

                                            className="pointer grey_text_normal_20px">
                                            e-order /&nbsp;
                                        </span>
                                        <span
                                            onClick={() => navigate("/e-order/help")}

                                            className="pointer grey_text_normal_20px">
                                            Help
                                        </span>

                                        <span className="grey_text_20px">
                                            &nbsp;/ FAQ
                                        </span>
                                        {!orderPlacement ?
                                            <>
                                            </>
                                            :
                                            <span className="grey_text_20px text-danger">
                                                &nbsp;/ Order Placement
                                            </span>
                                        }
                                        {!shippingDelivery ?
                                            <>
                                            </>
                                            :
                                            <span className="grey_text_20px text-danger">
                                                &nbsp;/ Shipping & Delivery
                                            </span>
                                        }
                                        {!accountSupport ?
                                            <>
                                            </>
                                            :
                                            <span className="grey_text_20px text-danger">
                                                &nbsp;/ Account Support
                                            </span>
                                        }
                                        {!complaint ?
                                            <>
                                            </>
                                            :
                                            <span className="grey_text_20px text-danger">
                                                &nbsp;/ Complaint
                                            </span>
                                        }

                                    </div>
                                </div>
                                <div classname="container-fluid">
                                    <div className="row pt-4 px-2">
                                        <div className="col-3 col-md-3 text-secondary px-md-4 px-2 mt-1 ">
                                            <div className={
                                                "card hover-pink border_radius_10px py-2 py-md-1 px-2 px-md-0 py-md-5 shadow d-flex justify-content-center align-items-center" +
                                                (!orderPlacement ? "" : " bg-danger-02")
                                            }
                                                onClick={toggleOrderPlacement}

                                            >


                                                <Image
                                                    src="/image/FAQ/order_placement.png"
                                                    height="100px"

                                                />
                                                <div className="text-secondary bottom-0 position-absolute  d-none d-md-block mb-2">
                                                    Order Placement
                                                </div>
                                            </div>
                                            <div className="text-secondary mt-1 d-block d-md-none ">
                                                Order Placement
                                            </div>
                                        </div>
                                        <div className="col-3 col-md-3 text-secondary px-md-4 px-2 mt-1 ">
                                            <div className={
                                                "card hover-pink border_radius_10px py-2 py-md-1 px-2 px-md-0 py-md-5 shadow d-flex justify-content-center align-items-center" +
                                                (!shippingDelivery ? "" : " bg-danger-02")
                                            }
                                                onClick={toggleShippingDelivery}
                                            >
                                                <Image
                                                    src="/image/FAQ/ShippingDeliver.png"
                                                    height="100px"
                                                />
                                                <div className="text-secondary bottom-0 position-absolute  d-none d-md-block mb-2">
                                                    Shipping & Delivery
                                                </div>
                                            </div>

                                            <div className="text-secondary mt-1 d-block d-md-none ">
                                                Shipping & Delivery
                                            </div>

                                        </div>
                                        <div className="col-3 col-md-3 text-secondary px-md-4 px-2 mt-1 ">
                                            <div className={
                                                "card hover-pink border_radius_10px py-2 py-md-1 px-2 px-md-0 py-md-5 shadow d-flex justify-content-center align-items-center" +
                                                (!accountSupport ? "" : " bg-danger-02")
                                            }
                                                onClick={toggleAccountSupport}

                                            >
                                                <Image
                                                    src="/image/FAQ/accountsupport.png"
                                                    height="100px"
                                                />
                                                <div className="text-secondary bottom-0 position-absolute  d-none d-md-block mb-2">
                                                    Account Support
                                                </div>
                                            </div>
                                            <div className="text-secondary mt-1 d-block d-md-none ">
                                                Account Support
                                            </div>
                                        </div>
                                        <div className="col-3 col-md-3 text-secondary px-md-4 px-2 mt-1 ">
                                            <div className={
                                                "card hover-pink border_radius_10px py-2 py-md-1 px-2 px-md-0 py-md-5 shadow d-flex justify-content-center align-items-center" +
                                                (!complaint ? "" : " bg-danger-02")
                                            }
                                                onClick={toggleComplaint}
                                            >
                                                <Image
                                                    src="/image/FAQ/Complaint.png"
                                                    height="100px"
                                                />
                                                <div className="text-secondary bottom-0 position-absolute  d-none d-md-block mb-2">
                                                    Complaint
                                                </div>

                                            </div>
                                            <div className="text-secondary mt-1  d-block d-md-none">
                                                Complaint
                                            </div>

                                        </div>



                                    </div>
                                </div>
                                {!orderPlacement ?
                                    <>
                                    </>
                                    :
                                    <div className="pt-5 px-3">
                                        <Accordion allowToggle className="text-secondary">

                                            <AccordionItem className="card border_radius_10px px-1 py-1 shadow-sm">
                                                <h2>
                                                    <AccordionButton>
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            1.	How long does it take for my order to be shipped after I submit the order?

                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    Based on the terms and conditions and the Customer Shipment Instructions (CSI) that we have agreed upon, your order will be shipped 5 weeks after the week in which you submitÂ theÂ order.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton>
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            2.	How can I see all the products that available to order in my country or region?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    To see all the products that you can order, you can do it through the <b>Product Catalog menu</b>. There is general information that can be used when you want to place an order.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            3.	How can I place an order?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    To place an order, simply do it through the <b>Place Order menu</b>. Fill in the shipping information, shipping time, and the products you want to order.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            4.	Is there a minimum order requirement?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    We apply a <b>Minimum Order Quantity (MOQ)</b> per product (in carton) that must be fulfilled within a <b>one-week shipping time</b>.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            5.	Can I modify or cancel my order after it's been placed?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    Depending on the status of your order:<br></br>
                                                    â€¢	If the status is <b>"waiting for confirmation",</b> modifications or cancellations are possible.<br></br>
                                                    â€¢	If the status is already <b>"confirmed"</b>, modifications or cancellations may be possible, but you must contact our support team in your region.<br></br>
                                                    â€¢	If the status is already <b>"on process"</b>, modifications or cancellations are not possible.
                                                </AccordionPanel>
                                            </AccordionItem>

                                        </Accordion>
                                    </div>
                                }

                                {!shippingDelivery ?
                                    <>
                                    </>
                                    :
                                    <div className="pt-5 px-3">
                                        <Accordion allowToggle className="text-secondary">

                                            <AccordionItem className="card border_radius_10px px-1 py-1 shadow-sm">
                                                <h2>
                                                    <AccordionButton>
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            1.	What shipping options are available for my order?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    The shipping options available for your order can be through <b>container shipping</b> with container options <b>40HC</b>, <b>40FT</b> and <b>20FT</b>. If you want to ship goods to be shipped faster, you can use <b>air freight</b>. Air freight is the fastest way to ship goods internationally.
                                                    <br></br>
                                                    The type of shipping option that you choose will depend on your specific needs. If you are shipping a large quantity of goods and you do not need them delivered quickly, then container shipping is the best option. If you need to ship goods quickly, then air freight is the best option.

                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            2.	How can I track my order's delivery status?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    Your order can be tracked when the product has been picked up from the factory and is on its way to the port of loading. To track your order, go to the <b>Transaction List menu</b>, show the details, and then press the <b>Track button</b>. A pop-up window will appear with information about the shipping details of your order. There is also container ID information that allows you to track the position of the container in real time through a website that has been redirected.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            3.	What's the estimated delivery time for my order?  </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    The estimated delivery time for your order may vary <b>depending on the destination</b>. To check the estimated delivery time, you can view the information on the <b>Transaction List menu</b>, just like you would track the order.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            4.	My order hasn't arrived within the expected delivery time. What should I do?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    If your order has not arrived within the estimated delivery time, there are a few things you can do:
                                                    <br></br>
                                                    1.	Check the tracking information for your order on the Transaction <b> List menu </b> > <b>Transaction Detail</b>. This will show you the current status of your order and where it is located.
                                                    <br></br>
                                                    2.	Contact our sales team at your region, they will provide you with more information about the status of your order or help you to resolve the issue.

                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            5.	What should I do once I've received my order?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    Once you have received your order in a container, there are a few things you should do:
                                                    <br></br>
                                                    1.	Take photos before and after the container seal is broken.
                                                    <br></br>
                                                    2.	Photo of closed container doors.
                                                    <br></br>
                                                    3.	Photo of partially open container doors (open on the left side).
                                                    <br></br>
                                                    4.	If you notice any damage, take photos and contact our customer support immediately.
                                                    <br></br>
                                                    5.	Unload the container promptly to help prevent damage to your products.
                                                    <br></br>
                                                    6.	Store the products in a safe and dry place.
                                                    <br></br>
                                                    7.	Check the products against your order packing list to ensure that you have received all of the items that you ordered in the correct condition.
                                                    <br></br>
                                                    8.	If you have any questions or concerns, contact our sales team at your region immediately.

                                                </AccordionPanel>
                                            </AccordionItem>

                                        </Accordion>
                                    </div>
                                }

                                {!accountSupport ?
                                    <>
                                    </>
                                    :
                                    <div className="pt-5 px-3">
                                        <Accordion allowToggle className="text-secondary">

                                            <AccordionItem className="card border_radius_10px px-1 py-1 shadow-sm">
                                                <h2>
                                                    <AccordionButton>
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            1.	How can I create an account?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    To create an account in e-order, you can contact our representative in your region. You can ask about all the required documents and discuss the agreement. If you agree to all the terms, our sales team will contact you soon and send you the user account that you can use to place orders on e-order.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            2.	What should I do if I forget my password?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    Click <b>Forgot Password</b> on the login page and follow the instructions to reset your password.
                                                </AccordionPanel>
                                            </AccordionItem>

                                            <AccordionItem className="card border_radius_10px px-1 py-1 mt-3 shadow-sm">
                                                <h2>
                                                    <AccordionButton >
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5">
                                                            3.	How can I contact the customer support?
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    You can reach our customer support team through the <b>Help menu</b> > <b>Contact Us</b>. You can fill out the form if you have any questions or concerns.
                                                </AccordionPanel>
                                            </AccordionItem>



                                        </Accordion>
                                    </div>
                                }

                                {!complaint ?
                                    <>
                                    </>
                                    :
                                    <div className="pt-5 px-3">
                                        <Accordion allowToggle className="text-secondary">

                                            <AccordionItem className="card border_radius_10px px-1 py-1 shadow-sm">
                                                <h2>
                                                    <AccordionButton>
                                                        <Box as="span" flex='1' textAlign='left' className="fs-5 lh-base"

                                                        >
                                                            <li type="1" style={{ marginLeft: "20px" }}>  What should I do if I received a damaged product, the wrong product, or missing product from my order?
                                                            </li>
                                                        </Box>
                                                        <AccordionIcon />
                                                    </AccordionButton>
                                                </h2>
                                                <AccordionPanel pb={4} className="text-start">
                                                    If you received a damaged, wrong or missing product, you should contact the sales team at your region immediately. When you contact the sales team, be sure to provide the following information:
                                                    <br></br>
                                                    â€¢	Shipping Document and Bill of Loading (BL)
                                                    <br></br>
                                                    â€¢	Close-up photos before and after the container seal is broken.
                                                    <br></br>
                                                    â€¢	Photo of closed container doors.
                                                    <br></br>
                                                    â€¢	Photo of partially open container doors (open on the left door).
                                                    <br></br>
                                                    â€¢	Last photo of tier before unloading.
                                                    <br></br>
                                                    â€¢	Complete documents for unloading product (scan/photo)
                                                    <br></br>
                                                    â€¢	Detail photo damage/wrong products (including batch code, exp date, production date).
                                                    <br></br>
                                                    â€¢	Video documentation of unloading process.

                                                </AccordionPanel>
                                            </AccordionItem>







                                        </Accordion>
                                    </div>
                                }


                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default FAQPage;





