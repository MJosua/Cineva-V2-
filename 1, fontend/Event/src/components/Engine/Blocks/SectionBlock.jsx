import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { useRef } from "react";

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
    eventId
}) {
    const containerRef = useRef(null);

    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch (e) {
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
            ref={containerRef}
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
            justifyContent="center"
            alignItems="center"
            scrollSnapAlign="start"
            sx={customStyles}
            overflow="hidden"
        >
            {children && children.map((child, index) => {
                const Component = resolveComponent(child.type);
                if (!Component) return null;
                return (
                    <Component
                        key={child._id || index}
                        {...child.props}
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
