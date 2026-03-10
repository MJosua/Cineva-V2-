import { useParams, Link } from "react-router-dom";
import { Box, Heading, Flex, Button, useToast, useDisclosure, VStack, Text, IconButton, HStack, Tabs, TabList, Tab, TabPanels, TabPanel, FormControl, FormLabel, Input, Select, Badge, Tooltip, Image, Switch } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getCampaignBySlug, updateCampaign } from "../../services/eventEngineApi";
import EngineRenderer from "../../components/Engine/EngineRenderer";
import { resolveComponent } from "../../components/Engine/Registry";
import BlockList from "./EditorComponents/BlockList";
import BlockEditor from "./EditorComponents/BlockEditor";
import AddBlockModal from "./EditorComponents/AddBlockModal";
import { MdAdd, MdSave, MdArrowBack, MdLayers, MdOpenInNew, MdDelete } from "react-icons/md";
import MediaPickerModal from "./EditorComponents/MediaPickerModal";
import { resolveMediaUrl } from "../../utils/mediaHelper";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

export default function EventEditor() {
    const { slug, pageKey } = useParams();
    const toast = useToast();

    // Decode pageKey from URL: "__root__" → "/", "success" → "/success"
    const currentPage = pageKey === "__root__" ? "/" : `/${pageKey}`;

    const [eventData, setEventData] = useState(null);
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);
    const { isOpen: isAddModalOpen, onOpen: openAddModal, onClose: closeAddModal } = useDisclosure();
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
    const getSectionId = (block, index) => block?._id || `section-${index}`;
    const getChildDragId = (child, sectionBlock, sectionIndex, childIndex) => (
        child?._id || `${getSectionId(sectionBlock, sectionIndex)}-child-${childIndex}`
    );

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

    const [activeId, setActiveId] = useState(null);
    const [activeProps, setActiveProps] = useState(null);
    const [activeComponentType, setActiveComponentType] = useState(null);

    // Require a 5px drag distance before starting to prevent accidental drags on click
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        // Find the block data for the overlay
        for (const [sectionIndex, block] of currentBlocks.entries()) {
            const sectionId = getSectionId(block, sectionIndex);
            if (sectionId === active.id) {
                setActiveProps(block.props);
                setActiveComponentType(block.type);
                return;
            }
            if (block.props && block.props.children) {
                const child = block.props.children.find((c, childIdx) => (
                    getChildDragId(c, block, sectionIndex, childIdx) === active.id
                ));
                if (child) {
                    setActiveProps(child.props);
                    setActiveComponentType(child.type);
                    return;
                }
            }
        }
    };

    const handleDragEnd = (event) => {
        const { active, over, delta } = event;
        setActiveId(null);
        setActiveProps(null);
        setActiveComponentType(null);

        if (!over) return;

        const targetSectionId = over.id;
        const dragId = active.id;

        // Find source & target
        let sourceSectionIndex = -1;
        let targetSectionIndex = -1;
        let childIndex = -1;
        let childData = null;

        for (let i = 0; i < currentBlocks.length; i++) {
            const block = currentBlocks[i];
            const sectionId = getSectionId(block, i);
            if (sectionId === targetSectionId) {
                targetSectionIndex = i;
            }
            if (block.props && block.props.children) {
                const cIndex = block.props.children.findIndex((c, childIdx) => (
                    getChildDragId(c, block, i, childIdx) === dragId
                ));
                if (cIndex !== -1) {
                    sourceSectionIndex = i;
                    childIndex = cIndex;
                    childData = block.props.children[cIndex];
                }
            }
        }

        if (sourceSectionIndex !== -1 && targetSectionIndex !== -1 && childData) {

            // Re-calculate the absolute delta applied to the original relative position
            // Since we use CSS translates for the overlay, the 'delta' from dnd-kit 
            // is exactly the pixel amount the mouse traveled.

            const currentTop = parseFloat(childData.props.top) || 0;
            const currentLeft = parseFloat(childData.props.left) || 0;

            let finalTop = currentTop + delta.y;
            let finalLeft = currentLeft + delta.x;

            if (sourceSectionIndex !== targetSectionIndex) {
                // Cross section drop: we need to adjust the coordinates based on the physical 
                // difference in height/position between the two sections in the DOM.
                // The easiest way is to let the user drop it, then next frame they adjust it slightly if needed,
                // or we can calculate the bounding rects. Let's do simple naive drop first (relative to drag start).
                // For true absolute-to-relative cross mapping, we calculate delta + the physical diff.

                const sourceSectionId = getSectionId(currentBlocks[sourceSectionIndex], sourceSectionIndex);
                const sourceEl = document.querySelector(`[data-section-id="${sourceSectionId}"]`);
                const targetEl = document.querySelector(`[data-section-id="${targetSectionId}"]`);

                if (sourceEl && targetEl) {
                    const sourceRect = sourceEl.getBoundingClientRect();
                    const targetRect = targetEl.getBoundingClientRect();

                    // Add the difference in section positions to the coordinates so the visual drop matches
                    finalTop += (sourceRect.top - targetRect.top);
                    finalLeft += (sourceRect.left - targetRect.left);
                }
            }

            const updatedChildProps = {
                ...childData.props,
                top: `${Math.round(finalTop)}px`,
                left: `${Math.round(finalLeft)}px`
            };

            const movedChild = {
                ...childData,
                _id: childData._id || dragId,
                props: updatedChildProps
            };

            setEventData(prev => {
                const pages = { ...prev.pages };
                const blocks = [...pages[currentPage]];

                const sourceSection = { ...blocks[sourceSectionIndex] };
                const targetSection = { ...blocks[targetSectionIndex] };

                let sourceChildren = [...(sourceSection.props.children || [])];
                let targetChildren = [...(targetSection.props.children || [])];

                if (sourceSectionIndex === targetSectionIndex) {
                    // Same section
                    sourceChildren[childIndex] = movedChild;
                    sourceSection.props = { ...sourceSection.props, children: sourceChildren };
                    blocks[sourceSectionIndex] = sourceSection;
                } else {
                    // Cross section
                    sourceChildren.splice(childIndex, 1);
                    targetChildren.push(movedChild);

                    sourceSection.props = { ...sourceSection.props, children: sourceChildren };
                    targetSection.props = { ...targetSection.props, children: targetChildren };

                    blocks[sourceSectionIndex] = sourceSection;
                    blocks[targetSectionIndex] = targetSection;
                }

                pages[currentPage] = blocks;
                return { ...prev, pages };
            });
        }
    };

    if (!eventData) return <Box p={10}>Loading Editor...</Box>;

    const ActiveComponent = activeComponentType ? resolveComponent(activeComponentType) : null;
    const dragPreviewTheme = themeConfig || {
        background: "#fff",
        fontFamily: "Inter, sans-serif",
        color: "#ffffff"
    };

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
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                >
                    <Box
                        bg="white"
                        minH="100%"
                        shadow="lg"
                        mx="auto"
                    >
                        <EngineRenderer
                            eventData={{ ...eventData, theme_config: themeConfig }}
                            blocksOverride={currentBlocks}
                            isEditor={true}
                            onBlockChange={(index, updatedProps) => {
                                const newBlocks = [...currentBlocks];
                                newBlocks[index] = {
                                    ...newBlocks[index],
                                    props: { ...newBlocks[index].props, ...updatedProps }
                                };
                                setEventData(prev => ({ ...prev, pages: { ...prev.pages, [currentPage]: newBlocks } }));
                            }}
                        />
                    </Box>
                    <DragOverlay zIndex={999999}>
                        {activeId && ActiveComponent ? (
                            <ActiveComponent
                                {...activeProps}
                                isEditor={false}
                                isDragOverlay={true}
                                theme={dragPreviewTheme}
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
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
                                        <FormLabel fontSize="sm">Background Image</FormLabel>
                                        <VStack align="stretch" spacing={2}>
                                            {themeConfig?.backgroundImage ? (
                                                <Box position="relative" borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200">
                                                    <Image
                                                        src={resolveMediaUrl(themeConfig.backgroundImage)}
                                                        alt="Background"
                                                        w="100%" h="120px" objectFit="cover"
                                                    />
                                                    <IconButton
                                                        icon={<MdDelete />}
                                                        size="xs" colorScheme="red"
                                                        position="absolute" top={1} right={1}
                                                        onClick={() => setThemeConfig(prev => ({ ...prev, backgroundImage: "" }))}
                                                        aria-label="Clear Background"
                                                    />
                                                </Box>
                                            ) : (
                                                <Box
                                                    h="80px" border="2px dashed" borderColor="gray.200" borderRadius="md"
                                                    display="flex" alignItems="center" justifyContent="center" bg="gray.50"
                                                >
                                                    <Text fontSize="xs" color="gray.400">No background image</Text>
                                                </Box>
                                            )}
                                            <HStack>
                                                <Input
                                                    size="sm"
                                                    placeholder="URL or select..."
                                                    value={themeConfig?.backgroundImage || ''}
                                                    onChange={(e) => setThemeConfig(prev => ({ ...prev, backgroundImage: e.target.value }))}
                                                />
                                                <MediaPickerModal onSelect={(url) => setThemeConfig(prev => ({ ...prev, backgroundImage: url }))} />
                                            </HStack>
                                        </VStack>
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

                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel fontSize="sm" mb="0">Enable Scroll Snapping</FormLabel>
                                        <Switch
                                            isChecked={themeConfig?.snappingEnabled === "true" || themeConfig?.snappingEnabled === true}
                                            onChange={(e) => setThemeConfig(prev => ({ ...prev, snappingEnabled: e.target.checked }))}
                                        />
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
