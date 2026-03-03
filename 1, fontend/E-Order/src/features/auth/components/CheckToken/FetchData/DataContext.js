import { createContext, useContext, useEffect, useState } from "react";
import { getBannerData, getContainers, getFlavours, getFlavoursTrucking, getOtherParties, getPorts, getShipToParties, getStuffingDate, getStuffingWeek, getTOP } from "../../../../../action/reqAction";
import { useToast } from "@chakra-ui/react";

const DataContext = createContext();

export const DataProvider = ({
    children,
    token,
    updateSession,
}) => {
    const [flavours, setFlavours] = useState([]);
    const [flavoursTrucking, setFlavoursTrucking] = useState([])
    const [ports, setPorts] = useState([]);
    const [shipToParties, setShipToParties] = useState([]);
    const [container, setContainer] = useState([])
    const [ostp, setOstp] = useState([])
    const [stuffingWeeksList, setSstuffingWeeks] = useState([])
    const [stuffingDateList, setSstuffingData] = useState([])
    const [bannerList, setBannerList] = useState([])
    const [TOP, setTOP] = useState([])


    const [globalLoading, setGlobalLoading] = useState(true)

    const [tokenOne, setTokenOne] = useState(token)


    useEffect(() => {
        if (!token) {
            console.log("no token")
            return;
        } else {
        }  // Don't fetch without token
        const latestToken = localStorage.getItem("tokek"); // Ensure latest token

        const fetchAllData = async () => {

            try {
                const results = await Promise.allSettled([
                    getFlavours(latestToken),
                    getFlavoursTrucking(latestToken),
                    getPorts(latestToken),
                    getShipToParties(latestToken),
                    getContainers(latestToken),
                    getOtherParties(latestToken),
                    getStuffingWeek(latestToken),
                    getStuffingDate(latestToken),
                    getBannerData(latestToken),
                    getTOP(latestToken),
                ]);

                const [
                    flavoursRes,
                    flavourResTrukcing,
                    portsRes,
                    shipToPartiesRes,
                    containerRes,
                    ostpRes,
                    stuffingWeeksRes,
                    stuffingDateRes,
                    bannerRes,
                    topRes,
                ] = results;

                // Flavours
                if (flavoursRes.status === "fulfilled") {
                    setFlavours(flavoursRes.value.data);

                    console.log("Flavours data fetched:", flavoursRes.value.data);
                }

                // Flavours trucking
                if (flavourResTrukcing.status === "fulfilled") {
                    setFlavoursTrucking(flavourResTrukcing.value.data);
                }

                // Ports
                if (portsRes.status === "fulfilled") {
                    setPorts(portsRes.value.data);
                }

                // Ship to parties
                if (shipToPartiesRes.status === "fulfilled") {
                    setShipToParties(shipToPartiesRes.value.data);
                }

                // Containers
                if (containerRes.status === "fulfilled") {
                    setContainer(containerRes.value.data);
                }

                // OSTP
                if (ostpRes.status === "fulfilled") {
                    setOstp(ostpRes.value.data);
                }

                // Stuffing Weeks
                if (stuffingWeeksRes.status === "fulfilled") {
                    setSstuffingWeeks(stuffingWeeksRes.value.data);
                }

                // Stuffing Dates
                if (stuffingDateRes.status === "fulfilled") {
                    setSstuffingData(stuffingDateRes.value.data);
                }

                // Banner
                if (bannerRes.status === "fulfilled") {
                    setBannerList(bannerRes.value.data);
                }

                // TOP
                if (topRes.status === "fulfilled") {
                    setTOP(topRes.value.data);
                }

            } catch (error) {
                console.error("Unexpected error:", error);
            }

        };


        fetchAllData();



    }, [updateSession]); // Re-fetch when token updates

    const toast = useToast();

    useEffect(() => {

        const allDataLoaded =
            ports.length > 0 &&
            shipToParties.length > 0 &&
            container.length > 0

        if (allDataLoaded) {
            setGlobalLoading(false);


        }
    }, [
        ports,
        shipToParties,
        container,
    ])



    return (
        <DataContext.Provider value={{
            flavours,
            ports,
            shipToParties,
            flavoursTrucking,
            container,
            ostp,
            stuffingWeeksList,
            stuffingDateList,
            bannerList,
            TOP,
            globalLoading,
            tokenOne
        }}>
            {children}
        </DataContext.Provider>
    );
};

// Custom Hook for easier access
export const useData = () => useContext(DataContext);




