import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/header.jsx";
// import axios from "axios";
import {
    // loginAction,
    loginMiddleware
} from "../state/userAction"
import {
    useDispatch
    //, useSelector 
} from "react-redux"
// import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import Axios from "axios"
import { API_URL } from "../../../config"

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

import NavbarPreLogin from "../../../components/layout/NavbarPreLogin.jsx";

import {
    AiOutlineEye,
    AiOutlineEyeInvisible
} from 'react-icons/ai'


const LoginPage = () => {

    const toast = useToast();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();

    const {
        isOpen: isOpenModalForgot,
        onOpen: onOpenModalForgot,
        onClose: onCloseModalForgot,
    } = useDisclosure();

    const {
        isOpen: isOpenModalCompany,
        onOpen: onOpenModalCompany,
        onClose: onCloseModalCompany,
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

    const [serverStatus, setServerStatus] = useState(false);
    const getServerStatus = () => {
        Axios.get(API_URL + "/auth/ping", { timeout: 60000 }) // setting a 5 seconds timeout= KECEPETAN COK
            .then((res) => {
                setServerStatus(res.data.status);
                setLoading(false)
            })
            .catch((err) => {
                setServerStatus(false)
            });
    };

    React.useEffect(() => {
        getServerStatus();
    }, [])

    const [loading, setLoading] = React.useState(true);

    setTimeout(() => {
        setLoading(false);
    }, 60000);

    const {
        isOpen: isOpenModalImage,
        onOpen: onOpenModalImage,
        onClose: onCloseModalImage,
    } = useDisclosure();



    // useEffect(() => {
    //     onOpenModalImage();
    // }, [])

    const dateNow = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div className=" backgroundloginpageMobile  mt-5 mt-md-0  ">
            <Header />
            <div className=" vh-100">


                <div className=
                    {
                        "row p-0 m-0 h-100 "
                        +
                        (serverStatus === true ? "d-flex" : " d-none ")
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
                                                    {/* <Text
                                                        fontSize="sm"
                                                        className="text-muted btn btn-link"
                                                        onClick={() => {
                                                            onOpenModalCompany();
                                                        }}
                                                    >
                                                        Company Program
                                                    </Text> */}
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

                <div className=
                    {
                        "row p-0 m-0 h-100 mb-5"
                        +
                        (serverStatus === true ? " d-none " : "d-flex")
                    }
                >
                    {loading ? (
                        <div className="  d-flex justify-content-center align-items-center row pt-5">
                            <Spinner
                                className="d-flex justify-content-center mt-5"
                                thickness="10px"
                                speed="0.65s"
                                emptyColor="gray.200"
                                color="blue.500"
                                size="xl"
                                spacing={4}
                            />
                            <Text
                                className="pb-5 fw-bold d-flex justify-content-center mt-0"
                                textAlign="center"
                                fontSize="6x2"
                            >
                                ~  Securing Login..... ~
                            </Text>
                        </div>
                    ) : (
                        <div className="col-12 vh-100 d-flex justify-content-center text-grey align-items-center my-3">
                            <div className="card border_radius_10px h-50 bg-white pb-5 ">
                                <div className="px-5 py-5 fs-1 fw-bold " >
                                    <div className="col-12">
                                        The server is currently under update
                                        <br></br>
                                        <span className="fs-3 ">the progress is nearly finish, please wait</span>
                                    </div>
                                    <div className="col-12 d-flex mt-2 justify-content-center ">
                                        <FaGears size="100px" />

                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                    }
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
                                        We will send you an email with a link to resetÂ yourÂ password.
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

                <Modal

                    isOpen={isOpenModalCompany}
                    onClose={onCloseModalCompany}
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader display="flex" justifyContent="center" className="text-muted">
                            Reset Password Form
                        </ModalHeader>
                        <ModalCloseButton />

                        <ModalBody pb={6}>
                            <div className="row">
                                <div className="col-12 d-flex justify-content-center text-start px-3 text-muted fs-5 pb-2">
                                    This button will sent you to the company program, are you sure ?
                                </div>

                            </div>

                        </ModalBody>
                        <ModalFooter>
                            <button className="btn fw-bold btn-danger border_radius_10px px-5  "
                                onClick={() => { navigate("/app/") }}
                            >
                                GO
                            </button>

                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
            {/* </div> */}
            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalImage}
                onClose={onCloseModalImage}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Update {dateNow()} </ModalHeader>
                        <ModalCloseButton onClick={onCloseModalImage} />
                        <ModalBody>

                        </ModalBody>

                    </ModalContent>
                </ModalOverlay>
            </Modal>
        </div>
    )
}

export default LoginPage;





