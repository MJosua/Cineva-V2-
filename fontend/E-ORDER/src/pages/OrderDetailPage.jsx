import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Axios from 'axios';
import { API_URL } from "../config";

import Sidebar from "../components/Sidebar";

import { BsFillXCircleFill } from "react-icons/bs";
import {
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useToast,
    ModalCloseButton,
    useDisclosure,
    Input,
    Tooltip,
    Image,
    RadioGroup,
    Stack,
    Radio,
    useSteps,
    Step,
    Stepper,
    StepIndicator,
    StepIcon,
    StepStatus,
    StepTitle,
    Box,
    StepDescription,
    StepSeparator,
    StepNumber,
    Button,
} from '@chakra-ui/react';

import {
    BsThreeDotsVertical,
    BsFillDashCircleFill,
    BsCircle,
    BsFillCheckCircleFill
} from 'react-icons/bs';

import { AiFillFile } from 'react-icons/ai';
import { useLocation } from "react-router-dom"

import { useSelector } from 'react-redux';

import { seasonOut } from '../action/userAction'

import ContainerTracking from './admin/ContainerTracking/ContainerTracking';
import { FaFile } from 'react-icons/fa6';
import PdfViewer from '../components/PDFViewer/PdfViewer';
import ExcelPreview from '../components/ExcelViewer/ExcelViewer';
import IndofoodPO from './IndofoodPO/IndofoodPO';
import { useData } from '../components/CheckToken/FetchData/DataContext';




const OrderDetailPage = () => {
    const location = useLocation();
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
    // ======================================================== GET DATA ========================================================

    // let userData = localStorage.getItem('userLogStore');
    // let getCompany = JSON.parse(userData);
    // const company_id = getCompany[0].company_id;

    const { company_id } = useSelector((state) => {
        return {
            company_id: state.userReducer.company_id
        }
    });

    const { order_id_by_params } = useParams();


    console.log('order_id_by_params', order_id_by_params)

    const {
        isOpen: isOpenModalImage,
        onOpen: onOpenModalImage,
        onClose: onCloseModalImage,
    } = useDisclosure();

    const {
        isOpen: isOpenModalPO,
        onOpen: onOpenModalPO,
        onClose: onCloseModalPO,
    } = useDisclosure();


    let userToken = (localStorage.getItem('tokek'));

    // get order header
    const [deliveryOrderDetail, setDeliveryOrderDetail] = useState([])
    const getDeliveryOrderDetail = () => {
        Axios.get(API_URL + `/order/get_order_real/${order_id_by_params}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        }).then((res) => {
            setDeliveryOrderDetail(res.data);
        }).catch((err) => {
            console.log("data.OrderDelivery.ERROR", err)
        })
    }

    const checkTrackOrder = () => {
        Axios.get(API_URL + `/searates/checkdata/${order_id_by_params}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        })
    }

    const { spc_condition } = useSelector((state) => {
        return {
            spc_condition: state.userReducer.spc_condition
        }
    });


    const [orderHeader, setOrderHeader] = useState([])

    const getOrderHeader = () => {
        Axios.get(API_URL + `/order/get_header_special/${order_id_by_params}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        }).then((res) => {
            setOrderHeader(res.data.packet);

        }).catch((err) => {
            console.log("error Axios getOrderHeader", err)
        })
    }




    // const [order_id, setOrder_id] = useState(230019501003);



    const toast = useToast();
    // get order details
    const [orderDetails, setOrderDetails] = useState([])
    const getOrderDetails = () => {

        Axios.get(API_URL + `/order/get_order_detail/${order_id_by_params}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        }).then((res) => {
            setOrderDetails(res.data);
            console.log("res,data", res.data)
        }).catch((err) => {
            console.log("error Axios getOrderDetail", err)
        })
    }



    useEffect(() => {
        getOrderHeader()
        getOrderDetails()
    }, [])
    const [inputText, setInputText] = useState('');


    const [selectedValue, setSelectedValue] = useState('');


    const handleInputChange = (event) => {
        setInputText(event.target.value);
    };

    const [soid, setSoid] = useState()
    const [containerName, setContainerName] = useState("")
    const getDataContainer = (number, so_id) => {
        setContainerName(number);
        setSoid(so_id)
        onOpenTrackingOrder();
    }




    const [orderid, setorderid] = useState();
    const cancelRemark = selectedValue.concat(' ', inputText);
    const patchCancelRemark = () => {
        Axios.patch(API_URL + "/order/cancel", { cancelRemark, order_id: order_id_by_params }, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        }).then((res) => {
            if (res.data.success) {
                toast({
                    title: "Yeay!",
                    description: res.data.message,
                    status: "warning",
                    duration: 6000,
                    isClosable: true,
                });
                onCloseCancelOrder();
                navigate("/e-order/transaction");
            } else if (!res.data.success) {
                toast({
                    title: "Oopsie!",
                    description: res.data.message,
                    status: "error",
                    duration: 6000,
                    isClosable: true,
                });

            }
        })
            .catch((err) => {
                console.log("Axios error when changing account status", err);
            });
    }

    // ====================================================== PRINT ORDERS ======================================================




    const printOrderDetails = (headerOrderId) => {
        let count = 0;

        return orderDetails.map((details, idx) => {
            if (details.order_id === headerOrderId) {
                count++;
                return (

                    <div key={idx} className="card-body border border_radius_10px shadow shadow-sm my-2">
                        <div className="row">
                            <div className={details.bulk === 1 ? 'col-12 d-none' : 'col-12 d-flex justify-content-center'}>
                                <div className="fs-6">
                                    {details.container_name === "Truck" ?
                                        `Flavour `
                                        :
                                        `Container `}
                                    {count}

                                </div>
                            </div>
                        </div>

                        <div className="row my-1">
                            <div className="col-6 d-flex">
                                <div className="grey_text_bold fs-6">
                                    {/* Item */}
                                </div>
                            </div>

                            <div className="col-6 d-flex justify-content-center">
                                <div className="grey_text_bold fs-6">
                                    Total Cartons
                                </div>
                            </div>
                        </div>

                        <div className="row pb-1">
                            <div className="col-5  col-sm-3 d-flex justify-content-center">
                                <Image
                                    className="d-flex  gambarproduk justify-content-center p-3 ms-lg-4 ms-md-0"
                                    src={details.url_1}
                                    boxSize=""
                                    width="100%"
                                    maxWidth="130"
                                    maxHeight="131"
                                    fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                                />
                            </div>

                            <div className="col-5 ratakiri red_text_bold my-4 fs-6">
                                <div className='d-flex row'>
                                    {details.product_name_1}
                                </div>

                                <div className="d-flex row text-muted">
                                    {details.prod_sku_1}
                                </div>
                            </div>



                            <div className="col-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                {!details.qty1 ? 0 : details.qty1.toLocaleString()}
                            </div>
                        </div>

                        {details.qty2 > 0 && (
                            <div className="row pb-1">
                                <div className="col-5  col-sm-3 d-flex justify-content-center">
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

                                <div className="col-5   ratakiri red_text_bold my-4 fs-6">
                                    <div className='d-flex row'>
                                        {details.product_name_2}
                                    </div>

                                    <div className="d-flex row text-muted">
                                        {details.prod_sku_2}
                                    </div>
                                </div>



                                <div className="col-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                    {!details.qty2 ? 0 : details.qty2.toLocaleString()}
                                </div>
                            </div>
                        )}

                        {details.qty3 > 0 && (
                            <div className="row pb-1">
                                <div className="col-5  col-sm-3 d-flex justify-content-center">
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

                                <div className="col-5   ratakiri red_text_bold my-4 fs-6">
                                    <div className='d-flex row'>
                                        {details.product_name_3}
                                    </div>

                                    <div className="d-flex row text-muted">
                                        {details.prod_sku_3}
                                    </div>
                                </div>



                                <div className="col-2 d-flex justify-content-center grey_text_bold my-4 fs-6">
                                    {!details.qty3 ? 0 : details.qty3.toLocaleString()}
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-12 d-flex">
                                <span className='grey_text_bold fs-6'>
                                    Remarks:&nbsp;
                                </span>
                                <span className="grey_text fs-6">
                                    {!details.remarks ? "-" : details.remarks}
                                </span>
                            </div>
                        </div>


                    </div>
                );
            }
        })
    }

    const printOrderHeader = () => {
        return orderHeader.map((header, idx) => {
            const fileUrl = API_URL + header.po_url;
            const lowerUrl = header.po_url.toLowerCase();

            // Check if the URL ends with a PDF extension
            const isPdf = lowerUrl.endsWith('.pdf');
            const isExcel = lowerUrl.endsWith('.xlsx');

            // Check for common image extensions (png, jpg, jpeg, gif)
            const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);
            return (
                <div key={idx}>{
                    String(header.order_id) === String(order_id_by_params) ?


                        <div className="card-body border border_radius_10px justify-content-end shadow shadow-sm mt-3">
                            <div className="row">

                                <div className="col-12 col-md-6 d-flex mt-1">
                                    <span className='grey_text_bold fs-6 text-start'>
                                        Stuffing Week:&nbsp;
                                    </span>

                                    <span className="grey_text fs-6 text-start">
                                        {header.delv_week_desc}

                                    </span>
                                </div>
                                {/* <div className="col-12 col-md-2  justify-content-end">
                                <div className="border border_radius_10px py-1 me-1 px-2 white_text_bold fs-6 grey_background ">
                                    {`${header.cont_qty} x ${header.container_name}`}
                                </div>
                            </div> */}
                                <div className="col-12 col-md-6 d-flex justify-content-end">

                                    <div className="border border_radius_10px py-1 me-1 px-3 px-md-2 white_text_bold fs-6 grey_background">
                                        {`${header.cont_qty} x ${header.container_name}`}
                                    </div>


                                    {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
                                        <div className="border border_radius_10px px-4  me-2 py-1 white_text_bold fs-6 yellow_background">
                                            {header.status_name}
                                        </div>
                                        :
                                        header.is_status === 4 ?
                                            <div className="border border_radius_10px px-2 me-2 py-1 white_text_bold fs-6 green_background">
                                                {header.status_name}
                                            </div>
                                            :
                                            header.is_status === 66 ?
                                                <div className="border border_radius_10px px-2 me-2 py-1 white_text_bold fs-6 green_background">
                                                    {header.status_name}
                                                </div>
                                                :
                                                <div className="border border_radius_10px px-2 me-2 py-1 white_text_bold fs-6 red_background">
                                                    {header.status_name}
                                                </div>
                                    }
                                    {header.is_status === 3 && header.container_name !== "Truck" ?
                                        <div className=" border_radius_10px px-4  me-2 py-1 fs-6 btn btn-outline-warning"
                                            onClick={async () => {
                                                await getDeliveryOrderDetail();
                                                await setorderid(header.order_id);
                                                await onOpenTrackOrder();
                                                await checkTrackOrder();
                                            }}
                                        >
                                            Track Order
                                        </div>

                                        :
                                        ""
                                    }
                                    {header.is_status === 1 || header.is_status === 66 ?
                                        <Menu>
                                            <MenuButton as={IconButton} size='sm' icon={<BsThreeDotsVertical size={20} />}

                                            />
                                            <MenuList>



                                                <MenuItem
                                                    onClick=
                                                    {
                                                        onOpenCancelOrder
                                                    }
                                                >Cancel</MenuItem>

                                            </MenuList>
                                        </Menu>
                                        :
                                        ""
                                    }
                                </div>
                            </div>

                            <div className="row my-2">
                                <div className="border-bottom border-secondary"></div>
                            </div>

                            <div className="row">
                                {/* <div className="col-6">
                                    <div className="row">
                                        <div className="col-4 d-flex grey_text_bold fs-6">
                                        PO Number:
                                    </div>

                                    <div className="col-8 d-flex grey_text fs-6">
                                        {Math.floor(Math.random() * 1000000)}
                                    </div>
                                    </div>
                                </div> */}

                                <div className='col-6'>
                                    <div className="row text-start">
                                        <div className="col-4 d-flex text-start grey_text_bold fs-6">
                                            PO
                                        </div>

                                        <div className="col-8  grey_text fs-6">
                                            {header.po_buyer}
                                        </div>
                                    </div>
                                </div>

                                <div className='col-6'>


                                    <div className="row">
                                        {/* <div className="col-4 d-flex grey_text_bold fs-6">
                                        Creation Date:
                                    </div>

                                    <div className="col-8 d-flex grey_text fs-6">

                                    </div> */}
                                        <div className="col-4 d-flex grey_text_bold fs-6 text-start">
                                            OrderID
                                        </div>

                                        <div className="col-8 d-flex grey_text fs-6">
                                            {header.order_id}
                                        </div>
                                    </div>

                                </div>




                                <div className="col-6">
                                    <div className="row">
                                        <div className="col-4 d-flex grey_text_bold fs-6 text-start">
                                            {header.container_name === "Truck" ?
                                                `Dest`
                                                :
                                                `Port`}

                                        </div>

                                        <div className="col-8 d-flex grey_text fs-6 text-start">
                                            {header.container_name === "Truck" ?
                                                `${header.final_dest}`
                                                :
                                                `${header.port_shipment}`}

                                        </div>
                                    </div>
                                </div>



                                <div className="col-6">

                                    <div className="row">
                                        <div className="col-4 d-md-flex grey_text_bold fs-6 text-start d-none">
                                            Submitted By
                                        </div>

                                        <div className="col-8 d-flex grey_text fs-6 text-start">
                                            {header.created_by}
                                        </div>
                                    </div>                                </div>



                                <div className="col-6">

                                    <div className="row">
                                        {/* <div className="col-4 d-flex grey_text_bold fs-6">
                                        Creation Date:
                                    </div>

                                    <div className="col-8 d-flex grey_text fs-6">

                                    </div> */}
                                        <div className="col-4 col-md-4 d-flex grey_text_bold fs-6 align-items-center text-start">
                                            <div className="position-absolute">
                                                PO Date
                                            </div>
                                        </div>

                                        <div className="col-7 d-flex grey_text fs-6">

                                            {!header.created_date ?
                                                ""
                                                :
                                                header.created_date
                                            }

                                        </div>
                                    </div>
                                </div>
                                <Modal
                                    // initialFocusRef={initialRefConfirm}
                                    isOpen={isOpenModalImage}
                                    onClose={onCloseModalImage}
                                    motionPreset="slideInBottom"
                                    size="xl"
                                >
                                    <ModalOverlay>
                                        <ModalContent>
                                            <ModalHeader>Preview</ModalHeader>
                                            <ModalCloseButton onClick={onCloseModalImage} />
                                            <ModalBody>


                                                {isImage && (
                                                    <Image src={fileUrl} className="mb-2" alt="Document" />
                                                )}

                                                {isPdf && (
                                                    <>
                                                        <Button>

                                                        </Button>
                                                        <PdfViewer file={fileUrl} style={{ width: '100%' }} />
                                                    </>
                                                )}
                                                {isExcel && (
                                                    <ExcelPreview fileUrl={fileUrl} />
                                                )}
                                                {!isPdf && !isImage && !isExcel && (
                                                    <p>Unsupported file format, only image (.jpg), pdf, or excel (.xlsx)</p>
                                                )}



                                            </ModalBody>

                                        </ModalContent>
                                    </ModalOverlay>
                                </Modal>

                                <Modal
                                    // initialFocusRef={initialRefConfirm}
                                    isOpen={isOpenModalPO}
                                    onClose={onCloseModalPO}
                                    motionPreset="slideInBottom"
                                >
                                    <ModalOverlay>
                                        <ModalContent maxW="900px">
                                            <ModalHeader>Preview</ModalHeader>
                                            <ModalCloseButton onClick={onCloseModalPO} />
                                            <ModalBody>


                                                <IndofoodPO order_id_by_child={order_id_by_params} />



                                            </ModalBody>

                                        </ModalContent>
                                    </ModalOverlay>
                                </Modal>

                                <div className="col-6">

                                    <div className="row">
                                        {/* <div className="col-4 d-flex grey_text_bold fs-6">
                                        Creation Date:
                                    </div>

                                    <div className="col-8 d-flex grey_text fs-6">

                                    </div> */}
                                        <div className="col-4 col-md-4 d-flex grey_text_bold fs-6 align-items-center text-start">
                                            <div className="position-absolute">
                                                PO File
                                            </div>
                                        </div>

                                        <div className="col-7 d-flex grey_text fs-6">

                                            {header.po_url && (header.po_url.trim() !== "" || header.po_url !== " ") ?

                                                <div className="col-7  d-flex justify-content-start align-items-center "
                                                    onClick={() => onOpenModalImage()}
                                                >
                                                    <Tooltip label="Click file icon to preview">
                                                        <div className='d-flex align-items-center '>
                                                            <span className="grey_text fs-6  pointer px-0">
                                                                <AiFillFile size={15} />
                                                            </span>
                                                            <span className='ps-2'>
                                                                Document
                                                            </span>
                                                        </div>
                                                    </Tooltip>
                                                </div>
                                                :
                                                <div className="col-12 col-md-6 d-flex pointer justify-content-start align-items-center"
                                                    onClick={() => onOpenModalPO()}
                                                >

                                                    <span className="grey_text_bold fs-6 pointer">
                                                        <Tooltip label="Click file icon to preview">
                                                            <div className='d-flex align-items-center '>
                                                                <span className="grey_text fs-6  pointer px-0">
                                                                    <AiFillFile size={15} />
                                                                </span>
                                                                <span className='ps-2'>
                                                                    Document
                                                                </span>
                                                            </div>
                                                        </Tooltip>
                                                    </span>
                                                </div>
                                            }

                                        </div>
                                    </div>
                                </div>

                                <div className="col-6">

                                    <div className="row d-none d-md-flex">
                                        <div className="col-4 d-flex grey_text_bold fs-6 text-start">
                                            Ship to Party
                                        </div>

                                        <div className="col-8 d-flex text-start grey_text fs-6">
                                            {header.company_name}
                                        </div>
                                    </div>
                                </div>


                                {header.bill_to_name &&
                                    <>
                                        <div className='col-6'>

                                        </div>
                                        <div className='col-6'>

                                            <div className="row">
                                                <div className="col-4 d-md-flex grey_text_bold fs-6 text-start d-none">
                                                    Bill To
                                                </div>

                                                <div className="col-8 d-flex grey_text fs-6 text-start">
                                                    {header.bill_to_name}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                }

                                {header.notify1_name &&
                                    <>

                                        <div className='col-6'>

                                            <div className="row">
                                                <div className="col-4 d-md-flex grey_text_bold fs-6 text-start d-none">
                                                    Notify Party 1st
                                                </div>

                                                <div className="col-8 d-flex grey_text fs-6 text-start">
                                                    {header.notify1_name}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                }

                                {
                                    header.notify2_name &&
                                    <>

                                        <div className='col-6'>

                                            <div className="row">
                                                <div className="col-4 d-md-flex grey_text_bold fs-6 text-start d-none">
                                                    Notify Party 2nd
                                                </div>

                                                <div className="col-8 d-flex grey_text fs-6 text-start">
                                                    {header.notify2_name}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                }

                                {
                                    orderDetails?.[0]?.so_id != null &&
                                    [2, 3, 4, 66].includes(header?.is_status) &&
                                    !pc_condition?.includes(12) &&
                                    <>
                                        {header.notify1_name && !header.notify2_name ?
                                            <div className='col-6'>
                                            </div>
                                            :
                                            null
                                        }
                                        <div className="col-6">

                                            <div className="row mt-1">
                                                <div className="col-12 d-md-flex grey_text_bold fs-6 text-start d-none">
                                                    <Button
                                                        size="sm"
                                                        colorScheme="green"
                                                        onClick={() => window.open(`https://www.indofoodinternational.com/iod/jsp/report/reportOutput.jsp?report_name=proforma_invoice&client_id=${orderDetails[0].company_id}&so_id=${orderDetails[0].so_id} `, "_blank")}
                                                    >
                                                        <FaFile className='me-2' /> PROFORMA INVOICE
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>

                                }



                                <div className="col-12 d-block d-md-none border-top">
                                    <div className="row">
                                        <div className="col-6 d-flex grey_text_bold fs-6 text-start">
                                            Ship to Party
                                        </div>

                                        <div className="col-6 d-flex text-start grey_text fs-6">
                                            {header.company_name}
                                        </div>

                                        <div className="col-6 d-md-none grey_text_bold fs-6 text-start d-flex">
                                            Submitted By
                                        </div>

                                        <div className="col-6 d-flex grey_text fs-6 text-start">
                                            {header.created_by}
                                        </div>

                                        {orderDetails?.[0]?.so_id &&
                                            <div className="col-12 my-2 justify-content-end d-flex d-md-none grey_text_bold fs-6 text-start ">
                                                <Button
                                                    size="sm"
                                                    colorScheme="green"
                                                    onClick={() => window.open(`https://www.indofoodinternational.com/iod/jsp/report/reportOutput.jsp?report_name=proforma_invoice&client_id=${orderDetails[0].company_id}&so_id=${orderDetails[0].so_id} `, "_blank")}
                                                >
                                                    <FaFile className='me-2' /> PROFORMA INVOICE
                                                </Button>
                                            </div>
                                        }

                                    </div>
                                </div>
                            </div>

                            {printOrderDetails(header.order_id)}

                        </div >
                        :
                        null

                }</div>
            )
        }
        )
    }

    // ==========================================================================================================================

    // track order modal
    const {
        isOpen: isOpenTrackOrder,
        onOpen: onOpenTrackOrder,
        onClose: onCloseTrackOrder
    } = useDisclosure();

    const {
        isOpen: isOpenCancelOrder,
        onOpen: onOpenCancelOrder,
        onClose: onCloseCancelOrder
    } = useDisclosure();


    const {
        isOpen: isOpenTrackingOrder,
        onOpen: onOpenTrackingOrder,
        onClose: onCloseTrackingOrder
    } = useDisclosure();

    // ==========================================================================================================================
    const steps = [
        { title: 'Submitted', description: 'Your order has been succesfully submited' },
        { title: 'On Process', description: 'Your order currently being processed by Indofood' },
        {
            title: 'On Delivery',
            description: (
                <>
                    Your order is on its way to the port destination
                    <table className='table table-sm border' style={{ fontSize: "10px" }}>
                        <tr className=' text-light' style={{ backgroundColor: "#505050" }}>
                            <th className='ps-2'>
                                Container ID
                            </th>
                            <th className='px-2'>
                                Flavour
                            </th>
                            <th className='px-2'>

                                Qty

                            </th>

                            <th className='px-2'>
                                ETD
                            </th>
                            <th className='px-2'>
                                ETA
                            </th>
                            <th className='px-2'>
                                Delv Date
                            </th>
                        </tr>

                        {console.log("deliveryOrderDetail", deliveryOrderDetail)}

                        {
                            deliveryOrderDetail.map((order, idx) => {
                                const cleanedData = (order.cont_id || "").replace(/-/g, "").trim();
                                console.log("cleanedData", cleanedData)
                                return (
                                    <>

                                        <tr key={idx}>
                                            <td className='align-top'>
                                                <a className=" link-opacity-100-hover text-primary link-underline link-underline-opacity-100 py-0 px-1 w-100 my-1 mx-1"
                                                    // href={`https://sirius.searates.com/tracking?container=${order.cont_id}&sealine=ONEY`}
                                                    width="100%"
                                                    height="600px"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => {
                                                        getDataContainer(cleanedData, order.so_id);
                                                    }}
                                                >
                                                    {
                                                        !order.cont_id ? "" :
                                                            cleanedData
                                                    }
                                                </a>
                                            </td>

                                            <td className='align-center ps-2'>{order.product_name}</td> {/* Render data from orderDetails */}
                                            <td className='align-center px-2'> {!order.qty ? 0 : order.qty.toLocaleString()}</td> {/* Render more data from orderDetails */}



                                            <td className='px-2 align-center'>{
                                                !order.etd ? ""
                                                    :
                                                    (order.etd)}
                                            </td>

                                            <td className='px-2 align-center'>{!order.eta ? ""
                                                : (order.eta)}
                                            </td>


                                            <td className='align-center ps-2'>
                                                {order.delv_date}
                                            </td>
                                        </tr>

                                    </>
                                )
                            }



                            )
                        }

                    </table >
                </>
            )
        },


    ].reverse();

    const { activeStep } = useSteps({
        index: 0,
        count: steps.length,
    })


    const { TOP } = useData();
    const [top, setTop] = React.useState([]);

    React.useEffect(() => {
        setTop(TOP);
        // if (TOP.length > 0) {
        //     setLoading(false);
        // }
    }, [TOP])

    return (
        <div>

            {/* <head>
                <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'self'; connect-src 'self' https://sirius.searates.com;"
                />
            </head> */}

            {/* <SeaRatesSecurity /> */}
            {/* navbar */}

            <div>
                <div className='py-5 mt-2 stick-left'>
                    <div className='row'>
                        <div className='col-6 col-sm-12'>
                        </div>
                        <div className='col-6 col-sm-12'>
                            <Sidebar />
                        </div>

                    </div>
                </div>

                <div className="py-5">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4">

                            <div className="col-12 d-flex  pt-1 pb-3">
                                <span
                                    onClick={() => navigate("/e-order/dashboard")}
                                    className="pointer grey_text_normal_20px">
                                    e-order &nbsp;
                                </span>
                                <span
                                    onClick={() => navigate("/e-order/transaction")}
                                    className="pointer grey_text_normal_20px">
                                    / Transaction List
                                </span>
                                <span className="grey_text_20px">
                                    &nbsp;/ Details
                                </span>


                            </div>

                            {printOrderHeader()}

                            {/* ON DELIVERY EXAMPLE */}
                            <Modal
                                isOpen={isOpenCancelOrder}
                                onClose={onCloseCancelOrder}
                            >
                                <ModalOverlay />
                                <ModalContent maxW="900px" >
                                    <ModalCloseButton />
                                    <div className="text-danger px-3 py-3">
                                        <div className="col-12 d-flex justify-content-center">
                                            <h1 className="fs-2 fw-bold" > Cancel Order </h1>
                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            <BsFillXCircleFill style={{ fontSize: "4vw", }} />
                                        </div>
                                        <div className="col-12 mb-2 d-flex justify-content-center ">
                                            <h3 className="fs-5"> Reason for cancellation : </h3>
                                        </div>
                                        <div className="row px-5">
                                            <RadioGroup value={selectedValue} onChange={(value) => setSelectedValue(value)}>
                                                <Stack>
                                                    <Radio colorscheme='red' value='I want to change the order details and create a new order.'>
                                                        I want to change the order details and create a new order.
                                                    </Radio>
                                                    <Radio colorscheme='red' value='I placed duplicate order.'>
                                                        I placed duplicate order.
                                                    </Radio>
                                                    <div className="row">
                                                        <div className="col-1 d-flex align-items-center">
                                                            <Radio colorscheme='red' value='Others,'>
                                                            </Radio>
                                                        </div>
                                                        <div className="col-2 px-0 d-flex align-items-center">
                                                            Others :
                                                        </div>
                                                        <div className='col-8 px-0'>
                                                            <input
                                                                value={inputText}
                                                                onChange={handleInputChange}
                                                                disabled={selectedValue !== 'Others,'} className="form-control form-red" />
                                                        </div>

                                                    </div>
                                                </Stack>
                                            </RadioGroup>
                                            <div className="col-12 mt-4 d-flex justify-content-center">
                                                <div className={`btn btn-danger px-4 border_radius_10px ${selectedValue ? " " : " disabled"}`}
                                                    onClick={() => { patchCancelRemark() }}


                                                >
                                                    Confirm
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ModalContent>
                            </Modal>


                            <Modal isOpen={isOpenTrackOrder} onClose={onCloseTrackOrder} size='xl'>
                                <ModalOverlay />
                                <ModalContent maxW="630px">
                                    <ModalCloseButton />

                                    <div className='grey_text_20px d-flex justify-content-center py-2'>
                                        Order Status Details
                                    </div>

                                    <hr />

                                    <div className='mb-5'></div>

                                    <div className='row px-3 d-flex justify-content-center'>
                                        {/* <Image
                                            className=''
                                            src={require('../assets/images/order_status_details_icons.png')}
                                            fallbackSrc={require('../assets/images/order_status_details_icons.png')}
                                            width='87%'
                                        /> */}



                                        <div className='col-2 d-flex justify-content-center  '>
                                            <div className='h-100 w-100 position-relative  s d-flex justify-content-center bottom-0'>
                                                <Image src="/image/orderconfirmed.svg" alt="Logo" />
                                            </div>
                                        </div>

                                        {TOP.due_days === "22"
                                            &&

                                            <div className='col-2 d-flex justify-content-center  '>
                                                <div className='h-100 w-100 position-relative  s d-flex justify-content-center bottom-0'>
                                                    <Image src="/image/waitingforpayment.svg" alt="Logo" />

                                                </div>
                                            </div>
                                        }
                                        <div className='col-2 d-flex justify-content-center  '>
                                            <div className='h-100 w-100 position-relative  s d-flex justify-content-center bottom-0'>
                                                <Image src="/image/onprocess.svg" alt="Logo" />
                                            </div>
                                        </div>

                                        <div className='col-2 d-flex justify-content-center  '>
                                            <div className='h-100 w-100 position-relative  s d-flex justify-content-center bottom-0'>
                                                <Image src="/image/ondelivery.svg" alt="Logo" />
                                            </div>
                                        </div>



                                        <div className="col-2 d-flex justify-content-center  ">
                                            <div className="h-100 bottom-0 w-100 position-relative  s d-flex justify-content-center align-items-center" style={{ position: "relative" }}>
                                                <Image src="/image/delivered.svg" alt="Logo" />
                                            </div>
                                        </div>


                                        <div className="col-2 d-flex justify-content-center  ">
                                            <div className="h-100 bottom-0 w-100 position-relative  s d-flex justify-content-center align-items-center" style={{ position: "relative" }}>
                                                <Image src="/image/completed.svg" alt="Logo" />
                                            </div>
                                        </div>


                                    </div>

                                    <hr className='red_hr' />

                                    <div className='row px-3  d-flex justify-content-center'>


                                        <div className='col-2 d-flex justify-content-center'>
                                            <BsFillCheckCircleFill className='color_red' />
                                        </div>
                                        {TOP.due_days === "0" &&
                                            <div className='col-2 d-flex justify-content-center'>
                                                <BsFillCheckCircleFill className='color_red' />
                                            </div>
                                        }
                                        <div className='col-2 d-flex justify-content-center'>
                                            <BsFillCheckCircleFill className='color_red' />
                                        </div>

                                        <div className='col-2 d-flex justify-content-center'>
                                            <BsFillCheckCircleFill className='color_red' />
                                        </div>

                                        <div className='col-2 d-flex justify-content-center'>
                                            <BsCircle className='color_red' />
                                        </div>
                                        <div className='col-2 d-flex justify-content-center'>
                                            <BsCircle className='color_red' />
                                        </div>

                                    </div>

                                    <div className='row  px-3 d-flex justify-content-center' >


                                        <div className='col-2 d-flex justify-content-center ratatengah light_red_text_10px_normal'>
                                            Order Confirmed
                                        </div>

                                        {TOP.due_days === "0" &&
                                            <div className='col-2 d-flex justify-content-center ratatengah light_red_text_10px_normal'>
                                                Waiting for Payment
                                            </div>
                                        }
                                        <div className='col-2 d-flex justify-content-center light_red_text_10px_normal'>
                                            On Process
                                        </div>

                                        <div className='col-2 d-flex justify-content-center light_red_text_10px_normal'>
                                            Delivering
                                        </div>

                                        <div className='col-2 d-flex justify-content-center light_red_text_10px_normal'>
                                            Delivered
                                        </div>

                                        <div className='col-2 d-flex justify-content-center light_red_text_10px_normal'>
                                            Completed
                                        </div>

                                    </div>

                                    <hr />
                                    <div className="container px-4 ">
                                        <div className="px-3">
                                            <Stepper
                                                index={activeStep}
                                                orientation='vertical'
                                                gap='1'
                                                size='xs'
                                                colorscheme='red'
                                            >
                                                {steps.map((step, index) => (
                                                    <Step key={index}>
                                                        <StepIndicator  >
                                                            <StepStatus
                                                                active={
                                                                    <Box
                                                                        bg="red.500"
                                                                        borderWidth="5px"
                                                                        borderRadius="full"
                                                                        borderColor="red.500"
                                                                        width="8px"
                                                                        height="8px"
                                                                    />
                                                                }
                                                            />
                                                        </StepIndicator>
                                                        <Box flexShrink='1' >
                                                            <StepTitle>{step.title}</StepTitle>
                                                            <StepDescription>{step.description}</StepDescription>
                                                        </Box>
                                                        <StepSeparator borderColor="gray.300" />
                                                    </Step>
                                                ))}
                                            </Stepper>
                                        </div>
                                    </div>



                                </ModalContent>
                            </Modal>


                            <Modal isOpen={isOpenTrackingOrder} onClose={onCloseTrackingOrder}>
                                <ModalOverlay />
                                <ModalContent
                                    className="py-0 px-0 "
                                    maxW="90vw" maxH="80vh"
                                    height="100%"
                                    style={{ overflow: "hidden", borderRadius: "15px" }}
                                >
                                    <ModalBody className="px-0 py-0">
                                        <iframe
                                            src={`https://www.indofoodinternational.com/e-order/containertracking/${containerName}/${soid}`}
                                            title="My Iframe"
                                            width="100%"
                                            height="100%"
                                            style={{ border: "none" }}
                                            overflow="hidden"
                                        />
                                    </ModalBody>


                                </ModalContent>
                            </Modal>

                        </div>
                    </div>
                </div>
            </div>


        </div>

    )
}

export default OrderDetailPage;