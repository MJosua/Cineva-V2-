import { Button, IconButton, Image, Input, InputGroup, InputRightElement, Spinner, Table } from "@chakra-ui/react"
import AdminHeaderTW from "../Component/AdminHeader"
import { HiInformationCircle } from "react-icons/hi2"
import { BsInfoCircle } from "react-icons/bs"
import { useEffect, useState } from "react"
import Axios from "axios"
import { API_URL } from "../../../../../config"

function EventTwGenerator() {


    const [dataSave, setDataSave] = useState([]);

    const getDataSave = async () => {

        Axios.get(API_URL + `/event/eventtw2024datamentah`, {
        })
            .then((res) => {
                console.log(res);
                console.log("berhasil")
                setDataSave(res.data.data)
            })
            .catch((err) => {
                console.log("Gagal 2")
                console.log(err)
            })
    }


    const [dataWin, setDataWin] = useState([]);

    const getDataWin = async () => {

        Axios.get(API_URL + `/event/eventtw2024win`, {
        })
            .then((res) => {
                // console.log(res);

                if (res.data.data.length < 205) {
                    getDataSave();
                } else {
                    setDataWin(res.data.data)
                    // console.log("Ada Datanya")
                }


            })
            .catch((err) => {
                console.log("err", err)
            })
    }

    useEffect(() => {
        getDataWin();
    }, [])


    const [displayedData, setDisplayedData] = useState({
        firstPrize: [],
        secondPrize: [],
        thirdPrize: [],
        fourthPrize: [],
        fifthPrize: [],
        sixthPrize: [],
        seventhPrize: [],
        eighthPrize: [],

    });
    const [isAnimating, setIsAnimating] = useState(false);

    // Generate a random string
    const generateRandomText = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return Array(10)
            .fill(null)
            .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
            .join("");
    };

    // Generate a list of names
    // const generateNames = (n) => {
    //     const placeholderNames = [
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy",
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy",
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy",
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy",
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy",
    //         "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    //         "Karl", "Liam", "Mallory", "Nina", "Oscar", "Paul", "Quinn", "Rachel", "Steve", "Tracy"
    //     ];

    //     // Shuffle the array
    //     const shuffledNames = placeholderNames
    //         .sort(() => Math.random() - 0.5) // Randomize order
    //         .slice(0, n); // Take only the required number of names

    //     return shuffledNames;
    // };


    const handleButtonClick = () => {
        if (isAnimating) return;
        setIsAnimating(true);

        // Initialize the winners data
        const valuesOnly = dataSave.map(item => item.column_2); // Extract only the values

        const allWinners = {
            eighthPrize: valuesOnly.slice(0, 80),   // First item (80 winner)
            seventhPrize: valuesOnly.slice(80, 140), // 60 winners (1-25)
            sixthPrize: valuesOnly.slice(140, 190), // 50 winners (26-60)
            fifthPrize: valuesOnly.slice(190, 200), // 10 winners (61-120)
            fourthPrize: valuesOnly.slice(200, 240), // 40 winners (121-170)
            thirdPrize: valuesOnly.slice(240, 275), // 35 winners (171-210)
            secondPrize: valuesOnly.slice(275, 300), // 25 winners (211-220)
            firstPrize: valuesOnly.slice(300, 301), // 1 winners (221-310)
        };



        // Data to store prize categories
        const newData = {
            eighthPrize: [],
            seventhPrize: [],
            sixthPrize: [],
            fifthPrize: [],
            fourthPrize: [],
            thirdPrize: [],
            secondPrize: [],
            firstPrize: [],
        };

        // Track already selected winners to avoid duplicates
        let usedWinners = new Set();

        // List of prize categories
        const categories = [
            "eighthPrize",
            "seventhPrize",
            "sixthPrize",
            "fifthPrize",
            "fourthPrize",
            "thirdPrize",
            "secondPrize",
            "firstPrize",
        ];

        let categoryIndex = 0;
        let rowIndex = 0;

        // Helper function to pick a new winner that hasn't been used yet
        const getUniqueWinner = (category) => {
            const availableWinners = allWinners[category].filter(name => !usedWinners.has(name));
            if (availableWinners.length === 0) {
                return ""; // If no unique winner left, return empty string
            }

            const winner = availableWinners[Math.floor(Math.random() * availableWinners.length)];
            usedWinners.add(winner); // Mark this winner as used
            return winner;
        };

        const revealNextWinner = () => {
            if (categoryIndex >= categories.length) {
                setIsAnimating(false);
                return;
            }

            const category = categories[categoryIndex];

            if (rowIndex < allWinners[category].length) {
                // Add a random text placeholder for the "casino effect"
                newData[category].push(generateRandomText());
                setDisplayedData({ ...newData });

                // Rapidly change random text for "casino effect"
                let randomTextInterval = setInterval(() => {
                    newData[category][rowIndex] = generateRandomText();
                    setDisplayedData({ ...newData });
                }, 50);

                // After 1.5 seconds, reveal the actual winner and remove the name from the list
                setTimeout(() => {
                    clearInterval(randomTextInterval);

                    const winner = getUniqueWinner(category); // Get a unique winner

                    newData[category][rowIndex] = winner;
                    setDisplayedData({ ...newData });

                    rowIndex++;
                    setTimeout(revealNextWinner, 10); // Delay before next row
                }, 500);
            } else {
                categoryIndex++;
                rowIndex = 0;
                setTimeout(revealNextWinner, 250); // Delay before next category
            }
        };

        revealNextWinner();
    };

    const handleButtonSave = () => {
        const prizeCategories = [
            "firstPrize",
            "secondPrize",
            "thirdPrize",
            "fourthPrize",
            "fifthPrize",
            "sixthPrize",
            "seventhPrize",
            "eighthPrize",
        ];

        const formData = new FormData();

        prizeCategories.forEach((category, index) => {
            const prizeWinners = displayedData[category]; // Get winners array
            const ranking = index + 1; // Column_1 value (1 for firstPrize, 2 for secondPrize, etc.)

            prizeWinners.forEach((winner) => {
                formData.append("column_1", ranking); // Prize ranking
                formData.append("column_2", winner);   // Winner's name
            });

        });

        formData.append("Country", 1);
        formData.append("Event_id", 889);

        Axios.post(`${API_URL}/event/eventtw2024win`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
            .then(response => {
                console.log("Response:", response.data);
                alert("Data saved successfully!");
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Failed to save data.");
            });
    };


    return (

        <div className="container-fluid">

            <div className="row px-0 background-gradient-event-tw">

                <div className="col-12 vh-100  px-0 position-relative page-section">
                    {/* Background */}

                    <div className="container-fluid h-100 w-100 zindex2">

                        <div className="row">
                            {/* Header */}
                            <div className="col-12 ">
                                <AdminHeaderTW />
                            </div>
                        </div>

                        {/* Body */}
                        <div className="col-12">
                            <div className="row">
                                <div className="col-3">
                                    <div className="row">
                                        <div className="col-12 py-2">
                                            <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                <div className="row">

                                                    <div className="col-12 text-primary fw-bold fs-5">
                                                        Winner Generator
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 py-2">
                                            <div className="card pt-4 pb-1 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                <div className="row">

                                                    <div className="col-12 text-secondary shadow-inner text-start">
                                                        <p className="fw-bold d-flex align-items-center fs-5">
                                                            <BsInfoCircle className="me-2" /> Rules
                                                        </p>
                                                        <div className="fw-bold d-flex align-items-center fs-6">
                                                            <ol>
                                                                <li>
                                                                    Only one time
                                                                </li>
                                                                <li>
                                                                    Can't be traded
                                                                </li>
                                                                <li>
                                                                    Can't be changed
                                                                </li>
                                                                <li>
                                                                    Based on Luck
                                                                </li>
                                                                <li>
                                                                    No Interuption
                                                                </li>
                                                            </ol>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 py-2">

                                            <Button
                                                isLoading={isAnimating}
                                                isDisabled
                                                colorScheme="red" className="shadow w-100"
                                                onClick={() => { handleButtonClick() }}
                                            >
                                                PRESS ME To Generate
                                                {displayedData.firstPrize.length > 0 &&
                                                    " Again"
                                                }
                                            </Button>



                                        </div>

                                        <div className="col-12 py-2">

                                            {displayedData.firstPrize.length > 0 &&

                                                <Button
                                                    colorScheme="teal" className="shadow w-100"
                                                    onClick={() => { handleButtonSave() }}
                                                    isDisabled={isAnimating}
                                                >
                                                    Save and Download

                                                </Button>
                                            }

                                        </div>

                                    </div>
                                </div>
                                {dataSave.length > 1 ?

                                    <div className="col-9 " style={{ maxHeight: "600px", overflow: "auto" }}>

                                        <div className="row">
                                            <div className="col-12">

                                                <div className="row">

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/sticker.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            貼紙組合
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.eighthPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">



                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/keychain.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />

                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            造型鑰匙圈組合-隨機
                                                                        </div>


                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.seventhPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>



                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/boneka.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            兔兔吊飾
                                                                        </div>


                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.sixthPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/kardus.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            營多拌炒麵乙箱
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.fifthPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>


                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/tasbening.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            其他: 演唱會應援包
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.fourthPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/baju.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            三獎: 兔兔口袋短T
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.thirdPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>









                                                </div>

                                            </div>

                                            <div className="col-12">
                                                <div className="row">

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/tas.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px" }}>
                                                                            二獎: 丹寧包+燙布貼
                                                                        </div>

                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "80px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.secondPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{index + 1}</td>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>



                                                    <div className="col-4">
                                                        <div className="row">
                                                            <div className="col-12 py-3">
                                                                <div className="card py-4 px-3 shadow" style={{ borderRadius: "15px", height: "160px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12  text-primary d-flex justify-content-center  fs-6">
                                                                            <Image
                                                                                src="/image/event/aset/tiket.png"
                                                                                alt="Image"
                                                                                height="80px"
                                                                                width="auto"
                                                                                className="user-drag-none user-select-none zindex2"
                                                                            />
                                                                        </div>

                                                                        <div className="col-12 text-warning fw-bold mt-2" style={{ fontSize: "15px" }}>
                                                                            頭獎: 雙人首爾來回機票
                                                                        </div>



                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="col-6 ">
                                                        <div className="row ">
                                                            <div className="col-12 py-3 h-100">
                                                                <div className="card py-4 px-3 d-flex justify-content-center" style={{ borderRadius: "15px", height: "160px" }}>
                                                                    <table className="table-stripped table">
                                                                        <thead>
                                                                            <tr>
                                                                                {displayedData.firstPrize.length > 0 ?
                                                                                    <th className="text-primary">
                                                                                        First Grand Prize Winner
                                                                                    </th>

                                                                                    :

                                                                                    <th>
                                                                                        The winner will be listed here
                                                                                    </th>
                                                                                }
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {displayedData.firstPrize.map((winner, index) => (
                                                                                <tr className="fw-bold" key={index}>
                                                                                    <td>{winner}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                    :
                                    <div className="col-9 ">
                                        <div className="row">
                                            <div className="col-12">

                                                <div className="row">

                                                    <div className="col-2">
                                                        <div className="row">
                                                            <div className="col-12 py-2">
                                                                <div className="card py-4 px-3 shadow " style={{ borderRadius: "15px" }} >
                                                                    <div className="row">

                                                                        <div className="col-12 text-primary d-flex justify-content-center  fs-6">
                                                                            <Spinner
                                                                                size={"xl"}
                                                                            />

                                                                        </div>

                                                                        <div className="col-12 text-primary mt-4" style={{ fontSize: "12px" }}>
                                                                            Loading Data, please wait
                                                                        </div>


                                                                        <div className="col-12 text-primary mt-2" style={{ fontSize: "12px", maxHeight: "140px", overflow: "auto" }}>
                                                                            <table className="table-stripped table">
                                                                                <tbody>
                                                                                    {displayedData.seventhPrize.map((winner, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{winner}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>

                                }





                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    )
}
export default EventTwGenerator