import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../../components/Engine/Registry";
import { resolveMediaUrl } from "../../utils/mediaHelper";
import { BREAKPOINTS, resolveResponsiveProps } from "./responsiveLayout";

export default function EngineRenderer({
    eventData,
    blocksOverride,
    isEditor = false,
    onBlockChange,
    onSelectBlock,
    viewport = BREAKPOINTS.desktop,
    editorScale = 1
}) {
    if (!eventData) return null;

    const config = eventData.theme_config || eventData.theme || {};
    const theme = {
        background: config.background || "#fff",
        backgroundImage: config.backgroundImage ? `url(${resolveMediaUrl(config.backgroundImage)})` : "none",
        fontFamily: config.fontFamily || "Arial, sans-serif",
        color: config.color || "white",
        snappingEnabled: config.snappingEnabled === "true" || config.snappingEnabled === true
    };
    const shouldSnap = !isEditor && theme.snappingEnabled;
    const isDesktopRuntime = !isEditor && viewport === BREAKPOINTS.desktop;

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
            h={shouldSnap ? "100vh" : "auto"}
            minH={isEditor ? "100%" : "100vh"}
            overflowY={shouldSnap ? "scroll" : "visible"}
            scrollSnapType={shouldSnap ? "y mandatory" : "none"}
            bg={theme.background}
            backgroundImage={theme.backgroundImage}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundAttachment={isEditor ? "scroll" : "fixed"}
            fontFamily={theme.fontFamily}
        >
            <Box
                w="100%"
                maxW={isDesktopRuntime ? "1200px" : "none"}
                mx={isDesktopRuntime ? "auto" : "0"}
            >
                {/* Dynamic Rendering Loop */}
                {blocks.map((block, index) => {
                    const Component = resolveComponent(block.type);
                    const resolvedProps = resolveResponsiveProps(block.type, block.props || {}, viewport);
                    const isHiddenInViewport = resolvedProps.display === "none";
                    return Component ? (
                        <Box key={block._id || index} w="100%" display={isHiddenInViewport ? "none" : undefined}>
                            <Component
                                {...resolvedProps}
                                rawProps={block.props}
                                id={block._id}
                                _id={block._id}
                                blockIndex={index}
                                currentViewport={viewport}
                                editorScale={editorScale}
                                theme={theme}
                                eventSlug={eventData.slug}
                                eventId={eventData.campaign_id}
                                isEditor={isEditor}
                                onSelectBlock={onSelectBlock}
                                onPropsChange={(updatedProps) => onBlockChange && onBlockChange(index, updatedProps)}
                            />
                        </Box>
                    ) : null;
                })}
            </Box>
        </Box>
    );
}
