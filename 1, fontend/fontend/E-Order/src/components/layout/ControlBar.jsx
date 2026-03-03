import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    // AiOutlineHome,
    // AiOutlineSearch,
    // AiOutlineNotification,
    AiOutlineUser
} from 'react-icons/ai'
import {
    GoChecklist
} from 'react-icons/go'
import {
    BsFillPlusCircleFill
} from 'react-icons/bs';

import { HiClipboardDocumentList } from "react-icons/hi2";

// import { BsCartPlusFill } from 'react-icons/bs'
// import { AiOutlineBars } from 'react-icons/ai'
// import { CgProfile } from 'react-icons/cg'

const ControlBar = (props) => {

    // const { pathname } = window.location;
    const navigate = useNavigate();
    // const dispatch = useDispatch();

    const { username, transport } = useSelector((state) => {
        return {
            username: state.userReducer.username,
            transport: state.userReducer.transport,
        }
    });



    return (
        // <div className="container-fluid" >
        <div className=" d-block d-md-none">
            {
                username == !true ?
                    null
                    :
                    // <div className=" btn-group 
                    // h-2 
                    // fixed-bottom 
                    // bd-highlight 
                    // border-dark"
                    //     role="group"
                    //     aria-label="Basic outlined button group">
                    //     <button type="button"
                    //         className="btn   
                    //         btn-light  d-flex justify-content-center"
                    //         onClick={() => navigate('/home')}>
                    //         <AiOutlineBars size={30} />
                    //     </button>
                    //     <button type="button"
                    //         className="btn 
                    //         btn-primary d-flex justify-content-center"
                    //         onClick={() => navigate('/post/create')}>
                    //         < BiMessageSquareAdd size={30} />
                    //     </button>
                    //     <button type="button"
                    //         className="btn 
                    //         btn-light d-flex d-flex justify-content-center"
                    //         onClick={() => navigate('/profile')}>
                    //         <AiOutlineUser size={30} />
                    //     </button>
                    // </div>
                    <div className="container-fluid fixed-bottom   ">
                        <div className="row bg-danger border-top">

                            <div className="col-4">
                                <button type="button"
                                    className="col-12 btn btn-danger d-flex justify-content-center rounded-0"
                                    onClick={() => navigate('/e-order/transaction')}
                                >
                                    {/* <AiOutlineBars size={35} className='my-2' /> */}
                                    <GoChecklist
                                        className="fs-1"
                                    />
                                </button>
                            </div>

                            <div className="col-4 ">
                                <button type="button"
                                    className="col-12 btn btn-danger d-flex justify-content-center rounded-0"
                                    onClick={() => {
                                        navigate
                                            (
                                                transport === 1 || transport === 3 ?
                                                    "/e-order/order?mode=Container"
                                                    :
                                                    transport === 2 ?
                                                        "/e-order/order?mode=Trucking"
                                                        :
                                                        "/e-order/dashboard"
                                            );

                                    }}
                                    >
                                    {/* <CgProfile size={35} className='my-2' /> */}

                                    {/* THIS IS FROM UI UX DEV */}
                                    {/* CHECK App.css to configure */}
                                    <BsFillPlusCircleFill className="fs-1" />




                                </button>
                            </div>

                            <div className="col-4  ">
                                <button type="button"
                                    className=" col-12 btn btn-danger d-flex justify-content-center rounded-0"
                                    onClick={() => navigate('/e-order/cart')}>
                                    {/* <CgProfile size={35} className='my-2' /> */}

                                    {/* THIS IS FROM UI UX DEV */}
                                    {/* CHECK App.css to configure */}
                                    <HiClipboardDocumentList className="fs-1" />

                                </button>
                            </div>
                        </div>
                    </div>

            }
        </div >
        // </div>
    )
}

export default ControlBar; 



