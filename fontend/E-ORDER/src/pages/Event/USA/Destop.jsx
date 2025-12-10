import { Button, Checkbox, Image, Input, Text, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, IconButton, Box, } from "@chakra-ui/react"
import FlipSlideshow from "./FlipSlideShowComponent/FlipSlideshowEventtw"
import SyaratdanKetentuan from "./SyaratdanKetentuan/SyaratdanKetentuan";
import { useState } from "react";
import ListWinnerPublic from "./ListWinnerPublic";
import { GiHamburgerMenu } from "react-icons/gi";
import SyaratdanKetentuanUSA from "./SyaratdanKetentuan/SyaratdanKetentuan";
import HeaderEventUSA from "./Component/Header";

function DesktopUSAEvent2024({
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
    setIdnumber,
    handleFileUpload,
    loading
}) {



    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            console.log(`Go to Element ${id}`)
        } else {
            console.log("Element not found:", id);
        }
    };



    const [data, setData] = useState([
        { id: 1, name: "John Doe", age: 28 },
        { id: 2, name: "Jane Smith", age: 34 },
        { id: 3, name: "Mark Johnson", age: 25 },
    ]);
    const [displayedData, setDisplayedData] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);

    const generateRandomText = () => {
        const randomTexts = ["Loading...", "Fetching data...", "Almost there...", "Just a sec..."];
        return randomTexts[Math.floor(Math.random() * randomTexts.length)];
    };

    const handleButtonClick = () => {
        setIsAnimating(true);
        let index = 0;
        const newData = [];

        const animateRows = () => {
            if (index < data.length) {
                // First display random text, then actual data after a delay
                newData.push(generateRandomText());
                setDisplayedData([...newData]);

                setTimeout(() => {
                    newData[index] = `${data[index].name}, ${data[index].age} years old`; // Actual data
                    setDisplayedData([...newData]);
                    index++;
                    animateRows(); // Call next row after delay
                }, 1500); // 1.5-second delay
            } else {
                setIsAnimating(false);
            }
        };

        animateRows();
    };

    return (
        <div className="row px-0 d-md-block" >


            <div className="col-12 vh-100  px-0 position-relative page-section">

                <div className="col-12 position-absolute " style={{ height: "100vh", overflow: "hidden" }}>
                    {/* Background Image */}
                    <div className="row">
                        <div className="col-12" style={{ height: "120vh", overflow: "hidden" }}>
                            <Image
                                src="/image/event/usa/page1/RedBackground.png"
                                alt="Title of Banner 1"
                                height="130%"
                                width="130%"
                                className="shock-effect user-drag-none user-select-none"
                                style={{ position: "absolute", top: 0, left: 0, zIndex: 1, marginTop: "-20px" }}
                            />

                        </div>

                    </div>
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
                        <div className="position-relatives d-flex justify-content-center" style={{ marginTop: "-60px" }}>

                            <div className="col-12 position-absolute d-flex justify-content-center align-items-center h-100" >
                                <Image
                                    src="/image/event/usa/page1/IndomieTitle.png"
                                    alt="Indomie title"
                                    height="auto"
                                    width="40vw"
                                    className="user-drag-none user-select-none zindex2 custom-shadow  pop-effect"
                                />
                            </div>
                            <div className="col-12 position-absolute d-flex justify-content-center align-items-center h-100" >
                                <Image
                                    src="/image/event/usa/page1/SweepstakesTitle.png"
                                    alt="Sweepstakes title"
                                    height="auto"
                                    width="70vw"
                                    marginTop={["100px", "215px"]}
                                    className="user-drag-none user-select-none zindex2 custom-shadow  pop-effect"
                                />
                            </div>

                        </div>
                    </div>

                </div>

            </div>


            {/* //section 2  */}




            <div id="1" className="col-12 vh-100 w-100 px-0 page-section position-relative">

                <div className="position-absolute h-100 w-100 d-flex justify-content-center align-items-end">
                    <Image
                        src="/image/event/usa/page3/24.png"
                        alt="Submit your receipt and win"
                        height="auto"
                        width="11vw"
                        className="user-drag-none user-select-none"
                        style={{ marginBottom: "60px", marginLeft: "-300px" }}
                    />
                </div>


                <div className="position-absolute h-100 w-100 d-flex align-items-center justify-content-center"
                >
                    <div className="container-fluid d-none d-md-block">
                        <div className="row">
                            <div className="col-6  d-flex  justify-content-center" >
                                <Image
                                    src="/image/event/usa/page3/25.png"
                                    alt="Submit your receipt and win"
                                    height="auto"
                                    width="40vw"
                                    className="user-drag-none user-select-none mt-2 "
                                    style={{ marginRight: "-100px" }}
                                />
                            </div>
                            <div className="col-6  d-flex  justify-content-center" >
                                <Image
                                    src="/image/event/usa/page3/26.png"
                                    alt="Buy indomie mie"
                                    height="auto"
                                    width="80vw"
                                    className="user-drag-none user-select-none d-none d-md-block mt-2"
                                    style={{ marginLeft: "-100px" }}
                                />
                            </div>
                        </div>


                    </div>


                    <div className="container-fluid px-0 d-block d-md-none pt-0 ">
                        <div className="row ">
                            <div className="col-12 d-flex justify-content-center px-0 pt-0" >
                                <Image
                                    src="/image/event/usa/page2/page2full.png"
                                    alt="Submit your receipt and win"
                                    height="100vh"
                                    width="auto"
                                    className="user-drag-none user-select-none mt-0"
                                />
                            </div>
                        </div>

                    </div>


                </div>



            </div>

            <div id="2" className="col-12  vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">

                <Image
                    src="/image/event/usa/page3/IndomieNoodlesLadder.png"
                    alt="Title of Banner 2"
                    height="auto"
                    width="100vw"
                    className="position-absolute user-drag-none user-select-none zindex2"
                    style={{ zIndex: "-1" }}
                />

                <div className="col-12 h-100 position-absolute user-drag-none user-select-none position-relatives d-flex justify-content-center align-items-top" >
                    <Image
                        src="/image/event/usa/page5/Prizes.png"
                        height="auto"
                        width="190px"
                        className="position-absolute"
                        alt="prizes"
                        style={{ zIndex: "20", marginTop: "30px" }}
                    />
                </div>

                <div className="position-absolute">


                    <div className="card shadow position-relatives row card-desktop-3  pt-5 pb-5" >

                        <div className="position-absolute h-100 w-100   end-0" style={{ zIndex: "40" }} >
                            <Image
                                src="/image/event/usa/page4/TotalMoneyBox.png"
                                alt="4500 Banner"
                                height="auto"
                                width={["150px", "270px"]}
                                marginBottom={["30px", "-8px"]}
                                position="absolute"
                                bottom="2vh"
                                className="user-drag-none user-select-none"

                            />
                        </div>

                        <div className="container pt-3" style={{ fontSize: "40px", color: "#D41E25" }}>
                            <div className="row">
                                <div className="col-12">
                                    <div className="row">
                                        <div className="col-12 col-md-4 d-flex justify-content-center" >
                                            <div className="row">
                                                <div className="col-12 d-flex justify-content-center">

                                                    <Image
                                                        src="/image/event/usa/page2/laptop.png"
                                                        height={["100px", "150px"]}
                                                        width="auto"

                                                    />


                                                </div>
                                                <div className="col-12 fw-bold text-grand-prize  text-dark ">
                                                    <Text
                                                        fontSize={{ base: "22px", md: "40px" }}
                                                    >
                                                        GRAND PRIZE
                                                    </Text>
                                                </div>

                                                <div className="col-12 fw-bold text-dark" >
                                                    <Text
                                                        fontSize={{ base: "16px", md: "20px" }}
                                                        marginTop={["-20px", "-20px"]}
                                                    >
                                                        MACBOOK PRO
                                                    </Text>
                                                </div>

                                                <div className=" col-6 d-md-none d-flex justify-content-start" style={{ marginTop: "-10px" }}>
                                                    <div className="row">
                                                        <div className="col-12 d-flex justify-content-center">
                                                            <Box height={["100%", "100%", "100%"]} maxH="100px">

                                                                <Image
                                                                    src="/image/event/usa/page2/ipad.png"
                                                                    height="100%"
                                                                    maxW="170px"
                                                                    width="auto"
                                                                />
                                                            </Box>
                                                        </div>
                                                        <div className="col-12 fw-bold text-grand-prize text-dark">
                                                            2ND PRIZE
                                                        </div>

                                                        <div className="col-12 fw-bold text-dark" style={{ fontSize: "16px", marginTop: "-10px" }}>
                                                            IPAD PRO
                                                        </div>
                                                    </div>

                                                </div>
                                                <div className="d-md-none col-6 offset-6 d-flex justify-content-end px-0" style={{ marginTop: "-20px" }}>

                                                    <div className="row">
                                                        <div className="col-12 d-flex justify-content-center">
                                                            <Box height={["100%", "100%", "100%"]} maxH="100px">
                                                                <Image
                                                                    src="/image/event/usa/page2/iphone.png"

                                                                    height="100%"
                                                                    maxW="170px"
                                                                    width="auto"
                                                                />
                                                            </Box>

                                                        </div>
                                                        <div className="col-12 fw-bold text-dark text-grand-prize ">
                                                            3RD PRIZE
                                                        </div>

                                                        <div className="col-12 fw-bold text-dark" style={{ fontSize: "16px", marginTop: "-10px" }}>
                                                            IPHONE 16 PRO
                                                        </div>
                                                    </div>

                                                </div>

                                            </div>

                                        </div>



                                    </div>
                                </div>
                                <div className="col-12 d-none d-md-block" style={{ marginTop: "-240px" }}>
                                    <div className="row">

                                        <div className="col-md-4 col-12 d-none d-md-block">

                                        </div>
                                        <div className="col-md-4 col-6 ">
                                            <div className="row">
                                                <div className="col-12 d-flex justify-content-center">
                                                    <Image
                                                        src="/image/event/usa/page2/ipad.png"
                                                        height="180px"
                                                        width="auto"
                                                    />
                                                </div>
                                                <div className="col-12 fw-bold text-grand-prize text-dark "
                                                >
                                                    2ND PRIZE
                                                </div>

                                                <div className="col-12 fw-bold text-dark" style={{ fontSize: "20px", marginTop: "-10px" }}>
                                                    IPAD PRO
                                                </div>
                                            </div>

                                        </div>
                                        <div className="col-md-4 col-6 d-flex justify-content-center">

                                            <div className="row">
                                                <div className="col-12 d-flex justify-content-center">
                                                    <Image
                                                        src="/image/event/usa/page2/iphone.png"
                                                        height="180px"
                                                        width="auto"
                                                    />
                                                </div>
                                                <div className="col-12 fw-bold text-grand-prize text-dark">
                                                    3RD PRIZE
                                                </div>

                                                <div className="col-12 fw-bold text-dark" style={{ fontSize: "20px", marginTop: "-10px" }}>
                                                    IPHONE 16 PRO
                                                </div>
                                            </div>

                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>



                    </div>



                </div>

                <div className="position-absolute bottom-0 w-100  marquee-wrapper d-block d-md-none" style={{ background: "white" }}>
                    <div className="fs-1 marquee-content text-uppercase">
                        <span>Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite!</span>
                        <span>Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite!</span>
                        <span>Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite! &nbsp; Indomie, my favorite!</span>
                    </div>
                </div>

            </div>

            <div id="3" className="col-12  vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">

                <Image
                    src="/image/event/usa/page3/IndomieNoodlesLadder.png"
                    alt="Title of Banner 2"
                    height="auto"
                    width="100vw"
                    className="d-md-none d-block position-absolute user-drag-none user-select-none zindex2"
                    style={{ zIndex: "-1" }}
                />

                <div className="col-12  h-100 top-0  user-drag-none user-select-none h-100 d-flex justify-content-center align-items-start pt-md-5 pt-4 mt-md-5" >
                    <Image
                        src="/image/event/usa/page5/HowEnter.png"
                        alt="How to Enter"
                        height="auto"
                        width={{ base: "300px", md: "400px" }}
                        style={{ zIndex: "20" }}
                    />
                </div>


                <div className="position-absolute h-100">

                    <div className=" col-12 d-flex justify-content-center align-items-center  mt-4 h-100" >
                        <div className="card card-desktop-3 maxWidth75Mobile" >
                            <div className="container-fluid mt-5">
                                <div className="row">
                                    <div className="col-12 col-md-3 d-flex justify-content-center align-items-center">
                                        <div className="row">
                                            <div className="col-12 d-flex justify-content-center">
                                                <Image
                                                    className="user-drag-none"
                                                    src={`/image/event/usa/page1/iconindomiedus.png`}
                                                    width="auto"
                                                    height={{ base: "130px", md: "200px" }}

                                                />
                                            </div>
                                            <div className="col-12 text-event-usa fw-bold text-stroke ">
                                                <Text
                                                    fontSize={{ base: "16px", md: "17px" }}
                                                >
                                                    Buy Indomie Mi Goreng
                                                    <br></br>
                                                    from Costco Wholesale, Business Center, e-commerce
                                                    <br></br>
                                                    ( https://www.costco.com )
                                                    <br></br>
                                                    from April 1st 2025 until May 1st 2025
                                                </Text>

                                            </div>
                                        </div>

                                    </div>
                                    <div className="col-12 d-none d-md-block col-md-1 d-flex justify-content-center align-items-end mt-5 pt-5">
                                        <Image
                                            className="user-drag-none"
                                            src={`/image/event/usa/page3/arrow1.png`}
                                            width="auto"
                                            height={{ base: "10px", md: "50px" }}

                                        />
                                    </div>

                                    <div className="col-12 col-md-4 d-flex justify-content-center align-items-center">


                                        <div className="row">
                                            <div className="col-12 d-flex justify-content-center">
                                                <Image
                                                    className="user-drag-none"
                                                    src={`/image/event/usa/page3/bill.png`}
                                                    width="auto"
                                                    height={{ base: "100px", md: "160px" }}

                                                />
                                            </div>
                                            <div className="col-12 text-event-usa fw-bold">
                                                <Text
                                                    fontSize={{ base: "16px", md: "17px" }}
                                                >
                                                    Submit your receipt below <br></br>
                                                    (Make sure to take clear picture of your receipt)
                                                </Text>


                                            </div>
                                        </div>

                                    </div>
                                    <div className="col-12 d-none d-md-block col-md-1 d-flex  justify-content-center align-items-center mt-5 pt-4">
                                        <Image
                                            className="user-drag-none"
                                            src={`/image/event/usa/page3/arrow2.png`}
                                            width="auto"
                                            height={{ base: "30px", md: "50px" }}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3 d-flex justify-content-center align-items-center">

                                        <div className="row">
                                            <div className="col-12 d-flex justify-content-center">
                                                <Image
                                                    className="user-drag-none"
                                                    src={`/image/event/usa/page3/microphone.png`}
                                                    width="auto"
                                                    height={{ base: "90px", md: "160px" }}
                                                />
                                            </div>
                                            <div className="col-12 text-event-usa fw-bold">
                                                <Text
                                                    fontSize={{ base: "16px", md: "17px" }}
                                                >
                                                    Winner will be announced <br></br>
                                                    on May 31st, 2025
                                                </Text>

                                            </div>
                                        </div>


                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>




                </div>

            </div>

            <div id="4" className="col-12  vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">
                <Image
                    src="/image/event/usa/page3/IndomieNoodlesLadderREVERSE.png"
                    alt="Title of Banner 2"
                    height="auto"
                    width="100vw"
                    className="d-md-none d-block position-absolute user-drag-none user-select-none zindex2"
                    style={{ zIndex: "-1" }}
                />
                <div className="container-fluid h-100">
                    <div className="row h-100">

                        <div className="col-12 responsive-div top-0 col-md-6 mt-md-0 mt-4 h-100 user-drag-none user-select-none h-100 d-flex justify-content-end  align-items-center" >
                            <Box height={["5vh", "80%", "100%"]} maxH="500px">
                                <Image
                                    src="/image/event/usa/page5/submitreceipt.png"
                                    alt="submit your receipt here"
                                    height={["15vh", "50%", "50%"]} // Auto for mobile, % for larger screens
                                    maxW="400px"
                                    width="auto"
                                    marginTop={["5px", "-110px", "25%"]}
                                    objectFit="contain"
                                    position={["absolute", "relative"]}
                                    top={["20px", "auto"]}
                                    left={["50%", "50%", "auto"]}
                                    transform={["translateX(-50%)", "translateX(-50%)", "none"]}
                                    style={{ zIndex: "3" }}
                                />
                            </Box>

                        </div>

                        <div className="col-12 col-md-6 pt-md-0 pt-5 position-relatives" >

                            <div className="  h-100 w-100 py-4 d-flex justify-content-center align-items-center"
                                style={{ zIndex: "2" }}
                            >
                                <div className="d-md-block d-none" style={{ maxWidth: "400px" }}>
                                    <form onSubmit={(event) => {
                                        event.preventDefault();
                                        handleInput();
                                        // Your form submission logic here
                                    }}>
                                        <Input
                                            placeholder="Legal Name"
                                            className="input-event-usa border-danger"
                                            value={name}
                                            onChange={(e) => { setName(e.target.value) }}

                                        >
                                        </Input>

                                        <Input
                                            className="input-event-usa border-danger"
                                            placeholder="Full Address"
                                            value={channel}
                                            onChange={(e) => { setChannel(e.target.value) }}

                                        >
                                        </Input>

                                        <Input
                                            className="input-event-usa border-danger"
                                            placeholder="Phone Number"
                                            value={phone}
                                            onChange={(e) => { setPhone(e.target.value) }}
                                        >
                                        </Input>

                                        <Input
                                            className="input-event-usa border-danger"
                                            placeholder=" Email"
                                            value={invoice}
                                            onChange={(e) => { setInvoice(e.target.value) }}

                                        >
                                        </Input>

                                        <div className="mb-3 input-file-event-usa position-relatives  d-flex justify-content-between"
                                            style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 9999 }}
                                        >
                                            <label htmlFor="fileUpload" className="input-file-label w-50"
                                                style={{ zIndex: "9999" }}
                                            >
                                                Upload
                                            </label>
                                            <Input
                                                id="fileUpload"
                                                className="input-file-event-usa border-danger"
                                                type="file"
                                                display="none"
                                                onChange={handleFileUpload}
                                            />
                                            <span className="file-name w-100 d-flex justify-content-start">{file ? file.name : "No file chosen"}</span>

                                            <div className="position-absolute text-center" style={{ marginTop: "50px" }}>
                                                <span className="text-small" style={{ fontSize: "10px", marginTop: "-20px" }} >
                                                    *Please upload  jpeg, jpg, png, only with maximum of 3mb size
                                                </span>
                                            </div>
                                        </div>

                                        <div className="col-12">
                                            <div className="d-flex pointer align-items-center justify-content-start mb-2 mt-0 fw-bold text-event-usa">
                                                <Checkbox
                                                    style={{ border: "1px solid black", background: "white" }}
                                                    size="lg"
                                                    onChange={() => setDate(prev => !prev)}
                                                    className="me-2"
                                                    isChecked={date === true || date === 1}
                                                />
                                                <div className="d-md-none d-block" style={{ fontSize: "2.4vw" }}>
                                                    I agree that I am 18 years of age or older
                                                </div>
                                                <div className="d-md-block d-none" style={{ fontSize: "14px" }}>
                                                    I agree that I am 18 years of age or older
                                                </div>

                                            </div>
                                        </div>
                                        <div className="col-11 col-md-12">
                                            <div
                                                className="d-flex pointer text-start align-items-center justify-content-start mb-2 mt-0 fw-bold text-event-usa">
                                                <Checkbox
                                                    style={{ border: "1px solid black", background: "white" }}
                                                    size="lg"
                                                    onChange={() => setPacketCount(prev => !prev)}
                                                    className="me-2"
                                                    isChecked={packetCount === true || packetCount === 1}
                                                />
                                                <div className="d-md-none d-block" style={{ fontSize: "2.4vw" }}>
                                                    I have read and agree to the sweepstakes Official Rules and Privacy Policy
                                                </div>
                                                <div className="d-md-block d-none" style={{ fontSize: "14px" }}>
                                                    I have read and agree to the sweepstakes Official Rules and Privacy Policy
                                                </div>

                                            </div>
                                        </div>
                                        <Button
                                            className="button-event-usa w-50"
                                            colorScheme="red"
                                            type="submit"
                                            isDisabled={!file || !packetCount || !date}
                                            isLoading={loading}
                                        >
                                            Submit {idnumber}
                                        </Button>
                                    </form>
                                </div>

                                <div className="card card-desktop-3 d-block d-md-none py-3 px-4 mt-5">

                                    <div className=" " style={{ maxWidth: "450px" }}>
                                        <form onSubmit={(event) => {
                                            event.preventDefault();
                                            handleInput();
                                            // Your form submission logic here
                                        }}>
                                            <Input
                                                placeholder="Legal Name"
                                                className="input-event-usa border-danger"
                                                value={name}
                                                onChange={(e) => { setName(e.target.value) }}

                                            >
                                            </Input>

                                            <Input
                                                className="input-event-usa border-danger"
                                                placeholder="Full Address"
                                                value={channel}
                                                onChange={(e) => { setChannel(e.target.value) }}

                                            >
                                            </Input>

                                            <Input
                                                className="input-event-usa border-danger"
                                                placeholder="Phone Number"
                                                value={phone}
                                                onChange={(e) => { setPhone(e.target.value) }}
                                            >
                                            </Input>

                                            <Input
                                                className="input-event-usa border-danger"
                                                placeholder=" Email"
                                                value={invoice}
                                                onChange={(e) => { setInvoice(e.target.value) }}

                                            >
                                            </Input>

                                            <div className="mb-3 input-file-event-usa  d-flex justify-content-between"
                                                style={{ display: "flex", alignItems: "center", gap: "10px", zIndex: 9999 }}
                                            >
                                                <label htmlFor="fileUpload" className="input-file-label w-50"
                                                    style={{ zIndex: "9999" }}
                                                >
                                                    Upload
                                                </label>
                                                <Input
                                                    id="fileUpload"
                                                    className="input-file-event-usa border-danger"
                                                    type="file"
                                                    display="none"
                                                    onChange={handleFileUpload}
                                                />
                                                <span className="file-name w-100 d-flex justify-content-start">{file ? file.name : "No file chosen"}</span>
                                            </div>

                                            <div className="col-12">
                                                <div className="d-flex pointer align-items-center justify-content-start mb-2 mt-0 fw-bold text-event-usa">
                                                    <Checkbox
                                                        style={{ border: "1px solid black", background: "white" }}
                                                        size="lg"
                                                        onChange={() => setDate(prev => !prev)}
                                                        className="me-2"
                                                        isChecked={date === true || date === 1}
                                                    />
                                                    <div className="d-md-none d-block" style={{ fontSize: "2.4vw" }}>
                                                        I agree that I am 18 years of age or older
                                                    </div>
                                                    <div className="d-md-block d-none" style={{ fontSize: "14px" }}>
                                                        I agree that I am 18 years of age or older
                                                    </div>

                                                </div>
                                            </div>
                                            <div className="col-11 col-md-12">
                                                <div
                                                    className="d-flex pointer text-start align-items-center justify-content-start mb-2 mt-0 fw-bold text-event-usa">
                                                    <Checkbox
                                                        style={{ border: "1px solid black", background: "white" }}
                                                        size="lg"
                                                        onChange={() => setPacketCount(prev => !prev)}
                                                        className="me-2"
                                                        isChecked={packetCount === true || packetCount === 1}
                                                    />
                                                    <div className="d-md-none d-block" style={{ fontSize: "2.4vw" }}>
                                                        I have read and agree to the sweepstakes Official Rules and Privacy Policy
                                                    </div>
                                                    <div className="d-md-block d-none" style={{ fontSize: "14px" }}>
                                                        I have read and agree to the sweepstakes Official Rules and Privacy Policy
                                                    </div>

                                                </div>
                                            </div>
                                            <Button
                                                className="button-event-usa w-50"
                                                colorScheme="red"
                                                type="submit"
                                                isDisabled={!file || !packetCount || !date}
                                                isLoading={loading}
                                            >
                                                Submit {idnumber}
                                            </Button>
                                        </form>
                                    </div>

                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kartu ke 4 */}

            <div id="5" className="col-12 vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">

                <Image
                    src="/image/event/usa/page3/IndomieNoodlesLadderREVERSE.png"
                    alt="Title of Banner 2"
                    height="auto"
                    width="100vw"
                    className="position-absolute user-drag-none user-select-none zindex2"
                    style={{ zIndex: "-1" }}
                />

                <div className="position-absolute">
                    <div className="col-12  position-relatives user-drag-none user-select-none  d-flex justify-content-center align-items-top" style={{ marginTop: "60px" }}>
                        <Image
                            src="/image/event/usa/page5/tnc.png"
                            height="auto"
                            width="400px"
                            alt=" terms and condition"
                            className="position-absolute"
                            style={{ zIndex: '2', marginTop: '-30px' }}
                        />
                    </div>
                    <div className="container-fluid">
                        <div className="card shadow position-relative row card-desktop-5 px-0" style={{ maxHeight: "90vh", overflow: "auto" }} >


                            <SyaratdanKetentuanUSA />



                        </div>
                    </div>

                </div>

            </div>


        </div >
    )
}

export default DesktopUSAEvent2024