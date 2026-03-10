const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const anchor = 'Add Option';
const blockPatternStr = `Add Option
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </VStack>
                                                )}
                                            </Box>`;

// We just find 'Add Option', then the next '</Button>', then '</Box>', etc.
// Or we can just use string slice after finding 'Add Option'
const optionIdx = content.indexOf('Add Option');
if (optionIdx !== -1) {
    const btnEnd = content.indexOf('</Button>', optionIdx);
    const boxEnd = content.indexOf('</Box>', btnEnd);
    const ifEnd = content.indexOf(')}', boxEnd);

    // We want to insert right after the ')}'
    const insertionPoint = ifEnd + 2;

    const insertion = `
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Long legal agreement)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}`;

    content = content.substring(0, insertionPoint) + insertion + content.substring(insertionPoint);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Injected via robust string indexing");
} else {
    console.log("Anchor 'Add Option' not found");
}
