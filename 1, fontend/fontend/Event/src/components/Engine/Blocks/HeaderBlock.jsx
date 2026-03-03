import { Box, Flex, Image, HStack, Link as ChakraLink, Spacer } from "@chakra-ui/react";

export default function HeaderBlock({ logo, links = [], bgColor = "rgba(255,255,255,1)", textColor, fontSize = "16px", fontWeight = "500", customCss, theme }) {
    let customStyles = {};
    try {
        if (typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch (e) {
        console.warn("Invalid customCss for HeaderBlock:", customCss);
    }
    const finalTextColor = textColor || theme?.color || "rgba(51,51,51,1)";

    return (
        <Box
            bg={bgColor}
            px={6}
            py={3}
            shadow="sm"
            position="sticky"
            top={0}
            zIndex={100}
            sx={customStyles}
        >
            <Flex align="center" maxW="1200px" mx="auto">
                {logo && <Image src={logo} h="40px" alt="Logo" />}
                <Spacer />
                <HStack spacing={6}>
                    {links.map((link, i) => (
                        <ChakraLink
                            key={i}
                            href={link.url || "#"}
                            color={finalTextColor}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            _hover={{ opacity: 0.8 }}
                        >
                            {link.label}
                        </ChakraLink>
                    ))}
                </HStack>
            </Flex>
        </Box>
    );
}
