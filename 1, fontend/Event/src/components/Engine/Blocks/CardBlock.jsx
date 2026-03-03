import { Box, Heading } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";

export default function CardBlock({ title, children, bgColor = "rgba(255,255,255,1)", textColor = "rgba(0,0,0,1)", customCss }) {
    const customStyles = customCss ? JSON.parse(customCss) : {};

    return (
        <Box
            bg={bgColor}
            color={textColor}
            p={6}
            borderRadius="xl"
            shadow="xl"
            maxW="4xl"
            mx="auto"
            my={5}
            sx={customStyles}
        >
            {title && <Heading size="md" mb={4}>{title}</Heading>}
            <Box>
                {children && children.map((child, index) => {
                    const Component = resolveComponent(child.type);
                    return <Component key={child._id || index} {...child.props} />;
                })}
            </Box>
        </Box>
    );
}
