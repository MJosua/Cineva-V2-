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
} from "@chakra-ui/react";
import { renderToString } from "react-dom/server";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Polyline, useMap, LayerGroup, CircleMarker } from "react-leaflet";
import 'leaflet-polylinedecorator';
import L from "leaflet";
import Axios from "axios";
import { API_URL } from "../../../config";
import { seasonOut, loginAction, logoutAction } from "../../../action/userAction";
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
import { formatDate } from "../../../utils/DateFormatter";

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

    // ==========================================================
    // ✅ PATCHED UNIFIED FETCH LOGIC STARTS HERE
    // ==========================================================
    const unifiedFetchSeaRatesData = async ({ number, so_id, refresh = false }) => {
        const url = `${API_URL}/searates/searatesTrackByNumber/${number}${so_id ? `/${so_id}` : ``}${refresh ? `?refresh=true` : ``}`;

        try {
            const res = await axios.get(url);
            const containerData = Array.isArray(res.data) ? res.data[0] : null;
            const searatesData = res.data?.data?.data || res.data?.data || null;
            const src = containerData || searatesData;

            if (!src) {
                console.warn("⚠️ No valid data structure found in response");
                return null;
            }

            if (res.data?.data?.data || res.data?.data) {
                console.log("searatesData", searatesData)
            }else{
                console.log("containerData", containerData)

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
            };
            return normalized;
        } catch (err) {
            console.error("❌ unifiedFetchSeaRatesData error:", err);
            throw err;
        }
    };

    const handleDataFetch = async ({ number, so_id, refresh = false }) => {
        setLoading(true);
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

            const data = await unifiedFetchSeaRatesData({ number, so_id, refresh });
            if (!data) {
                setLoading(false);
                return;
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
            setUpdateat(data.metadata?.last_updated_date || data.metadata?.updated_at || "");

            const polDateStr = data.dataRoute?.[0]?.pol?.[0]?.date;
            const podDateStr = data.dataRoute?.[0]?.pod?.[0]?.date;
            if (polDateStr && podDateStr) {
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
                    console.warn("⚠️ Invalid date format in dataRoute");
                    setDataProgressPercentage(0);
                }
            } else {
                console.warn("⚠️ Missing pol/pod date in dataRoute");
                setDataProgressPercentage(0);
            }

            let locationNameDeparture = data.locations.find(
                (loc) => loc.location_list_id === data.dataRoute?.[0]?.pol?.[0]?.location
                    || loc.id === data.dataRoute?.[0]?.pol?.[0]?.location
            );
            setDataLocationDeparture(locationNameDeparture?.name || "");

            let locationNameArrive = data.locations.find(
                (loc) => loc.location_list_id === data.dataRoute?.[0]?.pod?.[0]?.location
                    || loc.id === data.dataRoute?.[0]?.pod?.[0]?.location
            );
            setDataLocationArrive(locationNameArrive?.name || "");

            setLoading(false);
            setIsVisible(false);
        } catch (err) {
            console.error("❌ handleDataFetch error:", err);
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
    // ✅ PATCHED UNIFIED FETCH LOGIC ENDS HERE
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

    const markerWhiteIcon = useMemo(() => L.divIcon({
        className: "text-danger shadow-marker",
        html: renderToString(<FaMapMarkerAlt style={{ fontSize: '24px' }} />),
        iconSize: [24, 24],
    }), []);




    const RecenterMap = ({ lat, lng }) => {
        const map = useMap();

        useEffect(() => {
            if (lat && lng) {
                map.setView([lat, lng]);
            }
        }, [lat, lng, map]);

        return null;
    };

    const wrapLongitude = (lng, referenceLng) => {
        while (lng < referenceLng - 180) lng += 360;
        while (lng > referenceLng + 180) lng -= 360;
        return lng;
    };


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


    const [flip, setflip] = useState(false);


    const getBearing = (lat1, lon1, lat2, lon2) => {
        const toRad = deg => deg * (Math.PI / 180);
        const toDeg = rad => rad * (180 / Math.PI);

        const φ1 = toRad(lat1);
        const φ2 = toRad(lat2);
        const Δλ = toRad(lon2 - lon1);

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);
        return (toDeg(θ) + 360) % 360; // Normalize to 0–360°
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
        console.log("dataLocationState", dataLocationState)
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
        <div className="container-fluid px-0 position-relative w-100 h-100 " >

            <div className='position-absolute w-100 top-0 pt-3 start-0  ' >
                <div className="container ps-0 ps-md-0">
                    <div className="row">
                        <div className="col-12 ">
                            <div className="col-md-5  col-9 ps-5">
                                <div className={`card shadow bg - white  ms - 0 mb - 1 px - 2 py - 2 ${admin ? "" : "d-none"} `} style={{ zIndex: "999" }} >
                                    <InputGroup size="md" width="100%" >
                                        <form onSubmit={handleSubmit}>

                                            <InputLeftElement width='4.5rem'>
                                                <Image

                                                    src={`/ image / po.PNG`}
                                                    width="auto"
                                                    height={"30px"}
                                                />

                                                <div
                                                    className={`  ${isVisible ? "fade-slide-down" : "fade-Show-Top"}  ${!containerNameState ? "d-none" : ""} button - map - container d - block position - absolute bg - white shadow - sm px - 2 py - 0 py - 0`}
                                                    style={{ bottom: "-21.5px", zIndex: "999999" }}
                                                    onClick={() => {
                                                        handleToggle()
                                                    }
                                                    }
                                                >
                                                    <BiUpArrow style={{ cursor: 'pointer' }} />
                                                </div>

                                                <div className={` ${isVisible ? "fade-Show-Top" : "fade-slide-down"} ${!containerNameState ? "d-none" : ""} button - map - container d - block position - absolute bg - white shadow - sm px - 2 py - 0 py - 0`}
                                                    style={{ bottom: "-21.5px", zIndex: "999999" }}
                                                    onClick={() => {
                                                        handleToggle()
                                                    }
                                                    }
                                                >
                                                    <BiDownArrow style={{ cursor: 'pointer' }} />
                                                </div>

                                            </InputLeftElement>

                                            <Input
                                                pl='4.5rem'
                                                pr='8rem'
                                                placeholder='Enter Number'
                                                value={dataNumber}
                                                onChange={(e) => setDataNumber(e.target.value)}
                                            />

                                            <InputRightElement width='4.5rem' className="d-flex justify-content-end position-relatives"

                                            >
                                                <IconButton
                                                    className={dataNumber.trim() === "" ? "d-none" : "me-1"}
                                                    onClick={() => {
                                                        setDataNumber("")
                                                        setContainerName("");
                                                        setLoading(false)
                                                    }}
                                                    colorScheme='blackAlpha'
                                                    variant="ghost"
                                                    aria-label='Search database'
                                                    icon={<FaX />}
                                                    size="sm"
                                                />
                                                <IconButton
                                                    colorScheme='blue'
                                                    aria-label='Search database'
                                                    icon={<FaSearch />}
                                                    size="sm"
                                                    type="submit"
                                                />


                                            </InputRightElement>
                                        </form>
                                    </InputGroup>
                                </div>
                            </div>
                        </div>

                        {!containerNameState && loading &&
                            <div className="col-12 ">
                                <div className="col-md-5 col-8 ps-5">
                                    <div className="card shadow bg-white  ms-0  px-2 py-2" style={{ zIndex: "999", fontSize: "12px" }}>
                                        <div className="card  w-100 shadow p-3  bg-white rounded" style={{ maxWidth: " 600px", maxHeight: "85vh", margin: "auto" }}>
                                            <div className="d-flex justify-content-center w-100">
                                                <Spinner
                                                    color="blue"
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        }

                        {containerNameState &&
                            <div className="col-12 ">
                                <div className="col-md-5 col-9 ps-5">
                                    <div className={` ${isVisible ? "fade-slide-down" : "fade-Show-Top"} card shadow bg - white  ms - 0  px - 2 py - 2 `}
                                        style={{ zIndex: "800", fontSize: "12px" }}



                                    >
                                        <div className="card w-100 shadow p-3  bg-white rounded" style={{ maxWidth: " 600px", maxHeight: "85vh", margin: "auto" }}>
                                            <Box borderWidth="1px" borderRadius="md" px={4} pt="2" bg="white" boxShadow="md">
                                                <Flex direction="column" gap="0" mb="0" p="0" className={containerNameState === "undefined" || !containerNameState ? "d-none" : ""}>
                                                    <Flex justify="space-between" lineHeight="1" align="center" my="0" p="0">
                                                        <Text fontSize="sm" fontWeight="bold">{containerNameState}</Text>
                                                        <Badge colorScheme="blue" mt="-4">{containerStatusState}</Badge>
                                                    </Flex>

                                                    <Flex my="0" p="0" lineHeight="0" >
                                                        <Text fontSize="sm">{orderSealineState}</Text>

                                                    </Flex>
                                                    <Flex my="0" p="0" mt="1" lineHeight="0" >
                                                        <Text fontSize="sm">{orderSOIDState}</Text>

                                                    </Flex>

                                                </Flex>

                                                <Flex direction="column" gap="0" mb="0" p="0" className={containerNameState === "undefined" || !containerNameState ? "" : "d-none"}>
                                                    <Flex justify="center" align="center" mt="3" mb="2" p="0">
                                                        <Text fontSize="sm" fontWeight="bold">

                                                            No Data Found with the current search number

                                                        </Text>
                                                    </Flex>

                                                </Flex>


                                                {/* Ship line section */}
                                                <Flex align="center" mt="2" justify="space-between" position="relative" mb={2} className={containerNameState === "undefined" || !containerNameState ? "d-none" : ""}>
                                                    {/* Start icon */}
                                                    <Icon as={GiCargoShip} boxSize={4} color="pink.400" />

                                                    {/* Line with middle dot */}
                                                    <Box flex="1" mx={2} position="relative">
                                                        {/* Progress line */}
                                                        <Box
                                                            height="2px"
                                                            bg="gray.200"
                                                            width="100%"
                                                            position="absolute"
                                                            top="50%"
                                                            transform="translateY(-50%)"
                                                        />
                                                        <Box
                                                            height="2px"
                                                            bg="pink.400"
                                                            width={`${dataProgressPercentage}% `}
                                                            position="absolute"
                                                            top="50%"
                                                            transform="translateY(-50%)"
                                                            borderRadius="full"
                                                        />
                                                        {/* Progress dot */}
                                                        <Box
                                                            position="absolute"
                                                            left={`calc(${dataProgressPercentage}% - 6px)`}
                                                            top="50%"
                                                            transform="translateY(-50%)"
                                                            bg="white"
                                                            border="2px solid #3182ce"
                                                            borderRadius="full"
                                                            boxSize={4}
                                                            zIndex={2}
                                                            transition="left 0.3s ease"
                                                        />

                                                    </Box>

                                                    {/* End icon */}
                                                    <Icon as={LuWarehouse} boxSize={4} color="gray.500" />
                                                </Flex>

                                                {/* Location Info */}
                                                <Flex justify="space-between" mb="0" align="center" className={containerNameState === "undefined" || !containerNameState ? "d-none" : ""}>
                                                    <Box mb="0">
                                                        <Text fontWeight="semibold" className="text-start" fontSize="sm" mb="1">{dataLocationDeparture || 'TBA'}</Text>
                                                        <Text fontSize="xs" color="gray.500" className="text-start">{formatDate(dataTimeDeparture)}</Text>
                                                    </Box>
                                                    <Text mb="1">➡️</Text>
                                                    <Box textAlign="right" mb="0">
                                                        <Text mb="1" fontWeight="semibold" className="text-end" fontSize="sm">{dataLocationArrive || 'TBA'}</Text>
                                                        <Text mb="1" fontSize="xs" color="gray.500" className="text-end">{formatDate(dataTimeArrive)}</Text>
                                                    </Box>
                                                </Flex>
                                            </Box>

                                            <Tabs className={containerNameState === "undefined" || !containerNameState ? "d-none" : ""}>
                                                <TabList >
                                                    <Tab style={{ fontSize: "12px" }}>Route </Tab>
                                                    <Tab style={{ fontSize: "12px" }}>Vessel</Tab>
                                                    <Tab className={dataContainerState.length > 0 ? "" : "d-none"} style={{ fontSize: "12px" }}>Container</Tab>
                                                    {admin && <Tab style={{ fontSize: "12px" }}>Log Data</Tab>}
                                                </TabList>

                                                <TabPanels >
                                                    <TabPanel  >
                                                        <Stack spacing={6} pl={6} borderLeft="2px solid" borderColor="gray.300" className="py-3" style={{ maxHeight: "150px", overflow: "auto" }}>
                                                            {steps.map((step, index) => (
                                                                <Box key={index} position="relative" pl={-1} ml={0}  >
                                                                    <Circle
                                                                        size="3"
                                                                        bg="blue.500"
                                                                        position="absolute"
                                                                        left="-15.5"
                                                                        top="1"
                                                                        zIndex="999"
                                                                    />
                                                                    <VStack align="start" spacing={1} pl={2}>
                                                                        <Text mb="1" fontWeight="bold">{step.location}</Text>
                                                                        {step.events
                                                                            .filter(event => event.actual !== 0)
                                                                            .map((event, idx) => (
                                                                                <Flex key={idx} justify="space-between" w="100%" align="start">
                                                                                    <Text fontSize="sm" mb="0" className="text-start" flex="1" pr="4" noOfLines={2} wordBreak="break-word">
                                                                                        {event.description}
                                                                                    </Text>
                                                                                    <Text fontSize="sm" mb="0" pe="2" className="text-end" color="gray.500" whiteSpace="nowrap">
                                                                                        {formatDate(event.date)}
                                                                                    </Text>
                                                                                </Flex>

                                                                            ))}
                                                                    </VStack>
                                                                </Box>
                                                            ))}
                                                        </Stack>
                                                    </TabPanel>
                                                    <TabPanel>
                                                        <div className="container-fluid px-0" style={{ maxHeight: "150px", overflow: "auto" }}>
                                                            {dataVesselState.map((vessel, idx) => {
                                                                const voyage = vessel.voyage || "N/A";  // Default to "N/A" if voyage is missing

                                                                // Example: Fetch or get vessel details by using the index or other methods here
                                                                let data
                                                                if (vessel.imo) {
                                                                    data = getVesselDetails(vessel.vessel_id);
                                                                }
                                                                return (
                                                                    <div key={idx} className="card shadow-sm my-2 text-start bg-white pt-2 pb-4 px-2">
                                                                        <div className="container">
                                                                            <div className="row">



                                                                                {vessel.name &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            Vessel
                                                                                        </div>
                                                                                        <div className="col-auto">
                                                                                            {vessel.name}
                                                                                        </div>
                                                                                    </div>
                                                                                }

                                                                                {vessel.imo &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            Voyage
                                                                                        </div>
                                                                                        <div className="col-auto">
                                                                                            {vessel.imo && data?.voyage ? data.voyage : "N/A"}
                                                                                        </div>
                                                                                    </div>
                                                                                }

                                                                                {vessel.imo &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            Loading
                                                                                        </div>
                                                                                        <div className="col-auto">
                                                                                            {vessel.imo && data?.locationStart ? data.locationStart : "N/A"}
                                                                                        </div>
                                                                                    </div>
                                                                                }

                                                                                {vessel.imo &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            Discharge
                                                                                        </div>
                                                                                        <div className="col-auto">

                                                                                            {vessel.imo && data?.locationEnd ? data.locationEnd : "N/A"}

                                                                                        </div>
                                                                                    </div>
                                                                                }

                                                                                {vessel.imo &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            ETD
                                                                                        </div>
                                                                                        <div className="col-auto">

                                                                                            {vessel.imo && data?.ETD ? formatDate(data.ETD) : "N/A"}

                                                                                        </div>
                                                                                    </div>
                                                                                }

                                                                                {vessel.imo &&
                                                                                    <div className="d-flex mt-1 justify-content-between">
                                                                                        <div className="col-4 fw-bold">
                                                                                            ETA
                                                                                        </div>
                                                                                        <div className="col-auto">

                                                                                            {vessel.imo && data?.ETA ? formatDate(data.ETA) : "N/A"}
                                                                                        </div>
                                                                                    </div>
                                                                                }



                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                        </div>
                                                    </TabPanel>
                                                    <TabPanel>
                                                        <div className="container-fluid px-0" style={{ maxHeight: "150px", overflow: "auto" }}>
                                                            {dataContainerState.map((data, idx) => {
                                                                return (
                                                                    <div key={idx} className="card shadow-sm my-2 text-start bg-white pt-2 pb-4 px-2">
                                                                        <div className="container">
                                                                            <div className="row">

                                                                                <div className="col-12 fw-bold mb-2">
                                                                                    Container {idx + 1}
                                                                                </div>

                                                                                <div className="col-3 mt-2 fw-bold">
                                                                                    Number
                                                                                </div>
                                                                                <div className="col-9 mt-2">
                                                                                    {data.container_number || data.number || "N/A"}
                                                                                </div>
                                                                                {data.size_type &&
                                                                                    <>
                                                                                        <div className="col-3 fw-bold">
                                                                                            Size
                                                                                        </div>
                                                                                        <div className="col-9">
                                                                                            {data.size_type}
                                                                                        </div>
                                                                                    </>
                                                                                }

                                                                                <div className="col-3 fw-bold">
                                                                                    Status
                                                                                </div>
                                                                                <div className="col-9">
                                                                                    {data.container_status || data.status || "N/A"}
                                                                                </div>

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </TabPanel>

                                                    <TabPanel>
                                                        <div className="container-fluid px-0" style={{ maxHeight: "150px", overflow: "auto" }}>

                                                            <div className="card shadow-sm my-2 text-start bg-white pt-2 pb-2 px-2">
                                                                <div className="container">
                                                                    <div className="row">
                                                                        <div className="col-10">

                                                                            <div className="row">

                                                                                <div className="col-md-7 col-lg-5 col-12 col-sm-12 col-xl-12 fw-bold ">
                                                                                    Last Update
                                                                                </div>

                                                                                <div className="col-md-3 col-lg-7 col-12 col-sm-12 col-xl-12 ">
                                                                                    {

                                                                                        new Date(updateat).toLocaleString("en-GB", {
                                                                                            year: "numeric",
                                                                                            month: "2-digit",
                                                                                            day: "2-digit",
                                                                                            hour: "2-digit",
                                                                                            minute: "2-digit",
                                                                                            second: "2-digit",
                                                                                        })



                                                                                    }
                                                                                </div>

                                                                            </div>

                                                                        </div>
                                                                        <div className="col-2">

                                                                            {containerStatusState !== "DELIVERED" &&
                                                                                <div className="d-flex justify-content-end">
                                                                                    <Tooltip
                                                                                        label=" 
                                                                                                Refresh button, functional only after 5 hours from last update
                                                                                                "
                                                                                        hasArrow
                                                                                        className="d-flex justify-content-center text-center"
                                                                                        arrowSize={15}
                                                                                    >
                                                                                        <IconButton
                                                                                            onClick={handleRefresh}
                                                                                            className="pointer" variant="outline" colorScheme="green" icon={<BiRefresh className="pointer" />}>
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                </div>
                                                                            }

                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>


                                                        </div>
                                                    </TabPanel>

                                                </TabPanels>
                                            </Tabs>

                                        </div>

                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>

            </div>

            <div className="row  px-0" style={{ maxHeight: "100vh", maxWidth: "100vw", height: "100vw", width: "100vw", minWidth: "400px", minHeight: "400px" }} >
                <div className=" col-12 px-0 py-0  h-100 w-100 "   >
                    <MapContainer
                        className="rounded petaindofood"

                        center={
                            dataPinLocation?.[0]
                                ? [dataPinLocation[0].longitude, dataPinLocation[0].latitude]
                                : (
                                    Array.isArray(dataPinLocationState?.[0])
                                        ? dataPinLocationState[0] // [longitude, latitude]
                                        : (dataPinLocationState?.[0]?.longitude != null && dataPinLocationState?.[0]?.latitude != null
                                            ? [
                                                dataPinLocationState[0].longitude,
                                                wrapLongitude(dataPinLocationState[0].latitude, 106.8333)
                                            ]
                                            : [-6.21462, 106.84513]
                                        )
                                )
                        }




                        minZoom={2}
                        zoom={4}
                        maxZoom={6}

                        id="mapid"
                        style={{ height: '100%', width: '100%' }}
                    >


                        <RecenterMap
                            lat={
                                dataPinLocation?.[0]
                                    ? dataPinLocation[0].latitude  // Correcting to use latitude for lat
                                    : dataPinLocationState?.[0]
                                        ? dataPinLocationState[0].latitude  // Correcting to use latitude for lat
                                        : -6.21462  // Default latitude value
                            }
                            lng={
                                dataPinLocation?.[0]
                                    ? dataPinLocation[0].longitude  // Correctly using longitude for lng
                                    : dataPinLocationState?.[0]
                                        ? wrapLongitude(dataPinLocationState[0].longitude, 106.8333)  // Applying wrapLongitude to longitude
                                        : 106.84513  // Default longitude value
                            }
                        />

                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />



                        <LayerGroup>
                            {dataLocation && dataLocation.map((location, idx) => {
                                if (
                                    !location ||
                                    location.lat == null ||
                                    location.lng == null
                                ) return null;

                                return (
                                    <Marker
                                        key={idx}
                                        position={[location.lat, wrapLongitude(location.lng, 106.8333)]}
                                        icon={markerWhiteIcon}
                                    />
                                );
                            })}

                            {locationPath && dataLocationState && locationPath.map((id, idx) => {
                                const location = dataLocationState.find(
                                    loc => (loc.location_list_id ?? loc.id) === id
                                );

                                // Exclude if location or lat/lng is null/undefined
                                if (
                                    !location ||
                                    location.lat == null ||
                                    location.lng == null
                                ) return null;

                                return (
                                    <Marker
                                        key={idx}
                                        position={[location.lat, wrapLongitude(location.lng, 106.8333)]}
                                        icon={markerWhiteIcon}
                                    />
                                );
                            })}




                        </LayerGroup>


                        {fullRoute.map((point, idx) => {
                            const next = fullRoute[idx + 1];
                            if (!next) return null;

                            return (
                                <>
                                    <Polyline
                                        key={`route - ${idx} `}
                                        positions={[
                                            [point.lat, wrapLongitude(point.lng, 106.8333)],
                                            [next.lat, wrapLongitude(next.lng, 106.8333)]
                                        ]}
                                        pathOptions={{
                                            color: 'gray',
                                            weight: 5,
                                            opacity: 1,
                                            dashArray: '4, 6', // ← This makes it dotted/dashed
                                            lineCap: 'round',
                                        }}
                                    />
                                    <Polyline
                                        key={`route - black - ${idx} `}
                                        positions={[
                                            [point.lat, wrapLongitude(point.lng, 106.8333)],
                                            [next.lat, wrapLongitude(next.lng, 106.8333)]
                                        ]}
                                        pathOptions={{
                                            color: 'white',
                                            weight: 2,
                                            lineCap: 'round',
                                            dashArray: '4, 6', // ← This makes it dotted/dashed
                                        }}
                                    />
                                </>
                            );
                        })}

                        <Marker
                            position={
                                dataPinLocation?.[0]?.longitude != null && dataPinLocation?.[0]?.latitude != null
                                    ? [dataPinLocation[0].latitude, wrapLongitude(dataPinLocation[0].longitude, 106.8333)]
                                    : Array.isArray(dataPinLocationState) && dataPinLocationState.length === 2 &&
                                        typeof dataPinLocationState[0] === 'number' && typeof dataPinLocationState[1] === 'number'
                                        ? dataPinLocationState // It’s [longitude, latitude]
                                        : dataPinLocationState?.[0]?.longitude != null && dataPinLocationState?.[0]?.latitude != null
                                            ? [dataPinLocationState[0].latitude, wrapLongitude(dataPinLocationState[0].longitude, 106.8333)]
                                            : [-6.21462, 106.84513] // fallback
                            }

                            icon={markerIcon}
                        />



                    </MapContainer>

                </div>

            </div>
        </div >
    );
}

export default ContainerTracking;
