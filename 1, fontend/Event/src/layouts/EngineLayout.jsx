import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";

export default function EngineLayout() {
    return (
        <Box minH="100vh">
            <Outlet />
        </Box>
    );
}
