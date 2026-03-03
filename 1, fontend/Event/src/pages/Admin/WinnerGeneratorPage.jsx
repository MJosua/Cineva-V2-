import {
    Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
    Flex, Text, VStack, HStack, Select, Button, Input, FormControl, FormLabel,
    Table, Thead, Tbody, Tr, Th, Td, Badge, Card, CardHeader, CardBody,
    Alert, AlertIcon, AlertTitle, AlertDescription, Divider, Code, useToast
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdCasino, MdPlayArrow, MdRefresh, MdWarning } from "react-icons/md";
import {
    getPoolsByEvent,
    drawWinners,          // Use API wrapper
    getPoolDrawStats,     // Use API wrapper
    getAvailablePoolItems // Use API wrapper
} from "../../services/eventEngineApi";
import {
    previewDraw
} from "../../data/winnerGenerator"; // Keep preview local for now

export default function WinnerGeneratorPage() {
    const { slug } = useParams();
    const { admin } = useAuth();
    const isSuperAdmin = admin?.role === 'superadmin';
    const toast = useToast();

    // State
    const [pools, setPools] = useState([]);
    const [isFetchingPools, setIsFetchingPools] = useState(true);

    // Form state
    const [selectedPoolId, setSelectedPoolId] = useState("");
    const [winnerCount, setWinnerCount] = useState(1);
    const [strategy, setStrategy] = useState("RANDOM");

    // Result state
    const [previewResult, setPreviewResult] = useState(null);
    const [drawResult, setDrawResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Stats state - fetched from API now
    const [stats, setStats] = useState(null);

    // Fetch pools
    useEffect(() => {
        let isMounted = true;
        async function fetchPools() {
            try {
                const data = await getPoolsByEvent(slug);
                if (isMounted) {
                    setPools(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                console.error("Failed to load pools", e);
                if (isMounted) toast({ title: "Failed to load pools", status: "error" });
            } finally {
                if (isMounted) setIsFetchingPools(false);
            }
        }
        fetchPools();
        return () => { isMounted = false; };
    }, [slug]);

    // Fetch stats when pool changes or after draw
    useEffect(() => {
        if (!selectedPoolId) {
            setStats(null);
            return;
        }

        let isMounted = true;
        async function fetchStats() {
            try {
                const data = await getPoolDrawStats(parseInt(selectedPoolId));
                if (isMounted) setStats(data);
            } catch (e) {
                console.error("Failed to load stats", e);
            }
        }
        fetchStats();
        return () => { isMounted = false; };
    }, [selectedPoolId, drawResult]); // Refresh on pool change or new draw result

    // Check if draw is possible
    const canDraw = stats && stats.available_items > 0;
    const countExceedsAvailable = stats && winnerCount > stats.available_items;

    // Handle pool selection
    const handlePoolChange = (e) => {
        setSelectedPoolId(e.target.value);
        setPreviewResult(null);
        setDrawResult(null);
    };

    // Handle Preview (Client-side simulation)
    const handlePreview = async () => {
        if (!selectedPoolId) {
            toast({ title: "Select a pool first", status: "warning" });
            return;
        }

        // Fetch available items for preview
        try {
            const items = await getAvailablePoolItems(parseInt(selectedPoolId));
            // Use the local mock helper just for shuffling logic on real data
            // Or implement simple random pick here
            const result = previewDrawLogic(items, winnerCount, strategy);
            setPreviewResult(result);
            setDrawResult(null);

            if (!result.success) {
                toast({ title: result.error, status: "error" });
            }
        } catch (e) {
            toast({ title: "Failed to load items for preview", status: "error" });
        }
    };

    // Simple client-side preview logic helper
    const previewDrawLogic = (items, count, strat) => {
        if (!items || items.length === 0) return { success: false, error: "No items available" };
        let candidates = [...items];
        if (strat === 'RANDOM') {
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
        }
        const winners = candidates.slice(0, count);
        return {
            success: true,
            preview_items: winners,
            metadata: { strategy: strat, available_count: items.length }
        };
    };

    // Handle Execute Draw (Server-side)
    const handleExecute = async () => {
        if (!selectedPoolId) return;
        if (!canDraw) {
            toast({ title: "No available items to draw", status: "error" });
            return;
        }

        setIsLoading(true);

        try {
            const result = await drawWinners(parseInt(selectedPoolId), winnerCount, strategy);

            // Map API/Mock response to UI format
            // API returns { success: true, winners: [], ... }
            const uiResult = {
                success: true,
                winner_items: result.winners || result.winner_items, // Handle naming diff
                metadata: {
                    pool_name: pools.find(p => p.pool_id == selectedPoolId)?.name,
                    strategy: strategy,
                    drawn_at: new Date().toISOString(),
                    remaining_count: (stats.available_items - (result.drawn_count || 0))
                }
            };

            setDrawResult(uiResult);
            setPreviewResult(null);

            toast({
                title: `Drew ${uiResult.winner_items.length} winner(s)!`,
                status: "success",
                duration: 3000
            });

        } catch (error) {
            console.error(error);
            setDrawResult({ success: false, error: error.message });
            toast({ title: "Draw Failed", description: error.message, status: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    // Reset all
    const handleReset = () => {
        setPreviewResult(null);
        setDrawResult(null);
        setWinnerCount(1);
    };

    // Format datetime
    const formatDateTime = (isoString) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={6}>Winner Generator</Heading>

            {/* Pool Selection Card */}
            <Card mb={6} bg="white" shadow="sm">
                <CardHeader pb={2}>
                    <Heading size="md">Draw Configuration</Heading>
                </CardHeader>
                <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        {/* Pool Selector */}
                        <FormControl>
                            <FormLabel>Select Pool</FormLabel>
                            <Select
                                placeholder="Choose a pool..."
                                value={selectedPoolId}
                                onChange={handlePoolChange}
                            >
                                {pools.length === 0 && <option value="" disabled>No pools available</option>}
                                {pools.map(pool => (
                                    <option key={pool.pool_id} value={pool.pool_id}>
                                        {pool.name} ({pool.type})
                                    </option>
                                ))}
                            </Select>
                            {pools.length === 0 && !isFetchingPools && (
                                <Text fontSize="xs" color="red.500" mt={1}>
                                    No pools found. Create a pool in the Coupons page first.
                                </Text>
                            )}
                        </FormControl>

                        {/* Strategy Selector */}
                        <FormControl>
                            <FormLabel>Draw Strategy</FormLabel>
                            <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                                <option value="RANDOM">🎲 Random</option>
                                <option value="FIRST_N">📋 First N (FIFO)</option>
                            </Select>
                        </FormControl>

                        {/* Winner Count */}
                        <FormControl>
                            <FormLabel>Number of Winners</FormLabel>
                            <Input
                                type="number"
                                min={1}
                                max={stats?.available_items || 100}
                                value={winnerCount}
                                onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                            />
                        </FormControl>
                    </SimpleGrid>

                    {/* Warning if count exceeds available */}
                    {countExceedsAvailable && (
                        <Alert status="warning" mt={4} borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>
                                Requested {winnerCount} but only {stats.available_items} available.
                                Will draw all available.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Action Buttons */}
                    <HStack mt={6} spacing={4}>
                        {isSuperAdmin && (
                            <>
                                <Button
                                    leftIcon={<MdPlayArrow />}
                                    colorScheme="blue"
                                    variant="outline"
                                    onClick={handlePreview}
                                    isDisabled={!selectedPoolId}
                                >
                                    Preview Draw
                                </Button>
                                <Button
                                    leftIcon={<MdCasino />}
                                    colorScheme="purple"
                                    onClick={handleExecute}
                                    isLoading={isLoading}
                                    isDisabled={!canDraw}
                                >
                                    Execute Draw
                                </Button>
                            </>
                        )}
                        <Button
                            leftIcon={<MdRefresh />}
                            variant="ghost"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </HStack>
                </CardBody>
            </Card>

            {/* Pool Stats */}
            {stats && (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                    <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                        <StatLabel>Total Items</StatLabel>
                        <StatNumber>{stats.total_items}</StatNumber>
                    </Stat>
                    <Stat bg="green.50" p={4} borderRadius="lg" shadow="sm">
                        <StatLabel>Available</StatLabel>
                        <StatNumber color="green.500">{stats.available_items}</StatNumber>
                    </Stat>
                    <Stat bg="orange.50" p={4} borderRadius="lg" shadow="sm">
                        <StatLabel>Used</StatLabel>
                        <StatNumber color="orange.500">{stats.used_items}</StatNumber>
                    </Stat>
                    <Stat bg={stats.exhausted ? "red.50" : "gray.50"} p={4} borderRadius="lg" shadow="sm">
                        <StatLabel>Status</StatLabel>
                        <StatNumber fontSize="lg">
                            <Badge colorScheme={stats.exhausted ? "red" : "green"} fontSize="md">
                                {stats.exhausted ? "Exhausted" : "Active"}
                            </Badge>
                        </StatNumber>
                    </Stat>
                </SimpleGrid>
            )}

            {/* Preview Result */}
            {previewResult && (
                <Card mb={6} borderColor="blue.200" borderWidth={2}>
                    <CardHeader bg="blue.50" pb={2}>
                        <Flex justify="space-between" align="center">
                            <Heading size="md" color="blue.700">Preview Result</Heading>
                            <Badge colorScheme="blue">NOT COMMITTED</Badge>
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        {previewResult.success ? (
                            <>
                                <Text mb={4} color="gray.600">
                                    These items would be selected. Click "Execute Draw" to confirm.
                                </Text>
                                <ResultTable items={previewResult.preview_items} isPreview={true} />
                                <Divider my={4} />
                                <Text fontSize="sm" color="gray.500">
                                    Strategy: <Code>{previewResult.metadata.strategy}</Code> |
                                    Available: {previewResult.metadata.available_count}
                                </Text>
                            </>
                        ) : (
                            <Alert status="error">
                                <AlertIcon />
                                <AlertTitle>Preview Failed</AlertTitle>
                                <AlertDescription>{previewResult.error}</AlertDescription>
                            </Alert>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Draw Result */}
            {drawResult && (
                <Card mb={6} borderColor={drawResult.success ? "green.400" : "red.400"} borderWidth={2}>
                    <CardHeader bg={drawResult.success ? "green.50" : "red.50"} pb={2}>
                        <Flex justify="space-between" align="center">
                            <Heading size="md" color={drawResult.success ? "green.700" : "red.700"}>
                                {drawResult.success ? "🎉 Draw Complete!" : "Draw Failed"}
                            </Heading>
                            {drawResult.success && (
                                <Badge colorScheme="green" fontSize="md">
                                    {drawResult.winner_items.length} Winner(s)
                                </Badge>
                            )}
                        </Flex>
                    </CardHeader>
                    <CardBody>
                        {drawResult.success ? (
                            <>
                                <ResultTable items={drawResult.winner_items} isPreview={false} />
                                <Divider my={4} />
                                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Pool</Text>
                                        <Text fontWeight="medium">{drawResult.metadata.pool_name}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Strategy</Text>
                                        <Code>{drawResult.metadata.strategy}</Code>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Drawn At</Text>
                                        <Text>{formatDateTime(drawResult.metadata.drawn_at)}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Remaining</Text>
                                        <Text fontWeight="bold" color="orange.500">
                                            {drawResult.metadata.remaining_count}
                                        </Text>
                                    </Box>
                                </SimpleGrid>
                            </>
                        ) : (
                            <Alert status="error">
                                <AlertIcon />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{drawResult.error}</AlertDescription>
                            </Alert>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Empty State */}
            {!selectedPoolId && (
                <Box textAlign="center" py={12} color="gray.400">
                    <MdCasino size={64} style={{ margin: "0 auto", opacity: 0.3 }} />
                    <Text mt={4}>Select a pool to begin drawing winners</Text>
                </Box>
            )}
        </Box>
    );
}

/**
 * Reusable table for displaying winner/preview items
 */
function ResultTable({ items, isPreview }) {
    if (!items || items.length === 0) {
        return <Text color="gray.400">No items</Text>;
    }

    return (
        <Box overflowX="auto">
            <Table variant="simple" size="sm">
                <Thead bg="gray.50">
                    <Tr>
                        <Th>#</Th>
                        <Th>Item ID</Th>
                        <Th>Value / Code</Th>
                        <Th>Status</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {items.map((item, index) => (
                        <Tr key={item.item_id} bg={isPreview ? "blue.50" : "green.50"}>
                            <Td>{index + 1}</Td>
                            <Td>
                                <Code>{item.item_id}</Code>
                            </Td>
                            <Td fontWeight="bold">{item.value}</Td>
                            <Td>
                                <Badge colorScheme={isPreview ? "blue" : "green"}>
                                    {isPreview ? "Preview" : "Winner"}
                                </Badge>
                            </Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
}
