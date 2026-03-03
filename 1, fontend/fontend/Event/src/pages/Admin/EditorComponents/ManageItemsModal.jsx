import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    Button, VStack, HStack, Text, Textarea, Badge, Table, Thead, Tbody, Tr, Th, Td,
    useToast, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, Flex, Stat, StatLabel, StatNumber, Box
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getPoolItems, addPoolItems, importPoolItems } from "../../../services/eventEngineApi";
import { MdCheckCircle, MdCancel } from "react-icons/md";
import { Divider } from "@chakra-ui/react";

export default function ManageItemsModal({ isOpen, onClose, pool }) {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ total: 0, used: 0, unused: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [newItemText, setNewItemText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && pool) {
            loadItems();
        }
    }, [isOpen, pool]);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const data = await getPoolItems(pool.pool_id);
            setItems(data.items || []);
            setStats({
                total: data.total,
                used: (data.items || []).filter(i => i.is_used).length, // Note: Pagination might hide true count, but API returns stats usually
                unused: data.total - ((data.items || []).filter(i => i.is_used).length) // Rough estimate if paginated
            });
        } catch (e) {
            toast({ title: "Failed to load items", status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItems = async () => {
        const codes = newItemText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        if (codes.length === 0) return;

        setIsSaving(true);
        try {
            await addPoolItems(pool.pool_id, codes);
            toast({ title: `Added ${codes.length} items`, status: "success" });
            setNewItemText("");
            loadItems();
        } catch (e) {
            toast({ title: "Failed to add items", description: e.message, status: "error" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size check (max 5MB explicitly)
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max 5MB", status: "error" });
            return;
        }

        setIsSaving(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target.result;
            try {
                const res = await importPoolItems(pool.pool_id, content);
                toast({ title: `Imported ${res.count} items`, status: "success" });
                loadItems();
                e.target.value = null; // Reset input
            } catch (err) {
                toast({ title: "Import failed", description: err.message, status: "error" });
            } finally {
                setIsSaving(false);
            }
        };

        reader.onerror = () => {
            toast({ title: "Read failed", status: "error" });
            setIsSaving(false);
        };

        reader.readAsText(file);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Manage Pool Items: {pool?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Tabs variant="enclosed" colorScheme="purple">
                        <TabList>
                            <Tab>Item List</Tab>
                            <Tab>Add Items</Tab>
                        </TabList>
                        <TabPanels>
                            {/* List View */}
                            <TabPanel px={0}>
                                {isLoading ? (
                                    <Flex justify="center" py={10}><Spinner /></Flex>
                                ) : (
                                    <VStack align="stretch" spacing={4}>
                                        <HStack spacing={4}>
                                            <Badge colorScheme="purple">Total: {items.length}</Badge>
                                            <Badge colorScheme="green">Used: {items.filter(i => i.is_used).length}</Badge>
                                        </HStack>
                                        <Box maxH="400px" overflowY="auto" border="1px solid #eee" borderRadius="md">
                                            <Table size="sm" variant="simple">
                                                <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                                                    <Tr>
                                                        <Th>Code / Value</Th>
                                                        <Th>Status</Th>
                                                        <Th>Used By</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {items.length === 0 ? (
                                                        <Tr><Td colSpan={3} textAlign="center" color="gray.400" py={4}>No items yet</Td></Tr>
                                                    ) : (
                                                        items.map((item) => (
                                                            <Tr key={item.item_id}>
                                                                <Td fontFamily="monospace">{item.value}</Td>
                                                                <Td>
                                                                    {item.is_used ? <Badge colorScheme="red">USED</Badge> : <Badge colorScheme="green">AVAILABLE</Badge>}
                                                                </Td>
                                                                <Td fontSize="xs" color="gray.500">
                                                                    {item.used_at ? new Date(item.used_at).toLocaleDateString() : "-"}
                                                                </Td>
                                                            </Tr>
                                                        ))
                                                    )}
                                                </Tbody>
                                            </Table>
                                        </Box>
                                    </VStack>
                                )}
                            </TabPanel>

                            {/* Add View */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Text fontSize="sm" color="gray.600">
                                        Enter codes below (one per line, or comma separated).
                                        For "Voucher" type pools, usually one code is enough (reusable).
                                        For "Serial" type pools, enter unique serial codes.
                                    </Text>
                                    <Textarea
                                        placeholder="CODE123&#10;CODE456&#10;SUMMER2026"
                                        rows={10}
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        fontFamily="monospace"
                                    />
                                    <Button
                                        colorScheme="purple"
                                        onClick={handleAddItems}
                                        isLoading={isSaving}
                                        isDisabled={!newItemText.trim()}
                                    >
                                        Add Manual Items
                                    </Button>

                                    <Divider my={2} />

                                    <Box>
                                        <Text fontWeight="bold" fontSize="sm" mb={2}>Bulk Upload (CSV)</Text>
                                        <Text fontSize="xs" color="gray.500" mb={2}>
                                            Upload a .csv or .txt file with one code per line.
                                            First line ignored if it contains "code" or "value".
                                        </Text>
                                        <HStack>
                                            <input
                                                type="file"
                                                accept=".csv,.txt"
                                                onChange={handleFileUpload}
                                                style={{ fontSize: '14px' }}
                                            />
                                            {isSaving && <Spinner size="sm" />}
                                        </HStack>
                                    </Box>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
