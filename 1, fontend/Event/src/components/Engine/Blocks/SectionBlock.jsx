import { Box } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";

export default function SectionBlock({ background = "rgba(255,255,255,0)", children, customCss }) {
    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object') {
            customStyles = customCss;
        }
    } catch (e) {
        console.warn("Invalid CSS JSON:", customCss);
    }

    return (
        <Box
            minH="100vh"
            bg={background}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            scrollSnapAlign="start"
            p={8}
            sx={customStyles}
        >
            {children && children.map((child, index) => {
                const Component = resolveComponent(child.type);
                return <Component key={child._id || index} {...child.props} />;
            })}
        </Box>
    );
}
