import { Navigate } from "react-router-dom"
import SearchBarComponent from "../../components/SearchBarComponent"
import Sidebar from "../../components/Sidebar"
import TncInside from "./TncInside"

function TncLogin() {
    return (
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

                    <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
                        <div className="pb-5 pt-4 ">
                            <div>
                                <div className="row user-select-none">

                                    <div className="col-12 text-secondary d-flex  pt-1 ps-4 ps-md-0">
                                        <span
                                            onClick={() => Navigate("/e-order/dashboard")}
                                            className="pointer grey_text_normal_20px">
                                            e-order / Help
                                        </span>
                                        <span className="grey_text_20px">
                                            &nbsp; / User Agreement
                                        </span>
                                    </div>
                                </div>

                                <div className="row mt-4">

                                    <TncInside />
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div>
    )
}

export default TncLogin