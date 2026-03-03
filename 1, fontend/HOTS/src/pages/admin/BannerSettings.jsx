import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import { useDispatch } from "react-redux";
import { API_URL } from "../../config";

import { AiFillCloseCircle } from "react-icons/ai";
import SearchBarComponent from "../../components/SearchBarComponent";

import Sidebar from "../../components/Sidebar";

import { clearSeasonStorage } from "../../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../../action/userAction";


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

import BannerComponentGlobal from "../../components/BannerComponentGlobal";


// import LogoBar from "../components/LogoBar";

function Itemconfig() {

    const dispatch = useDispatch();
    const toast = useToast();
    const [id, setId] = useState(0);


    const navigate = useNavigate();
    const [refresh, setRefresh] = useState(false);

    const handleRefresh = () => {
        // Toggle the refresh state to trigger a re-render of BannerComponent
        setRefresh(!refresh);
    };
    const [loading, setLoading] = useState(true);
    const [image, setImage] = React.useState(null);
    const [ending_date, setEndingDate] = useState();
    const [starting_date, setStartingDate] = useState();
    const [caption_remarks, setCaptionRemarkDate] = useState();
    const [admin_remarks, setAdminRemarkDate] = useState();

    const fileInputRef = React.useRef();

    const [userData, setUserData] = useState([]);

    const getUserData = () => {
        let userToken = localStorage.getItem("tokek");
        Axios.get(API_URL + "/admin/account", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setUserData(res.data.results);
                setLoading(false);
            })
            .catch((err) => {

            });
    };

    const onSubmit = async () => {
        let userToken = localStorage.getItem("tokek");

        if (image === '') {
            toast({
                title: "Oopsie!",
                description: 'Image form should not be empty',
                status: "warning",
                duration: 6000,
                isClosable: true,
            });
        } else {

            const data = new FormData();
            data.append('image', image);
            data.append('data', JSON.stringify({ company_id, starting_date, ending_date, caption_remarks, admin_remarks }));



            try {
                const response = await Axios.post(API_URL + "/admin/banner", data, {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    }
                });

                toast({
                    title: "Yeay!",
                    description: 'Thanks for your feedback',
                    status: "success",
                    duration: 6000,
                    isClosable: true,
                });

                // Update itemData at index 1 with the response data

                getItemData();
                onCloseModalBanner1Status();
                handleRefresh();
            } catch (error) {
                console.error("Error:", error);
                onCloseModalBanner1Status();
                toast({
                    title: "Oopsiee!",
                    description: 'Something bad just happened! Please try again!',
                    status: "error",
                    duration: 6000,
                    isClosable: true,
                });
            }
        }


    };

    const onEdit = async () => {
        let userToken = localStorage.getItem("tokek");

        if (image === '') {
            toast({
                title: "Oopsie!",
                description: 'Image form should not be empty',
                status: "warning",
                duration: 6000,
                isClosable: true,
            });
        } else {

            const data = new FormData();
            data.append('image', image);
            data.append('data', JSON.stringify({ company_id, starting_date, ending_date, caption_remarks, admin_remarks }));



            try {
                const response = await Axios.post(API_URL + "/admin/banner", data, {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                    }
                });

                toast({
                    title: "Yeay!",
                    description: 'Thanks for your feedback',
                    status: "success",
                    duration: 6000,
                    isClosable: true,
                });

                // Update itemData at index 1 with the response data

                getItemData();
                onCloseModalBanner1Status();
                handleRefresh();
            } catch (error) {
                console.error("Error:", error);
                onCloseModalBanner1Status();
                toast({
                    title: "Oopsiee!",
                    description: 'Something bad just happened! Please try again!',
                    status: "error",
                    duration: 6000,
                    isClosable: true,
                });
            }
        }


    };


    const deleteData = async (id) => {
        let userToken = localStorage.getItem("tokek");
        try {
            await Axios.delete(`${API_URL}/admin/banner/`, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
                data: {
                    id: id
                }
            });
            getItemData();
            onCloseDeleteBanner();
            handleRefresh();
        } catch (error) {
            console.error('Failed to delete data:', error);
        }
    };



    const [itemData, setItemData] = useState([]);

    const getItemData = async () => {
        let userToken = localStorage.getItem("tokek");
        await Axios.get(API_URL + `/admin/banner`, {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setItemData(res.data.results);
                setLoading(false);
                console.log(itemData)
            })
            .catch((err) => {
                console.log("Gagal");
            });
    };

    React.useEffect(() => {
        getItemData();
        getUserData();
    }, []);

    const {
        isOpen: isOpenModalBanner1Status,
        onOpen: onOpenModalBanner1Status,
        onClose: onCloseModalBanner1Status,
    } = useDisclosure();

    const {
        isOpen: isEditModalBanner1Status,
        onOpen: onEditModalBanner1Status,
        onClose: onCloseEditModalBanner1Status,
    } = useDisclosure();

    const {
        isOpen: isOpenDeleteBanner,
        onOpen: onOpenDeleteBanner,
        onClose: onCloseDeleteBanner,
    } = useDisclosure();

    const [dataBanner, setDataBanner] = useState()
    const handleOpenBanner = (value) => {
        console.log("jalan")
        setDataBanner(value)
        console.log(value)

        if (dataBanner !== undefined) {
            onEditModalBanner1Status();
        }
    }


    const printAllCountry = () => {
        const uniqueCountry = new Set();

        return userData
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



    const [countryValue, setCountryValue] = useState("");
    const handleCountryValueChange = (event) => {
        setCountryValue(event.target.value);

    };

    const printAllDistributor = () => {

        return userData
            .filter((distributor) =>

                (!countryValue || distributor.country_desc === countryValue)
            )
            .map((val, idx) => {


                return (
                    <option key={idx} value={String(val.user_id).substring(0, 3)}>
                        {val.uid} - {String(val.user_id).substring(0, 3)}
                    </option>
                );


            });
    };

    const [distributorValue, setDistributorValue] = useState(999);

    const [company_id, setCompany_id] = useState(999);

    const handleDistributorValueChange = (event) => {
        const selectedValue = event.target.value;
        setDistributorValue(selectedValue);
        setCompany_id(selectedValue);
        // console.log("Selected distributor value:", selectedValue);
    };



    const filteredData = itemData.filter(item => item.company_id === parseInt(distributorValue, 10));

    const printCardMap = () => {
        const displayedCards = filteredData.slice(0, 4);
        const remainingEmptyCardsCount = Math.max(0, 4 - displayedCards.length);

        return (
            <div className="row">
                {displayedCards.map((item, idx) => (
                    <div key={idx} className="col-6 col-md-3 mb-2 mb-md-0 px-4">
                        <div
                            onClick={() => handleOpenBanner(item)}

                            className=" card border_radius_10px shadow-box pointer">
                            <button className="position-absolute top-0 start-100 translate-middle ">
                                <AiFillCloseCircle
                                    className="remove_cont_button"
                                    size={30}
                                    onClick={() => {
                                        setId(item.id);
                                        onOpenDeleteBanner(item.id);
                                    }}
                                />
                            </button>
                            <Image
                                height="90px"
                                src={`${API_URL}/image${item.img_url}`}
                                crossOrigin="anonymous"
                                className="border_radius_10px"
                            />
                        </div>
                    </div>
                ))}

                {[...Array(remainingEmptyCardsCount).keys()].map((_, idx) => (
                    <div key={idx + displayedCards.length} className="col-md-3 col-6 mb-2 mb-md-0 px-4">
                        <div className="shadow-sm card hover-pink border_radius_10px d-flex align-items-center justify-content-center" onClick={onOpenModalBanner1Status}>
                            <div className="position-absolute">+</div>
                            <Image height="90px" />
                        </div>
                    </div>
                ))}
            </div>
        );
    };


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
                                        &nbsp;/ Banner Settings
                                    </span>
                                </div>
                            </div>
                            <div className="mb-2 d-flex justify-content-start  ">

                                <div className="card shadow mt-4 px-3 py-4 text-secondary w-100 border_radius_10px">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="text-start ps-2 fw-bold fs-4 pb-3">
                                                Banner List
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="row">
                                                <div className="col-6">
                                                    <Select
                                                        className="grey_text fs-6"
                                                        size="sm"
                                                        value={countryValue}
                                                        onChange={handleCountryValueChange}
                                                    >
                                                        <option value="">All Countries</option>
                                                        {printAllCountry()}
                                                    </Select>
                                                </div>
                                                <div className="col-6">
                                                    <Select
                                                        className="grey_text fs-6"
                                                        size="sm"
                                                        disabled={!countryValue}
                                                        onChange={handleDistributorValueChange}
                                                    >
                                                        <option value="999">All Distributor</option>
                                                        {printAllDistributor()}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">

                                        {printCardMap()}







                                    </div>
                                </div>



                            </div>
                            <div className="col-12">
                                <div className=" text-start my-3 fs-3 text-secondary fw-bold ps-1">
                                    Preview
                                </div>
                                <BannerComponentGlobal key={refresh ? 'refreshed' : 'initial'} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                size="xl"
                onClose={onCloseModalBanner1Status}
                isOpen={isOpenModalBanner1Status}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Upload your Banner Here
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="row px-5 mt-4 ">


                            <div className="col-3 text-end fw-bold mb-2">
                                Image
                                <br></br>
                                <div style={{ fontSize: "10px" }}>
                                    JPG / PNG only
                                </div>
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="file"
                                    accept=".jpg, .jpeg, .png"
                                    ref={fileInputRef}
                                    onChange={(event) => setImage(event.target.files[0])}
                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Starting Date
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    onChange={(e) => setStartingDate(e.target.value)}
                                    type="datetime-local"
                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Ending Date
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    onChange={(e) => setEndingDate(e.target.value)}
                                    type="datetime-local"

                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Caption Remark
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="text"
                                    onChange={(e) => setCaptionRemarkDate(e.target.value)}
                                />
                            </div>

                            <div className="col-3 text-end  fw-bold mb-2">
                                Admin Remark
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="text"
                                    onChange={(e) => setAdminRemarkDate(e.target.value)}
                                />
                            </div>

                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorscheme='yellow' mr={3}
                            onClick={onSubmit}>
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                size="xl"
                onClose={onCloseEditModalBanner1Status}
                isOpen={isEditModalBanner1Status}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Edit Banner
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="row px-5 mt-4 ">

                            <div className="col-12 d-flex justify-content-center mt-1 mb-4">
                                <div className="card border_radius_10px ">
                                    <Image
                                        height="90px"
                                        src={dataBanner !== undefined ? `${API_URL}/image${dataBanner.img_url}` : ""}
                                        crossOrigin="anonymous"
                                        className="border_radius_10px"
                                    />
                                </div>
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Image
                                <br></br>
                                <div style={{ fontSize: "10px" }}>
                                    JPG / PNG only
                                </div>
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="file"
                                    accept=".jpg, .jpeg, .png"
                                    ref={fileInputRef}
                                    onChange={(event) => setImage(event.target.files[0])}
                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Starting Date
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    onChange={(e) => setDataBanner({ ...dataBanner, starting_date: e.target.value })}
                                    type="datetime-local"

                                    value={dataBanner !== undefined ? dataBanner.starting_date : ""}
                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Ending Date
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    // onChange={(e) => setDataBanner({ ...dataBanner, ending_date: e.target.value })
                                    onChange={(e) => console.log("hasilEdit", dataBanner)
                                    }
                                    type="datetime-local"
                                    value={dataBanner !== undefined ? dataBanner.ending_date : ""}
                                />
                            </div>

                            <div className="col-3 text-end fw-bold mb-2">
                                Caption Remark
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="text"
                                    onChange={(e) => setCaptionRemarkDate(e.target.value)}
                                    value={dataBanner !== undefined ? (dataBanner.caption_remarks === "undefined" ? "-" : dataBanner.caption_remarks) : ""}
                                />
                            </div>

                            <div className="col-3 text-end  fw-bold mb-2">
                                Admin Remark
                            </div>

                            <div className="col-9 mb-2">
                                <input
                                    className="form-control shadow-sm border_radius_10px"
                                    type="text"
                                    onChange={(e) => setAdminRemarkDate(e.target.value)}
                                    value={dataBanner !== undefined ? (dataBanner.admin_remarks === "undefined" ? "-" : dataBanner.admin_remarks) : ""}
                                />
                            </div>

                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorscheme='yellow' mr={3}
                            onClick={onEdit}>
                            Edit
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>



            <Modal

                onClose={onCloseDeleteBanner}
                isOpen={isOpenDeleteBanner}
            >
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                        Delete Banner
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="row px-5 mt-4 pb-2">
                            <div className="col-12 text-end fw-bold">
                                Are You Sure to Delete this Banner ?
                            </div>


                        </div>


                    </ModalBody>
                    <ModalFooter>
                        <Button colorscheme='yellow' mr={3}
                            onClick={() => deleteData(id)}
                        >

                            Delete
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>

    );
}

export default Itemconfig
