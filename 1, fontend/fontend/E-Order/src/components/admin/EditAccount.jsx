import React, { useEffect } from 'react';
import { useState } from "react";
import Axios from "axios";
import { API_URL } from "../../config";

import { seasonOut, logoutAction, loginAction } from "../../action/userAction";
import {
    Select,
    Input,
    Spinner,
    Text,
    useToast,
    Tooltip,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Image,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";
function EditAccount({
    userID,
    company_id,
    userDetails,
    employee_id,
    firstname,
    lastname,
    uid,
    usertype,
    pswd,
    email,
    telp,
    setUserID,
    setEmployee_id,
    setFirstname,
    setLastname,
    setUid,
    setUsertype,
    setEmail,
    setTelp,
    onCloseModalDetailEdit
}) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const toast = useToast();




    const UppercaseFirstAlphabet = ({ name }) => {
        const capitalizeFirstLetter = (str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        const uppercaseName = capitalizeFirstLetter(name);

        return <span>{uppercaseName}</span>;
    };
    let type_id = usertype;
   


    const handleEditButton = async () => {
    let userToken = localStorage.getItem("tokek");
    if (
            !userID

        ) {
            toast({
                title: "Oopsie!",
                description: "User ID Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else if (
            !employee_id
        ) {
            toast({
                title: "Oopsie!",
                description: "employee ID Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else if (
            !firstname
        ) {
            toast({
                title: "Oopsie!",
                description: "firstname Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else if (
            !uid
        ) {
            toast({
                title: "Oopsie!",
                description: "uid Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else if (
            !usertype
        ) {
            toast({
                title: "Oopsie!",
                description: "usertype Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else {
            await Axios.put(
                API_URL + "/admin/account",
                {
                    firstname,
                    lastname,
                    userID,
                    type_id,
                    employee_id,
                    uid,
                    email,
                    telp
                },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    },
                }
            )
                .then((res) => {
                    if (res.data.success) {
                        toast({
                            title: "Yeay!",
                            description: res.data.message,
                            status: "success",
                            duration: 6000,
                            isClosable: true,
                        });
                        onCloseModalDetailEdit();
                    } else if (!res.data.success) {
                        toast({
                            title: "Oopsie!",
                            description: res.data.message,
                            status: "error",
                            duration: 6000,
                            isClosable: true,
                        });
                    }
                })
                .catch((err) => {
                    toast({
                        title: "Oopsie!",
                        description: err.message,
                        status: "error",
                        duration: 6000,
                        isClosable: true,
                    });
                    // console.log("data")
                });
        }
    }

    return (
        <div >

            <div className="mb-2 ">

                <div className="row px-2">

                    {userDetails.map((val, idx) => (
                        <>




                            <div className="container">
                                <div className="row px-1 px-md-3 px-lg-3 d-flex justify-content-start mt-2">
                                    <div className="col-12 card-body border border_radius_10px">


                                        <div className="row px-2 mb-2">


                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-3 mt-2">
                                                First Name
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 col-md-8 mt-1 ps-4">
                                                <Tooltip
                                                    label=" 
                                                                    Nama depan dari user. jika distributor ya nama distributor
                                                                    "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        value={firstname}
                                                        size="sm"
                                                        onChange={(event) => setFirstname(event.target.value)}
                                                    />
                                                </Tooltip>
                                            </div>

                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-3 mt-2">
                                                Last Name
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 col-md-8 mt-1 ps-4">
                                                <Tooltip
                                                    label=" 
                                                                    nama belakang
                                                                    "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        value={lastname}
                                                        size="sm"
                                                        onChange={(event) => setLastname(event.target.value)}
                                                    />
                                                </Tooltip>
                                            </div>

                                        </div>



                                        <div className="row px-2 mb-2 ">


                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-3 mt-2">
                                                Email
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 col-md-8 mt-1 ps-4">
                                                <Tooltip
                                                    label=" 
                                                                    Email
                                                                    "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        value={email}
                                                        size="sm"
                                                        onChange={(event) => setEmail(event.target.value)}
                                                    />
                                                </Tooltip>
                                            </div>

                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-3 mt-2">
                                                Telp
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 col-md-8 mt-1 ps-4">
                                                <Tooltip
                                                    label=" 
                                                                   Telepon
                                                                    "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        value={telp}
                                                        size="sm"
                                                        onChange={(event) => setTelp(event.target.value)}
                                                    />
                                                </Tooltip>
                                            </div>

                                        </div>

                                        <div className="row px-2 mb-2">
                                            <div className="d-flex ratakiri grey_text_bold fs-6 col-md-3 col-5 pt-1">
                                                User Type
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="d-flex col-md-8 col-7 ps-4">
                                                <Select
                                                    className="grey_text fs-6"
                                                    size="sm"
                                                    value={usertype}
                                                    onChange={(event) => setUsertype(event.target.value)}
                                                >
                                                    <option value="-1">
                                                        Accoun Rank
                                                    </option>
                                                    <option value="3">
                                                        Distributor (Utama)
                                                    </option>
                                                    <option value="4">
                                                        Distributor (Employee)
                                                    </option>
                                                    <option value="8">
                                                        Admin News & Event
                                                    </option>
                                                    <option value="9">
                                                        Super Admin
                                                    </option>

                                                </Select>
                                            </div>




                                        </div>




                                    </div>

                                    <div className="card position-relative px-3 pt-4 pb-4 mt-4">
                                        <div className="position-absolute bg-secondary shadow px-4 text-light" style={{ top: "-10px" }}>
                                            Company Request
                                        </div>

                                        <div className="row px-2">


                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-3 mt-2">
                                                User Name
                                                <span className="color_red">*</span>
                                            </div>
                                            <Tooltip
                                                label=" user_id adalah company_id + 001 atau 01. Jika dalam company tersebut sudah ada, maka ditambahkan. "
                                                hasArrow
                                                arrowSize={15}
                                            >
                                                <div className="col-4 col-md-8 mt-1 ps-4">
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        placeholder="Insert your User ID"
                                                        size="sm"
                                                        value={uid}
                                                        onChange={(event) => setUid(event.target.value)}
                                                    />
                                                </div>
                                            </Tooltip>



                                        </div>


                                    </div>

                                </div>
                            </div>


                        </>

                    ))}



                    < div className="col-12 d-flex justify-content-end pe-4" >
                        <div
                            className="btn btn-warning border_radius_10px shadow px-3 mt-3"
                            onClick={handleEditButton}
                        >
                            Edit Account
                        </div>
                    </div>

                </div>
            </div>
        </div >

    );
}

export default EditAccount





