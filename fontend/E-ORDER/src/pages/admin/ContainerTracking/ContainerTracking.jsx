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
import {
    normalizeContainerTrackingData,
    calculateProgress,
    findLocationName
} from "../../../utils/containerTrackingNormalizer";

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
    const [orderedLocationsState, setOrderedLocations] = useState([])
    const [loading, setLoading] = useState(false)

    // ==========================================================
    // ✅ PATCHED UNIFIED FETCH LOGIC STARTS HERE
    // ==========================================================
    const unifiedFetchSeaRatesData = async ({ number, so_id, refresh = false }) => {
        const url = `${API_URL}/searates/searatesTrackByNumber/${number}${so_id ? `/${so_id}` : ``}${refresh ? `?refresh=true` : ``}`;

        try {
            const res = await axios.get(url);

            // Determine the source of data
            // Backend returns: array (cached data) or { data: { data: {...} } } (SeaRates proxy)
            const containerData = Array.isArray(res.data) ? res.data[0] : null;
            const searatesData = res.data?.data?.data || res.data?.data || null;
            const rawData = containerData || searatesData;

            if (!rawData) {
                console.warn("⚠️ No valid data structure found in response");
                return null;
            }

            // Log the source for debugging
            if (containerData) {
                console.log("📦 Data from backend (cached):", containerData);
            } else {
                console.log("🌐 Data from SeaRates API:", searatesData);
            }

            // Use the normalizer to ensure consistent data structure
            const normalized = normalizeContainerTrackingData(rawData);

            if (!normalized) {
                console.warn("⚠️ Normalization failed");
                return null;
            }

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

            // Set core data from normalized result
            setDataContainer(data.containers || []);
            setContainerName(data.containers?.[0]?.container_number || data.metadata?.number || "");
            setoOrderSOIDState(data.containers?.[0]?.so_id || "");
            setDataLocation(data.locations || []);
            // Use orderedLocations for correct map route sequence
            setOrderedLocations(data.orderedLocations || data.locations || []);
            setDataEvent(data.events || []);
            setContainerStatus(data.containers?.[0]?.container_status || data.metadata?.status || "");
            setDataPinLocation(data.pin_location || {});
            setDataRoute(data.dataRoute || []);
            setoOrderSealineState(data.containers?.[0]?.sealine_name || data.metadata?.sealine_name || "");
            setDataVessel(data.vessels || []);
            setUpdateat(data.metadata?.last_updated_date || data.metadata?.updated_at || "");

            // Use pre-computed ETD/ETA from normalizer (handles both data sources)
            setDataTimeDeparture(data.etd || "");
            setDataTimeArrive(data.eta || "");

            // Use pre-computed departure/arrival locations from normalizer
            setDataLocationDeparture(data.departureLocation || "");
            setDataLocationArrive(data.arrivalLocation || "");

            // Calculate progress using the normalizer utility
            const progressPercentage = calculateProgress(data.etd, data.eta);
            setDataProgressPercentage(progressPercentage);

            console.log("✅ Data loaded successfully:", {
                source: data._source,
                etd: data.etd,
                eta: data.eta,
                departureLocation: data.departureLocation,
                arrivalLocation: data.arrivalLocation,
                progress: progressPercentage,
                pin_location: data.pin_location,
            });

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
        // Use so_id from state if URL param is undefined to prevent duplicate rows
        const effectiveSoId = so_id || orderSOIDState || "0";
        await handleDataFetch({ number: dataNumber || number, so_id: effectiveSoId, refresh: true });
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
        // Use dataEventState which contains normalized events
        const events = dataEventState || [];
        if (!events || events.length === 0) {
            return {};
        }

        // Group events by location_id (normalized data always has location_id)
        const grouped = events.reduce((acc, curr) => {
            // Use location_id which is present in normalized data from both sources
            const locId = (curr.location_id ?? curr.location ?? 0).toString();
            acc[locId] = acc[locId] || [];
            acc[locId].push(curr);
            return acc;
        }, {});

        // Sort each group by order_id
        Object.values(grouped).forEach(events => {
            events.sort((a, b) => (a.order_id || 0) - (b.order_id || 0));
        });

        return grouped;
    }, [dataEventState]);

    const steps = useMemo(() => {
        if (!groupedData || Object.keys(groupedData).length === 0) {
            return [];
        }

        // Use dataLocationState which contains normalized locations
        const locations = dataLocationState || [];

        // Helper to find location by any ID format (handles normalized data)
        const findLocationName = (locId) => {
            const id = parseInt(locId);
            const loc = locations.find(l =>
                l.location_id === id ||
                l.location_list_id === id ||
                l.id === id
            );
            return loc?.name || 'Unknown';
        };

        return Object.entries(groupedData)
            .filter(([locationId]) => parseInt(locationId) !== 0) // Filter out invalid location IDs
            .map(([locationId, events]) => ({
                location: findLocationName(locationId),
                events,
            }))
            .sort((a, b) => (a.events[0]?.order_id || 0) - (b.events[0]?.order_id || 0));
    }, [groupedData, dataLocationState]);


    // Use orderedLocations for correct map route - derived from events' order_id
    // This fixes the issue where backend location IDs don't match the route order
    const locationPath = useMemo(() => {
        // If orderedLocations is available, use it directly (already in correct order)
        if (orderedLocationsState && orderedLocationsState.length > 0) {
            return orderedLocationsState.map(loc =>
                loc.location_id ?? loc.location_list_id ?? loc.id
            ).filter(id => id !== null && id !== undefined);
        }

        // Fallback to deriving from steps
        return steps
            .map(step => {
                const matchingLocation = dataLocationState?.find(
                    loc => loc.name === step.location
                );
                return matchingLocation
                    ? (matchingLocation.location_id ?? matchingLocation.location_list_id ?? matchingLocation.id)
                    : null;
            })
            .filter(id => id !== null && id !== undefined);
    }, [orderedLocationsState, steps, dataLocationState]);



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

        // Handle different pin_location formats:
        // 1. Normalized object format: { lat, lng } (from normalizer)
        // 2. Array format: [lat, lng] (from SeaRates route_data.pin)
        // 3. Legacy array with object: [{ latitude, longitude }]
        if (
            dataPinLocationState &&
            typeof dataPinLocationState === 'object' &&
            !Array.isArray(dataPinLocationState) &&
            dataPinLocationState.lat != null &&
            dataPinLocationState.lng != null
        ) {
            // Normalized object format: { lat, lng }
            pin = [dataPinLocationState.lat, dataPinLocationState.lng];
            console.log("📍 Using pin from normalized object:", pin);
        } else if (
            Array.isArray(dataPinLocationState) &&
            dataPinLocationState.length === 2 &&
            typeof dataPinLocationState[0] === 'number' &&
            typeof dataPinLocationState[1] === 'number'
        ) {
            // Direct array format: [lat, lng]
            pin = dataPinLocationState;
            console.log("📍 Using pin from array:", pin);
        } else if (
            Array.isArray(dataPinLocationState) &&
            dataPinLocationState.length === 1 &&
            dataPinLocationState[0]?.longitude != null &&
            dataPinLocationState[0]?.latitude != null
        ) {
            // Legacy array with object format
            pin = [dataPinLocationState[0].latitude, dataPinLocationState[0].longitude];
            console.log("📍 Using pin from legacy format:", pin);
        } else {
            // Fallback to default Jakarta coordinates
            pin = [-6.21462, 106.84513];
            console.warn("⚠️ No valid pin location, using default Jakarta:", dataPinLocationState);
        }


        const currentLoc = {
            name: 'Current',
            lat: pin[0],
            lng: pin[1],
            isPin: true,
        };

        // Step 1: Get valid route points using orderedLocationsState for correct order
        // Use orderedLocationsState first as it has the correct route sequence
        const locationsToUse = orderedLocationsState.length > 0 ? orderedLocationsState : dataLocationState;

        const routePoints = locationPath
            .map(id =>
                locationsToUse.find(loc =>
                    (loc?.location_id === id || loc?.location_list_id === id || loc?.id === id) &&
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

        console.log("🗺️ Full route built:", {
            totalPoints: routeWithCurrent.length,
            routeNames: routeWithCurrent.map(p => p.name || 'Unknown'),
            currentLocation: currentLoc,
            routePoints: routePoints.map(p => p.name),
        });

        return routeWithCurrent;
    }, [orderedLocationsState, dataLocationState, dataPinLocationState, locationPath]);


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
        // Filter events by vessel_id or vessel (normalized data supports both)
        const vesselEvents = dataEventState.filter(event =>
            event.vessel_id === vesselId || event.vessel === vesselId
        );

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

        const sortedEventsFirst = [...vesselEvents].sort((a, b) => new Date(a.date) - new Date(b.date));
        const firstVesselEvent = sortedEventsFirst[0];
        const latestEvent = sortedEventsFirst[sortedEventsFirst.length - 1];

        // Helper to find location by any ID format (works with normalized data)
        const findLocation = (locId) => dataLocationState.find(loc =>
            loc.location_list_id === locId ||
            loc.location_id === locId ||
            loc.id === locId
        );

        // Get location ID from event (normalized data has both location_id and location)
        const startLocId = firstVesselEvent.location_id ?? firstVesselEvent.location;
        const endLocId = latestEvent.location_id ?? latestEvent.location;

        const locationStart = findLocation(startLocId);
        const locationEnd = findLocation(endLocId);

        const vesselDetails = {
            voyage: firstVesselEvent.voyage || "N/A",
            locationStart: locationStart?.name || "Unknown",
            locationEnd: locationEnd?.name || "Unknown",
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
                                                                        {step.events.map((event, idx) => (
                                                                            <Flex key={idx} justify="space-between" w="100%" align="start">
                                                                                <Text
                                                                                    fontSize="sm"
                                                                                    mb="0"
                                                                                    flex="1"
                                                                                    className="text-start"
                                                                                    pr="4"
                                                                                    noOfLines={2}
                                                                                    wordBreak="break-word"
                                                                                    style={{
                                                                                        color: event.actual === 1 ? "#1A202C" : "#718096", // dark vs soft gray
                                                                                        fontWeight: event.actual === 1 ? 500 : 400,
                                                                                    }}
                                                                                >
                                                                                    {event.description}
                                                                                </Text>

                                                                                <Text
                                                                                    fontSize="sm"
                                                                                    mb="0"
                                                                                    pe="2"
                                                                                    whiteSpace="nowrap"
                                                                                    style={{
                                                                                        color: event.actual === 1 ? "#4A5568" : "#A0AEC0",
                                                                                    }}
                                                                                >
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
                                                                const voyage = vessel.call_sign || "N/A";  // Default to "N/A" if voyage is missing

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
                                                                                            Voyage as
                                                                                        </div>
                                                                                        <div className="col-auto">
                                                                                            {vessel.imo && vessel?.voyage ? vessel.voyage : "N/A"}
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
                            // Handle normalized object format: { lat, lng }
                            dataPinLocationState &&
                                typeof dataPinLocationState === 'object' &&
                                !Array.isArray(dataPinLocationState) &&
                                dataPinLocationState.lat != null &&
                                dataPinLocationState.lng != null
                                ? [dataPinLocationState.lat, wrapLongitude(dataPinLocationState.lng, 106.8333)]
                                // Handle array format: [lat, lng]
                                : Array.isArray(dataPinLocationState) &&
                                    dataPinLocationState.length === 2 &&
                                    typeof dataPinLocationState[0] === 'number'
                                    ? [dataPinLocationState[0], wrapLongitude(dataPinLocationState[1], 106.8333)]
                                    // Fallback to Jakarta
                                    : [-6.21462, 106.84513]
                        }

                        minZoom={2}
                        zoom={4}
                        maxZoom={6}

                        id="mapid"
                        style={{ height: '100%', width: '100%' }}
                    >


                        <RecenterMap
                            lat={
                                // Handle normalized object format: { lat, lng }
                                dataPinLocationState &&
                                    typeof dataPinLocationState === 'object' &&
                                    !Array.isArray(dataPinLocationState) &&
                                    dataPinLocationState.lat != null
                                    ? dataPinLocationState.lat
                                    // Handle array format: [lat, lng]
                                    : Array.isArray(dataPinLocationState) &&
                                        dataPinLocationState.length === 2 &&
                                        typeof dataPinLocationState[0] === 'number'
                                        ? dataPinLocationState[0]
                                        // Fallback to Jakarta
                                        : -6.21462
                            }
                            lng={
                                // Handle normalized object format: { lat, lng }
                                dataPinLocationState &&
                                    typeof dataPinLocationState === 'object' &&
                                    !Array.isArray(dataPinLocationState) &&
                                    dataPinLocationState.lng != null
                                    ? wrapLongitude(dataPinLocationState.lng, 106.8333)
                                    // Handle array format: [lat, lng]
                                    : Array.isArray(dataPinLocationState) &&
                                        dataPinLocationState.length === 2 &&
                                        typeof dataPinLocationState[1] === 'number'
                                        ? wrapLongitude(dataPinLocationState[1], 106.8333)
                                        // Fallback to Jakarta
                                        : 106.84513
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
                                <React.Fragment key={`route-fragment-${idx}`}>
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
                                </React.Fragment>
                            );
                        })}

                        <Marker
                            position={
                                // Handle normalized object format: { lat, lng }
                                dataPinLocationState &&
                                    typeof dataPinLocationState === 'object' &&
                                    !Array.isArray(dataPinLocationState) &&
                                    dataPinLocationState.lat != null &&
                                    dataPinLocationState.lng != null
                                    ? [dataPinLocationState.lat, wrapLongitude(dataPinLocationState.lng, 106.8333)]
                                    // Handle array format: [lat, lng]
                                    : Array.isArray(dataPinLocationState) &&
                                        dataPinLocationState.length === 2 &&
                                        typeof dataPinLocationState[0] === 'number'
                                        ? [dataPinLocationState[0], wrapLongitude(dataPinLocationState[1], 106.8333)]
                                        // Handle legacy array with object format
                                        : dataPinLocationState?.[0]?.latitude != null &&
                                            dataPinLocationState?.[0]?.longitude != null
                                            ? [dataPinLocationState[0].latitude, wrapLongitude(dataPinLocationState[0].longitude, 106.8333)]
                                            // Fallback to Jakarta
                                            : [-6.21462, 106.84513]
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
