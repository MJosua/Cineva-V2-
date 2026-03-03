import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    let userToken = localStorage.getItem("tokek");
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
                                                {fAQData
                                                    .sort((b, a) => a.created_date.localeCompare(b.created_date))
                                                    .map((item) => (

                                                        <div className="col-12 mt-3 " key={item.id}>
                                                            <div className="card border_radius_10px shadow card px-3 py-2">
                                                                <div className="row mb-3">
                                                                    <div className=" col-12 text-start mb-3">
                                                                        <div className="row">
                                                                            <div className="col-6 ">
                                                                                {item.created_date}
                                                                            </div>
                                                                            <div className="col-6  d-flex justify-content-end ">
                                                                                {item.uid}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="col-3  d-flex justify-content-center">
                                                                        <a href={API_URL + "/image" + item.img_url} target="blank">
                                                                            <Image
                                                                                crossOrigin="anonymous"
                                                                                className="d-flex justify-content-center ps-3 pt-2"
                                                                                src={API_URL + "/image" + item.img_url}
                                                                                width="150px"
                                                                                height="150px"

                                                                            />
                                                                        </a>
                                                                    </div>
                                                                    <div className="col-9 text-start" >
                                                                        <div className="fs-3 fw-bold">
                                                                            {item.title}
                                                                        </div>
                                                                        <div className="fs-5">
                                                                            {item.feedback}
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </div>

                                                    ))}
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