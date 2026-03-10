const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EditorComponents', 'BlockEditor.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const checkboxBlock = `
                                                        {f.type === 'checkbox' && (
                                                            <Box borderTop="1px dashed" borderColor="gray.200" pt={2} mt={1}>
                                                                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>Checkbox Text (Long legal agreement)</Text>
                                                                <Textarea size="xs" value={f.checkboxText || ""} onChange={e => updateField(i, "checkboxText", e.target.value)} placeholder="By checking this box, I agree..." rows={3} />
                                                            </Box>
                                                        )}`;

// Clean up any existing injections first
// using a regex to match the block loosely
const regex = /\{f\.type === 'checkbox' && \([\s\S]*?<Textarea.*?checkboxText.*?[\s\S]*?\}\)/g;
content = content.replace(regex, '');

// Now inject after every "Add Option... </Button> ... </Box> ... )}" 
let modifiedContent = "";
let searchString = 'Add Option';
let currentIndex = 0;

while (true) {
    const idx = content.indexOf(searchString, currentIndex);
    if (idx === -1) {
        modifiedContent += content.substring(currentIndex);
        break;
    }

    const btnEnd = content.indexOf('</Button>', idx);
    const boxEnd = content.indexOf('</Box>', btnEnd);
    const ifEnd = content.indexOf(')}', boxEnd);
    const insertionPoint = ifEnd + 2;

    modifiedContent += content.substring(currentIndex, insertionPoint);
    modifiedContent += checkboxBlock;

    currentIndex = insertionPoint;
}

fs.writeFileSync(filePath, modifiedContent, 'utf8');
console.log("Successfully injected Checkbox Text into all " + (modifiedContent.split('Checkbox Text (Long legal agreement)').length - 1) + " field arrays.");
