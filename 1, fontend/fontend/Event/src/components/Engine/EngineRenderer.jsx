import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../../components/Engine/Registry";

export default function EngineRenderer({ eventData }) {
    if (!eventData) return null;

    const config = eventData.theme_config || eventData.theme || {};
    const theme = {
        background: config.background || "#fff",
        fontFamily: config.fontFamily || "Arial, sans-serif",
        color: config.color || "white"
    };
    const blocks = eventData.blocks || [];

    return (
        <Box minH="100vh" bg={theme.background} p={4} fontFamily={theme.fontFamily}>
            {/* Dynamic Rendering Loop */}
            {blocks.map((block, index) => {
                const Component = resolveComponent(block.type);
                // We add a key that combines index to avoid issues during reorder, 
                // but in production unique IDs are better.
                return Component ? (
                    <Component
                        key={index}
                        {...block.props}
                        theme={theme}
                        eventSlug={eventData.slug}
                        eventId={eventData.campaign_id}
                    />
                ) : null;
            })}
        </Box>
    );
}
