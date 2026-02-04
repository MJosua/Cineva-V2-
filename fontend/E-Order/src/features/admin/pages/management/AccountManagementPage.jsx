import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SearchBarComponent from "../../../../components/inputs/SearchBarComponent.jsx";
import Sidebar from "../../../../components/layout/Sidebar.jsx";
import { clearSeasonStorage } from "../../../../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../../../../action/userAction";
import { apiGet, apiPatch, apiPost } from "../../../../services/api/http";

import { useDispatch } from "react-redux";


//Styling
import {
    Select,
    Input,
    Spinner,
    useToast,
    Tooltip,
    Modal,
    useDisclosure,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Image,
} from "@chakra-ui/react";


import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";

import { BiDetail } from "react-icons/bi";

// import LogoBar from "../../components/LogoBar";
import EditAccount from "../../../../components/admin/EditAccount";
import { FaToggleOff, FaToggleOn } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
const AccountManagementPage = () => {

    const dispatch = useDispatch();
    const toast = useToast();




    const navigate = useNavigate();

    // ================= CLEAR SESSION STORAGE =====================

    const [search, setSearch] = useState("");

    // ============================================================
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(true);
    const [user_id, setUser_id] = useState();
    const [userData, setUserData] = useState([]);
    const [updatedData, setUpdatedData] = useState(null);
    const [existActive, setExistActive] = useState([]);
    const [existSuspend, setExistSuspend] = useState([]);
    const [countryValue, setCountryValue] = useState("");

    let changed_active = existActive == 1 ? 0 : existActive == 0 ? 1 : 1;
    let changed_suspend = existSuspend == 1 ? 2 : existSuspend == 0 ? 2 : 0;

    const getUserData = () => {
        let userToken = localStorage.getItem("tokek");
        apiGet("/admin/account", userToken)
            .then((res) => {
                setUserData(res.data.results);
                setLoading(false);
            })
            .catch((err) => {

            });
    };

    const [userDetails, setUserDetails] = useState();


    const [userID, setUserID] = useState();
    const [employee_id, setEmployee_id] = useState();
    const [firstname, setFirstname] = useState();
    const [lastname, setLastname] = useState();
    const [uid, setUid] = useState();
    const [usertype, setUsertype] = useState();
    const [email, setEmail] = useState();
    const [telp, setTelp] = useState();

    const getUserDetails = async (user_id) => {
        let userToken = localStorage.getItem("tokek");
        await apiPost("/admin/account-detail", userToken, { user_id })
            .then((res) => {
                setUserDetails(res.data.results);
                setUserID(res.data.results[0].user_id);
                setEmployee_id(res.data.results[0].user_id);
                setFirstname(res.data.results[0].firstname);
                setLastname(res.data.results[0].lastname);
                setUid(res.data.results[0].uid);
                setUsertype(res.data.results[0].type_id);
                setEmail(res.data.results[0].email);
                setTelp(res.data.results[0].appl_phone_nr);
                setLoading2(false);
                // console.log(res.data.results)
            })
            .catch((err) => {
            });
    };



    const [statusValue, setStatusValue] = useState();;
    const handleStatusValueChange = (event) => {
        const selectedValue = event.target.value === "-1"
            ?
            null
            :
            parseInt(event.target.value)
            ;
        setStatusValue(selectedValue);
    };

    const UppercaseFirstAlphabet = ({ name }) => {
        const capitalizeFirstLetter = (str) => {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };

        const uppercaseName = capitalizeFirstLetter(name);

        return <span>{uppercaseName}</span>;
    };

    const handleStatusButton = async (user_id) => {
        const updatedUserData = userData.map((user) => {
            if (user.user_id === user_id) {
                const updatedUser = { ...user, active: changed_active };
                return updatedUser;
            }
            return user;
        });
        let userToken = localStorage.getItem("tokek");

        setUserData(updatedUserData);

        await apiPatch("/admin/active", userToken, { user_id, changed_active })
            .then((res) => {
                if (res.data.success) {
                    toast({
                        title: "Yeay!",
                        description: res.data.message,
                        status: "success",
                        duration: 6000,
                        isClosable: true,
                    });
                    onCloseModalChangeStatus();
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
                console.log("Axios error when changing account status", err);
            });
    }

    const handleSuspendButton = async (user_id) => {
        const updatedUserData = userData.map((user) => {
            if (user.user_id === user_id) {
                const updatedUser = { ...user, active: changed_suspend };
                return updatedUser;
            }
            return user;
        });
        let userToken = localStorage.getItem("tokek");

        setUserData(updatedUserData);
        await apiPatch("/admin/active", userToken, {
            user_id: user_id,
            changed_active: changed_suspend
        })
            .then((res) => {
                if (res.data.success) {
                    toast({
                        title: "Yeay!",
                        description: res.data.message,
                        status: "success",
                        duration: 6000,
                        isClosable: true,
                    });
                    onCloseModalChangeSuspend();
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
                console.log("Axios error when changing account status", err);
            });
    }



    const clearGetDetails = () => {

        setUserDetails(null);  // Assuming setUserDetails(null) clears the user details
        setLoading2(true);     // Assuming setLoading2(true) resets the loading state


    }

    const clearGetEdit = () => {

        setUserDetails(null);  // Assuming setUserDetails(null) clears the user details
        setLoading2(true);     // Assuming setLoading2(true) resets the loading state


    }

    const printaccountlist = () => {
        return userData
            .filter(userData => {
                const searchLower = search.toLowerCase();
                let aCountryDesc = "";  // Initialize to an empty string

                if (userData.country_desc) {
                    aCountryDesc = userData.country_desc.toLowerCase();
                }

                if (statusValue === null) {
                    return (
                        aCountryDesc.includes(countryValue.toLowerCase()) &&
                        userData.uid.toLowerCase().includes(searchLower)
                    );
                } else if (statusValue === 1) {
                    return (
                        aCountryDesc.includes(countryValue.toLowerCase()) &&
                        userData.uid.toLowerCase().includes(searchLower) &&
                        userData.active === 1
                    );
                } else if (statusValue === 2) {
                    return (
                        aCountryDesc.includes(countryValue.toLowerCase()) &&
                        userData.uid.toLowerCase().includes(searchLower) &&
                        userData.active !== 1
                    );
                } else if (!statusValue) {
                    return (
                        aCountryDesc.includes(countryValue.toLowerCase()) &&
                        userData.uid.toLowerCase().includes(searchLower)
                    );
                }
            })
            .sort((a, b) => {
                // Handle null values by moving them to the top
                const aCountryDesc = a.country_desc || '';
                const bCountryDesc = b.country_desc || '';

                // Sort null values to the top
                if (aCountryDesc === '' && bCountryDesc === '') {
                    return 0;
                } else if (aCountryDesc === '') {
                    return -1;
                } else if (bCountryDesc === '') {
                    return 1;
                }

                // Sort non-null values based on country_desc
                return aCountryDesc.localeCompare(bCountryDesc);
            })
            .map((val, idx) => {
                {
                    return (
                        <tr>
                            <td scope="row" className="px-0">{idx + 1}</td>
                            <td className="text-start px-0 responsive-isi">{val.uid}
                                <div className="d-md-none d-block px-0 border-top">
                                    {val.country_desc}
                                </div>
                            </td>
                            <td className="d-md-table-cell d-none px-0">{val.last_login_date}</td>

                            <td className="d-md-table-cell d-none px-0">{val.country_desc}</td>
                            <td className={val.active === 1 ? "text-success px-0" : val.active === 2 ? " text-muted  px-0 " : " text-danger px-0"}>{val.active === 1 ? "Active" : val.active === 2 ? " Suspend " : "Deactive"}</td>
                            <td className="row d-flex justify-content-center px-0">

                                <div className="col-12 col-md-3 d-block mb-1">
                                    <Tooltip
                                        label={
                                            val.active === 1 ?
                                                "Deactive Account"
                                                :
                                                val.active === 0 ?
                                                    "Activate Account "
                                                    :
                                                    "Deactivate Account "
                                        }
                                        hasArrow
                                        arrowSize={15}
                                    >
                                        <div

                                            onClick={() => {
                                                setUser_id(val.user_id);
                                                setExistActive(val.active);
                                                onOpenModalChangeStatus(val.user_id);
                                            }}
                                            className=
                                            {
                                                val.active === 1 ?
                                                    "btn btn-success"
                                                    :
                                                    val.active === 0 ?
                                                        "btn btn-danger "
                                                        :
                                                        "btn btn-danger "
                                            }
                                        >

                                            < FaUserTimes />

                                        </div>
                                    </Tooltip>
                                </div>


                                <div className="col-12 col-md-3 mb-1">
                                    <Tooltip
                                        label="Account Details"
                                        hasArrow
                                        arrowSize={15}


                                    >
                                        <div className="btn btn-secondary"
                                            onClick={() => {
                                                setUser_id(val.user_id);
                                                getUserDetails(val.user_id);

                                                onOpenModalDetailStatus();
                                            }}
                                        >
                                            <BiDetail />
                                        </div>
                                    </Tooltip>
                                </div>

                                <div className="col-12 col-md-3 mb-1">
                                    <Tooltip
                                        label="Account Edit"
                                        hasArrow
                                        arrowSize={15}


                                    >
                                        <div className="btn btn-warning"
                                            onClick={() => {
                                                setUser_id(val.user_id);
                                                getUserDetails(val.user_id);

                                                onOpenModalDetailEdit();
                                            }}
                                        >
                                            <FaRegEdit />
                                        </div>
                                    </Tooltip>
                                </div>

                                <div className="col-12 col-md-3 d-block mb-1">
                                    <Tooltip
                                        label={
                                            val.active === 1 ?
                                                "Suspend Account"
                                                :
                                                val.active === 0 ?
                                                    "Suspend Account "
                                                    :
                                                    "Change to Deactive Instead "
                                        }
                                        hasArrow
                                        arrowSize={15}
                                    >
                                        <div

                                            onClick={() => {
                                                setUser_id(val.user_id);
                                                setExistSuspend(val.active);
                                                onOpenModalChangeSuspend(val.user_id);
                                            }}
                                            className={
                                                val.active === 1 ?
                                                    "btn btn-success"
                                                    :
                                                    val.active === 0 ?
                                                        "btn btn-success"
                                                        :
                                                        "btn btn-secondary"
                                            }
                                        >
                                            {
                                                val.active === 1 ?
                                                    <FaToggleOn />
                                                    :
                                                    val.active === 0 ?
                                                        <FaToggleOn />
                                                        :
                                                        <FaToggleOff />
                                            }
                                        </div>
                                    </Tooltip>
                                </div>

                            </td >
                        </tr >

                    );
                }
            }
            )
    }

    React.useEffect(() => {
        getUserData();
    }, []);


    const printdetails = () => {
        return userDetails
            .map((val, idx) => {
                {
                    return (
                        <>


                            <div className="card shadow py-3 px-1 border_radius_10px mb-3">
                                <div className="row mt-2 ps-1">
                                    <div

                                        className={
                                            "position-absolute text-light justify-content-start d-flex border w-50 " +
                                            (val.active === 1 ? "bg-success " : val.active === 0 ? " bg-danger" : "bg-dark text-light")
                                        }
                                        style={{ marginTop: "-40px", marginLeft: "5px" }}
                                    >
                                        <span>Status : &nbsp;</span>

                                        <span> {val.active === 1 ? "Active " : val.active === 0 ? " Deactive" : "Suspend"}</span>
                                    </div>
                                    <div className="col-md-5 col-12">
                                        <div className="row">
                                            <div className="col-12 fw-bold text-secondary mt-1">

                                                {val.uid}

                                            </div>
                                            <div className="col-12 d-flex justify-content-center">
                                                <Image

                                                    className="shadow-lg rounded-circle"
                                                    src={"/image/CountryFlag/" + val.country_desc + ".png"}
                                                    width="85px"
                                                    fallbackSrc="/image/emptyplate.PNG"
                                                />
                                            </div>
                                            <div className="col-12 fw-bold">
                                                {val.country_desc}
                                            </div>
                                            <div
                                                className=
                                                "text-light justify-content-center mt-1"
                                            >
                                                <div className=" bg-secondary  me-2 mt-1 mt-md-0 fw-bold text-warning py-2">
                                                    {val.user_desc}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-7 col-12 d-flex text-start pe-2 ps-md-0 ps-4 pt-2 ">
                                        <div className="row w-100 card py-1">
                                            <div className="col-12">
                                                <div className="fw-bold">
                                                    <div className="">
                                                        <div className="fw-normal mt-2 d-block d-md-none"> Name </div>
                                                        <span> <UppercaseFirstAlphabet name={val.firstname} /></span>
                                                        <span className="ms-2"> <UppercaseFirstAlphabet name={val.lastname} /></span>
                                                        <div className="fw-normal mt-2"> Company Name</div>
                                                        <div className="">{val.company_name}</div>

                                                        <div className="fw-normal mt-2"> Email</div>
                                                        <div className="">{val.email}</div>

                                                        <div className="fw-normal mt-2"> Tel</div>
                                                        <div className="">{val.appl_phone_nr === "" || val.appl_phone_nr === null || val.appl_phone_nr === undefined ? "-" : val.appl_phone_nr}</div>

                                                        <div className="fw-normal mt-2"> Registered</div>
                                                        <div>
                                                            {val.registration_date}
                                                        </div>

                                                        <div className="fw-normal mt-2"> Last Login</div>
                                                        <span> {!val.last_login_date ? " -" : val.last_login_date}</span>

                                                        <div className="fw-normal mt-2 "> Last Password Change</div>
                                                        <div>
                                                            {!val.last_pswd_changed ? "-" : val.last_pswd_changed}
                                                        </div>

                                                        <div className="fw-normal mt-2 "> User Id</div>
                                                        <div>
                                                            <div>  {val.user_id}</div>
                                                        </div>
                                                        <div className="fw-normal mt-2 "> Company Id</div>
                                                        <div className="mb-2">
                                                            {val.company_id}
                                                        </div>


                                                    </div>
                                                    {/* <div style={{ height: "340px" }}>

                                                    </div> */}
                                                </div>

                                            </div>
                                            <div className="col-6">

                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>




                        </>

                    );
                }
            }
            )
    }

    const printAllCountry = () => {
        const uniqueCountry = new Set();

        return userData.map((val, idx) => {
            if (!uniqueCountry.has(val.country_desc)) {
                uniqueCountry.add(val.country_desc);

                return (
                    <option key={idx} value={val.country_desc}>
                        {val.country_desc}
                    </option>
                );
            }

        });
    };

    const {
        isOpen: isOpenModalChangeStatus,
        onOpen: onOpenModalChangeStatus,
        onClose: onCloseModalChangeStatus,
    } = useDisclosure();

    const {
        isOpen: isOpenModalChangeSuspend,
        onOpen: onOpenModalChangeSuspend,
        onClose: onCloseModalChangeSuspend,
    } = useDisclosure();

    const {
        isOpen: isOpenModalDetailStatus,
        onOpen: onOpenModalDetailStatus,
        onClose: onCloseModalDetailStatus,
    } = useDisclosure();

    const {
        isOpen: isOpenModalDetailEdit,
        onOpen: onOpenModalDetailEdit,
        onClose: onCloseModalDetailEdit,
    } = useDisclosure();



    return (
        <div >
            <SearchBarComponent />

            <div className="pb-3 me-4 ms-1">
                <div className="py-5 mt-2 stick-left">
                    <div className="row ">
                        <div className="col-6 col-sm-12"></div>
                        <div className="col-6 col-sm-12">
                            <Sidebar />
                        </div>
                    </div>
                </div>

                <div className="py-5">
                    {/* CONTENT BELOW */}
                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4 ">
                            <div className="row text-secondary pb-3 user-select-none">

                                <div className="col-12 d-flex  pt-1 ">
                                    <span
                                        onClick={() => navigate("/e-order/dashboard")}
                                        className="pointer grey_text_normal_20px">
                                        Admin
                                    </span>
                                    <span className="grey_text_20px">
                                        &nbsp;/ Account Management
                                    </span>
                                </div>
                            </div>
                            <div className="mb-2 d-flex justify-content-start  ">
                                <div className="col-12">
                                    <div className="shadow-none mt-3 row ">
                                        <div className="  col-12 ">
                                            <div className="row pb-3 mt-3 bg-white ">
                                                <div className="col-6  d-flex jutify-content-start ">
                                                    <div className=" d-flex grey_text_bold fs-5 pt-1">
                                                        Admin Settings
                                                    </div>
                                                </div>
                                                <div className="col-6  d-flex justify-content-end align-items-center pe-5">
                                                    <div
                                                        onClick={() => navigate("/e-order/createaccount")}
                                                        className="btn btn-outline-danger position-absolute">
                                                        Create Account
                                                    </div>

                                                </div>
                                                <div className="col-md-3 mt-2  d-flex pt-1">
                                                    <Select
                                                        className="grey_text fs-6"
                                                        size="sm"
                                                        value={countryValue}
                                                        onChange={(event) =>
                                                            setCountryValue(event.target.value)}
                                                    >
                                                        <option value="">All Countries</option>
                                                        {printAllCountry()}
                                                    </Select>
                                                </div>

                                                <div className="col-md-4 mt-2 d-flex pt-1">
                                                    <Select
                                                        className="grey_text fs-6"
                                                        size="sm"
                                                        value={statusValue}
                                                        onChange={handleStatusValueChange}
                                                    >
                                                        <option value="-1">
                                                            All Status
                                                        </option>
                                                        <option value="1">
                                                            Active
                                                        </option>
                                                        <option value="2">
                                                            Deactive
                                                        </option>
                                                    </Select>
                                                </div>

                                                <div className="col-md-5 mt-2  col-12 ">
                                                    <div className="d-flex pt-1">
                                                        <Input
                                                            size="sm"
                                                            className="form-control me-2 grey_text fs-6"
                                                            type="search"
                                                            placeholder="Search Account"
                                                            onChange={(event) => setSearch(event.target.value)}
                                                        />
                                                        <AiOutlineSearch
                                                            className="color_red pt-2"
                                                            size={30}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                    </div>

                                    <div className="">
                                        <div className="row px-1 px-md-3 px-lg-3 d-flex justify-content-start ">
                                            <div className=" card-body border border_radius_10px shadow shadow-sm my-2">
                                                <div className="row ">
                                                    <div className="col-12" style={{ maxHeight: "400px", overflow: "auto" }}>
                                                        <table className="table"   >


                                                            {loading ?
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
                                                                :
                                                                <>
                                                                    <thead className="thead" >
                                                                        <tr className="bg-secondary text-white ">
                                                                            <th className="table__cell bg-secondary px-0" >#</th>
                                                                            <th className="table__cell bg-secondary text-start px-0" >User</th>
                                                                            <th className="table__cell bg-secondary text-start px-0" >Last Login</th>
                                                                            <th className="table__cell table_country bg-secondary" >Country</th>
                                                                            <th className="table__cell bg-secondary" >Status</th>
                                                                            <th className="table__cell bg-secondary" >Action</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {printaccountlist()}
                                                                    </tbody>
                                                                </>
                                                            }


                                                        </table>


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
            {/* </div> */}
            <Modal

                onClose={onCloseModalChangeStatus}
                isOpen={isOpenModalChangeStatus}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Account Management
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="d-grid gap-2 text-secondary text-center">

                            Are You Sure to change the status ?
                            <br>
                            </br>
                            Please double check after you click the button.
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorscheme='yellow' mr={3}
                            onClick={() => {
                                handleStatusButton(user_id);
                            }}
                        >
                            Change
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal

                onClose={onCloseModalChangeSuspend}
                isOpen={isOpenModalChangeSuspend}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Account Management
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="d-grid gap-2 text-secondary text-center">

                            Are You Sure to Suspend the Account ?
                            <br>
                            </br>
                            Please double check after you click the button.
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorscheme='yellow' mr={3}
                            onClick={() => {
                                handleSuspendButton(user_id);
                            }}
                        >
                            Change
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal

                onClose={() => {
                    onCloseModalDetailStatus();
                    clearGetDetails();
                }}
                isOpen={isOpenModalDetailStatus}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Account Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="d-grid gap-2 text-secondary text-center">
                            {loading2 ?
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
                                :
                                <>

                                    {printdetails()}

                                </>
                            }

                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal
                size="xl"
                onClose={() => {
                    onCloseModalDetailEdit();
                    clearGetEdit();
                }}
                isOpen={isOpenModalDetailEdit

                }
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Edit Account Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="d-grid gap-2 text-secondary text-center">
                            {loading2 ?
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
                                :
                                <>

                                    <EditAccount

                                        userID={userID}
                                        userDetails={userDetails}
                                        employee_id={employee_id}
                                        firstname={firstname}
                                        lastname={lastname}
                                        uid={uid}
                                        usertype={usertype}
                                        email={email}
                                        telp={telp}

                                        setUserID={setUserID}
                                        setEmployee_id={setEmployee_id}
                                        setFirstname={setFirstname}
                                        setLastname={setLastname}
                                        setUid={setUid}
                                        setUsertype={setUsertype}
                                        setEmail={setEmail}
                                        setTelp={setTelp}

                                        onCloseModalDetailEdit={onCloseModalDetailEdit}
                                    />
                                </>
                            }



                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

        </div>
    )
}

export default AccountManagementPage; 





