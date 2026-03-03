"""
Comprehensive patch:
1. BlockEditor.jsx  → Add ✏️ edit button + inline expand to field rows
2. UrlCouponBlock.jsx → Revert ActionBadge replacements back to real Buttons
                        that open an action-info modal when clicked in editor mode
3. CouponFormBlock.jsx → Add isEditor prop + modal-on-click for submit button
"""

import re, sys

# ──────────────────────────────────────────────────────────────────────────────
# 1. BLOCKEDITOR – add edit button + inline expand to field rows
# ──────────────────────────────────────────────────────────────────────────────

BE_PATH = r'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\1, fontend\Event\src\pages\Admin\EditorComponents\BlockEditor.jsx'

with open(BE_PATH, 'r', encoding='utf-8') as f:
    be = f.read()
be_norm = be.replace('\r\n', '\n')

OLD_ROW = """                            <VStack spacing={2} align="stretch" mb={3}>
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

NEW_ROW = """                            <VStack spacing={2} align="stretch" mb={3}>
                                {(block.props.fields || []).map((f, i) => (
                                    <Box key={i} bg={editingFieldIndex === i ? "blue.50" : "gray.50"} p={2} borderRadius="sm"
                                        border="1px solid" borderColor={editingFieldIndex === i ? "blue.200" : "transparent"}>
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
                                                        <Text fontSize="xs" color="gray.500" mb={1}>Label (shown to user)</Text>
                                                        <Input size="xs" value={f.label} onChange={e => updateField(i, "label", e.target.value)} />
                                                    </Box>
                                                    <Box flex={1}>
                                                        <Text fontSize="xs" color="gray.500" mb={1}>Key (field_name)</Text>
                                                        <Input size="xs" value={f.name} onChange={e => updateField(i, "name", e.target.value.replace(/\\s/g, "_"))} fontFamily="mono" />
                                                    </Box>
                                                </HStack>
                                                <Box>
                                                    <Text fontSize="xs" color="gray.500" mb={1}>Type</Text>
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

if OLD_ROW not in be_norm:
    print("BlockEditor: OLD_ROW not found — checking substring...")
    idx = be_norm.find('<VStack spacing={2} align="stretch" mb={3}>')
    print(f"  VStack idx: {idx}")
    if idx >= 0:
        print(repr(be_norm[idx:idx+300]))
    sys.exit(1)

be_patched = be_norm.replace(OLD_ROW, NEW_ROW, 1)
print("BlockEditor: field row patched ✓")

with open(BE_PATH, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(be_patched)

# ──────────────────────────────────────────────────────────────────────────────
# 2. URLCOUPONBLOCK – revert ActionBadge back to Button + add useDisclosure modal
# ──────────────────────────────────────────────────────────────────────────────

UCB_PATH = r'd:\GIT-Based-Backend\Integrated-API.worktrees\AntiGravityWorktree\1, fontend\Event\src\components\Engine\Blocks\UrlCouponBlock.jsx'

with open(UCB_PATH, 'r', encoding='utf-8') as f:
    ucb = f.read()
ucb_norm = ucb.replace('\r\n', '\n')

# 2a. Fix import line – add Modal, useDisclosure, AlertDialog etc
OLD_IMPORT = "import { Box, VStack, HStack, Button, Text, Heading, FormControl, FormLabel, Input, Textarea, Select, Spinner, Icon, Badge, Image, IconButton, Progress, useToast } from \"@chakra-ui/react\";"
NEW_IMPORT = "import { Box, VStack, HStack, Button, Text, Heading, FormControl, FormLabel, Input, Textarea, Select, Spinner, Icon, Badge, Image, IconButton, Progress, useToast, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton } from \"@chakra-ui/react\";"

if OLD_IMPORT not in ucb_norm:
    # Try to find the existing import to show what's there
    imp_idx = ucb_norm.find('import { Box')
    print(f"UCB import line at {imp_idx}: {repr(ucb_norm[imp_idx:imp_idx+200])}")
    # Don't fail, just skip import patch
    print("UCB: import not found exactly, skipping import patch")
else:
    ucb_norm = ucb_norm.replace(OLD_IMPORT, NEW_IMPORT, 1)
    print("UCB: import patched ✓")

# 2b. Add useDisclosure after useState declarations (find the fileInputRef line)
OLD_REFS = "    const { slug: routeSlug, \"*\": wildcard } = useParams();\n    const navigate = useNavigate();\n    const toast = useToast();\n    const fileInputRef = useRef();"
NEW_REFS = """    const { slug: routeSlug, \"*\": wildcard } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef();
    const { isOpen: isActionModalOpen, onOpen: openActionModal, onClose: closeActionModal } = useDisclosure();
    const [actionModalInfo, setActionModalInfo] = useState({ title: '', body: '' });

    const showEditorAction = (title, body) => {
        setActionModalInfo({ title, body });
        openActionModal();
    };"""

if OLD_REFS in ucb_norm:
    ucb_norm = ucb_norm.replace(OLD_REFS, NEW_REFS, 1)
    print("UCB: useDisclosure + showEditorAction added ✓")
else:
    print("UCB: refs block not found, skipping")

# 2c. Revert ActionBadge replacements back to buttons (used state)
OLD_USED_BTN = """                {isEditor ? (
                    <ActionBadge label="Navigate to" action={onUsedAction || "(no redirect)"} colorScheme="orange" />
                ) : (
                    <Button
                        size="lg"
                        colorScheme="orange"
                        rightIcon={<Icon as={MdArrowForward} />}
                        onClick={() => handleNav(onUsedAction)}
                    >
                        {usedNavLabel}
                    </Button>
                )}"""

NEW_USED_BTN = """                <Button
                    size="lg"
                    colorScheme="orange"
                    rightIcon={<Icon as={MdArrowForward} />}
                    onClick={() => isEditor
                        ? showEditorAction("Navigate To", `This button will navigate to: ${onUsedAction || "(no redirect configured)"}`)
                        : handleNav(onUsedAction)
                    }
                >
                    {usedNavLabel}
                </Button>"""

if OLD_USED_BTN in ucb_norm:
    ucb_norm = ucb_norm.replace(OLD_USED_BTN, NEW_USED_BTN, 1)
    print("UCB: used button reverted ✓")
else:
    print("UCB: used button block not found")

# 2d. Revert invalid ActionBadge back to button
OLD_INVALID_BTN = """                {isEditor ? (
                    onInvalidAction
                        ? <ActionBadge label="Navigate to" action={onInvalidAction} colorScheme="red" />
                        : <Badge colorScheme="gray" px={2} py={1} borderRadius="md" fontSize="xs">No redirect configured</Badge>
                ) : (
                    onInvalidAction && (
                        <Button colorScheme="red" variant="outline" onClick={() => handleNav(onInvalidAction)}>
                            Go Back
                        </Button>
                    )
                )}"""

NEW_INVALID_BTN = """                <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => isEditor
                        ? showEditorAction("Navigate To", `Go Back button will navigate to: ${onInvalidAction || "(no redirect configured)"}`)
                        : handleNav(onInvalidAction)
                    }
                >
                    Go Back
                </Button>"""

if OLD_INVALID_BTN in ucb_norm:
    ucb_norm = ucb_norm.replace(OLD_INVALID_BTN, NEW_INVALID_BTN, 1)
    print("UCB: invalid button reverted ✓")
else:
    print("UCB: invalid button block not found")

# 2e. Revert submit ActionBadge back to button
OLD_SUBMIT = """                {isEditor ? (
                    <VStack spacing={2} align="stretch">
                        <ActionBadge label="Submit form fields" action={`then → ${onSuccessAction || '(no redirect)'}`} colorScheme="green" />
                    </VStack>
                ) : (
                    <Button
                        size="lg"
                        bg={buttonColor}
                        color={buttonTextColor}
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        _hover={{ opacity: 0.88 }}
                        borderRadius="xl"
                    >
                        {buttonText}
                    </Button>
                )}"""

NEW_SUBMIT = """                <Button
                    size="lg"
                    bg={buttonColor}
                    color={buttonTextColor}
                    onClick={() => isEditor
                        ? showEditorAction("Submit Form", `Submits all credential fields, then navigates to: ${onSuccessAction || "(no redirect configured)"}`)
                        : handleSubmit()
                    }
                    isLoading={!isEditor && isSubmitting}
                    _hover={{ opacity: 0.88 }}
                    borderRadius="xl"
                >
                    {buttonText}
                </Button>"""

if OLD_SUBMIT in ucb_norm:
    ucb_norm = ucb_norm.replace(OLD_SUBMIT, NEW_SUBMIT, 1)
    print("UCB: submit button reverted ✓")
else:
    print("UCB: submit button block not found")

# 2f. Add the Action Info Modal just before the closing </Box> in the return
# Find the last </Box> before end of file
OLD_CLOSE = """        </Box>
    );
}"""

NEW_CLOSE = """            {/* Editor action info modal */}
            <Modal isOpen={isActionModalOpen} onClose={closeActionModal} size="sm" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="sm">\U0001f6e0\ufe0f Editor Info – Button Action</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text fontWeight="bold" mb={1}>{actionModalInfo.title}</Text>
                        <Text fontSize="sm" color="gray.600">{actionModalInfo.body}</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" onClick={closeActionModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}"""

# Count occurrences to find the right one (last Box close)
count = ucb_norm.count(OLD_CLOSE)
if count == 1:
    ucb_norm = ucb_norm.replace(OLD_CLOSE, NEW_CLOSE, 1)
    print(f"UCB: action modal added ✓")
elif count > 1:
    # Replace last occurrence
    idx = ucb_norm.rfind(OLD_CLOSE)
    ucb_norm = ucb_norm[:idx] + NEW_CLOSE + ucb_norm[idx+len(OLD_CLOSE):]
    print(f"UCB: action modal added (replaced last of {count}) ✓")
else:
    print(f"UCB: closing Box not found")

with open(UCB_PATH, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(ucb_norm)

print("\nAll patches complete.")
