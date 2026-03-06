import { useParams, Link, useNavigate } from "react-router-dom";
import { Box, Heading, Flex, Button, useToast, useDisclosure, VStack, Text, IconButton, HStack, Tabs, TabList, Tab, TabPanels, TabPanel, FormControl, FormLabel, Input, Select, Badge, Tooltip } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getCampaignBySlug, updateCampaign } from "../../services/eventEngineApi";
import EngineRenderer from "../../components/Engine/EngineRenderer";
import BlockList from "./EditorComponents/BlockList";
import BlockEditor from "./EditorComponents/BlockEditor";
import AddBlockModal from "./EditorComponents/AddBlockModal";
import { MdAdd, MdSave, MdArrowBack, MdLayers, MdOpenInNew } from "react-icons/md";

export default function EventEditor() {
    const { slug, pageKey } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    // Decode pageKey from URL: "__root__" → "/", "success" → "/success"
    const currentPage = pageKey === "__root__" ? "/" : `/${pageKey}`;

    const [eventData, setEventData] = useState(null);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const { isOpen: isAddModalOpen, onOpen: openAddModal, onClose: closeAddModal } = useDisclosure();
    const [isLoading, setIsLoading] = useState(true);
    const [themeConfig, setThemeConfig] = useState(null);

    useEffect(() => {
        let isMounted = true;
        async function loadEvent() {
            try {
                const data = await getCampaignBySlug(slug);
                if (isMounted) {
                    // Extract block schema securely
                    let pageConfig = {};
                    if (data.block_schema?.pages) {
                        pageConfig = data.block_schema.pages;
                    } else if (data.blocks?.pages) {
                        pageConfig = data.blocks.pages;
                    } else if (Array.isArray(data.blocks)) {
                        pageConfig = { "/": data.blocks };
                    } else if (Array.isArray(data.block_schema)) {
                        pageConfig = { "/": data.block_schema };
                    } else {
                        pageConfig = { "/": data.blocks || [] };
                    }

                    let metaConfig = {};
                    if (data.block_schema?.pages_meta) {
                        metaConfig = data.block_schema.pages_meta;
                    } else if (data.blocks?.pages_meta) {
                        metaConfig = data.blocks.pages_meta;
                    }

                    // Ensure blocks have unique IDs for editor across all pages
                    Object.keys(pageConfig).forEach(pageKey => {
                        const pageBlocks = pageConfig[pageKey];
                        if (Array.isArray(pageBlocks)) {
                            pageConfig[pageKey] = pageBlocks.map((block, i) => ({
                                ...block,
                                _id: block._id || `block-${Date.now()}-${i}`
                            }));
                        } else {
                            pageConfig[pageKey] = []; // Fallback safety
                        }
                    });

                    data.pages = pageConfig;
                    data.pages_meta = metaConfig;
                    // Initialize Theme State
                    setThemeConfig(data.theme_config || data.theme || {
                        background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                        fontFamily: "Inter, sans-serif",
                        color: "#ffffff"
                    });

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
            console.log("Saving pages config:", eventData.pages);
            // Wrap all pages in { pages: {...} } so block_schema stores the full
            // multi-page structure and the loader's `block_schema.pages` path finds it.
            await updateCampaign(slug, {
                blocks: {
                    pages: eventData.pages,
                    pages_meta: eventData.pages_meta || {}
                },
                theme: themeConfig
            });
            console.log("Save successful!");
            toast({ status: "success", title: "Changes Saved", description: "Event config updated successfully." });
        } catch (error) {
            console.error("Save failed:", error);
            toast({ status: "error", title: "Save Failed", description: "Could not save changes." });
        }
    };

    const currentBlocks = eventData?.pages?.[currentPage] || [];

    const handleReorder = (newBlocks) => {
        setEventData(prev => ({ ...prev, pages: { ...prev.pages, [currentPage]: newBlocks } }));
    };

    const handleBlockChange = (updatedBlock) => {
        const newBlocks = [...currentBlocks];
        newBlocks[selectedBlockIndex] = updatedBlock;
        setEventData(prev => ({ ...prev, pages: { ...prev.pages, [currentPage]: newBlocks } }));
    };

    const handleDeleteBlock = (index) => {
        const newBlocks = currentBlocks.filter((_, i) => i !== index);
        setEventData(prev => ({ ...prev, pages: { ...prev.pages, [currentPage]: newBlocks } }));
        if (selectedBlockIndex === index) setSelectedBlockIndex(null);
    };

    const handleAddBlock = (newBlock) => {
        const blockWithId = { ...newBlock, _id: `block-${Date.now()}` };
        setEventData(prev => ({ ...prev, pages: { ...prev.pages, [currentPage]: [...currentBlocks, blockWithId] } }));
    };

    if (!eventData) return <Box p={10}>Loading Editor...</Box>;

    return (
        <Flex flex={1} minH="0" overflow="hidden">
            {/* LEFT: Live Preview */}
            <Box flex="1" bg="gray.100" overflowY="auto" borderRight="1px solid #ddd" position="relative">
                <Box position="absolute" top={2} left={2} zIndex={10}>
                    <Button
                        as={Link}
                        to={`/admin/event/${slug}/pages`}
                        size="sm"
                        leftIcon={<MdArrowBack />}
                        bg="whiteAlpha.900"
                        shadow="sm"
                    >
                        Pages
                    </Button>
                </Box>
                <Box
                    // Transform scale logic could go here for "Device Preview" mode
                    bg="white"
                    minH="100%"
                    shadow="lg"
                    mx="auto"
                >
                    <EngineRenderer eventData={{ ...eventData, theme_config: themeConfig }} blocksOverride={currentBlocks} isEditor={true} />
                </Box>
            </Box>

            {/* RIGHT: Editor Panel */}
            <Box w="400px" bg="white" shadow="xl" zIndex={20} display="flex" flexDirection="column">

                {/* Editor Header */}
                <Flex p={4} borderBottom="1px solid #eee" justify="space-between" align="center" bg="gray.50" flexWrap="wrap" gap={2}>
                    <VStack align="start" spacing={0}>
                        <Heading size="sm">Visual Editor</Heading>
                        <Badge colorScheme="purple" fontSize="xs" fontFamily="mono">{currentPage}</Badge>
                    </VStack>
                    <HStack>
                        <Tooltip label="View Live Page" hasArrow>
                            <IconButton
                                icon={<MdOpenInNew />}
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    const url = `${window.location.origin}/event/${slug}${currentPage === "/" ? "" : currentPage}`;
                                    window.open(url, "_blank");
                                }}
                                aria-label="View Live"
                            />
                        </Tooltip>
                        <Button size="sm" colorScheme="blue" leftIcon={<MdSave />} onClick={handleSave}>Save</Button>
                    </HStack>
                </Flex>

                <Flex flex="1" overflow="hidden" direction="column">
                    <Tabs colorScheme="purple" size="sm" isFitted flex="1" display="flex" flexDirection="column">
                        <TabList>
                            <Tab>Blocks</Tab>
                            <Tab>Global Theme</Tab>
                        </TabList>
                        <TabPanels flex="1" overflow="hidden" display="flex" flexDirection="column">
                            <TabPanel p={0} h="100%" display="flex" flexDirection="column" overflow="hidden">
                                <Box flex="1" p={4} overflowY="auto" borderRight="1px solid #eee">
                                    <Flex justify="space-between" align="center" mb={2}>
                                        <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="gray.500">Layers</Text>
                                        <IconButton icon={<MdAdd />} size="xs" onClick={openAddModal} aria-label="Add Block" />
                                    </Flex>

                                    <BlockList
                                        blocks={currentBlocks}
                                        onReorder={handleReorder}
                                        onSelect={setSelectedBlockIndex}
                                        onDelete={handleDeleteBlock}
                                        selectedIndex={selectedBlockIndex}
                                    />
                                </Box>
                            </TabPanel>
                            <TabPanel h="100%" overflowY="auto">
                                <VStack spacing={4} align="stretch" mt={2}>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Background Gradient / Color</FormLabel>
                                        <Input
                                            size="sm"
                                            value={themeConfig?.background || ''}
                                            onChange={(e) => setThemeConfig(prev => ({ ...prev, background: e.target.value }))}
                                        />
                                        <Box mt={2} h="40px" borderRadius="md" bg={themeConfig?.background} border="1px solid #e2e8f0" />
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm">Font Family</FormLabel>
                                        <Select
                                            size="sm"
                                            value={themeConfig?.fontFamily || 'Inter, sans-serif'}
                                            onChange={(e) => setThemeConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                                        >
                                            <option value="Inter, sans-serif">Inter</option>
                                            <option value="Roboto, sans-serif">Roboto</option>
                                            <option value="Poppins, sans-serif">Poppins</option>
                                            <option value="Noto Sans TC, sans-serif">Noto Sans TC</option>
                                        </Select>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm">Base Text Color</FormLabel>
                                        <HStack>
                                            <Input
                                                type="color" w="50px" size="sm" p={0}
                                                value={themeConfig?.color || '#ffffff'}
                                                onChange={(e) => setThemeConfig(prev => ({ ...prev, color: e.target.value }))}
                                            />
                                            <Input
                                                size="sm"
                                                value={themeConfig?.color || '#ffffff'}
                                                onChange={(e) => setThemeConfig(prev => ({ ...prev, color: e.target.value }))}
                                            />
                                        </HStack>
                                    </FormControl>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Flex>

                {/* Property Editor (Bottom Half or Side) */}
                {selectedBlockIndex !== null && (
                    <Box flex="1" minH="0" p={4} borderTop="4px solid #f0f0f0" overflowY="auto" bg="gray.50">
                        <BlockEditor
                            block={currentBlocks[selectedBlockIndex]}
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
