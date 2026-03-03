import SearchBarComponent from "../../../../components/inputs/SearchBarComponent.jsx";
import { useNavigate } from "react-router-dom"
import OrderVolumeCompoenent from "../../../../components/reporting/OrderVolumeComponent";
import Top5DistributorComponent from "../../../../components/reporting/Top5DistributorComponent";
import Top5FlavourComponent from "../../../../components/reporting/Top5FlavourComponent";
import IncomingOrderComponent from "../../../../components/reporting/IncomingOrderComponent";
import OrderVolumeByCountryComponent from "../../../../components/reporting/OrderVolumeByCountryComponent";
import { seasonOut, logoutAction, loginAction } from "../../../../action/userAction";
import { Select } from "@chakra-ui/react";
import { useState } from "react";
import { Image } from "@chakra-ui/react";
import IncomingOrderbyWeek from "../../../../components/reporting/IncomingOrderbyWeek";
import Truckperpackcomponent from "../../../../components/reporting/Truckperpackcomponent";
import Sidebar from "../../../../components/layout/Sidebar.jsx";

function ReportingDashboard() {
    function formatNumberWithDots(number) {
        // Check if the input is undefined, null, or not a number
        if (number === undefined || number === null || isNaN(number)) {
            return "";
        }

        // If it's a valid number, proceed with formatting
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    const navigate = useNavigate();
    let userToken = localStorage.getItem("tokek");
    const [optionWeek, setOptionWeek] = useState(6);
    const [optiontype, setOptiontype] = useState("pack");
    const [week, setWeek] = useState("");
    const [datetype, setDatetype] = useState("monthly");
    function truncateText(text, maxLength) {
        // Split the text into words
        const words = text.split(' ');

        // Initialize an empty string to store the truncated text
        let truncatedText = '';

        // Loop through each word
        for (const word of words) {
            // Check if adding the current word will exceed the maxLength
            if ((truncatedText + word).length > maxLength) {
                break; // Stop if adding the current word exceeds maxLength
            }

            // Add the word to the truncatedText
            truncatedText += word + ' ';

            // If adding this word exceeds maxLength, don't include it and break
            if (truncatedText.length > maxLength) {
                truncatedText = truncatedText.trim();
                break;
            }
        }

        return truncatedText.trim();
    }
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
                                            &nbsp;/ Reporting
                                        </span>
                                    </div>
                                </div>

                                <div className="container-fluid card border_radius_10px px-3 pt-2 pb-3 shadow-sm">
                                    <div className="row">
                                        <div className="col-12 mt-1">
                                            <div className="container-fluid px-0" >
                                                <div className="row  d-flex justify-content-end">

                                                    <div className="col-8 text-start text_grey fw-bold fs-5">
                                                        Dashboard
                                                    </div>

                                                    <div className="col-2">

                                                        <Select
                                                            className=" text_grey border_radius_10px shadow-sm  "
                                                            onChange={(e) => { setOptionWeek(e.target.value) }}
                                                            size="sm"
                                                        >

                                                            <option value="week">
                                                                week
                                                            </option>

                                                            <option value="month">
                                                                month
                                                            </option>

                                                            <option value="year">
                                                                year
                                                            </option>


                                                        </Select>


                                                    </div>

                                                    <div className="col-2">

                                                        <Select
                                                            className=" text_grey border_radius_10px shadow-sm  "
                                                            onChange={(e) => { setOptiontype(e.target.value) }}
                                                            size="sm"
                                                        >

                                                            <option value="pack">
                                                                pack
                                                            </option>

                                                            <option value="carton">
                                                                carton
                                                            </option>

                                                        </Select>


                                                    </div>


                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 mt-4 ">
                                            <div className="container-fluid px-0 card py-2 w-100 h-100 border_radius_10px shadow-sm ">



                                                <OrderVolumeCompoenent
                                                    userToken={userToken}
                                                    seasonOut={seasonOut}
                                                    formatNumberWithDots={formatNumberWithDots}
                                                    optiontype={optiontype}
                                                    datetype={datetype}
                                                    week={week}
                                                    truncateText={truncateText}
                                                />



                                                <div className="container-fluid  py-2 w-100 h-100  ">
                                                    <div className='row px-0'>
                                                        <IncomingOrderComponent
                                                            userToken={userToken}
                                                            seasonOut={seasonOut}
                                                            optionWeek={optionWeek}
                                                            formatNumberWithDots={formatNumberWithDots}
                                                            optiontype={optiontype}
                                                            datetype={datetype}
                                                            week={week}


                                                        />

                                                    </div>
                                                </div>



                                            </div>




                                        </div>



                                        <div className="col-12 mt-4">
                                            <div className="container-fluid card py-2 w-100 h-100 border_radius_10px shadow-sm ">
                                                <div className='row px-0'>
                                                    <IncomingOrderbyWeek
                                                        userToken={userToken}
                                                        seasonOut={seasonOut}
                                                        formatNumberWithDots={formatNumberWithDots}
                                                        optiontype={optiontype}
                                                        datetype={datetype}
                                                        week={week}
                                                    />

                                                </div>
                                            </div>

                                        </div>

                                        <div className="col-12 mt-4">
                                            <div className="container-fluid card py-2 w-100 h-100 border_radius_10px shadow-sm ">
                                                <div className='row px-0'>
                                                    <div className="col-12 text-start grey_text_16px mb-2">
                                                        TOP 10 ORDER VOLUME BY COUNTRY & DISTRIBUTOR
                                                    </div>
                                                    <div className="col-7  ps-0 pe-2">

                                                        <OrderVolumeByCountryComponent
                                                            userToken={userToken}
                                                            seasonOut={seasonOut}
                                                            formatNumberWithDots={formatNumberWithDots}
                                                            optiontype={optiontype}
                                                            datetype={datetype}
                                                            week={week}
                                                        />

                                                    </div>

                                                    <div className="col-5 mb-2 ps-2 pe-0">
                                                        <div className="container-fluid px-0">
                                                            <div className="row">
                                                                <div className="col-12">
                                                                    <Top5DistributorComponent
                                                                        userToken={userToken}
                                                                        seasonOut={seasonOut}
                                                                        formatNumberWithDots={formatNumberWithDots}
                                                                        optiontype={optiontype}
                                                                        datetype={datetype}
                                                                        week={week}
                                                                        truncateText={truncateText}
                                                                    />
                                                                </div>

                                                                {/* <div className="col-6 mt-3">
                                                                    <Top5FlavourComponent
                                                                        userToken={userToken}
                                                                        seasonOut={seasonOut}
                                                                        formatNumberWithDots={formatNumberWithDots}
                                                                        optiontype={optiontype}
                                                                        datetype={datetype}
                                                                        week={week}
                                                                    />
                                                                </div>

                                                                <div className="col-6 mt-3">
                                                                    <Top5FlavourComponent
                                                                        userToken={userToken}
                                                                        seasonOut={seasonOut}
                                                                        formatNumberWithDots={formatNumberWithDots}
                                                                        optiontype={optiontype}
                                                                        datetype={datetype}
                                                                        week={week}
                                                                    />
                                                                </div> */}

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
                </div>
            </div >
        </>
    )
}
export default ReportingDashboard






