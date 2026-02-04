import React from "react";
import { useNavigate } from "react-router-dom";

const footer = () => {

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();


    return (

        <>
            <footer className="footer bg-danger text-white pt-3 shadow">

                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12 col-lg-6 ps-0  ps-md-5">


                            <div className="w-100 fs-1  ps-5 d-flex d-none d-md-block">
                                <img src="/image/logo-white.png" width="130px" draggable="false" className="user-select-none" />

                            </div>
                            <div className="w-100 fs-1  ps-5 d-flex d-block d-md-none">
                                <img src="/image/logo-white.png" width="160px" draggable="false" className="user-select-none" />

                            </div>

                            <div className="w-100 ps-5  fs-6 d-flex justify-content-start text-start d-none d-md-block">
                                <span> Â©2023 - {currentYear} PT Indofood CBP Sukses Makmur Tbk. </span>
                            </div>

                            <div className=" ps-5  text-start d-block d-md-none">
                                <span> Â©2023 - {currentYear}  PT Indofood CBP Sukses Makmur Tbk. </span>
                            </div>
                        </div>

                    </div>
                </div>
            </footer>


        </>
    );
}

export default footer;



