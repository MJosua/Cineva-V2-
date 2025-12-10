import React from "react";
import { useNavigate } from "react-router-dom";

import { Image } from "@chakra-ui/react";


import { clearSeasonStorage } from "../action/cartAction";
import { seasonOut, logoutAction, loginAction } from "../action/userAction";

import { useDispatch } from "react-redux";
import { useLocation } from "react-router-dom"

import { API_URL } from "../config";
import { BiChevronRight } from "react-icons/bi";
import Axios from "axios";

import Sidebar from "../components/Sidebar";


import { MdFileDownload } from "react-icons/md";
const HelpPage = () => {

  const dispatch = useDispatch();

  let userToken = localStorage.getItem("tokek");
  const location = useLocation();
  

  const navigate = useNavigate();
  const meta = {
    title: `${location.pathname} page Indofood`,
    description: `Page of ${location.pathname} from Indofood`,
    canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
    meta: {
      charset: 'utf-8',
      name: {
        keywords: 'react,meta,document,html,tags'
      }
    }
  };
  // ================= CLEAR SESSION STORAGE =====================

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

  if (initialise === false) {
    clearSeasonStorage(order);
    setInitialise(true);
  }

  // ============================================================

  const handleDownload = () => {
    // Replace 'your-file-url' with the URL of the file you want to download
    const fileUrl = '/OnlineOrderGuidebook_15Feb2024.pdf';
    window.open(fileUrl, '_blank');
  };

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
              <div>
                <div className="row user-select-none">

                  <div className="col-12 text-secondary d-flex  pt-1 ps-4 ps-md-0">
                    <span
                      onClick={() => navigate("/e-order/dashboard")}
                      className="pointer grey_text_normal_20px">
                      e-order
                    </span>
                    <span className="grey_text_20px">
                      &nbsp;/ Help
                    </span>
                  </div>
                </div>

                <div className="row ">
                  <div className="col-12 col-md-6 d-flex px-0">


                    {/* <button className='card-body border border_radius_10px btn-outline-secondary shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2' onClick={() => navigate("/e-order/help/FAQ")}> */}
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={() => navigate("/e-order/help/faq")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/FAQ.png"

                          width="80px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-center align-items-center">
                        <div className="">FAQ</div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={() => navigate("/e-order/help/glossary")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/Glossary.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-center align-items-center">
                        <div className="">
                          Glossary
                        </div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={() => navigate("/e-order/help/contact")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/contact_us.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>

                      <div className="col-4 h-100 d-flex justify-content-center align-items-center">
                        <div className="">
                          Contact Us
                        </div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2"
                      onClick={() => navigate("/e-order/help/feedback")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/feedback.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100  d-flex justify-content-center align-items-center">
                        <div className="">
                          Feed Back
                        </div>
                      </div>
                      <div className="col-4 h-100  d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={() => navigate("/e-order/help/tutorial")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/tutorial.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-center align-items-center">
                        <div className="">
                          Tutorial
                        </div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={handleDownload}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/GuideBook.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-center align-items-center"

                      >
                        <div className="">
                          e-book Guide
                        </div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <MdFileDownload
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                  <div className="col-12 col-md-6 d-flex px-0">
                    <button
                      className="card-body border border_radius_10px hover-pink  shadow shadow-sm row w-100 mt-4 grey_text_bold fs-5 m-2 py-4"
                      onClick={() => navigate("/e-order/help/termsncondition")}
                    >
                      <div className="col-4 h-100 ">
                        <Image
                          className="d-flex justify-content-center px-0 pb-0"
                          src="/image/Help/tnclogo.png"

                          width="55px"
                          height="55px"
                          fallbacksrc="/image/emptyplate.PNG"
                        ></Image>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-center align-items-center"

                      >
                        <div className="">
                          Order Terms & Condition
                        </div>
                      </div>
                      <div className="col-4 h-100 d-flex justify-content-end align-items-center">
                        <BiChevronRight
                          fontSize="36px"
                        />
                      </div>
                    </button>
                  </div>

                </div>


              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default HelpPage;
