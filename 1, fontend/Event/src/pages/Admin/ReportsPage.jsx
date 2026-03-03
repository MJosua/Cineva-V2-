import {
    Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
    Flex, Text, VStack, HStack, Select, Table, Thead, Tbody, Tr, Th, Td, Badge,
    Progress, Card, CardHeader, CardBody, Spinner, Alert, AlertIcon
} from "@chakra-ui/react";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MdDownload } from "react-icons/md";
import {
    getSubmissionsByEvent, getSubmissionStats, getPoolsByEvent,
    getPoolStats, getDailySubmissionStats, getWinnersByCampaign,
    exportSubmissionsCSV, exportWinnersCSV
} from "../../services/eventEngineApi";
import { useSSE } from "../../hooks/useSSE";
import { useToast, ButtonGroup, Button } from "@chakra-ui/react";

export default function ReportsPage() {
    const { slug } = useParams();
    const toast = useToast();
    const [dateRange, setDateRange] = useState("7days");

    // Async Data State
    const [subStats, setSubStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [couponStats, setCouponStats] = useState({ total: 0, active: 0 });
    const [dailyStats, setDailyStats] = useState([]);
    const [winners, setWinners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Data
    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            setIsLoading(true);
            try {
                const [subStatsData, poolStatsData, dailyData, winnersData] = await Promise.all([
                    getSubmissionStats(slug),
                    getPoolStats(slug),
                    getDailySubmissionStats(slug, dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90),
                    getWinnersByCampaign(slug)
                ]);

                if (isMounted) {
                    setSubStats(subStatsData);
                    setCouponStats(poolStatsData);
                    setDailyStats(Array.isArray(dailyData) ? dailyData : []);
                    setWinners(Array.isArray(winnersData) ? winnersData : []);
                }
            } catch (e) {
                console.error("Failed to load reports data", e);
                if (isMounted) setError("Failed to load reports data.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchData();
        return () => { isMounted = false; };
    }, [slug, dateRange]);

    // SSE Live Updates
    useSSE('event-engine/admin/stream', {
        submission_created: (msg) => {
            if (msg.slug !== slug) return;
            // Stats update (simple increment)
            setSubStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));

            // Refresh daily stats (complex to increment, easier to refetch or assume "today")
            // For simplicity, just refetch
            refreshAll();
        },
        submission_updated: (msg) => {
            // Status changed - refetch stats to get correct breakdown
            refreshAll();
        }
    });

    const refreshAll = () => {
        Promise.all([
            getSubmissionStats(slug),
            getPoolStats(slug),
            getDailySubmissionStats(slug, dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : 90)
        ]).then(([subs, pools, daily]) => {
            setSubStats(subs);
            setCouponStats(pools);
            setDailyStats(Array.isArray(daily) ? daily : []);
        }).catch(err => console.error("Live refresh failed", err));
    };

    // Export Handlers
    const [isExportingSubs, setIsExportingSubs] = useState(false);
    const [isExportingWinners, setIsExportingWinners] = useState(false);

    const handleExportSubmissions = async () => {
        setIsExportingSubs(true);
        try {
            await exportSubmissionsCSV(slug);
            toast({ title: "Submissions Exported", status: "success" });
        } catch (e) {
            toast({ title: "Export failed", description: e.message, status: "error" });
        } finally {
            setIsExportingSubs(false);
        }
    };

    const handleExportWinners = async () => {
        setIsExportingWinners(true);
        try {
            await exportWinnersCSV(slug);
            toast({ title: "Winners Exported", status: "success" });
        } catch (e) {
            toast({ title: "Export failed", description: e.message, status: "error" });
        } finally {
            setIsExportingWinners(false);
        }
    };

    // Calculate daily submissions for chart
    const dailyData = useMemo(() => {
        if (!dailyStats || !Array.isArray(dailyStats) || !dailyStats.length) return [];

        // Fill in missing dates if needed, or just map API data
        // For simplicity, we just map API data, assuming backend handles gaps or we just show what we have
        return dailyStats.map(d => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count: d.count,
            mockCount: d.count // Reuse existing property name or refactor render
        }));
    }, [dailyStats]);

    // Find max for chart scaling
    const maxCount = Math.max(...dailyData.map(d => d.mockCount), 1);

    // Status breakdown
    const statusBreakdown = useMemo(() => {
        const total = subStats.total || 1;
        return [
            { label: "Pending", count: subStats.pending, color: "orange", percent: (subStats.pending / total * 100).toFixed(1) },
            { label: "Approved", count: subStats.approved, color: "green", percent: (subStats.approved / total * 100).toFixed(1) },
            { label: "Rejected", count: subStats.rejected, color: "red", percent: (subStats.rejected / total * 100).toFixed(1) }
        ];
    }, [subStats]);

    // Top stores/sources (mock data)
    const topSources = [
        { name: "7-Eleven", count: 45, percent: 35 },
        { name: "Family Mart", count: 32, percent: 25 },
        { name: "Hi-Life", count: 28, percent: 22 },
        { name: "PX Mart", count: 15, percent: 12 },
        { name: "Others", count: 8, percent: 6 }
    ];

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px">
                <Spinner size="xl" color="brand.500" />
            </Flex>
        );
    }

    if (error) {
        return (
            <Box p={6}>
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
                <Heading size="lg">📊 Reports</Heading>
                <HStack spacing={4}>
                    <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} w="150px" bg="white">
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="90days">Last 90 Days</option>
                    </Select>
                    <ButtonGroup size="sm" isAttached variant="outline">
                        <Button
                            leftIcon={<MdDownload />}
                            onClick={handleExportSubmissions}
                            isLoading={isExportingSubs}
                            bg="white"
                        >
                            Export Submissions
                        </Button>
                        <Button
                            leftIcon={<MdDownload />}
                            onClick={handleExportWinners}
                            isLoading={isExportingWinners}
                            bg="white"
                        >
                            Export Winners
                        </Button>
                    </ButtonGroup>
                </HStack>
            </Flex>

            {/* Overview Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Total Submissions</StatLabel>
                    <StatNumber color="brand.600">{subStats.total}</StatNumber>
                    <StatHelpText>
                        <StatArrow type="increase" /> 12% from last period
                    </StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Approval Rate</StatLabel>
                    <StatNumber color="green.500">
                        {subStats.total > 0 ? ((subStats.approved / subStats.total) * 100).toFixed(1) : 0}%
                    </StatNumber>
                    <StatHelpText>
                        {subStats.approved} approved
                    </StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Active Coupons</StatLabel>
                    <StatNumber color="blue.500">{couponStats.active}</StatNumber>
                    <StatHelpText>
                        {couponStats.total} total
                    </StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Pending Review</StatLabel>
                    <StatNumber color="orange.500">{subStats.pending}</StatNumber>
                    <StatHelpText>
                        Needs attention
                    </StatHelpText>
                </Stat>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
                {/* Submissions Chart */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                    <Heading size="sm" mb={4}>Daily Submissions</Heading>
                    <Box h="200px" display="flex" alignItems="flex-end" gap={1}>
                        {dailyData.map((day, i) => (
                            <VStack key={i} flex={1} spacing={1}>
                                <Box
                                    w="100%"
                                    bg="brand.500"
                                    borderRadius="sm"
                                    h={`${(day.mockCount / maxCount) * 150}px`}
                                    minH="4px"
                                    transition="height 0.3s"
                                    _hover={{ bg: "brand.600" }}
                                    title={`${day.mockCount} submissions`}
                                />
                                <Text fontSize="8px" color="gray.400" transform="rotate(-45deg)" transformOrigin="center">
                                    {day.date}
                                </Text>
                            </VStack>
                        ))}
                    </Box>
                </Box>

                {/* Status Breakdown */}
                <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                    <Heading size="sm" mb={4}>Status Breakdown</Heading>
                    <VStack spacing={4} align="stretch">
                        {statusBreakdown.map((status) => (
                            <Box key={status.label}>
                                <Flex justify="space-between" mb={1}>
                                    <HStack>
                                        <Badge colorScheme={status.color}>{status.label}</Badge>
                                        <Text fontSize="sm">{status.count}</Text>
                                    </HStack>
                                    <Text fontSize="sm" fontWeight="bold">{status.percent}%</Text>
                                </Flex>
                                <Progress
                                    value={parseFloat(status.percent)}
                                    colorScheme={status.color}
                                    size="sm"
                                    borderRadius="full"
                                />
                            </Box>
                        ))}
                    </VStack>

                    {/* Pie-like visualization */}
                    <Flex mt={6} justify="center">
                        <Box
                            w="120px"
                            h="120px"
                            borderRadius="full"
                            bg={`conic-gradient(
                                #48BB78 0% ${statusBreakdown[1].percent}%, 
                                #ED8936 ${statusBreakdown[1].percent}% ${parseFloat(statusBreakdown[1].percent) + parseFloat(statusBreakdown[0].percent)}%, 
                                #E53E3E ${parseFloat(statusBreakdown[1].percent) + parseFloat(statusBreakdown[0].percent)}% 100%
                            )`}
                        />
                    </Flex>
                </Box>
            </SimpleGrid>

            {/* Winners List */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Heading size="sm" mb={4}>Recent Winners</Heading>
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr>
                            <Th>Drawn At</Th>
                            <Th>Pool</Th>
                            <Th>Prize</Th>
                            <Th>Strategy</Th>
                            <Th>Claimed</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {winners.length === 0 ? (
                            <Tr><Td colSpan={5} textAlign="center" py={4} color="gray.400">No winners drawn yet</Td></Tr>
                        ) : (
                            winners.map((w) => (
                                <Tr key={w.winner_id}>
                                    <Td>{new Date(w.drawn_at).toLocaleString()}</Td>
                                    <Td fontWeight="medium">{w.pool_name}</Td>
                                    <Td>{w.prize_value}</Td>
                                    <Td><Badge size="sm" colorScheme="blue">{w.draw_strategy}</Badge></Td>
                                    <Td><Badge size="sm" colorScheme={w.claimed ? "green" : "gray"}>{w.claimed ? "Yes" : "No"}</Badge></Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
}
