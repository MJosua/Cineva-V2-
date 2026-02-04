import { Button, IconButton, Image, Input, InputGroup, InputRightElement, Modal, ModalBody, ModalContent, ModalHeader, ModalOverlay, Table, useDisclosure } from "@chakra-ui/react"
import AdminHeaderTW from "./Component/AdminHeader"
import { FaSearch } from "react-icons/fa"
import { API_URL } from "../../../../../config"
import { useEffect, useState } from "react"
import Axios from "axios"
import { BiDownload } from "react-icons/bi"
import * as XLSX from "xlsx"


function AdminEventTwWin() {


    const [listData, setListData] = useState([]);
    const [countData, setCountData] = useState([]);

    const getData = async () => {

        Axios.get(API_URL + `/event/eventtw2024win`, {
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

    const groupedData = listData.reduce((acc, item) => {
        // Ensure PrizeRank is a string or number
        const rank = item.PrizeRank;

        // Create a new group if it doesn't exist
        if (!acc[rank]) {
            acc[rank] = [];
        }

        // Push item into corresponding PrizeRank group
        acc[rank].push(item);

        return acc;
    }, {});


    const prizeMapping = {
        "1": "é ­çŽ: é›™äººé¦–çˆ¾ä¾†å›žæ©Ÿç¥¨",
        "2": "äºŒçŽ: ä¸¹å¯§åŒ…+ç‡™å¸ƒè²¼",
        "3": "ä¸‰çŽ: å…”å…”å£è¢‹çŸ­T",
        "4": "å…¶ä»–: æ¼”å”±æœƒæ‡‰æ´åŒ…",
        "5": "ç‡Ÿå¤šæ‹Œç‚’éºµä¹™ç®±",
        "6": "å…”å…”åŠé£¾",
        "7": "Pixelé€ åž‹é‘°åŒ™åœˆçµ„åˆ-éš¨æ©Ÿ ",
        "8": "è²¼ç´™çµ„åˆ",
    };


    // Function to export data as Excel
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        // Loop through each PrizeRank and create a worksheet
        Object.keys(groupedData).forEach((rank) => {
            const wsData = [
                ["#", "å§“å", "èº«åˆ†è­‰æˆ–å±…ç•™è­‰è™Ÿç¢¼", "é›»è©±", "è³¼è²·é€šè·¯å«åˆ†åº—", "è³¼è²·åŒ…æ•¸", "è³¼è²·æ—¥æœŸ"], // Headers
                ...groupedData[rank].map((item, index) => [
                    index + 1,
                    item.column_1,
                    item.column_2,
                    item.column_3,
                    item.column_4,
                    item.column_7,
                    item.column_6
                ])
            ];

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, `Prize Rank ${rank}`);
        });

        // Convert to binary
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

        // Create a Blob and generate a download link
        const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);

        // Create a temporary <a> tag and trigger the download
        const a = document.createElement("a");
        a.href = url;
        a.download = "PrizeRankData.xlsx";
        document.body.appendChild(a);
        a.click();

        // Clean up the URL object
        URL.revokeObjectURL(url);
    };



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
                                    <div className="col-12 d-flex justify-content-between align-items-center fw-bold">

                                        Winning List Table

                                        <Button colorScheme="teal"
                                            onClick={() => { exportToExcel() }}
                                        >
                                            <BiDownload className="me-3" />
                                            Download
                                        </Button>
                                    </div>


                                    <div className="col-12 mt-3">
                                        <div className="table-responsive">

                                            {Object.keys(groupedData).map((rank) => (
                                                <table className="table table-sm table-striped" key={rank} border="1" style={{ marginBottom: "20px", width: "100%" }}>
                                                    <thead>
                                                        <tr style={{ background: rank === "1" ? "red" : rank === "2" ? "blue" : "gray", color: "white" }}>
                                                            <th colSpan="7">{prizeMapping[rank] || `Prize Rank ${rank}`}</th>
                                                        </tr>
                                                        <tr>
                                                            <th> # </th>
                                                            <th> å§“å</th>
                                                            <th> èº«åˆ†è­‰æˆ–å±…ç•™è­‰è™Ÿç¢¼ </th>
                                                            <th> é›»è©± </th>
                                                            <th> è³¼è²·é€šè·¯å«åˆ†åº— </th>
                                                            <th> è³¼è²·åŒ…æ•¸ </th>
                                                            <th> è³¼è²·æ—¥æœŸ </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {groupedData[rank].map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.column_1}</td>
                                                                <td>{item.column_2}</td>
                                                                <td>{item.column_3}</td>
                                                                <td>{item.column_4}</td>
                                                                <td>{item.column_7}</td>
                                                                <td>{item.column_6}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ))}


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

export default AdminEventTwWin





