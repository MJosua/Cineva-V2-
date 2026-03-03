import React from "react";
import {
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Tooltip,
  ModalCloseButton,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

import { useSelector } from "react-redux";
import { clearSeasonStorage } from "../../action/cartAction";

import { AiOutlineAudit } from "react-icons/ai";
import { useData } from "../../features/auth/components/CheckToken/FetchData/DataContext";




const Sidebar = () => {

  const type_id = useSelector((state) => state.userReducer.type_id);
  const user_type = useSelector((state) => state.userReducer.user_type);
  const uid = useSelector((state) => state.userReducer.uid);
  const transport = useSelector((state) => state.userReducer.transport);


  const checkEdit = JSON.parse(sessionStorage.getItem("editDraft"));
  const order = [];
  const {
    isOpen: isOpenModalCheckEdit,
    onOpen: onOpenModalCheckEdit,
    onClose: onCloseModalCheckEdit,
  } = useDisclosure();

  const handleCloseModalCheckEdit = () => {
    sessionStorage.clear();
    onCloseModalCheckEdit()
  }

  let username = uid
  const navigate = useNavigate();
  const location = useLocation();

  const { globalLoading } = useData();

  return (


    <div
      className="container sticky
         d-none d-sm-none d-md-block vh-100 border bg-white row pe-0 d-lg-block d-xl-block d-xxl-block  
        ps-0 d-flex justify-content-start "
    >

      <Modal
        // initialFocusRef={initialRefConfirm}
        isOpen={isOpenModalCheckEdit}
        onClose={onCloseModalCheckEdit}
        motionPreset="slideInBottom"
        size="xl"
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>Confirmation</ModalHeader>
            <ModalCloseButton onClick={onCloseModalCheckEdit} />
            <ModalBody>
              {checkEdit ? (
                <>
                  <span className="py-2">
                    â€œAre you sure you want to go to the order page?
                    <br />
                    Your unsaved draft will not be saved.
                  </span>
                </>
              ) : <span className="py-2">
                â€œThis is the first time of you to make an order, would you like to see tutorial first ?
              </span>}
            </ModalBody>
            <ModalFooter className="px-3">
              <button
                className="btn btn-outline-danger px-2 mx-1"
                onClick={onCloseModalCheckEdit}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger px-2 mx-1"
                onClick={() => {
                  console.log("Transport_code", transport)
                  navigate(
                    transport === 1 || transport === 3 ?
                      "/e-order/order?mode=Container"
                      :
                      transport === 2 ?
                        "/e-order/order?mode=Trucking"
                        :
                        "/e-order/dashboard"
                  );
                  handleCloseModalCheckEdit()
                }}
              >
                Confirm
              </button>

            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
      {/* USER DISTRIBUTOR MENU */}
      <div className="     vh-100 w-100 " style={{ overflow: "auto" }}>
        <div className=" row d-flex justify-content-start bg-white pt-2">



          <div
            className={
              "d-block d-flex border-bottom text-muted hover-pink fw-bold fs-6 py-3 btn rounded-0  " +
              (type_id === 3 && location.pathname.includes('/e-order/dashboard')
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "")
            }
            onClick={() =>
              navigate("/e-order/dashboard")}
          >
            <div className="col-2 px-2 ">
              <Image
                // key={state.product.code}
                className="d-flex icon_width_35 pointer"
                src="/image/dashboard.png"
                alt="Dashboard"
                fallbacksrc="/image/indomie-mi-goreng-special_detail.png"
              ></Image>
            </div>

            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 pointer">

                Dashboard</div>
            </div>
          </div>

          <div
            className={
              "d-block position-relatives d-flex border-bottom text-muted hover-pink fw-bold fs-6 py-3 btn rounded-0  " +
              (type_id === 3 && location.pathname.includes('/e-order/order')
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }

            onClick={() => {

              if (!globalLoading) {
                if (transport && checkEdit && checkEdit.editStatus === false) {
                  navigate(
                    transport === 1 || transport === 3 ?
                      "/e-order/order?mode=Container"
                      :
                      transport === 2 ?
                        "/e-order/order?mode=Trucking"
                        :
                        onOpenModalCheckEdit()
                  );
                } else {
                  onOpenModalCheckEdit();
                }
              }
            }}

          >
            <div className="col-2 px-2">
              <Image
                // key={state.product.code}
                className="d-flex icon_width_35 pointer"
                src="/image/order.png"
                alt="Place Order"
                fallbacksrc="/image/indomie-mi-goreng-special_detail.png"
              ></Image>
            </div>

            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 pointer">

                Place Order

              </div>

            </div>

            {globalLoading &&
              <div className="position-absolute w-100  ">
                <Tooltip label="Your Company Data Being Prepared">
                  <div className="col-12 d-flex justify-content-end  pt-2 pe-4">
                    <Spinner
                      className="d-flex justify-content-center "
                      thickness="5px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="sm"
                      spacing={4}
                    />
                  </div>
                </Tooltip>
              </div>
            }

          </div>








          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname.includes('/e-order/transaction')
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }

            onClick={() =>

              transport === 1 || !transport || transport === 3 ?
                navigate("/e-order/transaction")
                :
                transport === 1
                  ?
                  navigate("/e-order/truckorder")
                  :
                  navigate("/e-order/transaction")
            }
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-1 pb-0 icon_width_35 pointer"
                src="/image/transaction.PNG"
                boxSize={8}
                alt="Transaction List"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">
                Transaction List
              </div>
            </div>
          </div>
          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname.includes('/e-order/cart')
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/cart")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35 pointer"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">
                Draft Order

              </div>
            </div>
          </div>

          <div
            className={
              "d-block position-relatives d-flex border-bottom hover-pink text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname === '/e-order/catalog'
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }
            onClick={() => {
              if (!globalLoading) {
                navigate("/e-order/catalog")
              }
            }}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-1 pb-0 icon_width_35"
                src="/image/catalog.png"
                boxSize={8}
                alt="Product Catalog"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">
                Product Catalog
              </div>

            </div>
            {globalLoading &&
              <div className="position-absolute w-100  ">
                <Tooltip label="Your Company Data Being Prepared">
                  <div className="col-12 d-flex justify-content-end  pt-2 pe-4">
                    <Spinner
                      className="d-flex justify-content-center "
                      thickness="5px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="sm"
                      spacing={4}
                    />
                  </div>
                </Tooltip>
              </div>
            }
          </div>

          {/* <div
            className={
              "d-block d-flex border-bottom hover-pink text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname === '/test/Draft'
                ? "bg-danger-02 "
                : username === "test.yosua"
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/test/Draft")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">TEST DRAFT</div>
            </div>
          </div> */}

          <div
            className={
              "d-block d-flex position-relatives  hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname === '/e-order/profile'
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }
            onClick={() => {
              if (!globalLoading) {
                navigate("/e-order/profile")
              }
            }}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35"
                src="/image/account.png"
                boxSize={8}
                alt="Account"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">
                Account
              </div>

            </div>

            {globalLoading &&
              <div className="position-absolute w-100  ">
                <Tooltip label="Your Company Data Being Prepared">
                  <div className="col-12 d-flex justify-content-end  pt-2 pe-4">
                    <Spinner
                      className="d-flex justify-content-center "
                      thickness="5px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="sm"
                      spacing={4}
                    />
                  </div>
                </Tooltip>
              </div>
            }
          </div>
          <div


            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 3 && location.pathname.includes('/e-order/help')
                ? "bg-danger-02 "
                : type_id === 3
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/help")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/Help.png"
                boxSize={8}
                alt="Help"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Help</div>
            </div>
          </div>

          {/* ADMIN MENU PANEL */}

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/admin'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/admin")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/account.png"
                boxSize={8}
                alt="Acc Management"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Acc Management</div>
            </div>
          </div>




          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/containertracking'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/containertracking")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">SEARATES TRACKING</div>
            </div>
          </div>

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/Reporting'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/Reporting")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Report</div>
            </div>
          </div>

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/order-report'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/order-report")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Order Report</div>
            </div>
          </div>

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/audit'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/audit")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              />
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Event Audit Page</div>
            </div>
          </div>




          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/BannerSettings'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/BannerSettings")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/FAQ/order_placement.png"
                boxSize={8}
                alt="Acc Management"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Banner Settings</div>
            </div>
          </div>



          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/itemconfig'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/itemconfig")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-0 pb-0 icon_width_35"
                src="/image/draft.PNG"
                boxSize={8}
                alt="Draft Order"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Special Condition</div>
            </div>
          </div>



          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              (type_id === 9 && location.pathname === '/e-order/feedbackadmin'
                ? "bg-danger-02 "
                : type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/e-order/feedbackadmin")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center px-1 pb-0 icon_width_35"
                src="/image/transaction.PNG"
                boxSize={8}
                alt="Transaction List"
                width="35px"
                height="35px"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Feedback</div>
            </div>
          </div>

          {/* BLOG ADMIN */}
          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              ((type_id === 8 || type_id === 9) && location.pathname === '/blog/news'
                ? "bg-danger-02 "
                : type_id === 8 || type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/blog/news")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/news_icon.png"
                boxSize={8}
                alt="News"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">News</div>
            </div>
          </div>

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              ((type_id === 8 || type_id === 9) && location.pathname === '/blog/event'
                ? "bg-danger-02 "
                : type_id === 8 || type_id === 9
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/blog/event")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/event_icon.png"
                boxSize={8}
                alt="Event"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Event</div>
            </div>
          </div>

          <div
            className={
              "d-block d-flex hover-pink border-bottom text-muted fw-bold fs-6 py-3 btn rounded-0 " +
              ((type_id === 8) && location.pathname === '/blog/event'
                ? "bg-danger-02 "
                : type_id === 8
                  ? ""
                  : "d-none")
            }
            onClick={() => navigate("/blog/draft")}
          >
            <div className="col-2 px-2">
              <Image
                className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                src="/image/draft_icon.png"
                boxSize={8}
                alt="Draft"
                fallbacksrc="/image/emptyplate.PNG"
              ></Image>
            </div>
            <div className="d-flex ms-2">
              <div className="grey_text_bold fs-6 px-2 ratakiri pointer">Draft</div>
            </div>
          </div>
          {/* Blog admin End */}
          {/* <div className="d-flex justify-content-start align-items-center 
                                border text-muted fw-bold fs-6 py-3 btn rounded-0 "
                    onClick={() => navigate('/blog/')}
                >
                    <div className="col-2 px-2">
                        <Image
                            className="d-flex justify-content-center  pb-0 icon_width_35 pointer "
                            src={require('../../assets/images/help.PNG')}
                            boxSize={8}
                            alt="content"

                            fallbacksrc={require('../../assets/images/emptyplate.PNG')}>
                        </Image>
                    </div>
                    <div className="d-flex ms-2">
                        <div className="grey_text_bold fs-6 px-2 ratakiri pointer">
                           Admin Blog
                        </div>
                    </div>
                    
                </div> */}
        </div>
      </div>
    </div >
  );
};

export default Sidebar;




