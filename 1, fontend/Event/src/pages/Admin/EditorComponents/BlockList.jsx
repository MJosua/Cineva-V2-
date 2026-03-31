import { useMemo, useState } from "react";
import { Box, Text, HStack, IconButton, Icon, Tooltip, Badge, Button, VStack } from "@chakra-ui/react";
import {
    MdDelete,
    MdDragIndicator,
    MdExpandMore,
    MdChevronRight,
    MdUnfoldLess,
    MdUnfoldMore
} from "react-icons/md";
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { getBlockMeta } from "./blockCatalog";
import {
    encodePath,
    decodePath,
    getBlockAtPath,
    canHaveChildren,
    collectCollapsiblePaths,
    pathsEqual
} from "./blockTreeUtils";

function TreeNode({
    block,
    path,
    depth,
    selectedPath,
    collapsedMap,
    onToggleCollapse,
    onSelectPath,
    onDeletePath,
    onContextMenu
}) {
    const pathKey = encodePath(path);
    const meta = getBlockMeta(block?.type);
    const children = Array.isArray(block?.props?.children) ? block.props.children : [];
    const layerName = (block?.props?.layerName || "").trim();
    const isContainer = canHaveChildren(block);
    const hasChildren = isContainer && children.length > 0;
    const isCollapsed = !!collapsedMap[pathKey];
    const isSelected = pathsEqual(selectedPath || [], path);

    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        transform,
        transition,
        isDragging
    } = useDraggable({
        id: `drag:${pathKey}`
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop:${pathKey}`
    });

    const setRefs = (node) => {
        setDragRef(node);
        setDropRef(node);
    };

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <>
            <Box
                ref={setRefs}
                style={style}
                mb={1}
                borderWidth="1px"
                borderColor={isOver ? "blue.300" : isSelected ? "brand.400" : "gray.200"}
                bg={isSelected ? "brand.50" : "white"}
                borderRadius="md"
                py={1.5}
                px={2}
                pl={`${(depth * 14) + 6}px`}
                shadow={isSelected ? "sm" : "none"}
                _hover={{ borderColor: isSelected ? "brand.400" : "gray.300" }}
                onClick={() => onSelectPath(path)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onContextMenu) {
                        onContextMenu(e, path, block);
                    }
                }}
                cursor="pointer"
            >
                <HStack spacing={1}>
                    <Box minW="20px">
                        {hasChildren ? (
                            <IconButton
                                icon={isCollapsed ? <MdChevronRight /> : <MdExpandMore />}
                                size="xs"
                                variant="ghost"
                                aria-label="Toggle children"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleCollapse(pathKey);
                                }}
                            />
                        ) : null}
                    </Box>

                    <Box
                        {...attributes}
                        {...listeners}
                        cursor="grab"
                        color="gray.400"
                        _hover={{ color: "gray.600" }}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        minW="14px"
                    >
                        <MdDragIndicator size={16} />
                    </Box>

                    <Box w="4px" alignSelf="stretch" borderRadius="full" bg={`${meta.color}.400`} />

                    <Icon as={meta.icon} boxSize={3.5} color={`${meta.color}.600`} />

                    <VStack align="start" spacing={0} flex={1} minW={0}>
                        <HStack spacing={1.5}>
                            <Text fontWeight="bold" fontSize="2xs" textTransform="uppercase" color={`${meta.color}.700`} noOfLines={1}>
                                {meta.label}
                            </Text>
                            {layerName ? (
                                <Text fontSize="2xs" fontWeight="medium" color="gray.700" noOfLines={1}>
                                    • {layerName}
                                </Text>
                            ) : null}
                            {hasChildren ? (
                                <Badge colorScheme="gray" fontSize="2xs">{children.length}</Badge>
                            ) : null}
                        </HStack>
                        <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                            {meta.preview ? meta.preview(block.props || {}) : ""}
                        </Text>
                    </VStack>

                    <Tooltip label="Delete block" hasArrow placement="left">
                        <IconButton
                            icon={<MdDelete />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            aria-label="Delete block"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeletePath(path);
                            }}
                        />
                    </Tooltip>
                </HStack>
            </Box>

            {hasChildren && !isCollapsed && children.map((child, childIndex) => (
                <TreeNode
                    key={child._id || `${pathKey}.${childIndex}`}
                    block={child}
                    path={[...path, childIndex]}
                    depth={depth + 1}
                    selectedPath={selectedPath}
                    collapsedMap={collapsedMap}
                    onToggleCollapse={onToggleCollapse}
                    onSelectPath={onSelectPath}
                    onDeletePath={onDeletePath}
                    onContextMenu={onContextMenu}
                />
            ))}
        </>
    );
}

export default function BlockList({
    blocks = [],
    selectedPath,
    onSelectPath,
    onDeletePath,
    onMoveNode,
    onContextMenu
}) {
    const [collapsedMap, setCollapsedMap] = useState({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 }
        })
    );

    const collapsiblePaths = useMemo(() => collectCollapsiblePaths(blocks), [blocks]);

    const handleToggleCollapse = (pathKey) => {
        setCollapsedMap((prev) => ({
            ...prev,
            [pathKey]: !prev[pathKey]
        }));
    };

    const handleCollapseAll = () => {
        const next = {};
        collapsiblePaths.forEach((key) => {
            next[key] = true;
        });
        setCollapsedMap(next);
    };

    const handleExpandAll = () => {
        setCollapsedMap({});
    };

    const handleDragEnd = ({ active, over }) => {
        if (!active || !over) return;

        const activeId = String(active.id || "");
        const overId = String(over.id || "");
        if (!activeId.startsWith("drag:") || !overId.startsWith("drop:")) return;

        const sourcePath = decodePath(activeId.replace("drag:", ""));
        const targetPath = decodePath(overId.replace("drop:", ""));
        if (sourcePath.length === 0 || targetPath.length === 0) return;
        if (pathsEqual(sourcePath, targetPath)) return;

        const targetBlock = getBlockAtPath(blocks, targetPath);
        const sameParent = pathsEqual(sourcePath.slice(0, -1), targetPath.slice(0, -1));
        const placement = canHaveChildren(targetBlock) && !sameParent ? "inside" : "before";
        onMoveNode(sourcePath, targetPath, placement);
    };

    return (
        <Box h="55%" minH={0} display="flex" flexDirection="column" overflow="hidden"
            position="sticky"
            top={0}
            zIndex={10}

        >
            <HStack
                justify="space-between"
                mb={3}
                bg="white"
                py={2}
                zIndex={10}
                borderBottom="1px solid"
                borderColor="gray.50"
            >
                <HStack spacing={1}>
                    <Button
                        size="xs"
                        variant="ghost"
                        leftIcon={<MdUnfoldLess />}
                        onClick={handleCollapseAll}
                        _hover={{ bg: "gray.100" }}
                    >
                        Collapse all
                    </Button>
                    <Button
                        size="xs"
                        variant="ghost"
                        leftIcon={<MdUnfoldMore />}
                        onClick={handleExpandAll}
                        _hover={{ bg: "gray.100" }}
                    >
                        Expand all
                    </Button>
                </HStack>
                <Badge colorScheme="gray" variant="subtle" fontSize="2xs" px={2} borderRadius="full">
                    {blocks.length} ROOT
                </Badge>
            </HStack>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <Box
                    h="100%"
                    flex="1"
                    overflowY="auto"
                    minH={0}
                    overflowX="hidden"
                    pb={10} // extra space at bottom
                    sx={{
                        "&::-webkit-scrollbar": { width: "4px" },
                        "&::-webkit-scrollbar-track": { background: "transparent" },
                        "&::-webkit-scrollbar-thumb": { background: "gray.200", borderRadius: "10px" },
                        "&::-webkit-scrollbar-thumb:hover": { background: "gray.300" }
                    }}
                >
                    {blocks.length === 0 ? (
                        <Text fontSize="xs" color="gray.400">No blocks yet</Text>
                    ) : (
                        blocks.map((block, index) => (
                            <TreeNode
                                key={block._id || index}
                                block={block}
                                path={[index]}
                                depth={0}
                                selectedPath={selectedPath}
                                collapsedMap={collapsedMap}
                                onToggleCollapse={handleToggleCollapse}
                                onSelectPath={onSelectPath}
                                onDeletePath={onDeletePath}
                                onContextMenu={onContextMenu}
                            />
                        ))
                    )}
                </Box>
            </DndContext>
        </Box>
    );
}
