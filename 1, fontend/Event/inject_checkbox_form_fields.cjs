const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const anchor = 'Add Option';
const firstOccurrence = content.indexOf(anchor);

// Ensure we find the FIRST occurrence (for Form Fields array).
// The SECOND occurrence was for Credential Fields array.
if (firstOccurrence !== -1) {
    const btnEnd = content.indexOf('</Button>', firstOccurrence);
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

    const chunkBefore = content.substring(0, insertionPoint);

    // Safety check so we don't accidentally do it twice if we already did
    if (!chunkBefore.includes('Checkbox Text (Long legal agreement)')) {
        content = chunkBefore + insertion + content.substring(insertionPoint);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Injected Checkbox Text field securely into Form Fields editor block");
    } else {
        console.log("Already injected there?");
    }
} else {
    console.log("Anchor 'Add Option' not found at all.");
}
