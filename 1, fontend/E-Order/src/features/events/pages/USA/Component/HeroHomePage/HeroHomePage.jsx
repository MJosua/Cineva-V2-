import { Image } from "@chakra-ui/react"
import HeaderEventUSA from "../Header"

function HeroHomePage(
    btnRef2,
    onOpenSideMenu,
    onCloseSideMenu,
    isOpenSideMenu,
    scrollToSection,
) {
    return (
        <>
            <div className="col-12 vh-100  px-0 position-relative page-section">

                <div className="col-12 position-absolute" style={{ height: "180vh", overflow: "hidden" }}>
                    <Image
                        src="/image/event/usa/page1/RedBackground.png"
                        alt="Title of Banner 1"
                        height="100%"
                        width="100%"
                        className="user-drag-none user-select-none zindex2"
                    />
                </div>

                <HeaderEventUSA

                    btnRef2={btnRef2}
                    onOpenSideMenu={onOpenSideMenu}
                    onCloseSideMenu={onCloseSideMenu}
                    isOpenSideMenu={isOpenSideMenu}
                    scrollToSection={scrollToSection}

                />


                <div className="position-absolute px-0 w-100">
                    <div className="vh-100  w-100">
                        <div className="position-relatives d-flex justify-content-center">
                            <div className="col-12 position-absolute d-flex justify-content-center align-items-center h-100">
                                <Image
                                    src="/image/event/usa/page1/IndomieTitle.png"
                                    alt="Title of Banner 1"
                                    height="auto"
                                    width="40vw"
                                    className="user-drag-none user-select-none zindex2"
                                />
                            </div>
                            <div className="col-12 position-absolute d-flex justify-content-center align-items-center h-100" >
                                <Image
                                    src="/image/event/usa/page1/SweepstakesTitle.png"
                                    alt="Title of Banner 1"
                                    height="auto"
                                    width="70vw"
                                    style={{ marginTop: "200px" }}
                                    className="user-drag-none user-select-none zindex2"
                                />

                            </div>
                        </div>
                    </div>

                </div>






            </div>
        </>
    )
}

export default HeroHomePage




