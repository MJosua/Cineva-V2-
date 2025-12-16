import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, IconButton, Image, Input } from "@chakra-ui/react"
import { GiHamburgerMenu } from "react-icons/gi";
import SyaratdanKetentuan from "./SyaratdanKetentuan/SyaratdanKetentuan";
import ListWinnerPublic from "./ListWinnerPublic";

function MobileTaiwanEvent2024({
    scrollToSection,
    btnRef2,
    onCloseSideMenu,
    onOpenSideMenu,
    isOpenSideMenu,

    handleInput,
    name,
    phone,
    channel,
    date,
    packetCount,
    file,
    invoice,
    setName,
    setPhone,
    setChannel,
    setDate,
    setPacketCount,
    setFile,
    setInvoice,
    error,
    handleFileChange,
    fileInputRef,
    idnumber,
    setIdnumber

}) {



    return (
        <div className="row px-0 d-md-none d-block background-gradient-event-tw">
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


                        <div className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}>
                            <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                onClick={() => {

                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('8'), 200);

                                }}
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
                                    活動辦法
                                </span>
                            </div>
                        </div>
                        <div className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}>

                            <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                onClick={() => {

                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('9'), 200);

                                }}
                            >
                                <div className="me-2">
                                    <Image
                                        src="/image/event/aset/Star_100p.png"
                                        alt="icon-button2"
                                        height="auto"
                                        width="40px"
                                    />
                                </div>
                                <span className="fs-1">
                                    活動獎品
                                </span>{/* Replace with your icon */}
                            </div>
                        </div>

                        <div className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}>
                            <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                onClick={() => {

                                    onCloseSideMenu();
                                    setTimeout(() => scrollToSection('10'), 200);

                                }}
                            >
                                <div className="me-2">
                                    <Image
                                        src="/image/event/aset/Camera_100p.png"
                                        alt="icon-button3"
                                        height="auto"
                                        width="40px"
                                    />
                                </div>
                                <span className="fs-1">{/* Replace with your icon */}
                                    登錄發票
                                </span>
                            </div>
                        </div>

                        <div className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}
                            onClick={() => {

                                onCloseSideMenu();
                                setTimeout(() => scrollToSection('98'), 200);

                            }}
                        >
                            <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2">
                                <div className="me-2">
                                    <Image
                                        src="/image/event/aset/Ramyun_100p.png"
                                        alt="icon-button4"
                                        height="auto"
                                        width="40px"

                                    />
                                </div>
                                <span className="fs-1">{/* Replace with your icon */}
                                    注意事項
                                </span>
                            </div>
                        </div>
                        <div className="col-12 bg d-flex justify-content-end align-items-center mt-3 mt-md-0" style={{ marginTop: "-20px" }}
                        
                        onClick={() => {

                            onCloseSideMenu();
                            setTimeout(() => scrollToSection('101'), 200);

                        }}
                        >


                            <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2">
                                <div className="me-2">
                                    <Image
                                        src="/image/event/aset/Mic_100p.png"
                                        alt="icon-button5"
                                        height="auto"
                                        width="40px"
                                    />
                                </div>{/* Replace with your icon */}
                                <span className="fs-1">{/* Replace with your icon */}
                                    中獎名單
                                </span>
                            </div>


                        </div>



                    </DrawerBody>


                </DrawerContent>
            </Drawer>
            <div id="7" className="col-12 vh-100 px-0 position-relative page-section">

                <Image
                    src="/image/event/bg-mobile-1.png"
                    alt="Picture of Banner"
                    height="100vh"
                    width="100vw"
                />

                <div className="position-absolute container-fluid h-100 w-100 px-0 zindex2" >
                    <Image
                        src="/image/event/aset/IndomieLogo-tw.png"
                        alt="indomielogo"
                        width="220px"
                        height="auto"
                        className=" pointer"
                        onClick={() => { window.open("https://www.indomie.com.tw", "_blank"); }}

                    // style={{marginTop:"-10px", marginLeft:"-20px"}}
                    />
                </div>

                <div className="position-absolute d-flex justify-content-end container-fluid h-100 w-100 px-0">
                    <div className="container-fluid">
                        <div className="row">

                            <div className="col-12 d-flex justify-content-end">
                                <IconButton
                                    variant="ghost"
                                    ref={btnRef2}
                                    onClick={onOpenSideMenu}
                                    className="btn-sidebar-right"
                                    icon={
                                        <GiHamburgerMenu
                                            color="white"
                                            size="30px"
                                            className="mt-4"
                                        />
                                    }
                                />

                            </div>
                        </div>
                    </div>
                </div>

                <div className="position-absolute top-0  w-100 d-flex justify-content-center align-items-center">
                    <Image
                        src="/image/event/aset/OhMyGood.png"
                        alt="ohMyGood"
                        className="ohmygood-event-tw  animated-ohmygood"
                    />
                </div>

                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-start ">



                    <div className="right-asset-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon Telur"
                            width="30px"
                            className="egg-asset-tw animated-star"

                        />
                    </div>

                    <div className="right-asset-position-tw">
                        <Image
                            src="/image/event/aset/Egg_HiRes4K.png"
                            alt="Icon Telur"
                            className="egg-asset-tw animated-egg"

                        />
                    </div>

                </div>

                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-end ">

                    <div className="left1-asset-position-tw ">
                        <Image
                            src="/image/event/aset/Bumi.png"
                            alt="Icon bumi"
                            className="egg-asset-tw animated-egg"

                        />
                    </div>

                    <div className="left1-asset-position-tw ">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon star"
                            width="20px"
                            className="egg-asset-tw animated-star mt-4"

                        />
                    </div>



                    <div className="left1-asset-position-tw" style={{ width: "30px" }}>

                    </div>

                </div>


                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-start ">

                    <div className="right-asset2-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon star"
                            width="20px"
                            className=" animated-star mt-4"

                        />
                    </div>

                    <div className="right-asset2-position-tw">
                        <Image
                            src="/image/event/aset/Noodles_HiRes4K.png"
                            alt="Icon star"
                            width="40px"
                            className=" animated-egg mt-5"

                        />
                    </div>


                </div>

                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-end ">


                    <div className="left2-asset-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon star"
                            className="egg-asset-tw animated-star mt-5"
                            width="12px"

                        />
                    </div>

                    <div className="left2-asset-position-tw">
                        <Image
                            src="/image/event/aset/Rabbithugindomie.png"
                            alt="Icon star"
                            className="egg-asset-tw animated-star "

                        />
                    </div>



                </div>

                <div className="position-absolute vh-100 w-100 d-flex justify-content-center align-items-center">
                    <div className="col-12 d-flex justify-content-center align-items-center" >

                        <Image
                            src="/image/event/aset/information.png"
                            alt="Icon star"
                            width="auto"
                            height="29vw"
                            className="mb-3"
                        />

                    </div>
                </div>

                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center">
                    <div className="container-fluid">
                        <div className="row">

                            <div className="col-12 d-flex justify-content-center align-items-center" >
                                <Image
                                    src="/image/event/aset/informationg2.png"
                                    alt="Icon star"
                                    width="auto"
                                    height="16vw"
                                    className="mb-3"
                                />
                            </div>



                            <div className="col-12 d-flex justify-content-center align-items-center" >
                                <Image
                                    src="/image/event/aset/information3.png"
                                    alt="Icon star"
                                    width="auto"
                                    height="16vw"
                                    className="information-event-tw "
                                />
                            </div>

                        </div>
                    </div>

                </div>

                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center">
                    <div className="row">

                        <div className="col-12 d-flex justify-content-center position-relative">
                            <Image
                                src="/image/event/aset/login-button.png"
                                alt="Button"
                                className="button-event-tw  glowing-filter zindex2"
                                onClick={() => {
                                    setTimeout(() => scrollToSection('10'), 0);
                                }}

                            />

                        </div>


                    </div>


                </div>

                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center mb-4">
                    <div className="col-12 d-flex text-white justify-content-center mb-2">
                        2025/2/7 中午公布得獎名單
                    </div>
                </div>

                {/* Infinite Scrolling Text */}
                <div className="position-absolute bottom-0 w-100 fw-bold marquee-wrapper" style={{ background: "#FCE00B" }}>
                    <div className="marquee-content text-uppercase">
                        <span>Indomie, my favourite! Indomie, my favourite! Indomie, my favourite!</span>
                        <span>Indomie, my favourite! Indomie, my favourite! Indomie, my favourite!</span>
                    </div>
                </div>

            </div>

            {/* 2nd page */}

            <div id="8" className=" pattern-background col-12 vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">



                <div className="position-absolute">

                    <div className="card shadow position-relative row card-desktop-2" >

                        <div className="col-12  user-drag-none user-select-none  d-flex justify-content-center align-items-top" style={{ marginTop: "-30px" }}>
                            <Image
                                src="/image/event/aset/Title-2.png"
                                alt="Title of Banner 2"
                                height="auto"
                                width="180px"
                                className="user-drag-none user-select-none zindex2"
                            />
                        </div>

                        <div className="col-12 bg-card-taiwan-2 pt-4 w-100 h-100  position-absolute d-flex justify-content-center align-items-center">
                            <div className="container-fluid">
                                <div className="row">

                                    <div className="col-6 mb-4">

                                        <div className="col-12 d-flex justify-content-center mt-2 mb-1">
                                            <Image
                                                src="/image/event/aset/icon1.png"
                                                alt="Title of Banner 1"
                                                height="110px"
                                                width="auto"
                                                className="icon-part1-event-tw  user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/step1.png"
                                                alt="Title of Banner 1"
                                                height="auto"
                                                width="200px"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                    </div>


                                    <div className="col-6 ">

                                        <div className="col-12 d-flex justify-content-center mt-2 mb-1">
                                            <Image
                                                src="/image/event/aset/icon2.png"
                                                alt="Title of Banner 2"
                                                height="110px"
                                                width="auto"
                                                className=" icon-part2-event-tw user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/step2.png"
                                                alt="Title of Banner 2"
                                                height="auto"
                                                width="200px"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                    </div>


                                    <div className="col-6 ">

                                        <div className="col-12 d-flex justify-content-center mt-2 mb-1">
                                            <Image
                                                src="/image/event/aset/icon3.png"
                                                alt="Title of Banner 3"
                                                height="110px"
                                                width="auto"
                                                className=" icon-part3-event-tw user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/step3.png"
                                                alt="Title of Banner 3"
                                                height="auto"
                                                width="200px"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                    </div>


                                    <div className="col-6 ">

                                        <div className="col-12 d-flex justify-content-center mb-1">
                                            <Image
                                                src="/image/event/aset/icon4.png"
                                                alt="icon of Banner 4"
                                                height="120px"
                                                width="auto"
                                                className="icon-part4-event-tw  user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/step4.png"
                                                alt="cardbox of Banner 4"
                                                height="auto"
                                                width="200px"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </div>


            <div id="9" className="pattern-background col-12 vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


                <div className="position-absolute">
                    <div className="col-12  user-drag-none user-select-none  d-flex justify-content-center align-items-top" style={{ marginBottom: "-20px" }}>
                        <Image
                            src="/image/event/aset/Title-3.png"
                            alt="Title of Banner 2"
                            height="auto"
                            width="190px"
                            className="user-drag-none user-select-none zindex2"
                        />

                    </div>
                    <div className="card shadow position-relative row card-desktop-3" >



                        <div className="col-12 d-flex justify-content-center">

                            <div className="row">
                                <div className="col-12 d-flex justify-content-center">

                                    <Image
                                        src="/image/event/aset/tiket.png"
                                        alt="Image"
                                        height="auto"
                                        width="120px"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center">
                                    頭獎: 雙人首爾來回機票 (1名)
                                    <br></br>
                                    市價 16,000元

                                </div>

                            </div>



                        </div>
                        <div className="col-12  d-flex justify-content-between " style={{ marginTop: "10px" }}>
                            <div className="row">
                                <div className="col-6">


                                    <div className="row" >
                                        <div className="col-12 d-flex justify-content-center ">

                                            <Image
                                                src="/image/event/aset/tas.png"
                                                alt="Image"
                                                height="80px"
                                                width="auto"
                                                className=" user-drag-none user-select-none zindex2"
                                            />

                                        </div>
                                        <div className="col-12 d-flex justify-content-center">
                                            二獎: 丹寧包+燙布貼 (25名)
                                            <br></br>
                                            市價 899元

                                        </div>

                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className="row" >
                                        <div className="col-12  d-flex justify-content-center">


                                            <Image
                                                src="/image/event/aset/baju.png"
                                                alt="Image"
                                                height="auto"
                                                width="80px"
                                                className="  user-drag-none user-select-none zindex2"
                                            />

                                        </div>
                                        <div className="col-12 d-flex justify-content-center ">
                                            三獎: 兔兔口袋短T (35名)
                                            <br></br>
                                            市價 599元

                                        </div>

                                    </div>

                                </div>
                            </div>

                        </div>



                        <div className="col-12 d-flex justify-content-center" >

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center" style={{ marginTop: "-30px" }}>


                                    <Image
                                        src="/image/event/aset/tasbening.png"
                                        alt="Image"
                                        height="auto"
                                        width="70px"
                                        className="user-drag-none user-select-none zindex2"

                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">
                                    其他: 演唱會應援包 (40名)
                                    <br></br>
                                    市價 550元

                                </div>

                            </div>

                        </div>

                        <div className="col-12  h-100 d-flex justify-content-between align-items-center mt-2" >

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/keychain.png"
                                        alt="Image"
                                        height="auto"
                                        width="70px"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">

                                    Pixel造型鑰匙圈組合-隨機 (60名)
                                    <br></br>
                                    市價 290元


                                </div>

                            </div>
                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">

                                    <Image
                                        src="/image/event/aset/sticker.png"
                                        alt="Image"
                                        height="auto"
                                        width="70px"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">
                                    貼紙組合 (80名)
                                    <br>
                                    </br>
                                    市價 299元

                                </div>

                            </div>

                        </div>

                        <div className="col-12 d-flex justify-content-between bottom-0 mb-4 mt-3" >

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/boneka.png"
                                        alt="Image"
                                        height="70px"
                                        width="auto"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">
                                    兔兔吊飾 (50名)
                                    <br></br>
                                    市價 299元

                                </div>

                            </div>

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/kardus.png"
                                        alt="Image"
                                        height="60px"
                                        width="auto"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">

                                    營多拌炒麵乙箱 (10名)
                                    <br></br>
                                    市價 600元

                                </div>

                            </div>

                        </div>

                    </div>
                    <div className="col-12 mt-3 text-outline-white">
                        2025/2/7 中午公布得獎名單
                    </div>


                </div>

            </div>


            <div id="10" className="pattern-background col-12 vh-100 px-0 position-relative page-section">


                <div className="position-absolute h-100 w-100 py-4 d-flex justify-content-center align-items-center">

                    <div className=" pb-0 pt-5 card bg-white position-relative shadow" style={{ borderRadius: "30px", maxHeight: "550px", width: "80vw", maxWidth: "550px" }}>
                        <div className="d-flex h-100 position-relative align-items-center">

                            <div className="position-absolute  h-100 d-flex justify-content-center w-100 " >
                                <div className="">
                                    <Image
                                        src="/image/event/aset/Title-big-indofood-tw.png"
                                        alt="Picture of Banner"
                                        height="auto"
                                        width="100%"
                                        style={{
                                            marginTop: "-70px",
                                            maxWidth: "200px"
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="position-absolute h-100 d-flex justify-content-center w-100">
                                <div className="d-inline-block" style={{ maxWidth: '800px', width: '80%' }}>
                                    <Image
                                        src="/image/event/aset/Title-indofood-tw.png"
                                        alt="Title Indofood Banner"
                                        style={{ height: 'auto', width: '100%' }} // Ensures image scales with parent
                                    />
                                </div>
                            </div>

                            <div className="container-fluid ">
                                <div className="row  position-relative mt-3 mb-4">
                                    <div className="col-12 d-flex align-items-center mt-4  px-0 py-0">
                                        <div className="container-fluid py-0 ">
                                            <div className="row py-0">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.5vw" }} >

                                                    姓名
                                                </div>
                                                <div className="col-7  text-start " >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        size="xs"
                                                        className="zindex2"
                                                        value={name}
                                                        onChange={(e) => { setName(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end position-relative d-flex align-items-center justify-content-end " style={{ fontSize: "2.5vw" }} >
                                                    身分證或居留證號碼
                                                </div>
                                                <div className="col-7 text-start" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        size="xs"
                                                        className="zindex2"
                                                        value={idnumber}
                                                        onChange={(e) => { setIdnumber(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.5vw" }} >

                                                    電話
                                                </div>
                                                <div className="col-7 text-start" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        size="xs"
                                                        className="zindex2"
                                                        value={phone}
                                                        onChange={(e) => { setPhone(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "2.8vw" }} >

                                                    購買通路含分店
                                                </div>
                                                <div className="col-7  text-start" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        className="zindex2"
                                                        size="xs"
                                                        value={channel}
                                                        onChange={(e) => { setChannel(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.5vw" }} >

                                                    購買日期
                                                </div>
                                                <div className="col-7  text-start" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        className="zindex2"
                                                        size="xs"
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => { setDate(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.5vw" }} >

                                                    購買包數
                                                </div>
                                                <div className="col-7  text-start" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        className="zindex2"
                                                        size="xs"
                                                        value={packetCount}
                                                        onChange={(e) => { setPacketCount(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.4vw" }} >

                                                    統一發票號碼
                                                </div>
                                                <div className="col-7 text-start  d-flex align-items-center" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        className="zindex2"
                                                        size="xs"
                                                        value={invoice}
                                                        onChange={(e) => { setInvoice(e.target.value) }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12  px-0 mt-2 mb-5">
                                        <div className="container-fluid ">
                                            <div className="row ">
                                                <div className="col-5 text-end d-flex align-items-center justify-content-end " style={{ fontSize: "3.2vw" }} >
                                                    上傳發票與明細
                                                </div>
                                                <div className="col-7 text-start d-flex align-items-center" >
                                                    <Input
                                                        style={{ borderRadius: "10px", borderColor: "#DEDEDE" }}
                                                        className="zindex2"
                                                        size="xs"
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        accept="image/*"
                                                        padding="8px"

                                                        sx={{
                                                            "::file-selector-button": {
                                                                backgroundColor: "#4A90E2",
                                                                color: "#fff",
                                                                border: "none",
                                                                borderRadius: "1px",
                                                                cursor: "pointer",
                                                                fontSize: "1px",
                                                                opacity: "0"
                                                            },
                                                            "::file-selector-button:hover": {
                                                                backgroundColor: "#357ABD",
                                                            },
                                                        }}

                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>



                                </div>
                            </div>

                        </div>

                        <div className="col-12 px-0 d-flex  justify-content-center position-absolute bottom-0">
                            <Image
                                src="/image/event/aset/login-button.png"
                                alt="Button"
                                className="user-drag-none user-select-none button-event-tw-2 zindex2"
                                onClick={() => { handleInput() }}
                            />
                        </div>

                    </div>



                </div>


            </div>

            {/* Kartu ke 4 */}


            <div id="11" className="pattern-background col-12 vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


                <div className="position-absolute">
                    <div className="col-12  user-drag-none user-select-none  d-flex justify-content-center align-items-top" style={{ marginBottom: "-20px" }}>
                        <Image
                            src="/image/event/aset/Title-5.png"
                            alt="Title of Banner 2"
                            height="auto"
                            width="190px"
                            className="user-drag-none user-select-none zindex2"
                        />

                    </div>
                    <div className="card shadow position-relative row card-desktop-5 pt-5 "  >



                        <div className="col-12 mt-3 mb-4 pt-1">
                            <div className="row">
                                <div className="col-12 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/indomie.png"
                                                alt="GSS "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌炒麵

                                            </div>
                                        </div>
                                    </div>

                                </div>


                            </div>
                        </div>

                        <div className="col-12 mb-4 pb-3">
                            <div className="row">

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/spicy.png"
                                                alt="GPD "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多辣味拌炒麵

                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/sotomie.png"
                                                alt="sm "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵
                                                <br></br>
                                                青檸牛肉風味

                                            </div>
                                        </div>
                                    </div>


                                </div>

                            </div>
                        </div>

                        <div className="col-12 mb-4 pb-3">
                            <div className="row">

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/rendang.png"
                                                alt="grs "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌炒麵
                                                <br></br>

                                                辣味牛肉風味

                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-sa.png"
                                                alt=" sa "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵
                                                <br></br>
                                                特色雞肉風味
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>

                        <div className="col-12  mb-4 pb-3 ">
                            <div className="row">
                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-iip.png"
                                                alt=" iip  "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌炒麵
                                                <br></br>
                                                辣味牛肋風味
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-k.png"
                                                alt="k "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵
                                                <br></br>
                                                咖哩雞肉風味


                                            </div>
                                        </div>

                                    </div>


                                </div>
                            </div>
                        </div>

                        <div className="col-12 mb-4 pb-3">
                            <div className="row">

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-ihag.png"
                                                alt="ihag "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌炒麵
                                                <br></br>
                                                辣味雞肉風味
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div className="col-6 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-ab.png"
                                                alt="ab"
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵
                                                <br></br>
                                                香蔥雞肉風味
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>

                        <div className="col-12 mb-4 pb-2">
                            <div className="row">

                                <div className="col-4 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/popmie.png"
                                                alt=" CGSSJ  "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多經典印尼炒麵重量杯
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div className="col-4 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/indomiepack.png"
                                                alt="GS"
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多珍饌
                                                <br></br>
                                                印尼極品炒麵
                                            </div>
                                        </div>
                                    </div>


                                </div>

                                <div className="col-4 d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/IndomieSotopack.png"
                                                alt=" GSM "
                                                height="60px"
                                                width="auto"
                                                className="user-drag-none user-select-none zindex2"
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多珍饌
                                                <br></br>
                                                蒜香極品炒麵
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>


                    </div>


                </div>

            </div>

            < SyaratdanKetentuan
                id="98"
            />
            
            <ListWinnerPublic
                id="101"
            />

        </div >

    )
}

export default MobileTaiwanEvent2024