import sys

fpath = r'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\1, fontend\Event\src\pages\Admin\EditorComponents\BlockEditor.jsx'

with open(fpath, 'r', encoding='utf-8') as f:
    src = f.read()

# The old field row block (use a portion unique enough to find)
OLD = r"""                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <HStack key={i} bg="gray.50" p={2} borderRadius="sm">
                                        <IconButton icon={<MdArrowUpward />} size="xs" variant="ghost" onClick={() => moveField(i, -1)} isDisabled={i === 0} aria-label="Up" />
                                        <IconButton icon={<MdArrowDownward />} size="xs" variant="ghost" onClick={() => moveField(i, 1)} isDisabled={i === (block.props.fields?.length || 1) - 1} aria-label="Down" />
                                        <Text fontSize="xs" fontWeight="bold">{f.label}</Text>
                                        <Tag size="sm" colorScheme="purple"><TagLabel>{f.type}</TagLabel></Tag>
                                        <Code fontSize="xs">{f.name}</Code>
                                        <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => removeField(i)} aria-label="Del" ml="auto" />
                                    </HStack>
                                ))}
                            </VStack>"""

NEW = r"""                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <Box key={i} bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm" border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
                                        <HStack>
                                            <IconButton icon={<MdArrowUpward />} size="xs" variant="ghost" onClick={() => moveField(i, -1)} isDisabled={i === 0} aria-label="Up" />
                                            <IconButton icon={<MdArrowDownward />} size="xs" variant="ghost" onClick={() => moveField(i, 1)} isDisabled={i === (block.props.fields?.length || 1) - 1} aria-label="Down" />
                                            <Text fontSize="xs" fontWeight="bold" flex={1}>{f.label}</Text>
                                            <Tag size="sm" colorScheme="purple"><TagLabel>{f.type || "text"}</TagLabel></Tag>
                                            <Code fontSize="xs">{f.name}</Code>
                                            <IconButton
                                                icon={<MdEdit />}
                                                size="xs"
                                                colorScheme={editingFieldIndex === i ? "blue" : "gray"}
                                                variant={editingFieldIndex === i ? "solid" : "ghost"}
                                                onClick={() => setEditingFieldIndex(editingFieldIndex === i ? null : i)}
                                                aria-label="Edit"
                                            />
                                            <IconButton icon={<MdDelete />} size="xs" colorScheme="red" variant="ghost" onClick={() => removeField(i)} aria-label="Del" />
                                        </HStack>
                                        {editingFieldIndex === i && (
                                            <VStack mt={2} spacing={2} align="stretch">
                                                <HStack>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" color="gray.500" mb={0.5}>Label (shown to user)</Text>
                                                        <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" color="gray.500" mb={0.5}>Key (field_name)</Text>
                                                        <Input size="xs" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/\s/g, "_"))} fontFamily="mono" />
                                                    </Box>
                                                </HStack>
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={0.5}>Type</Text>
                                                    <Select size="xs" value={f.type || "text"} onChange={e => updateField(i, "type", e.target.value)}>
                                                        <option value="text">Text</option>
                                                        <option value="email">Email</option>
                                                        <option value="phone">Phone</option>
                                                        <option value="textarea">Long text</option>
                                                        <option value="select">Select</option>
                                                        <option value="image">\U0001f4f7 Image upload</option>
                                                    </Select>
                                                </Box>
                                            </VStack>
                                        )}
                                    </Box>
                                ))}
                            </VStack>"""

# Normalize CRLF -> LF for matching
src_norm = src.replace('\r\n', '\n')
old_norm = OLD.replace('\r\n', '\n')

if old_norm not in src_norm:
    print('ERROR: Target string not found in file.')
    # Print a snippet to help debug
    idx = src_norm.find('<VStack spacing={2} align="stretch" mb={3}>')
    print(f'VStack found at: {idx}')
    if idx >= 0:
        print(repr(src_norm[idx:idx+400]))
    sys.exit(1)

patched = src_norm.replace(old_norm, NEW, 1)
# Write back with CRLF
with open(fpath, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(patched)

print('SUCCESS: Field edit row patched.')
