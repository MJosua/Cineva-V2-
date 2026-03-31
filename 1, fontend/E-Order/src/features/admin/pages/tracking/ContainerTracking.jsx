import React, { useEffect, useMemo, useState } from "react";
import {
    useSteps,
    Stepper,
    Step,
    StepIndicator,
    StepIcon,
    StepNumber,
    Box,
    StepTitle,
    StepDescription,
    StepSeparator,
    StepStatus,
    Badge,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    IconButton,
    InputLeftElement,
    Image,
    Stack,
    Circle,
    VStack,
    Text,
    Flex,
    Progress,
    Icon,
    HStack,
    Spinner,
    Tooltip,
    Divider,
    Select,
    ButtonGroup,
} from "@chakra-ui/react";
import { renderToString } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayerGroup, CircleMarker } from "react-leaflet";
import 'leaflet-polylinedecorator';
import L from "leaflet";
import Axios from "axios";
import { API_URL } from "../../../../config";
import { seasonOut, loginAction, logoutAction } from "../../../../action/userAction";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaCircle, FaHome, FaMapMarkerAlt, FaSearch, FaShip } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { FaLocationArrow } from "react-icons/fa";
import { FaX } from "react-icons/fa6";
import axios from "axios";
import { LuWarehouse } from "react-icons/lu";
import { GiCargoShip } from "react-icons/gi";
import { BiDownArrow, BiRefresh, BiUpArrow } from "react-icons/bi";
import { formatDate } from "../../../../utils/DateFormatter";

function ContainerTracking({
    dataContainer,
    dataLocation,
    container_status,
    dataRoute,
    dataPinLocation,
    dataRoutenPath,
    containerName,
    dataVessel,
    dataEvent,
    admin
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { number, so_id } = useParams();
    const [dataNumber, setDataNumber] = useState("");
    const [containerNameState, setContainerName] = useState(containerName || "");
    const [orderSOIDState, setoOrderSOIDState] = useState(containerName || "");
    const [orderSealineState, setoOrderSealineState] = useState(containerName || "");
    const [dataEventState, setDataEvent] = useState(dataEvent || []);
    const [containerStatusState, setContainerStatus] = useState(container_status || "");
    const [dataLocationState, setDataLocation] = useState(dataLocation || []);
    const [dataPinLocationState, setDataPinLocation] = useState(dataPinLocation || {});
    const [dataRouteState, setDataRoute] = useState(dataRoute || []);
    const [dataVesselState, setDataVessel] = useState(dataVessel || []);
    const [dataContainerState, setDataContainer] = useState(dataVessel || []);
    const [dataTimeDeparture, setDataTimeDeparture] = useState();
    const [dataTimeArrive, setDataTimeArrive] = useState();
    const [dataProgressPercentage, setDataProgressPercentage] = useState();
    const [dataLocationDeparture, setDataLocationDeparture] = useState();
    const [dataLocationArrive, setDataLocationArrive] = useState();
    const [selectedLocation1, setSelectedLocation1] = useState()
    const [selectedLocation2, setSelectedLocation2] = useState()
    const [updateat, setUpdateat] = useState("")
    const [loading, setLoading] = useState(false)
    const [poNumber, setPoNumber] = useState("")
    const [fullRoutePath, setFullRoutePath] = useState(null);
    const [errorState, setErrorState] = useState({
        hasError: false,
        errorType: null, // 'not_found_local', 'not_found_searates', 'api_error', 'network_error'
        message: '',
        searchedNumber: ''
    });
    const [trackingAnalytics, setTrackingAnalytics] = useState(null);

    // UI: Tracking type selector & sealine dropdown
    const [trackingType, setTrackingType] = useState("auto"); // auto | ct | bl | bk
    const [sealineSelect, setSealineSelect] = useState("auto"); // auto | SCAC code
    const [sealineOptions, setSealineOptions] = useState([]);

    // Fetch sealine list on mount for dropdown
    useEffect(() => {
        axios.get(`${API_URL}/searates/getSealineList`)
            .then(r => { if (r.data?.data) setSealineOptions(r.data.data); })
            .catch(() => { });
    }, []);

    // ==========================================================
    // âœ… PATCHED UNIFIED FETCH LOGIC STARTS HERE
    // ==========================================================
    const unifiedFetchSeaRatesData = async ({ number, so_id, refresh = false }) => {
        const qp = new URLSearchParams();
        if (refresh) qp.set('refresh', 'true');
        if (trackingType && trackingType !== 'auto') qp.set('type', trackingType);
        if (sealineSelect && sealineSelect !== 'auto') qp.set('sealine', sealineSelect);
        const url = API_URL + '/searates/searatesTrackByNumber/' + number + (so_id ? '/' + so_id : '') + (qp.toString() ? '?' + qp.toString() : '');

        try {
            const res = await axios.get(url);
            let dataList = Array.isArray(res.data) ? res.data : (res.data?.data ? [res.data.data] : []);

            // Find best candidate (first one with containers, or just the first if all empty)
            let src = dataList.find(d => d.containers?.length > 0 || d.container?.length > 0) || dataList[0];

            if (!src) {
                console.warn("âš ï¸ No valid data structure found in response");
                // Throw with context so handleDataFetch can set proper error
                const notFoundError = new Error('No valid data structure found');
                notFoundError.type = 'not_found';
                notFoundError.serverMessage = res.data?.message || '';
                throw notFoundError;
            }

            if (res.data?.data?.data || res.data?.data) {
                console.log("searatesData", src)
            } else {
                console.log("containerData", src)
            }

            const normalized = {
                metadata: src.metadata || {},
                containers: src.container || src.containers || [],
                events: src.events || src.container_events || src.containers?.[0]?.events || [],
                locations: src.locations || [],
                vessels: src.vessels || [],
                dataRoute: src.dataRoute || (src.route ? [{ pol: [src.route.pol], pod: [src.route.pod] }] : []),
                pin_location: src.pin_location || (
                    src.route_data?.pin
                        ? { lat: src.route_data.pin[0], lng: src.route_data.pin[1] }
                        : {}
                ),
                fullRoute: src.fullRoute || null,
                poNumber: src.po_number || src.metadata?.po_number || "",
                updateat: src.metadata?.updated_at || src.last_updated_date || new Date().toISOString(),
                tracking_analytics: src.tracking_analytics || null
            };
            return normalized;
        } catch (err) {
            console.error(" unifiedFetchSeaRatesData error:", err);
            // Enrich error with context
            if (!err.type) {
                if (err.response?.status === 404) {
                    err.type = 'not_found';
                    err.serverMessage = err.response?.data?.message || '';
                } else if (err.response?.status >= 500) {
                    err.type = 'server_error';
                } else if (!err.response) {
                    err.type = 'network_error';
                } else {
                    err.type = 'api_error';
                }
            }
            throw err;
        }
    };

    const handleDataFetch = async ({ number, so_id, refresh = false }) => {
        setLoading(true);
        // Clear previous error state
        setErrorState({ hasError: false, errorType: null, message: '', searchedNumber: '' });

        try {
            setContainerName("");
            setoOrderSOIDState("");
            setDataLocation([]);
            setDataEvent([]);
            setContainerStatus("");
            setDataPinLocation({});
            setDataRoute([]);
            setDataVessel([]);
            setDataTimeDeparture("");
            setDataTimeArrive("");
            setDataProgressPercentage();
            setDataLocationDeparture("");
            setDataLocationArrive("");
            setDataContainer([]);
            setFullRoutePath(null); // Clear fullRoutePath

            const data = await unifiedFetchSeaRatesData({ number, so_id, refresh });

            // 🛑 Detect UNKNOWN status from SeaRates (acts as negative cache)
            const trackingStatus = data.containers?.[0]?.container_status || data.metadata?.status || "";
            if (trackingStatus.toUpperCase() === 'UNKNOWN') {
                const err = new Error("Tracking data could not be found. The number might be incorrect, too old, or not supported by the carrier yet.");
                err.type = 'unknown_tracking';
                throw err;
            }

            setDataContainer(data.containers || []);
            setContainerName(data.containers?.[0]?.container_number || data.metadata?.number || "");
            setoOrderSOIDState(data.containers?.[0]?.so_id || "");
            setDataLocation(data.locations || []);
            setDataEvent(data.events || []);
            setContainerStatus(data.containers?.[0]?.container_status || data.metadata?.status || "");
            setDataPinLocation(data.pin_location || {});
            setDataRoute(data.dataRoute || []);
            setoOrderSealineState(data.containers?.[0]?.sealine_name || data.metadata?.sealine_name || "");
            setDataVessel(data.vessels || []);
            setUpdateat(data.updateat);
            setPoNumber(data.poNumber);
            setFullRoutePath(data.fullRoute);
            setTrackingAnalytics(data.tracking_analytics);
            setDataRoute(data.dataRoute || []);

            const trackingStatusObj = data.containers?.[0]?.container_status || data.metadata?.status || "";
            let polDateStr = data.dataRoute?.[0]?.pol?.[0]?.date;
            let podDateStr = data.dataRoute?.[0]?.pod?.[0]?.date || data.dataRoute?.[0]?.postpod?.[0]?.date;
            let polLocationId = data.dataRoute?.[0]?.pol?.[0]?.location;
            let podLocationId = data.dataRoute?.[0]?.pod?.[0]?.location || data.dataRoute?.[0]?.postpod?.[0]?.location;

            // 🛑 FALLBACK FOR MISSING POD DATE OR LOCATION
            if ((!podDateStr || !podLocationId) && data.events && data.events.length > 0) {
                const sortedEvents = [...data.events].sort((a, b) => new Date(b.date) - new Date(a.date));
                const lastEvent = sortedEvents[0];
                if (!podDateStr) podDateStr = lastEvent.date;
                if (!podLocationId) podLocationId = lastEvent.location_list_id || lastEvent.location_id;
            }

            if (trackingStatusObj.toUpperCase() === 'DELIVERED') {
                setDataProgressPercentage(100);
            } else if (polDateStr && podDateStr) {
                const polDate = new Date(polDateStr);
                const podDate = new Date(podDateStr);
                if (!isNaN(polDate) && !isNaN(podDate)) {
                    const now = new Date();
                    const totalDuration = podDate - polDate;
                    const progressDuration = now - polDate;
                    const progress = Math.max(0, Math.min(progressDuration / totalDuration, 1));
                    const progressPercentage = Math.max(0, Math.min(100, progress * 100));
                    setDataProgressPercentage(progressPercentage);
                } else {
                    setDataProgressPercentage(0);
                }
            } else {
                setDataProgressPercentage(0);
            }

            let locationNameDeparture = data.locations?.find(
                (loc) => loc.location_list_id === polLocationId || loc.id === polLocationId
            );
            setDataLocationDeparture(locationNameDeparture?.name || "");
            setDataTimeDeparture(polDateStr || "");

            let locationNameArrive = data.locations?.find(
                (loc) => loc.location_list_id === podLocationId || loc.id === podLocationId
            );
            setDataLocationArrive(locationNameArrive?.name || "");
            setDataTimeArrive(podDateStr || "");

            setLoading(false);
            setIsVisible(false);
        } catch (err) {
            console.error(" handleDataFetch error:", err);

            // Determine error type and set appropriate message
            let errorType = 'api_error';
            let message = 'An error occurred while fetching tracking data.';
            const serverMsg = err.serverMessage || err.response?.data?.message || '';

            if (err.type === 'not_found' || err.type === 'unknown_tracking') {
                // Check if it's a SeaRates issue or local DB issue
                if (err.type === 'unknown_tracking') {
                    errorType = 'not_found_searates';
                    message = err.message;
                } else if (serverMsg.toLowerCase().includes('searates') ||
                    serverMsg.toLowerCase().includes('subscription') ||
                    serverMsg.toLowerCase().includes('unavailable')) {
                    errorType = 'not_found_searates';
                    message = 'SeaRates tracking service is currently unavailable. This may be due to subscription limits or service maintenance.';
                } else {
                    errorType = 'not_found_local';
                    message = `Tracking number "${dataNumber || number}" was not found in our database.`;
                }
            } else if (err.type === 'network_error' || !err.response) {
                errorType = 'network_error';
                message = 'Could not connect to the server. Please check your internet connection.';
            } else if (err.type === 'server_error' || err.response?.status >= 500) {
                errorType = 'server_error';
                message = 'Something went wrong on the server. Please try again later.';
            }

            setErrorState({
                hasError: true,
                errorType,
                message,
                searchedNumber: number
            });
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleDataFetch({ number: dataNumber || number, so_id, refresh: false });
    };

    const handleRefresh = async (e) => {
        e.preventDefault();
        await handleDataFetch({ number: dataNumber || number, so_id, refresh: true });
    };

    const fetchData = async (number, so_id) => {
        await handleDataFetch({ number, so_id, refresh: false });
    };

    // ==========================================================
    // âœ… PATCHED UNIFIED FETCH LOGIC ENDS HERE
    // ==========================================================


    useEffect(() => {
        if (dataNumber && !number && !so_id) {
            fetchData(dataNumber, 0);
        } else if (number && so_id) {
            setDataNumber(number);
            fetchData(number, so_id);
        } else if (number && so_id) {
            fetchData(number, so_id);
        }
    }, [number, so_id]);



    const groupedData = useMemo(() => {
        if (!dataEvent || dataEvent.length === 0) { // Ensure dataEvent exists
            if (dataEventState.length > 0) {
                const grouped = dataEventState.reduce((acc, curr) => {
                    const locId = (curr.location_id ?? curr.location); // fallback ke `location` jika `location_id` tidak ada
                    acc[locId] = acc[locId] || [];
                    acc[locId].push(curr);
                    return acc;
                }, {});

                Object.values(grouped).forEach(events => {
                    events.sort((a, b) => a.order_id - b.order_id);
                });

                return grouped;

            }
        }
        else {

            const grouped = dataEvent.reduce((acc, curr) => {
                const locId = curr.location_id.toString(); // Ensure consistency in object keys
                acc[locId] = acc[locId] || [];
                acc[locId].push(curr);
                return acc;
            }, {});

            // Sort each group by order_id
            Object.values(grouped).forEach(events => {
                events.sort((a, b) => a.order_id - b.order_id);
            });

            return grouped;
        }


    }, [dataEvent, dataEventState]);

    const steps = useMemo(() => {
        if (!groupedData && !dataLocation) {
            return []
        }; // Prevent errors on empty data
        if (groupedData && dataLocation) { // Prevent errors on empty data
            return Object.entries(groupedData)
                .map(([locationId, events]) => ({
                    location: dataLocation.find(loc => loc.location_list_id === parseInt(locationId))?.name || 'Unknown',

                    events,
                }))

                .sort((a, b) => (a.events[0]?.order_id || 0) - (b.events[0]?.order_id || 0)); // Handle potential missing order_id
        };
        if (groupedData && !dataLocation) { // Prevent errors on empty data



            const data = Object.entries(groupedData)
                .filter(([locationId]) => parseInt(locationId) !== 0)
                .map(([locationId, events]) => ({
                    location: dataLocationState.find(loc => {
                        const idToMatch = locationId.toString();
                        return loc.location_list_id?.toString() === idToMatch || loc.id?.toString() === idToMatch;
                    })?.name || 'Unknown',
                    events,
                }))
                .sort((a, b) => (a.events[0]?.order_id || 0) - (b.events[0]?.order_id || 0)); // Handle potential missing order_id

            // Example: [2, 3, 1]


            return data
        };

    }, [groupedData, dataLocation,]);


    const locationPath = useMemo(() => {
        return steps
            .map(step => {
                const matchingLocation = dataLocationState?.find(
                    loc => loc.name === step.location
                );
                return matchingLocation
                    ? ('location_list_id' in matchingLocation
                        ? matchingLocation.location_list_id
                        : matchingLocation.id)
                    : null;
            })
            .filter(id => id !== null && id !== undefined);
    }, [steps, dataLocationState]);



    const trueStepsLength = steps.filter(step => step.events[0]?.actual).length;

    const { activeStep } = useSteps({
        index: trueStepsLength,
        count: steps.length,
    });

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // in kilometers
    };

    const wrapLongitude = (lng, referenceLng) => {
        while (lng < referenceLng - 180) lng += 360;
        while (lng > referenceLng + 180) lng -= 360;
        return lng;
    };

    const fullRoute = useMemo(() => {
        if (
            !Array.isArray(dataLocationState) ||
            !dataLocationState.length ||
            !locationPath ||
            !Array.isArray(locationPath)
        ) return [];

        let pin;

        if (
            Array.isArray(dataPinLocationState) &&
            dataPinLocationState.length === 2 &&
            typeof dataPinLocationState[0] === 'number' &&
            typeof dataPinLocationState[1] === 'number'
        ) {

            pin = dataPinLocationState;
        } else if (
            dataPinLocationState?.lat != null &&
            dataPinLocationState?.lng != null
        ) {
            pin = [dataPinLocationState.lat, dataPinLocationState.lng];
        } else if (
            Array.isArray(dataPinLocationState) &&
            dataPinLocationState.length === 1 &&
            dataPinLocationState[0]?.longitude != null &&
            dataPinLocationState[0]?.latitude != null
        ) {
            pin = [dataPinLocationState[0].latitude, dataPinLocationState[0].longitude];
        } else {
            pin = [-6.21462, 106.84513]; // default location
        }


        const currentLoc = {
            name: 'Current',
            lat: pin[0],
            lng: pin[1],
            isPin: true,
        };

        // Step 1: Get valid route points
        const routePoints = locationPath
            .map(id =>
                dataLocationState.find(loc =>
                    (loc?.location_list_id === id || loc?.id === id) &&
                    loc.lat != null && loc.lng != null
                )
            )
            .filter(Boolean);

        // Step 2: Find best insert position
        let bestIdx = 0;
        let minDist = Infinity;

        for (let i = 0; i < routePoints.length - 1; i++) {
            const p1 = routePoints[i];
            const p2 = routePoints[i + 1];

            if (!p1 || !p2) continue;

            const distToSegment =
                haversineDistance(currentLoc.lat, currentLoc.lng, p1.lat, p1.lng) +
                haversineDistance(currentLoc.lat, currentLoc.lng, p2.lat, p2.lng);

            const segmentLength = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng);

            const deviation = distToSegment - segmentLength;
            if (deviation < minDist) {
                minDist = deviation;
                bestIdx = i + 1;
            }
        }

        // Step 3: Insert current location
        const routeWithCurrent = [
            ...routePoints.slice(0, bestIdx),
            currentLoc,
            ...routePoints.slice(bestIdx),
        ];

        return routeWithCurrent;
    }, [dataLocationState, dataPinLocationState, locationPath]);

    const RecenterMap = ({ lat, lng }) => {
        const map = useMap();

        useEffect(() => {
            if (lat != null && lng != null) {
                // Ensure the view is centered on the SAME wrapped coordinate as markers
                map.setView([lat, wrapLongitude(lng, 106.8333)]);
            }
        }, [lat, lng, map]);

        return null;
    };

    const markerRedIcon = useMemo(() => L.divIcon({
        className: "text-danger shadow-marker",
        html: renderToString(<FaMapMarkerAlt style={{ fontSize: '24px' }} />),
        iconSize: [24, 24],
    }), []);

    const markerYellowIcon = useMemo(() => L.divIcon({
        className: "text-warning shadow-marker",
        html: renderToString(<FaMapMarkerAlt style={{ fontSize: '24px' }} />),
        iconSize: [24, 24],
    }), []);

    const lastLocationBeforeShip = useMemo(() => {
        if (!fullRoute || fullRoute.length === 0) return null;
        const currentIdx = fullRoute.findIndex(p => p.isPin);
        if (currentIdx > 0) {
            const prev = fullRoute[currentIdx - 1];
            return prev.location_list_id || prev.id || prev.name;
        }
        return null;
    }, [fullRoute]);


    const [flip, setflip] = useState(false);


    const getBearing = (lat1, lon1, lat2, lon2) => {
        const toRad = deg => deg * (Math.PI / 180);
        const toDeg = rad => rad * (180 / Math.PI);

        const phi1 = toRad(lat1);
        const phi2 = toRad(lat2);
        const deltaLambda = toRad(lon2 - lon1);

        const y = Math.sin(deltaLambda) * Math.cos(phi2);
        const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
        const theta = Math.atan2(y, x);
        return (toDeg(theta) + 360) % 360; // Normalize to 0-360 degrees
    };

    const shipAngle = useMemo(() => {
        const currentIdx = fullRoute.findIndex(p => p?.isPin);
        const next = fullRoute[currentIdx + 1];
        const current = fullRoute[currentIdx];
        if (!next || !current) return 0;

        const results = getBearing(current.lat, current.lng, next.lat, next.lng)
        let finalresults
        if (results <= 90
            &&
            results >= 270
        ) {
            setflip(true)
        } else {
            setflip(false)
        }

        if ((results >= 90 && results <= 120)) {
            finalresults = results - 65;
        }

        if ((results >= 120 && results <= 135)) {
            finalresults = results - 85;
        }

        if ((results >= 225 && results <= 249)) {
            finalresults = results + 60;
        }

        if ((results >= 250 && results <= 270)) {
            finalresults = results + 80;
        }

        if ((results >= 271 && results <= 290)) {
            finalresults = results + 65;
        }

        if ((results >= 291 && results <= 315)) {
            finalresults = results + 85;
        }


        if ((results >= 45 && results <= 59)) {
            finalresults = results - 60;
        }

        if ((results >= 60 && results <= 89)) {
            finalresults = results - 80;
        }


        return finalresults; // implement this function or use existing one
    }, [fullRoute]);

    // Inside your component


    const markerIcon = useMemo(() => L.divIcon({
        className: `text - merah shadow - kapal ${flip ? "flipicon" : ""} `,
        html: renderToString(
            <div style={{ position: "relative", width: "5em", height: "5em" }}>
                <GiCargoShip


                    style={{
                        position: "absolute", fontSize: "3.5em", color: "#fff",
                        transformOrigin: 'center',
                        transform: `rotate(${shipAngle}deg)${flip ? " scaleX(-1)" : ""} `

                    }} />
                <GiCargoShip style={{
                    transformOrigin: 'center',
                    transform: `rotate(${shipAngle}deg)${flip ? " scaleX(-1)" : ""} `
                    ,
                    position: "absolute", fontSize: "3.5em", top: "0.05em", left: "0.05em", color: "#2b6cb0"
                }} />
            </div>
        ),
        iconSize: [35, 35],
    }), [shipAngle]);

    function getVesselDetails(vesselId) {
        // console.log("dataEventState", dataEventState)
        const vesselEvents = dataEventState.filter(event => event.vessel_id === vesselId);

        if (!vesselEvents || vesselEvents.length === 0) {
            // no matching events, return fallback
            return {
                voyage: "N/A",
                locationStart: "N/A",
                locationEnd: "N/A",
                ETD: null,
                ETA: null,
            };
        }

        const sortedEventsFirst = vesselEvents.sort((b, a) => new Date(b.date) - new Date(a.date));

        const firstVesselEvent = sortedEventsFirst[0];  // Access the first event
        const sortedEvents = vesselEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestEvent = sortedEvents[0];
        const locationStart = dataLocationState.find(loc => loc.location_list_id === firstVesselEvent.location_id);
        const locationEnd = dataLocationState.find(loc => loc.location_list_id === latestEvent.location_id);

        const vesselDetails = {
            voyage: firstVesselEvent.voyage,
            locationStart: locationStart?.name ? locationStart.name : "unknown",
            locationEnd: locationEnd?.name ? locationEnd.name : "unknown",
            ETD: firstVesselEvent.date,
            ETA: latestEvent.date,

        };

        return vesselDetails;
    }


    const [isVisible, setIsVisible] = useState(true);
    const [isHiding, setIsHiding] = useState(false);

    const handleToggle = () => {
        if (isVisible && !isHiding) {
            // Condition 1: Hide with animation
            setIsHiding(true);
            setTimeout(() => {
                setIsVisible(false);
                setIsHiding(false);
            }, 300); // Match animation duration
        } else {
            // Condition 2: Show again
            setIsVisible(true);
        }
    };

    return (
        <div className="container-fluid px-0 position-relative w-100 h-100">

            {/* ================= FLOATING UI ================= */}
            <div className='position-absolute w-100 top-0 pt-3 start-0' style={{ zIndex: 1100 }}>
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="col-md-5 col-11 ps-md-5 ps-3">

                                {/* SEARCH */}
                                {admin && (
                                    <Box
                                        bg="rgba(255,255,255,0.85)"
                                        backdropFilter="blur(10px)"
                                        borderRadius="xl"
                                        boxShadow="lg"
                                        p={3}
                                        mb={3}
                                    >
                                        <form onSubmit={handleSubmit}>
                                            <Flex gap={2}>
                                                <Input
                                                    value={dataNumber}
                                                    onChange={(e) => setDataNumber(e.target.value)}
                                                    placeholder="Enter CT / BL / Booking"
                                                    size="sm"
                                                />
                                                <IconButton
                                                    icon={<FaSearch />}
                                                    type="submit"
                                                    size="sm"
                                                    colorScheme="blue"
                                                    isLoading={loading}
                                                />
                                            </Flex>
                                        </form>
                                    </Box>
                                )}

                                {/* LOADING */}
                                {loading && (
                                    <Box
                                        p={6}
                                        bg="rgba(255,255,255,0.75)"
                                        backdropFilter="blur(12px)"
                                        borderRadius="xl"
                                    >
                                        <Skeleton height="20px" mb={3} />
                                        <SkeletonText noOfLines={4} />
                                    </Box>
                                )}

                                {/* ERROR */}
                                {!loading && errorState.hasError && !containerNameState && (
                                    <Box p={5} bg="white" borderRadius="xl" boxShadow="md">
                                        <VStack>
                                            <Text fontWeight="bold">Error</Text>
                                            <Text fontSize="sm">{errorState.message}</Text>
                                            <Button onClick={handleRefresh} size="sm">
                                                Retry
                                            </Button>
                                        </VStack>
                                    </Box>
                                )}

                                {/* MAIN CARD */}
                                {!loading && containerNameState && (
                                    <Box
                                        p={5}
                                        bg="rgba(255,255,255,0.8)"
                                        backdropFilter="blur(12px)"
                                        borderRadius="2xl"
                                        boxShadow="xl"
                                    >
                                        {/* HEADER */}
                                        <Flex justify="space-between" mb={3}>
                                            <Box>
                                                <Text fontWeight="bold">{containerNameState}</Text>
                                                <Text fontSize="xs">{orderSealineState}</Text>
                                            </Box>

                                            <Badge colorScheme="blue">
                                                {containerStatusState}
                                            </Badge>
                                        </Flex>

                                        {/* PROGRESS */}
                                        <Progress value={dataProgressPercentage} mb={3} />

                                        {/* LOCATIONS */}
                                        <Flex justify="space-between" fontSize="xs">
                                            <Text>{dataLocationDeparture}</Text>
                                            <Text>{dataLocationArrive}</Text>
                                        </Flex>

                                        {/* TABS */}
                                        <Tabs mt={4}>
                                            <TabList>
                                                <Tab>Route</Tab>
                                                <Tab>Vessel</Tab>
                                            </TabList>

                                            <TabPanels>
                                                <TabPanel>
                                                    {steps.map((step, i) => (
                                                        <Box key={i} mb={3}>
                                                            <Text fontWeight="bold">{step.location}</Text>
                                                            {step.events.map((e, j) => (
                                                                <Text key={j} fontSize="xs">
                                                                    {e.description}
                                                                </Text>
                                                            ))}
                                                        </Box>
                                                    ))}
                                                </TabPanel>

                                                <TabPanel>
                                                    {dataVesselState.map((v, i) => (
                                                        <Text key={i}>{v.name}</Text>
                                                    ))}
                                                </TabPanel>
                                            </TabPanels>
                                        </Tabs>
                                    </Box>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MAP ================= */}
            <div className="row px-0" style={{ height: "100vh" }}>
                <div className="col-12 px-0">
                    <MapContainer
                        center={[-6.2, 106.8]}
                        zoom={4}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker
                            position={
                                dataPinLocationState?.lat
                                    ? [dataPinLocationState.lat, dataPinLocationState.lng]
                                    : [-6.2, 106.8]
                            }
                            icon={markerIcon}
                        />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

export default ContainerTracking;





