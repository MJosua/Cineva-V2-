import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    loginMiddleware
} from "../action/userAction"
import {
    useDispatch
} from "react-redux"

import { useLocation } from "react-router-dom"

import Header from "../components/header";

//Styling
import {
    Text,
    Image,
    useToast,
    Spinner

} from "@chakra-ui/react";

import {
    AiOutlineEye,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import NavbarPreLogin from "../components/NavbarPreLogin";
import Axios from "axios";

import { API_URL } from "../config";



const ForgotPasswordPage = () => {

    const params = useParams();
    let token1 = params.token

    const toast = useToast();
    const navigate = useNavigate();


    // const [valid, setValid] = React.useState(false);

    const [pswd, setpswd] = React.useState('');
    const [pswd2, setpswd2] = React.useState('');

    const [valid, setValid] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [done, setDone] = React.useState(false);

    const location = useLocation();
    const [visible, setVisible] = React.useState('password');
    const [visible2, setVisible2] = React.useState('password');

    //mask and unmask password
    const onVisibility = () => {
        if (visible === "password") {
            setVisible("text")
        } else if (visible === "text") {
            setVisible("password")
        }
    }

    const onVisibility2 = () => {
        if (visible2 === "password") {
            setVisible2("text")
        } else if (visible2 === "text") {
            setVisible2("password")
        }
    }

    const onChecker = async () => {
        await Axios.get(
            API_URL + "/auth/verify-token", {
            headers: {
                Authorization: `Bearer ${token1}`,
            },
        }
        )
            .then((res) => {
                if (res.data.success) {
                    setValid(true);
                    setLoading(false);

                    console.log("true");
                } else {
                    setValid(true);
                    console.log("false");
                    setLoading(true);

                }
            })
            .catch((err) => {
                setValid(false);
                setLoading(false);

                // console.log("Error", err);
            });
    }

    useEffect(() => {
        onChecker();
    }, []);

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
    //         // onLogin(userID, pswd)
    //     }
    // }

    // real login.
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

    const changePass = () => {
        if (pswd === "" || pswd2 === "") {
            toast({
                title: "Error!",
                description: ` Password is empty!`,
                status: "error",
                duration: 6000, //in second
                isClosable: true
            })

        } else if (pswd.length < 8) {
            toast({
                title: "Error!",
                description: ` Password need to be 8 character minimum!`,
                status: "error",
                duration: 6000, //in second
                isClosable: true
            })


        } else if (pswd !== pswd2) {
            toast({
                title: "Error!",
                description: ` One of The Password is incorrect!`,
                status: "error",
                duration: 6000, //in second
                isClosable: true
            })


        } else {
            Axios.post(
                API_URL + "/auth/change_pass_forgot", { pswd }, {
                headers: {
                    Authorization: `Bearer ${token1}`,
                },
            }
            )
                .then((res) => {
                    toast({
                        title: "Yeay!",
                        description: `Hore!`,
                        status: "success",
                        duration: 6000, //in second
                        isClosable: true
                    })
                    setDone(true);
                })
                .catch((err) => {
                    toast({
                        title: "Error!",
                        description: `Something error in the sky!`,
                        status: "error",
                        duration: 6000, //in second
                        isClosable: true
                    })
                });

        }
    }

    return (
        <div >

            <div className="backgroundloginpageMobile">

                <div className="row p-0 m-0 h-100 pt-5 ">
                    <div id="" className="col-12  p-4 pt-5  d-flex justify-content-center align-items-center" >

                        <div className=" ">
                            {
                                !loading ?
                                    (
                                        valid === true ?
                                            (
                                                !done ?
                                                    (
                                                        <div className=" form-login opacity-0  w-100 p-sm-3 ">

                                                            <div className="">

                                                                <Text
                                                                    fontSize='2vw'
                                                                    className="d-flex text-center justify-content-center text-muted fw-bold mt-3"
                                                                >
                                                                    Change Password
                                                                </Text>


                                                                <form autocomplete="off" method="post">
                                                                    <div className="input-group 
                                                            border 
                                                            border-secondary 
                                                            border-radius 
                                                            d-flex
                                                            "
                                                                    >
                                                                        <input type={visible}
                                                                            className="border  
                                                border-secondary    
                                                border-radius  form-control background-putih pt-3 pb-3                                           
                                                    "
                                                                            placeholder="New Password "
                                                                            id="password"
                                                                            onChange={((e) => setpswd(e.target.value))}
                                                                            autocomplete="false" name="hidden"
                                                                        />
                                                                        <span
                                                                            onClick={onVisibility}
                                                                            className="input-group-text 
                                                    bg-white
                                                    border-black 
                                                    border-2  
                                                    px-3
                                                    border-radius
                                                    "
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

                                                                    <div className="
                                                                    input-group 
                                                            border 
                                                            border-secondary 
                                                            border-radius 
                                                            d-flex
                                                            mt-2
                                                            mb-2
                                                            "
                                                                    >
                                                                        <input type={visible2}
                                                                            className="
                                                                            border  
                                                border-secondary    
                                                border-radius  form-control background-putih pt-3 pb-3                                           
                                                    "
                                                                            placeholder="Confirm New Password "
                                                                            id="password"
                                                                            onChange={((e) => setpswd2(e.target.value))}
                                                                            autocomplete="false" name="hidden"
                                                                        />
                                                                        <span
                                                                            onClick={onVisibility2}
                                                                            className="input-group-text 
                                                    bg-white
                                                    border-black 
                                                    border-2  
                                                    px-3
                                                    border-radius
                                                    "
                                                                            id="basicaddon2">
                                                                            {
                                                                                visible2 === "password"
                                                                                    ?
                                                                                    <AiOutlineEyeInvisible size={26} />
                                                                                    :
                                                                                    <AiOutlineEye size={26} />
                                                                            }
                                                                        </span>
                                                                    </div>


                                                                    <button
                                                                        className="
                                                                        btn 
                                             btn-danger
                                             btn-radius
                                             fw-bold
                                             border_radius_10px
                                             shadow w-100"
                                                                        type="button"
                                                                        onClick={changePass}
                                                                    >
                                                                        CHANGE
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    )
                                                    :
                                                    <>
                                                        <div className="fs-4 fw-bold mb-5">
                                                            Your change password process is done

                                                        </div>
                                                        <div className="btn btn-danger"
                                                            onClick={() => navigate("/e-order/login")}
                                                        >
                                                            Back to Login Page

                                                        </div>
                                                    </>
                                            )

                                            :
                                            (

                                                <>
                                                    <div className="fs-4 fw-bold mb-5 shadowtext">
                                                        Your Forget Password URL is seems to be expired.
                                                        <br></br>
                                                        Please try to fill forget password form again.
                                                    </div>
                                                    <div className="btn btn-danger"
                                                        onClick={() => navigate("/e-order/login")}
                                                    >
                                                        Back to Login Page

                                                    </div>
                                                </>
                                            )

                                    )

                                    :
                                    (
                                        <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center align-items-center row pt-5">
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
                            }
                        </div>
                    </div>




                </div>
            </div>

        </div>
    )
}

export default ForgotPasswordPage; 