import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/layout/header.jsx";
// import axios from "axios";
import {
    // loginAction,
    loginMiddleware
} from "../../../action/userAction"
import {
    useDispatch
    //, useSelector 
} from "react-redux"
// import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import Axios from "axios"
import { API_URL, isServerReady } from "../../../config"

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
    // Button,
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


import {
    AiOutlineEye,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
// import LogoBar from "../../../pages/components/LogoBar";


const MaintenancePage = () => {

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

    // React.useEffect(() => {
    //     const listener = (e) => listenKey(e, userID, pswd)
    //     document.addEventListener('keydown', listener);

    //     return () => {
    //         document.removeEventListener('keydown', listener)
    //     };

    // }, [userID, pswd])

    // const listenKey = async (e, userID, pswd) => {
    //     let keyDown = e.keyCode

    //     // console.log("key", keyDown)
    //     if (keyDown === 13) {
    //         onLogin(userID, pswd)
    //     }
    // }

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

    // ─── Server Status from apiResolver ──────────────────────────────────────
    // resolveApiBase() already confirmed server health before React rendered.
    const [serverStatus, setServerStatus] = useState(isServerReady());


    return (
        <div className=" backgroundloginpageMobile  mt-5 mt-md-0  ">
            <Header />
            {/* <div className="d-block d-sm-none"> */}

            {/* <NavbarPreLogin /> */}
            <div className=" vh-100">




                <div className="col-12 vh-100 d-flex justify-content-center text-grey align-items-center">
                    <div className="card border_radius_10px h-50 bg-white">
                        <div className="px-5 py-5 fs-1 fw-bold">
                            <div className="col-12">
                                The server is currently under update
                                <br></br>
                                <span className="fs-3 ">the progress is nearly finish, please wait</span>
                            </div>
                            <div className="col-12 d-flex mt-2 justify-content-center ">
                                <FaGears size="150px" />

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
            </div>
            {/* </div> */}

        </div>
    )
}

export default MaintenancePage





