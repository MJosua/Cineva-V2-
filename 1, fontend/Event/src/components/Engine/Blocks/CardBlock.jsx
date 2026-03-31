import { Box, Heading, Image, Text } from "@chakra-ui/react";
import { useRef } from "react";
import { resolveComponent } from "../Registry";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { applyResponsiveLayoutUpdates, BREAKPOINTS, resolveResponsiveProps } from "../responsiveLayout";

export default function CardBlock({
    title,
    subtitle,
    imageUrl,
    children = [],
    bgColor = "rgba(255,255,255,1)",
    titleBgColor = "transparent",
    titleColor,
    subtitleColor,
    textColor,
    margin = "0",
    padding = "6",
    marginTop, marginRight, marginBottom, marginLeft,
    paddingTop, paddingRight, paddingBottom, paddingLeft,
    theme,
    customCss,
    isEditor = false,
    onPropsChange,
    onSelectBlock,
    currentViewport = BREAKPOINTS.desktop,
    editorScale = 1,
    eventSlug,
    eventId,
    id,
    _id,
    blockIndex,
    childIndex
}) {
    const containerRef = useRef(null);
    const cardId = id || _id || `card-${blockIndex ?? childIndex ?? "x"}`;

    let customStyles = {};
    try {
        if (customCss && typeof customCss === "string") {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === "object" && customCss !== null) {
            customStyles = customCss;
        }
    } catch {
        console.warn("Invalid CSS JSON in CardBlock:", customCss);
    }

    const finalColor = textColor || theme?.color || "#1a1a1a";
    const finalTitleColor = titleColor || finalColor;
    const finalSubtitleColor = subtitleColor || finalColor;

    const handleChildPropsChange = (childIndex, updatedChildProps) => {
        if (!onPropsChange) return;

        const nextChildren = [...children];
        const previousChild = nextChildren[childIndex] || {};
        const previousProps = previousChild.props || {};

        nextChildren[childIndex] = {
            ...previousChild,
            props: applyResponsiveLayoutUpdates(previousProps, updatedChildProps, currentViewport)
        };

        onPropsChange({ children: nextChildren });
    };

    return (
        <Box
            ref={containerRef}
            bg={bgColor}
            color={finalColor}
            p={paddingTop || paddingRight || paddingBottom || paddingLeft ? undefined : padding}
            m={marginTop || marginRight || marginBottom || marginLeft ? undefined : margin}
            {...(marginTop || marginRight || marginBottom || marginLeft ? { mt: marginTop || undefined, mr: marginRight || undefined, mb: marginBottom || undefined, ml: marginLeft || undefined } : {})}
            {...(paddingTop || paddingRight || paddingBottom || paddingLeft ? { pt: paddingTop || undefined, pr: paddingRight || undefined, pb: paddingBottom || undefined, pl: paddingLeft || undefined } : {})}
            borderRadius="xl"
            shadow="xl"
            maxW="480px"
            mx="auto"
            sx={customStyles}
            overflow="hidden"
            position="relative"
            data-card-id={cardId}
            onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (isEditor && onSelectBlock && cardId) {
                    onSelectBlock(cardId);
                }
            }}
        >
            {imageUrl && <Image src={resolveMediaUrl(imageUrl)} w="100%" borderRadius="md" mb={4} />}

            {(title || subtitle) && (
                <Box mb={4}>
                    {title && (
                        <Box bg={titleBgColor} p={titleBgColor !== "transparent" ? 3 : 0} borderRadius="md" mb={subtitle ? 1 : 0}>
                            <Heading size="md" color={finalTitleColor}>{title}</Heading>
                        </Box>
                    )}
                    {subtitle && (
                        <Text fontSize="sm" color={finalSubtitleColor} fontWeight="medium">
                            {subtitle}
                        </Text>
                    )}
                </Box>
            )}

            <Box>
                {children.map((child, index) => {
                    const Component = resolveComponent(child.type);
                    if (!Component) return null;

                    const childResolvedProps = resolveResponsiveProps(child.type, child.props || {}, currentViewport);
                    const childDragId = child._id || `${cardId}-child-${index}`;
                    const childHiddenInViewport = childResolvedProps.display === "none";

                    return (
                        <Box key={childDragId} w="100%" display={childHiddenInViewport ? "none" : undefined}>
                            <Component
                                _id={childDragId}
                                id={childDragId}
                                {...childResolvedProps}
                                childIndex={index}
                                parentSectionIndex={blockIndex}
                                currentViewport={currentViewport}
                                editorScale={editorScale}
                                theme={theme}
                                isEditor={isEditor}
                                eventSlug={eventSlug}
                                eventId={eventId}
                                parentRef={containerRef}
                                onSelectBlock={onSelectBlock}
                                onPropsChange={(updatedProps) => handleChildPropsChange(index, updatedProps)}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
