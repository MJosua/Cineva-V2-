import { Box, FormControl, FormLabel, Input, VStack, Heading, Select, Button, Text, HStack, IconButton, useDisclosure, Textarea, Tag, TagLabel, TagCloseButton, Wrap, Switch, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Code } from "@chakra-ui/react";
import { MdAdd, MdDelete, MdEdit, MdArrowUpward, MdArrowDownward, MdSettings, MdDragIndicator } from "react-icons/md";
import { Reorder, useDragControls } from "framer-motion";
import RichTextEditor from "./RichTextEditor";
import MediaPickerModal from "./MediaPickerModal";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPoolsByEvent } from "../../../services/eventEngineApi";
import ImageField from "./ImageField";
import ColorPicker from "./ColorPicker";
import AddBlockModal from "./AddBlockModal";
import {
    applyResponsiveLayoutUpdates,
    BREAKPOINTS,
    isLayoutOverrideKey,
    resolveResponsiveProps
} from "../../../components/Engine/responsiveLayout";



const FONT_OPTIONS = [
    { label: "Default (Inter)", value: "inter" },
    { label: "Poppins", value: "Poppins" },
    { label: "Montserrat", value: "Montserrat" },
    { label: "Roboto", value: "Roboto" },
    { label: "Open Sans", value: "Open Sans" },
    { label: "Playfair Display", value: "Playfair Display" },
    { label: "Bebas Neue", value: "Bebas Neue" },
    { label: "Courier New", value: "Courier New" },
];

function ReorderFieldItem({ value, children }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item value={value} dragListener={false} dragControls={dragControls}>
            {children({ startDrag: (event) => dragControls.start(event) })}
        </Reorder.Item>
    );
}

export default function BlockEditor({ block, onChange, activeViewport = BREAKPOINTS.desktop, responsiveBuilderV2 = false }) {
    const [newLinkLabel, setNewLinkLabel] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState("text");
    const [editingFieldIndex, setEditingFieldIndex] = useState(null); // vite refresh trigger
    const [pools, setPools] = useState([]);
    const { slug } = useParams();

    // Load pools for pool picker (urlCoupon block)
    useEffect(() => {
        if (!slug) return;
        getPoolsByEvent(slug)
            .then(data => setPools(Array.isArray(data) ? data : []))
            .catch(() => setPools([]));
    }, [slug]);

    // Normalize fields: ensure every field has a unique _id for stable D&D keys
    useEffect(() => {
        if (block?.props?.fields && Array.isArray(block.props.fields)) {
            const hasMissingIds = block.props.fields.some(f => !f._id);
            if (hasMissingIds) {
                const normalizedFields = block.props.fields.map(f =>
                    f._id ? f : { ...f, _id: `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}` }
                );
                onChange({ ...block, props: { ...(block.props || {}), fields: normalizedFields } });
            }
        }
    }, [block, onChange]);


    if (!block) return <Box p={4} textAlign="center" color="gray.500">Select a block to edit</Box>;

    const resolvedProps = resolveResponsiveProps(block.type, block.props || {}, activeViewport);
    const blockForView = responsiveBuilderV2
        ? { ...block, props: { ...(block.props || {}), ...resolvedProps } }
        : block;

    const handleChange = (key, value) => {
        let finalValue = value;
        if (key === "fields" && Array.isArray(value)) {
            finalValue = value.map(f => f._id ? f : { ...f, _id: `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}` });
        }

        const nextProps = (responsiveBuilderV2 && isLayoutOverrideKey(key))
            ? applyResponsiveLayoutUpdates(block.props || {}, { [key]: finalValue }, activeViewport)
            : { ...(block.props || {}), [key]: finalValue };

        onChange({ ...block, props: nextProps });
    };

    const removeImage = (i) => handleChange("images", (block.props.images || []).filter((_, j) => j !== i));
    const addLink = () => { if (newLinkLabel.trim()) { handleChange("links", [...(block.props.links || []), { label: newLinkLabel, url: newLinkUrl }]); setNewLinkLabel(""); setNewLinkUrl(""); } };
    const removeLink = (i) => handleChange("links", (block.props.links || []).filter((_, j) => j !== i));
    const addField = () => {
        if (newFieldName.trim()) {
            const newId = `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
            handleChange("fields", [...(block.props.fields || []), { _id: newId, name: newFieldName.trim(), label: newFieldLabel.trim() || newFieldName.trim(), type: newFieldType }]);
            setNewFieldName(""); setNewFieldLabel(""); setNewFieldType("text");
        }
    };
    const removeField = (i) => { handleChange("fields", (block.props.fields || []).filter((_, j) => j !== i)); if (editingFieldIndex === i) setEditingFieldIndex(null); };
    const updateField = (i, key, value) => { const f = [...(block.props.fields || [])]; f[i] = { ...f[i], [key]: value }; handleChange("fields", f); };

    return (
        <Box bg="white" p={4} borderRadius="md" shadow="sm" maxH="100%" overflowY="auto">
            <Heading size="sm" mb={4}>Edit {block.type}</Heading>
            <VStack spacing={4} align="stretch">
                <BlockSettings
                    block={blockForView}
                    handleChange={handleChange}
                    pools={pools}
                    editingFieldIndex={editingFieldIndex}
                    setEditingFieldIndex={setEditingFieldIndex}
                    updateField={updateField}
                    removeField={removeField}
                    newFieldName={newFieldName}
                    setNewFieldName={setNewFieldName}
                    newFieldLabel={newFieldLabel}
                    setNewFieldLabel={setNewFieldLabel}
                    newFieldType={newFieldType}
                    setNewFieldType={setNewFieldType}
                    addField={addField}
                    newLinkLabel={newLinkLabel}
                    setNewLinkLabel={setNewLinkLabel}
                    newLinkUrl={newLinkUrl}
                    setNewLinkUrl={setNewLinkUrl}
                    addLink={addLink}
                    removeLink={removeLink}
                    removeImage={removeImage}
                    activeViewport={activeViewport}
                    responsiveBuilderV2={responsiveBuilderV2}
                />
            </VStack >
        </Box >
    );
}

function BlockSettings({
    block,
    handleChange,
    pools,
    editingFieldIndex,
    setEditingFieldIndex,
    updateField,
    removeField,
    newFieldName,
    setNewFieldName,
    newFieldLabel,
    setNewFieldLabel,
    newFieldType,
    setNewFieldType,
    addField,
    newLinkLabel,
    setNewLinkLabel,
    newLinkUrl,
    setNewLinkUrl,
    addLink,
    removeLink,
    removeImage,
    activeViewport = BREAKPOINTS.desktop,
    responsiveBuilderV2 = false
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingChildIndex, setEditingChildIndex] = useState(null);

    const handleAddChild = (newBlock) => {
        handleChange("children", [...(block.props.children || []), newBlock]);
        onClose();
    };

    const handleRemoveChild = (index) => {
        handleChange("children", (block.props.children || []).filter((_, i) => i !== index));
        if (editingChildIndex === index) setEditingChildIndex(null);
    };

    const handleChildChange = (index, updatedChild) => {
        const newChildren = [...(block.props.children || [])];
        newChildren[index] = updatedChild;
        handleChange("children", newChildren);
    };

    const currentChild = editingChildIndex !== null ? (block.props.children || [])[editingChildIndex] : null;
    const hiddenByBreakpoint = block.props.hiddenByBreakpoint || {};
    const setHiddenInViewport = (breakpoint, shouldHide) => {
        const next = {
            ...hiddenByBreakpoint,
            [breakpoint]: shouldHide
        };
        Object.keys(next).forEach((key) => {
            if (!next[key]) delete next[key];
        });
        handleChange("hiddenByBreakpoint", next);
    };
    const parseOpacity = (value) => {
        const parsed = Number.parseFloat(value);
        if (!Number.isFinite(parsed)) return 1;
        return Math.min(1, Math.max(0, parsed));
    };
    const opacityValue = parseOpacity(block.props.opacity);
    const handleOpacityChange = (rawValue) => {
        if (rawValue === "") return;
        const clamped = Number(parseOpacity(rawValue).toFixed(2));
        handleChange("opacity", clamped);
    };

    return (
        <VStack spacing={4} align="stretch"
            bg="rgba(185, 181, 181, 0.04)"
            backdropFilter="blur(18px) saturate(180%)"
        >
            {/* Layer ID / Administrative Label */}
            <FormControl>
                <FormLabel fontSize="2xs" color="gray.500" mb={1}>Layer Name (Internal)</FormLabel>
                <Input size="xs" placeholder="e.g. Hero Text, Bottom Form" value={block.props.layerName || ""} onChange={(e) => handleChange("layerName", e.target.value)} />
            </FormControl>

            <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2} bg="gray.50">
                <Text fontSize="2xs" fontWeight="bold" color="gray.600" mb={2}>
                    Visibility by Viewport
                </Text>
                <HStack spacing={4} align="start">
                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="2xs" mb={0}>Hide Desktop</FormLabel>
                        <Switch
                            size="sm"
                            isChecked={!!hiddenByBreakpoint.desktop}
                            onChange={(e) => setHiddenInViewport(BREAKPOINTS.desktop, e.target.checked)}
                        />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="2xs" mb={0}>Hide Tablet</FormLabel>
                        <Switch
                            size="sm"
                            isChecked={!!hiddenByBreakpoint.tablet}
                            onChange={(e) => setHiddenInViewport(BREAKPOINTS.tablet, e.target.checked)}
                        />
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                        <FormLabel fontSize="2xs" mb={0}>Hide Mobile</FormLabel>
                        <Switch
                            size="sm"
                            isChecked={!!hiddenByBreakpoint.mobile}
                            onChange={(e) => setHiddenInViewport(BREAKPOINTS.mobile, e.target.checked)}
                        />
                    </FormControl>
                </HStack>
            </Box>

            {/* Block Content (Switch by Type) */}
            {/* TEXT BLOCK */}
            {block.type === 'text' && (
                <>
                    <RichTextEditor key={block._id || block.props?._id || 'rte-text'} value={block.props.content || ""} onChange={(val) => handleChange("content", val)} />
                    <HStack mt={2}>
                        <FormControl><FormLabel fontSize="xs">Alignment</FormLabel>
                            <Select size="sm" value={block.props.align || "center"} onChange={(e) => handleChange("align", e.target.value)}>
                                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                            </Select>
                        </FormControl>
                        <ColorPicker label="Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                    </HStack>
                </>
            )}

            {/* HERO BLOCK */}
            {block.type === 'hero' && (
                <>
                    <FormControl><FormLabel fontSize="xs">Title</FormLabel><Input size="sm" value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                    <FormControl mt={2}><FormLabel fontSize="xs">Subtitle</FormLabel><Input size="sm" value={block.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} /></FormControl>
                    <ImageField label="Hero Image" value={block.props.imageUrl} onChange={(v) => handleChange("imageUrl", v)} />

                    <Accordion allowToggle mt={4}><AccordionItem border="none">
                        <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm" fontWeight="bold">Styling & Colors</Text><AccordionIcon ml="auto" /></AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                                <HStack>
                                    <ColorPicker label="Title" value={block.props.titleColor} onChange={(v) => handleChange("titleColor", v)} />
                                    <ColorPicker label="Text" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                                </HStack>
                                <ColorPicker label="Background" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />

                                <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <Text fontSize="xs" fontWeight="bold" mb={2}>Image Scale</Text>
                                    <HStack spacing={4}>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Width (e.g. 100%, 200px)</Text>
                                            <Input size="xs" value={block.props.imageWidth || ""} placeholder="auto" onChange={(e) => handleChange("imageWidth", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Max Height</Text>
                                            <Input size="xs" value={block.props.imageHeight || ""} placeholder="150px" onChange={(e) => handleChange("imageHeight", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>

                                <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <Text fontSize="xs" fontWeight="bold" mb={2}>Layout (Margin & Padding)</Text>
                                    <HStack spacing={4}>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Margin</Text>
                                            <Input size="xs" value={block.props.margin || ""} onChange={(e) => handleChange("margin", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Padding</Text>
                                            <Input size="xs" value={block.props.padding || ""} onChange={(e) => handleChange("padding", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem></Accordion>
                </>
            )}

            {/* HEADER/NAVBAR */}
            {(block.type === 'header' || block.type === 'navbar') && (
                <>
                    <ImageField label="Logo Image" value={block.props.logo} onChange={(v) => handleChange("logo", v)} />
                    <HStack mt={2}>
                        <ColorPicker label="Background" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                        <ColorPicker label="Menu Text" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                    </HStack>
                    <Box mt={4}>
                        <Text fontWeight="bold" fontSize="sm" mb={2}>Menu Links</Text>
                        <Wrap mb={2}>{(block.props.links || []).map((l, i) => <Tag key={i} colorScheme="blue"><TagLabel>{l.label}</TagLabel><TagCloseButton onClick={() => removeLink(i)} /></Tag>)}</Wrap>
                        <HStack><Input placeholder="Label" size="xs" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} /><Input placeholder="URL" size="xs" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} /><Button size="xs" onClick={addLink}>Add</Button></HStack>
                    </Box>
                </>
            )}

            {/* SECTION */}
            {block.type === 'section' && (
                <>
                    <Accordion allowToggle defaultIndex={[0]}><AccordionItem border="none">
                        <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm" fontWeight="bold">Section Styling</Text><AccordionIcon ml="auto" /></AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                                <ColorPicker label="Background Color" value={block.props.background} onChange={(v) => handleChange("background", v)} />
                                <ImageField label="Background Image" value={block.props.backgroundImage} onChange={(v) => handleChange("backgroundImage", v)} />
                                <HStack spacing={4} borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <VStack align="start" spacing={1} flex={1}>
                                        <Text fontSize="2xs" color="gray.500">Margin</Text>
                                        <Input size="xs" value={block.props.margin || ""} onChange={(e) => handleChange("margin", e.target.value)} />
                                    </VStack>
                                    <VStack align="start" spacing={1} flex={1}>
                                        <Text fontSize="2xs" color="gray.500">Padding</Text>
                                        <Input size="xs" value={block.props.padding || ""} onChange={(e) => handleChange("padding", e.target.value)} />
                                    </VStack>
                                </HStack>
                                <FormControl mt={2}>
                                    <FormLabel fontSize="2xs" color="gray.500">Content Alignment</FormLabel>
                                    <Select size="xs" value={block.props.justifyContent || "center"} onChange={(e) => handleChange("justifyContent", e.target.value)}>
                                        <option value="flex-start">Top</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">Bottom</option>
                                    </Select>
                                </FormControl>
                                <FormControl mt={2}>
                                    <FormLabel fontSize="2xs" color="gray.500">Section Height</FormLabel>
                                    <Input size="xs" placeholder="100vh (default)" value={block.props.sectionHeight || ""} onChange={(e) => handleChange("sectionHeight", e.target.value)} />
                                    <Text fontSize="2xs" color="gray.400" mt={1}>e.g. 200vh, 150vh, 300px. With snap scroll, content scrolls inside before snapping to next section.</Text>
                                </FormControl>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem></Accordion>
                    <Divider my={4} />
                    <ChildrenEditor
                        children={block.props.children}
                        onAdd={onOpen}
                        onRemove={handleRemoveChild}
                        onEdit={setEditingChildIndex}
                        editingIndex={editingChildIndex}
                        handleChildChange={handleChildChange}
                        pools={pools} // pass pools down for nested forms
                        activeViewport={activeViewport}
                        responsiveBuilderV2={responsiveBuilderV2}
                    />
                </>
            )}

            {/* LIST / CARD / FLIP (Simplified) */}
            {block.type === 'list' && (
                <>
                    <FormControl><FormLabel fontSize="xs">Items (one per line)</FormLabel><Textarea size="sm" value={(block.props.items || []).join("\n")} onChange={(e) => handleChange("items", e.target.value.split("\n"))} rows={6} /></FormControl>
                    <ColorPicker label="Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                </>
            )}
            {block.type === 'flip' && (
                <>
                    <FormControl><FormLabel fontSize="xs">Direction</FormLabel><Select size="sm" value={block.props.direction || "horizontal"} onChange={(e) => handleChange("direction", e.target.value)}><option value="horizontal">Horizontal</option><option value="vertical">Vertical</option></Select></FormControl>
                    <Box mt={2}>
                        <Text fontWeight="bold" fontSize="xs" mb={1}>Images</Text>
                        <Wrap mb={2}>{(block.props.images || []).map((img, i) => <Tag key={i}><TagLabel>{img.split("/").pop()}</TagLabel><TagCloseButton onClick={() => removeImage(i)} /></Tag>)}</Wrap>
                        <ImageField label="Add Image" value="" onChange={(v) => handleChange("images", [...(block.props.images || []), v])} />
                    </Box>
                </>
            )}

            {/* DYNAMIC FORM / COUPON FORM */}
            {block.type === 'couponForm' && (
                <>
                    <Box p={2} bg="orange.50" borderRadius="md" border="1px dashed orange">
                        <Text fontSize="xs" fontWeight="bold">Coupon Logic</Text>
                        <FormControl mt={1}>
                            <FormLabel fontSize="xs" mb={0}>🎯 Pool (which pool to check codes against)</FormLabel>
                            <Select
                                size="xs"
                                value={block.props.poolId || ""}
                                onChange={(e) => handleChange("poolId", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="All pools (any code works)"
                            >
                                {pools.map(p => (
                                    <option key={p.pool_id} value={p.pool_id}>
                                        {p.name} ({p.total_items ?? '?'} codes)
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Accordion allowToggle mt={2}><AccordionItem border="none">
                        <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm" fontWeight="bold">Styling & Colors</Text><AccordionIcon ml="auto" /></AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                                <FormControl><FormLabel fontSize="xs">Title</FormLabel><Input size="sm" value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                                <HStack>
                                    <ColorPicker label="Title" value={block.props.titleColor} onChange={(v) => handleChange("titleColor", v)} />
                                    <ColorPicker label="Label Color" value={block.props.labelColor} onChange={(v) => handleChange("labelColor", v)} />
                                </HStack>
                                <FormControl>
                                    <FormLabel fontSize="2xs" color="gray.500">Label Font</FormLabel>
                                    <Select size="xs" value={block.props.labelFontFamily || ""} onChange={(e) => handleChange("labelFontFamily", e.target.value)}>
                                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </Select>
                                </FormControl>
                                <HStack>
                                    <ColorPicker label="Field Bg" value={block.props.inputBgColor} onChange={(v) => handleChange("inputBgColor", v)} />
                                    <ColorPicker label="Field Text" value={block.props.inputTextColor} onChange={(v) => handleChange("inputTextColor", v)} />
                                </HStack>
                                <HStack>
                                    <ColorPicker label="Card Bg" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                                    <ColorPicker label="Section Bg" value={block.props.containerBgColor} onChange={(v) => handleChange("containerBgColor", v)} />
                                </HStack>
                                <ImageField label="Background Image" value={block.props.backgroundImage} onChange={(v) => handleChange("backgroundImage", v)} />
                                <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <Text fontSize="xs" fontWeight="bold" mb={2}>Layout (Margin & Padding)</Text>
                                    <HStack spacing={4}>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Margin</Text>
                                            <Input size="xs" value={block.props.margin || ""} onChange={(e) => handleChange("margin", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Padding</Text>
                                            <Input size="xs" value={block.props.padding || ""} onChange={(e) => handleChange("padding", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem></Accordion>

                    <Divider my={4} />
                    <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={2}>Form Fields (EAV)</Text>
                        <Reorder.Group axis="y" values={block.props.fields || []} onReorder={(newFields) => handleChange("fields", newFields)}>
                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <ReorderFieldItem key={f._id} value={f}>
                                        {({ startDrag }) => (
                                            <Box bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                                <HStack>
                                                    <Box
                                                        cursor="grab"
                                                        color="gray.300"
                                                        _hover={{ color: "gray.500" }}
                                                        touchAction="none"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                            startDrag(e);
                                                        }}
                                                    >
                                                        <MdDragIndicator size={18} />
                                                    </Box>
                                                    <Text fontSize="xs" fontWeight="bold" flex={1}>{f.label}</Text>
                                                    <Tag size="sm" colorScheme="purple"><TagLabel>{f.type || "text"}</TagLabel></Tag>
                                                    <IconButton
                                                        icon={<MdEdit />}
                                                        size="xs"
                                                        colorScheme={editingFieldIndex === i ? "blue" : "gray"}
                                                        variant={editingFieldIndex === i ? "solid" : "ghost"}
                                                        onClick={() => setEditingFieldIndex(editingFieldIndex === i ? null : i)}
                                                        aria-label="Edit"
                                                    />
                                                    <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => removeField(i)} aria-label="Del" />
                                                </HStack>
                                                {editingFieldIndex === i && (
                                                    <VStack mt={2} spacing={2} align="stretch">
                                                        <HStack>
                                                            <Box flex={1}>
                                                                <Text fontSize="xs" color="gray.500" mb={0.5}>Label</Text>
                                                                <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                            </Box>
                                                            <Box flex={1}>
                                                                <Text fontSize="xs" color="gray.500" mb={0.5}>Key</Text>
                                                                <Input size="xs" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/\s/g, "_"))} fontFamily="mono" />
                                                            </Box>
                                                        </HStack>
                                                        <Box>
                                                            <Text fontSize="xs" color="gray.500" mb={0.5}>Type</Text>
                                                            <Select size="xs" value={f.type || "text"} onChange={e => updateField(i, "type", e.target.value)}>
                                                                <option value="text">Text</option>
                                                                <option value="coupon">🎫 Coupon</option>
                                                                <option value="email">Email</option>
                                                                <option value="phone">Phone</option>
                                                                <option value="textarea">Long text</option>
                                                                <option value="select">Select</option>
                                                                <option value="checkbox">✅ Checkbox / Agreement</option>
                                                            </Select>
                                                        </Box>
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Agreement Text (WYSIWYG)</Text>
                                                                <RichTextEditor value={f.checkboxText || ""} onChange={val => updateField(i, "checkboxText", val)} />
                                                            </Box>
                                                        )}
                                                        {f.type === 'select' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Options</Text>
                                                                <VStack spacing={1} align="stretch" mb={2}>
                                                                    {(f.options || []).map((opt, optIdx) => (
                                                                        <HStack key={optIdx}>
                                                                            <Input size="xs" value={opt} onChange={(e) => {
                                                                                const newOptions = [...(f.options || [])];
                                                                                newOptions[optIdx] = e.target.value;
                                                                                updateField(i, "options", newOptions);
                                                                            }} />
                                                                            <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => {
                                                                                const newOptions = (f.options || []).filter((_, idx) => idx !== optIdx);
                                                                                updateField(i, "options", newOptions);
                                                                            }} aria-label="Remove" />
                                                                        </HStack>
                                                                    ))}
                                                                </VStack>
                                                                <Button size="xs" leftIcon={<MdAdd />} onClick={() => {
                                                                    const newOptions = [...(f.options || []), "New Option"];
                                                                    updateField(i, "options", newOptions);
                                                                }}>Add Option</Button>
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                )}
                                            </Box>
                                        )}
                                    </ReorderFieldItem>
                                ))}
                            </VStack>
                        </Reorder.Group>
                        <HStack>
                            <Input placeholder="field_name" size="sm" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, '_'))} flex={1} />
                            <Input placeholder="Label" size="sm" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} flex={1} />
                            <Select size="sm" w="120px" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                                <option value="text">Text</option>
                                <option value="coupon">🎫 Coupon</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="textarea">Long</option>
                                <option value="select">Select</option>
                                <option value="checkbox">✅ Checkbox / Agreement</option>
                                <option value="date">📅 Date</option>
                            </Select>
                            <Button size="sm" onClick={addField}>Add</Button>
                        </HStack>
                    </Box>
                </>
            )}

            {/* URL COUPON BLOCK */}
            {block.type === 'urlCoupon' && (
                <>
                    <Box p={2} bg="green.50" borderRadius="md" border="1px dashed green">
                        <FormControl>
                            <FormLabel fontSize="xs" mb={0}>🎯 Pool (which pool to check codes against)</FormLabel>
                            <Select
                                size="xs"
                                value={block.props.poolId || ""}
                                onChange={(e) => handleChange("poolId", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="All pools (any code works)"
                            >
                                {pools.map(p => (
                                    <option key={p.pool_id} value={p.pool_id}>
                                        {p.name} ({p.total_items ?? '?'} codes)
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Accordion allowToggle mt={2}><AccordionItem border="none">
                        <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm" fontWeight="bold">Styling & Colors</Text><AccordionIcon ml="auto" /></AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                                <FormControl><FormLabel fontSize="xs">Title</FormLabel><Input size="sm" value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                                <FormControl><FormLabel fontSize="xs">Subtitle</FormLabel><Input size="sm" value={block.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} /></FormControl>
                                <HStack>
                                    <ColorPicker label="Title" value={block.props.titleColor} onChange={(v) => handleChange("titleColor", v)} />
                                    <ColorPicker label="Subtitle" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                                </HStack>
                                <ColorPicker label="Label Color" value={block.props.labelColor} onChange={(v) => handleChange("labelColor", v)} />
                                <FormControl>
                                    <FormLabel fontSize="2xs" color="gray.500">Label Font</FormLabel>
                                    <Select size="xs" value={block.props.labelFontFamily || ""} onChange={(e) => handleChange("labelFontFamily", e.target.value)}>
                                        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </Select>
                                </FormControl>
                                <HStack>
                                    <ColorPicker label="Field Bg" value={block.props.inputBgColor} onChange={(v) => handleChange("inputBgColor", v)} />
                                    <ColorPicker label="Field Text" value={block.props.inputTextColor} onChange={(v) => handleChange("inputTextColor", v)} />
                                </HStack>
                                <HStack>
                                    <ColorPicker label="Card Bg" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                                    <ColorPicker label="Section Bg" value={block.props.containerBgColor} onChange={(v) => handleChange("containerBgColor", v)} />
                                </HStack>
                                <ImageField label="Background Image" value={block.props.backgroundImage} onChange={(v) => handleChange("backgroundImage", v)} />
                                <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <Text fontSize="xs" fontWeight="bold" mb={2}>Layout (Margin & Padding)</Text>
                                    <HStack spacing={4}>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Margin</Text>
                                            <Input size="xs" value={block.props.margin || ""} onChange={(e) => handleChange("margin", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={1} flex={1}>
                                            <Text fontSize="2xs" color="gray.500">Padding</Text>
                                            <Input size="xs" value={block.props.padding || ""} onChange={(e) => handleChange("padding", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem></Accordion>

                    <Divider my={4} />
                    <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={2}>Button & States</Text>
                        <VStack spacing={3} align="stretch">
                            <FormControl><FormLabel fontSize="xs">Button Text</FormLabel><Input size="sm" value={block.props.buttonText || "Submit"} onChange={(e) => handleChange("buttonText", e.target.value)} /></FormControl>
                            <ImageField label="Button Image (Override)" value={block.props.buttonImageUrl} onChange={(v) => handleChange("buttonImageUrl", v)} />
                            <HStack>
                                <ColorPicker label="Button Color" value={block.props.buttonColor} onChange={(v) => handleChange("buttonColor", v)} />
                                <ColorPicker label="Button Text Color" value={block.props.buttonTextColor} onChange={(v) => handleChange("buttonTextColor", v)} />
                            </HStack>
                        </VStack>
                    </Box>

                    <Divider my={4} />
                    <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={2}>Form Fields (EAV)</Text>
                        <Reorder.Group axis="y" values={block.props.fields || []} onReorder={(newFields) => handleChange("fields", newFields)}>
                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <ReorderFieldItem key={f._id} value={f}>
                                        {({ startDrag }) => (
                                            <Box bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                                <HStack>
                                                    <Box
                                                        cursor="grab"
                                                        color="gray.300"
                                                        _hover={{ color: "gray.500" }}
                                                        touchAction="none"
                                                        onPointerDown={(e) => {
                                                            e.stopPropagation();
                                                            startDrag(e);
                                                        }}
                                                    >
                                                        <MdDragIndicator size={18} />
                                                    </Box>
                                                    <Text fontSize="xs" fontWeight="bold" flex={1}>{f.label}</Text>
                                                    <IconButton
                                                        icon={<MdEdit />}
                                                        size="xs"
                                                        colorScheme={editingFieldIndex === i ? "blue" : "gray"}
                                                        variant={editingFieldIndex === i ? "solid" : "ghost"}
                                                        onClick={() => setEditingFieldIndex(editingFieldIndex === i ? null : i)}
                                                        aria-label="Edit"
                                                    />
                                                    <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => removeField(i)} aria-label="Del" />
                                                </HStack>
                                                {editingFieldIndex === i && (
                                                    <VStack mt={2} spacing={2} align="stretch">
                                                        <HStack>
                                                            <Box flex={1}>
                                                                <Text fontSize="xs" color="gray.500" mb={0.5}>Label</Text>
                                                                <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                            </Box>
                                                            <Box flex={1}>
                                                                <Text fontSize="xs" color="gray.500" mb={0.5}>Key</Text>
                                                                <Input size="xs" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/\s/g, "_"))} fontFamily="mono" />
                                                            </Box>
                                                        </HStack>
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Agreement Text (WYSIWYG)</Text>
                                                                <RichTextEditor value={f.checkboxText || ""} onChange={val => updateField(i, "checkboxText", val)} />
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                )}
                                            </Box>
                                        )}
                                    </ReorderFieldItem>
                                ))}
                            </VStack>
                        </Reorder.Group>
                        <HStack>
                            <Input placeholder="field_name" size="sm" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, '_'))} flex={1} />
                            <Input placeholder="Label" size="sm" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} flex={1} />
                            <Button size="sm" onClick={addField}>Add</Button>
                        </HStack>
                    </Box>
                </>
            )}

            {/* OVERLAY BLOCK */}
            {block.type === 'overlay' && (
                <>
                    <ImageField label="Overlay Image" value={block.props.imageUrl} onChange={(v) => handleChange("imageUrl", v)} />
                    <Divider my={2} />
                    <Text fontSize="xs" fontWeight="bold" mb={2}>Positioning</Text>
                    <Text fontSize="2xs" color="gray.500" mb={2}>
                        Resize handle keeps aspect ratio by default. Hold Shift while dragging for free resize.
                    </Text>
                    <VStack spacing={2} align="stretch" bg="gray.50" p={2} borderRadius="md">
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Top</FormLabel><Input size="xs" value={block.props.top || "auto"} onChange={(e) => handleChange("top", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Left</FormLabel><Input size="xs" value={block.props.left || "auto"} onChange={(e) => handleChange("left", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Bottom</FormLabel><Input size="xs" value={block.props.bottom || "auto"} onChange={(e) => handleChange("bottom", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Right</FormLabel><Input size="xs" value={block.props.right || "auto"} onChange={(e) => handleChange("right", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Width</FormLabel><Input size="xs" value={block.props.width || "auto"} onChange={(e) => handleChange("width", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>MaxW</FormLabel><Input size="xs" value={block.props.maxWidth || "200px"} onChange={(e) => handleChange("maxWidth", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Height</FormLabel><Input size="xs" value={block.props.height || "auto"} onChange={(e) => handleChange("height", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>MaxH</FormLabel><Input size="xs" value={block.props.maxHeight || "none"} onChange={(e) => handleChange("maxHeight", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>z-Index</FormLabel><Input size="xs" type="number" value={block.props.zIndex || 10} onChange={(e) => handleChange("zIndex", e.target.value)} /></FormControl>
                            <FormControl>
                                <FormLabel fontSize="2xs" m={0}>Opacity</FormLabel>
                                <HStack>
                                    <Input
                                        size="xs"
                                        type="range"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={opacityValue}
                                        onChange={(e) => handleOpacityChange(e.target.value)}
                                    />
                                    <Input
                                        size="xs"
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={opacityValue}
                                        onChange={(e) => handleOpacityChange(e.target.value)}
                                        w="72px"
                                    />
                                </HStack>
                            </FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>TranslateX</FormLabel><Input size="xs" placeholder="e.g. -50%" value={block.props.translateX || ""} onChange={(e) => handleChange("translateX", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>TranslateY</FormLabel><Input size="xs" placeholder="e.g. -50%" value={block.props.translateY || ""} onChange={(e) => handleChange("translateY", e.target.value)} /></FormControl>
                        </HStack>
                    </VStack>
                </>
            )}

            {block.type === 'textOverlay' && (
                <>
                    <RichTextEditor key={block._id || block.props?._id || 'rte-overlay'} value={block.props.content || ""} onChange={(val) => handleChange("content", val)} />
                    <Divider my={2} />
                    <Text fontSize="xs" fontWeight="bold" mb={2}>Positioning</Text>
                    <Text fontSize="2xs" color="gray.500" mb={2}>
                        Text overlay supports free drag-and-drop and free resize.
                    </Text>
                    <VStack spacing={2} align="stretch" bg="gray.50" p={2} borderRadius="md">
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Top</FormLabel><Input size="xs" value={block.props.top || "auto"} onChange={(e) => handleChange("top", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Left</FormLabel><Input size="xs" value={block.props.left || "auto"} onChange={(e) => handleChange("left", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Bottom</FormLabel><Input size="xs" value={block.props.bottom || "auto"} onChange={(e) => handleChange("bottom", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Right</FormLabel><Input size="xs" value={block.props.right || "auto"} onChange={(e) => handleChange("right", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Width</FormLabel><Input size="xs" value={block.props.width || "260px"} onChange={(e) => handleChange("width", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>MaxW</FormLabel><Input size="xs" value={block.props.maxWidth || "none"} onChange={(e) => handleChange("maxWidth", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Height</FormLabel><Input size="xs" value={block.props.height || "140px"} onChange={(e) => handleChange("height", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>MaxH</FormLabel><Input size="xs" value={block.props.maxHeight || "none"} onChange={(e) => handleChange("maxHeight", e.target.value)} /></FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>z-Index</FormLabel><Input size="xs" type="number" value={block.props.zIndex || 11} onChange={(e) => handleChange("zIndex", e.target.value)} /></FormControl>
                            <FormControl>
                                <FormLabel fontSize="2xs" m={0}>Opacity</FormLabel>
                                <HStack>
                                    <Input
                                        size="xs"
                                        type="range"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={opacityValue}
                                        onChange={(e) => handleOpacityChange(e.target.value)}
                                    />
                                    <Input
                                        size="xs"
                                        type="number"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={opacityValue}
                                        onChange={(e) => handleOpacityChange(e.target.value)}
                                        w="72px"
                                    />
                                </HStack>
                            </FormControl>
                        </HStack>
                        <HStack>
                            <FormControl><FormLabel fontSize="2xs" m={0}>TranslateX</FormLabel><Input size="xs" placeholder="e.g. -50%" value={block.props.translateX || ""} onChange={(e) => handleChange("translateX", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>TranslateY</FormLabel><Input size="xs" placeholder="e.g. -50%" value={block.props.translateY || ""} onChange={(e) => handleChange("translateY", e.target.value)} /></FormControl>
                        </HStack>
                    </VStack>
                </>
            )}

            {/* CUSTOM HTML */}
            {block.type === 'customHtml' && (
                <>
                    <FormControl><FormLabel fontSize="xs">HTML Code</FormLabel><Textarea value={block.props.html || ""} onChange={(e) => handleChange("html", e.target.value)} rows={15} fontFamily="monospace" fontSize="xs" placeholder="<div>Your HTML here</div>" /></FormControl>
                    <FormControl mt={2}><FormLabel fontSize="xs">Custom CSS (JSON object)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={20} fontFamily="monospace" fontSize="xs" placeholder='{"background":"#f5f5f5","padding":"20px"}' /></FormControl>
                </>
            )}

            {/* CARD BLOCK */}
            {block.type === 'card' && (
                <>
                    <FormControl><FormLabel fontSize="xs">Title</FormLabel><Input size="sm" value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                    <FormControl mt={2}><FormLabel fontSize="xs">Subtitle</FormLabel><Input size="sm" value={block.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} /></FormControl>
                    <ImageField label="Card Image" value={block.props.imageUrl} onChange={(v) => handleChange("imageUrl", v)} />

                    <Accordion allowToggle mt={4}><AccordionItem border="none">
                        <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm" fontWeight="bold">Card Tuning</Text><AccordionIcon ml="auto" /></AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <VStack spacing={3} align="stretch">
                                <HStack>
                                    <ColorPicker label="Card Bg" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                                    <ColorPicker label="Title Bg" value={block.props.titleBgColor} onChange={(v) => handleChange("titleBgColor", v)} />
                                </HStack>
                                <HStack>
                                    <ColorPicker label="Title" value={block.props.titleColor} onChange={(v) => handleChange("titleColor", v)} />
                                    <ColorPicker label="Subtitle" value={block.props.subtitleColor} onChange={(v) => handleChange("subtitleColor", v)} />
                                </HStack>
                                <ColorPicker label="Body Text" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />

                                <Box borderTop="1px solid" borderColor="gray.100" pt={2}>
                                    <Text fontSize="2xs" color="gray.500" fontWeight="bold" mb={1}>Margin (top right bottom left)</Text>
                                    <HStack spacing={2}>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Top</Text>
                                            <Input size="xs" placeholder="0" value={block.props.marginTop || ""} onChange={(e) => handleChange("marginTop", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Right</Text>
                                            <Input size="xs" placeholder="0" value={block.props.marginRight || ""} onChange={(e) => handleChange("marginRight", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Bottom</Text>
                                            <Input size="xs" placeholder="0" value={block.props.marginBottom || ""} onChange={(e) => handleChange("marginBottom", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Left</Text>
                                            <Input size="xs" placeholder="0" value={block.props.marginLeft || ""} onChange={(e) => handleChange("marginLeft", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>
                                <Box pt={2}>
                                    <Text fontSize="2xs" color="gray.500" fontWeight="bold" mb={1}>Padding (top right bottom left)</Text>
                                    <HStack spacing={2}>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Top</Text>
                                            <Input size="xs" placeholder="0" value={block.props.paddingTop || ""} onChange={(e) => handleChange("paddingTop", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Right</Text>
                                            <Input size="xs" placeholder="0" value={block.props.paddingRight || ""} onChange={(e) => handleChange("paddingRight", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Bottom</Text>
                                            <Input size="xs" placeholder="0" value={block.props.paddingBottom || ""} onChange={(e) => handleChange("paddingBottom", e.target.value)} />
                                        </VStack>
                                        <VStack align="start" spacing={0} flex={1}>
                                            <Text fontSize="2xs" color="gray.400">Left</Text>
                                            <Input size="xs" placeholder="0" value={block.props.paddingLeft || ""} onChange={(e) => handleChange("paddingLeft", e.target.value)} />
                                        </VStack>
                                    </HStack>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem></Accordion>

                    <Divider my={4} />
                    <ChildrenEditor
                        children={block.props.children}
                        onAdd={onOpen}
                        onRemove={handleRemoveChild}
                        onEdit={setEditingChildIndex}
                        editingIndex={editingChildIndex}
                        handleChildChange={handleChildChange}
                        pools={pools}
                        activeViewport={activeViewport}
                        responsiveBuilderV2={responsiveBuilderV2}
                    />
                </>
            )}
            <AddBlockModal isOpen={isOpen} onClose={onClose} onAddBlock={handleAddChild} />
        </VStack>
    );
}

function ChildrenEditor({
    children = [],
    onAdd,
    onRemove,
    onEdit,
    editingIndex,
    handleChildChange,
    pools,
    activeViewport,
    responsiveBuilderV2
}) {
    // Local state for field editing within inline child settings
    const [localEditingFieldIndex, setLocalEditingFieldIndex] = useState(null);
    const [localNewFieldName, setLocalNewFieldName] = useState("");
    const [localNewFieldLabel, setLocalNewFieldLabel] = useState("");
    const [localNewFieldType, setLocalNewFieldType] = useState("text");
    const [localNewLinkLabel, setLocalNewLinkLabel] = useState("");
    const [localNewLinkUrl, setLocalNewLinkUrl] = useState("");

    const getLayerLabel = (c) => {
        if (c.props.layerName) return c.props.layerName;
        if ((c.type === 'text' || c.type === 'textOverlay') && c.props.content) {
            const plainText = c.props.content.replace(/<[^>]*>/g, '').substring(0, 20);
            return plainText ? `"${plainText}..."` : "TEXT";
        }
        return c.type.toUpperCase();
    };

    return (
        <Box border="1px solid" borderColor="gray.100" borderRadius="md" overflow="hidden" display="flex" flexDirection="column">
            <HStack justify="space-between" p={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.100" position="sticky" top={0} zIndex={5}>
                <Text fontWeight="bold" fontSize="sm">Layers</Text>
                <Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>Add Layer</Button>
            </HStack>

            <Box maxH="400px" overflowY="auto" p={2} sx={{
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": { background: "gray.200", borderRadius: "10px" }
            }}>
                {children.length === 0 && <Text fontSize="xs" color="gray.400" p={2}>No layers yet</Text>}
                <VStack align="stretch" spacing={2}>
                    {children.map((c, i) => (
                        <Box key={c._id || i}>
                            <HStack
                                bg={editingIndex === i ? "blue.500" : "white"}
                                color={editingIndex === i ? "white" : "inherit"}
                                p={2}
                                borderRadius="md"
                                border="1px solid"
                                borderColor={editingIndex === i ? "blue.500" : "gray.100"}
                                cursor="pointer"
                                onClick={() => onEdit(i === editingIndex ? null : i)}
                                _hover={{ borderColor: "blue.400" }}
                                transition="all 0.2s"
                            >
                                <Text fontSize="xs" flex={1} fontWeight={editingIndex === i ? "bold" : "medium"}>
                                    {getLayerLabel(c)}
                                </Text>
                                <HStack spacing={1}>
                                    <IconButton
                                        icon={<MdEdit />}
                                        size="xs"
                                        variant="ghost"
                                        color={editingIndex === i ? "white" : "gray.500"}
                                        _hover={{ bg: "whiteAlpha.300" }}
                                        onClick={(e) => { e.stopPropagation(); onEdit(i === editingIndex ? null : i); }}
                                        aria-label="Edit"
                                    />
                                    <IconButton
                                        icon={<MdDelete />}
                                        size="xs"
                                        colorScheme="red"
                                        variant="ghost"
                                        _hover={{ bg: "red.50" }}
                                        onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                                        aria-label="Delete"
                                    />
                                </HStack>
                            </HStack>

                            {editingIndex === i && (
                                <Box mt={2} mb={4} p={3} bg="white" border="1px solid" borderColor="blue.100" borderRadius="md" shadow="sm">
                                    <HStack justify="space-between" mb={3} pb={2} borderBottom="1px solid" borderColor="gray.50">
                                        <Text fontWeight="bold" fontSize="xs" color="blue.600">
                                            Edit {c.type.toUpperCase()} Props
                                        </Text>
                                        <Button size="xs" variant="ghost" onClick={() => onEdit(null)}>Finish</Button>
                                    </HStack>
                                    <BlockSettings
                                        block={c}
                                        handleChange={(key, val) => {
                                            const nextProps = (responsiveBuilderV2 && isLayoutOverrideKey(key))
                                                ? applyResponsiveLayoutUpdates(c.props || {}, { [key]: val }, activeViewport)
                                                : { ...(c.props || {}), [key]: val };
                                            handleChildChange(i, { ...c, props: nextProps });
                                        }}
                                        pools={pools}
                                        editingFieldIndex={localEditingFieldIndex}
                                        setEditingFieldIndex={setLocalEditingFieldIndex}
                                        updateField={(fieldIdx, k, v) => {
                                            const f = [...(c.props.fields || [])];
                                            f[fieldIdx] = { ...f[fieldIdx], [k]: v };
                                            handleChildChange(i, { ...c, props: { ...c.props, fields: f } });
                                        }}
                                        removeField={(fieldIdx) => {
                                            const f = (c.props.fields || []).filter((_, j) => j !== fieldIdx);
                                            handleChildChange(i, { ...c, props: { ...c.props, fields: f } });
                                        }}
                                        newFieldName={localNewFieldName}
                                        setNewFieldName={setLocalNewFieldName}
                                        newFieldLabel={localNewFieldLabel}
                                        setNewFieldLabel={setLocalNewFieldLabel}
                                        newFieldType={localNewFieldType}
                                        setNewFieldType={setLocalNewFieldType}
                                        addField={() => {
                                            if (!localNewFieldName.trim()) return;
                                            const f = [...(c.props.fields || []), {
                                                _id: `id_${Date.now()}`,
                                                name: localNewFieldName.trim(),
                                                label: localNewFieldLabel.trim() || localNewFieldName.trim(),
                                                type: localNewFieldType
                                            }];
                                            handleChildChange(i, { ...c, props: { ...c.props, fields: f } });
                                            setLocalNewFieldName(""); setLocalNewFieldLabel("");
                                        }}
                                        newLinkLabel={localNewLinkLabel}
                                        setNewLinkLabel={setLocalNewLinkLabel}
                                        newLinkUrl={localNewLinkUrl}
                                        setNewLinkUrl={setLocalNewLinkUrl}
                                        addLink={() => {
                                            if (!localNewLinkLabel.trim()) return;
                                            const l = [...(c.props.links || []), {
                                                label: localNewLinkLabel.trim(),
                                                url: localNewLinkUrl.trim()
                                            }];
                                            handleChildChange(i, { ...c, props: { ...c.props, links: l } });
                                            setLocalNewLinkLabel(""); setLocalNewLinkUrl("");
                                        }}
                                        removeLink={(linkIdx) => {
                                            const l = (c.props.links || []).filter((_, j) => j !== linkIdx);
                                            handleChildChange(i, { ...c, props: { ...c.props, links: l } });
                                        }}
                                        removeImage={(imageIdx) => {
                                            const img = (c.props.images || []).filter((_, j) => j !== imageIdx);
                                            handleChildChange(i, { ...c, props: { ...c.props, images: img } });
                                        }}
                                        activeViewport={activeViewport}
                                        responsiveBuilderV2={responsiveBuilderV2}
                                    />
                                </Box>
                            )}
                        </Box>
                    ))}
                </VStack>
            </Box>
        </Box>
    );
}
