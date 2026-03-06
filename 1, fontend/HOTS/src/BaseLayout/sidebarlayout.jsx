import React from "react";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Axios from "axios";

import SearchBarComponent from "../../components/SearchBarComponent";


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
    Image,
} from "@chakra-ui/react";


import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";

import { BiDetail } from "react-icons/bi";
import Sidebar from "../../components/Sidebar";

function FeedbackAdmin() {


    const dispatch = useDispatch();
    let userToken = localStorage.getItem("hots_tokek");
    const navigate = useNavigate();



    const [loading, setLoading] = useState(true);
    const [fAQData, setFAQData] = useState([]);

    const getFAQData = async () => {
        // console.log("ada_kode")
        await Axios.get(API_URL + "/admin/feedback", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setFAQData(res.data.results);
                setLoading(false);
                // console.log("res.data", res.data.results);
            })
            .catch((err) => {
                console.log("Gagal");
            });
    };





    React.useEffect(() => {
        getFAQData();
    }, []);

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
                                        &nbsp;/ Feedback
                                    </span>
                                </div>
                            </div>
                            <div className="mb-2 d-flex justify-content-start  ">




                                {loading ?
                                    (
                                        <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center w-100 justify-content-center align-items-center row pt-5">
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
                                    )
                                    :
                                    <>
                                        <div className="container-fluid ">
                                            <div className="row">
                                                <Outlet />
                                            </div>
                                        </div>
                                    </>
                                }

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FeedbackAdmin
