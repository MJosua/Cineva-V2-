import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Text,
    Icon,
    VStack,
    HStack,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Badge,
    Flex
} from "@chakra-ui/react";
import { MdPhotoSizeSelectActual } from "react-icons/md";
import { BLOCK_CATALOG, getCatalogCategories } from "./blockCatalog";

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
                    w={10}
                    h={10}
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

export default function AddBlockModal({ isOpen, onClose, onAddBlock }) {
    const handleSelect = (template) => {
        onAddBlock({
            type: template.type,
            props: { ...template.defaultProps },
            _id: `block-${Date.now()}`
        });
        onClose();
    };

    const categories = getCatalogCategories();

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
                            {categories.map((category) => (
                                <Tab
                                    key={category}
                                    fontWeight="medium"
                                    fontSize="sm"
                                    _selected={{ color: "brand.600", borderColor: "brand.400" }}
                                >
                                    {category}
                                    <Badge ml={1.5} colorScheme="gray" fontSize="2xs">
                                        {(BLOCK_CATALOG[category] || []).length}
                                    </Badge>
                                </Tab>
                            ))}
                        </TabList>
                        <TabPanels>
                            {categories.map((category) => (
                                <TabPanel key={category} px={4} pt={4}>
                                    <Box
                                        display="grid"
                                        gridTemplateColumns="repeat(auto-fill, minmax(180px, 1fr))"
                                        gap={3}
                                    >
                                        {(BLOCK_CATALOG[category] || []).map((template) => (
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

