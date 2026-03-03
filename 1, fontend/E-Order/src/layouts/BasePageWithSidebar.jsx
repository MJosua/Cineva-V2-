import { Spinner } from "@chakra-ui/react"
import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import Sidebar from "../components/layout/Sidebar.jsx";

function BasePageWithSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const lastSegment = location.pathname
        .split("/") // Split the path into segments
        .filter(Boolean) // Remove empty segments
        .pop() // Get the last segment
        ?.replace(/_/g, " ") // Remove all underscores
        .toUpperCase(); // Convert to uppercase


    return (
        <div>
            {/* navbar */}

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
                    <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
                        <div className="pb-5 pt-4 ">
                            <div className="row text-secondary pb-3 user-select-none">

                                <div className="col-12 d-flex  pt-1 ps-4 ps-md-0">
                                    <span
                                        onClick={() => navigate("/e-order/dashboard")}
                                        className="pointer grey_text_normal_20px">
                                        e-order
                                    </span>
                                    <span className="grey_text_20px">
                                        &nbsp;/ {lastSegment}
                                    </span>
                                </div>



                                <div className="col-12 px-0">
                                    <div className="container-fluid d-flex jusify-content-start px-0 py-4" >

                                        <Outlet />

                                    </div>

                                </div>

                            </div>
                            {/* ================================================================= CONTENT BELOW ================================================================= */}





                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default BasePageWithSidebar




