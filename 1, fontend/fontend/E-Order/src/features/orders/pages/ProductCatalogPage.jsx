import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Image, Select, Input, Spinner, Text,
  InputGroup, InputRightAddon
} from "@chakra-ui/react";

import Axios from "axios";
import { API_URL } from "../../../config";
import Sidebar from "../../../components/layout/Sidebar.jsx";

import { AiOutlineSearch } from "react-icons/ai";
import { useLocation } from "react-router-dom"

//COMPONENTS
// import BannerComponent from '../../../components/landing/BannerComponent.jsx'
import ControlBar from "../../../components/layout/ControlBar.jsx";

// import DeliverToComponent from "../../../components/order/DeliverToComponent.jsx";

import { clearSeasonStorage } from "../../../action/cartAction";

import { seasonOut, logoutAction, loginAction } from "../../../action/userAction";
import { useData } from "../../auth/components/CheckToken/FetchData/DataContext";

const ProductCatalogPage = () => {
  const { flavours, ports, shipToParties, container } = useData();

  let userToken = localStorage.getItem("tokek");
  const location = useLocation();
  const dispatch = useDispatch();



  const { company_name, uid, company_id, pallet } = useSelector((state) => {
    return {
      company_name: state.userReducer.company_name,
      company_id: state.userReducer.company_id,
      pallet: state.userReducer.pallet,
      uid: state.userReducer.uid
    }
  });



  // ========================= CLEAR SESSION STORAGE =================================

  // //Action
  // import { seasonOut } from '../../../action/userAction'
  // import { clearSeasonStorage } from '../../../action/cartAction'

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

  if (initialise === false) {
    clearSeasonStorage(order);
    setInitialise(true);
  }

  // ==========================================================================

  const [data, setData] = useState([]);
  // const [img, setImg] = React.useState('');
  // const [username, setName] = React.useState('');
  // const [text, setText] = React.useState('')
  const navigate = useNavigate();



  useEffect(() => {
    setData(flavours)
  }, []);



  const printAllBrand = () => {
    const uniqueBrand = new Set();

    return data.map((val, idx) => {
      if (!uniqueBrand.has(val.brand_name)) {
        uniqueBrand.add(val.brand_name);

        return (
          <option key={idx} value={val.brand_name}>
            {val.brand_name}
          </option>
        );
      }


    });
  };


  const printAllCategories = () => {
    const uniqueCategories = new Set();

    return data.map((val, idx) => {
      if (!uniqueCategories.has(val.cat_name)) {
        uniqueCategories.add(val.cat_name);

        return (
          <option key={idx} value={val.cat_name}>
            {val.cat_name}
          </option>
        );
      }

    });
  };

  // search bar functionality
  const [search, setSearch] = useState("");

  // select brand
  const [BrandValue, setBrandValue] = useState("");
  const handleBrandValueChange = (event) => {
    setBrandValue(event.target.value);
    console.log(event.target.value, "brand")

  };
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

  // select category
  const [CategoryValue, setCategoryValue] = useState("");
  const handleCategoryValueChange = (event) => {
    setCategoryValue(event.target.value);
  };

  function formatNumberWithDots(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const printData = () => {
    return data
      .sort((a, b) => {
        const aContainsCup = (a.cat_name || "").toLowerCase().includes("cup");
        const bContainsCup = (b.cat_name || "").toLowerCase().includes("cup");
        const aStartsWithDr = (a.cat_name || "").includes("Dry ");
        const bStartsWithDr = (b.cat_name || "").includes("Dry ");
        const aStartsWithBanded = (a.cat_name || "").includes("Banded");
        const bStartsWithBanded = (b.cat_name || "").includes("Banded");

        // Prioritize items containing "cup" and "Dry" at the top
        if (aContainsCup && !bContainsCup) {
          return -1;
        } else if (!aContainsCup && bContainsCup) {
          return 1;
        } else if (aContainsCup && bContainsCup) {
          // Both items contain "cup"
          if (aStartsWithDr && !bStartsWithDr) {
            return -1; // Place "Dry" items above others
          } else if (!aStartsWithDr && bStartsWithDr) {
            return 1;
          } else {
            // If both contain or don't contain "Dry", sort by product_sku
            return a.product_name.localeCompare(b.product_name);
          }
        }
      })
      .filter((product) =>
        product.product_name.toLowerCase().includes(search) &&
        product.brand_name.includes(BrandValue) &&
        product.cat_name.includes(CategoryValue)
      )
      .map((val, idx) => {
        {

          return (
            <div className="PC-ver card-body border border_radius_10px shadow shadow-sm my-2">
              <div className="row ">
                <div className="user-select-none position-absolute d-flex justify-content-center align-items-center text-secondary shadow" style={{ fontSize: "12px", marginTop: "-10px", width: "25px", height: "25px", borderRadius: "100%", backgroundColor: "white" }}>
                  {idx + 1}
                </div>
                <div className="col-3 mt-4 ">
                  <Image
                    key={val.product_code}
                    className="d-flex justify-content-center ps-3 pt-2"
                    src={val.img}
                    boxSize=""
                    alt={val.product_code}
                    width="100%"

                    fallbackSrc="/image/emptyplate.PNG"
                  />
                </div>

                <div className="col-9">
                  <div className="row border-bottom">
                    <div className="col-12 text-start d-flex dark_red_text_bold fs-6 text-uppercase">
                      {val.product_name}
                    </div>

                    {/* <div className="col-6 d-flex justify-content-end yellow_text_bold fs-6">
                                            {val.price !== null
                                                ? `EST. Price $${val.price}/carton`
                                                : `EST. Price TBA* `}
                                        </div> */}
                  </div>

                  <div className="row mb-3">
                    <div className="col-12 text-start d-flex grey_text_bold fs-6 text-uppercase">
                      {val.product_sku}
                    </div>
                  </div>

                  <div className="row px-0">
                    <div className="container-fluid">
                      <div className="row">
                        <div className="col-6 ">
                          <div className="row">
                            <div className="col-6 mb-1 text-start d-flex grey_text_bold fs-6 border-right">
                              Brand
                            </div>

                            <div className="col-6 mb-1 text-start d-flex grey_text fs-6 text-uppercase px-0">
                              {val.brand_name}
                            </div>

                            <div className="col-6 mb-1 text-start d-flex grey_text_bold fs-6 border-right">
                              Flavour
                            </div>

                            <div className="col-6 mb-1 d-flex grey_text text-start fs-6 px-0">
                              {val.flavour_name}
                              {/* {val.product_sku.substring(
                                  0,
                                  val.product_sku.indexOf(" ")
                                )} */}
                            </div>

                            <div className="text-start mb-1 col-6 d-flex grey_text_bold fs-6 border-right">
                              Net Weight
                            </div>

                            <div className="col-6 mb-1 px-0 text-start d-flex grey_text fs-6">
                              {val.net_weight} gr
                            </div>

                            <div className="col-6 mb-1 ratakiri col-6  grey_text_bold fs-6 border-right justify-content-left">
                              Items per carton
                            </div>

                            <div className="col-6 mb-1 px-0 ratakiri col-6 d-flex grey_text fs-6 ">
                              {val.per_carton} packs
                            </div>

                            <div className=" ratakiri mb-1 col-6 d-flex grey_text_bold fs-6 ">
                              Product Category
                            </div>

                            <div className=" col-6 mb-1 px-0 ratakiri d-flex grey_text fs-6 ">
                              {val.cat_name}
                            </div>

                          </div>
                        </div>

                        <div className="col-6">
                          <div className="row">

                            <div className="col-6 text-start    d-flex grey_text_bold fs-6">
                              Carton Dimension
                            </div>

                            <div className="col-5 d-flex  text-start grey_text fs-6">
                              <span >{val.ctn_length}</span>x<span>{val.ctn_width}</span>x<span>{val.ctn_height}mm</span>

                            </div>

                            <div className="col-6 text-start ratakiri d-flex grey_text_bold fs-6">
                              Minimal Order
                            </div>

                            <div className="col-6 text-start d-flex grey_text fs-6">
                              {(val.moq).toLocaleString()} cartons
                            </div>



                            <div className="col-6 text-start border-bottom   d-flex grey_text_bold fs-6">
                              Container Load
                            </div>

                            <div className="col-5 d-flex border-bottom grey_text fs-6"></div>

                            <div className="col-6 text-end justify-content-end d-flex grey_text_bold  fs-6 ">
                              <div className="row pe-4">
                                {
                                  container.map((val, name) => (

                                    <>
                                      <div className="col-12 ">
                                        {val.container_name}
                                      </div>
                                    </>
                                  ))}
                              </div>
                            </div>



                            <div className="col-6 ratakiri d-flex grey_text fs-6">

                              <div className="col-12 ">
                                {container.map((kepala, kaki) => {
                                  return (
                                    kepala.container_id == 1 ?
                                      <div className="row ">
                                        <div className="text-start">
                                          {

                                            val.cont20
                                              ?
                                              val.cont20.toLocaleString() + " cartons"
                                              :
                                              ""
                                          }
                                          <br></br>
                                          {pallet === 1 ? "(20 Pallet)" : ""}
                                        </div>
                                      </div>
                                      :
                                      kepala.container_id == 2 ?
                                        <div className="row ">
                                          <div className="text-start">
                                            {
                                              val.cont40
                                                ?
                                                (val.cont40).toLocaleString() + " cartons"
                                                :
                                                ""
                                            }
                                            <br></br>
                                            {pallet === 1 ? "(20 Pallet)" : ""}

                                          </div>
                                        </div>
                                        :
                                        kepala.container_id == 4 ?
                                          <div className="row ">
                                            <div className="text-start">
                                              {
                                                val.cont40hc && !val.qty_per_pallet
                                                  ?
                                                  (val.cont40hc).toLocaleString() + " cartons"
                                                  :
                                                  ""
                                              }

                                              {
                                                val.cont40hc && val.qty_per_pallet
                                                  ?
                                                  (val.qty_per_pallet * 20).toLocaleString() + " cartons"
                                                  :
                                                  ""
                                              }



                                              <br></br>
                                              {pallet === 1 ? "(20 Pallet)" : ""}

                                            </div>
                                          </div>
                                          : null
                                  )
                                })}

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
          );
        }
      });
  };

  const printData2 = () => {
    return data
      .filter(
        (product) =>
          product.product_name.toLowerCase().includes(search) &&
          product.brand_name.includes(BrandValue) &&
          product.cat_name.includes(CategoryValue)
      )
      .map((val, idx) => {
        {
          return (
            <div className="mobile-ver card-body border border_radius_10px shadow shadow-sm my-2 pb-3 me-1 ms-1 ">
              <div className="row ">
                <div className="col-12 mt-4 mb-4">
                  <Image
                    key={val.product_code}
                    className="d-flex justify-content-center ps-3 pt-2"
                    src={val.img}
                    boxSize=""
                    alt={val.product_code}
                    width="100%"

                    fallbackSrc="/image/emptyplate.PNG"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-12">
                  <div className="row border-bottom pb-2">
                    <div className="col-12 justify-content-center d-flex dark_red_text_bold fs-4">
                      {val.product_name}
                    </div>

                    {/* <div className="col-6 d-flex justify-content-end yellow_text_bold fs-4">
                                            {val.price !== null
                                                ? `EST. Price $${val.price}/carton`
                                                : `EST. Price TBA* `}
                                        </div> */}
                  </div>

                  <div className="row mb-12 ">
                    <div className="justify-content-center mb-3 mt-3 col-12 d-flex grey_text_bold fs-6">
                      {val.product_sku}
                    </div>
                  </div>

                  <div className="row ">
                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6 border-right">
                      Brand
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6">
                      {val.brand_name}
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6">
                      Flavour
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6">
                      {val.product_sku.substring(
                        0,
                        val.product_sku.indexOf(" ")
                      )}
                    </div>
                  </div>

                  <div className="row ">
                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6 border-right">
                      Net Weight
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6">
                      {val.net_weight} gr
                    </div>

                    <div className="col-md-3 text-start col-6 d-flex grey_text_bold fs-6 ">
                      Number of Items
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6 text-start">
                      {val.per_carton} packs (single)
                    </div>
                  </div>

                  <div className="row  ">
                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6 border-right text-start">
                      Product Category
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6 text-start">
                      {val.cat_name}
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6">
                      Minimal Order
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6">
                      {val.moq} cartons
                    </div>
                  </div>

                  <div className="row ">
                    <div className="col-md-3 border-bottom col-6 d-flex grey_text_bold fs-6 border-right">
                      {val.cont40hc ? "Container Load" : ""}
                    </div>

                    <div className="col-md-3 col-6 d-flex grey_text fs-6"></div>
                  </div>

                  <div className="row ">
                    <div className="col-md-3 col-6 d-flex grey_text_bold fs-6">
                      {val.cont40hc ? "40 HC" : ""}
                    </div>

                    <div className="col-md-3 col-6  d-flex grey_text  text-start fs-6">
                      {val.cont40hc} cartons
                      <br></br>
                      {pallet === 1 ? "(20 Pallet)" : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
      });
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
                <div className="row text-secondary pb-3 user-select-none">

                  <div className="col-12 d-flex  pt-1 pb-3 ps-4 ps-md-0">
                    <span
                      onClick={() => navigate("/e-order/dashboard")}
                      className="pointer grey_text_normal_20px">
                      e-order
                    </span>
                    <span className="grey_text_20px">
                      &nbsp;/ Product Catalog
                    </span>
                  </div>

                  <div className="col-md-3 col-6 d-flex pt-1">
                    <Select
                      className="grey_text fs-6"
                      size="sm"
                      value={BrandValue}
                      onChange={handleBrandValueChange}
                    >
                      <option value="">All Brands</option>
                      {printAllBrand()}

                      {/* <option value='SARIMI'>Sarimi</option> */}
                    </Select>
                  </div>

                  <div className=" col-md-4 col-6 d-flex pt-1">
                    <Select
                      className="grey_text fs-6"
                      size="sm"
                      value={CategoryValue}
                      onChange={handleCategoryValueChange}
                    >
                      <option value="">All Categories</option>
                      {printAllCategories()}
                      {/* <option value='3'>Snacks</option> */}
                    </Select>
                  </div>

                  <div className="col-md-5 col-12 d-flex align-items-center">

                    <InputGroup size='sm'>

                      <Input
                        placeholder='Search Product'
                        size="sm"
                        className="form-control  grey_text fs-6"
                        type="search"
                        onChange={(event) => setSearch(event.target.value)}
                      />
                      <InputRightAddon

                        children={

                          <AiOutlineSearch
                            className="color_red d-flex align-items-center py-1"
                            size={30}
                          />

                        }
                      />
                    </InputGroup>


                  </div>
                </div>
              </div>

              <div className="container">
                <div className="row px-1 px-md-2 px-lg-3 d-flex justify-content-start mt-2">

                  <>
                    {printData()}
                    {printData2()}
                  </>

                </div>
              </div>
            </div>
          </div>
        </div>

        <ControlBar />
      </div>
    </div>
  );
};

export default ProductCatalogPage;







