import React, { useState, useEffect } from "react";
import SearchBarComponent from "../../components/SearchBarComponent"
 ;
import { useNavigate } from "react-router-dom"

import { API_URL } from "../../config";
import Axios from "axios";
import { seasonOut } from '../../action/userAction'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    Select,
    Spinner,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure
} from '@chakra-ui/react'

import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import Sidebar from "../../components/Sidebar";

const EventAuditPage = () => {

    const navigate = useNavigate()

    const { isOpen, onOpen, onClose } = useDisclosure()


    let userToken = (localStorage.getItem('hots_tokek'));

    const [dataEventAudit, setDataEventAudit] = useState([])

    const [page, setPage] = useState("1");
    const [limit, setLimit] = useState("10");
    const [totalPage, setTotalPage] = useState("1");
    const [totalDataLength, setTotalDataLength] = useState("1");

    const [loading, setLoading] = useState(true);
    const [queryData, setQueryData] = useState('')



    const getEventAuditLog = () => {
        Axios.get(API_URL + `/admin/audit?page=${page}&limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        }).then((res) => {
            setDataEventAudit(res.data.packet);
            setTotalDataLength(res.data.totalDataLength);
            setPage(res.data.page);
            setTotalPage(res.data.totalPage);
            setLoading(false)

        }).catch((err) => {
            console.log("error Axios getOrderHeader", err)
        })
    }

    useEffect(() => {
        getEventAuditLog()
    }, [
        loading,
        limit,
        page
    ])


    const handlePageChange = (value) => {
        setPage(value)
    }

    const pageIndices = [...Array(totalPage).keys()];

    const printEventAuditLog = () => {

        return dataEventAudit.map((header, idx) => {
            return (
                <tr scope="row">
                    <td className=" col-3 text-start">
                        {header.time_event}
                    </td>
                    <td className="col-3 text-start  ">
                        {header.uid}
                    </td>
                    <td className="col-2  text-start">
                        {header.user_id}
                    </td>
                    <td className={header.function_name.includes('add' || 'delete') ? "col-2 bg-danger text-white text-start " : header.function_name.includes('login') ? "col-2 bg-primary text-white text-start " : "col-2  text-start"}>
                        {header.function_name}
                    </td>
                    <td onClick={() => { onOpen(); setQueryData(header.sql_code) }}
                        className="pointer col-4 text-start" >
                        Show SQL

                    </td>
                </tr >
            );
        });
    };

    return (
        <>


            {/* MAIN PAGE */}
            <div>
                {/* navbar */}
                <SearchBarComponent />

                <div>
                    <div className="py-5 mt-2 stick-left">
                        <div className="row">
                            <div className="col-6 col-sm-12"></div>
                            <div className="col-6 col-sm-12">
                                <Sidebar />
                            </div>
                        </div>
                    </div>

                    <div className="py-5 w-100">
                        {/* CONTENT BELOW */}

                        <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
                            {/* HEADER */}
                            <div className="row text-secondary pb-3 user-select-none" >
                                <div className="col-12 d-flex  pt-3 pb-3 ps-4 ps-md-0 justify-content-between">
                                    <div>
                                        <span
                                            onClick={() => navigate("/e-order/dashboard")}
                                            className="pointer grey_text_normal_20px">
                                            e-order
                                        </span>
                                        <span className="grey_text_20px">
                                            &nbsp;/ Action Audit Page
                                        </span>
                                    </div>




                                    {/* LIMITER PAGINATION */}
                                    <div className="col-3 d-flex align-items-start px-0">
                                        <div className="col-12  py-1  mt-2">
                                            <p className="fs-6 pb-0">
                                                total {totalDataLength} data founded
                                            </p>

                                            <div className="container">
                                                <div className="row  text-primary ">
                                                    <div className="row d-flex justify-content-end">
                                                        <div className="col px-0 d-flex text-secondary align-items-center justify-content-end pe-2">
                                                            Show by
                                                        </div>
                                                        <div className="col px-0 d-flex text-secondary">

                                                            <Select value={limit}
                                                                size="sm"
                                                                onChange={(e) => setLimit(e.target.value)}
                                                            >
                                                                <option value="15">
                                                                    15
                                                                </option>
                                                                <option value="25">
                                                                    25
                                                                </option>
                                                                <option value="100">
                                                                    100
                                                                </option>
                                                                <option value="100">
                                                                    500
                                                                </option>
                                                                <option value="100">
                                                                    1000
                                                                </option>
                                                                <option value="999999999">
                                                                    All
                                                                </option>

                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>


                                <div className="col-12">

                                    {loading ? (
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
                                    ) :
                                        <>
                                            <div className=" table-responsive  mt-4">
                                                <table
                                                    style={{ width: "1050px" }}
                                                    id="TableDataReport"
                                                    className="table    table-hover table-bordered table-striped"
                                                >
                                                    <thead className="table-dark">
                                                        <tr >
                                                            <th scope="col"  >
                                                                Time Event
                                                            </th>
                                                            <th scope="col"  >
                                                                Username
                                                            </th>
                                                            <th scope="col" >
                                                                User ID
                                                            </th>
                                                            <th scope="col"  >
                                                                Function
                                                            </th>
                                                            <th scope="col"  >
                                                                SQL
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>

                                                        {printEventAuditLog()}
                                                    </tbody>

                                                </table>
                                            </div>




                                        </>
                                    }

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >



            {/* PAGINATION */}

            <>
                {totalPage !== 0 && page && (
                    <div className="col-12 d-flex justify-content-center mt-3">
                        <nav aria-label="Page navigation example">
                            <ul className="pagination text_muted">


                                <li className="page-item d-flex align-items-center fs-6">
                                    <a className="page-link text-dark d-flex align-items-center"
                                        style={{ height: "37px" }}
                                        onClick={() => {
                                            if (page != 1) {
                                                setPage(page - 1)
                                            }
                                        }}
                                    >
                                        <BsChevronLeft />
                                    </a>
                                </li>



                                {!([1, 2, 3, 4, 5, 6].includes(page)) ?
                                    <>

                                        <li

                                            className="page-item d-flex align-items-center fs-6">
                                            <a className="page-link text-muted"
                                                style={{ height: "37px" }}
                                                onClick={() => handlePageChange(1)}
                                                href="#"
                                            >
                                                1
                                            </a>
                                        </li>
                                        <li

                                            className="page-item d-flex align-items-center fs-6">
                                            <a className="user-select-none page-link text-muted"
                                                style={{ height: "37px" }}

                                            >
                                                ...
                                            </a>
                                        </li>

                                    </>

                                    :
                                    ""
                                }

                                {pageIndices.map(index => {
                                    // Calculate the range of pages to display
                                    const start = Math.max(1, page - 3);
                                    const end = Math.min(totalPage, page + 3);
                                    // Only render page numbers within the range
                                    if (index + 1 >= start && index + 1 <= end) {
                                        return (
                                            <li className="page-item d-flex align-items-center fs-6" key={index}>
                                                <a className={("page-link ") + (page === index + 1 ? "fw-bold text-danger" : "text-muted")}
                                                    style={{ height: "37px" }}
                                                    onClick={() => handlePageChange(index + 1)}
                                                    href="#"
                                                >
                                                    {index + 1}
                                                </a>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}

                                {!([totalPage, totalPage - 1, totalPage - 2, totalPage - 3, totalPage - 4, totalPage - 5].includes(page)) ?
                                    <>

                                        <li

                                            className="page-item d-flex align-items-center fs-6">
                                            <a className="user-select-none page-link text-muted"
                                                style={{ height: "37px" }}

                                            >
                                                ...
                                            </a>
                                        </li>

                                        <li

                                            className="page-item d-flex align-items-center fs-6">
                                            <a className="page-link text-muted"
                                                style={{ height: "37px" }}
                                                onClick={() => handlePageChange(totalPage)}
                                                href="#"
                                            >
                                                {totalPage}
                                            </a>
                                        </li>


                                    </>

                                    :
                                    ""
                                }

                                <li className="page-item d-flex align-items-center fs-6">
                                    <a className="page-link text-dark  d-flex align-items-center"
                                        style={{ height: "37px" }}
                                        onClick={() => {
                                            if (page != totalPage) {
                                                setPage(page + 1)
                                            }
                                        }}
                                    >
                                        <BsChevronRight />
                                    </a>
                                </li>



                            </ul>
                        </nav>
                    </div>
                )}
            </>


            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Modal Title</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {queryData}
                    </ModalBody>

                </ModalContent>
            </Modal>
        </>
    )

}

export default EventAuditPage;
