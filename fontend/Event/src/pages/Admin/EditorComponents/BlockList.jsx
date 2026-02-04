import { Reorder } from "framer-motion";
import { Box, Text, HStack, IconButton, Badge } from "@chakra-ui/react";
import { MdDragIndicator, MdDelete, MdEdit } from "react-icons/md";

export default function BlockList({ blocks, onReorder, onSelect, onDelete, selectedIndex }) {
    return (
        <Reorder.Group axis="y" values={blocks} onReorder={onReorder}>
            {blocks.map((block, index) => (
                <Reorder.Item key={block._id || index} value={block}>
                    <Box
                        p={3}
                        mb={2}
                        bg={selectedIndex === index ? "blue.50" : "white"}
                        borderWidth="1px"
                        borderColor={selectedIndex === index ? "blue.300" : "gray.200"}
                        borderRadius="md"
                        shadow="sm"
                        _hover={{ shadow: "md" }}
                        cursor="grab"
                    >
                        <HStack justify="space-between">
                            <HStack>
                                <MdDragIndicator color="gray" />
                                <Box onClick={() => onSelect(index)} cursor="pointer" flex={1}>
                                    <Text fontWeight="bold" fontSize="sm">{block.type.toUpperCase()}</Text>
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                        {JSON.stringify(block.props)}
                                    </Text>
                                </Box>
                            </HStack>
                            <HStack>
                                <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => onDelete(index)} />
                            </HStack>
                        </HStack>
                    </Box>
                </Reorder.Item>
            ))}
        </Reorder.Group>
    );
}
