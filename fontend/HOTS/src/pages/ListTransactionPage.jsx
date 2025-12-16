//React utilities
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom"

//API communication
import Axios from "axios";
import { API_URL } from "../config";
//component

import ControlBar from "../components/ControlBar";
import * as XLSX from 'xlsx';
//Action
import { seasonOut, loginAction, logoutAction } from "../action/userAction";
import { clearSeasonStorage } from "../action/cartAction";
import { IoMdDownload } from "react-icons/io";
import { RxTriangleUp, RxTriangleDown } from "react-icons/rx";

import SearchFilterComponent from "../components/SearchFilterComponent";

import LimiterComponent from "../components/LimiterComponent";

import {
  Select,
  Image,
  Tooltip,
  Spinner,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Button,
} from "@chakra-ui/react";
// import { AiFillFile } from "react-icons/ai";
import { HiSortAscending, HiSortDescending } from "react-icons/hi";
import { FaListUl } from "react-icons/fa";
import { TbLayoutDashboard } from "react-icons/tb";
import { LuLayoutGrid } from "react-icons/lu";

import { AiOutlineSearch } from "react-icons/ai";
import { ImSortAmountAsc, ImSortAmountDesc } from "react-icons/im";
import { BsChevronLeft, BsChevronRight } from "react-icons/bs";
import { FaFilterCircleXmark } from "react-icons/fa6";
import Sidebar from "../components/Sidebar";
import { useData } from "../components/CheckToken/FetchData/DataContext";

const ListTransactionPage = () => {
  const { flavours, ports, shipToParties } = useData();

  const [gridcard, setGridcard] = useState(true);
  const handleToggleGrid = (value) => {

    if (value !== "a") {
      setGridcard(prevState => !prevState); // Toggle the state
    } else {
      setGridcard(false);
    }
  };


  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);


  React.useEffect(() => {
    sessionStorage.removeItem('truckOrders');
  }, []);
  // ========================= CLEAR SESSION STORAGE =================================

  // //Action
  // import { seasonOut } from '../action/userAction'
  // import { clearSeasonStorage } from '../action/cartAction'

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

  if (initialise === false) {
    clearSeasonStorage(order);
    setInitialise(true);
  }

  // ==========================================================================

  // ======================================================== GET DATA ========================================================

  const dispatch = useDispatch();

  let userToken = localStorage.getItem("tokek");

  // get user data from localstorage
  const { company_id, user } = useSelector((state) => {
    return {
      company_id: state.userReducer.company_id,
      user: state.userReducer.user,
    };
  });



  // get order header

  //request query

  const [totalPage, setTotalPage] = useState(1);
  const pageIndices = [...Array(totalPage).keys()];
  const [page, setPage] = useState(1);
  const handlePageChange = (value) => {
    setPage(value)
  }

  const handlePageIncrement = () => {
    if (page != totalPage) {
      setPage(page + 1)
    }
  }

  const handlePageDecrement = () => {
    if (page != 1) {
      setPage(page - 1)
    }
  }

  const [limit, setLimit] = useState(10);
  const handleLimitChange = (value) => {
    setLimit(value);
    setPage(1);
  }
  const [order_by_week, setOrder_by_week] = useState(1);
  const handleOrder_by_weekChange = (event) => {
    setOrder_by_week(event.target.value)
  }


  const [desc, setDesc] = useState("1");
  const handleDescChange = (value) => {
    setLoading(true);
    setDesc(value)
  }
  const [status, setStatus] = useState(0);
  const handleStatusChange = (event) => {
    setLoading(true);
    setStatus(event.target.value)
  };
  const [stuffingstart, setStuffingstart] = useState(0);
  const handleStuffingstartChange = (event) => {
    setLoading(true);
    setStuffingstart(event.target.value);
  }
  const [stuffingend, setStuffingend] = useState(0);
  const handleStuffingendChange = (event) => {
    setLoading(true);
    setStuffingend(event.target.value);
  }
  const [find, setFind] = useState("");
  const handleFindChange = (event) => {
    setLoading(true);
    setFind(event.target.value);
  }

  const handleButtonReset = () => {
    setFind("");
    setStuffingend(0);
    setStuffingstart(0);
    setStatus(0);
    setDesc("1");
    setPage(1)
    setLoading(true);

  }

  const [totalPageReal, setTotalPageReal] = useState("");

  const [orderReal, setOrderReal] = useState([]);
  const getOrderReal = () => {
    Axios.get(API_URL + `/order/get_realization?page=${page}&limit=${limit}&order_by_week=${order_by_week}&desc=${desc}&status=${status}&stuffingstart=${stuffingstart}&stuffingend=${stuffingend}&find=${find}
    `, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {

        setOrderReal(res.data.packet)
        setTotalPageReal(res.data.totalPage)
        setLoading(false)
      })
      .catch((err) => {
      });
  };

  const [orderinfo, setOrderInfo] = useState([]);
  const getOrderTableHeader = () => {
    Axios.get(API_URL + `/order/get_all_in?page=${page}&limit=${limit}&order_by_week=${order_by_week}&desc=${desc}&status=${status}&stuffingstart=${stuffingstart}&stuffingend=${stuffingend}&find=${find} 
    `, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setStartWeek(res.data.available_week);
        setStartWeek2(res.data.available_week);
        setPage(res.data.page);
        setTotalPage(res.data.totalPage);
        setOrderInfo(res.data.packet)
      })
      .catch((err) => {
      });
  };


  useEffect(() => {
    getOrderTableHeader();
  }, [user]);


  // const getStartWeek = () => {
  //   Axios.get(API_URL + "/order/get_header", {
  //     headers: {
  //       Authorization: `Bearer ${userToken}`,
  //     },
  //   })
  //     .then((res) => {
  //       setStartWeek(res.data);
  //     })
  //     .catch((err) => {
  //       seasonOut();
  //     });
  // };

  // const getStartWeek2 = () => {
  //   Axios.get(API_URL + "/order/get_header", {
  //     headers: {
  //       Authorization: `Bearer ${userToken}`,
  //     },
  //   })
  //     .then((res) => {
  //       setStartWeek2(res.data);
  //     })
  //     .catch((err) => {
  //       seasonOut();
  //     });
  // };


  const [sort1Value, setSort1Value] = useState(1);
  const [sort2Value, setSort2Value] = useState(2);
  const [sortRealValue, setSortRealValue] = useState(0);


  // useEffect(() => {

  // }, [sort1Value, sort2Value, sortRealValue]);




  //    Test select items filter
  const [cari1Value, setCari1Value] = useState(0);



  const [cari2Value, setCari2Value] = useState(99);




  const [statusValue, setStatusValue] = useState("");


  const [orderDetails, setOrderDetails] = useState([]);





  const [startWeek, setStartWeek] = useState([]);
  const [startWeek2, setStartWeek2] = useState([]);
  const [orderHeader, setOrderHeader] = useState([]);

  const getOrderHeader = () => {
    Axios.get(API_URL + `/order/get_header?page=${page}&limit=${limit}&order_by_week=${order_by_week}&desc=${desc}&status=${status}&stuffingstart=${stuffingstart}&stuffingend=${stuffingend}&find=${find}
    `, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setOrderHeader(res.data.packet);
        setStartWeek(res.data.available_week);
        setStartWeek2(res.data.available_week);
        setPage(res.data.page);
        setTotalPage(res.data.totalPage);

        console.log("orderHeader on listtransactionpage",res.data)
        const headers = res.data.packet;

        if (headers.length > 0) {
          setOrderHeader(headers);
          const orderIds = headers.map(order => order.order_id);
          if (orderIds.length > 0) {
            getOrderDetails(orderIds);
          }
        }

      })
      .catch((err) => {
      });
  };

  const getOrderDetails = async (orderIds) => {
    try {
      const promises = orderIds.map(orderId =>
        Axios.get(`${API_URL}/order/get_order_detail/${orderId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        }).then(res => ({ orderId, details: res.data }))
      );

      const results = await Promise.all(promises);

      // Convert results into an object { order_id: [details] }
      const detailsMap = results.reduce((acc, { orderId, details }) => {
        acc[orderId] = details;
        return acc;
      }, {});

      setOrderDetails(detailsMap);
      // console.log("detailsMap", detailsMap)
    } catch (err) {
      console.error("Error fetching order details", err);
    }
  };






  // const printOrderContain = (headerOrderId) => {
  //     return orderContain.slice(0,1).map((contain, idx) => {
  //         return (
  //             (contain.order_id === headerOrderId) ?
  //                 <div className="row">
  //                     <div className="col-12 d-flex">
  //                         {contain.bulk ?
  //                             <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 grey_background">
  //                                 {`${contain.cont_qty} x ${contain.container_name}`}
  //                             </div>
  //                             :
  //                             <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 grey_background">
  //                                 {`${contain.cont_qty} x  ${contain.container_name}`}
  //                             </div>
  //                         }
  //                     </div>
  //                 </div>
  //                 :
  //                 <div>

  //                 </div>
  //         )
  //     })
  // }

  const [search, setSearch] = useState("");

  const printOrderDetails = (headerOrderId) => {
    // Flag to track if details are displayed
    // let displayed = false; 

    let totalContainerCount = 0;
    let bulk = 0;

    const summedQuantities = {};

    const jsxElements = Object.entries(orderDetails)
      .filter(([orderId]) => orderId == headerOrderId) // Ensure the correct order_id
      .flatMap(([orderId, detailsArray]) =>
        detailsArray.map((details, idx) => {
          if (details.order_id === headerOrderId
            // untuk memunculkan hanya satu container
            // && !displayed
          ) {
            summedQuantities[details.product_name_1] = summedQuantities[details.product_name_1] || { qty: 0, sku: details.prod_sku_1 };
            summedQuantities[details.product_name_1].qty += details.qty1;

            // Sum qty2 for product_name_2 if it matches product_name_1
            if (details.product_name_1 !== details.product_name_2) {
              summedQuantities[details.product_name_2] = summedQuantities[details.product_name_2] || { qty: 0, sku: details.prod_sku_2 };
              summedQuantities[details.product_name_2].qty += details.qty2;
            }

            // Sum qty3 for product_name_3 if it matches product_name_1 and is not the same as product_name_2
            if (details.product_name_1 !== details.product_name_3 && details.product_name_2 !== details.product_name_3) {
              summedQuantities[details.product_name_3] = summedQuantities[details.product_name_3] || { qty: 0, sku: details.prod_sku_3 };
              summedQuantities[details.product_name_3].qty += details.qty3;
            }
            totalContainerCount++;
            // Create JSX elements for displaying order details
            // if (!displayed) {
            //   displayed = true;
            const bulk = details.bulk;
            return null


          }


          return null;
        })
      )

    const lastJsxElement = (
      <div key={jsxElements.length} className="my-2 px-1 py-1 card border border_radius_10px shadow shadow-sm">
        {jsxElements}
        {/* Render summed quantities at the end */}
        <div>
          <div className="px-3 py-2   ">

            <div className=" mt-2 px-2 py-1">
              <div className="row ">
                <div className=" col-8 col-md-7 d-flex">
                  <div className="grey_text_bold fs-6">
                    Product Description
                  </div>
                </div>

                <div className="col-4 col-md-5  d-flex justify-content-center">
                  <div className="grey_text_bold text-end fs-6 ps-5">Total Cartons</div>
                </div>
              </div>
            </div>
          </div>
          <ul>
            {Object.entries(summedQuantities)
              .filter(([productName]) => productName !== null && productName !== 'null')
              .map(([productName, { qty, sku }]) => (
                <div key={productName}>
                  <div className="   ">

                    <div className=" px-2 py-1">
                      <div className="row ">
                        <div className=" col-8 col-md-7 d-flex">
                          <div className="text-start text-secondary fs-6">
                            <div className="fw-bold">
                              {productName}
                            </div>
                            {sku}
                          </div>

                        </div>

                        <div className="col-4 col-md-5  d-flex justify-content-center">
                          <div className="text-secondary text-end fs-6 ps-5">
                            {!qty ? 0 : formatNumber(qty)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>



                </div>
              ))}
          </ul>
        </div>
      </div>
    );
    return { jsxElements: lastJsxElement, totalContainerCount, bulk };
  }



  const [sortDirection, setSortDirection] = useState(null); // State to track sorting direction
  const [sortedBy, setSortedBy] = useState(null);

  useEffect(() => {
    getOrderHeader();
    getOrderReal(); // Fetch data whenever status changes
    setLoading(true);
  }, [
    limit,
    status,
    desc,
    order_by_week,
    desc,
    find,
    stuffingstart,
    stuffingend,
    page,
    user
    // sort1Value,
    // sort2Value,
    // sortRealValue,
  ]);

  const handleTableSortAsc = (e) => {
    // Toggle sorting direction if the same column is clicked
    const columnId = e.currentTarget.closest('th').dataset.columnId;
    // Set sorting direction to ascending for a new column
    setSortDirection('Asc');
    setSortedBy(columnId);
  }

  const handleTableSortDesc = (e) => {
    // Toggle sorting direction if the same column is clicked
    const columnId = e.currentTarget.closest('th').dataset.columnId;
    // Set sorting direction to ascending for a new column
    setSortDirection('Desc');
    setSortedBy(columnId);

  }


  // Display product quantities


  const printStartWeek = () => {
    const uniqueWeeks = new Set();

    return startWeek
      .sort((a, b) => a.delv_week - b.delv_week)
      .map((header, idx) => {
        if (!uniqueWeeks.has(header.delv_week)) {
          uniqueWeeks.add(header.delv_week);

          return (
            <option key={idx} value={header.delv_week}>
              {header.delv_week_desc}
            </option>
          );
        }

        return null;
      });
  };


  const printStartWeek2 = () => {
    const uniqueWeeks2 = new Set();

    return startWeek2.map((header, idx) => {
      if (!uniqueWeeks2.has(header.delv_week)) {
        uniqueWeeks2.add(header.delv_week);

        return (
          <option key={idx} value={header.delv_week}>
            {header.delv_week_desc}
          </option>
        );
      }

      return null;
    });
  };

  const printOrderTable = () => {

    return orderinfo
      .sort((a, b) => {
        if (sortedBy !== null && sortDirection === "Asc") {
          // Sort based on the "po_buyer" property
          if (a[sortedBy] < b[sortedBy]) return -1;
          if (a[sortedBy] > b[sortedBy]) return 1;
          return 0;
        }
        else if (sortedBy !== null && sortDirection === "Desc") {
          // Default sorting logic if sortedBy is not "PO_Buyer"
          if (a[sortedBy] > b[sortedBy]) return -1;
          if (a[sortedBy] < b[sortedBy]) return 1;
          return 0; // You can replace this with your desired default sorting logic
        } else {
          return a - b;
        }


      })
      .filter(
        (header) =>
          String(header.is_status).includes(statusValue)
          &&
          header.delv_week >= cari1Value
          &&
          header.delv_week <= cari2Value
          &&
          header.po_buyer.toLowerCase().includes(search.toLowerCase()
          )
      )
      .map((header, idx) => {
        let date = new Date(header.created_date);
        // Format the date
        let options = { year: 'numeric', month: 'long', day: 'numeric' };
        let formattedDate = date.toLocaleDateString('en-US', options);

        // Split and reorder the date components
        let [month, day, year] = formattedDate.replace(',', '').split(' ');
        let output = `${year}, ${month}, ${day}`;
        return (
          <tr key={idx} >
            <th className="text-start fw-normal">
              {header.po_buyer}
            </th>
            <th className="fw-normal">
              {header.order_id}
            </th>
            <th className="fw-normal">
              {header.ship_to}
            </th>
            <th className="fw-normal">
              {header.port_shipment}
            </th>
            <th className="fw-normal">
              {header.delv_week_desc}
            </th>
            <th className="fw-normal">
              {header.prod_sku}
            </th>
            <th className="fw-normal">
              {header.product_name}
            </th>
            <th className="fw-normal">
              {formatNumber(header.qty)}
            </th>
            <th className="fw-normal">
              {header.cont_qty} x {header.container_name}
            </th>
            <th className="fw-normal">
              {output}
            </th>
            <th className="fw-normal">
              {header.created_by}
            </th>
            <th className="fw-normal">
              {header.status_name}
            </th>
            <th className="fw-normal">
              {header.remark}
            </th>
          </tr>
        )
      }
      )
  }

  const printRealTable = () => {

    return orderReal
      .sort((a, b) => {
        if (sortedBy !== null && sortDirection === "Asc") {
          // Sort based on the "po_buyer" property
          if (sortedBy === "delv_week_desc" || sortedBy === "created_date" || sortedBy === "stuffing_week") {
            // Handle date properties using new Date() for comparison
            return new Date(a[sortedBy]) - new Date(b[sortedBy]);
          } else {
            if (a[sortedBy] < b[sortedBy]) return -1;
            if (a[sortedBy] > b[sortedBy]) return 1;
            return 0;
          }
        }
        else if (sortedBy !== null && sortDirection === "Desc") {
          // Default sorting logic if sortedBy is not "PO_Buyer"
          if (sortedBy === "delv_week_desc" || sortedBy === "created_date" || sortedBy === "stuffing_week") {
            // Handle date properties using new Date() for comparison
            return new Date(a[sortedBy]) - new Date(b[sortedBy]);

          } else {
            if (a[sortedBy] > b[sortedBy]) return -1;
            if (a[sortedBy] < b[sortedBy]) return 1;
            return 0; // You can replace this with your desired default sorting logic

          }
        } else {
          return a - b;
        }


      })
      .filter(
        (header) =>
          String(header.order_status).includes(statusValue)
          &&
          header.po_buyer.toLowerCase().includes(search.toLowerCase())
          ||
          header.order_id.toLowerCase().includes(search.toLowerCase())

      )
      .map((real, idx) => {
        let date = new Date(real.stuffing_date);

        // Format the date
        let options = { year: 'numeric', month: 'long', day: 'numeric' };
        let formattedDate = date.toLocaleDateString('en-US', options);

        // Split and reorder the date components
        let [month, day, year] = formattedDate.replace(',', '').split(' ');
        let output = `${year}, ${month}, ${day}`;

        return (
          <tr key={idx}>
            <th className="text-start fw-normal">
              {real.po_buyer}
            </th>
            <th className="fw-normal">
              {real.order_id}
            </th>
            <th className="fw-normal">
              {real.ship_to}
            </th>
            <th className="fw-normal">
              {real.port_of_discharge}
            </th>
            <th className="fw-normal">
              {real.stuffing_week}
            </th>
            <th className="fw-normal">
              {real.product_sku}
            </th>
            <th className="fw-normal">
              {real.product_description}
            </th>
            <th className="fw-normal">
              {formatNumber(real.realization_quantity)}
            </th>
            <th className="fw-normal">
              {real.completion_note}
            </th>
            <th className="fw-normal">
              {real.po_date}
            </th>
            <th className="fw-normal">
              {real.submitted_by}
            </th>
            <th className="fw-normal">
              {real.order_status}
            </th>
            <th className="fw-normal">
              {real.order_remarks}
            </th>
            <th className="fw-normal">
              {real.container_id}
            </th>
            <th className="fw-normal">
              {real.stuffing_date}
            </th>
            <th className="fw-normal">
              {real.etd}
            </th>
            <th className="fw-normal">
              {real.eta}
            </th>
          </tr>
        )
      }
      )
  }

  const printOrderHeader = () => {

    return orderHeader.map((header, idx) => {
      const { jsxElements, totalContainerCount, bulk } = printOrderDetails(header.order_id);
      return (

        <div key={idx} className="card-body border border_radius_10px shadow shadow-sm mt-3 mr-1 ml-1 mb-2">

          <div className="row">
            <div className="col-12 col-md-8">
              <div className="row">
                <div className="col-12 align-items-center d-flex mt-1">
                  <span className="grey_text_bold fs-6 d-flex align-items-center">
                    Stuffing Week&nbsp;:&nbsp;

                  </span>

                </div>
                <div className="col-12  text-start">
                  <span className="grey_text fs-8 ">{header.delv_week_desc}</span>
                </div>

              </div>
            </div>

            <div className="col-12 col-md-4 justify-content-end  align-items-center  d-none d-md-flex">
              <div className=" w-100 ">
                <div className="   d-flex justify-content-end"

                >
                  {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
                    <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 yellow_background">
                      {header.status_name}
                    </div>
                    :
                    header.is_status === 4 ?
                      <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 green_background">
                        {header.status_name}
                      </div>
                      :
                      <div className="border border_radius_10px px-2 py-1 white_text_bold fs-6 red_background">
                        {header.status_name}
                      </div>
                  }
                </div>
              </div>

            </div>

            <div className="row  ms-1 d-md-none ps-2">
              <div className="col-12  d-flex justify-content-start py-1 ps-0 pe-2">
                <div className=" w-100  ">
                  <div className="   d-flex justify-content-center "

                  >
                    {header.is_status === 0 || header.is_status === 1 || header.is_status === 2 || header.is_status === 3 ?
                      <div className="border border_radius_10px w-100 px-2 py-1 white_text_bold fs-6 yellow_background">
                        {header.status_name}
                      </div>
                      :
                      header.is_status === 4 ?
                        <div className="border border_radius_10px w-100 px-2 py-1 white_text_bold fs-6 green_background">
                          {header.status_name}
                        </div>
                        :
                        <div className="border border_radius_10px w-100 px-2 py-1 white_text_bold fs-6 red_background">
                          {header.status_name}
                        </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row my-2">
            <div className="border-bottom border-secondary"></div>
          </div>


          <div className="container-fluid px-0">
            <div className="row ">


              <div className="col-12 col-md-4 d-flex justify-content-center mt-2">
                <div className="col-12   ">
                  <div className="card  border_radius_10px shadow-sm py-3 px-3 ">
                    <div className="row">

                      <div className="col-12">
                        <div className="container px-0">
                          <div className="row">
                            <div className="col-5 text-start text-secondary fw-bold px-3 text-start">
                              PO Buyer
                            </div>
                            <div className="col-7 text-secondary px-3 text-end ">
                              {header.po_buyer}
                            </div>
                            <div className="col-7 text-start text-secondary fw-bold px-3 text-start">
                              Total{header.container_name === "Truck" ? " Truck" : " Container"}

                            </div>
                            <div className="col-5 text-secondary px-3 text-end ">

                              {`${header.cont_qty} x ${header.container_name}`}
                            </div>
                            <div className="col-2 text-start text-secondary fw-bold px-3 text-start">
                              <p className="position-absolute">
                                {header.container_name === "Truck" ?
                                  `Dest`
                                  :
                                  `Port`
                                }
                              </p>
                            </div>
                            <div className="col-10 text-secondary px-3 text-end ">
                              {header.container_name === "Truck" ?
                                `${header.final_dest}`
                                :
                                `${header.port_shipment}`}

                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center col-12 mt-2 pe-1">
                      <button
                        className="btn-danger border-2 shadow-sm border_radius_10px fw-bold fs-6 px-4 "
                        onClick={(value) => {
                          sessionStorage.setItem(
                            "showDetailsOrderId",
                            header.order_id
                          );
                          setTimeout(() => {
                            navigate(`/e-order/transaction/details/${header.order_id}`);
                          }, 1500);
                        }}
                      >
                        Show Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-8">
                {jsxElements}
              </div>

            </div>
          </div>
        </div>
      );
    });
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

  const now = new Date(Date.now());

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(now.getDate()).padStart(2, '0');

  const formattedDate = `${year}-${month}-${day}`;
  const formatNumber = (value) => {
    if (value === '') return '';
    if (value === undefined) return '';
    return parseFloat(value).toLocaleString(); // Format number with commas
  };
  const downloadExcelReal = () => {
    const table = document.getElementById('TableDataReal'); // Replace 'html-table' with the id of your HTML table
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `DataRealization-${formattedDate}.xlsx`);
  };

  const downloadExcelReport = () => {
    const table = document.getElementById('TableDataReport'); // Replace 'html-table' with the id of your HTML table
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `DataOrder-${formattedDate}.xlsx`);
  };

  const handleDownload = (dataType) => {
    if (!toggleorderreal) {
      downloadExcelReal();
    } else if (toggleorderreal) {
      downloadExcelReport();
    } else {
      // Handle unsupported data type
      console.error('Unsupported data type');
    }
  };

  const [toggleorderreal, setTogleorderreal] = useState(true)
  const handleToggleOrderreal = () => {
    setTogleorderreal(prevState => !prevState); // Toggle the state
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
          {/* CONTENT BELOW */}

          <div className=" col-md-11 col-12 mt-3 padding_start_custom ">
            <div className="pb-5 pt-4 ">
              {/* HEADER */}
              <div className="row text-secondary pb-3 " >
                <div className="col-12 d-flex  pt-1 pb-3 ps-4 ps-md-0">
                  <span
                    onClick={() => navigate("/e-order/dashboard")}
                    className="pointer grey_text_normal_20px">
                    e-order
                  </span>
                  <span className="grey_text_20px">
                    &nbsp;/ Transaction List
                  </span>
                </div>



                <SearchFilterComponent
                  limit={limit}
                  order_by_week={order_by_week}
                  setOrder_by_week={setOrder_by_week}
                  stuffingend={stuffingend}
                  handleStuffingendChange={handleStuffingendChange}
                  startWeek2={startWeek2}
                  startWeek={startWeek}
                  handleLimitChange={handleLimitChange}
                  setLimit={setLimit}
                  setPage={setPage}
                  desc={desc}
                  setDesc={setDesc}
                  handleFindChange={handleFindChange}
                  setLoading={setLoading}
                  setFind={setFind}
                  setStuffingstart={setStuffingstart}
                  setStatus={setStatus}
                  setStuffingend={setStuffingend}
                />

                <div className="col-9 py-1 mt-2">
                  <div className="row justify-content-start px-0">
                    <div className="col-12  d-flex align-items-center justify-content-start ">
                      <div
                        className=" btn btn-outline-secondary shadow-sm px-2f
                    "
                        onClick={() => {
                          handleToggleGrid()
                          if (!gridcard) {
                            setTogleorderreal(true)
                          }
                        }
                        }
                      >

                        {gridcard ?
                          <span>
                            <TbLayoutDashboard style={{ fontSize: "20px" }} className="d-inline-block mb-1" />
                            &nbsp;Table List
                          </span>
                          :

                          <span>
                            <FaListUl style={{ fontSize: "18px" }} className="d-inline-block mb-1" />
                            &nbsp;Card List
                          </span>
                        }
                      </div>


                      <div className={` btn  mx-2 px-2 shadow-sm ` + (!toggleorderreal ? `active disabled btn-secondary` : `btn-outline-secondary`)}
                        onClick={() => {
                          setTogleorderreal(false);
                          handleToggleGrid("a");
                        }}
                      >
                        Realization List
                      </div>

                      {!gridcard ?
                        <>

                          <div className={` btn  mx-2 px-2 shadow-sm ` + (toggleorderreal ? `active btn-secondary disabled` : `btn-outline-secondary`)}
                            onClick={() => setTogleorderreal(true)}
                          >
                            Order List
                          </div>

                          <div
                            className=" btn btn-success  fw- ms-3 shadow-sm px-2
                          
                    "
                            disabled={!orderinfo}
                            onClick={() => handleDownload()}
                          >

                            <span>
                              <IoMdDownload style={{ fontSize: "21px" }} className="d-inline-block mb-1" />
                              &nbsp;Download
                            </span>


                          </div>
                        </>



                        :
                        <>
                        </>
                      }


                    </div>



                  </div>
                </div>

                <div className="col-3 d-flex align-items-center px-0">
                  <LimiterComponent
                    limit={limit}
                    setLimit={setLimit}
                  />
                </div>


                {loading ? (
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
                ) :
                  <>

                    <div className="px-3">
                      {gridcard === true ?
                        (
                          printOrderHeader()

                        ) :



                        toggleorderreal ?
                          (
                            <div className="table-responsive ">
                              <table
                                id="TableDataReport"
                                style={{ width: "3200px" }}
                                className=" table table-striped mt-3">
                                <thead className="table-dark sticky-top">
                                  <tr>
                                    <th
                                      data-column-id="po_buyer"
                                      className="d-flex align-items-center text-start position-relative"
                                    >
                                      PO Buyer
                                      <div className="end-0 position-absolute text-white">
                                        <div className="vstack gap-3">
                                          {/* Ascending sorting arrow */}
                                          <div
                                            className={"pointer-arrow" + (sortedBy === "po_buyer" && sortDirection === "Asc" ? " active" : "")}
                                            onClick={handleTableSortAsc}
                                          >
                                            <RxTriangleUp />
                                          </div>
                                          {/* Descending sorting arrow */}
                                          <div
                                            className={"pointer-arrow" + (sortedBy === "po_buyer" && sortDirection === "Desc" ? " active" : "")}
                                            onClick={handleTableSortDesc}
                                          >
                                            <RxTriangleDown />
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="order_id"
                                      className="position-relative">
                                      Order ID
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_id" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >

                                              <RxTriangleUp />

                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_id" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />

                                            </div>

                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="ship_to"
                                      className="position-relative">
                                      Ship to Party
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "ship_to" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "ship_to" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="delv_week_desc"
                                      className="position-relative">
                                      Port of Discharge
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "delv_week_desc" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "delv_week_desc" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="delv_week_desc"
                                      className="position-relative">
                                      Stuffing Week
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "delv_week_desc" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "delv_week_desc" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="prod_sku_1"
                                      className="position-relative">
                                      Product SKU
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "prod_sku_1" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "prod_sku_1" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="product_name_1"
                                      className="position-relative">
                                      Product Description
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_name_1" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_name_1" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="qty1"
                                      className="position-relative">
                                      Quantity
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "qty1" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "qty1" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="Completion_note"
                                      className="position-relative">
                                      Completion Note
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Completion_note" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Completion_note" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="created_date"
                                      className="position-relative">
                                      PO Date
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "created_date" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "created_date" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="Submited_by"
                                      className="position-relative">
                                      Submited by
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Submited_by" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Submited_by" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="status_name"
                                      className="position-relative">
                                      Order Status
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "status_name" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "status_name" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="Remark"
                                      className="position-relative">
                                      Remark
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Remark" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Remark" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {printOrderTable()}
                                  <tr className="no-border">
                                    <th style={{ borderRadius: "0px 0px 0px 10px" }}>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th style={{ borderRadius: "0px 0px 10px 0px" }}>
                                    </th>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )
                          :
                          (
                            <div className="table-responsive ">
                              <table
                                id="TableDataReal"
                                style={{ width: "3200px" }}
                                className=" table table-striped mt-3">
                                <thead className="table-dark sticky-top">
                                  <tr>
                                    <th
                                      data-column-id="po_buyer"
                                      className="d-flex align-items-center text-start position-relative"
                                    >
                                      PO Buyer
                                      <div className="end-0 position-absolute text-white">
                                        <div className="vstack gap-3">
                                          {/* Ascending sorting arrow */}
                                          <div
                                            className={"pointer-arrow" + (sortedBy === "po_buyer" && sortDirection === "Asc" ? " active" : "")}
                                            onClick={handleTableSortAsc}
                                          >
                                            <RxTriangleUp />
                                          </div>
                                          {/* Descending sorting arrow */}
                                          <div
                                            className={"pointer-arrow" + (sortedBy === "po_buyer" && sortDirection === "Desc" ? " active" : "")}
                                            onClick={handleTableSortDesc}
                                          >
                                            <RxTriangleDown />
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="order_id"
                                      className="position-relative">
                                      Order ID
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_id" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >

                                              <RxTriangleUp />

                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_id" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />

                                            </div>

                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="ship_to"
                                      className="position-relative">
                                      Ship to Party
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "ship_to" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "ship_to" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="port_of_discharge"
                                      className="position-relative">
                                      Port of Discharge
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "port_of_discharge" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "port_of_discharge" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id=" "
                                      className="position-relative">
                                      Stuffing Week
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "stuffing_week" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "stuffing_week" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="product_sku"
                                      className="position-relative">
                                      Product SKU
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_sku" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_sku" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >

                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="product_description"
                                      className="position-relative">
                                      Product Description
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_description" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "product_description" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="realization_quantity"
                                      className="position-relative">
                                      Quantity
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "realization_quantity" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "realization_quantity" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="Completion_note"
                                      className="position-relative">
                                      Completion_note
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Completion_note" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "Completion_note" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="po_date"
                                      className="position-relative">
                                      PO Date
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "po_date" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "po_date" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="submitted_by"
                                      className="position-relative">
                                      Submited by
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "submitted_by" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "submitted_by" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="order_status"
                                      className="position-relative">
                                      Order Status
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_status" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_status" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="order_remarks"
                                      className="position-relative">
                                      Remark
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_remarks" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "order_remarks" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="container_id"
                                      className="position-relative">
                                      Container ID
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "container_id" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "container_id" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="stuffing_date"
                                      className="position-relative">
                                      Stuffing Date
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "stuffing_date" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "stuffing_date" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="etd"
                                      className="position-relative">
                                      ETD
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "etd" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "etd" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                    <th
                                      data-column-id="eta"
                                      className="position-relative">
                                      ETA
                                      <div className=" top-0 end-0 h-100  position-absolute d-flex">
                                        <div className=" d-flex align-items-center ">
                                          <div className="vstack gap-3">
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "eta" && sortDirection === "Asc" ? " active" : "")}
                                              onClick={handleTableSortAsc}
                                            >
                                              <RxTriangleUp />
                                            </div>
                                            <div
                                              className={"pointer-arrow" + (sortedBy === "eta" && sortDirection === "Desc" ? " active" : "")}
                                              onClick={handleTableSortDesc}
                                            >
                                              <RxTriangleDown />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {printRealTable()}
                                  <tr className="no-border">
                                    <th style={{ borderRadius: "0px 0px 0px 10px" }}>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th>
                                    </th>
                                    <th style={{ borderRadius: "0px 0px 10px 0px" }}>
                                    </th>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )


                      }


                    </div>
                    {toggleorderreal ?
                      (<>
                        {totalPage !== 0 && page && (
                          <div className="col-12 d-flex justify-content-center mt-3">
                            <nav aria-label="Page navigation example">
                              <ul className="pagination text_muted">


                                <li className="page-item d-flex align-items-center fs-6">
                                  <a className="page-link text-dark d-flex align-items-center"
                                    style={{ height: "37px" }}
                                    onClick={handlePageDecrement}
                                  >
                                    <BsChevronLeft />
                                  </a>
                                </li>



                                {!([1, 2, 3, 4, 5, 6].includes(page)) ?
                                  <>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="page-link text-muted"
                                        style={{ height: "37px" }}
                                        onClick={() => handlePageChange(1)}
                                        href="#"
                                      >
                                        1
                                      </a>
                                    </li>
                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="user-select-none page-link text-muted"
                                        style={{ height: "37px" }}

                                      >
                                        ...
                                      </a>
                                    </li>

                                  </>

                                  :
                                  ""
                                }

                                {pageIndices.map((index, indexkey) => {
                                  // Calculate the range of pages to display
                                  const start = Math.max(1, page - 3);
                                  const end = Math.min(totalPage, page + 3);
                                  // Only render page numbers within the range
                                  if (index + 1 >= start && index + 1 <= end) {
                                    return (
                                      <li key={indexkey} className="page-item d-flex align-items-center fs-6" key={index}>
                                        <a className={("page-link ") + (page === index + 1 ? "fw-bold text-danger" : "text-muted")}
                                          style={{ height: "37px" }}
                                          onClick={() => handlePageChange(index + 1)}
                                          href="#"
                                        >
                                          {index + 1}
                                        </a>
                                      </li>
                                    );
                                  }
                                  return null;
                                })}

                                {!([totalPage, totalPage - 1, totalPage - 2, totalPage - 3, totalPage - 4, totalPage - 5].includes(page)) ?
                                  <>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="user-select-none page-link text-muted"
                                        style={{ height: "37px" }}

                                      >
                                        ...
                                      </a>
                                    </li>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="page-link text-muted"
                                        style={{ height: "37px" }}
                                        onClick={() => handlePageChange(totalPage)}
                                        href="#"
                                      >
                                        {totalPage}
                                      </a>
                                    </li>


                                  </>

                                  :
                                  ""
                                }

                                <li className="page-item d-flex align-items-center fs-6">
                                  <a className="page-link text-dark  d-flex align-items-center"
                                    style={{ height: "37px" }}
                                    onClick={handlePageIncrement}
                                  >
                                    <BsChevronRight />
                                  </a>
                                </li>



                              </ul>
                            </nav>
                          </div>
                        )}
                      </>
                      )
                      :
                      (<>
                        {totalPageReal !== 0 && page && (
                          <div className="col-12 d-flex justify-content-center mt-3">
                            <nav aria-label="Page navigation example">
                              <ul className="pagination text_muted">


                                <li className="page-item d-flex align-items-center fs-6">
                                  <a className="page-link text-dark d-flex align-items-center"
                                    style={{ height: "37px" }}
                                    onClick={handlePageDecrement}
                                  >
                                    <BsChevronLeft />
                                  </a>
                                </li>



                                {!([1, 2, 3, 4, 5, 6].includes(page)) ?
                                  <>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="page-link text-muted"
                                        style={{ height: "37px" }}
                                        onClick={() => handlePageChange(1)}
                                        href="#"
                                      >
                                        1
                                      </a>
                                    </li>
                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="user-select-none page-link text-muted"
                                        style={{ height: "37px" }}

                                      >
                                        ...
                                      </a>
                                    </li>

                                  </>

                                  :
                                  ""
                                }

                                {pageIndices.map((index, indexkey) => {
                                  // Calculate the range of pages to display
                                  const start = Math.max(1, page - 3);
                                  const end = Math.min(totalPageReal, page + 3);
                                  // Only render page numbers within the range
                                  if (index + 1 >= start && index + 1 <= end) {
                                    return (
                                      <li key={indexkey} className="page-item d-flex align-items-center fs-6" key={index}>
                                        <a className={("page-link ") + (page === index + 1 ? "fw-bold text-danger" : "text-muted")}
                                          style={{ height: "37px" }}
                                          onClick={() => handlePageChange(index + 1)}
                                          href="#"
                                        >
                                          {index + 1}
                                        </a>
                                      </li>
                                    );
                                  }
                                  return null;
                                })}

                                {!([totalPageReal, totalPageReal - 1, totalPageReal - 2, totalPageReal - 3, totalPageReal - 4, totalPageReal - 5].includes(page)) ?
                                  <>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="user-select-none page-link text-muted"
                                        style={{ height: "37px" }}

                                      >
                                        ...
                                      </a>
                                    </li>

                                    <li

                                      className="page-item d-flex align-items-center fs-6">
                                      <a className="page-link text-muted"
                                        style={{ height: "37px" }}
                                        onClick={() => handlePageChange(totalPageReal)}
                                        href="#"
                                      >
                                        {totalPageReal}
                                      </a>
                                    </li>


                                  </>

                                  :
                                  ""
                                }

                                <li className="page-item d-flex align-items-center fs-6">
                                  <a className="page-link text-dark  d-flex align-items-center"
                                    style={{ height: "37px" }}
                                    onClick={handlePageIncrement}
                                  >
                                    <BsChevronRight />
                                  </a>
                                </li>



                              </ul>
                            </nav>
                          </div>
                        )}
                      </>)
                    }


                  </>
                }


                <div
                  className={orderinfo > [] ? "d-none" : "d-block pt-3 mt-3"}
                >
                  {/* <h1 className="text-muted fw-bold pb-3 fs-1">
                    There are no order found.
                  </h1> */}

                  <h5 className="text-muted">
                    {find ?
                      " Nothing Found on Search"
                      :
                      "Checkout an order and it will appear here!"

                    }
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ControlBar />
    </div >
  );
};

export default ListTransactionPage;
