const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the broken block before ChildrenEditor
const brokenBlockStart = `function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex, onReorder, addLabel="Add Layer" })
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={2}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Shown to user)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )} {`;

const fixedChildrenEditorStart = `function ChildrenEditor({ children = [], onAdd, onRemove, onEdit, editingIndex, onReorder, addLabel="Add Layer" }) {`;

if (content.includes(brokenBlockStart)) {
    content = content.replace(brokenBlockStart, fixedChildrenEditorStart);
    console.log("Fixed ChildrenEditor definition");
} else {
    // If exact whitespace didn't match, let's use a regex that handles whitespace
    const brokenRegex = /function ChildrenEditor\(\{.*?\}\)\s*\{f\.type === 'checkbox' && \([\s\S]*?\)\s*\}\s*\{/;
    if (content.match(brokenRegex)) {
        content = content.replace(brokenRegex, fixedChildrenEditorStart);
        console.log("Fixed ChildrenEditor definition using regex");
    } else {
        console.log("Could not find the broken ChildrenEditor block!");
    }
}

// 2. Insert the checkboxText property inside the fields map correctly
const selectEndStr = `                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                )}
                                            </Box>`;

const selectEndIndex = content.indexOf(selectEndStr);
if (selectEndIndex !== -1) {
    const replacement = `                                                                </Button>
                                                            </Box>
                                                        )}
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={2}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Shown to user)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                )}
                                            </Box>`;

    // Make sure we only replace the FIRST occurrence we care about
    // (There should only be one in the fields map inner loop)
    content = content.substring(0, selectEndIndex) + replacement + content.substring(selectEndIndex + selectEndStr.length);
    console.log("Injected checkboxText properly");
} else {
    console.log("Could not find select block end to inject checkboxText");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
