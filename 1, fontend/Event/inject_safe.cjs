const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the "✅ Checkbox / Agreement" option to EVERY <Select> that has a "select" option.
// (There are 4 such dropdowns: 2 for inline edit, 2 for 'new field' add)
content = content.replace(
    /<option value="select">Select<\/option>/g,
    `<option value="select">Select</option>
                                                                <option value="checkbox">✅ Checkbox / Agreement</option>`
);

// 2. Add the Checkbox Text property area right after the Options editing box (which ends after the Add Option button)
const checkboxEditorBlock = `
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Long legal agreement)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}`;

const targetSearchBlock = `                                                                    Add Option
                                                                </Button>
                                                            </Box>
                                                        )}`;

content = content.replace(
    new RegExp(targetSearchBlock.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'),
    targetSearchBlock + checkboxEditorBlock
);

fs.writeFileSync(filePath, content, 'utf8');

console.log("Injections completed.");
