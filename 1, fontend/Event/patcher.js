const fs = require('fs');

const FILE = "d:\\GIT-Based-Backend\\Integrated-API.worktrees\\AntiGravityWorktree\\1, fontend\\Event\\src\\pages\\Admin\\EditorComponents\\BlockEditor.jsx";

let content = fs.readFileSync(FILE, 'utf-8');

// 1. Add editingGrandchildIndex state
content = content.replace(
    'const [addingTo, setAddingTo] = useState(null); // null means root block, number means nested child index',
    'const [addingTo, setAddingTo] = useState(null); // null means root block, number means nested child index\n    const [editingGrandchildIndex, setEditingGrandchildIndex] = useState(null);'
);

// 2. Add children normalization
content = content.replace(
    '// Run when switching blocks or types',
    `// Run when switching blocks or types
    
    // Normalize children to have _id
    useEffect(() => {
        if (block?.props?.children && Array.isArray(block.props.children)) {
            let modified = false;
            const normalize = (children) => {
                return children.map(c => {
                    let newC = { ...c };
                    if (!newC._id) { newC._id = \`blk_\${Math.random().toString(36).substr(2, 9)}_\${Date.now()}\`; modified = true; }
                    if (newC.props && newC.props.children) {
                        const newNested = normalize(newC.props.children);
                        if (newC.props.children !== newNested) {
                            newC.props = { ...newC.props, children: newNested };
                        }
                    }
                    return newC;
                });
            }
            const normalizedRoot = normalize(block.props.children);
            if (modified) {
                setTimeout(() => handleChange("children", normalizedRoot), 0);
            }
        }
    }, [block?.id, block?.type]);`
);


// 3. Update handleAddBlockResponse
content = content.replace(
    `    const handleAddBlockResponse = (newBlock) => {
        if (addingTo === null) {\n            // Adding to root block layers
            onChange({ ...block, props: { ...block.props, children: [...(block.props.children || []), newBlock] } });
        } else {
            // Adding to a specific nested child (like Card)
            const childIndex = addingTo;
            const currentChild = (block.props.children || [])[childIndex];
            const updatedChild = { ...currentChild, props: { ...currentChild.props, children: [...(currentChild.props.children || []), newBlock] } };
            const newChildren = [...(block.props.children || [])];
            newChildren[childIndex] = updatedChild;
            onChange({ ...block, props: { ...block.props, children: newChildren } });
        }
        onClose();
    };`,
    `    const handleAddBlockResponse = (newBlock) => {
        const blockWithId = { ...newBlock, _id: \`blk_\${Math.random().toString(36).substr(2, 9)}_\${Date.now()}\` };
        if (addingTo === null) {
            onChange({ ...block, props: { ...block.props, children: [...(block.props.children || []), blockWithId] } });
        } else {
            const childIndex = addingTo;
            const currentChild = (block.props.children || [])[childIndex];
            const updatedChild = { ...currentChild, props: { ...currentChild.props, children: [...(currentChild.props.children || []), blockWithId] } };
            const newChildren = [...(block.props.children || [])];
            newChildren[childIndex] = updatedChild;
            onChange({ ...block, props: { ...block.props, children: newChildren } });
        }
        onClose();
    };`
);

// 4. Update Root Level ChildrenEditor to pass onReorder
// Replace: <ChildrenEditor children={block.props.children} onAdd={() => handleOpenAddBlock(null)} onRemove={handleRemoveChild} onEdit={setEditingChildIndex} editingIndex={editingChildIndex} />
content = content.replaceAll(
    `<ChildrenEditor children={block.props.children} onAdd={() => handleOpenAddBlock(null)} onRemove={handleRemoveChild} onEdit={setEditingChildIndex} editingIndex={editingChildIndex} />`,
    `<ChildrenEditor children={block.props.children} onAdd={() => handleOpenAddBlock(null)} onRemove={handleRemoveChild} onEdit={(idx) => { setEditingChildIndex(idx); setEditingGrandchildIndex(null); }} editingIndex={editingChildIndex} onReorder={(c) => handleChange("children", c)} />`
);


// 5. Replace CHILD EDITOR
const childEditorStartStr = "{/* CHILD EDITOR */}";
const childEditorEndStr = "</VStack>\n            <AddBlockModal";

const childEditorStartIndex = content.indexOf(childEditorStartStr);
const childEditorEndIndex = content.indexOf(childEditorEndStr);

const renderLayerFunction = `
    const renderLayerForm = (layerBlock, onLayerChange, level) => {
        return (
            <VStack spacing={3} align="stretch">
                {layerBlock.type === 'text' && (
                    <FormControl>
                        <FormLabel fontSize="xs">Content</FormLabel>
                        <RichTextEditor value={layerBlock.props.content || ""} onChange={(v) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, content: v } })} />
                    </FormControl>
                )}

                {layerBlock.type === 'card' && (
                    <VStack spacing={3} align="stretch">
                        <FormControl><FormLabel fontSize="xs">Card Title</FormLabel><Input size="sm" bg="white" placeholder="Title" value={layerBlock.props.title || ""} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, title: e.target.value } })} /></FormControl>
                        <ImageField label="Card Image" value={layerBlock.props.imageUrl} onChange={(url) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, imageUrl: url } })} />
                        <HStack>
                            <ColorPicker label="BG Color" value={layerBlock.props.bgColor || "rgba(255,255,255,1)"} onChange={(v) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, bgColor: v } })} />
                            <ColorPicker label="Text Color" value={layerBlock.props.textColor || "rgba(0,0,0,1)"} onChange={(v) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, textColor: v } })} />
                        </HStack>
                        {level === 1 && (
                            <Box borderTop="1px solid" borderColor="blue.100" pt={2} mt={2}>
                                <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.500">CARD CONTENT (LAYERS)</Text>
                                <ChildrenEditor
                                    children={layerBlock.props.children}
                                    onAdd={() => handleOpenAddBlock(editingChildIndex)}
                                    onRemove={(childIdx) => {
                                        const newNestedChildren = (layerBlock.props.children || []).filter((_, idx) => idx !== childIdx);
                                        onLayerChange({ ...layerBlock, props: { ...layerBlock.props, children: newNestedChildren } });
                                        if (editingGrandchildIndex === childIdx) setEditingGrandchildIndex(null);
                                    }}
                                    onEdit={(idx) => setEditingGrandchildIndex(idx)}
                                    editingIndex={editingGrandchildIndex}
                                    onReorder={(newChildren) => {
                                        onLayerChange({ ...layerBlock, props: { ...layerBlock.props, children: newChildren } });
                                    }}
                                />
                                {editingGrandchildIndex !== null && layerBlock?.props?.children?.[editingGrandchildIndex] && (
                                    <Box bg="purple.50" p={4} borderRadius="md" mt={4} border="1px solid" borderColor="purple.100" shadow="sm">
                                        <HStack justify="space-between" mb={3}>
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="bold" fontSize="xs" color="purple.600" textTransform="uppercase">Editing Inner Layer</Text>
                                                <Text fontWeight="bold" fontSize="sm">{layerBlock.props.children[editingGrandchildIndex].type.toUpperCase()}</Text>
                                            </VStack>
                                            <Button size="xs" variant="ghost" colorScheme="purple" onClick={() => setEditingGrandchildIndex(null)}>Close</Button>
                                        </HStack>
                                        {renderLayerForm(layerBlock.props.children[editingGrandchildIndex], (newGrandChild) => {
                                            const newNestedChildren = [...(layerBlock.props.children || [])];
                                            newNestedChildren[editingGrandchildIndex] = newGrandChild;
                                            onLayerChange({ ...layerBlock, props: { ...layerBlock.props, children: newNestedChildren }});
                                        }, 2)}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </VStack>
                )}

                {layerBlock.type === 'list' && (
                    <FormControl>
                        <FormLabel fontSize="xs">List Items (one per line)</FormLabel>
                        <Textarea size="sm" bg="white" value={(layerBlock.props.items || []).join("\\n")} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, items: e.target.value.split("\\n") } })} rows={4} />
                    </FormControl>
                )}

                {layerBlock.type === 'hero' && (
                    <VStack spacing={2} align="stretch">
                        <Input size="sm" bg="white" placeholder="Title" value={layerBlock.props.title || ""} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, title: e.target.value } })} />
                        <Input size="sm" bg="white" placeholder="Subtitle" value={layerBlock.props.subtitle || ""} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, subtitle: e.target.value } })} />
                        <ImageField label="Hero Image" value={layerBlock.props.imageUrl} onChange={(url) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, imageUrl: url } })} />
                    </VStack>
                )}

                {layerBlock.type === 'flip' && (
                    <FormControl>
                        <FormLabel fontSize="xs">Images (select multiple via picker or one per line)</FormLabel>
                        <VStack align="stretch" spacing={2}>
                            <Textarea size="sm" bg="white" placeholder="Image URLs" value={(layerBlock.props.images || []).join("\\n")} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, images: e.target.value.split("\\n").filter(s => s.trim()) } })} rows={3} />
                            <MediaPickerModal onSelect={(url) => {
                                const currentImages = layerBlock.props.images || [];
                                onLayerChange({ ...layerBlock, props: { ...layerBlock.props, images: [...currentImages, url] } });
                            }} />
                        </VStack>
                    </FormControl>
                )}

                {layerBlock.type === 'customHtml' && (
                    <FormControl>
                        <FormLabel fontSize="xs">HTML Code</FormLabel>
                        <Textarea size="sm" bg="white" value={layerBlock.props.html || ""} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, html: e.target.value } })} rows={5} fontFamily="monospace" fontSize="xs" />
                    </FormControl>
                )}

                {layerBlock.type === 'overlay' && (
                    <VStack spacing={3} align="stretch">
                        <ImageField label="Overlay Image Asset" value={layerBlock.props.imageUrl} onChange={(url) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, imageUrl: url } })} />
                        <HStack spacing={4}>
                            <FormControl flex={1}><FormLabel fontSize="xs">Top</FormLabel><Input size="sm" value={layerBlock.props.top || "auto"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, top: e.target.value } })} /></FormControl>
                            <FormControl flex={1}><FormLabel fontSize="xs">Left</FormLabel><Input size="sm" value={layerBlock.props.left || "auto"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, left: e.target.value } })} /></FormControl>
                        </HStack>
                        <HStack spacing={4}>
                            <FormControl flex={1}><FormLabel fontSize="xs">Bottom</FormLabel><Input size="sm" value={layerBlock.props.bottom || "auto"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, bottom: e.target.value } })} /></FormControl>
                            <FormControl flex={1}><FormLabel fontSize="xs">Right</FormLabel><Input size="sm" value={layerBlock.props.right || "auto"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, right: e.target.value } })} /></FormControl>
                        </HStack>
                        <HStack spacing={4}>
                            <FormControl flex={1}><FormLabel fontSize="xs">Width</FormLabel><Input size="sm" value={layerBlock.props.width || "auto"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, width: e.target.value } })} /></FormControl>
                            <FormControl flex={1}><FormLabel fontSize="xs">Max Width</FormLabel><Input size="sm" value={layerBlock.props.maxWidth || "200px"} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, maxWidth: e.target.value } })} /></FormControl>
                        </HStack>
                        <HStack spacing={4}>
                            <FormControl flex={1}><FormLabel fontSize="xs">Z-Index</FormLabel><Input type="number" size="sm" value={layerBlock.props.zIndex || 10} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, zIndex: e.target.value } })} /></FormControl>
                            <FormControl flex={1}><FormLabel fontSize="xs">Opacity (0-1)</FormLabel><Input type="number" step="0.1" size="sm" value={layerBlock.props.opacity || 1} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, opacity: e.target.value } })} /></FormControl>
                        </HStack>
                        <FormControl><FormLabel fontSize="xs">Custom CSS (JSON)</FormLabel><Textarea value={layerBlock.props.customCss || ""} onChange={(e) => onLayerChange({ ...layerBlock, props: { ...layerBlock.props, customCss: e.target.value } })} rows={2} fontFamily="monospace" fontSize="xs" /></FormControl>
                    </VStack>
                )}
            </VStack>
        );
    };

    return (
        <Box bg="white" p={4} borderRadius="md" shadow="sm" maxH="100%" overflowY="auto">
            <Heading size="sm" mb={4}>Edit {block.type}</Heading>
            <VStack spacing={4} align="stretch">
                {/* CHILD EDITOR */}
                {currentChild && (
                    <Box bg="blue.50" p={4} borderRadius="md" mt={4} border="1px solid" borderColor="blue.100" shadow="sm">
                        <HStack justify="space-between" mb={3}>
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="xs" color="blue.600" textTransform="uppercase">Editing Layer</Text>
                                <Text fontWeight="bold" fontSize="sm">{currentChild.type.toUpperCase()}</Text>
                            </VStack>
                            <Button size="xs" variant="ghost" colorScheme="blue" onClick={() => { setEditingChildIndex(null); setEditingGrandchildIndex(null); }}>Close</Button>
                        </HStack>
                        {renderLayerForm(currentChild, (updated) => handleChildChange(editingChildIndex, updated), 1)}
                    </Box>
                )}
`;

content = content.substring(0, childEditorStartIndex) + renderLayerFunction + "\n" + content.substring(childEditorEndIndex);

// 6. Update ChildrenEditor component at the bottom
const childrenEditorStartStr = "function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex }) {";
const childrenEditorNew = `function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex, onReorder }) {
    if (!onReorder) {
        // Fallback for deeply nested blocks without reordering wrapper yet
        return (
            <Box>
                <HStack justify="space-between" mb={2}><Text fontWeight="bold" fontSize="sm">Layers</Text><Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>Add Layer</Button></HStack>
                {children.length === 0 && <Text fontSize="xs" color="gray.400">No layers yet</Text>}
                {children.map((c, i) => (<HStack key={c._id || i} bg={editingIndex === i ? "blue.100" : "gray.50"} p={2} borderRadius="sm" mb={1} cursor="pointer" onClick={() => onEdit(i)} _hover={{ bg: "gray.100" }}><Text fontSize="xs" flex={1} fontWeight={editingIndex === i ? "bold" : "normal"}>{c.type.toUpperCase()}</Text><IconButton icon={<MdEdit />} size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(i); }} aria-label="Edit" /><IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemove(i); }} aria-label="Delete" /></HStack>))}
            </Box>
        );
    }

    return (
        <Box>
            <HStack justify="space-between" mb={2}><Text fontWeight="bold" fontSize="sm">Layers</Text><Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>Add Layer</Button></HStack>
            {children.length === 0 && <Text fontSize="xs" color="gray.400">No layers yet</Text>}
            <Reorder.Group axis="y" values={children} onReorder={onReorder}>
                {children.map((c, i) => (
                    <Reorder.Item key={c._id || i} value={c}>
                        <HStack bg={editingIndex === i ? "blue.100" : "gray.50"} p={2} borderRadius="sm" mb={1} cursor="pointer" onClick={() => onEdit(i)} _hover={{ bg: "gray.100" }}>
                            <Box cursor="grab" color="gray.300" _hover={{ color: "gray.500" }}><MdDragIndicator size={18} /></Box>
                            <Text fontSize="xs" flex={1} fontWeight={editingIndex === i ? "bold" : "normal"}>{c.type.toUpperCase()}</Text>
                            <IconButton icon={<MdEdit />} size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(i); }} aria-label="Edit" />
                            <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); onRemove(i); }} aria-label="Delete" />
                        </HStack>
                    </Reorder.Item>
                ))}
            </Reorder.Group>
        </Box>
    );
}`;

content = content.replace(childrenEditorStartStr, "\n\n/* REPLACED BELOW */\n");
const lastBoxReturn = content.lastIndexOf("return (\n        <Box>\n            <HStack justify=\"space-between\"");
content = content.substring(0, lastBoxReturn - 100); // strip out old function completely
content = content + "\n\n" + childrenEditorNew + "\n";


fs.writeFileSync(FILE, content);
console.log("Patched successfully!");
