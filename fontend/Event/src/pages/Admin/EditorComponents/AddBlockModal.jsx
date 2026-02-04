import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    SimpleGrid, Box, Text, Icon, VStack
} from "@chakra-ui/react";
import { MdTextFields, MdList, MdViewCarousel, MdViewDay, MdGridView, MdReceipt, MdWeb, MdCode } from "react-icons/md";

const BLOCK_TEMPLATES = [
    { type: "header", label: "Header", icon: MdWeb, defaultProps: { logo: "", links: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(51,51,51,1)" } },
    { type: "hero", label: "Hero Section", icon: MdViewDay, defaultProps: { title: "Event Title", subtitle: "Subtitle", imageUrl: "", bgColor: "rgba(255,255,255,0)", textColor: "rgba(0,0,0,1)" } },
    { type: "card", label: "Card", icon: MdGridView, defaultProps: { title: "Card Title", children: [], bgColor: "rgba(255,255,255,1)", textColor: "rgba(0,0,0,1)" } },
    { type: "section", label: "Full Section", icon: MdViewDay, defaultProps: { background: "rgba(255,255,255,0)", children: [] } },
    { type: "flip", label: "Image Slideshow", icon: MdViewCarousel, defaultProps: { images: [], interval: 3000, direction: "horizontal" } },
    { type: "text", label: "Rich Text", icon: MdTextFields, defaultProps: { content: "<p>Enter your text here...</p>", align: "center" } },
    { type: "list", label: "List", icon: MdList, defaultProps: { items: ["Item 1", "Item 2", "Item 3"], textColor: "rgba(0,0,0,1)" } },
    { type: "couponForm", label: "Dynamic Form", icon: MdReceipt, defaultProps: { title: "Submit Your Receipt", fields: [], buttonText: "Submit", buttonColor: "rgba(72,187,120,1)", buttonTextColor: "rgba(255,255,255,1)" } },
    { type: "customHtml", label: "Custom HTML", icon: MdCode, defaultProps: { html: "<div style='padding:20px;text-align:center;'>Custom HTML here</div>", customCss: "" } },
];

export default function AddBlockModal({ isOpen, onClose, onAddBlock }) {
    const handleSelect = (template) => {
        onAddBlock({
            type: template.type,
            props: { ...template.defaultProps },
            _id: `block-${Date.now()}`
        });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add New Block</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <SimpleGrid columns={3} spacing={3}>
                        {BLOCK_TEMPLATES.map((template) => (
                            <Box
                                key={template.type}
                                p={4}
                                border="1px solid"
                                borderColor="gray.200"
                                borderRadius="md"
                                cursor="pointer"
                                _hover={{ bg: "blue.50", borderColor: "blue.300" }}
                                onClick={() => handleSelect(template)}
                                textAlign="center"
                            >
                                <VStack spacing={2}>
                                    <Icon as={template.icon} boxSize={8} color="blue.500" />
                                    <Text fontWeight="bold" fontSize="sm">{template.label}</Text>
                                </VStack>
                            </Box>
                        ))}
                    </SimpleGrid>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
