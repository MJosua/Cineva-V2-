import { useParams } from "react-router-dom";
import { Box, Spinner, Center, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getPublicCampaign } from "../../services/eventEngineApi";
import EngineRenderer from "../../components/Engine/EngineRenderer";

export default function EnginePage() {
    const { slug } = useParams();
    const [eventData, setEventData] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function loadEvent() {
            try {
                const data = await getPublicCampaign(slug);
                if (data) {
                    setEventData(data);
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error("Failed to load event:", e);
                setNotFound(true);
            }
        }
        loadEvent();
    }, [slug]);

    if (notFound) {
        return (
            <Center h="100vh">
                <Heading>Event Not Found</Heading>
            </Center>
        )
    }

    if (!eventData) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="brand.500" />
            </Center>
        )
    }

    return (
        <EngineRenderer eventData={eventData} />
    );
}

