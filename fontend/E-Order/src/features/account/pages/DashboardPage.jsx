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
import { API_URL } from "../../../config";
import { useSelector, useDispatch } from "react-redux";

import BannerComponentGlobal from "../../../components/landing/BannerComponentGlobal.jsx";
import LastTransactionComponent from "../../../components/order/LastTransactionComponent.jsx";
import OngoingTransactionComponent from "../../../components/order/OngoingTransactionComponent.jsx";
import ControlBar from "../../../components/layout/ControlBar.jsx";
import DeliverToComponent from "../../../components/order/DeliverToComponent.jsx";

import Sidebar from "../../../components/layout/Sidebar.jsx";

import { MdFireTruck } from "react-icons/md";

import { clearSeasonStorage } from "../../../action/cartAction";
import ReadCatalogue from "../../../components/landing/ReadCatalogue.jsx";
import { useLocation } from "react-router-dom"
import { seasonOut, loginAction, logoutAction } from "../../../action/userAction";


const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const { active, type_id } = useSelector((state) => {
    return {
      active: state.userReducer.active,
      type_id: state.userReducer.type_id
    };
  });
  const location = useLocation();
  let userToken = localStorage.getItem("tokek");
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






