import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../../components/Engine/Registry";

export default function EngineRenderer({ eventData, blocksOverride, isEditor = false }) {
    if (!eventData) return null;

    const config = eventData.theme_config || eventData.theme || {};
    const theme = {
        background: config.background || "#fff",
        fontFamily: config.fontFamily || "Arial, sans-serif",
        color: config.color || "white"
    };

    // Fallback to old blocks if pages architecture isn't present
    let blocks = [];
    if (blocksOverride) {
        blocks = blocksOverride;
    } else if (eventData.pages && eventData.pages["/"]) {
        blocks = eventData.pages["/"];
    } else if (eventData.blocks) {
        blocks = eventData.blocks;
    }

    return (
        <Box minH="100vh" bg={theme.background} p={4} fontFamily={theme.fontFamily}>
            {/* Dynamic Rendering Loop */}
            {blocks.map((block, index) => {
                const Component = resolveComponent(block.type);
                return Component ? (
                    <Component
                        key={index}
                        {...block.props}
                        theme={theme}
                        eventSlug={eventData.slug}
                        eventId={eventData.campaign_id}
                        isEditor={isEditor}
                    />
                ) : null;
            })}
        </Box>
    );
}
