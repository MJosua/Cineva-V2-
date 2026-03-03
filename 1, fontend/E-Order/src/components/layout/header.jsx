import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from "react-router-dom";
import Axios from 'axios';
import { API_URL } from '../../config';
import {
   Menu,
   MenuButton,
   MenuList,
   MenuItem,

   IconButton,
   MenuGroup,
} from '@chakra-ui/react';
import { FaGear } from "react-icons/fa6";

import {
   PlusSquareIcon,
   InfoOutlineIcon,
   ArrowForwardIcon,
   HamburgerIcon,

   ExternalLinkIcon,

   EditIcon
} from '@chakra-ui/icons'



const Header = () => {

   const navigate = useNavigate();
   const location = useLocation();
   const [isMenuActive, setIsMenuActive] = useState(false);
   const [isDropdownActive, setIsDropdownActive] = useState(false);

   const handleMouseEnter = () => {
      setIsMenuActive(true);
   };

   const handleMouseLeave = () => {
      setIsMenuActive(false);
      setIsDropdownActive(false);
   };

   const handleMenuMouseEnter = () => {
      setIsMenuActive(true);
   };

   const handleMenuMouseLeave = () => {
      setIsDropdownActive(false);
   };

   const handleDropdownMouseEnter = () => {
      setIsDropdownActive(true);
   };

   const handleDropdownMouseLeave = () => {
      setIsDropdownActive(false);
      setIsMenuActive(false);
   };


   const [small, setSmall] = useState(false);

   useEffect(() => {
      if (typeof window !== "undefined") {
         window.addEventListener("scroll", () =>
            setSmall(window.pageYOffset > 50)
         );
      }
   }, []);

   const { user_id } = useSelector((state) => {
      return {
         user_id: state.userReducer.user_id
      }
   });


   /**
    * UNTUK MENCEGAH ERROR YANG BERKELANJUTAN KARENA KONEKSI, 
    * MANTINES PAGE DILETAKKAN PADA LOGIN PAGE. EMBEDED
    * 
    * UNTUK MENGAKTIFKAN KEMBALI, NYALAKAN DI BAWAH INI
    */

   // const [serverStatus, setServerStatus] = useState(false);
   // const getServerStatus = () => {
   //    Axios.get(API_URL + "/auth/ping")
   //       .then((res) => {
   //          setServerStatus(res.data.status)
   //       })
   //       .catch((err) => {
   //       });
   // };

   // React.useEffect(() => {
   //    getServerStatus();
   // }, [])

   return (
      <div
         className={` ps-0 ps-md-0   ${small ? "col-12  bg-danger fixed-top shadow" : "col-12  bg-light fixed-top shadow-sm "
            }`}>


         <div className="row px-0 ps-md-5  minus-m-1">
            <div className="col-4 d-flex justify-content-Start ps-5 align-items-center  user-select-none pointer ">
               <img

                  draggable="false"
                  src={`${small ? "/image/logo-white.png" : "/image/logo.png"
                     }`}

                  onClick={() => {
                     navigate('/')
                  }}


                  width="155px"

                  className="user-select-none position-absolute d-flex align-items-center pt-2" />
            </div>
            <div className="col-8 d-flex justify-content-end py-3 pe-5">
               <div className="col-12 d-none d-lg-flex  ">
                  <div className="container-fluid ">
                     <div className="row d-flex justify-content-end">
                        <div className="col-3">
                           <div
                              id="menu"
                              className=

                              {`btn responsive-menu fw-bold rounded-pill w-100 pb-2 px-3 menutext_heavy ${small ? " btn-menu-primary1 text-light " : "btn-menu-primary2 "
                                 }
                                 `
                              }
                              onClick={() =>

                                 navigate('/aboutiod')
                              }
                           >
                              <span
                                 style={location.pathname.includes('/aboutiod') && small ? { borderBottom: '3px solid white' } : (location.pathname.includes('/aboutiod') && !small ? { borderBottom: '3px solid red' } : {})}
                              >About IOD</span>
                           </div>
                        </div>
                        <div className="col-2 px-0 mx-0 ">
                           <div
                              id="menu"

                              className={`fw-bold btn responsive-menu rounded-pill w-100 pb-2 px-3 menutext_heavy  ${small ? "btn-menu-primary1 text-light" : "btn-menu-primary2"
                                 } ${isMenuActive || isDropdownActive ? "btn-menu-primary1 active" : "btn-menu-primary1"
                                 }`}

                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={handleMouseLeave}
                           >
                              <span
                                 style={location.pathname.includes('/product') && small ? { borderBottom: '3px solid white' } : (location.pathname.includes('/product') && !small ? { borderBottom: '3px solid red' } : {})}
                              >
                                 Products
                              </span>
                           </div>
                           {isMenuActive && (
                              <div
                                 className="fw-bold dropdown__menu user-select-none"
                                 onMouseEnter={handleMenuMouseEnter}
                                 onMouseLeave={handleDropdownMouseLeave}
                              >
                                 <ul>
                                    <li onMouseEnter={handleDropdownMouseEnter}

                                       onClick={() =>

                                          navigate('/product/noodle')
                                       }

                                    >Noodles</li>
                                    <li onMouseEnter={handleDropdownMouseEnter}

                                       onClick={() =>

                                          navigate('/product/dairy')
                                       }

                                    >Dairy</li>
                                    <li onMouseEnter={handleDropdownMouseEnter}

                                       onClick={() =>

                                          navigate('/product/snack')
                                       }

                                    >Snack Foods</li>
                                    <li onMouseEnter={handleDropdownMouseEnter}

                                       onClick={() =>

                                          navigate('/product/seasoning')
                                       }
                                    >Food Seasonings</li>
                                    <li onMouseEnter={handleDropdownMouseEnter}

                                       onClick={() =>

                                          navigate('/product/healthyfood')
                                       }

                                    >
                                       Nutrition & Special Foods
                                    </li>
                                 </ul>
                              </div>
                           )}

                        </div>

                        <div className="col-3 ">
                           <div
                              id="menu"

                              onClick={() =>

                                 navigate('/blog')
                              }
                              className=
                              {`btn responsive-menu fw-bold rounded-pill w-100 pb-2 px-3 menutext_heavy ${small ? " btn-menu-primary1 text-light " : "btn-menu-primary2 "
                                 }`}
                           >
                              <span
                                 style={location.pathname.includes('/blog') && small ? { borderBottom: '3px solid white' } : (location.pathname.includes('/blog') && !small ? { borderBottom: '3px solid red' } : {})}
                              >
                                 News & Events
                              </span>
                           </div>
                        </div>

                        <div className="col-3">
                           <div
                              id="menu"
                              className=

                              {`btn w-100 fw-bold rounded-pill pb-2 px-3 responsive-menu  menutext_heavy ${small ? " btn-outline-light " : "btn-outline-danger "}`}



                              onClick={() => {


                                 user_id === null ?

                                    // (
                                    //    serverStatus === false ?
                                    //       navigate('/504')
                                    //       :
                                    //       navigate('/e-order/login')
                                    // )

                                    //matiin ini yang dibawah
                                    navigate('/e-order/login')
                                    :
                                    navigate('/e-order/dashboard')
                              }}
                           >
                              E-Order
                           </div>

                        </div>
                     </div>
                  </div>
               </div>
               <div>
                  <div className='float-right d-flex justify-content-end me-2 d-block d-lg-none'>
                     <Menu>
                        <MenuButton
                           as={IconButton}
                           aria-label='Options'

                           icon={
                              <HamburgerIcon

                                 className="d-md-none d-block"
                                 color=
                                 {`${small ? "white" : "red"
                                    } `}

                              />

                              // 20240125 FARIZ: Komponen yang di bawah ini bikin error
                              // <FaGear className="d-none d-md-block" />
                           }
                           variant='outline'
                           boxSize='4.4vh'
                           className="burger-mobile"
                        />
                        <MenuList>
                           <MenuItem onClick={() => navigate('/')} icon={<PlusSquareIcon />} >
                              Home
                           </MenuItem>
                           <MenuItem
                              onClick={() =>
                                 navigate('/blog')
                              } icon={<EditIcon />} >
                              News & Event
                           </MenuItem>
                           <MenuItem onClick={() =>

                              navigate('/aboutiod')
                           } icon={<InfoOutlineIcon />} >
                              About IOD
                           </MenuItem>
                           <MenuItem

                              onClick={() => {


                                 user_id === null ?
                                    navigate('/e-order/login')
                                    :
                                    navigate('/e-order/dashboard')
                              }


                              }

                              icon={<ArrowForwardIcon />} >
                              {
                                 user_id === null ?
                                    "Login"
                                    :
                                    "IOD"
                              }
                           </MenuItem>
                           <MenuGroup title="Product" className='text-start'>
                              <MenuItem onClick={() =>
                                 navigate('/product/noodle')
                              } icon={<ExternalLinkIcon />} 
                              className='ps-4'
                              >
                                 Noodle
                              </MenuItem>
                              <MenuItem onClick={() =>
                                navigate('/product/dairy')
                              } icon={<ExternalLinkIcon />} 
                              className='ps-4'
                              >
                                 Dairy
                              </MenuItem>
                              <MenuItem onClick={() =>
                                  navigate('/product/snack')
                              } icon={<ExternalLinkIcon />} 
                              className='ps-4'
                              >
                                 Snack Foods
                              </MenuItem>
                              <MenuItem onClick={() =>
                                 navigate('/product/seasoning')
                              } icon={<ExternalLinkIcon />} 
                              className='ps-4'
                              >
                                 Food Seasonings
                              </MenuItem>
                              <MenuItem onClick={() =>
                                 navigate('/product/healthyfood')
                              } icon={<ExternalLinkIcon />} 
                              className='ps-4'
                              >
                                 Nutrition & Special Foods
                              </MenuItem>
                           </MenuGroup>
                           
                        </MenuList>
                     </Menu>
                  </div>
               </div>
            </div>
         </div>

      </div>

   );

}

export default Header;




