import Axios from 'axios';
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../../../../config";
import { Box, Button, Image, Spinner } from '@chakra-ui/react';
import html2canvas from 'html2canvas';
import { FaDownLong } from 'react-icons/fa6';
import { FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import { formatDate } from '../../../../utils/DateFormatter';

function IndofoodPO({ order_id_by_child }) {
    const params = useParams();
    const order_id = params.so_id ? params.so_id : order_id_by_child;

    const [orderHeader, setOrderHeader] = useState([])
    const [orderDetail, setOrderDetail] = useState([])
    const [loading, setLoading] = useState(true)

    const getOrderData = () => {
        Axios.get(`${API_URL}/order/get_header_noToken/${order_id}`, {})
            .then((res) => {
                setOrderHeader(res.data.header);  // Order header
                setOrderDetail(res.data.details);  // Order details

                console.log("Fetched order data:", res.data);

                setLoading(false)
            })
            .catch((err) => {
                console.log("Error fetching order data:", err);
            });
    };


    useEffect(() => {
        getOrderData()
    }, [])
    let rowNumber = 1;

    const tableRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);





    const downloadDivAsPDF = (divRef, POName) => {
        if (!divRef.current) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // Measure the div height in pixels
        const divHeightPx = divRef.current.offsetHeight;
        const divWidthPx = divRef.current.offsetWidth;

        // Convert pixels to millimeters
        const mmPerPx = 0.264583; // 1px = 0.264583mm
        const divHeightMm = divHeightPx * mmPerPx;
        const divWidthMm = divWidthPx * mmPerPx;

        console.log(`Div Height (mm): ${divHeightMm}, Div Width (mm): ${divWidthMm}`);

        // A4 page dimensions in mm
        const pageHeightMm = 297;
        const pageWidthMm = 210;

        // If div is too wide, scale it down to fit
        const scaleFactor = divWidthMm > pageWidthMm ? pageWidthMm / divWidthMm : 1;

        // Ensure content fits within a single page before adding extra pages

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);


        doc.html(divRef.current, {
            callback: function (pdf) {
                let totalPages = Math.ceil(divHeightMm / pageHeightMm);
                console.log(`Total Pages Needed: ${totalPages}`);
                let pdfPageCount = pdf.internal.getNumberOfPages();
                for (let i = 1; i < totalPages; i++) {
                    pdf.addPage();
                    pdf.setPage(i + 1);
                    console.log(`Set to Page: ${i + 1}`);
                }

                if (totalPages === 1) {
                    pdf.setPage(1); // Ensure starting from page 1
                    console.log(`Set to Page: 1 `);
                }



                if (pdfPageCount > totalPages) {
                    for (let i = pdfPageCount; i > totalPages; i--) {
                        pdf.deletePage(i);
                        console.log(`Deleted Page: ${i}`);
                    }
                }

                pdf.setPage(1); // Ensure starting from page 1
                pdf.save(`POdocument-${POName}.pdf`);
            },
            x: 10,
            y: 10,
            width: Math.min(pageWidthMm - 20, divWidthMm), // Adjust width but keep margin
            windowWidth: divWidthPx * scaleFactor, // Ensure proper scaling
        });
    };








    return (
        <div className='d-flex justify-content-center '>
            <div className='container positino-relative h-100'>
                <div className='row  px-0'>
                    {!loading && (

                        <div className='col-12 my-2  d-flex justify-content-end'>
                            <Button
                                onClick={() => downloadDivAsPDF(tableRef, orderHeader.po_buyer)}
                                leftIcon={<FaDownload />} size={"sm"} colorScheme='teal'  >
                                Download
                            </Button>

                        </div>
                    )}
                </div>

                {loading ?
                    <div className='container-fluid  vh-100 d-flex justify-content-center align-items-center'>
                        <Spinner size="xl" />
                    </div>
                    :


                    <>
                        <div className='card pdf-content' ref={tableRef} style={{ maxWidth: "1000px" }}>
                            <div className='container-fluid'>

                                <div className='row'>
                                    <div className='col-12 fw-bold d-flex justify-content-center py-4 mt-2 mb-3 fs-3 '>
                                        PURCHASE ORDER (PO)
                                    </div>
                                    <div className='col-12 col-md-6 d-md-flex d-block justify-content-center' >
                                        <table className=' table-small text-start'>
                                            <thead>
                                                <tr>
                                                    <td className='fw-bold' >
                                                        Name
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.company_name}
                                                    </td>
                                                </tr>




                                                <tr>
                                                    <td className='fw-bold'>
                                                        PO Date
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.created_date}
                                                    </td>
                                                </tr>

                                                <tr>
                                                    <td className='fw-bold'>
                                                        {orderHeader.container_name === "Truck" ? "Truck" : "Cont. Size"} 
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.cont_qty} x {orderHeader.container_name}
                                                    </td>
                                                </tr>

                                                <tr className='align-top'>
                                                    <td className='fw-bold' style={{ minWidth: "150px" }}>
                                                        Port Of Discharge
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.port_shipment}
                                                    </td>
                                                </tr>

                                                <tr className='align-top'>
                                                    <td className='fw-bold'>
                                                        Ship To
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.ship_to},<br></br>
                                                        {orderHeader.street},<br></br>
                                                        {orderHeader.complex} &nbsp;
                                                        {orderHeader.city}, {orderHeader.country}
                                                    </td>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>

                                    <div className='col-12 col-md-6 d-md-flex d-block justify-content-center '>
                                        <table className='table-small text-start'>
                                            <thead>
                                                <tr>
                                                    <td className='fw-bold' >
                                                        Po Buyer
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.po_buyer}
                                                    </td>
                                                </tr>
                                                <tr className='align-top'>
                                                    <td className='fw-bold' style={{ minWidth: "150px" }}>
                                                        {
                                                            orderHeader.container_name === "Truck" ?
                                                                "Est. Delivery Date"
                                                                :
                                                                "Stuffing Week"
                                                        }




                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {
                                                            orderHeader.container_name === "Truck" ?
                                                                orderHeader.Stuffing_date_format
                                                                :
                                                                orderHeader.delv_week_desc
                                                        }
                                                    </td>
                                                </tr>



                                                <tr>
                                                    <td className='fw-bold'>
                                                        Incoterm
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2'>
                                                        {orderHeader.incoterm_name}
                                                    </td>
                                                </tr>

                                                <tr className='align-top'>
                                                    <td className='fw-bold'>
                                                        Bill To
                                                    </td>

                                                    <td>
                                                        :
                                                    </td>

                                                    <td className='ps-2 '>
                                                        {orderHeader.bill_to_name},<br></br>
                                                        {orderHeader.bill_to_street},<br></br>
                                                        {orderHeader.bill_to_complex} &nbsp;
                                                        {orderHeader.bill_to_city}, {orderHeader.bill_to_country}
                                                    </td>
                                                </tr>
                                            </thead>
                                        </table>
                                    </div>

                                    <div className='col-12 px-0 mt-4'>
                                        <div className='container-fluid px-0'>
                                            <table className='table w-100 table-bordered'>
                                                <thead>
                                                    <tr>
                                                        <th>
                                                            No
                                                        </th>
                                                        <th>
                                                            SKU Code
                                                        </th>
                                                        <th>
                                                            Description
                                                        </th>
                                                        <th className='text-center'>
                                                            Qty (ctn)
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className='text-center'>

                                                    {orderDetail.map((data, idx) => {
                                                        return (
                                                            <>
                                                                <tr key={`${idx}-1`}>
                                                                    <td>
                                                                        {rowNumber++}
                                                                    </td>
                                                                    <td className='text-start'>
                                                                        {data.prod_sku_1}
                                                                    </td>
                                                                    <td className='text-start text-uppercase'>
                                                                        {data.product_name_1}
                                                                    </td>
                                                                    <td>
                                                                        {data.qty1.toLocaleString()}
                                                                    </td>

                                                                </tr>
                                                                {data.qty2 !== 0 &&
                                                                    <tr key={`${idx}-2`} >
                                                                        <td>
                                                                            {rowNumber++}
                                                                        </td>
                                                                        <td className='text-start'>
                                                                            {data.prod_sku_2}
                                                                        </td>
                                                                        <td className='text-start text-uppercase'>
                                                                            {data.product_name_2}
                                                                        </td>
                                                                        <td>
                                                                            {data.qty2.toLocaleString()}
                                                                        </td>

                                                                    </tr>
                                                                }
                                                                {data.qty3 !== 0 &&

                                                                    <tr key={`${idx}-3`} >
                                                                        <td>
                                                                            {rowNumber++}
                                                                        </td>
                                                                        <td className='text-start'>
                                                                            {data.prod_sku_3}
                                                                        </td>
                                                                        <td className='text-start text-uppercase'>
                                                                            {data.product_name_3}
                                                                        </td>
                                                                        <td>
                                                                            {data.qty3.toLocaleString()}
                                                                        </td>

                                                                    </tr>
                                                                }
                                                            </>
                                                        )
                                                    })}
                                                    <tr >
                                                        <td colSpan="4" className='text-start pb-5'>
                                                            <div className='container-fluid'>
                                                                <div className='row'>
                                                                    <div className='col-12 px-0'>
                                                                        Remarks :

                                                                    </div>

                                                                    {orderDetail.map((data, idx) => {
                                                                        return (
                                                                            <div key={idx} className='col-12 px-0'>
                                                                                {data.remarks}
                                                                            </div>
                                                                        )
                                                                    })}

                                                                </div>
                                                            </div>
                                                        </td>

                                                    </tr>

                                                    <tr >
                                                        <td colSpan="4" className='text-start pb-5'>
                                                            <div className='container-fluid'>
                                                                <div className='row'>
                                                                    <div className='col-12 px-0 text-end'>
                                                                        Prepared by :
                                                                        <br></br>
                                                                        <span className='fw-bold text-capitalize'>
                                                                            {orderHeader.created_by}
                                                                        </span>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        </td>

                                                    </tr>



                                                </tbody >
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>


                }

            </div>
        </div >

    )
}

export default IndofoodPO





