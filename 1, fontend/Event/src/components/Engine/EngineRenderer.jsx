import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../../components/Engine/Registry";
import { resolveMediaUrl } from "../../utils/mediaHelper";

export default function EngineRenderer({ eventData, blocksOverride, isEditor = false, onBlockChange }) {
    if (!eventData) return null;

    const config = eventData.theme_config || eventData.theme || {};
    const theme = {
        background: config.background || "#fff",
        backgroundImage: config.backgroundImage ? `url(${resolveMediaUrl(config.backgroundImage)})` : "none",
        fontFamily: config.fontFamily || "Arial, sans-serif",
        color: config.color || "white",
        snappingEnabled: config.snappingEnabled === "true" || config.snappingEnabled === true
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
        <Box
            h={theme.snappingEnabled ? "100vh" : "auto"}
            minH="100vh"
            overflowY={theme.snappingEnabled ? "scroll" : "auto"}
            scrollSnapType={theme.snappingEnabled ? "y mandatory" : "none"}
            bg={theme.background}
            backgroundImage={theme.backgroundImage}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundAttachment="fixed"
            fontFamily={theme.fontFamily}
        >
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
                        onPropsChange={(updatedProps) => onBlockChange && onBlockChange(index, updatedProps)}
                    />
                ) : null;
            })}
        </Box>
    );
}
