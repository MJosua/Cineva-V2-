import React, { useState, useEffect } from "react"
import SearchBarComponent from "../../components/SearchBarComponent"
    ;
import { useNavigate } from "react-router-dom"
import {
    Button,
    Input,
    Select,
    Spinner,


} from "@chakra-ui/react"
import Axios from "axios";
import { API_URL } from "../../config";
import { seasonOut } from '../../action/userAction'
import SearchFilterComponent from "../../components/SearchFilterComponent"
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import * as XLSX from 'xlsx';
import LimiterComponent from "../../components/LimiterComponent"
import Sidebar from "../../components/Sidebar";




function OrderReport() {
    const navigate = useNavigate()

    const handlePageDecrement = () => {
        if (page != 1) {
            setPage(page - 1)
        }
    }

    const handlePageIncrement = () => {
        if (page != totalPage) {
            setPage(page + 1)
        }
    }



    const [page, setPage] = useState("");
    const [limit, setLimit] = useState("10");
    const [order_by_week, setOrder_by_week] = useState("");
    const [desc, setDesc] = useState("");
    const [status, setStatus] = useState("");
    const [stuffingstart, setStuffingstart] = useState("");
    const [stuffingend, setStuffingend] = useState("");
    const [find, setFind] = useState("");
    const [orderHeader, setOrderHeader] = useState([]);
    const [totalPage, setTotalPage] = useState(1);
    const [startWeek, setStartWeek] = useState([]);
    const [startWeek2, setStartWeek2] = useState([]);
    const [loading, setLoading] = React.useState(true);

    const [countryfilter, setCounryfilter] = useState();
    const [countryOption, setCountryOption] = useState([]);
    const pageIndices = [...Array(totalPage).keys()];

    const getOrderHeader = () => {
        let userToken = (localStorage.getItem('hots_tokek'));
        Axios.get(API_URL + `/spectator/all_order?page=${page}&country_id=${countryfilter}&limit=${limit}&order_by_week=${order_by_week}&desc=${desc}&status=${status}&stuffingstart=${stuffingstart}&stuffingend=${stuffingend}&find=${find}`, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        }).then((res) => {
            setOrderHeader(res.data.packet);
            setStartWeek(res.data.available_week);
            setStartWeek2(res.data.available_week);
            setLoading(false);
            console.log("data Axios getOrderHeader", res.data)
            setTotalPage(res.data.totalPage)
            setPage(res.data.page)
            setCountryOption(res.data.available_company_id)
        }).catch((err) => {
            console.log("error Axios getOrderHeader", err)
        })
    }
    useEffect(() => {
        getOrderHeader();
    }, [limit, status, page, find])

    const handlePageChange = (value) => {
        setPage(value)
        console.log("gantipage ke", value)
    }

    function formatNumberWithDots(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const printOrderHeader = () => {

        return orderHeader.map((header, idx) => {
            return (
                <tr scope="row"

                >
                    <td
                        onClick={(value) => {
                            sessionStorage.setItem(
                                "showDetailsOrderId",
                                header.order_id
                            );
                            setTimeout(() => {
                                navigate("/e-order/transaction/details");
                            }, 1500);
                        }}
                        className="pointer"
                    >
                        {header.country}
                    </td>
                    <td>
                        {header.distributor_name}
                    </td>
                    <td>
                        {header.port_of_discharge}
                    </td>
                    <td>
                        {header.order_id}
                    </td>
                    <td>
                        {header.po_buyer}
                    </td>
                    <td>
                        {header.product_sku}
                    </td>
                    <td>
                        {header.sum_of_qty}

                    </td>
                    <td>
                        {header.week_delivery}
                    </td>
                    <td>
                        {header.po_date}
                    </td>
                    <td>
                        {header.submitted_by}
                    </td>
                    <td>
                        {header.year}
                    </td>
                    <td>
                        {header.order_status}
                    </td>
                </tr>
            );
        });
    };


    const now = new Date(Date.now());

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;


    const prepareExcelContent = () => {
        const ws = XLSX.utils.json_to_sheet(orderHeader);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Order Header");
        const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    };

    const downloadFile = (content, fileName) => {
        const contentType = 'text/csv';
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        link.setAttribute('type', contentType); // Set Content-Type header
        link.setAttribute('target', '_blank'); // Open in new tab
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleDownload = () => {
        const excelContent = prepareExcelContent();
        downloadFile(excelContent, `Order_Report_${formattedDate}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    };

    return (
        <>
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
                            <div className="pb-5 pt-4 ">
                                {/* HEADER */}
                                <div className="row text-secondary pb-3 user-select-none" >
                                    <div className="col-12 d-flex  pt-1 pb-3 ps-4 ps-md-0">
                                        <span
                                            onClick={() => navigate("/e-order/dashboard")}
                                            className="pointer grey_text_normal_20px">
                                            e-order
                                        </span>
                                        <span className="grey_text_20px">
                                            &nbsp;/ Order List
                                        </span>
                                    </div>
                                </div>


                                <SearchFilterComponent
                                    getOrderHeader={getOrderHeader}
                                    orderHeader={orderHeader}
                                    page={page}
                                    setPage={setPage}
                                    limit={limit}
                                    setLimit={setLimit}
                                    totalPage={totalPage}
                                    setTotalPage={setTotalPage}
                                    order_by_week={order_by_week}
                                    setOrder_by_week={setOrder_by_week}
                                    desc={desc}
                                    setDesc={setDesc}
                                    status={status}
                                    setStatus={setStatus}
                                    stuffingstart={stuffingstart}
                                    setStuffingstart={setStuffingstart}
                                    stuffingend={stuffingend}
                                    setStuffingend={setStuffingend}
                                    find={find}
                                    setFind={setFind}
                                    loading={loading}
                                    setLoading={setLoading}

                                />
                                <div className="row  d-flex justify-content-end px-0 ">
                                    <div className="col-3 d-flex align-items-center px-0">
                                        <LimiterComponent
                                            limit={limit}
                                            setLimit={setLimit}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 mt-1 mb-2 pb-3 card shadow py-2 border_radius_10px">
                                        <div className="row d-flex justify-content-end  pt-2">
                                            <div className="col-2">
                                                <Button size="sm" colorscheme='teal' variant='outline' onClick={handleDownload}>Download Excel</Button>
                                            </div>

                                            <div className="col-2">
                                                <div className="card">
                                                    <Select
                                                        className="border_radius_10px"
                                                        size="sm"
                                                        onChange={(e) => setCounryfilter(e.target.value)}
                                                    >
                                                        <option value="">
                                                            Country
                                                        </option>

                                                        {countryOption.map((coption, idx) => (
                                                            <option key={idx} value={coption.company_id}>
                                                                {coption.company_name}
                                                            </option>
                                                        ))}

                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="col-2">
                                                <div className="card">
                                                    <Select
                                                        className="border_radius_10px"
                                                        size="sm"
                                                    >
                                                        <option value="pack">
                                                            Pack
                                                        </option>
                                                        <option value="carton">
                                                            Carton
                                                        </option>
                                                    </Select>
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
                                                            style={{ width: "1900px" }}
                                                            id="TableDataReport"
                                                            className="table    table-hover table-bordered table-striped"
                                                        >
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th scope="col"



                                                                    >
                                                                        Country
                                                                    </th>
                                                                    <th scope="col">
                                                                        Distributor Name
                                                                    </th>
                                                                    <th scope="col">
                                                                        Port of Discharge
                                                                    </th>
                                                                    <th scope="col">
                                                                        Order ID
                                                                    </th>
                                                                    <th scope="col">
                                                                        PO Buyer
                                                                    </th>
                                                                    <th scope="col">
                                                                        Product SKU
                                                                    </th>
                                                                    <th scope="col">
                                                                        Quantity
                                                                    </th>
                                                                    <th scope="col">
                                                                        Delivery Week
                                                                    </th>
                                                                    <th scope="col">
                                                                        PO Date
                                                                    </th>
                                                                    <th scope="col">
                                                                        Submitted By
                                                                    </th>
                                                                    <th scope="col">
                                                                        Year
                                                                    </th>
                                                                    <th scope="col">
                                                                        Status
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>

                                                                {printOrderHeader()}
                                                            </tbody>

                                                        </table>
                                                    </div>




                                                </>
                                            }


                                        </div>

                                    </div>
                                    {(totalPage === 0 || !page) ?
                                        " "
                                        :
                                        <div className="col-12 d-flex justify-content-center mt-3">
                                            <nav aria-label="Page navigation example">
                                                <ul className="pagination text_muted">


                                                    {totalPage !== 0 && page && (
                                                        <div className="col-12 d-flex justify-content-center mt-3">
                                                            <nav aria-label="Page navigation example">
                                                                <ul className="pagination text_muted">


                                                                    <li className="page-item d-flex align-items-center fs-6">
                                                                        <a className="page-link text-dark d-flex align-items-center"
                                                                            style={{ height: "37px" }}
                                                                            onClick={handlePageDecrement}
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
                                                                            onClick={handlePageIncrement}
                                                                        >
                                                                            <BsChevronRight />
                                                                        </a>
                                                                    </li>



                                                                </ul>
                                                            </nav>
                                                        </div>
                                                    )}

                                                </ul>
                                            </nav>
                                        </div>
                                    }

                                </div>





                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}
export default OrderReport
