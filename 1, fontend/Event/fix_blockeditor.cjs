const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const childEditorStartStr = '{/* CHILD EDITOR */}';
const childEditorStartIndex = content.indexOf(childEditorStartStr);

const childEditorEndStr = '{!isNested && <AddBlockModal isOpen={isOpen} onClose={onClose} onAddBlock={handleAddBlockResponse} />}';
const childEditorEndIndex = content.indexOf(childEditorEndStr);

if (childEditorStartIndex !== -1 && childEditorEndIndex !== -1) {
    // Find the nearest </VStack> before childEditorEndStr
    const chunkBeforeEnd = content.slice(childEditorStartIndex, childEditorEndIndex);
    const vStackClosingIndexRaw = chunkBeforeEnd.lastIndexOf('</VStack>');

    if (vStackClosingIndexRaw !== -1) {
        const replacementEndIndex = childEditorStartIndex + vStackClosingIndexRaw + '</VStack>'.length;

        const replacement = `{/* CHILD EDITOR */}
                {currentChild && (
                    <Box bg="blue.50" p={4} borderRadius="md" mt={4} border="1px solid" borderColor="blue.100" shadow="sm">
                        <HStack justify="space-between" mb={3}>
                            <VStack align="start" spacing={0}>
                                <Text fontWeight="bold" fontSize="xs" color="blue.600" textTransform="uppercase">Editing Layer</Text>
                                <Text fontWeight="bold" fontSize="sm">{currentChild.type.toUpperCase()}</Text>
                            </VStack>
                            <Button size="xs" variant="ghost" colorScheme="blue" onClick={() => { setEditingChildIndex(null); setEditingGrandchildIndex(null); }}>Close</Button>
                        </HStack>
                        <Box bg="white" borderRadius="md" border="1px solid" borderColor="blue.200" overflow="hidden">
                            <BlockEditor block={currentChild} onChange={(updated) => handleChildChange(editingChildIndex, updated)} isNested={true} />
                        </Box>
                    </Box>
                )}

            </VStack>`;

        content = content.slice(0, childEditorStartIndex) + replacement + content.slice(replacementEndIndex);
        console.log('Successfully applied CHILD EDITOR replacement!');
    } else {
        console.log('failed to find trailing </VStack>');
    }
} else {
    console.log('Failed to find CHILD EDITOR bounds.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done fixing BlockEditor.jsx nested block rendering');
