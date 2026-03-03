import React, { useState, useEffect } from "react";

import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

import {
  // navigate,
  useNavigate,
} from "react-router-dom";

import Axios from "axios";
import { API_URL } from "../config";
import { useSelector, useDispatch } from "react-redux";

import BannerComponentGlobal from "../components/BannerComponentGlobal";
import LastTransactionComponent from "../components/LastTransactionComponent";
import OngoingTransactionComponent from "../components/OngoingTransactionComponent";
import ControlBar from "../components/ControlBar";
import SearchBarComponent from "../components/SearchBarComponent";
import DeliverToComponent from "../components/DeliverToComponent";

import Sidebar from "../components/Sidebar";

import { MdFireTruck } from "react-icons/md";

import { clearSeasonStorage } from "../action/cartAction";
import ReadCatalogue from "../components/ReadCatalogue";
import { useLocation } from "react-router-dom"
import { seasonOut, loginAction, logoutAction } from "../action/userAction";

// import { io } from "socket.io-client"; // Removed

const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // const socket = io("http://172.16.32.30:8888"); // Removed hardcoded socket
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('tokek');
    if (!token) return;

    const eventSource = new EventSource(`${API_URL}/sse/logs?token=${token}`);

    eventSource.addEventListener('new_log', (e) => {
      try {
        const parsed = JSON.parse(e.data);
        setLogs((prevLogs) => [...prevLogs, parsed.data]);
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);


  console.log("logs", logs)

  const { active, type_id } = useSelector((state) => {
    return {
      active: state.userReducer.active,
      type_id: state.userReducer.type_id
    };
  });
  const location = useLocation();
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


  useEffect(() => {
    sessionStorage.removeItem('truckOrders');
  }, [])


  // ================================================== INITIALISE SESSION STORAGE ==================================================

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

  if (initialise === false && (type_id === 3 || type_id === 4)) {
    clearSeasonStorage(order);
    setInitialise(true);
  }



  return (
    <div>
      {/* navbar */}
      <SearchBarComponent type_id={type_id} />

      <div>
        <div className="py-5 mt-2 stick-left">
          <div className="row">
            <div className="col-6 col-sm-12"></div>
            <div className="col-6 col-sm-12">
              <Sidebar />
            </div>
          </div>
        </div>

        <div className="py-5">
          {/* CONTENT BELOW */}

          <div className=" col-md-11 mt-3 padding_start_custom">
            <div className="pb-5 pt-4">
              <div className="px-4">


                {(type_id === 3 || type_id === 4)
                  ?
                  <>
                    {/* Distributor */}
                    <div className="col-12 d-flex mx-7 grey_text_20px pt-1 mb-1  ">

                    </div>
                    <DeliverToComponent />

                  </>
                  : type_id === 9 ?
                    <>
                      {/* Admin */}
                    </>
                    :
                    null}


                <div className="col-12 d-flex mx-7 grey_text_20px pt-1 mb-3  ">
                  {active === 0 ? (
                    <Alert
                      status="error"
                      variant="subtle"
                      flexDirection="column"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      height="200px"
                      className="shadow"
                    >
                      <AlertIcon boxSize="40px" mr={0} />
                      <AlertTitle mt={4} mb={1} fontSize="lg">
                        You cannot Proceed Order!
                      </AlertTitle>
                      <AlertDescription maxWidth="sm">
                        Please contact your regional manager.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </div>

                <BannerComponentGlobal />


                {(type_id === 3 || type_id === 4)
                  ?
                  <>
                    {/* Distributor */}
                    <div className="col-12 d-flex grey_text_20px align-items-center mt-3  mb-3  ">
                      Ongoing Transaction
                    </div>
                    <OngoingTransactionComponent />



                  </>
                  : ""}
                <div className="col-12 d-flex grey_text_20px pt-1  mb-3 mt-4  ">
                  Information
                </div>


                {(type_id === 3 || type_id === 4)
                  ?
                  <>
                    <div className="col-12 d-flex grey_text_20px pt-1  mb-3 mt-4  ">
                      Last Transaction List
                    </div>
                    <LastTransactionComponent />
                  </>
                  : ""}
                {type_id === 9 ?
                  <>
                    {/* Admin */}
                  </>
                  :
                  null}

              </div>
            </div>
          </div>
        </div>
        {(type_id === 3 || type_id === 4)
          ?
          <>
            <ControlBar />
          </>
          : ""}
      </div>
    </div>
  );
};

export default ProductCatalogPage;
