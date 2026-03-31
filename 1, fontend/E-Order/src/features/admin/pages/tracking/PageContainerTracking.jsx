import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";


import { useDispatch } from "react-redux";

import { API_URL } from "../../../../config";

//Styling
import {
    Select,
    Input,
    Spinner,
    useToast,
    Tooltip,
    Modal,
    useDisclosure,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Image,
} from "@chakra-ui/react";


import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";

import { BiDetail } from "react-icons/bi";
import SearchBarComponent from "../../../../components/inputs/SearchBarComponent.jsx";
import Sidebar from "../../../../components/layout/Sidebar.jsx";
import ContainerTracking from "./ContainerTracking";

function PageContainerTracking({ admin }) {


    const navigate = useNavigate();







    return (
        <div >
            <SearchBarComponent />

            <div className="pb-3 me-4 ms-1">
                <div className="py-5 mt-2 stick-left">
                    <div className="row ">
                        <div className="col-6 col-sm-12"></div>
                        <div className="col-6 col-sm-12">
                            <Sidebar />
                        </div>
                    </div>
                </div>

                <div className="py-5">
                    {/* CONTENT BELOW */}
                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4 ">
                            <div className="row text-secondary pb-3 user-select-none">

                                <div className="col-12 d-flex  pt-1 ">
                                    <span
                                        onClick={() => navigate("/e-order/dashboard")}
                                        style={{ fontSize: "20px" }}
                                        className="pointer">
                                        Admin
                                    </span>

                                    <span className="grey_text_20px">
                                        &nbsp;/ Container Tracking
                                    </span>
                                </div>
                            </div>

                            <div className="mb-2 d-flex justify-content-start  ">

                                <div className="container-fluid ">
                                    <div className="row" >

                                        <div
                                            className="col-12 px-0 vw-100"
                                            style={{
                                                height: "100vh",      // Limit to viewport height
                                                maxHeight: "100vh",   // Also enforce max
                                                overflow: "hidden",    // Enable scroll if content exceeds height
                                            }}
                                        >
                                            <ContainerTracking admin={admin} />
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PageContainerTracking






