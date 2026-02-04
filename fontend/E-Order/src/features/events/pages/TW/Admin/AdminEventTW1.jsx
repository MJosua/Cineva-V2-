import { IconButton, Image, Input, InputGroup, InputRightElement, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Table, useDisclosure } from "@chakra-ui/react"
import AdminHeaderTW from "./Component/AdminHeader"
import { FaSearch } from "react-icons/fa"
import { API_URL } from "../../../../../config"
import { useEffect, useState } from "react"
import Axios from "axios"

function AdminEventTw() {


    const [listData, setListData] = useState([]);
    const [countData, setCountData] = useState([]);

    const getData = async () => {

        Axios.get(API_URL + `/event/showticket`, {
        })
            .then((res) => {
                console.log(res.data);
                setListData(res.data.data)
                setCountData(res.data.total)
            })
            .catch((err) => {
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


    return (
        <div className="container-fluid background-gradient-event-tw" style={{ minHeight: "100vh" }}
        >

            <div className="row px-0 ">

                <div className="col-12   px-0 position-relative ">
                    {/* Background */}


                    <div className="container-fluid h-100 w-100 zindex2">

                        <div className="row">
                            {/* Header */}
                            <div className="col-12 ">
                                <AdminHeaderTW />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="col-12">
                            <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                <div className="row">

                                    <div className="col-12">

                                        <InputGroup size='sm'>
                                            <Input
                                                pr='4.5rem'
                                                placeholder='Type to search'
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
                                                            ç™»éŒ„æ—¥æœŸ
                                                        </th>
                                                        <th>
                                                            å§“å
                                                        </th>
                                                        <th>
                                                            èº«åˆ†è­‰æˆ–å±…ç•™è­‰è™Ÿç¢¼
                                                        </th>
                                                        <th>
                                                            é›»è©±
                                                        </th>
                                                        <th>
                                                            è³¼è²·é€šè·¯å«åˆ†åº—
                                                        </th>
                                                        <th>
                                                            è³¼è²·åŒ…æ•¸
                                                        </th>
                                                        <th>
                                                            è³¼è²·æ—¥æœŸ
                                                        </th>
                                                        <th>
                                                            çµ±ä¸€ç™¼ç¥¨è™Ÿç¢¼
                                                        </th>

                                                        <th>
                                                            ä¸Šå‚³ç™¼ç¥¨ç…§ç‰‡
                                                        </th>

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {listData.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                {item.submit_date}
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
                                                                {item.column_7}
                                                            </td>
                                                            <td>
                                                                {item.column_6}
                                                            </td>
                                                            <td>
                                                                {item.column_5}
                                                            </td>

                                                            <td>
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

export default AdminEventTw





