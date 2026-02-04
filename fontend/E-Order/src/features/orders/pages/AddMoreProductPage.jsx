import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { useDispatch } from 'react-redux';
import AddmoreContainer from "./AddMoreContainerOrder/AddmoreContainer";
import AddMoreTruckOrder from "./AddMoreTruckOrder/AddMoreTruckPage"
import { Image, Spinner } from "@chakra-ui/react";

import Sidebar from "../../../components/layout/Sidebar.jsx";

const AddMoreProductPage = () => {
  /**
   * UPDATES AND PATCH:
   * 20230804 : FARIZ : Ganti query flavour jadi get: /product/order sebelumnya '/product'
   * 20230808 : Yosua : Simplify Code
   * 20230817 : Yosua : Add Flavour III
   * 20230817 : Yosua : Add Flavour III Formula & Simpplify Component
   * 20230817 : FARIZ : pembatasan container berdasarkan distributor
   * 20230822 : Yosua : Add Flavour III Bulk
   * 20230905 : Yosua : Adjust Desain dan Fungsi Landing Page
   * 20230906 : Yosua : Adjust Desain dan Fungsi Mobile
   * 20240308 : Yosua : Summary Fix
   */

  const navigate = useNavigate();


  const dispatch = useDispatch();

  const location = useLocation();
  const { search } = location;
  const [loading, setLoading] = useState("True");
  const containerOrders = sessionStorage.getItem("containerOrders");
  useEffect(() => {
    const params = new URLSearchParams(search);
    const modeParam = params.get("mode");
    if (modeParam) {
      setMode(modeParam);

      setLoading(false)

    }



  }, [search]);


  const transport = useSelector((state) => state.userReducer.transport);

  const [mode, setMode] = useState("");


  const handleModeChange = (value) => {
    navigate(`/e-order/order?mode=${value}`);
    setMode(value)
    setTimeout(() => {
      setLoading("false");
    }, 1500);

  }



  const company_id = useSelector((state) => state.userReducer.company_id);

  //MAIN RETURN
  return (


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
                  &nbsp;/ Place Order
                </span>
              </div>
            </div>
            {/* ================================================================= CONTENT BELOW ================================================================= */}
            <div className="col-12  mb-4">
              <div className="row ">
                <div className={(
                  (transport === 1 || transport === 3)
                    ?
                    "col-auto "
                    :
                    "d-none"
                )
                }
                >

                  <div className="d-flex">

                    <div
                      style={{ minWidth: "150px", height: "48px" }}
                      className={
                        "btn btn-outline-indofood-biru py-2 border_radius_10px fw-bold " +

                        (
                          (transport === 1 || transport === 3)
                            ?
                            ""
                            :
                            "d-none"
                        )
                        +
                        (mode === "Container"
                          ?
                          " active "
                          :
                          ""
                        )

                      }
                      onClick={() => handleModeChange("Container")}

                    >
                      <div className="row">
                        <div className="col-3 h-100  ">
                          <div className="  d-flex justify-content-start align-items-center " style={{ minWidth: "60px" }}>
                            <Image
                              src={`/image/po.PNG`}
                              width="auto"
                              height={"30px"}
                              fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"

                            />
                          </div>

                        </div>
                        <div className={`col-9 d-flex align-items-center justify-content-start ${company_id === 147 || company_id === 381 ? "ps-1" : "ps-4"}`}>

                          {(company_id === 147 || company_id === 381) ?
                            <span>
                              Container Indonesia
                            </span>
                            :
                            <span>
                              Container
                            </span>
                          }

                        </div>
                      </div>



                    </div>

                  </div>

                </div>





                <div className="col-auto"

                >
                  {(transport === 1 || !transport || transport === 0 ?
                    " " :

                    <div
                      style={{ minWidth: "150px", height: "48px" }}
                      className={
                        "btn btn-outline-indofood-biru py-2 border_radius_10px fw-bold " +
                        (mode === "Trucking"
                          ?
                          " active "
                          :
                          ""
                        )

                      }
                      onClick={() => handleModeChange("Trucking")}
                    >
                      <div className="row h-100">
                        <div className="col-3 h-100  ">
                          <div className="  d-flex justify-content-start align-items-center " style={{ minWidth: "60px" }}>
                            <Image
                              src={`/image/truck.png`}
                              width="auto"
                              height={"30px"}
                              fallbacksrc="https://www.indofoodinternational.com/e-order/static/media/emptyplate.abe823f0ddff30c4a1fa.PNG"
                            />
                          </div>
                        </div>
                        <div className="col-9 h-100  d-flex align-items-center justify-content-center ps-2">

                          {(company_id === 147 || company_id === 381) ?
                            <span>Container Serbia</span>
                            :
                            <span>Truck</span>
                          }

                        </div>
                      </div>
                    </div>

                  )

                  }
                </div>
              </div>
            </div>

            {
              loading === "True" && mode === "" ? (
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
              ) : (
                mode === "Container" ?
                  // <AddMoreContainerTest />
                  <AddmoreContainer
                    mode={mode}
                  />
                  :
                  <AddMoreTruckOrder
                    loading={loading}
                    mode={mode}
                  />


              )
            }

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoreProductPage;





