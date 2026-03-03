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
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';
import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";
function CreateAccount() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const toast = useToast();
    const [userID, setUserID] = useState();
    const [company_id, setCompany_id] = useState();
    const [employee_id, setEmployee_id] = useState();
    const [firstname, setFirstname] = useState();
    const [lastname, setLastname] = useState();
    const [uid, setUid] = useState();
    const [usertype, setUsertype] = useState("3");
    const [pswd, setPswd] = useState();
    const [email, setEmail] = useState();
    const [telp, setTelp] = useState();
    let type_id = usertype;


    const [distributorList, setDistributorList] = useState([]);

    useEffect(() => {
        let userToken = localStorage.getItem("tokek");
        Axios.get(API_URL + "/admin/config-company", {
            headers: { Authorization: `Bearer ${userToken}` }
        }).then((res) => {
            if (res.data.success) {
                setDistributorList(res.data.results);
            }
        }).catch((err) => console.log("Error fetching companies:", err));
    }, []);

    const handleButtonCreate = async () => {
        // console.log("jalan")
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
            !company_id
        ) {
            toast({
                title: "Oopsie!",
                description: "company_id Can't Be Empty",
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
        } else if (
            !pswd
        ) {
            toast({
                title: "Oopsie!",
                description: "Pswd Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        }
        else if (
            !email
        ) {
            toast({
                title: "Oopsie!",
                description: "email Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        }
        else if (
            !telp
        ) {
            toast({
                title: "Oopsie!",
                description: "telp Can't Be Empty",
                status: "error",
                duration: 6000,
                isClosable: true,
            });
        } else {
            await Axios.post(
                API_URL + "/admin/create_account",
                {
                    userID, company_id, employee_id,
                    firstname, lastname, type_id,
                    uid, pswd, email, telp
                },
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    },
                }
            )
                .then((res) => {
                    if (res.data.success) {
                        // console.log(res.data.success)
                        toast({
                            title: "Nicely Done!",
                            description: res.data.success,
                            status: "success",
                            duration: 6000,
                            isClosable: true,
                        });

                    } else {
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
                    console.log("Axios error ", err);
                    toast({
                        title: "Oopsie!",
                        description: "error",
                        status: "error",
                        duration: 6000,
                        isClosable: true,
                    });
                });
        }
    }

    const handleCompany_idChange = (event) => {
        const value = event.target.value;
        setCompany_id(value);

        if (value) {
            let userToken = localStorage.getItem("tokek");
            Axios.get(`${API_URL}/admin/next-user-id/${value}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            }).then((res) => {
                if (res.data.success) {
                    setUserID(res.data.results);
                    setEmployee_id(res.data.results);
                }
            }).catch((err) => console.log("Error fetching next user ID:", err));
        }
    };

    const handleEmployee_idChange = (event) => {
        const value = event.target.value;
        const sanitizedValue = value.replace(/\D/g, '');

        setEmployee_id(sanitizedValue);

    };

    const handleUserIDChange = (event) => {
        const value = event.target.value;
        const sanitizedValue = value.replace(/\D/g, '');

        setUserID(sanitizedValue);
    };


    return (
        <div >


            <div className="mb-2 ">
                <div>
                    <div className="shadow-none mt-3 row ">
                        <div className="col-md-12  col-12 ">
                            <div className="row pb-3 ms-1 mt-3 bg-white ">
                                <div className="col-6 d-flex jutify-content-start ">
                                    <div className=" d-flex grey_text_bold fs-5 pt-1">
                                        Account Management
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>
                </div>

                <div className="container">
                    <div className="row px-1 px-md-3 px-lg-3 d-flex justify-content-start mt-2">
                        <div className="PC-ver card-body border border_radius_10px shadow shadow-sm my-2">
                            <div className="row px-2">
                                <div className="col-12 card-body border border_radius_10px">

                                    <div className="card position-relative px-3 pt-4 pb-4 mt-4 mb-4">
                                        <div className="position-absolute bg-secondary shadow px-4 text-light" style={{ top: "-10px" }}>
                                            Company Request
                                        </div>
                                        <div className="row px-2 mb-2">


                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                                Company_id
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 mt-1 ps-4">
                                                <Tooltip
                                                    label=" company_id sesuai dengan request "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Select
                                                        className="grey_text fs-6"
                                                        placeholder="Select Company"
                                                        size="sm"
                                                        value={company_id}
                                                        onChange={handleCompany_idChange}
                                                    >
                                                        {distributorList
                                                            .slice() // prevent mutating original array
                                                            .sort((a, b) => a.company_id - b.company_id)
                                                            .map((company) => (
                                                                <option key={company.company_id} value={company.company_id}>
                                                                    ({company.company_id}) {company.company_name} || {company.division_name}
                                                                </option>
                                                            ))}
                                                    </Select>
                                                </Tooltip>
                                            </div>

                                        </div>
                                        <div className="row px-2">


                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                                User_id
                                                <span className="color_red">*</span>
                                            </div>
                                            <Tooltip
                                                label=" user_id adalah company_id + 001 atau 01. Jika dalam company tersebut sudah ada, maka ditambahkan. "
                                                hasArrow
                                                arrowSize={15}
                                            >
                                                <div className="col-4 mt-1 ps-4">
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        placeholder="Insert your User ID"
                                                        size="sm"
                                                        value={employee_id}
                                                        onChange={handleEmployee_idChange}
                                                    />
                                                </div>
                                            </Tooltip>

                                            <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                                Employee_id
                                                <span className="color_red">*</span>
                                            </div>

                                            <div className="col-4 mt-1 ps-4">
                                                <Tooltip
                                                    label=" NIK / ID Pekerja.  "
                                                    hasArrow
                                                    arrowSize={15}
                                                >
                                                    <Input
                                                        className="grey_text fs-6"
                                                        type="text"
                                                        placeholder="Insert your Employee ID"
                                                        size="sm"
                                                        value={userID}
                                                        onChange={handleUserIDChange}
                                                    />
                                                </Tooltip>
                                            </div>

                                        </div>


                                    </div>

                                    <div className="row px-2 mb-2">


                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            First Name
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
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
                                                    placeholder="First Name"
                                                    size="sm"
                                                    onChange={(event) => setFirstname(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            Last Name
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
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
                                                    placeholder="Last Name"
                                                    size="sm"
                                                    onChange={(event) => setLastname(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                    </div>

                                    <div className="row px-2 mb-2">


                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            Username
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
                                            <Tooltip
                                                label=" 
                                                                    firstname + '.' + lastname 
                                                                    "
                                                hasArrow
                                                arrowSize={15}
                                            >
                                                <Input
                                                    className="grey_text fs-6"
                                                    type="text"
                                                    placeholder="  Username"
                                                    size="sm"
                                                    onChange={(event) => setUid(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            Password
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
                                            <Tooltip
                                                label=" 
                                                                    default = Indofood01,
                                                                    "
                                                hasArrow
                                                arrowSize={15}
                                            >
                                                <Input
                                                    className="grey_text fs-6"
                                                    type="text"
                                                    placeholder="      Password"
                                                    size="sm"
                                                    onChange={(event) => setPswd(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                    </div>

                                    <div className="row px-2 mb-2">


                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            Email
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
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
                                                    placeholder="  Email"
                                                    size="sm"
                                                    onChange={(event) => setEmail(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                        <div className="grey_text_bold ratakiri fs-6 d-flex col-4 col-md-2 mt-2">
                                            Telp
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="col-4 mt-1 ps-4">
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
                                                    placeholder=" Telp"
                                                    size="sm"
                                                    onChange={(event) => setTelp(event.target.value)}
                                                />
                                            </Tooltip>
                                        </div>

                                    </div>

                                    <div className="row px-2 mb-2">
                                        <div className="d-flex ratakiri grey_text_bold fs-6 col-md-2 col-5 pt-1">
                                            User Type
                                            <span className="color_red">*</span>
                                        </div>

                                        <div className="d-flex col-md-4 col-7 ps-4">
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
                                <div className="col-12 d-flex justify-content-end pe-4">
                                    <div
                                        className="btn btn-danger border_radius_10px shadow px-3 mt-3"
                                        onClick={handleButtonCreate}
                                    >
                                        Create Account
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div >


    );
}

export default CreateAccount





