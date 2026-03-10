const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// There are multiple field configurations in BlockEditor.jsx (e.g., generic form, coupon credential fields, etc.).
// They all have the "Add Option" button for select fields.
// We will find all instances and inject the checkbox field right after.

const searchString = `                                                                </Button>
                                                            </Box>
                                                        )}`;

const insertString = `
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Long legal agreement)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}`;

// Let's first clean up our previous injection so we don't duplicate it.
const cleanContentStr = content.split(insertString).join("");

// Now inject it globally after every select options box block
const newContent = cleanContentStr.split(searchString).join(searchString + insertString);

fs.writeFileSync(filePath, newContent, 'utf8');

const injectionCount = newContent.split(insertString).length - 1;
console.log(`Injected Checkbox Text editor globally into BlockEditor.jsx (${injectionCount} times)`);
