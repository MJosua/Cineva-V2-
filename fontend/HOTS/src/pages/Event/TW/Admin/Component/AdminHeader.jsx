import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, IconButton, Image, Input, useDisclosure } from "@chakra-ui/react"
import { useRef } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { useNavigate } from "react-router-dom";

AdminHeaderTW.defaultProps = {
    MenuList: [
        {
            Name: "List Data",
            url: "/event/tw/admin",
            icon: "Bunny_HiRes4K.png"
        },
        {
            Name: "List Win",
            url: "/event/tw/admin/win",
            icon: "Bunny_HiRes4K.png"
        },
        {
            Name: "Winner Generator",
            url: "/event/tw/admin/generator",
            icon: "Star_100p.png"

        },
    ],
};

function AdminHeaderTW({ MenuList }) {

    const {
        isOpen: isOpenSideMenu,
        onOpen: onOpenSideMenu,
        onClose: onCloseSideMenu,
    } = useDisclosure();

    const btnRef2 = useRef()

    const navigate = useNavigate();



    return (
        <div className="row px-0">
            <div className="col-12 d-flex justify-content-between px-0">
                <div className="container-fluid px-0">

                    <Drawer
                        isOpen={isOpenSideMenu}
                        placement="top"
                        onClose={onCloseSideMenu}
                        unstyled={true}
                        size="xl"
                        finalFocusRef={btnRef2}  // Focus on button when drawer closes
                    >
                        <DrawerOverlay />

                        <DrawerContent bg="transparent" height="100vh" >
                            <DrawerCloseButton className="mt-2" />
                            <DrawerHeader>-</DrawerHeader>

                            <DrawerBody className="sidebar-tw" bg="transparent">




                                {MenuList.map((item, index) => (
                                    <div key={index} className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}>
                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => { navigate("/test") }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Bunny_HiRes4K.png"
                                                    alt="icon-button1"
                                                    height="auto"
                                                    width="40px"
                                                />
                                            </div>
                                            <span className="fs-1">
                                                {item.Name}
                                            </span>
                                        </div>
                                    </div>
                                )
                                )
                                }



                            </DrawerBody>


                        </DrawerContent>
                    </Drawer>

                    <div className="row">
                        <div className="col-4 position-relative px-0 py-0 ">
                            <Image
                                src="/image/event/aset/IndomieLogo-tw.png"
                                alt="indomielogo"
                                width="286px"
                                height="auto"
                            // style={{marginTop:"-10px", marginLeft:"-20px"}}
                            />
                        </div>
                        <div className="col-8 d-flex justify-content-end d-md-none">
                            <IconButton
                                variant="ghost"
                                ref={btnRef2}
                                onClick={onOpenSideMenu}
                                className="btn-sidebar-right"
                                icon={
                                    <GiHamburgerMenu
                                        color="white"
                                        size="30px"
                                    />
                                }
                            />
                        </div>
                        <div className="col-8 d-flex justify-content-end align-items-center d-none d-md-flex" style={{ marginTop: "-20px" }}>

                            {MenuList.map((item, index) => (
                                <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                    onClick={() => { navigate(`${item.url}`) }}
                                key={index}
                                >
                                    <div className="me-2">
                                        <Image
                                            src={`/image/event/aset/${item.icon}`}
                                            alt="icon-button1"
                                            height="auto"
                                            width="15px"
                                        />
                                    </div>{/* Replace with your icon */}
                                    {item.Name}
                                </div>
                            )
                            )
                            }

                        </div>


                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminHeaderTW