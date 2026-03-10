import React from 'react';


import { useLocation } from "react-router-dom"

import { useNavigate } from 'react-router-dom';
import Axios from 'axios'
import {
    Image,
    Textarea, useToast
} from '@chakra-ui/react';

import Sidebar from '../../../components/layout/Sidebar.jsx';

import { API_URL } from '../../../config';
const ContactUsPage = () => {
    const location = useLocation();
    let userToken = localStorage.getItem('tokek')
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
    const navigate = useNavigate();
    const toast = useToast();

    const [namaewa, setNamaewa] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [message, setMessage] = React.useState('');

    const onSubmit = async () => {

        if (namaewa === '' || message === '' || email === '') {
            toast({
                title: "Oopsie!",
                description: 'The form should not be empty',
                status: "warning",
                duration: 6000,
                isClosable: true,
            });
        } else {

            const data = new FormData();
            data.append('data', JSON.stringify({ namaewa, message, email }));



            Axios.post(
                API_URL + "/user/contact-us/", { namaewa, message, email }, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            },
            )
                .then((res) => {
                    // console.log("res", res);

                    toast({
                        title: "Yeay!",
                        description: 'Thanks for your Message',
                        status: "success",
                        duration: 6000,
                        isClosable: true,
                    });
                    navigate('/e-order/help/')

                })
                .catch((err) => {
                    // console.log("Axios error when change password", err);
                    toast({
                        title: "Oopsiee!",
                        description: 'Something bad just happend! Please try again!',
                        status: "error",
                        duration: 6000,
                        isClosable: true,
                    });
                });

            // console.log('formData', formData)
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

                <div className="py-5 w-100">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
                        <div className="pb-5 pt-4 ">
                            <div>
                                <div className="row user-select-none">

                                    <div className="col-12 text-secondary d-flex  pt-1 ps-4 ps-md-0">
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
                                            &nbsp;/ Contact Us
                                        </span>
                                    </div>
                                </div>
                                <div className="card shadow mt-4 px-3 py-4 text-secondary  border_radius_10px">
                                    If you have any questions or concerns regarding e-order, please feel free to reach out to us at
                                    <br>
                                    </br>
                                    <p className="fw-bold">international@icbp.indofood.co.id</p>
                                    <br>
                                    </br>
                                    Our Online Customer Service will be happy to review and respond to your email as quicklyÂ asÂ possible.
                                    <div className="col-12 ">

                                        <div className="row ps-5 mt-4">
                                            <div className="col-12  col-md-2 text-start ps-3 ps-md-5">
                                                Name
                                            </div>

                                            <div className="col-10 col-md-9">
                                                <input className="form-control shadow-sm border_radius_10px"
                                                    onChange={(e) => setNamaewa(e.target.value)}
                                                >

                                                </input>
                                            </div>
                                        </div>

                                        <div
                                            className="row ps-5 mt-4"
                                        >
                                            <div
                                                className="col-12  col-md-2 text-start ps-3 ps-md-5"
                                            >
                                                Email
                                            </div>

                                            <div className="col-10 col-md-9">
                                                <input className="form-control shadow-sm border_radius_10px"
                                                    onChange={(e) => setEmail(e.target.value)}
                                                >

                                                </input>
                                            </div>
                                        </div>

                                        <div className="row ps-5 mt-4">
                                            <div className="col-12  col-md-2 text-start ps-3 ps-md-5">
                                                Message
                                            </div>

                                            <div className="col-10 col-md-9">
                                                <input className="form-control shadow-sm border_radius_10px"
                                                    onChange={(e) => setMessage(e.target.value)}
                                                >

                                                </input>
                                            </div>
                                        </div>

                                        <div className="row ps-5 mt-3 mb-5">
                                            <div className="col-2 text-start ps-5">

                                            </div>

                                            <div className="col-9 d-flex justify-content-start">
                                                <btn className="btn btn-danger rounded-35 px-5 fw-bold pb-2"
                                                    onClick={onSubmit}
                                                >
                                                    Send
                                                </btn>
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

export default ContactUsPage;





