import {
    Box, Flex, Grid, Heading, Text, Button, IconButton,
    Badge, HStack, VStack, Icon, useToast, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalFooter, ModalCloseButton, Input, FormControl, FormLabel, Textarea,
    AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader,
    AlertDialogContent, AlertDialogOverlay, Spinner, Tooltip,
    SimpleGrid, RadioGroup, Radio, Stack, Divider
} from "@chakra-ui/react";
import {
    MdAdd, MdEdit, MdDelete, MdOpenInNew, MdHome,
    MdCheckCircle, MdLayers, MdAutoAwesome, MdQrCode, MdGridView, MdSettings
} from "react-icons/md";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCampaignBySlug, updateCampaign } from "../../services/eventEngineApi";

// ─── Known page definitions ────────────────────────────────────────────────
const DEFAULT_PAGE_DEFINITIONS = [
    { slug: "/", label: "Main Page", description: "Primary landing page visitors see first.", icon: MdHome, required: true },
    { slug: "/success", label: "Success Page", description: "Shown after a successful submission.", icon: MdCheckCircle, required: false },
    { slug: "/claimed", label: "Already Claimed", description: "Shown when a user has already submitted.", icon: MdLayers, required: false },
    { slug: "/invalid", label: "Invalid / Expired", description: "Shown when the event link is invalid.", icon: MdLayers, required: false },
];

// ─── Preset page templates ─────────────────────────────────────────────────
const PAGE_TEMPLATES = [
    {
        id: "blank",
        label: "Blank Page",
        icon: MdGridView,
        description: "Start with an empty canvas.",
        blocks: []
    },
    {
        id: "marketing",
        label: "🎉 Marketing Landing",
        icon: MdAutoAwesome,
        description: "Hero + brand section + CTA button. Perfect for the main event page.",
        blocks: [
            { type: "header", _id: `block-tpl-1`, props: { logo: "", links: [], bgColor: "rgba(255,255,255,0.1)", textColor: "rgba(255,255,255,1)" } },
            { type: "hero", _id: `block-tpl-2`, props: { title: "Event Name", subtitle: "Join us and win amazing prizes!", imageUrl: "" } },
            { type: "text", _id: `block-tpl-3`, props: { content: "<p>Welcome to our event! Fill in the form below to participate.</p>", align: "center" } },
            { type: "couponForm", _id: `block-tpl-4`, props: { title: "Enter Your Details", fields: [{ name: "name", label: "Full Name", type: "text" }, { name: "phone", label: "Phone Number", type: "phone" }], buttonText: "Join Now", buttonColor: "rgba(72,187,120,1)", buttonTextColor: "rgba(255,255,255,1)", onSuccessAction: "/success", onUsedAction: "/claimed", onInvalidAction: "/invalid" } }
        ]
    },
    {
        id: "coupon",
        label: "🎫 Coupon Redemption",
        icon: MdQrCode,
        description: "Reads the code from the URL, verifies it, and shows a configurable form.",
        blocks: [
            { type: "hero", _id: `block-tpl-5`, props: { title: "Redeem Your Code", subtitle: "We're verifying your coupon…" } },
            { type: "urlCoupon", _id: `block-tpl-6`, props: { title: "Enter Your Details", subtitle: "Your code has been verified. Please fill in your information.", fields: [{ name: "name", label: "Full Name", type: "text" }, { name: "phone", label: "Phone Number", type: "phone" }], buttonText: "Claim Now", buttonColor: "rgba(102,126,234,1)", buttonTextColor: "rgba(255,255,255,1)", onSuccessAction: "/success", onUsedAction: "/claimed", onInvalidAction: "/invalid", usedTitle: "Already Claimed", usedNavLabel: "Back to Home", invalidTitle: "Invalid Code" } }
        ]
    },
    {
        id: "success",
        label: "✅ Success Page",
        icon: MdCheckCircle,
        description: "Thank you page shown after successful submission.",
        blocks: [
            { type: "hero", _id: `block-tpl-7`, props: { title: "Thank You! 🎉", subtitle: "Your submission has been received. We'll be in touch soon." } },
            { type: "text", _id: `block-tpl-8`, props: { content: "<p>Keep an eye on your phone for updates.</p>", align: "center" } }
        ]
    }
];

export default function PageManagement() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [campaignData, setCampaignData] = useState(null);
    const [pages, setPages] = useState({});
    const [pagesMeta, setPagesMeta] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Add Page Modal
    const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
    const [newPageSlug, setNewPageSlug] = useState("");
    const [newPageLabel, setNewPageLabel] = useState("");
    const [newPageDescription, setNewPageDescription] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("blank");

    // Delete dialog
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [pageToDelete, setPageToDelete] = useState(null);
    const cancelDeleteRef = useRef();

    // Edit Page Config
    const { isOpen: isEditConfigOpen, onOpen: onEditConfigOpen, onClose: onEditConfigClose } = useDisclosure();
    const [editTargetSlug, setEditTargetSlug] = useState("");
    const [editPageSlug, setEditPageSlug] = useState("");
    const [editPageLabel, setEditPageLabel] = useState("");
    const [editPageDescription, setEditPageDescription] = useState("");

    // ── Load ────────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const data = await getCampaignBySlug(slug);
                if (!mounted) return;
                let pageConfig = {};
                if (data.block_schema?.pages) pageConfig = data.block_schema.pages;
                else if (data.blocks?.pages) pageConfig = data.blocks.pages;
                else if (Array.isArray(data.blocks)) pageConfig = { "/": data.blocks };
                else pageConfig = { "/": [] };
                let metaConfig = {};
                if (data.block_schema?.pages_meta) metaConfig = data.block_schema.pages_meta;
                else if (data.blocks?.pages_meta) metaConfig = data.blocks.pages_meta;

                if (!pageConfig["/"]) pageConfig["/"] = [];
                setCampaignData(data);
                setPages(pageConfig);
                setPagesMeta(metaConfig);
            } catch (e) {
                if (mounted) toast({ status: "error", title: "Failed to load campaign." });
            } finally {
                if (mounted) setIsLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, [slug, toast]);

    // ── Save ────────────────────────────────────────────────────────────────
    async function savePages(newPages, newMeta = pagesMeta) {
        try {
            await updateCampaign(slug, { blocks: { pages: newPages, pages_meta: newMeta } });
            toast({ status: "success", title: "Pages updated.", duration: 2000 });
        } catch (e) {
            toast({ status: "error", title: "Failed to save.", description: e.message });
        }
    }

    // ── Add Page ────────────────────────────────────────────────────────────
    const handleAddPage = async () => {
        let rawSlug = newPageSlug.trim();
        if (!rawSlug) { toast({ status: "warning", title: "Page slug is required." }); return; }
        if (!rawSlug.startsWith("/")) rawSlug = "/" + rawSlug;
        if (pages[rawSlug] !== undefined) { toast({ status: "warning", title: "Page with this slug already exists." }); return; }

        const template = PAGE_TEMPLATES.find(t => t.id === selectedTemplate);
        // Give each template block a fresh unique ID
        const templateBlocks = (template?.blocks || []).map((b, i) => ({
            ...b,
            _id: `block-${Date.now()}-${i}`
        }));

        const newPages = { ...pages, [rawSlug]: templateBlocks };
        const newMeta = { ...pagesMeta, [rawSlug]: { label: newPageLabel, description: newPageDescription } };

        setPages(newPages);
        setPagesMeta(newMeta);
        await savePages(newPages, newMeta);

        setNewPageSlug("");
        setNewPageLabel("");
        setNewPageDescription("");
        setSelectedTemplate("blank");
        onAddClose();

        // Navigate immediately to the editor for this new page
        const editorKey = rawSlug === "/" ? "__root__" : rawSlug.replace(/^\//, "");
        navigate(`/admin/event/${slug}/editor/${editorKey}`);
    };

    // ── Delete ──────────────────────────────────────────────────────────────
    const confirmDelete = (pageSlug) => { setPageToDelete(pageSlug); onDeleteOpen(); };

    const handleDeletePage = async () => {
        if (!pageToDelete || pageToDelete === "/") return;
        const newPages = { ...pages };
        const newMeta = { ...pagesMeta };
        delete newPages[pageToDelete];
        delete newMeta[pageToDelete];
        setPages(newPages);
        setPagesMeta(newMeta);
        await savePages(newPages, newMeta);
        onDeleteClose();
        setPageToDelete(null);
    };

    // ── Navigate & Config ───────────────────────────────────────────────────
    const openEditor = (pageSlug) => {
        const editorKey = pageSlug === "/" ? "__root__" : pageSlug.replace(/^\//, "");
        navigate(`/admin/event/${slug}/editor/${editorKey}`);
    };
    const openPreview = (pageSlug) => window.open(`/event/${slug}${pageSlug}`, "_blank");

    const openEditConfig = (pageSlug) => {
        setEditTargetSlug(pageSlug);
        setEditPageSlug(pageSlug);
        const meta = pagesMeta[pageSlug] || {};
        const knownDef = DEFAULT_PAGE_DEFINITIONS.find(p => p.slug === pageSlug);
        setEditPageLabel(meta.label || knownDef?.label || pageSlug);
        setEditPageDescription(meta.description || knownDef?.description || "");
        onEditConfigOpen();
    };

    const handleSaveConfig = async () => {
        let rawSlug = editPageSlug.trim();
        if (!rawSlug) { toast({ status: "warning", title: "Page slug is required." }); return; }
        if (!rawSlug.startsWith("/")) rawSlug = "/" + rawSlug;

        const newPages = { ...pages };
        const newMeta = { ...pagesMeta };

        // If slug changed
        if (rawSlug !== editTargetSlug) {
            if (newPages[rawSlug] !== undefined) {
                toast({ status: "warning", title: "Page with this slug already exists." }); return;
            }
            newPages[rawSlug] = newPages[editTargetSlug];
            delete newPages[editTargetSlug];

            newMeta[rawSlug] = { label: editPageLabel, description: editPageDescription };
            delete newMeta[editTargetSlug];
        } else {
            newMeta[editTargetSlug] = { label: editPageLabel, description: editPageDescription };
        }

        setPages(newPages);
        setPagesMeta(newMeta);
        await savePages(newPages, newMeta);
        onEditConfigClose();
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    const getBlockCount = (ps) => (pages[ps] || []).length;
    const isRequired = (ps) => DEFAULT_PAGE_DEFINITIONS.some(p => p.slug === ps && p.required);

    const pageKeys = Object.keys(pages);

    if (isLoading) return (
        <Flex h="60vh" align="center" justify="center" direction="column" gap={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="gray.500">Loading pages…</Text>
        </Flex>
    );

    return (
        <Box p={8} maxW="1100px" mx="auto">

            {/* Header */}
            <Flex justify="space-between" align="center" mb={8}>
                <VStack align="start" spacing={1}>
                    <Heading size="lg" color="gray.800">Pages</Heading>
                    <Text color="gray.500" fontSize="sm">Manage and edit event pages. Each page has its own block layout.</Text>
                </VStack>
                <Button leftIcon={<Icon as={MdAdd} />} colorScheme="brand" onClick={onAddOpen} size="md">
                    Add Page
                </Button>
            </Flex>

            {/* Page Cards */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={5}>
                {pageKeys.map((pageSlug) => {
                    const knownDef = DEFAULT_PAGE_DEFINITIONS.find(p => p.slug === pageSlug);
                    const blockCount = getBlockCount(pageSlug);
                    const required = isRequired(pageSlug);

                    return (
                        <Flex
                            key={pageSlug}
                            direction="column"
                            bg="white"
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="gray.200"
                            shadow="sm"
                            overflow="hidden"
                            transition="all 0.2s"
                            _hover={{ shadow: "md", borderColor: "brand.300", transform: "translateY(-2px)" }}
                        >
                            {/* Thumbnail */}
                            <Box
                                h="120px"
                                bg="linear-gradient(135deg, #2563eb 0%, #4338ca 100%)"
                                position="relative"
                                cursor="pointer"
                                onClick={() => openEditor(pageSlug)}
                                role="group"
                            >
                                <Badge
                                    position="absolute" bottom={2} left={2}
                                    bg="blackAlpha.600" color="white"
                                    fontSize="xs" px={2} py={0.5} borderRadius="full"
                                >
                                    {blockCount} block{blockCount !== 1 ? "s" : ""}
                                </Badge>
                                {knownDef && (
                                    <Icon as={knownDef.icon} position="absolute" top={3} right={3}
                                        color="whiteAlpha.700" boxSize={5} />
                                )}
                                {/* Hover overlay */}
                                <Flex
                                    position="absolute" inset={0} align="center" justify="center"
                                    bg="blackAlpha.400" opacity={0}
                                    _groupHover={{ opacity: 1 }} transition="opacity 0.2s"
                                >
                                    <Icon as={MdEdit} color="white" boxSize={8} />
                                </Flex>
                            </Box>

                            {/* Body — fixed height so all cards are equal */}
                            <Box p={4} minH="100px" flex={1}>
                                <Flex justify="space-between" align="start" mb={1}>
                                    <Box flex={1} minW={0} mr={2}>
                                        <Text fontWeight="bold" fontSize="sm" color="gray.800" noOfLines={1}>
                                            {pagesMeta[pageSlug]?.label || knownDef?.label || pageSlug}
                                        </Text>
                                        <Text fontSize="xs" color="brand.500" fontFamily="mono">{pageSlug}</Text>
                                    </Box>
                                    {required && (
                                        <Badge colorScheme="green" fontSize="2xs" flexShrink={0}>Required</Badge>
                                    )}
                                </Flex>
                                <Text fontSize="xs" color="gray.400" mt={1} noOfLines={2} minH="32px">
                                    {pagesMeta[pageSlug]?.description || knownDef?.description || ""}
                                </Text>
                            </Box>

                            {/* Footer — always at bottom */}
                            <Flex
                                px={4} pb={4} pt={3}
                                borderTop="1px solid" borderColor="gray.100"
                                align="center" gap={2}
                            >
                                <Button
                                    size="sm" colorScheme="brand" leftIcon={<Icon as={MdEdit} />}
                                    onClick={() => openEditor(pageSlug)} flex={1}
                                >
                                    Edit
                                </Button>
                                <Tooltip label="Config" hasArrow>
                                    <IconButton size="sm" variant="ghost" icon={<Icon as={MdSettings} />}
                                        aria-label="Config" onClick={() => openEditConfig(pageSlug)} />
                                </Tooltip>
                                <Tooltip label="Preview" hasArrow>
                                    <IconButton size="sm" variant="ghost" icon={<Icon as={MdOpenInNew} />}
                                        aria-label="Preview" onClick={() => openPreview(pageSlug)} />
                                </Tooltip>
                                {!required && (
                                    <Tooltip label="Delete page" hasArrow>
                                        <IconButton size="sm" variant="ghost" colorScheme="red"
                                            icon={<Icon as={MdDelete} />} aria-label="Delete"
                                            onClick={() => confirmDelete(pageSlug)} />
                                    </Tooltip>
                                )}
                            </Flex>
                        </Flex>
                    );
                })}
            </Grid>

            {/* ── Add Page Modal ── */}
            <Modal isOpen={isAddOpen} onClose={onAddClose} isCentered size="xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Add New Page</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={5}>
                            {/* Slug + Label */}
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Page Slug</FormLabel>
                                <Input
                                    placeholder="/thank-you"
                                    value={newPageSlug}
                                    onChange={e => setNewPageSlug(e.target.value)}
                                    fontFamily="mono"
                                />
                                <Text fontSize="xs" color="gray.400" mt={1}>URL path, e.g. <code>/thank-you</code></Text>
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Label (optional)</FormLabel>
                                <Input placeholder="Thank You Page" value={newPageLabel} onChange={e => setNewPageLabel(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Description (optional)</FormLabel>
                                <Textarea rows={2} placeholder="Short note about this page's purpose." value={newPageDescription} onChange={e => setNewPageDescription(e.target.value)} />
                            </FormControl>

                            <Divider />

                            {/* Template Picker */}
                            <Box w="100%">
                                <Text fontWeight="bold" fontSize="sm" mb={3}>Start from a template</Text>
                                <RadioGroup value={selectedTemplate} onChange={setSelectedTemplate}>
                                    <Stack spacing={3}>
                                        {PAGE_TEMPLATES.map(t => (
                                            <Box
                                                key={t.id}
                                                as="label"
                                                display="flex"
                                                alignItems="flex-start"
                                                gap={3}
                                                p={3}
                                                borderRadius="lg"
                                                border="1.5px solid"
                                                borderColor={selectedTemplate === t.id ? "brand.400" : "gray.200"}
                                                bg={selectedTemplate === t.id ? "brand.50" : "white"}
                                                cursor="pointer"
                                                transition="all 0.15s"
                                                _hover={{ borderColor: "brand.300" }}
                                            >
                                                <Radio value={t.id} mt={0.5} colorScheme="brand" />
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm">{t.label}</Text>
                                                    <Text fontSize="xs" color="gray.500">{t.description}</Text>
                                                    {t.blocks.length > 0 && (
                                                        <HStack mt={1} flexWrap="wrap" spacing={1}>
                                                            {t.blocks.map((b, i) => (
                                                                <Badge key={i} colorScheme="brand" fontSize="2xs" variant="subtle">
                                                                    {b.type}
                                                                </Badge>
                                                            ))}
                                                        </HStack>
                                                    )}
                                                </Box>
                                            </Box>
                                        ))}
                                    </Stack>
                                </RadioGroup>
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onAddClose}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handleAddPage}>Create & Edit</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* ── Delete Confirm ── */}
            <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose} isCentered>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">Delete Page</AlertDialogHeader>
                        <AlertDialogBody>
                            Delete <strong>{pageToDelete}</strong>? All blocks on this page will be permanently removed.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelDeleteRef} onClick={onDeleteClose}>Cancel</Button>
                            <Button colorScheme="red" onClick={handleDeletePage} ml={3}>Delete</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* ── Edit Page Config Modal ── */}
            <Modal isOpen={isEditConfigOpen} onClose={onEditConfigClose} isCentered size="md">
                <ModalOverlay />
                <ModalContent borderRadius="2xl">
                    <ModalHeader>Edit Page Config</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm">Page Slug</FormLabel>
                                <Input
                                    value={editPageSlug}
                                    onChange={e => setEditPageSlug(e.target.value)}
                                    fontFamily="mono"
                                    isDisabled={isRequired(editTargetSlug)}
                                />
                                {isRequired(editTargetSlug) && <Text fontSize="xs" color="orange.400" mt={1}>Cannot change slug of required core pages.</Text>}
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Label</FormLabel>
                                <Input value={editPageLabel} onChange={e => setEditPageLabel(e.target.value)} />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Description</FormLabel>
                                <Textarea rows={2} value={editPageDescription} onChange={e => setEditPageDescription(e.target.value)} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onEditConfigClose}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handleSaveConfig}>Save Changes</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
