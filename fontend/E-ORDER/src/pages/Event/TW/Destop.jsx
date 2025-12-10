import { Image, Input } from "@chakra-ui/react"
import FlipSlideshow from "./FlipSlideShowComponent/FlipSlideshowEventtw"
import SyaratdanKetentuan from "./SyaratdanKetentuan/SyaratdanKetentuan";
import { useState } from "react";
import ListWinnerPublic from "./ListWinnerPublic";

function DesktopTaiwanEvent2024({
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
        <div className="row px-0 d-md-block d-none background-gradient-event-tw">


            <div className="col-12 vh-100  px-0 position-relative page-section">

                {/* Background untuk desktop */}
                <Image
                    src="/image/event/BGDesktop1.png"
                    alt="Background Banner"
                    height="100vh"
                    width="100vw"
                />

                {/* Baris pertama aksesoris kiri */}
                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-start ">

                    <div className="right-asset-position-tw">
                        <Image
                            src="/image/event/aset/Egg_HiRes4K.png"
                            alt="Icon Telur"
                            className="egg-asset-tw animated-egg"

                        />
                    </div>

                    <div className="right-asset-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon Telur"
                            width="30px"
                            className="egg-asset-tw animated-star"

                        />
                    </div>



                </div>

                {/* Baris pertama aksesoris kanan */}
                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-end ">



                    <div className="left1-asset-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon star"
                            width="14px"
                            className="egg-asset-tw animated-star"

                        />
                    </div>

                    <div className="left1-asset-position-tw">
                        <Image
                            src="/image/event/aset/dot-nada.png"
                            alt="Icon nada"
                            className="egg-asset-tw animated-egg"

                        />
                    </div>

                </div>

                {/* Baris kedua aksesoris kiri */}
                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-start ">

                    <div className="right-asset2-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon star"
                            width="25px"
                            className="egg-asset-tw animated-star mt-5"

                        />
                    </div>

                    <div className="right-asset2-position-tw">
                        <Image
                            src="/image/event/aset/Bumi.png"
                            alt="Icon bumi"
                            className="egg-asset-tw animated-egg"

                        />
                    </div>



                </div>

                {/* Baris kedua aksesoris kanan */}
                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-end ">



                    <div className="left2-asset-position-tw">
                        <Image
                            src="/image/event/aset/Rabbithugindomie.png"
                            alt="Icon star"
                            className="egg-asset-tw animated-star mt-4"

                        />
                    </div>

                    <div className="left2-asset-position-tw">
                        <Image
                            src="/image/event/aset/bintangslimmer.png"
                            alt="Icon Telur"
                            className="egg-asset-tw animated-egg"
                            width="30px"

                        />
                    </div>

                </div>

                <div className="position-absolute vh-100 bottom-0 w-100 d-flex justify-content-start align-items-end">

                    <div className="right-asset3-position-tw">
                        <Image
                            src="/image/event/aset/Noodles_HiRes4K.png"
                            alt="Icon star"
                            className="egg-asset-tw animated-star mt-5"

                        />
                    </div>



                </div>

                {/* Baris kedua aksesoris kanan */}
                <div className="position-absolute vh-100 top-0 w-100 d-flex justify-content-end align-items-end">



                    <div className="left3-asset-position-tw">
                        <Image
                            src="/image/event/aset/BintangPinmk.png"
                            alt="Icon star"
                            className="user-select-none egg-asset-tw animated-star mt-4"

                        />
                    </div>



                </div>

                <div className="position-absolute container-fluid h-100 w-100 ">
                    <div className="row px-0">
                        <div className="col-12 d-flex justify-content-between px-0">
                            <div className="container-fluid px-0">
                                <div className="row">
                                    <div className="col-4 position-relative px-0 py-0 zindex2">
                                        <Image
                                            src="/image/event/aset/IndomieLogo-tw.png"
                                            alt="indomielogo"
                                            width="286px"
                                            className=" pointer"
                                            height="auto"
                                            onClick={() => { window.open("https://www.indomie.com.tw", "_blank"); }}

                                        // style={{marginTop:"-10px", marginLeft:"-20px"}}
                                        />
                                    </div>
                                    <div className="col-8 d-flex justify-content-end align-items-center " style={{ marginTop: "-20px" }}>
                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => {
                                                setTimeout(() => scrollToSection('1'), 0);
                                            }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Bunny_HiRes4K.png"
                                                    alt="icon-button1"
                                                    height="auto"
                                                    width="15px"
                                                />
                                            </div>{/* Replace with your icon */}
                                            活動辦法
                                        </div>

                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => {
                                                setTimeout(() => scrollToSection('2'), 0);
                                            }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Star_100p.png"
                                                    alt="icon-button2"
                                                    height="auto"
                                                    width="15px"
                                                />
                                            </div>{/* Replace with your icon */}
                                            活動獎品
                                        </div>

                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => {
                                                setTimeout(() => scrollToSection('3'), 0);
                                            }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Camera_100p.png"
                                                    alt="icon-button3"
                                                    height="auto"
                                                    width="15px"
                                                />
                                            </div>{/* Replace with your icon */}
                                            登錄發票
                                        </div>

                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => {
                                                setTimeout(() => scrollToSection('99'), 0);
                                            }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Ramyun_100p.png"
                                                    alt="icon-button4"
                                                    height="auto"
                                                    width="15px"

                                                />
                                            </div>{/* Replace with your icon */}
                                            注意事項
                                        </div>

                                        <div className="btn-pink-tw d-flex justify-content-between align-items-center me-2"
                                            onClick={() => {
                                                setTimeout(() => scrollToSection('100'), 0);
                                            }}
                                        >
                                            <div className="me-2">
                                                <Image
                                                    src="/image/event/aset/Mic_100p.png"
                                                    alt="icon-button5"
                                                    height="auto"
                                                    width="15px"
                                                />
                                            </div>{/* Replace with your icon */}
                                            中獎名單
                                        </div>


                                    </div>


                                </div>
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

                <div className="position-absolute vh-100 w-100 d-flex justify-content-center align-items-center" >
                    {/* <Image
                        src="/image/event/aset/information.png"
                        alt="Icon star"
                        width="auto"
                        height="12vw"
                        className="mt-3"
                    /> */}

                    <FlipSlideshow />
                </div>

                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center">
                    <div className="row">


                        <div className="col-12 d-flex justify-content-center">
                            <Image
                                src="/image/event/aset/login-button.png"
                                alt="Button"
                                className="user-drag-none user-select-none button-event-tw glowing-filter"
                                onClick={() => {
                                    setTimeout(() => scrollToSection('3'), 0);
                                }}

                            />

                        </div>


                    </div>


                </div>

                <div className="position-absolute bottom-0 w-100 d-flex justify-content-center align-items-center mb-5">


                    <div className="col-12 d-flex text-white justify-content-center">
                        2025/2/7 中午公布得獎名單
                    </div>




                </div>

                <div className="position-absolute bottom-0 w-100  marquee-wrapper" style={{ background: "#FCE00B" }}>
                    <div className="marquee-content text-uppercase">
                        <span>Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite!</span>
                        <span>Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite!</span>
                        <span>Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite! &nbsp; Indomie, my favourite!</span>
                    </div>
                </div>


            </div>

            {/* //section 2  */}


            <div id="1" className=" pattern-background col-12 vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">



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

                        <div className="col-12 bg-card-taiwan-2 pt-5 w-100 h-100  position-absolute d-flex justify-content-center align-items-center">
                            <div className="container-fluid">
                                <div className="row">

                                    <div className="col-3 ">

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


                                    <div className="col-3 ">

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


                                    <div className="col-3 ">

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


                                    <div className="col-3 ">

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

            <div id="2" className="col-12 pattern-background vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


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



                        <div className="col-12 d-flex justify-content-center ">

                            <div className="row">
                                <div className="col-12 d-flex justify-content-center">

                                    <Image
                                        src="/image/event/aset/tiket.png"
                                        alt="Image"
                                        height="auto"
                                        width="160px"
                                        className="user-drag-none user-select-none zindex2"
                                        style={{ marginTop: "-15px" }}
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center">
                                    頭獎: 雙人首爾來回機票 (1名)
                                    <br></br>
                                    市價 16,000元
                                </div>

                            </div>



                        </div>
                        <div className="col-12 d-flex justify-content-between " style={{ paddingLeft: "21%", paddingRight: "18%", marginTop: "-70px" }}>
                            <div className="row">
                                <div className="col-12 d-flex justify-content-center">

                                    <Image
                                        src="/image/event/aset/tas.png"
                                        alt="Image"
                                        height="120px"
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


                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/baju.png"
                                        alt="Image"
                                        height="auto"
                                        width="110px"
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

                        <div className="col-12 d-flex justify-content-center" style={{ marginTop: "-30px" }}>

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/tasbening.png"
                                        alt="Image"
                                        height="auto"
                                        width="90px"
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

                        <div className="col-12 position-absolute h-100 d-flex justify-content-center align-items-center" style={{ marginTop: "50px" }}>

                            <div className="row" style={{ marginRight: "105vh" }}>
                                <div className="col-12  d-flex justify-content-center" >


                                    <Image
                                        src="/image/event/aset/keychain.png"
                                        alt="Image"
                                        height="auto"
                                        width="110px"
                                        className="user-drag-none user-select-none zindex2"
                                    />

                                </div>
                                <div className="col-12 d-flex justify-content-center ">
                                    Pixel造型鑰匙圈組合-隨機 (60名)
                                    <br></br>
                                    市價 290元
                                </div>

                            </div>
                            <div className="row" style={{ paddingLeft: "0px" }}>
                                <div className="col-12  d-flex justify-content-center" >


                                    <Image
                                        src="/image/event/aset/sticker.png"
                                        alt="Image"
                                        height="auto"
                                        width="110px"
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

                        <div className="col-12 d-flex justify-content-between position-absolute bottom-0 mb-2" style={{ paddingLeft: "25%", paddingRight: "20%", }}>

                            <div className="row">
                                <div className="col-12  d-flex justify-content-center">


                                    <Image
                                        src="/image/event/aset/boneka.png"
                                        alt="Image"
                                        height="80px"
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
                                        height="80px"
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


            <div id="3" className="col-12 pattern-background  vh-100 px-0 position-relative page-section">


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
                                <div className="row   position-relative mt-3 mb-5">
                                    <div className="col-12 d-flex align-items-center mt-5  px-0 py-0">
                                        <div className="container-fluid py-0 ">
                                            <div className="row px-5 py-0">
                                                <div className="col-5 text-end ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end  ">
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end   " >
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
                                            <div className="row px-5">
                                                <div className="col-5 text-end  " >
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
                                                        sx={{
                                                            "::file-selector-button": {
                                                                backgroundColor: "#4A90E2",
                                                                color: "#fff",
                                                                border: "none",
                                                                borderRadius: "1px",
                                                                cursor: "pointer",
                                                                fontSize: "1px",
                                                                opacity: "0",

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


            <div id="4" className="col-12 pattern-background vh-100 w-100 d-flex justify-content-center align-items-center px-0 page-section position-relative">


                <div className="position-absolute">

                    <div className="card shadow position-relative row card-desktop-5 " >

                        <div className="col-12  user-drag-none user-select-none  d-flex justify-content-center align-items-top" style={{ marginTop: "-30px" }}>
                            <Image
                                src="/image/event/aset/Title-5.png"
                                alt="Title of Banner 2"
                                height="auto"
                                width="190px"
                                className="user-drag-none user-select-none zindex2"
                            />

                        </div>

                        <div className="col-12 mt-3 mb-2 pt-4 d-flex justify-content-center">
                            <div className="row">

                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/indomie.png"
                                                alt="Indomie GS"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多珍饌印尼極品炒麵

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/spicy.png"
                                                alt="gpd"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "12px" }}>
                                                營多辣味拌炒麵

                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/rendang.png"
                                                alt="grs"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center ">
                                            <div className="position-absolute" style={{ fontSize: "12px" }}>
                                                營多拌炒麵 辣味牛肉風味
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-iip.png"
                                                alt=" iip "
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "12px" }}>
                                                營多拌炒麵 辣味牛肋風味
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-ihag.png"
                                                alt=" ihag "
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "12px" }}>
                                                營多拌炒麵 辣味雞肉風味
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="col-12 mt-3 mb-2 pt-4 d-flex justify-content-center ">
                            <div className="row">

                                <div className="col-auto d-flex justify-content-center mx-2">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/sotomie.png"
                                                alt="sm"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "12px" }}>
                                                營多拌湯麵 青檸牛肉風味
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center mx-2">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-sa.png"
                                                alt="SA"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"

                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}


                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵 特色雞肉風味
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center mx-2">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-k.png"
                                                alt="pack k"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"

                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}


                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵 咖哩雞肉風味
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="col-auto d-flex justify-content-center mx-2">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/pack-ab.png"
                                                alt="Ab"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多拌湯麵 香蔥雞肉風味
                                            </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="col-12 mt-3 mb-2 pt-4 d-flex justify-content-center">
                            <div className="row">


                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/popmie.png"
                                                alt="cggsj"
                                                height="95px"
                                                width="auto"

                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
                                            />
                                        </div>
                                        <div className="col-12 position-relative d-flex justify-content-center">
                                            <div className="position-absolute" style={{ fontSize: "13px" }}>
                                                營多經典印尼炒麵重量杯
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/indomiepack.png"
                                                alt="indomiepack gs"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
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


                                <div className="col-auto d-flex justify-content-center">
                                    <div className="row">
                                        <div className="col-12 d-flex justify-content-center">
                                            <Image
                                                src="/image/event/aset/IndomieSotopack.png"
                                                alt="indomiepack gsm"
                                                height="auto"
                                                width="8vw"
                                                style={{
                                                    maxWidth: "110px"
                                                }}
                                                className="user-drag-none user-select-none zindex2 button-product-tw pointer"
                                                onClick={() => { window.open("https://www.indomie.com.tw/product.html", "_blank"); }}
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
                id="99"
            />

            <ListWinnerPublic
                id="100"
            />


        </div>
    )
}

export default DesktopTaiwanEvent2024