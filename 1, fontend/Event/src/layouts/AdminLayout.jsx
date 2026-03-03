import { Outlet, Link } from "react-router-dom";
import { Box, Flex, Heading, Link as ChakraLink } from "@chakra-ui/react";

export default function AdminLayout() {
    return (
        <Box minH="100vh" bg="gray.100">
            {/* CMS Navbar */}
            <Flex bg="white" p={4} boxShadow="sm" justify="space-between" align="center">
                <Heading size="md" color="brand.900">Indomie Event CMS</Heading>
                <Flex gap={4}>
                    <ChakraLink as={Link} to="/admin/dashboard" fontWeight="bold">Dashboard</ChakraLink>
                    <ChakraLink as={Link} to="/" target="_blank">View Engine</ChakraLink>
                </Flex>
            </Flex>
            <Box p={6}>
                <Outlet />
            </Box>
        </Box>
    );
}
