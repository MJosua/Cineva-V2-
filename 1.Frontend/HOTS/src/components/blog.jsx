import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Image, Select, Input } from "@chakra-ui/react";
import { AiOutlineSearch } from "react-icons/ai";

import Footer from './footer';
function Blog() {
    const [search, setSearch] = useState("");
    const location = useLocation();
    const [className, setClassName] = useState('');
    useEffect(() => {
        // Check if the current URL matches the specific URL you want to target
        if (location.pathname === '/blog') {
            // Set the classname if the condition is met
            setClassName('d-block');
        } else {
            // Set a default classname for other URLs
            setClassName('d-none');
        }
    }, [location]);
    return (
        <div className="container-fluid">
            <div className="col-12 h-100 px-5">
                <div className="container-fluid">
                    <div className="row ">
                        <div className="col-12 col-md-6">
                            <div className=" Justify-content-start fw-bold fs-1 text-danger d-none d-md-flex">
                                <div className="ps-5 pt-5 ">
                                    News And Event
                                </div>
                            </div>
                            <div className="justify-content-center fw-bold fs-1 w-100 text-danger d-md-none d-flex">
                                <div className=" pt-5">
                                    News And Event
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 d-flex justify-content-end">
                            <div className={`fw-bold col-md-6 justify-content-center justify-content-md-end fs-1 ${className}`}>
                                <div className="pe-0  pe-md-5 pt-0 pt-md-5 mt-0 mt-md-3">

                                    <form className="d-flex pt-1">
                                        <Input
                                            size="sm"
                                            className="form-control grey_text  shadow border1_radius_5px"
                                            type="search"
                                            placeholder="Key Word"
                                            onChange={(event) => setSearch(event.target.value)}
                                        />
                                        <AiOutlineSearch
                                            className="color_red pt-1 ps-1 pe-1 shadow  border2_radius_5px pointer"
                                            size={30}
                                        />
                                    </form>

                                </div>
                            </div>


                        </div>
                    </div>
                </div>

                <div className={`container-fluid px-5 mt-0 mt-md-4 ${className}`}>

                    <div className="col-12   mb-5 d-md-flex d-none">
                        <div className="col-12  position-relative">
                            <div className="gambar-blog besar img-1 ">

                            </div>


                            <div className="w-100 d-flex ps-2 pt-4">
                                <div className="fs-6 text-secondary fw-bold">
                                    04 July 2023
                                </div>
                            </div>
                            <div className="w-100 text-start px-2 vh-100 maxjudul pt-3 mb-5">
                                <div className="responsive-judul-blog  fw-bold h-50">
                                    Indomie x Sandalboyz x Mindblowon Collaboration at DesignerCon 2022
                                </div>
                                <div className="fs-6 text-secondary fw-bold d-none d-md-block h-50">
                                    Brunei Bintang Search is a singing competition program produced by OOPs Brunei, the program was broadcasted on Free To Air TV (FTA TV) and online streaming on YouTube. It aired from July 2022 to September 2022.

                                </div>
                            </div>

                            {/* <div className="h-50 d-flex justify-content-start ps-2 align-items-end pb-4 mt-4">
                                    <div className="position-absolute bottom-0  btn  btn-outline-danger rounded-pill  pb-2 pt-1 px-5">
                                        more
                                    </div>
                                </div> */}

                        </div>
                    </div>
                </div>

                <div className="container-fluid px-md-5 px-1">
                    <div className="row  py-5">

                        <div className="col-12 col-md-4  position-relative  mb-5">
                            <div className="col-12  rounded">
                                <div className="gambar-blog img-1 ">

                                </div>


                                <div className="w-100 d-flex ps-2 pt-2">
                                    <div className="fs-6 text-secondary fw-bold">
                                        04 July 2023
                                    </div>
                                </div>
                                <div className="w-100 text-start px-2 vh-100 maxjudul pt-1 mb-5">
                                    <div className="responsive-judul-blog  fw-bold">
                                        Indomie x Sandalboyz x Mindblowon Collaboration at DesignerCon 2022
                                    </div>
                                </div>

                                {/* <div className="h-50 d-flex justify-content-start ps-2 align-items-end pb-4 mt-4">
                                        <div className="bottom-0 position-absolute btn  btn-outline-danger rounded-pill  pb-2 pt-1 px-5">
                                            more
                                        </div>
                                    </div> */}

                            </div>
                        </div>

                        <div className="col-12 col-md-4  mb-5 ">
                            <div className="col-12 position-relative rounded">
                                <div className="gambar-blog img-2 ">

                                </div>


                                <div className="w-100 d-flex ps-2 pt-2">
                                    <div className="fs-6 text-secondary fw-bold ">
                                        04 July 2023
                                    </div>
                                </div>
                                <div className="w-100 text-start px-2 vh-100 maxjudul pt-1 mb-5">
                                    <div className="responsive-judul-blog  fw-bold">
                                        Indofood at SIAL PARIS 2022
                                    </div>
                                </div>

                                {/* <div className="d-flex justify-content-start ps-2 align-items-end pb-4 mt-4 ">
                                        <div className="bottom-0 position-absolute btn  btn-outline-danger rounded-pill  pb-2 pt-1 px-5">
                                            more
                                        </div>
                                    </div> */}

                            </div>
                        </div>

                        <div className="col-12 col-md-4  mb-5 ">
                            <div className="col-12 position-relative  rounded">
                                <div className="gambar-blog img-3 ">

                                </div>


                                <div className="w-100 d-flex ps-2 pt-2">
                                    <div className="fs-6 text-secondary fw-bold">
                                        04 July 2023
                                    </div>
                                </div>
                                <div className="w-100 text-start px-2 vh-100 maxjudul pt-1 mb-5">
                                    <div className="responsive-judul-blog  fw-bold">
                                        Brunei Bintang Search Season 3
                                    </div>
                                </div>

                                {/* <div className="h-50 d-flex  justify-content-start ps-2 align-items-end pb-4 mt-4">
                                        <div className="bottom-0 position-absolute  btn btn-outline-danger  rounded-pill  pb-2 pt-1 px-5">
                                            more
                                        </div>
                                    </div> */}

                            </div>
                        </div>




                    </div>

                </div>

            </div>

        </div>

    );
}

export default Blog;