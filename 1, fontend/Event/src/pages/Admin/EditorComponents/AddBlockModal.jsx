import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    Box, Text, Icon, VStack, HStack, Tabs, TabList, Tab, TabPanels, TabPanel, Badge, Flex
} from "@chakra-ui/react";
import {
    MdTextFields, MdList, MdViewCarousel, MdViewDay, MdGridView,
    MdReceipt, MdWeb, MdCode, MdQrCode, MdPhotoSizeSelectActual,
    MdAutoAwesome
} from "react-icons/md";

// ── Block catalog with categories ──────────────────────────────────────────
const BLOCK_CATALOG = {
    Layout: [
        {
            type: "header",
            label: "Header / Navbar",
            description: "Sticky top bar with logo and navigation links.",
            icon: MdWeb,
            color: "blue",
            defaultProps: { logo: "", links: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(51,51,51,1)" }
        },
        {
            type: "section",
            label: "Section Container",
            description: "Full-width container to hold nested block layers.",
            icon: MdViewDay,
            color: "cyan",
            defaultProps: { background: "rgba(255,255,255,0)", children: [] }
        },
        {
            type: "card",
            label: "Card",
            description: "Bordered card block with optional child layers.",
            icon: MdGridView,
            color: "teal",
            defaultProps: { title: "Card Title", children: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(0,0,0,1)" }
        },
    ],
    Content: [
        {
            type: "hero",
            label: "Hero Section",
            description: "Large brand display: title, subtitle, and optional image.",
            icon: MdAutoAwesome,
            color: "purple",
            defaultProps: { title: "Event Title", subtitle: "Join us!", imageUrl: "", bgColor: "rgba(255,255,255,0)", textColor: "rgba(0,0,0,1)" }
        },
        {
            type: "text",
            label: "Rich Text",
            description: "Styled paragraph with WYSIWYG editing support.",
            icon: MdTextFields,
            color: "gray",
            defaultProps: { content: "<p>Enter your text here...</p>", align: "center" }
        },
        {
            type: "list",
            label: "Bullet List",
            description: "Simple bulleted list, great for terms or instructions.",
            icon: MdList,
            color: "orange",
            defaultProps: { items: ["Item 1", "Item 2", "Item 3"], textColor: "rgba(0,0,0,1)" }
        },
        {
            type: "flip",
            label: "Image Slideshow",
            description: "Auto-rotating image carousel / banner.",
            icon: MdViewCarousel,
            color: "pink",
            defaultProps: { images: [], interval: 3000, direction: "horizontal" }
        },
    ],
    Interactive: [
        {
            type: "couponForm",
            label: "Dynamic Form",
            description: "Configurable submission form. Connects to reward pool.",
            icon: MdReceipt,
            color: "green",
            defaultProps: {
                title: "Submit Your Receipt",
                description: "",
                fields: [],
                buttonText: "Submit",
                buttonColor: "rgba(72,187,120,1)",
                buttonTextColor: "rgba(255,255,255,1)",
                onSuccessAction: "/success",
                onUsedAction: "/claimed",
                onInvalidAction: "/invalid"
            }
        },
        {
            type: "urlCoupon",
            label: "Auto Fetch Coupon",
            description: "Reads a code from the URL path, verifies it, then shows a configurable form.",
            icon: MdQrCode,
            color: "red",
            badge: "NEW",
            defaultProps: {
                title: "Verify Your Code",
                subtitle: "Your coupon is being checked automatically.",
                fields: [],
                buttonText: "Submit",
                buttonColor: "rgba(72,187,120,1)",
                buttonTextColor: "rgba(255,255,255,1)",
                invalidTitle: "Invalid Code",
                invalidMessage: "This code does not exist or has expired.",
                usedTitle: "Already Claimed",
                usedMessage: "This code has already been used.",
                usedNavLabel: "Back to Home",
                onSuccessAction: "/success",
                onUsedAction: "/claimed",
                onInvalidAction: "/invalid"
            }
        },
    ],
    Advanced: [
        {
            type: "customHtml",
            label: "Custom HTML",
            description: "Paste raw HTML + CSS for fully custom blocks.",
            icon: MdCode,
            color: "gray",
            defaultProps: { html: "<div style='padding:20px;text-align:center;'>Custom HTML here</div>", customCss: "" }
        },
    ],
};

// ── Block Card ─────────────────────────────────────────────────────────────
function BlockCard({ template, onSelect }) {
    return (
        <Box
            p={4}
            border="1.5px solid"
            borderColor="gray.200"
            borderRadius="xl"
            cursor="pointer"
            _hover={{ borderColor: `${template.color}.400`, bg: `${template.color}.50`, shadow: "md" }}
            onClick={() => onSelect(template)}
            transition="all 0.15s"
            position="relative"
        >
            {template.badge && (
                <Badge colorScheme="red" fontSize="2xs" position="absolute" top={2} right={2}>
                    {template.badge}
                </Badge>
            )}
            <VStack spacing={2} align="start">
                <Flex
                    w={10} h={10}
                    borderRadius="lg"
                    bg={`${template.color}.100`}
                    align="center"
                    justify="center"
                >
                    <Icon as={template.icon} boxSize={5} color={`${template.color}.600`} />
                </Flex>
                <Box>
                    <Text fontWeight="bold" fontSize="sm" color="gray.800">{template.label}</Text>
                    <Text fontSize="xs" color="gray.400" mt={0.5} noOfLines={2}>{template.description}</Text>
                </Box>
            </VStack>
        </Box>
    );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export default function AddBlockModal({ isOpen, onClose, onAddBlock }) {
    const handleSelect = (template) => {
        onAddBlock({
            type: template.type,
            props: { ...template.defaultProps },
            _id: `block-${Date.now()}`
        });
        onClose();
    };

    const categories = Object.keys(BLOCK_CATALOG);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <ModalContent borderRadius="2xl" overflow="hidden">
                <ModalHeader
                    bg="linear-gradient(135deg, #2563eb 0%, #4338ca 100%)"
                    color="white"
                    py={5}
                >
                    <HStack spacing={3}>
                        <Icon as={MdPhotoSizeSelectActual} boxSize={6} />
                        <Box>
                            <Text fontWeight="bold">Add Block</Text>
                            <Text fontSize="xs" opacity={0.8}>Choose a block type to add to this page</Text>
                        </Box>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton color="white" />
                <ModalBody p={0} pb={4}>
                    <Tabs colorScheme="brand" size="sm">
                        <TabList px={4} pt={3} borderBottom="1px solid" borderColor="gray.100">
                            {categories.map(cat => (
                                <Tab key={cat} fontWeight="medium" fontSize="sm" _selected={{ color: "brand.600", borderColor: "brand.400" }}>
                                    {cat}
                                    <Badge ml={1.5} colorScheme="gray" fontSize="2xs">
                                        {BLOCK_CATALOG[cat].length}
                                    </Badge>
                                </Tab>
                            ))}
                        </TabList>
                        <TabPanels>
                            {categories.map(cat => (
                                <TabPanel key={cat} px={4} pt={4}>
                                    <Box
                                        display="grid"
                                        gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                                        gap={3}
                                    >
                                        {BLOCK_CATALOG[cat].map(template => (
                                            <BlockCard key={template.type} template={template} onSelect={handleSelect} />
                                        ))}
                                    </Box>
                                </TabPanel>
                            ))}
                        </TabPanels>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
