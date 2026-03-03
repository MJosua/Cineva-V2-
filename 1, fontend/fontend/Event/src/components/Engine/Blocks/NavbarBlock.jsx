import { Flex, Box, Image, Text, Button } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function NavbarBlock({ logo, links }) {
    return (
        <Flex p={4} justify="space-between" align="center" bg="whiteAlpha.200" backdropFilter="blur(10px)">
            {/* Left: Logo */}
            <Box>
                {logo && <Image src={logo} h="40px" />}
            </Box>

            {/* Right: Links */}
            <Flex gap={4}>
                {links && links.map((link, idx) => (
                    <Button
                        key={idx}
                        as={Link}
                        to={link.url}
                        variant="ghost"
                        color="white"
                        _hover={{ bg: "whiteAlpha.300" }}
                    >
                        {link.label}
                    </Button>
                ))}
            </Flex>
        </Flex>
    );
}
