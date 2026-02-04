import React from "react";
import { useNavigate } from 'react-router-dom';
import { BsShareFill, BsFileEarmarkFill } from "react-icons/bs";

import {
    Image,
    Select,
    Textarea,
    Button,
    IconButton,
    FormLabel,
    Input,
    visuallyHiddenStyle
} from '@chakra-ui/react';

import Sidebar from "../../../components/layout/Sidebar.jsx";

import SearchBarComponent from '../../../components/inputs/SearchBarComponent.jsx';

import { logoutAction } from '../../../action/userAction'

import Axios from "axios"
import { API_URL } from "../../../config"

import {
    FiSettings
} from 'react-icons/fi';


import { useDispatch, useSelector } from 'react-redux';

const ProfilePage = (state) => {


    const navigate = useNavigate();
    const [profileData, setProfileData] = React.useState([]);

    // let userData = localStorage.getItem('tokek');
    // let user = JSON.parse(userData);
    // let company_id = user[0].company_id;
    // let profile = profileData[0]
    // let userID = user[0].user_id;


    // let userID = user_id;

    let userToken = (localStorage.getItem('tokek'));

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
               // console.log("Ã‹rror get files at axios", err)

            })
    }

    //trigger function to get data (the trigger come from refresh page)
    React.useEffect(() => {
        getProfileData()
    }, [])


    //function for log out. the log out function on authAction
    const onLogOut = () => {
        return (
            logoutAction(),
            navigate('/e-order')
        )
    }

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
                        <div className="pb-5 pt-4 ratakiri ">
                            <div className="row mb-2 border-bottom">
                                <div className="col-2 pt-1 pb-2">
                                    <h4>[ post type ]</h4>

                                </div>

                                <div className="col-10 d-flex justify-content-end">
                                    <button className="btn btn-light border_radius_15px shadow-sm me-3 fw-bold px-4 py-2 mb-2 d-flex">
                                        Save As Draft
                                        <span className="mt-1 ms-2"> <BsFileEarmarkFill /> </span>
                                    </button>

                                    <button className="btn btn-danger border_radius_15px shadow fw-bold px-4 py-2 mb-2 d-flex">
                                        Publish
                                        <span className="mt-1 ms-2"> <BsShareFill /> </span>
                                    </button>
                                </div>
                            </div>

                            <div >
                                <div className="card shadow-sm mt-4">
                                    <div className="row mt-3">
                                        <div className="col-9 ">
                                            <div className="row mt-1 ">
                                                <div className="col-2  ps-4 pt-2 mt-1 d-flex justify-content-start">
                                                    Judul
                                                </div>
                                                <div className="col-10 ">
                                                    <Input
                                                        className='grey_text fs-6 my-2 '
                                                        type="text"
                                                        placeholder="Judul..."
                                                        size='sm'
                                                        borderRadius="10px"

                                                    />
                                                </div>



                                            </div>


                                            <div className="row mt-1 d-flex justify-content-start">
                                                <div className="col-2  ps-4 pt-2 mt-1">
                                                    Category
                                                </div>
                                                <div className="col-10 ">
                                                    <Select placeholder='Select option' className="fs-6  my-2">
                                                        <option value='option1'>Event</option>
                                                        <option value='option2'>News</option>
                                                       
                                                    </Select>
                                                </div>
                                                <div className="col-3">

                                                </div>


                                            </div>

                                            <div className="row mb-2 d-flex justify-content-start">
                                                <div className="col-2  ps-4 pt-2 mt-1 ">
                                                    Isi
                                                </div>
                                                <div className="col-10 ">
                                                    <Textarea
                                                        className='grey_text fs-6  my-2'
                                                        type="text"
                                                        placeholder="Isi"
                                                        size='sm'
                                                        height="200px"
                                                        borderRadius="10px"

                                                    />
                                                </div>


                                            </div>
                                        </div>

                                        <div className="col-3">
                                            <div className="col-12">
                                                <div className="row mt-1">

                                                    <div className="col-6 pe-0">
                                                    
                                                    <Input
                                                        className='grey_text fs-6 w-100'
                                                        type="text"
                                                        placeholder="Thumbnail..."
                                                        user-select="none"
                                                        borderRadius="10px 0px 0px 10px"

                                                    />
                                                    </div>
                                                    <div className="col-6 ms-0">
                                                        <button className="btn btn-dark border2_radius_10px ms-0" >
                                                            Upload
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12  px-2 mt-3">
                                                <Image

                                                    className="d-flex justify-content-center pe-2"
                                                    src={"../../../assets/images/banner3.jpeg"}
                                                    borderRadius="10px"
                                                    width='100%'
                                                    fallbackSrc={require("../../../assets/images/emptyplate.PNG")}
                                                />
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





