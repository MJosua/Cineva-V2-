import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom"

import {
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  //   IconButton,
  Text,
  //   Textarea,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  //   visuallyHiddenStyle,
  useToast,
  Badge,
  Spinner,
  Textarea,
  InputLeftAddon,
} from "@chakra-ui/react";

import { FaEdit, FaPlusCircle, FaTrash } from 'react-icons/fa';
import Sidebar from "../../../components/layout/Sidebar.jsx";

import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";



import Axios from "axios";
import { API_URL } from "../../../config";

import { FiSettings } from "react-icons/fi";

import { seasonOut, logoutAction, loginAction } from "../../../action/userAction";
import { clearSeasonStorage } from "../../../action/cartAction";

import { useDispatch, useSelector } from "react-redux";
import { useData } from "../../../components/auth/CheckToken/FetchData/DataContext";

const ProfileAdmin = ({ }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);

  const { shipToParties, ports } = useData();


  const { employee_id } = useSelector((state) => {
    return {
      employee_id: state.userReducer.employee_id
    };
  });

  // Axios.post(API_URL + "/admin/req-data-change", {
  //   Name,
  //   Address,
  //   Email,
  //   ContactPerson,
  //   ContactNumber,
  //   Website,
  //   TIN
  // }, {
  //   headers: {
  //     Authorization: `Bearer ${userToken}`,
  //   },
  // })
  //   .then((res) => { })
  //   .catch((err) => {
  //  
  //     setSuccessfulOrder(false);
  //     toast({
  //       title: "Oopsie!",
  //       description: `An error has occured, please check your connection.`,
  //       status: "error",
  //       duration: 6000,
  //       isClosable: true,
  //     });
  //   });


  // ========================= CLEAR SESSION STORAGE =================================

  const [initialise, setInitialise] = React.useState(false);
  const order = [];

  if (initialise === false) {
    clearSeasonStorage(order);
    setInitialise(true);
  }

  // ==========================================================================

  // toast hook
  const toast = useToast();

  //redux
  const { company_name, uid, firstname, midname, lastname } = useSelector((state) => {
    return {
      company_name: state.userReducer.company_name,
      uid: state.userReducer.uid,
      firstname: state.userReducer.firstname,
      midname: state.userReducer.midname,
      lastname: state.userReducer.lastname,

    };
  });

  //=========

  const navigate = useNavigate();
  // const [profileData, setProfileData] = React.useState([]);
  const [profileData, setProfileData] = React.useState([]);

  const [prevPassword, setPrevPassword] = React.useState([]);
  const [newPassword1, setNewPassword1] = React.useState([]);
  const [newPassword2, setNewPassword2] = React.useState([]);


  const [visiblePrevPass, setVisiblePrevPass] = React.useState("password");
  const [visibleNewPass1, setVisibleNewPass1] = React.useState("password");
  const [visibleNewPass2, setVisibleNewPass2] = React.useState("password");

  const [address, setAddress] = React.useState(
    "Building, road, region, country"
  );

  const [email, setEmail] = React.useState("-");
  const [contact_person, setContact_person] = React.useState("-");
  const [contact_number, setContact_number] = React.useState("-");
  const [website, setWebsite] = React.useState("-");
  const [tin, setTin] = React.useState("-");
  const [remarks, setRemarks] = React.useState("-");

  const changeVisiblePrevPass = () => {
    if (visiblePrevPass === "password") {
      setVisiblePrevPass("text");
    } else if (visiblePrevPass === "text") {
      setVisiblePrevPass("password");
    }
  };

  const changeVisibleNewPass1 = () => {
    if (visibleNewPass1 === "password") {
      setVisibleNewPass1("text");
    } else if (visibleNewPass1 === "text") {
      setVisibleNewPass1("password");
    }
  };

  const changeVisibleNewPass2 = () => {
    if (visibleNewPass2 === "password") {
      setVisibleNewPass2("text");
    } else if (visibleNewPass2 === "text") {
      setVisibleNewPass2("password");
    }
  };

  const onLogOut = () => {
    return logoutAction(), navigate("/e-order");
  };
  // let userData = localStorage.getItem('tokek');
  // let user = JSON.parse(userData);
  // let company_id = user[0].company_id;
  // let profile = profileData[0]
  // let userID = user[0].user_id;

  // let userID = user_id;

  let userToken = localStorage.getItem("tokek");

  //get profile data from back end
  const onChangePassword = () => {
    const huruf = /[a-zA-Z]/;
    const angka = /[0-9]/;
    if (
      newPassword1 !== newPassword2 ||
      newPassword1.length < 8 ||
      newPassword1.includes(" ") ||
      !huruf.test(newPassword1) ||
      !angka.test(newPassword1)
    ) {
      toast({
        title: "Oopsie!",
        description: `Your New password doesnt meet the requirement!`,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } else {
      let pswd = prevPassword;
      let newPswd = newPassword2;


      Axios.post(
        API_URL + "/auth/change_pass",
        { uid, pswd, newPswd },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      )
        .then((res) => {

          if (res.data.success) {
            toast({
              title: "Yeay!",
              description: res.data.message,
              status: "success",
              duration: 6000,
              isClosable: true,
            });
            navigate("/");
            logoutAction();
            setTimeout(() => {
              seasonOut();
            }, 1500);
          } else {
            toast({
              title: "Oopsie!",
              description: res.data.message,
              status: "error",
              duration: 6000,
              isClosable: true,
            });
          }
        })
        .catch((err) => {
          seasonOut();
        });
    }
  };

  const getProfileData = () => {
    Axios.get(API_URL + "/user/profile", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        setProfileData(res.data);
        setLoading(false);
        if (!res.success && res.message == "error_auth") {
        }
      })
      .catch((err) => {
      });
  };

  const [port, setPort] = useState([])
  useEffect(() => {
    setPort(ports)
  }, [ports])






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
  const {
    isOpen: isOpenModalEdit,
    onOpen: onOpenModalEdit,
    onClose: onCloseModalEdit,
  } = useDisclosure();

  const {
    isOpen: isOpenModalDelete,
    onOpen: onOpenModalDelete,
    onClose: onCloseModalDelete,
  } = useDisclosure();




  //trigger function to get data (the trigger come from refresh page)
  React.useEffect(() => {
    getProfileData();
  }, []);

  const handleConfirmEditProf = () => {
    Axios.post(
      API_URL + "/user/request-change-data",
      {
        address,
        email,
        contact_person,
        contact_number,
        website,
        tin,
        remarks
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    )
      .then((res) => {
        if (res.data.success) {
          toast({
            title: "Yeay!",
            description: res.data.message,
            status: "success",
            duration: 6000,
            isClosable: true,
          });
          onCloseModalEditProf();
          onCloseModalSettings();
        } else {
          toast({
            title: "Oopsie!",
            description: res.data.message,
            status: "error",
            duration: 6000,
            isClosable: true,
          });
          onCloseModalEditProf();
          onCloseModalSettings();
        }
      })
      .catch((err) => {
        //   seasonOut();
      });
  };

  //display the data to page
  const printProfileData = () => {
    return profileData.map((val, idx) => {
      return (
        <div className="card-body pb-3 me-3 ms-2  d-flex border row change_quantity shadow mx-1 ">
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Country</span>
            </span>
            <span className=" text-muted text-end ">
              {" "}
              {val.country_desc === null ? <i>-</i> : val.country_desc}{" "}
            </span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Address</span>
            </span>
            <span className=" text-muted text-end ">
              {" "}
              {val.complex === null ? <i>-</i> : val.complex}{" "}
            </span>
          </div>
          <div className="d-flex justify-content-end pt-1">
            <span className=" text-muted text-end ">
              {" "}
              {val.street === null ? <i>-</i> : val.street}{" "}
            </span>
          </div>
          {/* 
          <div className="d-flex justify-content-between pt-1">
            <span className="  text-muted  ">
              <span className="fw-bold">Email</span>
            </span>
            <span className=" text-muted text-end ">
              {" "}
              {val.email === null ? <i>-</i> : val.email}{" "}
            </span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Contact Person</span>
            </span>
            <span className=" text-muted text-end ">
              <span className="fw-bold">No Data</span>
            </span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Contact Number</span>
            </span>
            <span className=" text-muted  text-end">
              <span className="fw-bold">
                {val.phone === null ? <i>-</i> : val.phone}
              </span>
            </span>
          </div> */}

          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>TIN</span>
            </span>
            <span className=" text-muted  text-end">
              <span className="fw-bold">
                {val.npwp === null ? <i>-</i> : val.npwp}
              </span>
            </span>
          </div>
          {/* <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Account Status</span>
            </span>
            <span className=" text-muted text-end ">
              <span className={`fw-bold  ${val.active === 1 ? "text-success" : "text-danger"}`} >

                {val.active === 1 ? "Active" : "Inactive"}
              </span>
            </span>
          </div> */}
        </div>
      );
    });
  };

  const printPersonalData = () => {
    return profileData.map((val, idx) => {
      return (

        <Badge variant='subtle' colorscheme={val.active === 1 ? "green" : "red"}>

          <span className={`fw-bold  
              ${val.active === 1 ? "text-success" : "text-danger"}`} >
            {val.active === 1 ? "Active" : "Inactive"}
          </span>
        </Badge>

      );
    });
  };

  //display the data to page: due date data
  const printDueDate = () => {
    return top.map((val, idx) => {
      return (
        <div className="card-body pb-3 me-1 ms-1 d-flex border row change_quantity shadow mx-1 mb-3">
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Desc</span>
            </span>
            <span className=" text-muted  text-end">
              {" "}
              {val.top_desc === null ? <i>-</i> : val.top_desc}{" "}
            </span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Credit Limit</span>
            </span>
            <span className=" text-muted text-end ">
              {" "}
              {val.credit_limit === null ? <i>-</i> : (val.credit_limit).toLocaleString()}
            </span>
          </div>
          <div className="d-flex justify-content-between pt-1">
            <span className=" fw-bold text-muted  ">
              <span>Due Day</span>
            </span>
            <span className=" text-muted  text-end">
              {" "}
              {val.due_days === null ? <i>-</i> : val.due_days}{" "}
            </span>
          </div>

        </div>
      );
    });
  };



  const printPortData = () => {
    return port.map((val, idx) => {
      return (
        <div className="row pt-1 d-flex">
          <b className="fw-bold">{val.harbour_name}</b>
        </div>
      );
    });
  };

  const printShipToData = () => {
    return shipToParties.map((val, idx) => {
      return (
        <div className="row pt-1 d-flex">
          <b className="fw-bold">{val.txt}</b>
        </div>
      );
    });
  };

  React.useEffect(() => {
    getEmailNotif();
  }, []);

  const { TOP } = useData();
  const [top, setTop] = React.useState([]);

  React.useEffect(() => {
    setTop(TOP);
    if (TOP.length > 0) {
      setLoading(false);
    }
  }, [TOP])

  const initialRefEditProf = React.useRef(null);
  const finalRefEditProf = React.useRef(null);
  const initialRefChangePswd = React.useRef(null);
  const finalRefChangePswd = React.useRef(null);

  const {
    isOpen: isOpenModalLogout,
    onOpen: onOpenModalLogout,
    onClose: onCloseModalLogout,
  } = useDisclosure();

  const {
    isOpen: isOpenModalSettings,
    onOpen: onOpenModalSettings,
    onClose: onCloseModalSettings,
  } = useDisclosure();

  const {
    isOpen: isOpenModalEditProf,
    onOpen: onOpenModalEditProf,
    onClose: onCloseModalEditProf,
  } = useDisclosure();

  const {
    isOpen: isOpenModalChangePswd,
    onOpen: onOpenModalChangePswd,
    onClose: onCloseModalChangePswd,
  } = useDisclosure();


  const [listemailnotifikasi, setlistemailnotifikasi] = useState([]);
  const [emailnotifikasi, setemailnotifikasi] = useState('');
  const [emailindex, setemailindex] = useState(0);
  const [async, setAsync] = useState(true);

  const getEmailNotif = async () => {
    Axios.get(API_URL + "/user/email", {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {

        /*
        20240125 08.04 PM FARIZ: Ini bikin kedip2. ubah pake yang dibawah
        jangan lagi pake metode di bawah karena 
        ada beragam kondisi dimana length bisa 1 tapi tetap kosong
        */

        // if (!res.data.length < 1) {
        //   console.log(res.data.length)
        //   let listEmail = (res.data[0].person_notice).split(',')
        //   setlistemailnotifikasi(listEmail)
        // }

        // masih gak jalan. 
        // if (res.data[0].person_notice) { 
        //   console.log("res.data dalam true", res.data)
        //   let listEmail = (res.data[0].person_notice).split(',')
        //   setlistemailnotifikasi(listEmail)
        // } 

        if (res.data[0]) {
          if (res.data[0].person_notice === '' || !res.data[0].person_notice) { console.log("JKT48-Fortune Cookies ") }
          else if (res.data[0].person_notice) {


            let listEmail = (res.data[0].person_notice).split(',')
            setlistemailnotifikasi(listEmail)
          }
        } else {
          console.log("kosong? seperti hatimu")
        }

        // setlistemailnotifikasi(listEmail)
        // if (!res.data[0].person_notice) {
        //   console.log("HEHE")
        // } else {

        // let listEmail = (res.data[0].person_notice).split(',')
        //  setlistemailnotifikasi(listEmail)

        //           }

      })
      .catch((err) => {
        // console.log("Ã‹rror get files at axios", err);
      });
  }

  // let emailNotifObject = listemailnotifikasi[0].person_notice;
  // let listEmail = emailNotifObject.split(',');
  // console.log("listemail", listemailnotifikasi)

  const [editedEmail, setEditedEmail] = useState('');


  const updateadata = async (params) => {

    const res = await Axios.post(
      API_URL + "/user/email",
      { emailList: params },
      {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      }
    ).then((res) => {
      onCloseModalEdit();
      onCloseModalDelete();
      getEmailNotif();
      // console.log("params", params)
    }).catch((err) => {
      toast({
        title: "Oopsie!",
        description: "An error has occurred, please check your connection.",
        status: "error",
        duration: 6000,
        isClosable: true,
      });

    })
  }

  const handledelete = async (emailindex) => {
    const updatedArray = [...listemailnotifikasi];
    // Use filter to create a new array excluding the element at the specified index
    const newArray = updatedArray.filter((_, index) => index !== emailindex);

    // Set the state with the updated array
    await setlistemailnotifikasi(newArray);

    const joinedEmails = newArray.join(',');
    // console.log("inijoined", joinedEmails);
    updateadata(joinedEmails);
  }

  const handleadd = async () => {

    if (emailnotifikasi === "" || emailnotifikasi === null || emailnotifikasi === undefined) {
      toast({
        title: "Oopsie!",
        description: `Please fill the email first!`,
        status: "error",
        duration: 6000,
        isClosable: true,
      });

    } else {

      if (emailnotifikasi.includes('@') && emailnotifikasi.includes('.')) {

        listemailnotifikasi.unshift(emailnotifikasi)

        const joinedEmails = listemailnotifikasi.join(',');
        updateadata(joinedEmails);
        setemailnotifikasi('');

      } else {

        toast({
          title: "Oopsie!",
          description: `Please enter valid email!`,
          status: "error",
          duration: 6000,
          isClosable: true,
        });

      }
    }



  }

  const handleEdit = async () => {
    // Clone the array
    const updatedList = [...listemailnotifikasi];

    // Update the specific element
    updatedList[emailindex] = editedEmail;

    // Set the state with the updated array (async)
    await setlistemailnotifikasi(updatedList);

    // Now you can log the updatedList

    // Join the updated array
    const joinedEmails = updatedList.join(',');

    // Assuming userToken is defined elsewhere in your code

    // Make the Axios request
    updateadata(joinedEmails);


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

        <div className="py-5 w-100">
          {/* CONTENT BELOW */}




          <div className=" col-md-11 mt-3 padding_start_custom ">
            <div className="pb-5 pt-4">

              <div className="row text-secondary pb-3 user-select-none " >
                <div className="col-12 d-flex  pt-1 pb-3 ps-4 ps-md-0">
                  <span
                    onClick={() => navigate("/e-order/dashboard")}
                    className="pointer grey_text_normal_20px">
                    e-order
                  </span>
                  <span className="grey_text_20px">
                    &nbsp;/ Profile
                  </span>
                </div>
              </div>
              {/* MODAL SETTINGS */}
              <>
                <Modal
                  className="pb-5"
                  onClose={onCloseModalSettings}
                  isOpen={isOpenModalSettings}
                >
                  <ModalOverlay />
                  <ModalContent >
                    <ModalHeader className="text-center">
                      Settings
                    </ModalHeader>
                    <ModalBody>
                      <div className="d-grid gap-2">
                        <div
                          className="btn   btn-setting  shadow mb-2"
                          onClick={onOpenModalEditProf}
                        >
                          Request Edit Profile Data
                        </div>
                        <div
                          className="btn   btn-setting  shadow mb-2"
                          onClick={onOpenModalChangePswd}
                        >
                          Change Password
                        </div>
                        {/* <Button
                                                className="btn left_text"
                                                type="button"
                                                onClick={() => navigate("/e-order/help")}
                                            >
                                                Help
                                            </Button> */}
                        <Button
                          className=" log_out_text text-light mb-2"
                          bg="rgba(213,57,57,1)"
                          _hover={{ color: "#fff", bg: "#9e4744" }}
                          type="button"
                          onClick={onOpenModalLogout}
                        >
                          Log Out
                        </Button>
                      </div>
                    </ModalBody>
                  </ModalContent>
                </Modal>
              </>

              {/* MODAL LOG OUT CONFIRMATION */}
              <>
                <Modal isOpen={isOpenModalLogout} onClose={onCloseModalLogout}>
                  <ModalOverlay />
                  <ModalContent>
                    <ModalBody>
                      <div className=" text-center pt-4 fw-bold text-muted fs-5">
                        <span className="text-center pt-4 fw-bold text-muted fs-5">
                          You Are About to Log Out.
                        </span>
                        <br></br>
                        <span>Are You Sure?</span>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <div className="px-3 py-2 d-flex justify-content-start ">
                        <Button
                          className="btn btn-white btn-outline-danger px-4 py-2 m-1 fw-bold"
                          onClick={onCloseModalLogout}
                        >
                          Back
                        </Button>
                        <Button
                          className="btn btn-danger px-3 py-2 m-1 fw-bold"
                          colorscheme="red"
                          onClick={onLogOut}
                        >
                          Log Out
                        </Button>
                      </div>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>

              {/* MODAL REQ EDIT PROFILE DATA */}
              <>
                <Modal
                  initialFocusRef={initialRefEditProf}
                  finalFocusRef={finalRefEditProf}
                  isOpen={isOpenModalEditProf}
                  onClose={onCloseModalEditProf}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader display="flex" justifyContent="center">
                      Request Edit Profile Data
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Name
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <div className="name_text py-2 ps-1">{uid}</div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Address
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Textarea
                            ref={initialRefEditProf}
                            placeholder={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                      <div className="row pt-2">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Email
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Input
                            ref={initialRefEditProf}
                            placeholder={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Contact Person
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Input
                            ref={initialRefEditProf}
                            placeholder={contact_person}
                            onChange={(e) => setContact_person(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Contact Number
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Input
                            ref={initialRefEditProf}
                            placeholder={contact_number}
                            onChange={(e) => setContact_number(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Website
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Input
                            ref={initialRefEditProf}
                            placeholder={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            TIN
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <Input
                            ref={initialRefEditProf}
                            placeholder={tin}
                            onChange={(e) => setTin(e.target.value)}
                            style={{ fontStyle: "italic" }}
                          />
                        </div>
                      </div>
                    </ModalBody>

                    <ModalFooter
                      display="flex"
                      justifyContent="center"
                    >
                      <Button colorscheme="red" onClick={handleConfirmEditProf}>
                        Confirm
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>

              {/* MODAL CHANGE PASSWORD */}
              <>
                <Modal
                  initialFocusRef={initialRefChangePswd}
                  finalFocusRef={finalRefChangePswd}
                  isOpen={isOpenModalChangePswd}
                  onClose={onCloseModalChangePswd}
                >
                  <ModalOverlay />
                  <ModalContent>
                    <ModalHeader className="text-center">Change Password</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            User ID
                          </FormLabel>
                        </div>
                        <div className="col-7 py-2">
                          <FormLabel
                            style={{ fontStyle: "italic" }}
                          >
                            {uid}
                          </FormLabel>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Old Password
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <InputGroup size="md">
                            <Input
                              ref={initialRefChangePswd}
                              placeholder="previous password"
                              onChange={(e) => setPrevPassword(e.target.value)}
                              type={visiblePrevPass}
                            />
                            <InputRightElement width="4.5rem">
                              <Button
                                h="1.75rem"
                                size="sm"
                                onClick={changeVisiblePrevPass}
                              >
                                {visiblePrevPass === "password" ? (
                                  <AiOutlineEyeInvisible size={26} />
                                ) : (
                                  <AiOutlineEye size={26} />
                                )}
                              </Button>
                            </InputRightElement>
                          </InputGroup>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            New Password
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <InputGroup size="md">
                            <Input
                              ref={initialRefChangePswd}
                              placeholder="min 8 character"
                              onChange={(e) => setNewPassword1(e.target.value)}
                              type={visibleNewPass1}
                            />
                            <InputRightElement width="4.5rem">
                              <Button
                                h="1.75rem"
                                size="sm"
                                onClick={changeVisibleNewPass1}
                              >
                                {visibleNewPass1 === "password" ? (
                                  <AiOutlineEyeInvisible size={26} />
                                ) : (
                                  <AiOutlineEye size={26} />
                                )}
                              </Button>
                            </InputRightElement>
                          </InputGroup>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-5 py-2">
                          <FormLabel className="edit_profile_form_label">
                            Confirm Password
                          </FormLabel>
                        </div>
                        <div className="col-7">
                          <InputGroup size="md">
                            <Input
                              ref={initialRefChangePswd}
                              placeholder="min 8 character"
                              onChange={(e) => setNewPassword2(e.target.value)}
                              type={visibleNewPass2}
                            />
                            <InputRightElement width="4.5rem">
                              <Button
                                h="1.75rem"
                                size="sm"
                                onClick={changeVisibleNewPass2}
                              >
                                {visibleNewPass2 === "password" ? (
                                  <AiOutlineEyeInvisible size={26} />
                                ) : (
                                  <AiOutlineEye size={26} />
                                )}
                              </Button>
                            </InputRightElement>
                          </InputGroup>
                        </div>
                      </div>
                    </ModalBody>
                    <Text
                      fontSize="md"
                      className="d-flex text-center justify-content-center"
                    >
                      Your password must contain number and letter
                      <br></br>

                      and more than 7 character.
                    </Text>
                    <ModalFooter display="flex" justifyContent="center">
                      <Button colorscheme="red" onClick={onChangePassword}
                        style={{ marginTop: "-10px" }}
                      >
                        Confirm
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </>

              <Image
                className="user_profile_pic position-relative"
                src={require("../../../assets/images/userProfilePic.png")}
              />

              <div className="d-flex justify-content-center ">


                <div className="col-12 col-md-5">
                  <div className="border shadow shadow-sm mt-5 acc_name  px-2 py-3 mb-2">
                    <div className="container">
                      <div className="row">
                        <div className="col-12">

                          <span>{!firstname || firstname === null ? "" : `${firstname} `}</span>
                          <span>{!midname || midname === null ? "" : `${midname} `}</span>
                          <span>{!lastname || lastname === null ? "" : firstname === lastname ? "" : `${lastname} `}</span>
                          <br></br>
                          {printPersonalData()}
                        </div>



                        <div className="d-flex justify-content-between text-start pt-1 px-4">
                          <span className="  text-muted  ">
                            <span className="fw-bold ">Company Name</span>
                          </span>
                          <span className=" text-muted text-end fw-normal">
                            {" "}
                            {company_name}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between pt-1 px-4">
                          <span className="  text-muted  ">
                            <span className="fw-bold">Email</span>
                          </span>
                          <span className=" text-muted text-end fw-normal ">
                            {" "}
                            {profileData.map((val, idx) => (
                              <div className="w-100 text-center">
                                {val.email === null ? <i>-</i> : val.email}
                              </div>
                            ))}
                            {" "}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between pt-1 px-4">
                          <span className="  text-muted  ">
                            <span className="fw-bold">Telp</span>
                          </span>
                          <span className=" text-muted text-end fw-normal ">
                            {" "}
                            {profileData.map((val, idx) => (
                              <div className="w-100 text-center">
                                {val.phone === null ? <i>-</i> : val.phone}
                              </div>
                            ))}
                            {" "}
                          </span>
                        </div>

                      </div>

                    </div>


                  </div>

                </div>

                <div className="  pt-5 pe-1">
                  <div className="d-flex justify-content-end">
                    {/* <FiSettings size={35} onClick={onOpenModalSettings} /> */}
                  </div>
                </div>

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
              ) : (
                <div className="row">
                  <div className="col-12 col-md-6">

                    <div className="col-12 mt-3 ">
                      <div className="ps-1 pb-1 distributor_info row mx-1">
                        Company Details
                      </div>

                      {printProfileData()}
                    </div>








                    <div className="col-12 col-md-12 mt-3 ">
                      <div className="ps-1 pb-1 distributor_info row mx-1">
                        Notify Email
                        <br></br>

                      </div>
                      <div className="card-body pb-3 me-1 ms-1 d-flex border row change_quantity shadow mx-1 mb-3">
                        <span className="text-secondary text-start" style={{ fontSize: "9px", fontWeight: "400" }}>
                          you can add email that will recieve order statusÂ notification
                        </span>
                        <div className="d-flex justify-content-between mb-2">

                          <InputGroup size="sm">
                            <InputLeftAddon >
                              Add Email
                            </InputLeftAddon>
                            <Input
                              value={emailnotifikasi}
                              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                              required
                              onChange={(event) => {
                                const inputValue = event.target.value;
                                const sanitizedValue = inputValue.replace(/[^a-zA-Z0-9@._-]/g, '');
                                if (sanitizedValue !== null && sanitizedValue !== undefined) {
                                  setemailnotifikasi(sanitizedValue);
                                }
                              }}
                            />
                            <InputRightElement width='4.5rem' className="me-2">
                              <Button
                                background="grey"
                                size='xs'
                                className="text-light"
                                onClick={() => handleadd()}
                              >
                                <FaPlusCircle /> &nbsp; Submit
                              </Button>
                            </InputRightElement>
                          </InputGroup>
                        </div>

                        <div className="col-12">
                          <div className="row px-2">
                            {listemailnotifikasi.map((email, idx) => (
                              <div className="row" key={idx}>
                                <div className="col-8 text-start">
                                  {email}
                                </div>
                                <div className="col-4">
                                  <Button
                                    size="xs"
                                    className="mx-2"
                                    colorscheme='orange'
                                    onClick={() => {
                                      onOpenModalEdit();
                                      setEditedEmail(listemailnotifikasi[idx]);
                                      setemailindex(idx);
                                    }}

                                  ><FaEdit /></Button>
                                  <Button size="xs" colorscheme='red'

                                    onClick={() => {
                                      onOpenModalDelete();
                                      setEditedEmail(listemailnotifikasi[idx]);
                                      setemailindex(idx);
                                    }}

                                  ><FaTrash /></Button>
                                </div>
                              </div>
                            ))}


                          </div>

                        </div>

                      </div>


                    </div>

                  </div>

                  <div className="col-12 col-md-6">
                    <div className="col-12  col-md-12  mt-3 ">
                      <div className="pb-1 distributor_info row mx-1">
                        Term Of Payment
                      </div>

                      {printDueDate()}

                      <div className="pt-3  pb-1 distributor_info d-flex mx-1">
                        Port List
                      </div>

                      <div className="card-body mx-1 d-flex border row change_quantity shadow">
                        <div className="right_text">{printPortData()}</div>
                      </div>

                      <div className="pt-3  pb-1 distributor_info d-flex mx-1">
                        Ship To Party List
                      </div>

                      <div className="card-body mx-1 d-flex border row change_quantity shadow">
                        <div className="right_text">{printShipToData()}</div>
                      </div>
                    </div>
                  </div>





                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Modal
        className="pb-5"
        onClose={onCloseModalEdit}
        isOpen={isOpenModalEdit}
      >
        <ModalOverlay />
        <ModalContent >
          <ModalHeader className="text-center">
            Edit
          </ModalHeader>
          <ModalBody>
            <div className="d-grid gap-2">
              <Input
                value={editedEmail}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  const sanitizedValue = inputValue.replace(/[^a-zA-Z0-9@._-]/g, '');
                  setEditedEmail(sanitizedValue)
                }
                }
              />


              <Button
                className=" bg-warning  log_out_text text-dark mb-2"

                _hover={{ color: "#fff", bg: "#9e4744" }}
                type="button"
                onClick={() => handleEdit()}
              >
                EDIT
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        className="pb-5"
        onClose={onCloseModalDelete}
        isOpen={isOpenModalDelete}
      >
        <ModalOverlay />
        <ModalContent >
          <ModalHeader className="text-center">
            Delete
          </ModalHeader>
          <ModalBody>
            <div className="d-grid gap-2">
              Are you sure to delete email "{editedEmail}" ?

              <Button
                className=" bg-danger  log_out_text text-dark mb-2"

                _hover={{ color: "#fff", bg: "#9e4744" }}
                type="button"
                onClick={() => handledelete(emailindex)}
              >
                Delete
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

    </div >
  );
};

export default ProfileAdmin







