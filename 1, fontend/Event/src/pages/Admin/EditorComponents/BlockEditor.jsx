import { Box, FormControl, FormLabel, Input, VStack, Heading, Select, Button, Text, HStack, IconButton, useDisclosure, Textarea, Tag, TagLabel, TagCloseButton, Wrap, Switch, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Code } from "@chakra-ui/react";
import { MdAdd, MdDelete, MdEdit, MdArrowUpward, MdArrowDownward, MdSettings } from "react-icons/md";
import RichTextEditor from "./RichTextEditor";
import AddBlockModal from "./AddBlockModal";
import ColorPicker from "./ColorPicker";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPoolsByEvent } from "../../../services/eventEngineApi";


export default function BlockEditor({ block, onChange }) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingChildIndex, setEditingChildIndex] = useState(null);
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


    if (!block) return <Box p={4} textAlign="center" color="gray.500">Select a block to edit</Box>;

    const handleChange = (key, value) => {
        onChange({ ...block, props: { ...block.props, [key]: value } });
    };

    const handleAddChild = (newBlock) => {
        onChange({ ...block, props: { ...block.props, children: [...(block.props.children || []), newBlock] } });
        onClose();
    };

    const handleRemoveChild = (index) => {
        onChange({ ...block, props: { ...block.props, children: (block.props.children || []).filter((_, i) => i !== index) } });
        if (editingChildIndex === index) setEditingChildIndex(null);
    };

    const handleChildChange = (index, updatedChild) => {
        const newChildren = [...(block.props.children || [])];
        newChildren[index] = updatedChild;
        onChange({ ...block, props: { ...block.props, children: newChildren } });
    };

    const addImage = () => { if (newImageUrl.trim()) { handleChange("images", [...(block.props.images || []), newImageUrl.trim()]); setNewImageUrl(""); } };
    const removeImage = (i) => handleChange("images", (block.props.images || []).filter((_, j) => j !== i));
    const addLink = () => { if (newLinkLabel.trim()) { handleChange("links", [...(block.props.links || []), { label: newLinkLabel, url: newLinkUrl }]); setNewLinkLabel(""); setNewLinkUrl(""); } };
    const removeLink = (i) => handleChange("links", (block.props.links || []).filter((_, j) => j !== i));
    const addField = () => { if (newFieldName.trim()) { handleChange("fields", [...(block.props.fields || []), { name: newFieldName.trim(), label: newFieldLabel.trim() || newFieldName.trim(), type: newFieldType }]); setNewFieldName(""); setNewFieldLabel(""); setNewFieldType("text"); } };
    const removeField = (i) => { handleChange("fields", (block.props.fields || []).filter((_, j) => j !== i)); if (editingFieldIndex === i) setEditingFieldIndex(null); };
    const moveField = (i, dir) => { const f = [...(block.props.fields || [])]; if (i + dir < 0 || i + dir >= f.length) return;[f[i], f[i + dir]] = [f[i + dir], f[i]]; handleChange("fields", f); };
    const updateField = (i, key, value) => { const f = [...(block.props.fields || [])]; f[i] = { ...f[i], [key]: value }; handleChange("fields", f); };

    const currentChild = editingChildIndex !== null ? (block.props.children || [])[editingChildIndex] : null;

    return (
        <Box bg="white" p={4} borderRadius="md" shadow="sm" maxH="100%" overflowY="auto">
            <Heading size="sm" mb={4}>Edit {block.type}</Heading>
            <VStack spacing={4} align="stretch">

                {/* TEXT BLOCK */}
                {block.type === 'text' && (
                    <>
                        <RichTextEditor value={block.props.content || ""} onChange={(val) => handleChange("content", val)} />
                        <FormControl><FormLabel>Alignment</FormLabel>
                            <Select value={block.props.align || "center"} onChange={(e) => handleChange("align", e.target.value)}>
                                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                            </Select>
                        </FormControl>
                    </>
                )}

                {/* HERO BLOCK */}
                {block.type === 'hero' && (
                    <>
                        <FormControl><FormLabel>Title</FormLabel><Input value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Subtitle</FormLabel><Input value={block.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Image URL</FormLabel><Input value={block.props.imageUrl || ""} onChange={(e) => handleChange("imageUrl", e.target.value)} /></FormControl>
                        <Accordion allowToggle><AccordionItem border="none">
                            <AccordionButton px={0}><MdSettings /><Text ml={2} fontSize="sm">Styling</Text><AccordionIcon ml="auto" /></AccordionButton>
                            <AccordionPanel pb={4}>
                                <ColorPicker label="Background Color" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                                <ColorPicker label="Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                                <FormControl mt={3}><FormLabel fontSize="xs">Custom CSS (JSON)</FormLabel>
                                    <Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={2} fontFamily="monospace" fontSize="xs" placeholder='{"padding":"20px"}' />
                                </FormControl>
                            </AccordionPanel>
                        </AccordionItem></Accordion>
                    </>
                )}

                {/* HEADER/NAVBAR */}
                {(block.type === 'header' || block.type === 'navbar') && (
                    <>
                        <FormControl><FormLabel>Logo URL</FormLabel><Input value={block.props.logo || ""} onChange={(e) => handleChange("logo", e.target.value)} /></FormControl>
                        <ColorPicker label="Background Color" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                        <ColorPicker label="Menu Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                        <FormControl><FormLabel>Menu Font Size</FormLabel><Input value={block.props.fontSize || "16px"} onChange={(e) => handleChange("fontSize", e.target.value)} placeholder="16px" /></FormControl>
                        <FormControl><FormLabel>Menu Font Weight</FormLabel>
                            <Select value={block.props.fontWeight || "500"} onChange={(e) => handleChange("fontWeight", e.target.value)}>
                                <option value="400">Normal</option><option value="500">Medium</option><option value="600">Semi-Bold</option><option value="700">Bold</option>
                            </Select>
                        </FormControl>
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>Menu Links</Text>
                            <Wrap mb={2}>{(block.props.links || []).map((l, i) => <Tag key={i} colorScheme="blue"><TagLabel>{l.label}</TagLabel><TagCloseButton onClick={() => removeLink(i)} /></Tag>)}</Wrap>
                            <HStack><Input placeholder="Label" size="sm" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} /><Input placeholder="URL" size="sm" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} /><Button size="sm" onClick={addLink}>Add</Button></HStack>
                        </Box>
                        <FormControl mt={3}><FormLabel fontSize="xs">Custom CSS (JSON)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={2} fontFamily="monospace" fontSize="xs" /></FormControl>
                    </>
                )}

                {/* FLIP */}
                {block.type === 'flip' && (
                    <>
                        <FormControl><FormLabel>Direction</FormLabel><Select value={block.props.direction || "horizontal"} onChange={(e) => handleChange("direction", e.target.value)}><option value="horizontal">Left ↔ Right</option><option value="vertical">Top ↕ Bottom</option></Select></FormControl>
                        <FormControl><FormLabel>Interval (ms)</FormLabel><Input type="number" value={block.props.interval || 3000} onChange={(e) => handleChange("interval", parseInt(e.target.value))} /></FormControl>
                        <Box><Text fontWeight="bold" fontSize="sm" mb={2}>Images</Text><Wrap mb={2}>{(block.props.images || []).map((img, i) => <Tag key={i} colorScheme="green"><TagLabel>{img.split("/").pop()}</TagLabel><TagCloseButton onClick={() => removeImage(i)} /></Tag>)}</Wrap><HStack><Input placeholder="Image URL" size="sm" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} /><Button size="sm" leftIcon={<MdAdd />} onClick={addImage}>Add</Button></HStack></Box>
                    </>
                )}

                {/* CARD */}
                {block.type === 'card' && (
                    <>
                        <FormControl><FormLabel>Title</FormLabel><Input value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                        <ColorPicker label="Card Background" value={block.props.bgColor} onChange={(v) => handleChange("bgColor", v)} />
                        <ColorPicker label="Card Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                        <ChildrenEditor children={block.props.children} onAdd={onOpen} onRemove={handleRemoveChild} onEdit={setEditingChildIndex} editingIndex={editingChildIndex} />
                        <FormControl><FormLabel fontSize="xs">Custom CSS (JSON)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={2} fontFamily="monospace" fontSize="xs" /></FormControl>
                    </>
                )}

                {/* SECTION */}
                {block.type === 'section' && (
                    <>
                        <ColorPicker label="Background Color" value={block.props.background} onChange={(v) => handleChange("background", v)} />
                        <ChildrenEditor children={block.props.children} onAdd={onOpen} onRemove={handleRemoveChild} onEdit={setEditingChildIndex} editingIndex={editingChildIndex} />
                        <FormControl><FormLabel fontSize="xs">Custom CSS (JSON)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={2} fontFamily="monospace" fontSize="xs" /></FormControl>
                    </>
                )}

                {/* LIST */}
                {block.type === 'list' && (
                    <>
                        <FormControl><FormLabel>Items (one per line)</FormLabel><Textarea value={(block.props.items || []).join("\n")} onChange={(e) => handleChange("items", e.target.value.split("\n"))} rows={6} /></FormControl>
                        <ColorPicker label="Text Color" value={block.props.textColor} onChange={(v) => handleChange("textColor", v)} />
                    </>
                )}

                {/* DYNAMIC FORM */}
                {block.type === 'couponForm' && (
                    <>
                        <FormControl mb={2}>
                            <FormLabel fontSize="sm">🎯 Pool (which pool to check codes against)</FormLabel>
                            <Select
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
                            {pools.length === 0 && (
                                <Text fontSize="xs" color="gray.400" mt={1}>No pools found — create one in the Coupons section first.</Text>
                            )}
                        </FormControl>
                        <Divider mb={2} />
                        <FormControl><FormLabel>Title</FormLabel><Input value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Description</FormLabel><Textarea value={block.props.description || ""} onChange={(e) => handleChange("description", e.target.value)} rows={2} /></FormControl>
                        <FormControl><FormLabel>Button Text</FormLabel><Input value={block.props.buttonText || "Submit"} onChange={(e) => handleChange("buttonText", e.target.value)} /></FormControl>
                        <ColorPicker label="Button Color" value={block.props.buttonColor} onChange={(v) => handleChange("buttonColor", v)} />
                        <ColorPicker label="Button Text Color" value={block.props.buttonTextColor} onChange={(v) => handleChange("buttonTextColor", v)} />
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>Redirect Rules</Text>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>On Success Action</FormLabel>
                                <Select size="sm" value={block.props.onSuccessAction || ""} onChange={(e) => handleChange("onSuccessAction", e.target.value)}>
                                    <option value="">Show Message Popup</option>
                                    <option value="/success">Redirect: /success</option>
                                    <option value="/custom">Redirect: Custom URL</option>
                                </Select>
                                {block.props.onSuccessAction === "/custom" && (
                                    <Input size="sm" mt={1} placeholder="https://..." value={block.props.onSuccessCustomUrl || ""} onChange={(e) => handleChange("onSuccessCustomUrl", e.target.value)} />
                                )}
                            </FormControl>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>On 'Already Used' Action</FormLabel>
                                <Select size="sm" value={block.props.onUsedAction || ""} onChange={(e) => handleChange("onUsedAction", e.target.value)}>
                                    <option value="">Show Error Message</option>
                                    <option value="/claimed">Redirect: /claimed</option>
                                </Select>
                            </FormControl>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>On 'Invalid Code' Action</FormLabel>
                                <Select size="sm" value={block.props.onInvalidAction || ""} onChange={(e) => handleChange("onInvalidAction", e.target.value)}>
                                    <option value="">Show Error Message</option>
                                    <option value="/invalid">Redirect: /invalid</option>
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>Form Fields (EAV)</Text>
                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <Box key={i} bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                        <HStack>
                                            <IconButton icon={<MdArrowUpward />} size="xs" variant="ghost" onClick={() => moveField(i, -1)} isDisabled={i === 0} aria-label="Up" />
                                            <IconButton icon={<MdArrowDownward />} size="xs" variant="ghost" onClick={() => moveField(i, 1)} isDisabled={i === (block.props.fields?.length || 1) - 1} aria-label="Down" />
                                            <Text fontSize="xs" fontWeight="bold" flex={1}>{f.label}</Text>
                                            <Tag size="sm" colorScheme="purple"><TagLabel>{f.type || "text"}</TagLabel></Tag>
                                            <Code fontSize="xs">{f.name}</Code>
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
                                                        <Text fontSize="xs" color="gray.500" mb={0.5}>Label (shown to user)</Text>
                                                        <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" color="gray.500" mb={0.5}>Key (field_name)</Text>
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
                                                        <option value="image">📷 Image upload</option>
                                                    </Select>
                                                </Box>
                                            </VStack>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                            <HStack><Input placeholder="field_name" size="sm" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, '_'))} flex={1} />
                                <Input placeholder="Label" size="sm" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} flex={1} />
                                <Select size="sm" w="120px" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                                    <option value="text">Text</option>
                                    <option value="coupon">🎫 Coupon</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="textarea">Long</option>
                                    <option value="select">Select</option>
                                    <option value="image">📷 Image</option>
                                </Select>
                                <Button size="sm" onClick={addField}>Add</Button>
                            </HStack>
                        </Box>
                    </>
                )}

                {/* URL COUPON BLOCK */}
                {block.type === 'urlCoupon' && (
                    <>
                        <FormControl>
                            <FormLabel fontSize="sm">🎯 Pool (which pool to check codes against)</FormLabel>
                            <Select
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
                            {pools.length === 0 && (
                                <Text fontSize="xs" color="gray.400" mt={1}>No pools found — create one in the Coupons section first.</Text>
                            )}
                        </FormControl>
                        <Divider />
                        <FormControl><FormLabel>Title</FormLabel><Input value={block.props.title || ""} onChange={(e) => handleChange("title", e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Subtitle</FormLabel><Input value={block.props.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Button Text</FormLabel><Input value={block.props.buttonText || "Submit"} onChange={(e) => handleChange("buttonText", e.target.value)} /></FormControl>
                        <ColorPicker label="Button Color" value={block.props.buttonColor} onChange={(v) => handleChange("buttonColor", v)} />
                        <ColorPicker label="Button Text Color" value={block.props.buttonTextColor} onChange={(v) => handleChange("buttonTextColor", v)} />
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>⚠️ Already Used State</Text>
                            <FormControl mb={2}><FormLabel fontSize="xs" m={0}>Heading</FormLabel><Input size="sm" value={block.props.usedTitle || "Already Claimed"} onChange={(e) => handleChange("usedTitle", e.target.value)} /></FormControl>
                            <FormControl mb={2}><FormLabel fontSize="xs" m={0}>Message</FormLabel><Textarea size="sm" rows={2} value={block.props.usedMessage || ""} onChange={(e) => handleChange("usedMessage", e.target.value)} /></FormControl>
                            <FormControl mb={2}><FormLabel fontSize="xs" m={0}>Button Label</FormLabel><Input size="sm" value={block.props.usedNavLabel || "Back to Home"} onChange={(e) => handleChange("usedNavLabel", e.target.value)} /></FormControl>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>Navigate To</FormLabel>
                                <Select size="sm" value={block.props.onUsedAction || ""} onChange={(e) => handleChange("onUsedAction", e.target.value)}>
                                    <option value="">Show message only</option>
                                    <option value="/claimed">Redirect: /claimed</option>
                                    <option value="/">Redirect: Main Page</option>
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>❌ Invalid Code State</Text>
                            <FormControl mb={2}><FormLabel fontSize="xs" m={0}>Heading</FormLabel><Input size="sm" value={block.props.invalidTitle || "Invalid Code"} onChange={(e) => handleChange("invalidTitle", e.target.value)} /></FormControl>
                            <FormControl mb={2}><FormLabel fontSize="xs" m={0}>Message</FormLabel><Textarea size="sm" rows={2} value={block.props.invalidMessage || ""} onChange={(e) => handleChange("invalidMessage", e.target.value)} /></FormControl>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>Navigate To</FormLabel>
                                <Select size="sm" value={block.props.onInvalidAction || ""} onChange={(e) => handleChange("onInvalidAction", e.target.value)}>
                                    <option value="">Show message only</option>
                                    <option value="/invalid">Redirect: /invalid</option>
                                    <option value="/">Redirect: Main Page</option>
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={1}>✅ On Success</Text>
                            <FormControl mb={2}>
                                <FormLabel fontSize="xs" m={0}>Action</FormLabel>
                                <Select size="sm" value={block.props.onSuccessAction || "/success"} onChange={(e) => handleChange("onSuccessAction", e.target.value)}>
                                    <option value="/success">Redirect: /success</option>
                                    <option value="/">Redirect: Main Page</option>
                                    <option value="">Show message only</option>
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider />
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={2}>📋 Credential Fields (shown when code is valid)</Text>
                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <Box key={i} bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm"
                                        border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                        <HStack>
                                            <IconButton icon={<MdArrowUpward />} size="xs" variant="ghost" onClick={() => moveField(i, -1)} isDisabled={i === 0} aria-label="Up" />
                                            <IconButton icon={<MdArrowDownward />} size="xs" variant="ghost" onClick={() => moveField(i, 1)} isDisabled={i === (block.props.fields?.length || 1) - 1} aria-label="Down" />
                                            <Text fontSize="xs" fontWeight="bold" flex={1}>{f.label}</Text>
                                            <Tag size="sm" colorScheme="purple"><TagLabel>{f.type || "text"}</TagLabel></Tag>
                                            <Code fontSize="xs">{f.name}</Code>
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
                                                        <Text fontSize="xs" color="gray.500" mb={1}>Label (shown to user)</Text>
                                                        <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" color="gray.500" mb={1}>Key (field_name)</Text>
                                                        <Input size="xs" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/\s/g, "_"))} fontFamily="mono" />
                                                    </Box>
                                                </HStack>
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>Type</Text>
                                                    <Select size="xs" value={f.type || "text"} onChange={e => updateField(i, "type", e.target.value)}>
                                                        <option value="text">Text</option>
                                                        <option value="coupon">🎫 Coupon</option>
                                                        <option value="email">Email</option>
                                                        <option value="phone">Phone</option>
                                                        <option value="textarea">Long text</option>
                                                        <option value="select">Select</option>
                                                        <option value="image">📷 Image upload</option>
                                                    </Select>
                                                </Box>
                                            </VStack>
                                        )}
                                    </Box>
                                ))}
                            </VStack>
                            <HStack><Input placeholder="field_name" size="sm" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value.replace(/\s/g, '_'))} flex={1} />
                                <Input placeholder="Label" size="sm" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} flex={1} />
                                <Select size="sm" w="120px" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Phone</option>
                                    <option value="textarea">Long</option>
                                    <option value="select">Select</option>
                                    <option value="image">📷 Image</option>
                                </Select>
                                <Button size="sm" onClick={addField}>Add</Button>
                            </HStack>
                        </Box>
                    </>
                )}

                {/* CUSTOM HTML */}
                {block.type === 'customHtml' && (
                    <>
                        <FormControl><FormLabel>HTML Code</FormLabel><Textarea value={block.props.html || ""} onChange={(e) => handleChange("html", e.target.value)} rows={8} fontFamily="monospace" fontSize="xs" placeholder="<div>Your HTML here</div>" /></FormControl>
                        <FormControl><FormLabel fontSize="xs">Custom CSS (JSON object)</FormLabel><Textarea value={block.props.customCss || ""} onChange={(e) => handleChange("customCss", e.target.value)} rows={3} fontFamily="monospace" fontSize="xs" placeholder='{"background":"#f5f5f5","padding":"20px"}' /></FormControl>
                    </>
                )}

                {/* CHILD EDITOR */}
                {currentChild && (
                    <Box bg="blue.50" p={3} borderRadius="md" mt={4}>
                        <HStack justify="space-between" mb={2}><Text fontWeight="bold" fontSize="sm">Editing: {currentChild.type}</Text><Button size="xs" onClick={() => setEditingChildIndex(null)}>Close</Button></HStack>
                        {currentChild.type === 'text' && <RichTextEditor value={currentChild.props.content || ""} onChange={(v) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, content: v } })} />}
                        {currentChild.type === 'list' && <Textarea value={(currentChild.props.items || []).join("\n")} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, items: e.target.value.split("\n") } })} rows={4} />}
                        {currentChild.type === 'hero' && <VStack spacing={2} align="stretch"><Input placeholder="Title" value={currentChild.props.title || ""} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, title: e.target.value } })} /><Input placeholder="Subtitle" value={currentChild.props.subtitle || ""} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, subtitle: e.target.value } })} /><Input placeholder="Image URL" value={currentChild.props.imageUrl || ""} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, imageUrl: e.target.value } })} /></VStack>}
                        {currentChild.type === 'flip' && <Textarea placeholder="Image URLs (one per line)" value={(currentChild.props.images || []).join("\n")} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, images: e.target.value.split("\n").filter(s => s.trim()) } })} rows={3} />}
                        {currentChild.type === 'card' && <Input placeholder="Card Title" value={currentChild.props.title || ""} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, title: e.target.value } })} />}
                        {currentChild.type === 'customHtml' && <Textarea value={currentChild.props.html || ""} onChange={(e) => handleChildChange(editingChildIndex, { ...currentChild, props: { ...currentChild.props, html: e.target.value } })} rows={5} fontFamily="monospace" fontSize="xs" />}
                    </Box>
                )}

            </VStack>
            <AddBlockModal isOpen={isOpen} onClose={onClose} onAddBlock={handleAddChild} />
        </Box>
    );
}

function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex }) {
    return (
        <Box>
            <HStack justify="space-between" mb={2}><Text fontWeight="bold" fontSize="sm">Layers</Text><Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>Add Layer</Button></HStack>
            {children.length === 0 && <Text fontSize="xs" color="gray.400">No layers yet</Text>}
            {children.map((c, i) => (<HStack key={c._id || i} bg={editingIndex === i ? "blue.100" : "gray.50"} p={2} borderRadius="sm" mb={1} cursor="pointer" onClick={() => onEdit(i)} _hover={{ bg: "gray.100" }}><Text fontSize="xs" flex={1} fontWeight={editingIndex === i ? "bold" : "normal"}>{c.type.toUpperCase()}</Text><IconButton icon={<MdEdit />} size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(i); }} aria-label="Edit" /><IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemove(i); }} aria-label="Delete" /></HStack>))}
        </Box>
    );
}
