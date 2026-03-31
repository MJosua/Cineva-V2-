import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { useRef } from "react";
import { useDroppable } from '@dnd-kit/core';
import { applyResponsiveLayoutUpdates, BREAKPOINTS, resolveResponsiveProps } from "../responsiveLayout";

export default function SectionBlock({
    background = "transparent",
    backgroundImage = null,
    children = [],
    padding = "8",
    margin = "0",
    customCss,
    theme,
    isEditor = false,
    onPropsChange,
    onSelectBlock,
    eventSlug,
    eventId,
    id,
    blockIndex,
    currentViewport = BREAKPOINTS.desktop,
    editorScale = 1,
    justifyContent = "center",
    alignItems = "center",
    sectionHeight
}) {
    const containerRef = useRef(null);
    const sectionId = id || `section-${blockIndex}`;

    const { isOver, setNodeRef } = useDroppable({
        id: sectionId,
        disabled: !isEditor
    });

    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch {
        console.warn("Invalid CSS JSON:", customCss);
    }

    const handleChildPropsChange = (childIndex, updatedChildProps) => {
        if (!onPropsChange) return;
        const newChildren = [...children];
        const previousProps = newChildren[childIndex]?.props || {};
        newChildren[childIndex] = {
            ...newChildren[childIndex],
            props: applyResponsiveLayoutUpdates(previousProps, updatedChildProps, currentViewport)
        };
        onPropsChange({ children: newChildren });
    };

    const hasCustomHeight = sectionHeight && sectionHeight.trim();

    // When sectionHeight is set, the outer Box stays 100vh for snap scroll,
    // but an inner scrollable container holds the actual tall content.
    // The user scrolls inside the section first, then snap moves to the next section.

    const childrenContent = (
        <>
            {children && children.map((child, index) => {
                const Component = resolveComponent(child.type);
                if (!Component) return null;
                const childDragId = child._id || `${sectionId}-child-${index}`;
                const childResolvedProps = resolveResponsiveProps(child.type, child.props || {}, currentViewport);
                const childHiddenInViewport = childResolvedProps.display === "none";
                return (
                    <Box key={childDragId} w="100%" display={childHiddenInViewport ? "none" : undefined}>
                        <Component
                            _id={childDragId}
                            id={childDragId}
                            {...childResolvedProps}
                            parentSectionIndex={blockIndex}
                            childIndex={index}
                            currentViewport={currentViewport}
                            editorScale={editorScale}
                            theme={theme}
                            isEditor={isEditor}
                            eventSlug={eventSlug}
                            eventId={eventId}
                            onSelectBlock={onSelectBlock}
                            onPropsChange={(updatedProps) => handleChildPropsChange(index, updatedProps)}
                            parentRef={containerRef}
                        />
                    </Box>
                );
            })}
        </>
    );

    return (
        <Box
            ref={(node) => {
                setNodeRef(node);
                containerRef.current = node;
            }}
            className={isEditor ? "droppable-section" : ""}
            data-section-id={sectionId}
            data-section-index={blockIndex}
            position="relative"
            minH="100vh"
            w="100%"
            m={margin}
            bg={background}
            backgroundImage={backgroundImage ? `url(${resolveMediaUrl(backgroundImage)})` : "none"}
            backgroundSize="cover"
            backgroundPosition="center"
            display="flex"
            flexDirection="column"
            border={isOver && isEditor ? "2px solid #4299E1" : "none"}
            scrollSnapAlign="start"
            sx={customStyles}
            overflow="hidden"
            onPointerDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (isEditor && onSelectBlock && sectionId) {
                    onSelectBlock(sectionId);
                }
            }}
            // When custom height: section becomes a scroll container
            {...(hasCustomHeight ? {
                overflowY: "auto",
            } : {})}
            style={hasCustomHeight ? { WebkitOverflowScrolling: "touch" } : undefined}
        >
            {hasCustomHeight ? (
                // Inner content wrapper with the actual custom height
                <Box
                    minH={sectionHeight}
                    w="100%"
                    p={padding}
                    display="flex"
                    flexDirection="column"
                    justifyContent={justifyContent}
                    alignItems={alignItems}
                >
                    {childrenContent}
                </Box>
            ) : (
                // Standard section: no inner wrapper
                <Box
                    w="100%"
                    h="100%"
                    flex="1"
                    p={padding}
                    display="flex"
                    flexDirection="column"
                    justifyContent={justifyContent}
                    alignItems={alignItems}
                >
                    {childrenContent}
                </Box>
            )}
        </Box>
    );
}
