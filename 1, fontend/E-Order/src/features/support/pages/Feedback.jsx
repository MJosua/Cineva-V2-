import React from 'react';
import {
    Image,
    Textarea, useToast
} from '@chakra-ui/react';


import { useLocation } from "react-router-dom"

import { useNavigate } from 'react-router-dom';

import Axios from 'axios'
import { API_URL } from '../../../config';

import { seasonOut } from '../../../action/userAction';

import Sidebar from "../../../components/layout/Sidebar.jsx";


const ContactUsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();
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
    let userToken = localStorage.getItem('tokek')

    const [image, setImage] = React.useState(null);
    const [title, setTitle] = React.useState('');
    const [feedback, setFeedback] = React.useState('');
    const [imageSizeLimit, setImageSizeLimit] = React.useState(true);

    /*
        const handleFiles = (event) => {
            setImage(event.target.files[0])
    
        }
    */

    const fileInputRef = React.useRef();

    const onSubmit = async () => {

        if (title === '' || feedback === '') {
            toast({
                title: "Oopsie!",
                description: 'Title and feedback form should not be empty',
                status: "warning",
                duration: 6000,
                isClosable: true,
            });
        } else {

            const data = new FormData();
            data.append('image', image);
            data.append('data', JSON.stringify({ title, feedback }));



            Axios.post(
                API_URL + "/user/feedback/", data, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                }
            }
            )
                .then((res) => {
                    // console.log("res", res);

                    toast({
                        title: "Yeay!",
                        description: 'Thanks for your feedback',
                        status: "success",
                        duration: 6000,
                        isClosable: true,
                    });
                    navigate('/e-order/help/')

                })
                .catch((err) => {
                    // console.log("Axios error when change password", err);
                    seasonOut();
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
                                            &nbsp;/ Feedback
                                        </span>
                                    </div>
                                </div>

                                <div className="card shadow mt-4 px-3 py-4 text-secondary  border_radius_10px">
                                    You can give us any advice and report any bug that may appear here.
                                    Any feedback are very important for our further development

                                    <div className="col-12 ">

                                        <div className="row px-5 mt-4 pb-2">
                                            <div className="col-12 col-md-2 text-md-end text-start ps-2 fw-bold">
                                                Title/Feature
                                            </div>

                                            <div className="col-10">
                                                <input
                                                    className="form-control shadow-sm border_radius_10px"
                                                    type="text"
                                                    onChange={(e) => setTitle(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="row px-5 mt-4">

                                            <div className="col-12 col-md-2 text-md-end text-start ps-2 fw-bold">
                                                Feedback
                                            </div>

                                            <div className="col-10">

                                                <Textarea

                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    // style={{ fontStyle: "italic" }}
                                                    className='shadow-sm border'
                                                />
                                                <span>
                                                    please explain your feedback clearly
                                                </span>
                                            </div>
                                        </div>

                                        <div className="row px-5 mt-4 pb-2">
                                            <div className="col-12 col-md-2 text-md-end text-start ps-2 fw-bold">
                                                Image
                                                <br></br>
                                                <div style={{ fontSize: "10px" }}>
                                                    JPG / PNG only
                                                </div>
                                            </div>

                                            <div className="col-10">
                                                <input
                                                    className="form-control shadow-sm border_radius_10px"
                                                    type="file"
                                                    accept=".jpg, .jpeg, .png"
                                                    ref={fileInputRef}
                                                    onChange={(event) => setImage(event.target.files[0])}
                                                />
                                            </div>
                                        </div>

                                        <div className="row ps-5 mt-3 mb-5">
                                            <div className="col-2 text-start ps-5">

                                            </div>

                                            <div className="col-9 d-flex justify-content-start">
                                                <btn
                                                    className="btn btn-danger rounded-35 px-5 fw-bold pb-2"
                                                    onClick={onSubmit}>
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





