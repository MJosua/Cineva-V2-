import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    Button, VStack, HStack, Text, Textarea, Badge, Table, Thead, Tbody, Tr, Th, Td,
    useToast, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, Flex, Box,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    Progress, Input, FormControl, FormLabel
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { getPoolItems, addPoolItems, importPoolItems, getPoolDrawStats } from "../../../services/eventEngineApi";
import { MdCheckCircle, MdCancel, MdDownload } from "react-icons/md";
import { Divider } from "@chakra-ui/react";
import { useParams } from "react-router-dom";

export default function ManageItemsModal({ isOpen, onClose, pool }) {
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ total: 0, used: 0, unused: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [newItemText, setNewItemText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Generator State
    const [genPrefix, setGenPrefix] = useState("");
    const [genLength, setGenLength] = useState(8);
    const [genQuantity, setGenQuantity] = useState(100);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);

    const { slug } = useParams();

    useEffect(() => {
        if (isOpen && pool) {
            loadItems();
        }
    }, [isOpen, pool]);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const data = await getPoolItems(pool.pool_id);
            const poolStats = await getPoolDrawStats(pool.pool_id);

            setItems(data.items || []);
            setStats({
                total: poolStats.total_items || data.total || 0,
                used: poolStats.used_items || 0,
                unused: poolStats.available_items || 0
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

        // Size check (max 25MB)
        if (file.size > 25 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max 25MB", status: "error" });
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

    const generateRandomCode = (prefix, length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix;
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleGenerateAndUpload = async () => {
        if (genQuantity <= 0 || genLength <= 0) return;
        setIsGenerating(true);
        setGenProgress(0);

        try {
            // Generate codes in memory securely
            const codes = new Set();
            // Safeguard against infinite loops for very short lengths (e.g. len 1, qty 1000)
            const maxPossibleCombos = Math.pow(36, genLength);
            if (genQuantity > maxPossibleCombos) {
                throw new Error(`Requested quantity exceeds max possible unique combinations (${maxPossibleCombos})`);
            }

            while (codes.size < genQuantity) {
                codes.add(generateRandomCode(genPrefix, genLength));
            }
            const codesArray = Array.from(codes);

            // Chunk and upload
            const batchSize = 5000;
            const totalBatches = Math.ceil(codesArray.length / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                const batch = codesArray.slice(i * batchSize, (i + 1) * batchSize);
                await addPoolItems(pool.pool_id, batch);
                setGenProgress(Math.round(((i + 1) / totalBatches) * 100));
            }

            toast({ title: `Successfully generated and uploaded ${genQuantity} codes`, status: "success" });
            loadItems();
            // Reset progress visually
            setTimeout(() => setGenProgress(0), 1000);
        } catch (e) {
            toast({ title: "Failed to generate codes", description: e.message, status: "error" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportCSV = () => {
        if (!items || items.length === 0) return;

        // Generate headers
        const headers = ["Raw Code", "Status", "Encrypted Code Payload", "Recommended QR URL"];
        const rows = items.map(item => {
            const status = item.is_used ? "USED" : "AVAILABLE";
            const enc = item.encrypted_value || "";
            // Assuming frontend runs on same domain, standard construction:
            const qrUrl = enc ? `${window.location.origin}/event/${slug}/coupon/${enc}` : "";

            return [
                `"${item.value}"`,
                `"${status}"`,
                `"${enc}"`,
                `"${qrUrl}"`
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pool_${pool?.name || 'items'}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            <Tab>Generate Codes</Tab>
                            <Tab>Add/Import CSV</Tab>
                        </TabList>
                        <TabPanels>
                            {/* List View */}
                            <TabPanel px={0}>
                                {isLoading ? (
                                    <Flex justify="center" py={10}><Spinner /></Flex>
                                ) : (
                                    <VStack align="stretch" spacing={4}>
                                        <Flex justify="space-between" align="center">
                                            <HStack spacing={4}>
                                                <Badge colorScheme="purple">Total: {stats.total.toLocaleString()}</Badge>
                                                <Badge colorScheme="green">Used: {stats.used.toLocaleString()}</Badge>
                                            </HStack>
                                            <Button size="sm" leftIcon={<MdDownload />} colorScheme="green" onClick={handleExportCSV} isDisabled={items.length === 0}>
                                                Export CSV
                                            </Button>
                                        </Flex>
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

                            {/* Generate View */}
                            <TabPanel>
                                <VStack align="stretch" spacing={4}>
                                    <Text fontSize="sm" color="gray.600">
                                        Generate large amounts of unique codes directly in your browser and upload them in batches.
                                        This is ideal for creating thousands of "Serial" codes efficiently without overloading the server.
                                    </Text>

                                    <HStack spacing={4}>
                                        <FormControl>
                                            <FormLabel fontSize="xs">Prefix (Optional)</FormLabel>
                                            <Input size="sm" placeholder="e.g. SUMMER" value={genPrefix} onChange={(e) => setGenPrefix(e.target.value.toUpperCase())} disabled={isGenerating} />
                                        </FormControl>
                                        <FormControl>
                                            <FormLabel fontSize="xs">Random Suffix Length</FormLabel>
                                            <NumberInput size="sm" min={4} max={16} value={genLength} onChange={(_, val) => setGenLength(val || 4)} isDisabled={isGenerating}>
                                                <NumberInputField />
                                                <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                            </NumberInput>
                                        </FormControl>
                                    </HStack>

                                    <FormControl>
                                        <FormLabel fontSize="xs">Quantity to Generate</FormLabel>
                                        <NumberInput size="sm" min={1} max={100000} step={1000} value={genQuantity} onChange={(_, val) => setGenQuantity(val || 1)} isDisabled={isGenerating}>
                                            <NumberInputField />
                                            <NumberInputStepper><NumberIncrementStepper /><NumberDecrementStepper /></NumberInputStepper>
                                        </NumberInput>
                                    </FormControl>

                                    <Button
                                        colorScheme="purple"
                                        onClick={handleGenerateAndUpload}
                                        isLoading={isGenerating}
                                        loadingText={`Uploading... ${genProgress}%`}
                                        mt={2}
                                    >
                                        Generate & Upload Codes
                                    </Button>

                                    {isGenerating && <Progress value={genProgress} size="sm" colorScheme="purple" mt={2} hasStripe isAnimated />}
                                </VStack>
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
