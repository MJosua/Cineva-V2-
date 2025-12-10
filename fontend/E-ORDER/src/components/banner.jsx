import React from "react";
import ReactGA from 'react-ga';
// import { useNavigate } from "react-router-dom";

const banner = () => {
    ReactGA.initialize('G-PTXJ1SE2J8');
    const handleButtonClick = () => {
        window.open('https://drive.google.com/drive/folders/1BbffCZupxcHajAZVdyJuiIIOJLSj99xG?usp=share_link', '_blank');
        ReactGA.event({
            category: 'Button',
            action: 'Click',
            label: 'Klik Katalog', // Optional
        });
    };

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    return (

        <>
            <div className=" bg-grad-biru text-white mt-5 ">

                <div className="container-fluid">
                    <div className="row ">
                        <div className="col-5 col-lg-7  px-0  px-md-5 py-5 ">

                            <div className=" justify-content-start ps-5 d-none d-md-flex">
                                <div className="responsive-judul text-center fw-bold d-flex justify-content-start text-start">
                                    Download our {currentYear} Catalog
                                </div>
                            </div>

                            <div className=" ps-5 d-flex d-md-none mb-2">
                                <div className="responsive-judul-blog fw-bold ">
                                    Download our {currentYear} Catalog
                                </div>
                            </div>


                            <div className="d-flex justify-content-center ps-5 d-md-none">
                                <div className="btn responsive-isi fw-bold btn-light rounded-35 px-2 " onClick={handleButtonClick}>
                                    Download
                                </div>
                            </div>

                            <div className="d-md-flex justify-content-start ps-5 d-none  mt-3">
                                <div className="btn btn-light responsive-isi fw-bold  rounded-35 px-5 " onClick={handleButtonClick}>
                                    Download
                                </div>
                            </div>

                        </div>

                        <div className="col-7 col-lg-5 ">
                            <div className="catalog">
                                <div className="img-catalog h-100 w-100" >

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div >


        </>
    );
}

export default banner;