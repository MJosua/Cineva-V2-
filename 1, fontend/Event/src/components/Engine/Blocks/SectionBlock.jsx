import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { useRef } from "react";
import { useDroppable } from '@dnd-kit/core';

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
    eventSlug,
    eventId,
    id,
    blockIndex
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
        newChildren[childIndex] = {
            ...newChildren[childIndex],
            props: { ...newChildren[childIndex].props, ...updatedChildProps }
        };
        onPropsChange({ children: newChildren });
    };

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
            p={padding}
            bg={background}
            backgroundImage={backgroundImage ? `url(${resolveMediaUrl(backgroundImage)})` : "none"}
            backgroundSize="cover"
            backgroundPosition="center"
            display="flex"
            flexDirection="column"
            border={isOver && isEditor ? "2px solid #4299E1" : "none"}
            justifyContent="center"
            alignItems="center"
            scrollSnapAlign="start"
            sx={customStyles}
            overflow="hidden"
        >
            {children && children.map((child, index) => {
                const Component = resolveComponent(child.type);
                if (!Component) return null;
                const childDragId = child._id || `${sectionId}-child-${index}`;
                return (
                    <Component
                        key={childDragId}
                        _id={childDragId}
                        {...child.props}
                        parentSectionIndex={blockIndex}
                        childIndex={index}
                        theme={theme}
                        isEditor={isEditor}
                        eventSlug={eventSlug}
                        eventId={eventId}
                        onPropsChange={(updatedProps) => handleChildPropsChange(index, updatedProps)}
                        parentRef={containerRef}
                    />
                );
            })}
        </Box>
    );
}
