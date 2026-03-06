import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";

import SearchBarComponent from "../../components/SearchBarComponent";


import { clearSeasonStorage } from "../../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../../action/userAction";

import { useDispatch } from "react-redux";
import { AiOutlineDelete } from "react-icons/ai";
import { API_URL } from "../../config";



import { AiFillCloseCircle } from "react-icons/ai";
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
    InputGroup,
    InputLeftAddon,
    InputRightAddon,
} from "@chakra-ui/react";


import {
    AiOutlineEye,
    AiOutlineSearch,
    AiOutlineEyeInvisible
} from 'react-icons/ai'
import { FaUserTimes, FaUserLock } from "react-icons/fa";
import { FaRegEdit } from "react-icons/fa";
import { BiDetail } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";
import Sidebar from "../../components/Sidebar";
// import LogoBar from "../components/LogoBar";

function Itemconfig() {

    const dispatch = useDispatch();
    const toast = useToast();

    const [distributor, setDistributor] = useState();
    const [condition, setCondition] = useState("");
    const [selectedTOP, setSelectedTOP] = useState("");
    const [config_id, setConfig_id] = useState();



    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);


    const [itemData, setItemData] = useState([]);
    const [companyList, setCompanyList] = useState([]);
    const [termOfPayment, setTermOfPayment] = useState([]);
    const [treatmentCondition, setTreatementCondition] = useState([]);
    const [treatmentConditionList, setTreatementConditionList] = useState([]);
    const getCompanyList = async () => {
        let userToken = localStorage.getItem("hots_tokek");

        await Axios.get(API_URL + `/admin/config-company`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setCompanyList(res.data.results);
                setLoading(false);
                // console.log("getCompanyList", res.data);
            })
            .catch((err) => {
                console.log("error at getCompanyList at admin page");
            });
    };
    const getTermOfPayment = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/admin/config-top`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTermOfPayment(res.data.results);
                setLoading(false);
                // console.log("getTermOfPayment", res.data);
            })
            .catch((err) => {
                console.log("error at getCompanyList at admin page");
            });
    };
    const getTreatementCondition = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/admin/config`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTreatementCondition(res.data.results);
                setLoading(false);
                // console.log("getTreatementCondition", res.data);
            })
            .catch((err) => {
                console.log("error at getCompanyList at admin page");
            });
    };

    const getTreatementConditionList = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/admin/config-condition`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setTreatementConditionList(res.data.results);
                setLoading(false);
                // console.log("getTreatementCondition", res.data);
            })
            .catch((err) => {
                console.log("error at getCompanyList at admin page");
            });
    };

    // console.log("companyList", companyList)
    // console.log("termOfPayment", termOfPayment)
    // console.log("treatmentCondition", treatmentCondition)

    const getItemData = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/admin/config`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setItemData(res.data.results);
                setLoading(false);
                console.log("itemData", res.data);
            })
            .catch((err) => {
                console.log("Gagal");
            });
    };

    const [liburday, setLiburDay] = useState([]);


    const get_blocking_date_sys_text = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/admin/get_blocking_date_sys_text`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setLiburDay(res.data.results)
                console.log("get_blocking_date_sys_text ", res.data);
            })
            .catch((err) => {
                console.log("Gagal");
            });
    };

    const [loadingntp, setloadingntp] = useState(true)

    const [listNtp, setlistntp] = useState([])

    const get_ntp = async (company_id) => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.get(API_URL + `/user/ntp/${company_id}`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setlistntp(res.data.Notify)
                console.log(`get_ntp_selection ${company_id} `, res.data);
                setloadingntp(false)
            })
            .catch((err) => {
                console.log("Gagal");
            });
    };

    const sys_textEditBlockingDate = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        try {
            const res = await Axios.post(`${API_URL}/admin/edit_blocking_date_sys_text`, {
                config_id: config_id,
                conditions: condition,
                value: selectedTOP,
                active: "1",
            }, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });

            if (res.data.success) {
                toast({
                    title: "Yeay!",
                    description: res.data.message,
                    status: "success",
                    duration: 6000,
                    isClosable: true,
                });

                onCloseModalEdit();
                setCondition(null); // Make sure it's reset correctly
                setDistributor(null); // Same here
                getItemData(); // Refresh the data
            } else {
                toast({
                    title: "Oopsie!",
                    description: res.data.message, // Fixed: `res.message` → `res.data.message`
                    status: "error",
                    duration: 6000,
                    isClosable: true,
                });
            }
        } catch (err) {
            toast({
                title: "Oopsie!",
                description: err.message,
                status: "error",
                duration: 6000,
                isClosable: true,
            });
            console.log("error", err)
        }
    };


    const postItemData = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.post(API_URL + `/admin/config`,
            {
                company_id: distributor,
                user_id: 0,
                conditions: condition,
                value: selectedTOP,
            }, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
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
                    onCloseModalAdd();
                    setCondition();
                    setDistributor();
                    getItemData();
                } else if (!res.data.success) {
                    toast({
                        title: "Oopsie!",
                        description: res.message,
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
            });
    };

    const deleteItemData = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.delete(API_URL + `/admin/config/${config_id}`,
            {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
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
                    onCloseModalDelete();
                    setCondition();
                    setDistributor();
                    getItemData();
                } else if (!res.data.success) {
                    toast({
                        title: "Oopsie!",
                        description: res.message,
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
            });
    };

    const editItemData = async () => {
        let userToken = localStorage.getItem("hots_tokek");
        await Axios.put(API_URL + `/admin/config`,
            {
                config_id: config_id,
                conditions: condition,
                value: selectedTOP,
                active: "1"

            }, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
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
                    onCloseModalEdit();
                    setCondition();
                    setDistributor();
                    getItemData();
                } else if (!res.data.success) {
                    toast({
                        title: "Oopsie!",
                        description: res.message,
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


            });
    };



    const {
        isOpen: isOpenModalEdit,
        onOpen: onOpenModalEdit,
        onClose: onCloseModalEdit,
    } = useDisclosure();

    const {
        isOpen: isOpenModalDelete,
        onOpen: onOpenModalDelete,
        onClose: onCloseModalDelete,
    } = useDisclosure();

    const {
        isOpen: isOpenModalAdd,
        onOpen: onOpenModalAdd,
        onClose: onCloseModalAdd,
    } = useDisclosure();

    React.useEffect(() => {
        getItemData();
        getCompanyList();
        getTermOfPayment();
        getTreatementCondition();
        getTreatementConditionList();




    }, []);


    const [search_condition_name, setSearch_condition_name] = useState("");
    const [search_company_name, setSearch_company_name] = useState("");



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

                <div className="py-5 ">
                    {/* CONTENT BELOW */}
                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4 ">
                            <div className="row text-secondary  pb-3 user-select-none">

                                <div className="col-12 d-flex  pt-1 ">
                                    <span
                                        onClick={() => navigate("/e-order/dashboard")}
                                        className="pointer grey_text_normal_20px">
                                        Admin
                                    </span>

                                    <span className="grey_text_20px">
                                        &nbsp;/ Special Condition
                                    </span>
                                </div>
                            </div>
                            <div className="mb-2 d-flex justify-content-start ">
                                <div className="container-fluid">
                                    <div className="px-4 row">
                                        <div classNa="col-12 ">
                                            <div className="row ">
                                                <div className="col-4">
                                                    <InputGroup >
                                                        <InputLeftAddon>Company Name</InputLeftAddon>
                                                        <Input
                                                            value={search_company_name}
                                                            onChange={(e) => setSearch_company_name(e.target.value)}
                                                        />
                                                    </InputGroup>

                                                </div>
                                                <div className="col-4">
                                                    <InputGroup >
                                                        <InputLeftAddon>Condition</InputLeftAddon>
                                                        <Input
                                                            value={search_condition_name}
                                                            onChange={(e) => setSearch_condition_name(e.target.value)}
                                                        />
                                                    </InputGroup>

                                                </div>
                                                <div className="col-4  d-flex justify-content-end ">

                                                    <div className="btn border_radius_10px btn-primary"
                                                        onClick={ 
                                                            onOpenModalAdd
                                                        
                                                        }
                                                    >
                                                        Add Condition
                                                    </div>

                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 ">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">No</th>
                                                        <th scope="col">Distributor</th>
                                                        <th scope="col">Condition</th>
                                                        <th scope="col">Value</th>
                                                        <th scope="col">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {loading ?
                                                        (
                                                            <div className=" pt-5 pb-5 m-5 p-5 d-flex justify-content-center w-100 align-items-center row pt-5">
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

                                                            {itemData
                                                                .filter(item => {
                                                                    // Check if search_condition_name and search_company_name are empty or undefined
                                                                    const conditionMatch = !search_condition_name || item.condition_name.toLowerCase().includes(search_condition_name.toLowerCase());
                                                                    const companyMatch = !search_company_name || item.company_name.toLowerCase().includes(search_company_name.toLowerCase());

                                                                    // Return true if both conditions are met
                                                                    return conditionMatch && companyMatch;
                                                                })
                                                                .map((item, idx) => (
                                                                    <tr key={item.id}>
                                                                        <th scope="row">
                                                                            {idx + 1}
                                                                        </th>
                                                                        <td>
                                                                            {item.company_name}
                                                                        </td>
                                                                        <td>
                                                                            {!item.condition_name ?
                                                                                ""
                                                                                :
                                                                                (item.condition_name)}


                                                                        </td>

                                                                        <td>
                                                                            {!item.value ?
                                                                                ""
                                                                                :
                                                                                (item.value)}


                                                                        </td>

                                                                        <td>
                                                                            <div className="row">
                                                                                <div className="col-6">
                                                                                    <div className="btn btn-danger"
                                                                                        onClick={
                                                                                            () => {
                                                                                                setConfig_id(item.config_id);
                                                                                                onOpenModalDelete();
                                                                                            }
                                                                                        }

                                                                                    >
                                                                                        <AiOutlineDelete />
                                                                                    </div>
                                                                                </div>
                                                                                <div className="col-6">
                                                                                    <div className="btn btn-warning"
                                                                                        onClick={
                                                                                            () => {
                                                                                                setConfig_id(item.config_id);
                                                                                                setSelectedTOP(item.value);
                                                                                                setCondition(item.condition_id);
                                                                                                setDistributor(item.company_id)
                                                                                                onOpenModalEdit();

                                                                                            }
                                                                                        }
                                                                                    >
                                                                                        <FaRegEdit />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                        </td>
                                                                    </tr>


                                                                ))}
                                                        </>
                                                    }
                                                </tbody>
                                            </table>
                                        </div >


                                    </div>
                                </div >
                            </div >
                        </div >
                    </div >
                </div >
            </div >
            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalAdd}
                onClose={onCloseModalAdd}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Add Special Condition</ModalHeader>
                        <ModalCloseButton
                            onClick={onCloseModalAdd}
                        />
                        <ModalBody>
                            <div className="row">

                                <div className="col-4 d-flex align-items-center">
                                    Distributor
                                </div>
                                <div className="col-8 my-1">
                                    <Select
                                        placeholder="Select Distributor"
                                        value={distributor}
                                        onChange={(e) => setDistributor(e.target.value)
                                        }

                                    >

                                        {companyList.map((val, idx) =>
                                            <>
                                                <option value={val.company_id}>
                                                    {val.company_name + " - " + val.company_id}
                                                </option>
                                            </>
                                        )}

                                    </Select>
                                </div>

                                <div className="col-4 d-flex align-items-center">
                                    Condition
                                </div>
                                <div className="col-8 my-1">
                                    <Select
                                        value={condition}
                                        placeholder="Select Condition"
                                        onChange={async (event) => {
                                            setCondition(event.target.value);
                                            if (event.target.value === "2") {
                                                setSelectedTOP(1);
                                            }

                                            if (event.target.value === "18") {
                                                await get_ntp(distributor);
                                            }

                                            if (event.target.value === "11") {
                                                get_blocking_date_sys_text();
                                            }
                                            // Set the condition state variable with the value from the event
                                        }}
                                        disabled={!distributor}
                                    >
                                        {treatmentConditionList.map((val, idx) => (
                                            <>
                                                <option value={val.id}>
                                                    {val.condition_name}
                                                </option>
                                            </>
                                        ))}
                                    </Select>
                                </div>



                                {
                                    condition === "3" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Overwrite TOP
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                >
                                                    {termOfPayment.map((val, idx) => (
                                                        <>
                                                            <option value={val.DESC}>
                                                                {val.DESC}
                                                            </option>
                                                        </>
                                                    ))}
                                                </Select>
                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === "1" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Value
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                >
                                                    <option value="1">
                                                        1
                                                    </option>
                                                    <option value="2">
                                                        2
                                                    </option>
                                                    <option value="3">
                                                        3
                                                    </option>
                                                </Select>
                                            </div>
                                        </>

                                        :
                                        condition === "7" ?



                                            <>
                                                <div className="col-4 d-flex align-items-center">
                                                    Value
                                                </div>
                                                <div className="col-8 my-1">
                                                    <Select
                                                        value={selectedTOP}
                                                        onChange={(e) => setSelectedTOP(e.target.value)}
                                                    >
                                                        <option value="1">
                                                            Container
                                                        </option>
                                                        <option value="2">
                                                            Truck
                                                        </option>
                                                        <option value="3">
                                                            Truck & Container
                                                        </option>
                                                    </Select>
                                                </div>
                                            </>
                                            :
                                            <>
                                            </>
                                }



                                {
                                    condition === "5" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Override TOP with
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />


                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }


                                {
                                    condition === "9" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Jumlah Week
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />


                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === "10" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Tulis Week yang diblok. pisahkan dengan koma
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />


                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === "11" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Blocking Week
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}

                                                >
                                                    <option value="-1">
                                                        Select Blocking Date
                                                    </option>
                                                    {liburday.map((item, id) => (
                                                        <option value={item.txt}>
                                                            {item.txt}
                                                        </option>
                                                    ))}
                                                </Select>



                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === "18" ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Select Default NTP
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}

                                                >
                                                    {loadingntp
                                                        ?
                                                        <option value="-1">
                                                            Loading...
                                                        </option>
                                                        :
                                                        <>
                                                            <option value="-1">
                                                                Select Default Notify Party
                                                            </option>
                                                            {listNtp.map((item, id) => (
                                                                <option value={item.company_id}>
                                                                   {item.company_id} - {item.company_name} 
                                                                </option>
                                                            ))}
                                                        </>
                                                    }

                                                </Select>
                                            </div>



                                        </>

                                        :
                                        <>
                                        </>
                                }




                            </div>
                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button className="btn btn-danger px-4 mx-1"
                                onClick={postItemData}
                                disabled={!condition || !distributor}
                            >Add</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>

            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalEdit}
                onClose={onCloseModalEdit}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Edit Condition</ModalHeader>
                        <ModalCloseButton
                            onClick={onCloseModalEdit}
                        />
                        <ModalBody>
                            <div className="row">

                                <div className="col-4 d-flex align-items-center">
                                    Distributor
                                </div>
                                <div className="col-8 my-1">
                                    <Select
                                        placeholder="Select Distributor"
                                        value={distributor}
                                        disabled
                                    >

                                        {companyList.map((val, idx) =>
                                            <>
                                                <option value={val.company_id}>
                                                    {val.company_name + " - " + val.company_id}
                                                </option>
                                            </>
                                        )}

                                    </Select>
                                </div>

                                <div className="col-4 d-flex align-items-center">
                                    Condition
                                </div>
                                <div className="col-8 my-1">
                                    <Select
                                        value={condition}
                                        placeholder="Select Condition"
                                        onChange={(event) => {
                                            setCondition(event.target.value); // Set the condition state variable with the value from the event
                                        }}

                                    >
                                        {treatmentConditionList.map((val, idx) => (
                                            <>
                                                <option value={val.id}>
                                                    {val.condition_name}
                                                </option>
                                            </>
                                        ))}
                                    </Select>
                                </div>

                                {
                                    condition === 3 ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Overwrite TOP
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                >
                                                    {termOfPayment.map((val, idx) => (
                                                        <>
                                                            <option value={val.DESC}>
                                                                {val.DESC}
                                                            </option>
                                                        </>
                                                    ))}
                                                </Select>
                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === 1 ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Value
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                >
                                                    <option value="1">
                                                        1
                                                    </option>
                                                    <option value="2">
                                                        2
                                                    </option>
                                                    <option value="3">
                                                        3
                                                    </option>
                                                </Select>
                                            </div>
                                        </>

                                        :

                                        <>
                                        </>
                                }
                                {
                                    condition === 7 ?



                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Value
                                            </div>
                                            <div className="col-8 my-1">
                                                <Select
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                >
                                                    <option value="1">
                                                        Container
                                                    </option>
                                                    <option value="2">
                                                        Truck
                                                    </option>
                                                    <option value="3">
                                                        Truck & Container
                                                    </option>
                                                </Select>
                                            </div>
                                        </>
                                        :
                                        <></>

                                }



                                {
                                    condition === 5 ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Override TOP with
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />


                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }





                                {
                                    condition === 11 ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Override Blocking Date with
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />

                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }

                                {
                                    condition === 15 || 16 ?

                                        <>
                                            <div className="col-4 d-flex align-items-center">
                                                Set Max Value
                                            </div>
                                            <div className="col-8 my-1">
                                                <Input
                                                    value={selectedTOP}
                                                    onChange={(e) => setSelectedTOP(e.target.value)}
                                                />

                                            </div>
                                        </>

                                        :
                                        <>
                                        </>
                                }






                            </div>
                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button
                                className="btn btn-warning px-4 mx-1"
                                onClick={async () => {
                                    if (condition === 11) {
                                        await sys_textEditBlockingDate();
                                    } else {
                                        await editItemData();
                                        console.log("Condition is not 11, calling editItemData()");
                                    }
                                }}
                                disabled={condition == null || !distributor} // Prevent accidental disabling when `condition` is 0
                            >
                                Edit
                            </button>

                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>

            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalDelete}
                onClose={onCloseModalDelete}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Delete Condition</ModalHeader>
                        <ModalCloseButton
                            onClick={onCloseModalDelete}
                        />
                        <ModalBody>
                            <div className="row">

                                Are you sure you want to delete special condition ID of {config_id} ?

                            </div>
                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button className="btn btn-danger px-4 mx-1"
                                onClick={deleteItemData}
                            >Delete</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>

        </div >

    );
}

export default Itemconfig
