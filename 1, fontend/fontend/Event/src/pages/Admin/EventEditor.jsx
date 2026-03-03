import { useParams, Link } from "react-router-dom";
import { Box, Heading, Flex, Button, useToast, VStack, Text, IconButton, Divider, useDisclosure } from "@chakra-ui/react";
import { useState, useEffect } from "react";
// import { MOCK_EVENTS } from "../../data/mockEvents"; // Removed mock data
import { getCampaignBySlug, updateCampaign } from "../../services/eventEngineApi"; // Added real API
import EngineRenderer from "../../components/Engine/EngineRenderer";
import BlockList from "./EditorComponents/BlockList";
import BlockEditor from "./EditorComponents/BlockEditor";
import AddBlockModal from "./EditorComponents/AddBlockModal";
import { MdAdd, MdSave, MdArrowBack } from "react-icons/md";

export default function EventEditor() {
    const { slug } = useParams();
    const toast = useToast();

    const [eventData, setEventData] = useState(null);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const { isOpen: isAddModalOpen, onOpen: openAddModal, onClose: closeAddModal } = useDisclosure();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function loadEvent() {
            try {
                const data = await getCampaignBySlug(slug);
                if (isMounted) {
                    // Normalize blocks if they don't exist
                    if (!data.blocks) data.blocks = [];
                    // Ensure blocks have unique IDs for editor
                    data.blocks = data.blocks.map((block, i) => ({
                        ...block,
                        _id: block._id || `block-${Date.now()}-${i}`
                    }));
                    setEventData(data);
                }
            } catch (error) {
                console.error("Failed to load event:", error);
                if (isMounted) toast({ status: "error", title: "Error", description: "Failed to load event data." });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        loadEvent();
        return () => { isMounted = false; };
    }, [slug, toast]);

    const handleSave = async () => {
        try {
            console.log("Saving blocks config:", eventData.blocks);
            await updateCampaign(slug, { blocks: eventData.blocks });
            console.log("Save successful!");
            toast({ status: "success", title: "Changes Saved", description: "Event config updated successfully." });
        } catch (error) {
            console.error("Save failed:", error);
            toast({ status: "error", title: "Save Failed", description: "Could not save changes." });
        }
    };

    const handleReorder = (newBlocks) => {
        setEventData({ ...eventData, blocks: newBlocks });
    };

    const handleBlockChange = (updatedBlock) => {
        const newBlocks = [...eventData.blocks];
        newBlocks[selectedBlockIndex] = updatedBlock;
        setEventData({ ...eventData, blocks: newBlocks });
    };

    const handleDeleteBlock = (index) => {
        const newBlocks = eventData.blocks.filter((_, i) => i !== index);
        setEventData({ ...eventData, blocks: newBlocks });
        if (selectedBlockIndex === index) setSelectedBlockIndex(null);
    };

    const handleAddBlock = (newBlock) => {
        setEventData({ ...eventData, blocks: [...eventData.blocks, newBlock] });
    };

    if (!eventData) return <Box p={10}>Loading Editor...</Box>;

    return (
        <Flex h="100vh" overflow="hidden">
            {/* LEFT: Live Preview (Scaled down slightly if needed, or full width) */}
            <Box flex="1" bg="gray.100" overflowY="auto" borderRight="1px solid #ddd" position="relative">
                <Box position="absolute" top={2} left={2} zIndex={10}>
                    <Button as={Link} to={`/admin/event/${slug}/dashboard`} size="sm" leftIcon={<MdArrowBack />}>Back</Button>
                </Box>
                <Box
                    // Transform scale logic could go here for "Device Preview" mode
                    bg="white"
                    minH="100%"
                    shadow="lg"
                    mx="auto"
                >
                    <EngineRenderer eventData={eventData} />
                </Box>
            </Box>

            {/* RIGHT: Editor Panel */}
            <Box w="400px" bg="white" shadow="xl" zIndex={20} display="flex" flexDirection="column">

                {/* Editor Header */}
                <Flex p={4} borderBottom="1px solid #eee" justify="space-between" align="center" bg="gray.50">
                    <Heading size="sm">Visual Editor</Heading>
                    <Button size="sm" colorScheme="blue" leftIcon={<MdSave />} onClick={handleSave}>Save</Button>
                </Flex>

                <Flex flex="1" overflow="hidden">
                    {/* Block List (Draggable) */}
                    <Box flex="1" p={4} overflowY="auto" borderRight="1px solid #eee">
                        <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="gray.500">Layers</Text>
                            <IconButton icon={<MdAdd />} size="xs" onClick={openAddModal} aria-label="Add Block" />
                        </Flex>

                        <BlockList
                            blocks={eventData.blocks}
                            onReorder={handleReorder}
                            onSelect={setSelectedBlockIndex}
                            onDelete={handleDeleteBlock}
                            selectedIndex={selectedBlockIndex}
                        />
                    </Box>
                </Flex>

                {/* Property Editor (Bottom Half or Side) */}
                {selectedBlockIndex !== null && (
                    <Box h="40%" p={4} borderTop="4px solid #f0f0f0" overflowY="auto" bg="gray.50">
                        <BlockEditor
                            block={eventData.blocks[selectedBlockIndex]}
                            onChange={handleBlockChange}
                        />
                    </Box>
                )}

            </Box>

            {/* Add Block Modal */}
            <AddBlockModal isOpen={isAddModalOpen} onClose={closeAddModal} onAddBlock={handleAddBlock} />
        </Flex>
    );
}
