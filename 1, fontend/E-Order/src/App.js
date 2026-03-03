import React, { useEffect, useState } from "react";
// import logo from './logo.svg';
import "./App.css";
// import 'bootstrap/dist/css/bootstrap.css';
// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.bundle.min";

// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import Axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import ReactGA from 'react-ga';
//ACTIONS
import { loginAction, seasonOut, logoutAction } from "./action/userAction";
import { API_URL } from "./config";

import { useNavigate, useLocation } from "react-router-dom";

//PAGES
import DashboardPage from "./pages/account/DashboardPage.jsx";
import ProductCatalogPage from "./pages/orders/ProductCatalogPage.jsx";
import LandingPage from "./pages/public/LandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import MaintenanceLoginPage from "./pages/auth/MaintenanceLoginPage.jsx";
import NotFoundPage from "./pages/error/NotFoundPage.jsx";
import MaintenancePage from "./pages/error/MaintenancePage.jsx";
import DetailProduct from "./pages/public/DetailProduct.jsx";
import SubmittedOrderPage from "./pages/orders/SubmittedOrderPage.jsx";
import OrderSummaryPage from "./pages/orders/OrderSummaryPage.jsx";
import CartPage from "./pages/orders/CartPage.jsx";
import AddMoreProductPage from "./pages/orders/AddMoreProductPage.jsx";
import ListTransactionPage from "./pages/orders/ListTransactionPage.jsx";
import ProfilePage from "./pages/account/ProfilePage.jsx";
import HelpPage from "./pages/public/HelpPage.jsx";
import FAQPage from "./pages/public/FAQPage.jsx";
import Feedback from "./pages/support/Feedback.jsx";
import GlossaryPage from "./pages/public/GlossaryPage.jsx";
import OrderConfirmationPage from "./pages/orders/AddMoreContainerOrder/ContainerOrderConfirmationPage";
import TruckOrderConfirmation from "./pages/orders/AddMoreTruckOrder/TruckOrderConfirmation";
import CartTruckOrderConfirmation from "./pages/orders/AddMoreTruckOrder/CartTruckOrderConfirmation";

import OrderDetailPage from "./pages/orders/OrderDetailPage.jsx";
import ContactUsPage from "./pages/public/ContactUsPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import Tutorial from "./pages/public/Tutorial.jsx";

//ADMIN
import AccountManagementPage from "./pages/admin/management/AccountManagementPage";
import CreateAccountPage from "./pages/admin/management/CreateAccount";
import ItemConfig from "./pages/admin/config/ItemConfig";
import FeedbackAdmin from "./pages/admin/audit/FeedbackAdmin";
import BannerSettings from "./pages/admin/config/BannerSettings";
import OrderReport from "./pages/admin/reports/OrderReport";
import EventAuditPage from "./pages/admin/audit/EventAuditPage";

//Cabang-landingpage
import Noodlepage from "./pages/public/LandingPageProduct/NoodlePage.jsx";
import Dairypage from "./pages/public/LandingPageProduct/Dairypage.jsx";
import Snackpage from "./pages/public/LandingPageProduct/Snackpage.jsx";
import Seasoningpage from "./pages/public/LandingPageProduct/SeasoningPage.jsx";
import Healthypage from "./pages/public/LandingPageProduct/HealthyFood.jsx";
import Aboutus from "./pages/public/Aboutus.jsx";

// Ditambah Blog
import Blog from "./blog/index";
import Blogevent from "./blog/Event";
import Blognews from "./blog/News";
import Blogdraft from "./blog/draft";
import BlogEdit from "./blog/edit";
import BlogAddNew from "./blog/addnew";

// TERNAK LELE
import ImageUploader from "./pages/tools/ImageUploader.jsx";
import Proforma_Invoice from "./pages/orders/Proforma_Invoice.jsx"
import ReportingDashboard from "./pages/admin/reports/ReportingDashboard";
import AddMoreTruckPage from "./pages/orders/AddMoreTruckOrder/AddMoreTruckPage";
import ContainerTracking from "./pages/admin/tracking/ContainerTracking/ContainerTracking";
import Landingpagetw from "./pages/Event/TW/Landingpagetw";
import AdminEventTw from "./pages/Event/TW/Admin/AdminEventTW1";
import EventTwGenerator from "./pages/Event/TW/Admin/Generator/EventTwGenerator";
import TnCEventTw from "./pages/Event/TW/TnCEventTw";
import BasePageWithSidebar from "./pages/layout/BasePageWithSidebar.jsx";
import Webmail from "./pages/tools/Webmail/Webmail.jsx";
import AdminEventTwWin from "./pages/Event/TW/Admin/AdminEventTW2WIN";
import ListWinnerPublic from "./pages/Event/TW/ListWinnerPublic";
import LandingpageUSA from "./pages/Event/USA/LandingpageUSA";
import AdminEventUSA1 from "./pages/Event/USA/Admin/AdminEventUSA1";
import DashboardAdmin from "./pages/admin/dashboard/DashboardAdmin";
import { useToast } from "@chakra-ui/react";
import IndofoodPO from "./pages/orders/IndofoodPO/IndofoodPO";
import TncLogin from "./pages/legal/Tnc/TncLogin";
import TncInside from "./pages/legal/Tnc/TncInside";
import CheckToken from "./features/auth/components/CheckToken/CheckToken";
import PageContainerTracking from "./pages/admin/tracking/ContainerTracking/PageContainerTracking";

// Event Maldives
import LandingPageMaldives from "./pages/Event/Maldives/LandingPageMaldives";

// Shared Coupon Pages
import EventCouponPage from "./pages/Event/Shared/EventCouponPage";
import EventCouponSuccess from "./pages/Event/Shared/EventCouponSuccess";
import EventCouponFail from "./pages/Event/Shared/EventCouponFail";
function App() {
  const toast = useToast();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    ReactGA.initialize('G-PTXJ1SE2J8');
    ReactGA.pageview(location.pathname + location.search);

  }, [location]);




  const type_id = useSelector((state) => state.userReducer.type_id);
  const user_id = useSelector((state) => state.userReducer.user_id);


  // const [serverStatus, setServerStatus] = useState(false);
  // const getServerStatus = () => {
  //   Axios.get(API_URL + "/auth/ping")
  //     .then((res) => {
  //       setServerStatus(res.data.status)
  //     })
  //     .catch((err) => {
  //     });
  // };










  return (
    <div className="App">

      <Routes basename="/">
        <Route
          path="/i2i/containertracking/:number?/:so_id?"
          element={<ContainerTracking admin />}
        />

        <Route
          path="/e-order/containertracking/:number?/:so_id?"
          element={<ContainerTracking />}
        />

        {/* PUBLIC ACCESS */}
        {!user_id && (
          <>
            {/* {serverStatus === true ?
              <Route path="/e-order/login" element={<LoginPage />} />
              :
              <Route path="/e-order/login" element={<MaintenancePage />} />
            } */}
            {/* <Route path="/504" element={<MaintenancePage />} /> */}
            <Route path="/e-order/indofoodpo/:so_id" element={<IndofoodPO />} />


            <Route path="/i2i/containertracking/:number" element={<ContainerTracking admin={true} />} />


            <Route path="/" element={<LandingPage />} />
            <Route path="/e-order" element={<LandingPage />} />
            <Route path="/e-order/indofoodpo/:so_id" element={<IndofoodPO />} />
            <Route path="/e-order/login" element={<LoginPage />} />
            <Route path="/e-order/jahwgefys" element={<MaintenanceLoginPage />} />
            <Route path="/e-order/forgot-password/:token" element={<ForgotPasswordPage />} />
            {/* <Route path="/e-order/forgot-password" element={<ForgotPasswordPage />} /> */}

            {/* BLOG */}
            <Route path="/product/noodle" element={<Noodlepage />} />
            <Route path="/product/dairy" element={<Dairypage />} />
            <Route path="/product/snack" element={<Snackpage />} />
            <Route path="/product/seasoning" element={<Seasoningpage />} />
            <Route path="/product/healthyfood" element={<Healthypage />} />
            <Route path="/aboutiod" element={<Aboutus />} />

            {/* Ditambahin buat blog */}
            <Route path="/blog/" element={<Blog />} />
            <Route path="*" element={<NotFoundPage />} />

            {/* Ditambahin buat Event */}

            {/* Taiwan */}
            <Route path="/event/tw" element={<Landingpagetw />} />
            <Route path="/event/tw/admin" element={<AdminEventTw />} />
            <Route path="/event/tw/admin/win" element={<AdminEventTwWin />} />
            <Route path="/event/tw/admin/win2" element={<ListWinnerPublic />} />
            <Route path="/event/tw/admin/generator" element={<EventTwGenerator />} />
            <Route path="/event/tw/tnc" element={<TnCEventTw />} />

            {/* USA */}
            <Route path="/event/usa" element={<LandingpageUSA />} />
            <Route path="/event/usa/admin" element={<AdminEventUSA1 />} />
            <Route path="/event/tw/admin/generator" element={<EventTwGenerator />} />

            {/* Maldives */}
            <Route path="/event/maldives" element={<LandingPageMaldives />} />
            <Route path="/event/maldives/admin" element={<AdminEventUSA1 />} />
            <Route path="/event/maldives/admin/generator" element={<EventTwGenerator />} />

            {/* Shared Coupon Routes (Public) */}
            <Route path="/event/maldives/coupon/:code" element={<EventCouponPage />} />
            <Route path="/event/maldives/:code/success" element={<EventCouponSuccess />} />
            <Route path="/event/maldives/:code/fail" element={<EventCouponFail />} />

            <Route path="/e-order/termsncondition" element={<TncInside />} />


            {/* Ditambahin buat Webmail */}
            <Route path="/webmail" element={<Webmail />} />


          </>
        )}


        {/* ADMIN */}
        {type_id === 9 ? (
          <>
            <Route path="/" element={<CheckToken />} >

              <Route path="/e-order/containertracking" element={<PageContainerTracking />} />


              <Route path="/e-order/indofoodpo/:so_id" element={<IndofoodPO />} />
              <Route path="/e-order/dashboard" element={<DashboardAdmin />} />
              <Route path="/e-order/feedbackadmin" element={<FeedbackAdmin />} />
              <Route path="/e-order/admin" element={<AccountManagementPage />} />
              <Route path="/e-order/createaccount" element={<CreateAccountPage />} />
              <Route path="/e-order/itemconfig" element={<ItemConfig />} />
              <Route path="/e-order/bannerSettings" element={<BannerSettings />} />
              <Route path="/e-order/PI" element={<Proforma_Invoice />} />
              <Route path="/e-order/reporting" element={<ReportingDashboard />} />
              <Route path="/e-order/order-report" element={<OrderReport />} />
              <Route path="/e-order/audit" element={<EventAuditPage />} />
            </Route>
            {/* <Route path="/blog/" element={<Blog />} />
            <Route path="/blog/edit" element={<BlogEdit />} />
            <Route path="/blog/event" element={<Blogevent />} />
            <Route path="/blog/draft" element={<Blogdraft />} />
            <Route path="/blog/news" element={<Blognews />} />
            <Route path="/blog/addnew" element={<BlogAddNew />} /> */}
          </>
        ) : null}

        {/* ADMIN BLOG */}
        {type_id === 8 ? (
          <>
            {/* Ditambahin buat blog */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/e-order" element={<LandingPage />} />
            <Route path="/blog/" element={<Blog />} />
            <Route path="/blog/edit" element={<BlogEdit />} />
            <Route path="/blog/event" element={<Blogevent />} />
            <Route path="/blog/draft" element={<Blogdraft />} />
            <Route path="/blog/news" element={<Blognews />} />
            <Route path="/blog/addnew" element={<BlogAddNew />} />

            <Route path="*" element={<NotFoundPage />} />
          </>
        ) : null}

        {/* ACCESSED WITH USER_ID */}
        {user_id ? (
          <>

            <Route path="/" element={<CheckToken />} >



              <Route path="/event/usa" element={<LandingpageUSA />} />

              <Route path="/" element={<LandingPage />} />
              <Route path="/e-order" element={<LandingPage />} />

              <Route path="/aboutiod" element={<Aboutus />} />
              <Route path="/product/noodle" element={<Noodlepage />} />
              <Route path="/product/dairy" element={<Dairypage />} />
              <Route path="/product/snack" element={<Snackpage />} />
              <Route path="/product/seasoning" element={<Seasoningpage />} />
              <Route path="/product/healthyfood" element={<Healthypage />} />

              <Route path="/e-order/dashboard" element={<DashboardPage />} />
              <Route path="/e-order/catalog" element={<ProductCatalogPage />} />
              <Route path="/e-order/profile" element={<ProfilePage />} />
              <Route path="/e-order/containertracking" element={<ContainerTracking />} />

              <Route path="/e-order/indofoodpo/:so_id" element={<IndofoodPO />} />

              {/* <Route path="/e-order/product/detail" element={<DetailProduct />} /> */}

              <Route path="/e-order/transaction" element={<ListTransactionPage />} />
              <Route path="/e-order/transaction/details" element={<OrderDetailPage />} />
              <Route path="/e-order/transaction/details/:order_id_by_params" element={<OrderDetailPage />} />

              <Route path="/e-order/cart" element={<CartPage />} />

              <Route path="/e-order/help" element={<HelpPage />} />
              <Route path="/e-order/help/FAQ" element={<FAQPage />} />
              <Route path="/e-order/help/feedback" element={<Feedback />} />
              <Route path="/e-order/help/glossary" element={<GlossaryPage />} />
              <Route path="/e-order/help/contact" element={<ContactUsPage />} />
              <Route path="/e-order/help/tutorial" element={<Tutorial />} />
              <Route path="/e-order/help/termsncondition" element={<TncLogin />} />


              <Route path="/e-order/truckorder" element={<AddMoreTruckPage />} />
              <Route path="/e-order/truckorder/confirmation" element={<TruckOrderConfirmation />} />
              <Route path="/e-order/cart/truckorder/confirmation" element={<CartTruckOrderConfirmation edit={true} />} />
              <Route path="/e-order/order" element={<AddMoreProductPage />} />
              <Route path="/e-order/order/confirmation" element={<OrderConfirmationPage />} />
              <Route path="/e-order/cart/confirmation" element={<OrderConfirmationPage edit={true} />} />
              <Route path="/e-order/order/summary" element={<OrderSummaryPage />} />
              <Route path="/e-order/order/confirmation/done" element={<SubmittedOrderPage />} />

              {/* Ditambahin buat blog */}
              <Route path="/blog/" element={<Blog />} />
              <Route path="/blog/edit" element={<BlogEdit />} />
              <Route path="/blog/event" element={<Blogevent />} />
              <Route path="/blog/draft" element={<Blogdraft />} />
              <Route path="/blog/news" element={<Blognews />} />
              <Route path="/blog/addnew" element={<BlogAddNew />} />

              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* development purposes */}
            {/* <Route path="/monyetseblay" element={<ImageUploader />} />  */}

          </>
        ) : null}



      </Routes>
    </div>
  );
}

export default App;

// //bisnis card
// {user_id ? null : (
//   <>
//     <Route path="/" element={<LandingPage />} />
//     <Route path="/e-order" element={<LandingPage />} />

//     <Route path="/noodle" element={<Noodlepage />} />
//     <Route path="/dairy" element={<Dairypage />} />
//     <Route path="/snack" element={<Snackpage />} />
//     <Route path="/seasoning" element={<Seasoningpage />} />
//     <Route path="/healthyfood" element={<Healthypage />} />

//     {/* <Route path="/e-order" element={<LandingPage />} /> */}
//     <Route path="/e-order/login" element={<LoginPage />} />
//     <Route
//       path="/e-order/forgot-password"
//       element={<ForgotPasswordPage />}
//     />


//     {/* Ditambahin buat blog */}
//     <Route path="/blog/" element={<Blog />} />


//     <Route path="*" element={<NotFoundPage />} />
//   </>
// )}





