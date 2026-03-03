import { useParams } from "react-router-dom";
import { Box, Spinner, Center, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { getPublicCampaign } from "../../services/eventEngineApi";
import EngineRenderer from "../../components/Engine/EngineRenderer";

export default function EnginePage() {
    const params = useParams();
    const slug = params.slug;
    const subpath = params["*"]; // catches anything after /:slug/

    // Determine the current route key. If empty, it's "/"
    const currentRoute = subpath ? `/${subpath}` : "/";

    const [eventData, setEventData] = useState(null);
    const [pageBlocks, setPageBlocks] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function loadEvent() {
            try {
                const data = await getPublicCampaign(slug);
                if (data) {
                    setEventData(data);

                    let pageConfig = {};
                    let metaConfig = {};
                    if (data.block_schema?.pages) {
                        pageConfig = data.block_schema.pages;
                    } else if (data.blocks?.pages) {
                        pageConfig = data.blocks.pages;
                    } else if (Array.isArray(data.block_schema)) {
                        pageConfig = { "/": data.block_schema };
                    } else {
                        pageConfig = { "/": data.blocks || [] };
                    }

                    if (data.block_schema?.pages_meta) {
                        metaConfig = data.block_schema.pages_meta;
                    } else if (data.blocks?.pages_meta) {
                        metaConfig = data.blocks.pages_meta;
                    }

                    // ── Smart page lookup ─────────────────────────────────────────
                    // Try exact match first, then progressively strip trailing segments.
                    // e.g. "/coupon/IPL336Z" → try "/coupon/IPL336Z", then "/coupon", then "/"
                    // This allows extra URL segments to carry coupon codes without
                    // needing a separate page entry per code.
                    const segments = currentRoute.split("/").filter(Boolean);
                    let matchedRoute = null;
                    let trailingCode = null;

                    for (let i = segments.length; i >= 0; i--) {
                        const candidate = i === 0 ? "/" : "/" + segments.slice(0, i).join("/");
                        if (pageConfig[candidate] !== undefined) {
                            matchedRoute = candidate;
                            // The segments after the matched page key are the "code" payload
                            const extra = segments.slice(i).join("/");
                            trailingCode = extra || null;
                            break;
                        }
                    }

                    if (matchedRoute !== null) {
                        // Store the trailing code so UrlCouponBlock can read it
                        if (trailingCode) {
                            sessionStorage.setItem("event_url_code", trailingCode);
                        } else {
                            sessionStorage.removeItem("event_url_code");
                        }

                        // Apply SEO metadata
                        const meta = metaConfig[matchedRoute] || {};
                        const pageLabel = meta.label || (matchedRoute === "/" ? "Main Page" : matchedRoute.replace(/^\//, ""));
                        document.title = `${pageLabel} - ${data.name || "Event"}`;

                        if (meta.description) {
                            let metaDesc = document.querySelector('meta[name="description"]');
                            if (!metaDesc) {
                                metaDesc = document.createElement("meta");
                                metaDesc.name = "description";
                                document.head.appendChild(metaDesc);
                            }
                            metaDesc.content = meta.description;
                        }

                        setPageBlocks(pageConfig[matchedRoute]);
                    } else {
                        setNotFound(true);
                    }
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
        <EngineRenderer eventData={eventData} blocksOverride={pageBlocks} />
    );
}

