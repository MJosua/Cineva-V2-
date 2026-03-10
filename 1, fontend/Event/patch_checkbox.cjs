const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /Add Option[\s\S]*?<\/Button>[\s\S]*?<\/Box>[\s\S]*?}\)/;
const match = content.match(regex);

if (match) {
    const insertion = `
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={2}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Shown to user)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}`;
    content = content.replace(regex, match[0] + insertion);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully injected checkboxText properties editor into BlockEditor.jsx");
} else {
    console.log("Failed to match regex in BlockEditor.jsx");
}
