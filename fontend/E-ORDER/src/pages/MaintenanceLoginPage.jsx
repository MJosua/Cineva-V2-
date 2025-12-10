import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
// import axios from "axios";
import {
    // loginAction,
    loginMiddleware
} from "../action/userAction"
import {
    useDispatch
    //, useSelector 
} from "react-redux"
// import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import Axios from "axios"
import { API_URL } from "../config"

import { useLocation } from "react-router-dom"

import { FaGears } from "react-icons/fa6";
//Styling
import {
    Text,
    Image,
    // Heading,
    Input,
    InputGroup,
    // InputRightElement,
    Spinner,
    Textarea,
    Button,
    useToast,
    FormLabel,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
} from "@chakra-ui/react";

import NavbarPreLogin from "../components/NavbarPreLogin";

import {
    AiOutlineEye,
    AiOutlineEyeInvisible
} from 'react-icons/ai'


const MaintenanceLoginPage = () => {

    const toast = useToast();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const {
        isOpen: isOpenModalForgot,
        onOpen: onOpenModalForgot,
        onClose: onCloseModalForgot,
    } = useDisclosure();

    const [userID, setUserID] = React.useState('');
    const [pswd, setpswd] = React.useState('');
    const [uid, setUid] = React.useState('');

    const [visible, setVisible] = React.useState('password');


    //mask and unmask password
    const onVisibility = () => {
        if (visible === "password") {
            setVisible("text")
        } else if (visible === "text") {
            setVisible("password")
        }
    }

    // real login.
    const onLogin = async (event, userID, pswd) => {
        event.preventDefault()
        if (userID === "" || pswd === "") {
            toast({
                title: "Error!",
                description: `UserID or Password is empty!`,
                status: "error",
                duration: 6000, //in second
                isClosable: true
            })

        } else if (userID !== "" && pswd !== "") {

            let res = await dispatch(loginMiddleware(userID, pswd));

            if (res && !res.success) {
                toast({
                    title: "Oopsie!",
                    description: `${res.message}`,
                    status: "error",
                    duration: 6000, //in second
                    isClosable: true
                })
                // console.log("isi payload jika gagal", res.data)
            } else if (res && res.success) {
                toast({
                    title: `${res.message}`,
                    description: `Log-in success `,
                    status: "success",
                    duration: 6000, //in second
                    isClosable: true,
                    className: "pb-5"
                })



                navigate('/e-order/dashboard', { replace: true });

            }
        }
    }

    function clearCacheAndReload() {
        if (window.location.reload) {
            // Prompt the user to clear their cache
            if (window.confirm("This option will send the reset link to your email, please open the link with incognito, press 'ok' to confirm? ")) {
                // Attempt to clear cache using the following method
                window.location.reload(true);
            }
        }

    }

    const onForgotPassword = (event) => {
        event.preventDefault()
        if (uid === '' || !uid || uid === undefined) {
            toast({
                title: "Oopsie!",
                description: `User ID can't be empty! `,
                status: "warning",
                duration: 6000, //in second
                isClosable: true
            })
        } else {

            Axios.post(
                API_URL + "/auth/forgot/", { uid }
            )
                .then((res) => {
                    console.log("res", res);
                    if (!res.data.success) {

                        toast({
                            title: "Oopsiee!",
                            description: res.data.message,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: "Check your email!",
                            description: res.data.message,
                            status: "success",
                            duration: 6000,
                            isClosable: true,
                        });
                        // navigate('/e-order/help/')
                        clearCacheAndReload()
                    }

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
            // }


        }
    }

  

    const [loading, setLoading] = React.useState(true);

    setTimeout(() => {
      setLoading(false);
    }, 60000);

    return (
        <div className=" backgroundloginpageMobile  mt-5 mt-md-0  ">
            <Header />
            <div className=" vh-100">


                <div className=
                    {
                        "row p-0 m-0 h-100 d-flex"
                        
                    }
                >
                    <div
                        className="col-12 d-none d-md-flex  col-md-6  d-flex justify-content-center align-items-center"
                    >
                        <img
                            // id="welcome"
                            className=" gambar  gambar-depan "
                            src='/image/login_pic.png'
                            alt='content'

                        />

                    </div>
                    <div id="" className="col-12 col-md-6  d-flex align-items-md-center align-items-top justify-content-center" >
                        <div className="Row w-75">

                            <div className="col-12 col-md-0 mt-5 d-flex justify-content-center text-align-center">
                                <img
                                    // id="welcome"
                                    className=" gambar d-block d-md-none  gambar-depan "
                                    src='/image/login_pic.png'
                                    alt='content'

                                />
                            </div>

                            <div className="col-12 d-flex justify-content-center align-items-top ">
                                <div className="  w-100">

                                    <div className="  form-login  w-100   ">

                                        <div className="">
                                            <Text
                                                fontSize='2vw'
                                                className="d-flex justify-content-start text-muted fw-bold mt-3"
                                            >
                                                Sign In
                                            </Text>

                                            <form
                                                onSubmit={(event) => onLogin(event, userID, pswd)}
                                            >
                                                <div className=" mt-3 mb-4 input-group   border  border-secondary   border_radius_10px  d-flex ">

                                                    <input
                                                        type='text'
                                                        className="border border-secondary border_radius_10px form-control background-putih pt-3 pb-3"
                                                        id="username"
                                                        placeholder="UserID"
                                                        value={userID}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\/\:-_,.]/g, "");
                                                            setUserID(sanitizedValue);
                                                        }}
                                                    />
                                                </div>

                                                <div className="">

                                                    <div className="input-group border border_radius_10px border-secondary   d-flex  "
                                                    >
                                                        <input
                                                            type={visible}
                                                            className="border border-secondary border_radius_10px form-control background-putih pt-3 pb-3 "
                                                            placeholder="Password "
                                                            id="password"
                                                            onChange={((e) => setpswd(e.target.value))}
                                                        />
                                                        <span
                                                            onClick={onVisibility}
                                                            className="input-group-text bg-white border-secondary px-3 border-radius "
                                                            id="basicaddon2">
                                                            {
                                                                visible === "password"
                                                                    ?
                                                                    <AiOutlineEyeInvisible size={26} />
                                                                    :
                                                                    <AiOutlineEye size={26} />
                                                            }
                                                        </span>
                                                    </div>

                                                </div>


                                                <div className="col-12 d-flex justify-content-end mb-0"

                                                >

                                                    <Text
                                                        fontSize="sm"
                                                        className="text-muted btn btn-link"
                                                        onClick={() => {
                                                            onOpenModalForgot();
                                                        }}
                                                    >
                                                        Forgot Password ?
                                                    </Text>

                                                </div>
                                                <div className="col-12 d-flex justify-content-end">
                                                    <div className="col-12 ">
                                                        <button
                                                            className=" btn btn-danger border_radius_10px shadow w-100  "
                                                            style={{ marginTop: "-15px" }}
                                                            type="submit"

                                                        >
                                                            <Text className=" menutext_heavy button-login fw-bold "
                                                                fontSize={'17px'}
                                                            >
                                                                SIGN IN
                                                            </Text>

                                                        </button>
                                                    </div>
                                                </div>
                                            </form>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                

                <Modal

                    isOpen={isOpenModalForgot}
                    onClose={onCloseModalForgot}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader display="flex" justifyContent="center" className="text-muted">
                            Reset Password Form
                        </ModalHeader>
                        <ModalCloseButton />
                        <form
                            onSubmit={onForgotPassword}
                        >
                            <ModalBody pb={6}>
                                <div className="row">
                                    <div className="col-12 d-flex justify-content-center text-start px-3 text-muted fs-5 pb-2">
                                        Hi! Please insert User ID that you use for login.
                                        We will send you an email with a link to reset your password.
                                    </div>
                                    <div className="col-12 ">

                                        <div className="name_text py-2 ps-1">
                                            <Input
                                                placeholder="Input Your User ID Here"
                                                style={{ fontStyle: "italic" }}
                                                onChange={(e) => { setUid(e.target.value) }}
                                            />
                                        </div>
                                        {/* <div className="pt-2  d-flex justify-content-center"> */}

                                        {/* </div> */}


                                    </div>
                                </div>

                            </ModalBody>
                            <ModalFooter>
                                <button className="btn fw-bold btn-danger border_radius_10px px-5  "
                                    type="submit"
                                >
                                    SEND
                                </button>

                            </ModalFooter>
                        </form>
                    </ModalContent>
                </Modal>
            </div>
            {/* </div> */}

        </div>
    )
}

export default MaintenanceLoginPage 