import { IconButton, Image, Input, InputGroup, InputRightElement, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Table, useDisclosure } from "@chakra-ui/react"
import AdminHeaderTW from "./Component/AdminHeader"
import { FaSearch } from "react-icons/fa"
import { API_URL } from "../../../../../config"
import { useEffect, useState } from "react"
import Axios from "axios"

function AdminEventUSA1() {


    const [listData, setListData] = useState([]);
    const [countData, setCountData] = useState([]);

    const getData = async () => {
        console.log("API_URL", API_URL)
        Axios.get(API_URL + `/event/eventForm/704/1`, {
        })
            .then((res) => {
                console.log(res.data);
                setListData(res.data.data)
                setCountData(res.data.total)
            })
            .catch((err) => {
                console.log("Error", err)

            });

    }

    useEffect(() => {
        getData();
    }, [])

    const {
        isOpen: isOpenModalPreview,
        onOpen: onOpenModalPreview,
        onClose: onCloseModalPreview,
    } = useDisclosure();


    const [item, setItem] = useState({});

    const [search, setSearch] = useState("");

    const formatDate = (dateString, formatType = "DD/MM/YYYY") => {
        if (!dateString) return "Invalid Date";

        const date = new Date(dateString);
        if (isNaN(date)) return "Invalid Date";

        const options = {
            "DD/MM/YYYY": { day: "2-digit", month: "2-digit", year: "numeric" },
            "DD MMM YYYY": { day: "2-digit", month: "short", year: "numeric" },
            "DD MMM YYYY, HH:mm": {
                day: "2-digit", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: false
            }
        };

        return date.toLocaleDateString("en-GB", options[formatType] || options["DD/MM/YYYY"]);
    };
    return (
        <div className="container-fluid background-event-usa" style={{ minHeight: "100vh" }}
        >

            <div className="row px-0 ">

                <div className="col-12   px-0 position-relative ">
                    {/* Background */}


                    <div className="container-fluid h-100 w-100 my-5 zindex2">

                        <div className="row ">
                            {/* Header */}
                            <div className="col-12 ">
                                <AdminHeaderTW />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="col-12 my-5">
                            <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                <div className="row">

                                    <div className="col-12">

                                        <InputGroup size='sm'>
                                            <Input
                                                pr='4.5rem'
                                                placeholder='Type to search'
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                            />
                                            <InputRightElement width='4.5rem'>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <FaSearch />
                                                </IconButton>
                                            </InputRightElement>
                                        </InputGroup>
                                    </div>
                                    <div className="col-12 text-start my-1 ps-4" style={{ fontSize: "12px" }}>
                                        Total : {countData}
                                    </div>

                                    <div className="col-12 mt-3">
                                        <div className="table-responsive">
                                            <table className="table table-sm table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            #
                                                        </th>
                                                        <th>
                                                            Date
                                                        </th>
                                                        <th>
                                                            Name
                                                        </th>
                                                        <th>
                                                            TRANS ID
                                                        </th>
                                                        <th>
                                                            Phone
                                                        </th>
                                                        <th>
                                                            Full Address
                                                        </th>
                                                        <th>
                                                            Email
                                                        </th>
                                                        <th>
                                                            Preview Receipt
                                                        </th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {listData.filter(item => {
                                                        if (search === "") return true;

                                                        const lowerSearch = search.toLowerCase();

                                                        return (
                                                            item.column_1.toLowerCase().includes(lowerSearch) ||
                                                            item.column_2.toLowerCase().includes(lowerSearch) ||
                                                            item.column_3.toLowerCase().includes(lowerSearch) ||
                                                            item.column_4.toLowerCase().includes(lowerSearch) ||
                                                            item.column_5.toLowerCase().includes(lowerSearch)
                                                        );
                                                    }).map((item, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                {formatDate(item.submit_date)}
                                                            </td>
                                                            <td>
                                                                {item.column_1}
                                                            </td>
                                                            <td>
                                                                {item.column_2}
                                                            </td>
                                                            <td>
                                                                {item.column_3}
                                                            </td>
                                                            <td>
                                                                {item.column_4}
                                                            </td>
                                                            <td>
                                                                {item.column_5}
                                                            </td>
                                                            <td className="d-flex justify-content-center">
                                                                <Image
                                                                    src={`${API_URL}${item.file_path}`}
                                                                    maxWidth={"100px"}
                                                                    height={"auto"}
                                                                    className="pointer"
                                                                    onClick={onOpenModalPreview}
                                                                    onMouseEnter={() => setItem(item)}
                                                                />

                                                            </td>
                                                        </tr>


                                                    ))}
                                                    <tr>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                        <td>

                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>


            <Modal
                className="pb-5"
                onClose={onCloseModalPreview}
                isOpen={isOpenModalPreview}
            >
                <ModalOverlay />
                <ModalContent >

                    <ModalBody>
                        <Image
                            src={`${API_URL}${item.file_path}`}
                            maxWidth={"100%"}
                            height={"auto"}
                        />

                    </ModalBody>
                </ModalContent>
            </Modal>
        </div>
    )
}

export default AdminEventUSA1





