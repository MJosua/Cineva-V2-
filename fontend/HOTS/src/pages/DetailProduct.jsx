import React from "react";

import {
    Text,
    Box,
    Image,
    Stack,
    StackDivider
} from "@chakra-ui/react"
import { CiLocationOn } from 'react-icons/ci'

import DeliverToComponent from "../components/DeliverToComponent";

import {
    useSelector, useDispatch
} from 'react-redux'

import Axios from "axios";

import { API_URL } from "../config";

import {
    useLocation,
    useNavigate
} from 'react-router-dom';

const DetailProduct = () => {

    // const useEffect() = React.useEffect
    // const [port, setPort] = React.useState('false');

    const [detail, setDetail] = React.useState(null);
    const [cont20ft, setCont20ft] = React.useState("20");
    const [cont40ft, setCont40ft] = React.useState("40");
    const [cont40hc, setCont40hc] = React.useState("40HC");

    const location = useLocation();
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


    const { state, search } = useLocation();

    const navigate = useNavigate();

    const { getCountry_id } = useSelector(({ userReducer }) => {
        return {
            getCountry_id: userReducer.country_id,
        }
    })

    // console.log("console.log: state", state);
    // console.log("console.log: search", search);

    // console.log("cont20ft", cont20ft);
    // console.log("cont40ft", cont40ft);
    // console.log("cont40hc", cont40hc);

    // const getDetail = () => {
    //     // console.log("res.data di a",res.data)

    //     Axios.get(API_URL + `/product${search}`)

    //         .then((res) => {

    //             console.log("res.data di axios DetailProduct", res.data)
    //             setDetail(res.data[0]);

    //         }).catch((err) => {

    //             console.log("error Axios di DetailProduct.jsx", err)

    //         })
    // }

    // React.useEffect(() => {
    //     getDetail()
    // }, []);

    const onPlaceOrder = () => {
        localStorage.setItem("temporaryCart", JSON.stringify(state))
        navigate("/e-order/order")
        // console.log("isi state ", state)
    }

    return (

        <div className="py-5 container ps-lg-4" >
            <DeliverToComponent />
            <div className="pt-5 mb-4">
                <div className="row">
                    <div className="col-12 col-md-4 col-lg-4 px-lg-4 ps-lg-4 ps-md-4 display-font-sizes" >
                        {/* JUST MAKE COL LG AND MD SMALLER */}

                        {/* IMAGE, NAME, EST. PRICE, AMD CURRENCY */}
                        <div className=" row border mb-1 mt-lg-5 mt-md-5">
                            <div className="col-12 p-3 ">

                                <Image
                                    key={state.product_code}
                                    className="d-flex justify-content-center p-1 ps-3 pt-2"
                                    src={`/${state.img}`}
                                    boxSize=''
                                    alt={state.product_code}
                                    width='95%'
                                    height='100px'
                                    fallbackSrc={require("../assets/images/emptyplate.PNG")}
                                />
                            </div>

                            <Stack
                                id=""
                                divider={<StackDivider />}
                                mb='2'
                                spacing='2'
                                className="p-2 pb-1  
                                d-block d-sm-none
                                " >
                                {/* added d-block d-sm-none to hide on small screen */}

                                <span className=" d-flex justify-content-start px-2"
                                    id="MI_INSTAN_INDOMIE_GR_RASA_AYAM"
                                >
                                    {state.product_name}
                                </span>

                                <Box className="row justify-content-start pt-1">
                                    <Text
                                        className="col-3 priceColor"
                                    >
                                        Est.Price
                                    </Text>
                                    <Text className="col-3 fw-bold priceColor">
                                        {state.price === null ? "CALL! " : state.price + " " + state.rate_unit}
                                    </Text>
                                </Box>
                            </Stack>
                        </div>
                    </div>
                    <div className="col-12  col-md-8 col-lg-8 px-lg-4 px-md-3 bg-white">

                        <div className="d-none d-sm-block d-md-block d-lg-block ">
                            {/* this things only appear on small screen. this also just added */}
                            <span className=" px-2 d-flex "
                                id="MI_INSTAN_INDOMIE_GR_RASA_AYAM"
                            >
                                {state.product_name}
                            </span>

                            <Box className="d-flex justify-content-start pt-1 ps-2 pb-2">
                                <Text
                                    className=" priceColor"
                                >
                                    Est.Price
                                </Text>
                                <Text className=" fw-bold priceColor ps-4">
                                    {state.price === null ? "CALL! " : state.price + " " + state.rate_unit}
                                </Text>
                            </Box>
                        </div>

                        <div className="row py-2 bg-white  mb-5 ">
                            {/* shadow just removed */}

                            {/* <Text className="col-12 d-flex fw-bold text-muted pt-2 ps-3 ">
                        Select Container Size
                        </Text>
                        <div className="col-12  ">
                        <div className="  d-flex justify-content-evenly px-1 my-2">
                            <div className="col-4 p-1">
                                <button className=" py-2 btn btn-outline-secondary shadow w-100"
                                    autocomplete='off'
                                    onChange={(e) => setCont20ft(e.target.value)}
                                >
                                    20  ft
                                </button>
                            </div>
                            <div className="col-4 p-1">
                                <button className=" py-2 btn btn-outline-secondary shadow w-100 "
                                    autocomplete='off'
                                    onChange={(e) => setCont40ft(e.target.value)}
                                >
                                    40  ft
                                </button>
                            </div>
                            <div className="col-4 p-1">
                                <button className=" py-2 btn btn-outline-secondary shadow w-100"
                                    autocomplete='off'
                                    onChange={(e) => setCont40hc(e.target.value)}
                                >
                                    40 HC
                                </button>
                            </div>
                        </div>
                       </div> */}

                            {/* <div className="p-3 mb-5"> */}
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex text-mobile-catalog"><span>Brand</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span className="fw-bold">{state.brand_name}</span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex  text-mobile-catalog"><span>Product SKU</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.product_sku}</span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex  text-mobile-catalog"><span>Net Weight/pack</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.net_weight === 0 || null ? "CALL !" : state.net_weight + 'gr'}</span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex  text-mobile-catalog "><span>Qty per Carton</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.per_carton === 0 || null ? "CALL" : state.per_carton} pcs</span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex  text-mobile-catalog"><span>Min. Order</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.moq === 0 || null ? "CALL" : state.moq} carton</span></span>
                            </div>
                            <br />
                            <div className="row pt-3" >
                                <span className="col-12 fw-bold text-muted d-flex  text-mobile-catalog"><span>Max. Container Load</span></span>
                                {/* <span className="col-6 text-muted d-flex"><span>85gr</span></span> */}
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex justify-content-center  text-mobile-catalog"><span>20 ft</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.cont20} carton</span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex justify-content-center  text-mobile-catalog"><span>40 ft</span></span>
                                <span className="col-6 text-muted d-flex  text-mobile-catalog"><span>{state.cont40} carton </span></span>
                            </div>
                            <div className="row " >
                                <span className="col-6 fw-bold text-muted d-flex  text-mobile-catalog justify-content-center"><span>40 HC</span></span>
                                <span className="col-6 text-muted  text-mobile-catalog d-flex"><span>{state.cont40hc} carton</span></span>
                            </div>
                            {/* </div> */}
                            <div className="w-75 pt-3 d-none d-sm-block d-md-block d-lg-block ">
                                <button
                                    className="btn btn-danger
                                      shadow w-100 py-2 fw-bold
                                     
                                      "
                                    onClick={onPlaceOrder}
                                >
                                    Place Order
                                </button>

                            </div>
                        </div>


                        <div className="row fixed-bottom  d-flex justify-content-evenly bg-white p-2 border d-block d-sm-none">
                            {/* <div className="col-6 ">
                              <button
                                  className="btn btn-outline-secondary 
                                  shadow w-100 py-3 fw-bold"
                              >
                                  Add to Cart
                              </button>
                            </div> */}

                            <div className="col-12  ">
                                <button
                                    className="btn btn-danger
                                      shadow w-100 py-2 fw-bold"
                                    onClick={onPlaceOrder}
                                >
                                    Place Order
                                </button>
                            </div>

                        </div>
                    </div>




                </div>

            </div>
        </div>
    )
}

export default DetailProduct;