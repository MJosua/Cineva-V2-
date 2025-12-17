import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import SearchBarComponent from "../../components/SearchBarComponent";
import Sidebar from "../../components/Sidebar";
import { clearSeasonStorage } from "../../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../../action/userAction";

import { useDispatch } from "react-redux";
import { API_URL } from "../../config";

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
} from "@chakra-ui/react";
import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";
import CreateAccount from "../../components/Admin/CreateAccount";

const AccountManagementPage = () => {

    const dispatch = useDispatch();

    const toast = useToast();


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
                                    <span
                                        onClick={() => navigate("/e-order/dashboard")}
                                        style={{ fontSize: "20px" }}
                                        className="pointer">
                                        &nbsp;/ Account Management
                                    </span>
                                    <span className="grey_text_20px">
                                        &nbsp;/ Create Account
                                    </span>
                                </div>
                            </div>
                            <div className="mb-2 d-flex justify-content-start  ">
                                <CreateAccount />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* </div> */}
        </div>
    )
}

export default AccountManagementPage; 