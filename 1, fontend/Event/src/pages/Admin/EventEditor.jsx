import { useParams, Link } from "react-router-dom";
import {
    Box,
    Heading,
    Flex,
    Button,
    useToast,
    useDisclosure,
    VStack,
    Text,
    IconButton,
    HStack,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    FormControl,
    FormLabel,
    Input,
    Select,
    Badge,
    Tooltip,
    Image,
    Switch,
    Collapse
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCampaignBySlug, updateCampaign } from "../../services/eventEngineApi";
import EngineRenderer from "../../components/Engine/EngineRenderer";
import { COMPONENT_REGISTRY, resolveComponent } from "../../components/Engine/Registry";
import BlockList from "./EditorComponents/BlockList";
import BlockEditor from "./EditorComponents/BlockEditor";
import AddBlockModal from "./EditorComponents/AddBlockModal";
import { BLOCK_EDITOR_SUPPORTED_TYPES } from "./EditorComponents/blockEditorSupport";
import MediaPickerModal from "./EditorComponents/MediaPickerModal";
import { resolveMediaUrl } from "../../utils/mediaHelper";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
    applyResponsiveLayoutUpdates,
    BREAKPOINTS,
    resolveResponsiveProps
} from "../../components/Engine/responsiveLayout";
import {
    deleteBlockAtPath,
    ensureBlockIds,
    getBlockAtPath,
    moveBlockByPath,
    pathsEqual,
    updateBlockAtPath,
    duplicateBlockAtPath,
    insertInsidePath,
    isDescendantPath
} from "./EditorComponents/blockTreeUtils";
import { Portal, Icon } from "@chakra-ui/react";
import { MdAdd, MdSave, MdArrowBack, MdOpenInNew, MdDelete, MdContentCopy, MdAddCircleOutline } from "react-icons/md";
import { BLOCK_TYPE_META } from "./EditorComponents/blockCatalog";

const RESPONSIVE_BUILDER_V2 = true;
const VIEWPORT_OPTIONS = [
    { key: BREAKPOINTS.desktop, label: "Desktop", canvasWidth: 1200 },
    { key: BREAKPOINTS.tablet, label: "Tablet", canvasWidth: 768 },
    { key: BREAKPOINTS.mobile, label: "Mobile", canvasWidth: 390 }
];
const MOBILE_VIEWPORT_PRESETS = [
    { key: "iphone-se", label: "iPhone SE (375)", canvasWidth: 375 },
    { key: "iphone-14", label: "iPhone 14/15 (390)", canvasWidth: 390 },
    { key: "iphone-plus", label: "iPhone Plus/Pro Max (430)", canvasWidth: 430 },
    { key: "pixel-7", label: "Pixel 7/8 (412)", canvasWidth: 412 },
    { key: "galaxy-s", label: "Galaxy S (360)", canvasWidth: 360 },
    { key: "small-android", label: "Small Android (320)", canvasWidth: 320 }
];

function isPathPrefix(prefix, candidate) {
    if (!prefix || !candidate || prefix.length > candidate.length) return false;
    for (let i = 0; i < prefix.length; i++) {
        if (prefix[i] !== candidate[i]) return false;
    }
    return true;
}

function indexBlockPathsById(blocks = [], basePath = [], out = {}) {
    (Array.isArray(blocks) ? blocks : []).forEach((block, index) => {
        const path = [...basePath, index];
        if (block?._id) {
            out[block._id] = path;
        }
        const children = Array.isArray(block?.props?.children) ? block.props.children : [];
        if (children.length > 0) {
            indexBlockPathsById(children, path, out);
        }
    });
    return out;
}

export default function EventEditor() {
    const { slug, pageKey } = useParams();
    const toast = useToast();
    const currentPage = pageKey === "__root__" ? "/" : `/${pageKey}`;

    const [eventData, setEventData] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, path: null, block: null });
    const [addBlockTargetPath, setAddBlockTargetPath] = useState(null);
    const [themeConfig, setThemeConfig] = useState(null);
    const [editorViewport, setEditorViewport] = useState(BREAKPOINTS.desktop);
    const [mobileViewportPreset, setMobileViewportPreset] = useState(MOBILE_VIEWPORT_PRESETS[1].key);
    const [editorScale, setEditorScale] = useState(1);
    const [canvasHeight, setCanvasHeight] = useState(0);
    const [activeEditorTab, setActiveEditorTab] = useState(0);
    const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
    const { isOpen: isAddModalOpen, onOpen: openAddModal, onClose: closeAddModal } = useDisclosure();

    const [activeId, setActiveId] = useState(null);
    const [activeProps, setActiveProps] = useState(null);
    const [activeComponentType, setActiveComponentType] = useState(null);
    const previewViewportRef = useRef(null);
    const canvasMeasureRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }
        })
    );

    useEffect(() => {
        let isMounted = true;

        async function loadEvent() {
            try {
                const data = await getCampaignBySlug(slug);
                if (!isMounted) return;

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

                const normalizedPages = {};
                Object.keys(pageConfig).forEach((key) => {
                    normalizedPages[key] = ensureBlockIds(Array.isArray(pageConfig[key]) ? pageConfig[key] : [], [key]);
                });

                data.pages = normalizedPages;
                data.pages_meta = metaConfig;
                setThemeConfig(data.theme_config || data.theme || {
                    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                    fontFamily: "Inter, sans-serif",
                    color: "#ffffff"
                });
                setEventData(data);
            } catch (error) {
                console.error("Failed to load event:", error);
                if (isMounted) {
                    toast({ status: "error", title: "Error", description: "Failed to load event data." });
                }
            }
        }

        loadEvent();
        return () => {
            isMounted = false;
        };
    }, [slug, toast]);

    useEffect(() => {
        setSelectedPath(null);
    }, [currentPage]);

    useEffect(() => {
        if (activeEditorTab !== 0) {
            setIsInspectorCollapsed(true);
        } else if (selectedPath) {
            setIsInspectorCollapsed(false);
        }
    }, [activeEditorTab, selectedPath]);

    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const registryTypes = Object.keys(COMPONENT_REGISTRY);
        const missingMeta = registryTypes.filter((type) => !BLOCK_TYPE_META[type]);
        const missingInspector = registryTypes.filter((type) => !BLOCK_EDITOR_SUPPORTED_TYPES.includes(type));

        if (missingMeta.length > 0) {
            console.warn("[Editor] Missing block metadata for:", missingMeta);
        }
        if (missingInspector.length > 0) {
            console.warn("[Editor] Missing block inspector handling for:", missingInspector);
        }
    }, []);

    const currentBlocks = useMemo(
        () => eventData?.pages?.[currentPage] || [],
        [eventData?.pages, currentPage]
    );
    const blockPathById = useMemo(
        () => indexBlockPathsById(currentBlocks),
        [currentBlocks]
    );
    const selectedBlock = useMemo(() => (
        selectedPath ? getBlockAtPath(currentBlocks, selectedPath) : null
    ), [currentBlocks, selectedPath]);
    const previewSnappingEnabled = themeConfig?.snappingEnabled === "true" || themeConfig?.snappingEnabled === true;

    const activeViewportBase = VIEWPORT_OPTIONS.find((v) => v.key === editorViewport) || VIEWPORT_OPTIONS[0];
    const activeMobileViewport = MOBILE_VIEWPORT_PRESETS.find((v) => v.key === mobileViewportPreset) || MOBILE_VIEWPORT_PRESETS[1];
    const activeViewportStyle = editorViewport === BREAKPOINTS.mobile
        ? { ...activeViewportBase, canvasWidth: activeMobileViewport.canvasWidth }
        : activeViewportBase;

    useEffect(() => {
        const viewportEl = previewViewportRef.current;
        if (!viewportEl) return undefined;

        const recomputeScale = () => {
            const availableWidth = Math.max(320, viewportEl.clientWidth - 24);
            const logicalCanvasWidth = activeViewportStyle.canvasWidth || 1200;
            const nextScale = Math.min(1, availableWidth / logicalCanvasWidth);
            setEditorScale(Number(nextScale.toFixed(4)));
        };

        recomputeScale();

        const observer = new ResizeObserver(recomputeScale);
        observer.observe(viewportEl);
        window.addEventListener("resize", recomputeScale);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", recomputeScale);
        };
    }, [activeViewportStyle.canvasWidth]);

    useEffect(() => {
        const canvasEl = canvasMeasureRef.current;
        if (!canvasEl) return undefined;

        const recomputeHeight = () => {
            const nextHeight = canvasEl.offsetHeight || canvasEl.scrollHeight || 0;
            setCanvasHeight(nextHeight);
        };

        recomputeHeight();

        const observer = new ResizeObserver(recomputeHeight);
        observer.observe(canvasEl);
        return () => observer.disconnect();
    }, [currentBlocks, editorViewport, themeConfig]);

    const updateCurrentPageBlocks = (updater) => {
        setEventData((prev) => {
            const pages = { ...(prev?.pages || {}) };
            pages[currentPage] = updater([...(pages[currentPage] || [])]);
            return { ...prev, pages };
        });
    };

    const handleSave = async (e) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        try {
            await updateCampaign(slug, {
                blocks: {
                    pages: eventData.pages,
                    pages_meta: eventData.pages_meta || {}
                },
                theme: themeConfig
            });
            toast({ status: "success", title: "Changes Saved", description: "Event config updated successfully." });
        } catch (error) {
            console.error("Save failed:", error);
            toast({ status: "error", title: "Save Failed", description: "Could not save changes." });
        }
    };

    const handleBlockChange = (updatedBlock) => {
        if (!selectedPath) return;
        updateCurrentPageBlocks((blocks) => updateBlockAtPath(blocks, selectedPath, updatedBlock));
    };

    const handleSelectPath = (path) => {
        setSelectedPath(path);
        if (activeEditorTab === 0) {
            setIsInspectorCollapsed(false);
        }
    };

    const handleSelectBlockById = (blockId) => {
        if (!blockId) return;
        const path = blockPathById[blockId];
        if (!path) return;
        setActiveEditorTab(0);
        setSelectedPath(path);
        setIsInspectorCollapsed(false);
    };

    const handleDeleteBlock = (path) => {
        updateCurrentPageBlocks((blocks) => deleteBlockAtPath(blocks, path));
        if (selectedPath && (pathsEqual(selectedPath, path) || isDescendantPath(path, selectedPath))) {
            setSelectedPath(null);
        }
    };

    const handleDuplicateBlock = (path) => {
        updateCurrentPageBlocks((blocks) => duplicateBlockAtPath(blocks, path));
    };

    const handleContextMenu = (e, path, block) => {
        setContextMenu({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            path,
            block
        });
    };

    const handleContextAddLayer = (path) => {
        setContextMenu({ ...contextMenu, isOpen: false });
        setAddBlockTargetPath(path);
        openAddModal();
    };

    const handleMoveNode = (sourcePath, targetPath, placement) => {
        let movedPath = null;
        updateCurrentPageBlocks((blocks) => {
            const result = moveBlockByPath(blocks, sourcePath, targetPath, placement);
            movedPath = result.movedPath;
            return result.blocks;
        });
        if (movedPath) {
            setSelectedPath(movedPath);
        }
    };

    const handleAddBlock = (newBlock) => {
        const normalized = ensureBlockIds(
            [{ ...newBlock, _id: newBlock._id || `block-${Date.now()}` }],
            [Date.now()]
        )[0];
        updateCurrentPageBlocks((blocks) => [...blocks, normalized]);
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Esc to deselect/close inspector
            if (e.key === "Escape") {
                if (selectedPath) {
                    setSelectedPath(null);
                }
            }
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault();
                handleSave();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedPath, handleSave]);

    const getSectionId = (block, index) => block?._id || `section-${index}`;
    const getChildDragId = (child, sectionBlock, sectionIndex, childIndex) => (
        child?._id || `${getSectionId(sectionBlock, sectionIndex)}-child-${childIndex}`
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        for (const [sectionIndex, block] of currentBlocks.entries()) {
            const sectionId = getSectionId(block, sectionIndex);
            if (sectionId === active.id) {
                setActiveProps(resolveResponsiveProps(block.type, block.props || {}, editorViewport));
                setActiveComponentType(block.type);
                return;
            }

            const children = Array.isArray(block?.props?.children) ? block.props.children : [];
            const child = children.find((c, childIdx) => (
                getChildDragId(c, block, sectionIndex, childIdx) === active.id
            ));
            if (child) {
                setActiveProps(resolveResponsiveProps(child.type, child.props || {}, editorViewport));
                setActiveComponentType(child.type);
                return;
            }
        }
    };

    const handleDragEnd = (event) => {
        const { active, over, delta } = event;
        const safeScale = editorScale > 0 ? editorScale : 1;
        setActiveId(null);
        setActiveProps(null);
        setActiveComponentType(null);

        if (!over) return;

        const targetSectionId = over.id;
        const dragId = active.id;
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

            const children = Array.isArray(block?.props?.children) ? block.props.children : [];
            const cIndex = children.findIndex((c, childIdx) => (
                getChildDragId(c, block, i, childIdx) === dragId
            ));
            if (cIndex !== -1) {
                sourceSectionIndex = i;
                childIndex = cIndex;
                childData = children[cIndex];
            }
        }

        if (sourceSectionIndex === -1 || targetSectionIndex === -1 || !childData) return;

        const resolvedChildProps = resolveResponsiveProps(childData.type, childData.props || {}, editorViewport);
        const currentTop = parseFloat(resolvedChildProps.top) || 0;
        const currentLeft = parseFloat(resolvedChildProps.left) || 0;
        let finalTop = currentTop + (delta.y / safeScale);
        let finalLeft = currentLeft + (delta.x / safeScale);

        if (sourceSectionIndex !== targetSectionIndex) {
            const sourceSectionId = getSectionId(currentBlocks[sourceSectionIndex], sourceSectionIndex);
            const sourceEl = document.querySelector(`[data-section-id="${sourceSectionId}"]`);
            const targetEl = document.querySelector(`[data-section-id="${targetSectionId}"]`);

            if (sourceEl && targetEl) {
                const sourceRect = sourceEl.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();
                finalTop += ((sourceRect.top - targetRect.top) / safeScale);
                finalLeft += ((sourceRect.left - targetRect.left) / safeScale);
            }
        }

        const movedChild = {
            ...childData,
            _id: childData._id || dragId,
            props: applyResponsiveLayoutUpdates(
                childData.props || {},
                {
                    top: `${Math.round(finalTop)}px`,
                    left: `${Math.round(finalLeft)}px`
                },
                editorViewport
            )
        };

        updateCurrentPageBlocks((blocks) => {
            const next = [...blocks];
            const sourceSection = { ...next[sourceSectionIndex] };
            const targetSection = { ...next[targetSectionIndex] };

            const sourceChildren = [...(sourceSection.props?.children || [])];
            const targetChildren = [...(targetSection.props?.children || [])];

            if (sourceSectionIndex === targetSectionIndex) {
                sourceChildren[childIndex] = movedChild;
                sourceSection.props = { ...(sourceSection.props || {}), children: sourceChildren };
                next[sourceSectionIndex] = sourceSection;
                return next;
            }

            sourceChildren.splice(childIndex, 1);
            targetChildren.push(movedChild);

            sourceSection.props = { ...(sourceSection.props || {}), children: sourceChildren };
            targetSection.props = { ...(targetSection.props || {}), children: targetChildren };
            next[sourceSectionIndex] = sourceSection;
            next[targetSectionIndex] = targetSection;
            return next;
        });
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
            <Box flex="1" bg="gray.100" overflow="hidden" borderRight="1px solid #ddd" position="relative">
                <Box position="absolute" top={2} left={2} zIndex={20}>
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

                <Box position="absolute" top={2} right={2} zIndex={20}>
                    <HStack spacing={1} bg="whiteAlpha.900" p={1} borderRadius="md" shadow="sm">
                        {VIEWPORT_OPTIONS.map((option) => (
                            <Button
                                key={option.key}
                                size="xs"
                                variant={editorViewport === option.key ? "solid" : "ghost"}
                                colorScheme={editorViewport === option.key ? "blue" : "gray"}
                                onClick={() => setEditorViewport(option.key)}
                            >
                                {option.label}
                            </Button>
                        ))}
                        {editorViewport === BREAKPOINTS.mobile && (
                            <Select
                                size="xs"
                                w="190px"
                                bg="white"
                                value={mobileViewportPreset}
                                onChange={(e) => setMobileViewportPreset(e.target.value)}
                            >
                                {MOBILE_VIEWPORT_PRESETS.map((preset) => (
                                    <option key={preset.key} value={preset.key}>{preset.label}</option>
                                ))}
                            </Select>
                        )}
                    </HStack>
                </Box>

                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToWindowEdges]}
                >
                    <Box h="100%" pt={12} px={4} pb={4}>
                        <Box
                            ref={previewViewportRef}
                            h="100%"
                            overflow="auto"
                            scrollSnapType={previewSnappingEnabled ? "y mandatory" : "none"}
                            scrollBehavior={previewSnappingEnabled ? "smooth" : "auto"}
                            sx={{
                                "&::-webkit-scrollbar": { width: "10px", height: "10px" }
                            }}
                        >
                            <Flex justify="center" align="flex-start" minH="100%">
                                <Box
                                    w={`${Math.round(activeViewportStyle.canvasWidth * editorScale)}px`}
                                    minH={`${Math.round(Math.max(canvasHeight, 1) * editorScale)}px`}
                                >
                                    <Box
                                        ref={canvasMeasureRef}
                                        bg="white"
                                        shadow="lg"
                                        w={`${activeViewportStyle.canvasWidth}px`}
                                        transform={`scale(${editorScale})`}
                                        transformOrigin="top left"
                                    >
                                        <EngineRenderer
                                            eventData={{ ...eventData, theme_config: themeConfig }}
                                            blocksOverride={currentBlocks}
                                            isEditor={true}
                                            viewport={editorViewport}
                                            editorScale={editorScale}
                                            onSelectBlock={handleSelectBlockById}
                                            onBlockChange={(index, updatedProps) => {
                                                updateCurrentPageBlocks((blocks) => {
                                                    const next = [...blocks];
                                                    const current = next[index];
                                                    if (!current) return blocks;

                                                    next[index] = {
                                                        ...current,
                                                        props: applyResponsiveLayoutUpdates(
                                                            current.props || {},
                                                            updatedProps,
                                                            editorViewport
                                                        )
                                                    };
                                                    return next;
                                                });
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Flex>
                        </Box>
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

            <Box
                w="420px"
                bg="white"
                shadow="xl"
                zIndex={20}
                display="flex"
                flexDirection="column"
                position="relative"
                onContextMenu={(e) => {
                    e.preventDefault();
                    if (activeEditorTab === 0 && !selectedPath) {
                        handleContextMenu(e, null, null);
                    }
                }}
            >
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
                    <Tabs
                        colorScheme="purple"
                        size="sm"
                        isFitted
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        index={activeEditorTab}
                        onChange={setActiveEditorTab}
                    >
                        <TabList>
                            <Tab>Blocks</Tab>
                            <Tab>Global Theme</Tab>
                        </TabList>
                        <TabPanels flex="1" overflow="hidden" display="flex" flexDirection="column">
                            <TabPanel p={0} h="100%" display="flex" flexDirection="column" overflow="hidden">
                                <Box p={4} borderBottom="1px solid" borderColor="gray.100" bg="white" zIndex={2}>
                                    <Flex justify="space-between" align="center">
                                        <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color="gray.500">
                                            Layers
                                        </Text>
                                        <HStack>
                                            <IconButton icon={<MdAdd />} size="xs" onClick={openAddModal} aria-label="Add Block" />
                                        </HStack>
                                    </Flex>
                                </Box>

                                <Box flex="1" p={4} pt={2} overflowY="auto" sx={{
                                    "&::-webkit-scrollbar": { width: "4px" },
                                    "&::-webkit-scrollbar-track": { background: "transparent" },
                                    "&::-webkit-scrollbar-thumb": { background: "gray.200", borderRadius: "10px" },
                                    "&::-webkit-scrollbar-thumb:hover": { background: "gray.300" }
                                }}>

                                    <BlockList
                                        blocks={currentBlocks}
                                        selectedPath={selectedPath}
                                        onSelectPath={handleSelectPath}
                                        onDeletePath={handleDeleteBlock}
                                        onMoveNode={handleMoveNode}
                                        onContextMenu={handleContextMenu}
                                    />
                                </Box>
                            </TabPanel>

                            <TabPanel h="100%" overflowY="auto">
                                <VStack spacing={4} align="stretch" mt={2}>
                                    <FormControl>
                                        <FormLabel fontSize="sm">Background Gradient / Color</FormLabel>
                                        <Input
                                            size="sm"
                                            value={themeConfig?.background || ""}
                                            onChange={(e) => setThemeConfig((prev) => ({ ...prev, background: e.target.value }))}
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
                                                        w="100%"
                                                        h="120px"
                                                        objectFit="cover"
                                                    />
                                                    <IconButton
                                                        icon={<MdDelete />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        position="absolute"
                                                        top={1}
                                                        right={1}
                                                        onClick={() => setThemeConfig((prev) => ({ ...prev, backgroundImage: "" }))}
                                                        aria-label="Clear Background"
                                                    />
                                                </Box>
                                            ) : (
                                                <Box
                                                    h="80px"
                                                    border="2px dashed"
                                                    borderColor="gray.200"
                                                    borderRadius="md"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    bg="gray.50"
                                                >
                                                    <Text fontSize="xs" color="gray.400">No background image</Text>
                                                </Box>
                                            )}
                                            <HStack>
                                                <Input
                                                    size="sm"
                                                    placeholder="URL or select..."
                                                    value={themeConfig?.backgroundImage || ""}
                                                    onChange={(e) => setThemeConfig((prev) => ({ ...prev, backgroundImage: e.target.value }))}
                                                />
                                                <MediaPickerModal onSelect={(url) => setThemeConfig((prev) => ({ ...prev, backgroundImage: url }))} />
                                            </HStack>
                                        </VStack>
                                    </FormControl>

                                    <FormControl>
                                        <FormLabel fontSize="sm">Font Family</FormLabel>
                                        <Select
                                            size="sm"
                                            value={themeConfig?.fontFamily || "Inter, sans-serif"}
                                            onChange={(e) => setThemeConfig((prev) => ({ ...prev, fontFamily: e.target.value }))}
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
                                                type="color"
                                                w="50px"
                                                size="sm"
                                                p={0}
                                                value={themeConfig?.color || "#ffffff"}
                                                onChange={(e) => setThemeConfig((prev) => ({ ...prev, color: e.target.value }))}
                                            />
                                            <Input
                                                size="sm"
                                                value={themeConfig?.color || "#ffffff"}
                                                onChange={(e) => setThemeConfig((prev) => ({ ...prev, color: e.target.value }))}
                                            />
                                        </HStack>
                                    </FormControl>

                                    <FormControl display="flex" alignItems="center">
                                        <FormLabel fontSize="sm" mb="0">Enable Scroll Snapping</FormLabel>
                                        <Switch
                                            isChecked={themeConfig?.snappingEnabled === "true" || themeConfig?.snappingEnabled === true}
                                            onChange={(e) => setThemeConfig((prev) => ({ ...prev, snappingEnabled: e.target.checked }))}
                                        />
                                    </FormControl>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Flex>

                {activeEditorTab === 0 && selectedBlock && (
                    <Box
                        position="absolute"
                        top="73px"
                        left="0"
                        right="0"
                        bottom="0"
                        bg="rgba(188, 177, 177, 0.13)"

                        backdropFilter="blur(18px) saturate(180%)"
                        borderTop="1px solid"
                        borderColor="whiteAlpha.300"
                        boxShadow="0 8px 32px rgba(0,0,0,0.2)"
                        zIndex={30}
                        display="flex"
                        flexDirection="column"
                        animation="fadeIn 0.25s ease-out"
                    >
                        <style>
                            {`
                                @keyframes fadeIn {
                                    from { opacity: 0; transform: translateY(10px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}
                        </style>
                        <Flex p={4} borderBottom="1px solid rgba(0,0,0,0.05)" align="center" justify="space-between" bg="whiteAlpha.400">
                            <HStack spacing={2}>
                                <Badge colorScheme="purple" variant="subtle" px={2} py={0.5} borderRadius="full">
                                    {String(selectedBlock.type || "block").toUpperCase()}
                                </Badge>
                                <Text fontWeight="bold" fontSize="sm" color="gray.700">
                                    Inspector
                                </Text>
                            </HStack>
                            <Button
                                size="sm"
                                variant="ghost"
                                colorScheme="gray"
                                onClick={() => setSelectedPath(null)}
                            >
                                Close
                            </Button>
                        </Flex>

                        <Box flex="1" overflowY="auto" p={4} sx={{
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: 'full' }
                        }}>
                            <BlockEditor
                                block={selectedBlock}
                                onChange={handleBlockChange}
                                activeViewport={editorViewport}
                                responsiveBuilderV2={RESPONSIVE_BUILDER_V2}
                            />
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Context Menu */}
            {
                contextMenu.isOpen && (
                    <Portal>
                        <Box
                            position="fixed"
                            top={0}
                            left={0}
                            right={0}
                            bottom={0}
                            zIndex={999998}
                            onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ ...contextMenu, isOpen: false });
                            }}
                        />
                        <Box
                            position="fixed"
                            top={contextMenu.y}
                            left={contextMenu.x}
                            bg="white"
                            shadow="2xl"
                            borderRadius="lg"
                            border="1px solid rgba(0,0,0,0.1)"
                            py={1}
                            minW="180px"
                            zIndex={999999}
                            animation="menuFadeIn 0.15s ease-out"
                            style={{
                                backdropFilter: "blur(10px)",
                                backgroundColor: "rgba(255, 255, 255, 0.9)"
                            }}
                        >
                            <style>
                                {`
                                @keyframes menuFadeIn {
                                    from { opacity: 0; transform: scale(0.95); }
                                    to { opacity: 1; transform: scale(1); }
                                }
                            `}
                            </style>
                            <VStack align="stretch" spacing={0}>
                                {!contextMenu.block && (
                                    <HStack
                                        px={3}
                                        py={2}
                                        cursor="pointer"
                                        _hover={{ bg: "purple.50", color: "purple.600" }}
                                        onClick={() => handleContextAddLayer(null)}
                                        fontSize="sm"
                                    >
                                        <Icon as={MdAddCircleOutline} />
                                        <Text fontWeight="medium">Add Layer</Text>
                                    </HStack>
                                )}
                                {contextMenu.block && (
                                    <>
                                        {(contextMenu.block?.type === "section" || contextMenu.block?.type === "card") && (
                                            <>
                                                <HStack
                                                    px={3}
                                                    py={2}
                                                    cursor="pointer"
                                                    _hover={{ bg: "purple.50", color: "purple.600" }}
                                                    onClick={() => handleContextAddLayer(contextMenu.path)}
                                                    fontSize="sm"
                                                >
                                                    <Icon as={MdAddCircleOutline} />
                                                    <Text fontWeight="medium">Add Inside</Text>
                                                </HStack>
                                                <Box h="1px" bg="gray.100" my={1} />
                                            </>
                                        )}
                                        <HStack
                                            px={3}
                                            py={2}
                                            cursor="pointer"
                                            _hover={{ bg: "gray.50" }}
                                            onClick={() => {
                                                handleDuplicateBlock(contextMenu.path);
                                                setContextMenu({ ...contextMenu, isOpen: false });
                                            }}
                                            fontSize="sm"
                                        >
                                            <Icon as={MdContentCopy} />
                                            <Text fontWeight="medium">Duplicate</Text>
                                        </HStack>
                                    </>
                                )}
                                {contextMenu.path && (
                                    <HStack
                                        px={3}
                                        py={2}
                                        cursor="pointer"
                                        _hover={{ bg: "red.50", color: "red.600" }}
                                        onClick={() => {
                                            handleDeleteBlock(contextMenu.path);
                                            setContextMenu({ ...contextMenu, isOpen: false });
                                        }}
                                        fontSize="sm"
                                    >
                                        <Icon as={MdDelete} />
                                        <Text fontWeight="medium">Delete</Text>
                                    </HStack>
                                )}
                            </VStack>
                        </Box>
                    </Portal>
                )
            }

            <AddBlockModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    closeAddModal();
                    setAddBlockTargetPath(null);
                }}
                onAddBlock={(newBlock) => {
                    if (addBlockTargetPath) {
                        const normalized = ensureBlockIds([newBlock], [Date.now()])[0];
                        updateCurrentPageBlocks(blocks => insertInsidePath(blocks, addBlockTargetPath, normalized).blocks);
                        setAddBlockTargetPath(null);
                    } else {
                        handleAddBlock(newBlock);
                    }
                }}
            />
        </Flex >
    );
}
