import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineSearch } from "react-icons/ai";

import { HiPencil } from "react-icons/hi";

import { FaTrashAlt } from "react-icons/fa";
import {
    Image,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Button,
    IconButton,
    FormLabel,
    Input,
    visuallyHiddenStyle
} from '@chakra-ui/react';

import Sidebar from "../components/Sidebar";
import SearchBarComponent from '../components/SearchBarComponent';

import { logoutAction } from '../action/userAction'

import Axios from "axios"
import { API_URL } from "../config"

import {
    FiSettings
} from 'react-icons/fi';


import { useDispatch, useSelector } from 'react-redux';

const ProfilePage = (state) => {

    // ================================================ CLEAR SESSION STORAGE ==================================================



    // ==========================================================================================================================

    //redux

    //=========

    const navigate = useNavigate();
    const [profileData, setProfileData] = React.useState([]);

    // let userData = localStorage.getItem('hots_tokek');
    // let user = JSON.parse(userData);
    // let company_id = user[0].company_id;
    // let profile = profileData[0]
    // let userID = user[0].user_id;


    // let userID = user_id;

    let userToken = (localStorage.getItem('hots_tokek'));

    // console.log("user", user)

    // let basicProfile = user[0]
    // console.log(profile.company_name)

    // console.log("userData", basicProfile)
    // console.log("user", user)
    // console.log("user_id", userID)
    // console.log(profileData[0].company_name)

    //get profile data from back end
    const getProfileData = () => {
        Axios.get(API_URL + "/user/profile", {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        })
            .then((res) => {
                setProfileData(res.data);
                // console.log("data profile dari Axios", res.data)
                if (!res.success && res.message == 'error_auth') {
                }
            }).catch((err) => {
                console.log("Ërror get files at axios", err)

            })
    }

    //trigger function to get data (the trigger come from refresh page)
    React.useEffect(() => {
        getProfileData()
    }, [])



    const [search, setSearch] = useState("");



    return (
        <div>
            {/* navbar */}
            <SearchBarComponent />

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

                    <div className=" col-md-11 mt-3 padding_start_custom ">
                        <div className="pb-5 pt-4 ratakiri">
                            <div className="row mb-2">
                                <div className="col-3">
                                    <h3>News</h3>
                                </div>
                                <div className="col-9 ratakanan ">
                                    <div className="row">
                                        <div className="col-6">

                                        </div>
                                        <div className="col-4 ">
                                            <form className="d-flex pt-1">
                                                <Input
                                                    size="sm"
                                                    className="form-control grey_text fs-6 shadow border1_radius_5px"
                                                    type="search"
                                                    placeholder="Key Word"
                                                    onChange={(event) => setSearch(event.target.value)}
                                                />
                                                <AiOutlineSearch
                                                    className="color_red pt-1 ps-1 pe-1 shadow  border2_radius_5px pointer"
                                                    size={30}
                                                />
                                            </form>
                                        </div>
                                        <div className="col-2">
                                            <button className="btn btn-danger" onClick={() => navigate('/blog/addnew')}>
                                                Add New
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div >



                                <div className="col-12 text-secondary">
                                    <div className="card border_radius_10px shadow mb-3 py-2 px-2">
                                        <div className="row">

                                            <div className="col-9">
                                                <div className="col-12">
                                                    <span className="fw-bold fs-5">Judul |</span> <span className="fw-lighter fst-italic">tanggal</span>
                                                </div>
                                                Lorem ipsum dolor sit amet
                                            </div>
                                            <div className="col-3">
                                                <div className="row">
                                                    <div className="col-10 d-flex justify-content-end">
                                                        <Image

                                                            className="d-flex justify-content-center border_radius_10px"
                                                            src="/image/etriapurba2.jpg"
                                                            boxSize=""
                                                            height="135px"
                                                            width="135px"

                                                            fallbackSrc="/image/emptyplate.PNG"
                                                        />
                                                    </div>
                                                    <div className="col-2 px-0 py-0 pt-5">
                                                    <div className="d-flex justify-content-center">
                                                        <div className="btn shadow pointer rounded-35 py-1 px-1 bg-light text_merah  mb-2 d-flex justify-content-center">
                                                            <HiPencil size={16} />
                                                        </div>
                                                        </div>
                                                        <div className="d-flex justify-content-center">
                                                            <div className="btn shadow pointer rounded-35 py-1 px-1 bg-light text_merah mb-2 ">
                                                                <FaTrashAlt size={15} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="col-12 text-secondary">
                                    <div className="card border_radius_10px shadow mb-3 py-2 px-2">
                                        <div className="row">

                                            <div className="col-9">
                                                <div className="col-12">
                                                    <span className="fw-bold fs-5">Judul |</span> <span className="fw-lighter fst-italic">tanggal</span>
                                                </div>
                                                Lorem ipsum dolor sit amet
                                            </div>
                                            <div className="col-3">
                                                <div className="row">
                                                    <div className="col-10 d-flex justify-content-end">
                                                        <Image

                                                            className="d-flex justify-content-center border_radius_10px"
                                                            src="/image/etriapurba2.jpg"
                                                            boxSize=""
                                                            height="135px"
                                                            width="135px"

                                                            fallbackSrc="/image/emptyplate.PNG"
                                                        />
                                                    </div>
                                                    <div className="col-2 px-0 py-0 pt-5">
                                                    <div className="d-flex justify-content-center">
                                                        <div className="btn shadow pointer rounded-35 py-1 px-1 bg-light text_merah  mb-2 d-flex justify-content-center">
                                                            <HiPencil size={16} />
                                                        </div>
                                                        </div>
                                                        <div className="d-flex justify-content-center">
                                                            <div className="btn shadow pointer rounded-35 py-1 px-1 bg-light text_merah mb-2 ">
                                                                <FaTrashAlt size={15} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>

    )
}


export default ProfilePage;
