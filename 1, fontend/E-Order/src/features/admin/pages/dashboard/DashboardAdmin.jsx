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

import { useSelector, useDispatch } from "react-redux";

import ControlBar from "../../../../components/layout/ControlBar.jsx";
import SearchBarComponent from "../../../../components/inputs/SearchBarComponent.jsx";

import Sidebar from "../../../../components/layout/Sidebar.jsx";

import { MdFireTruck } from "react-icons/md";

import { clearSeasonStorage } from "../../../../action/cartAction";
import { useLocation } from "react-router-dom"
import { seasonOut, loginAction, logoutAction } from "../../../../action/userAction";

import { createEventSource } from "../../../../services/api/sse";
import { SearchIcon } from "@chakra-ui/icons";

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [logs, setLogs] = useState([]);
    const logsContainerRef = React.useRef(null);

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (logsContainerRef.current) {
            logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
    }, [logs]);

    useEffect(() => {
        const token = localStorage.getItem("tokek");
        // Pass module=eorder to filter logs on server side
        const eventSource = createEventSource("/sse/logs?module=eorder", token);

        eventSource.addEventListener("logs", (event) => {
            setLogs(JSON.parse(event.data)); // initial logs
        });

        eventSource.addEventListener("new_log", (event) => {
            setLogs((prev) => [...prev, JSON.parse(event.data)]);
        });

        eventSource.onerror = (err) => {
            console.error("SSE error:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);


    // User requested to keep it simple and just show the raw value as it is.
    // We will just map directly over the `logs` state in the render block
    // to avoid regex match failures causing missing logs.


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
    const [selectLevel, setSelectLevel] = useState("*");
    const [search, setSearch] = useState("");

    // Dynamically get unique dates from logs for the dropdown
    const uniqueDates = Array.from(new Set(logs.map(logObj => {
        const logStr = typeof logObj === 'string' ? logObj : (logObj.data || "");
        // Extract DD-MM-YYYY from [MODULE][LEVEL][DD-MM-YYYY | HH:mm:ss]
        const match = logStr.match(/\[(\d{2}-\d{2}-\d{4})/);
        return match ? match[1] : null;
    }).filter(d => d !== null))).sort((a, b) => b.localeCompare(a)); // Newest first

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
                                                                onChange={(e) => setSelectDate(e.target.value)}
                                                                value={selectDate}
                                                            >
                                                                <option value="*">All Dates</option>
                                                                {uniqueDates.map((date, i) => (
                                                                    <option key={i} value={date}>{date}</option>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                        <div className="col d-flex align-items-center">
                                                            <Select
                                                                onChange={(e) => setSelectLevel(e.target.value)}
                                                                value={selectLevel}
                                                            >
                                                                <option value="*">All Levels</option>
                                                                <option value="INFO">INFO</option>
                                                                <option value="WARN">WARN</option>
                                                                <option value="ERROR">ERROR</option>
                                                                <option value="TABLE">TABLE</option>
                                                            </Select>
                                                        </div>
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

                                        <div className="col-12 bg-dark w-100 vh-25 position-relative" style={{ maxHeight: "65vh", overflow: " auto" }} ref={logsContainerRef}>
                                            <div className="row">
                                                <div className="col-12 bg-dark text-start text-success fw-bold p-2 sticky-top border-bottom border-success">
                                                    Admin Network Log [LIVE]
                                                </div>
                                                <div className="col-12 font-monospace fs-6 pb-3">
                                                    {logs.map((logObj, idx) => {
                                                        const logStr = typeof logObj === 'string' ? logObj : (logObj.data || "");
                                                        // Remove ANSI colors
                                                        const cleanLog = logStr.replace(/\u001b\[\d+m/g, "");

                                                        // Filter logic based on the raw string
                                                        if (selectDate !== "*" && !cleanLog.includes(selectDate)) return null;
                                                        if (selectLevel !== "*" && !cleanLog.includes(`[${selectLevel}]`)) return null;
                                                        if (search && !cleanLog.toLowerCase().includes(search.toLowerCase())) return null;

                                                        let bgColor = "transparent";
                                                        let textColor = "#00ff00"; // default info
                                                        if (cleanLog.includes("[ERROR]")) {
                                                            bgColor = "#3d0000";
                                                            textColor = "#ff7272";
                                                        } else if (cleanLog.includes("[WARN]")) {
                                                            bgColor = "#3d3200";
                                                            textColor = "#ffdb4d";
                                                        }

                                                        return (
                                                            <div key={idx} className="text-start d-flex align-items-start px-2 py-1 pt-2 border-bottom border-secondary" style={{ backgroundColor: bgColor, color: textColor }}>
                                                                <span style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{highlightText(cleanLog, search)}</span>
                                                            </div>
                                                        );
                                                    })}
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




