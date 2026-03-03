import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerOverlay, IconButton, Image } from "@chakra-ui/react";
import { GiHamburgerMenu } from "react-icons/gi";

function HeaderEventUSA({ btnRef2, onOpenSideMenu, onCloseSideMenu, isOpenSideMenu, scrollToSection }) {
    return (
        <>
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



                        <div className="col-12  d-flex justify-content-end align-items-center mt-3 mt-md-0">
                            <Button className="button-event-usa"
                                colorScheme="white"
                                onClick={() => {
                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('1'), 300);
                                }}
                            >
                                Announcement
                            </Button>
                        </div>

                        <div className="col-12  d-flex justify-content-end align-items-center mt-3 mt-md-0"

                        >
                            <Button className="button-event-usa"
                                onClick={() => {
                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('2'), 300);
                                }}
                            >
                                Prize
                            </Button>
                        </div>

                        <div className="col-12  d-flex justify-content-end align-items-center mt-3 mt-md-0"

                        >
                            <Button className="button-event-usa"
                                onClick={() => {
                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('3'), 300);
                                }}
                            >
                                Methods
                            </Button>
                        </div>

                        <div className="col-12  d-flex justify-content-end align-items-center mt-3 mt-md-0"
                        >
                            <Button className="button-event-usa"
                                onClick={() => {
                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('4'), 300);
                                }}
                            >
                                Submit Here
                            </Button>
                        </div>

                        <div className="col-12  d-flex justify-content-end align-items-center mt-3 mt-md-0"

                        >
                            <Button className="button-event-usa "
                                onClick={() => {
                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('5'), 300);
                                }}
                            >
                                T&C
                            </Button>
                        </div>





                    </DrawerBody>


                </DrawerContent>
            </Drawer>

            <div className="position-absolute  container-fluid h-100 w-100 ">
                <div className="row px-0">
                    <div className="col-12 d-flex justify-content-between px-0 ">
                        <div className="container-fluid px-0">
                            <div className="row">
                                <div className="col-4 position-relative px-0 py-0 zindex2">
                                    <Image
                                        src="/image/event/usa/page1/IndomieLogo.png"
                                        alt="indomielogo"
                                        width="146px"
                                        className=" pointer mt-4 ms-4 custom-shadow "
                                        height="auto"
                                        onClick={() => { window.open("https://indomie.us/", "_blank"); }}

                                    // style={{marginTop:"-10px", marginLeft:"-20px"}}
                                    />
                                </div>
                                <div className="col-8 d-flex justify-content-end d-md-none align-items-center zindex2">
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
                                <div className="col-8 d-none d-md-flex justify-content-end align-items-center zindex2" style={{ marginTop: "-20px", zIndex: "9990" }}>
                                    <Button className="mx-2 fw-bold text-white zindex2"
                                        colorScheme="blackAlpha"
                                        variant="link"
                                        onClick={() => {
                                            setTimeout(() => scrollToSection('1'), 0);
                                        }}
                                    >
                                        {/* Replace with your icon */}
                                        Announcement
                                    </Button>

                                    <Button className="mx-2 fw-bold text-white zindex2"
                                        colorScheme="blackAlpha"
                                        variant="link"
                                        onClick={() => {
                                            setTimeout(() => scrollToSection('2'), 0);
                                        }}
                                    >
                                        {/* Replace with your icon */}
                                        Prize
                                    </Button>

                                    <Button className="mx-2 fw-bold text-white zindex2"
                                        colorScheme="blackAlpha"
                                        variant="link"
                                        onClick={() => {
                                            setTimeout(() => scrollToSection('3'), 0);
                                        }}
                                    >

                                        Methods
                                    </Button>

                                    <Button className="mx-2 fw-bold text-white zindex2"
                                        colorScheme="blackAlpha"
                                        variant="link"
                                        onClick={() => {
                                            setTimeout(() => scrollToSection('4'), 0);
                                        }}
                                    >

                                        Submit Here
                                    </Button>

                                    <Button className="mx-2 fw-bold text-white zindex2"
                                        colorScheme="blackAlpha"
                                        variant="link"
                                        onClick={() => {
                                            setTimeout(() => scrollToSection('5'), 0);
                                        }}
                                    >

                                        T&C
                                    </Button>


                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}

export default HeaderEventUSA




