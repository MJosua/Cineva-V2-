import { Box, Heading, Text, VStack, Button, Icon } from "@chakra-ui/react";
import { MdConstruction } from "react-icons/md";

export default function PlaceholderPage({ title }) {
    return (
        <Box p={6} h="100%" display="flex" alignItems="center" justifyContent="center">
            <VStack spacing={4}>
                <Icon as={MdConstruction} boxSize={16} color="gray.300" />
                <Heading size="md" color="gray.500">{title || "Coming Soon"}</Heading>
                <Text color="gray.400">This feature is under development</Text>
            </VStack>
        </Box>
    );
}
