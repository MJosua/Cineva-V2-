import { Box, FormControl, FormLabel, Input, VStack, Heading, Select, Button, Text, HStack, IconButton, useDisclosure, Textarea, Tag, TagLabel, TagCloseButton, Wrap, Switch, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Code } from "@chakra-ui/react";
import { MdAdd, MdDelete, MdEdit, MdArrowUpward, MdArrowDownward, MdSettings, MdDragIndicator } from "react-icons/md";
import { Reorder } from "framer-motion";
import RichTextEditor from "./RichTextEditor";
import MediaPickerModal from "./MediaPickerModal";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPoolsByEvent } from "../../../services/eventEngineApi";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import ImageField from "./ImageField";
import ColorPicker from "./ColorPicker";
import AddBlockModal from "./AddBlockModal";



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

export default function BlockEditor({ block, onChange }) {
    const [newImageUrl, setNewImageUrl] = useState("");
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
                handleChange("fields", normalizedFields);
            }
        }
    }, [block?.id, block?.type]);


    if (!block) return <Box p={4} textAlign="center" color="gray.500">Select a block to edit</Box>;

    const handleChange = (key, value) => {
        let finalValue = value;
        if (key === "fields" && Array.isArray(value)) {
            finalValue = value.map(f => f._id ? f : { ...f, _id: `id_${Math.random().toString(36).substr(2, 9)}_${Date.now()}` });
        }
        onChange({ ...block, props: { ...block.props, [key]: finalValue } });
    };

    const addImage = () => { if (newImageUrl.trim()) { handleChange("images", [...(block.props.images || []), newImageUrl.trim()]); setNewImageUrl(""); } };
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
                    block={block}
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
    isNested = false
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

    return (
        <VStack spacing={4} align="stretch">
            {/* Layer ID / Administrative Label */}
            <FormControl>
                <FormLabel fontSize="2xs" color="gray.500" mb={1}>Layer Name (Internal)</FormLabel>
                <Input size="xs" placeholder="e.g. Hero Text, Bottom Form" value={block.props.layerName || ""} onChange={(e) => handleChange("layerName", e.target.value)} />
            </FormControl>

            {/* Block Content (Switch by Type) */}
            {/* TEXT BLOCK */}
            {block.type === 'text' && (
                <>
                    <RichTextEditor value={block.props.content || ""} onChange={(val) => handleChange("content", val)} />
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
                                    <Reorder.Item key={f._id} value={f}>
                                        <Box bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                            <HStack>
                                                <Box cursor="grab" color="gray.300" _hover={{ color: "gray.500" }}>
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
                                    </Reorder.Item>
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
                                    <Reorder.Item key={f._id} value={f}>
                                        <Box bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                            <HStack>
                                                <Box cursor="grab" color="gray.300" _hover={{ color: "gray.500" }}>
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
                                    </Reorder.Item>
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
                            <FormControl><FormLabel fontSize="2xs" m={0}>z-Index</FormLabel><Input size="xs" type="number" value={block.props.zIndex || 10} onChange={(e) => handleChange("zIndex", e.target.value)} /></FormControl>
                            <FormControl><FormLabel fontSize="2xs" m={0}>Opacity</FormLabel><Input size="xs" type="number" step="0.1" min="0" max="1" value={block.props.opacity || 1} onChange={(e) => handleChange("opacity", e.target.value)} /></FormControl>
                        </HStack>
                    </VStack>
                </>
            )}

            {/* CUSTOM HTML */}
            {block.type === 'customHtml' && (
                <>
                    <FormControl><FormLabel fontSize="xs">HTML Code</FormLabel><Textarea value={block.props.html || ""} onChange={(e) => handleChange("html", e.target.value)} rows={8} fontFamily="monospace" fontSize="xs" placeholder="<div>Your HTML here</div>" /></FormControl>
                    <FormControl mt={2}><FormLabel fontSize="xs">Custom CSS (JSON object)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={3} fontFamily="monospace" fontSize="xs" placeholder='{"background":"#f5f5f5","padding":"20px"}' /></FormControl>
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
                    />
                </>
            )}

            {/* RECURSIVE CHILD EDITOR */}
            {currentChild && (
                <Box bg="blue.50" p={2} borderRadius="md" mt={4} border="1px solid" borderColor="blue.100">
                    <HStack justify="space-between" mb={2}>
                        <HStack>
                            <MdEdit />
                            <Text fontWeight="bold" fontSize="sm">Layer: {currentChild.type.toUpperCase()}</Text>
                        </HStack>
                        <Button size="xs" onClick={() => setEditingChildIndex(null)}>Finish</Button>
                    </HStack>
                    <Box bg="white" p={3} borderRadius="sm" shadow="sm">
                        <BlockSettings
                            block={currentChild}
                            handleChange={(key, val) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, [key]: val } })}
                            pools={pools}
                            editingFieldIndex={editingFieldIndex}
                            setEditingFieldIndex={setEditingFieldIndex}
                            updateField={(i, k, v) => {
                                const f = [...(currentChild.props.fields || [])];
                                f[i] = { ...f[i], [k]: v };
                                handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, fields: f } });
                            }}
                            removeField={(i) => {
                                const f = (currentChild.props.fields || []).filter((_, j) => j !== i);
                                handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, fields: f } });
                            }}
                            newFieldName={newFieldName}
                            setNewFieldName={setNewFieldName}
                            newFieldLabel={newFieldLabel}
                            setNewFieldLabel={setNewFieldLabel}
                            newFieldType={newFieldType}
                            setNewFieldType={setNewFieldType}
                            addField={() => {
                                const f = [...(currentChild.props.fields || []), { _id: `id_${Date.now()}`, name: newFieldName, label: newFieldLabel || newFieldName, type: newFieldType }];
                                handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, fields: f } });
                                setNewFieldName(""); setNewFieldLabel("");
                            }}
                            newLinkLabel={newLinkLabel}
                            setNewLinkLabel={setNewLinkLabel}
                            newLinkUrl={newLinkUrl}
                            setNewLinkUrl={setNewLinkUrl}
                            addLink={() => {
                                const l = [...(currentChild.props.links || []), { label: newLinkLabel, url: newLinkUrl }];
                                handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, links: l } });
                                setNewLinkLabel(""); setNewLinkUrl("");
                            }}
                            removeImage={(i) => {
                                const img = (currentChild.props.images || []).filter((_, j) => j !== i);
                                handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, images: img } });
                            }}
                            isNested={true}
                        />
                    </Box>
                </Box>
            )}
            <AddBlockModal isOpen={isOpen} onClose={onClose} onAddBlock={handleAddChild} />
        </VStack>
    );
}

function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex, handleChildChange }) {
    const getLayerLabel = (c) => {
        if (c.props.layerName) return c.props.layerName;
        if (c.type === 'text' && c.props.content) {
            const plainText = c.props.content.replace(/<[^>]*>/g, '').substring(0, 20);
            return plainText ? `"${plainText}..."` : "TEXT";
        }
        return c.type.toUpperCase();
    };

    return (
        <Box>
            <HStack justify="space-between" mb={2}><Text fontWeight="bold" fontSize="sm">Layers</Text><Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>Add Layer</Button></HStack>
            {children.length === 0 && <Text fontSize="xs" color="gray.400">No layers yet</Text>}
            <VStack align="stretch" spacing={1}>
                {children.map((c, i) => (
                    <HStack key={c._id || i} bg={editingIndex === i ? "blue.100" : "gray.50"} p={2} borderRadius="sm" cursor="pointer" onClick={() => onEdit(i)} _hover={{ bg: "gray.100" }}>
                        <Text fontSize="xs" flex={1} fontWeight={editingIndex === i ? "bold" : "normal"}>{getLayerLabel(c)}</Text>
                        <IconButton icon={<MdEdit />} size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(i); }} aria-label="Edit" />
                        <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemove(i); }} aria-label="Delete" />
                    </HStack>
                ))}
            </VStack>
        </Box>
    );
}
