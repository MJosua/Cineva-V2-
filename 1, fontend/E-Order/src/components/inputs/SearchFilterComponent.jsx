import {
    Select,
    Input,
    InputRightAddon,
    Tooltip,
    Button,
    InputGroup,
    useToast,

} from "@chakra-ui/react";

import React, { useState, useEffect } from "react";

import { AiOutlineSearch } from "react-icons/ai";
import { ImSortAmountAsc, ImSortAmountDesc } from "react-icons/im";
import { FaFilterCircleXmark } from "react-icons/fa6";

function SearchFilterComponent({
    getOrderHeader,
    page,
    setPage,
    limit,
    setLimit,
    totalPage,
    setTotalPage,
    startWeek,
    startWeek2,
    order_by_week,
    setOrder_by_week,
    desc,
    setDesc,
    status,
    setStatus,
    stuffingstart,
    setStuffingstart,
    stuffingend,
    setStuffingend,
    find,
    setFind,
    loading,
    setLoading,
    orderHeader,

}) {

    // copy ini ke main page 
    // const [page, setPage] = useState(1);
    // const [limit, setLimit] = useState(5);
    // const [totalPage, setTotalPage] = useState(1);
    // const [startWeek, setStartWeek] = useState([]);
    // const [startWeek2, setStartWeek2] = useState([]);
    // const [order_by_week, setOrder_by_week] = useState(0);
    // const [desc, setDesc] = useState("1");
    // const [status, setStatus] = useState(0);
    // const [stuffingstart, setStuffingstart] = useState(0);
    // const [stuffingend, setStuffingend] = useState(0);
    // const [find, setFind] = useState("");
    // const [loading, setLoading] = React.useState(true);
    // const handlePageDecrement = () => {
    //     if (page != 1) {
    //         setPage(page - 1)
    //     }
    // }
    // const handlePageIncrement = () => {
    //     if (page != totalPage) {
    //         setPage(page + 1)
    //     }
    // }


    // const [desc, setDesc] = useState("1");
    const handleDescChange = (value) => {
        setLoading(true);
        setDesc(value)
    }



    // const [page, setPage] = useState(1);


    // const [limit, setLimit] = useState(5);
    const handleLimitChange = (value) => {
        setLimit(value);
        setPage(1);
    }

    // const [order_by_week, setOrder_by_week] = useState(0);
    const handleOrder_by_weekChange = (event) => {
        setOrder_by_week(event.target.value)
    }

    const printStartWeek = () => {
        // Check if startWeek is empty or not defined
        if (!startWeek || startWeek.length === 0) {
            // Handle the case where startWeek is empty
            return <option value="">No data available</option>;
        }

        const uniqueWeeks = new Set();

        return startWeek
            .sort((a, b) => a.delv_week - b.delv_week)
            .map((header, idx) => {
                if (!uniqueWeeks.has(header.delv_week)) {
                    uniqueWeeks.add(header.delv_week);

                    return (
                        <option key={idx} value={header.delv_week}>
                            {header.delv_week_desc}
                        </option>
                    );
                }

                return null;
            });
    };

    const printStartWeek2 = () => {
        if (!startWeek2 || startWeek2.length === 0) {
            // Handle the case where startWeek is empty
            return <option value="">No data available</option>;
        }
        const uniqueWeeks2 = new Set();

        return startWeek2.map((header, idx) => {
            if (!uniqueWeeks2.has(header.delv_week)) {
                uniqueWeeks2.add(header.delv_week);

                return (
                    <option key={idx} value={header.delv_week}>
                        {header.delv_week_desc}
                    </option>
                );
            }

            return null;
        });
    };
    const toast = useToast();
    const handleButtonReset = () => {
        setFind("");
        setStuffingend(0);
        setStuffingstart(0);
        setStatus(0);
        setDesc("1");
        setPage(1)
        setLoading(true);

    }

    // const [status, setStatus] = useState(0);
    const handleStatusChange = (event) => {
        setLoading(true);
        setStatus(event.target.value)
    };
    // const [stuffingstart, setStuffingstart] = useState(0);
    const handleStuffingstartChange = (event) => {
        setLoading(true);
        setStuffingstart(event.target.value);
    }
    // const [stuffingend, setStuffingend] = useState(0);
    const handleStuffingendChange = (event) => {
        setLoading(true);
        setStuffingend(event.target.value);
    }
    // const [find, setFind] = useState("");

    const validateInput = (value) => {
        // Simple validation example: allow only alphanumeric characters and some special characters
        const regex = /^[a-zA-Z0-9\s\/\\\-_()]*$/
        if (!regex.test(value)) {
            toast({
                title: "Error!",
                description: `Input Can't Use That Special Character`,
                status: "error",
                duration: 6000,
                isClosable: true
            });
            return false;
        } else {
            return true;

        }
    };

    const handleFindChange = (event) => {
        setLoading(true);
        setFind(event)
    }




    return (

        <>
            <div className="row ps-4">
                <div className="col-9 col-md-2 text-start px-3 px-md-0">
                    <Select
                        value={order_by_week}
                        onChange={handleOrder_by_weekChange}
                        className="grey_text_14px_light"
                        size="sm"
                        defaultValue=""
                    >
                        <option value="" >
                            Sort by Stufing Week
                        </option>
                        <option value="1">
                            Sort by Creation Date
                        </option>
                    </Select>
                </div>

                <div className="col-2 col-md-1 ">
                    <div className="row px-0">
                        <div className="col-6 d-flex justify-content-center align-items-center ">
                            <div
                                onClick={() => desc = "" ? null : handleDescChange("")}
                                className={desc === "" ? "btn btn-secondary disabled shadow-sm px-2 active" : " btn btn-outline-secondary  shadow-sm px-2  "}>
                                <ImSortAmountAsc />
                            </div>
                        </div>
                        <div className="col-6 d-flex justify-content-center align-items-center ">
                            <div
                                onClick={() => handleDescChange("1")}
                                className={desc === "1" ? "btn btn-secondary disabled shadow-sm px-2 active" : " btn btn-outline-secondary shadow-sm px-2  "}>
                                <ImSortAmountDesc />
                            </div>
                        </div>

                    </div>
                </div>

                <div className="col-12 mb-1 mb-md-0 col-md-2 d-flex px-3 px-md-0 ">
                    <div className="col-12">

                        <Select
                            value={status}
                            onChange={handleStatusChange}
                            className="grey_text_14px_light"
                            size="sm"
                            defaultValue="0"
                        >
                            <option value="0">All Status</option>
                            <option value="1">Waiting for Confirmation</option>
                            <option value="2">On Process</option>
                            <option value="3">On Delivery</option>
                            <option value="4">Done</option>
                            <option value="99">Rejected</option>
                            <option value="88">Complained</option>\
                            <option value="77">Canceled</option>
                        </Select>
                    </div>
                </div>

                <div className="col-md-1 col-4 mb-1  text-secondary mb-md-0 d-flex text-center align-items-center text-start px-3 px-md-1 ">
                    <div className="position-absolute fs-6 stuffing-week-mobile " >
                        Stuffing:
                    </div>
                </div>

                <div className="col-8 mb-1 mb-md-0 col-md-3 d-flex justify-content-end  ">

                    <Select
                        value={stuffingstart}
                        onChange={handleStuffingstartChange}
                        className="grey_text_14px_light"
                        size="sm"
                        defaultValue="1"
                    >
                        <option value="1" selected>
                            Start
                        </option>
                        {printStartWeek()}
                    </Select>

                    <div className="mx-2">-</div>

                    <Select
                        value={stuffingend}
                        onChange={handleStuffingendChange}
                        className="grey_text_14px_light"
                        size="sm"
                        defaultValue="99"
                    >
                        <option value="99" selected>
                            Until
                        </option>
                        {printStartWeek2()}
                    </Select>

                </div>

                <Tooltip label="Press Enter to Search" aria-label='A tooltip'>
                    <div className="col-12 col-md-2 text-start px-3 px-md-0 ">

                        <InputGroup size='sm'>
                            <Input placeholder='Search'
                                // onBlur={(e) => {
                                //     const value = e.target.value;
                                //     if (validateInput(value)) {
                                //         handleFindChange(value);
                                //     }

                                // }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // Prevent default behavior of the Enter key (submitting a form, etc.)
                                        e.preventDefault();

                                        const value = e.target.value;
                                        if (validateInput(value)) {
                                            handleFindChange(value);
                                            // You can add additional logic here for when Enter is pressed
                                            console.log('Enter key pressed');
                                        }
                                    }
                                }}
                            />
                            <InputRightAddon

                                children={

                                    <AiOutlineSearch
                                        className="color_red d-flex align-items-center py-1"
                                        size={30}
                                    />

                                }
                            />
                        </InputGroup>
                    </div>
                </Tooltip>
                <div className="col-1">
                    <Tooltip label="Button Reset" aria-label='A tooltip'>
                        <Button
                            onClick={() => {
                                handleButtonReset();
                            }}
                            size="sm" borderRadius={0}>
                            <FaFilterCircleXmark />
                        </Button>
                    </Tooltip>
                </div>


            </div>




        </>

    )
}

export default SearchFilterComponent



