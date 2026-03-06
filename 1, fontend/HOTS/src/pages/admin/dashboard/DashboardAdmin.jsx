import React, { useState, useEffect } from "react";

import {
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Input,
    Select,
    InputGroup,
    InputRightElement,
} from "@chakra-ui/react";

import {
    // navigate,
    useNavigate,
} from "react-router-dom";

import Axios from "axios";

import { useSelector, useDispatch } from "react-redux";

import ControlBar from "../../../components/ControlBar";
import SearchBarComponent from "../../../components/SearchBarComponent";

import Sidebar from "../../../components/Sidebar";

import { MdFireTruck } from "react-icons/md";

import { clearSeasonStorage } from "../../../action/cartAction";
import { useLocation } from "react-router-dom"
import { seasonOut, loginAction, logoutAction } from "../../../action/userAction";

// import { io } from "socket.io-client"; // Removed
import { API_URL } from "../../../config";
import { SearchIcon } from "@chakra-ui/icons";

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // const socket = io(API_URL); // Socket.io removed
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;

        console.log("🔌 Connecting to Admin Log Stream via SSE...");
        const eventSource = new EventSource(`${API_URL}/sse/logs?token=${token}`);

        eventSource.onopen = () => {
            console.log("✅ Admin Log Stream Connected");
        };

        eventSource.addEventListener('new_log', (e) => {
            try {
                const parsed = JSON.parse(e.data);
                const logMsg = parsed.data; // content is in .data property
                setLogs((prevLogs) => [...prevLogs, logMsg]);
            } catch (err) {
                console.error("Error parsing log:", err);
            }
        });

        eventSource.onerror = (err) => {
            console.error("❌ Admin Log Stream Error:", err);
            eventSource.close();
        };

        return () => {
            console.log("🔌 Disconnecting Admin Log Stream...");
            eventSource.close();
        };
    }, []);



    // **1️⃣ Extract Date, Time, and Message**
    const parsedLogs = logs.map(log => {
        // Remove ANSI color codes
        const cleanLog = log.replace(/\u001b\[\d+m/g, "");

        // Extract date, time, and message
        const match = cleanLog.match(/^(\d{1,2}\/\d{1,2}\/\d{4}) (\d{2}\.\d{2}\.\d{2}) : (.+)$/);
        if (!match) return null; // Skip if format is incorrect

        const [_, date, time, message] = match;
        return { date, time, message };
    }).filter(log => log !== null); // Remove null values

    // **2️⃣ Group Logs by Date**
    const groupedLogs = parsedLogs.reduce((acc, log) => {
        if (!acc[log.date]) acc[log.date] = [];
        acc[log.date].push(log);
        return acc;
    }, {});

    // **3️⃣ Convert to an Array for Mapping**
    const formattedLogs = Object.entries(groupedLogs).map(([date, logs]) => ({
        date,
        logs: logs.sort((a, b) => a.time.localeCompare(b.time))
    }));

    console.log(formattedLogs);


    const { active, type_id } = useSelector((state) => {
        return {
            active: state.userReducer.active,
            type_id: state.userReducer.type_id
        };
    });
    const location = useLocation();
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


    useEffect(() => {
        sessionStorage.removeItem('truckOrders');
    }, [])


    // ================================================== INITIALISE SESSION STORAGE ==================================================

    const [initialise, setInitialise] = React.useState(false);
    const order = [];

    if (initialise === false && (type_id === 3 || type_id === 4)) {
        clearSeasonStorage(order);
        setInitialise(true);
    }

    const [selectDate, setSelectDate] = useState("*");
    const [selectTime, setSelectTime] = useState();
    const [search, setSearch] = useState();

    const [listDate, setListDate] = useState();
    const [listTime, setListTime] = useState();

    const highlightText = (text, query) => {
        if (!query) return text; // If no search query, return text as-is.

        const regex = new RegExp(`(${query})`, "gi"); // Case-insensitive search
        return text.split(regex).map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ?
                <span key={index} style={{ backgroundColor: "yellow", color: "black" }}>{part}</span>
                : part
        );
    };

    return (
        <div>
            {/* navbar */}
            <SearchBarComponent type_id={type_id} />

            <div>
                <div className="py-5 mt-2 stick-left">
                    <div className="row">
                        <div className="col-6 col-sm-12"></div>
                        <div className="col-6 col-sm-12">
                            <Sidebar />
                        </div>
                    </div>
                </div>

                <div className="py-5">
                    {/* CONTENT BELOW */}

                    <div className=" col-md-11 mt-3 padding_start_custom">
                        <div className="pb-5 pt-4">
                            <div className="px-0">
                                <div className="container-fluid">
                                    <div className="row">
                                        <div className="col-12 fw-bold text-start fs-2 px-0">

                                            <div className="row d-flex align-items-center">
                                                <div className="col-auto">
                                                    <h4 className="mb-0">Admin Dashboard</h4>
                                                </div>

                                                <div className="col  p-3 rounded ">
                                                    <div className="row g-2 ">
                                                        <div className="col d-flex align-items-center">
                                                            <Select
                                                                onChange={(e) => {
                                                                    setSelectDate(e.target.value);
                                                                }}
                                                                value={selectDate}
                                                            >
                                                                <option value="*">

                                                                    Select Date
                                                                </option>

                                                                {formattedLogs.map((group, index) => (
                                                                    <option key={index} value={group.date}>
                                                                        {group.date}
                                                                    </option>
                                                                )
                                                                )
                                                                }
                                                            </Select>
                                                        </div>
                                                        {/* <div className="col d-flex align-items-center">
                                                            <Select>
                                                                <option>
                                                                    Select Max Filter Time
                                                                </option>
                                                            </Select>
                                                        </div> */}
                                                        <div className="col d-flex align-items-end">
                                                            <InputGroup>
                                                                <Input
                                                                    onChange={(e) => {
                                                                        setSearch(e.target.value)
                                                                    }
                                                                    }
                                                                    value={search}
                                                                    type="text"

                                                                    placeholder="Search" />
                                                                <InputRightElement>
                                                                    <SearchIcon color='green.500' />
                                                                </InputRightElement>
                                                            </InputGroup>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>

                                        <div className="col-12 bg-dark w-100 vh-25 position-relative" style={{ maxHeight: "50vh", overflow: " auto" }}>
                                            <div className="row">
                                                <div className="col-12 bg-dark text-start  text-success fw-bold  ">
                                                    Admin Log
                                                </div>
                                                <div className="col-12 ">
                                                    {formattedLogs
                                                        .filter(group => selectDate === "*" || group.date === selectDate) // Corrected filtering logic
                                                        .map((group, index) => (
                                                            <div key={index}>
                                                                <div className="text-white text-start">{group.date}</div> {/* Display Date */}
                                                                {group.logs.map((log, idx) => (
                                                                    <div key={idx} className="text-start text-white d-flex align-items-center">
                                                                        <span className="me-2">{log.time}</span> {/* Display Time */}
                                                                        <span>{highlightText(log.message, search)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}

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
        </div >
    );
};

export default DashboardAdmin
