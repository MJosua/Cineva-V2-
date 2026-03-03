import { Reorder } from "framer-motion";
import { Box, Text, HStack, IconButton, Badge, Icon, Tooltip } from "@chakra-ui/react";
import { MdDragIndicator, MdDelete, MdWeb, MdViewDay, MdGridView, MdViewCarousel, MdTextFields, MdList, MdReceipt, MdCode, MdQrCode } from "react-icons/md";

// ── Block type metadata ─────────────────────────────────────────────────────
const BLOCK_META = {
    hero: { icon: MdViewDay, color: "blue", label: "Hero", preview: (p) => p.title || "Hero Section" },
    header: { icon: MdWeb, color: "blue", label: "Header", preview: (p) => p.logo ? "Logo + Links" : "Navigation Bar" },
    navbar: { icon: MdWeb, color: "blue", label: "Navbar", preview: (p) => p.logo ? "Logo + Links" : "Navigation Bar" },
    card: { icon: MdGridView, color: "cyan", label: "Card", preview: (p) => p.title || "Card Block" },
    section: { icon: MdViewDay, color: "cyan", label: "Section", preview: (p) => `${(p.children || []).length} block(s) inside` },
    flip: { icon: MdViewCarousel, color: "pink", label: "Slideshow", preview: (p) => `${(p.images || []).length} image(s)` },
    text: { icon: MdTextFields, color: "gray", label: "Text", preview: (p) => p.content?.replace(/<[^>]+>/g, "").slice(0, 40) || "Rich Text" },
    list: { icon: MdList, color: "orange", label: "List", preview: (p) => `${(p.items || []).length} item(s)` },
    couponForm: { icon: MdReceipt, color: "green", label: "Form", preview: (p) => p.title || "Dynamic Form" },
    urlCoupon: { icon: MdQrCode, color: "red", label: "Auto Fetch Coupon", preview: (p) => p.title || "URL-Code Verifier" },
    customHtml: { icon: MdCode, color: "blackAlpha", label: "HTML", preview: () => "Custom HTML Block" },
};

function getBlockMeta(type) {
    return BLOCK_META[type] || { icon: MdCode, color: "gray", label: type, preview: () => type };
}

export default function BlockList({ blocks, onReorder, onSelect, onDelete, selectedIndex }) {
    return (
        <Reorder.Group axis="y" values={blocks} onReorder={onReorder}>
            {blocks.map((block, index) => {
                const meta = getBlockMeta(block.type);
                const isSelected = selectedIndex === index;

                return (
                    <Reorder.Item key={block._id || index} value={block}>
                        <Box
                            mb={2}
                            bg={isSelected ? "brand.50" : "white"}
                            borderWidth="1.5px"
                            borderColor={isSelected ? "brand.400" : "gray.200"}
                            borderRadius="lg"
                            shadow={isSelected ? "md" : "sm"}
                            overflow="hidden"
                            transition="all 0.15s"
                            _hover={{ shadow: "md", borderColor: isSelected ? "brand.400" : "gray.300" }}
                            cursor="pointer"
                            onClick={() => onSelect(index)}
                        >
                            <HStack spacing={0}>
                                {/* Drag handle column */}
                                <Box px={2} py={4} cursor="grab" color="gray.300" _hover={{ color: "gray.500" }} flexShrink={0}>
                                    <MdDragIndicator size={18} />
                                </Box>

                                {/* Block type icon */}
                                <Box
                                    w="6px"
                                    alignSelf="stretch"
                                    bg={`${meta.color}.400`}
                                    flexShrink={0}
                                />

                                {/* Content */}
                                <Box flex={1} px={3} py={2.5} minW={0}>
                                    <HStack spacing={2} mb={0.5}>
                                        <Icon as={meta.icon} boxSize={3.5} color={`${meta.color}.500`} flexShrink={0} />
                                        <Text fontWeight="bold" fontSize="xs" textTransform="uppercase" color={`${meta.color}.600`} letterSpacing="wide">
                                            {meta.label}
                                        </Text>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                        {meta.preview(block.props || {})}
                                    </Text>
                                </Box>

                                {/* Delete */}
                                <Box flexShrink={0} pr={2}>
                                    <Tooltip label="Remove block" hasArrow placement="left">
                                        <IconButton
                                            icon={<MdDelete />}
                                            size="xs"
                                            colorScheme="red"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                                            aria-label="Delete block"
                                        />
                                    </Tooltip>
                                </Box>
                            </HStack>
                        </Box>
                    </Reorder.Item>
                );
            })}
        </Reorder.Group>
    );
}
