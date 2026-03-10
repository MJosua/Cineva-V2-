const fs = require('fs');

const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(file, 'utf8');

// Update function signature to accept isNested
content = content.replace(
    /export default function BlockEditor\(\{ block, onChange \}\) \{/,
    'export default function BlockEditor({ block, onChange, isNested = false }) {'
);

// Hide heading and AddBlockModal if nested
content = content.replace(
    /<Heading size="sm" mb=\{4\}>Edit \{block\.type\}<\/Heading>/,
    '{!isNested && <Heading size="sm" mb={4}>Edit {block.type}</Heading>}'
);
content = content.replace(
    /<AddBlockModal isOpen=\{isOpen\} onClose=\{onClose\} onAddBlock=\{handleAddBlockResponse\} \/>/,
    '{!isNested && <AddBlockModal isOpen={isOpen} onClose={onClose} onAddBlock={handleAddBlockResponse} />}'
);

// Prevent nested editors from showing the Child Editor block!
// Wait, the child editor itself uses state.
// We should replace the entire inner child editor rendering:
const childEditorStartStr = '{currentChild && (';
const childEditorStartIndex = content.indexOf(childEditorStartStr);

if (childEditorStartIndex !== -1) {
    const vstackEndIndexStr = '</Box>\n                )}\n\n            </VStack>';
    const childEditorEndIndex = content.indexOf(vstackEndIndexStr, childEditorStartIndex);

    if (childEditorEndIndex !== -1) {
        const replacement = `
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
                        <BlockEditor block={currentChild} onChange={(updated) => handleChildChange(editingChildIndex, updated)} isNested={true} />
                    </Box>
                )}
`;
        content = content.substring(0, childEditorStartIndex - 18) + replacement + content.substring(childEditorEndIndex);
    }
}

// Ensure explicit "Add to Section" vs "Add to Card" labels
content = content.replace(
    /<Button size="xs" leftIcon=\{<MdAdd \/>\} colorScheme="blue" onClick=\{onAdd\}>Add Layer<\/Button>/g,
    '<Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>{onAdd.name === "handleOpenAddBlock" ? "Add to Section" : "Add Layer"}</Button>'
);
// In BlockEditor.jsx, the function pass is `onAdd={() => handleOpenAddBlock(null)}` so `onAdd.name` isn't very helpful.
// Better: Add a prop `addLabel` to ChildrenEditor
content = content.replace(
    /function ChildrenEditor\(\{ children = \[\], onAdd, onRemove, onEdit, editingIndex, onReorder \}\) \{/g,
    'function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex, onReorder, addLabel="Add Layer" }) {'
);
content = content.replace(
    /<Button size="xs" leftIcon=\{<MdAdd \/>\} colorScheme="blue" onClick=\{onAdd\}>Add Layer<\/Button>/g,
    '<Button size="xs" leftIcon={<MdAdd />} colorScheme="blue" onClick={onAdd}>{addLabel}</Button>'
);

// Update ChildrenEditor calls
content = content.replace(
    /<ChildrenEditor children=\{block\.props\.children\} onAdd=\{\(\) => handleOpenAddBlock\(null\)\} onRemove=\{handleRemoveChild\} onEdit=\{\(idx\) => \{ setEditingChildIndex\(idx\); setEditingGrandchildIndex\(null\); \}\} editingIndex=\{editingChildIndex\} onReorder=\{\(c\) => handleChange\("children", c\)\} \/>/g,
    `<ChildrenEditor children={block.props.children} onAdd={() => handleOpenAddBlock(null)} onRemove={handleRemoveChild} onEdit={(idx) => { setEditingChildIndex(idx); setEditingGrandchildIndex(null); }} editingIndex={editingChildIndex} onReorder={(c) => handleChange("children", c)} addLabel={"Add to " + block.type.toUpperCase()} />`
);

fs.writeFileSync(file, content);
console.log("Patched recursively!");
