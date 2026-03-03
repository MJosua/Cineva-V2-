import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Flex, Text, VStack, HStack, Badge, Button, Icon, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdInbox, MdCheckCircle, MdPending, MdTrendingUp, MdVisibility, MdEdit } from "react-icons/md";
import { getSubmissionsByEvent, getSubmissionStats } from "../../services/eventEngineApi";
import { useState, useEffect } from "react";
import { useSSE } from "../../hooks/useSSE";

export default function EventDashboard() {
    const { slug } = useParams();
    const { admin, currentEvent } = useAuth();
    const isSuperAdmin = admin?.role === 'superadmin';

    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Parallel fetch for speed
                const [fetchedStats, fetchedSubs] = await Promise.all([
                    getSubmissionStats(slug),
                    getSubmissionsByEvent(slug, { limit: 3 })
                ]);

                if (isMounted) {
                    setStats(fetchedStats);
                    setRecentSubmissions(fetchedSubs.map(sub => ({
                        id: sub.submission_id,
                        name: sub.participant_name,
                        phone: sub.participant_contact,
                        status: sub.status,
                        time: sub.submitted_at ? new Date(sub.submitted_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : 'N/A'
                    })));
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                if (isMounted) {
                    setError("Failed to load dashboard data. Please try again.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [slug]);

    // Live Updates via SSE
    useSSE('event-engine/stream', {
        submission_created: (msg) => {
            if (msg.slug !== slug) return;
            // Update Stats
            setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
            // Add to recent list
            setRecentSubmissions(prev => [
                {
                    id: msg.submission.submission_id,
                    name: msg.submission.participant_name,
                    phone: msg.submission.participant_contact,
                    status: msg.submission.status,
                    time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                },
                ...prev
            ].slice(0, 5)); // Keep only 5 recent
        },
        submission_updated: (msg) => {
            // Re-fetch stats quietly to keep counters accurate (e.g. pending -> approved)
            // We can optimistically update recent list status though
            setRecentSubmissions(prev => prev.map(s =>
                s.id === msg.submission_id ? { ...s, status: msg.status } : s
            ));

            // Silent stats refresh
            getSubmissionStats(slug).then(s => setStats(s)).catch(() => { });
        }
    });

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px">
                <Spinner size="xl" color="purple.500" />
            </Flex>
        );
    }

    if (error) {
        return (
            <Box p={6}>
                <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertTitle>Error Loading Dashboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <VStack align="start" spacing={0}>
                    <Heading size="lg">Dashboard</Heading>
                    <Text color="gray.500" fontSize="sm">Overview for {currentEvent?.slug || slug}</Text>
                </VStack>
                <HStack>
                    {isSuperAdmin && (
                        <Button as={Link} to={`/admin/event/${slug}/editor`} leftIcon={<MdEdit />} colorScheme="purple" size="sm">
                            Edit Page
                        </Button>
                    )}
                    <Button as={Link} to={`/${slug}`} target="_blank" leftIcon={<MdVisibility />} variant="outline" size="sm">
                        View Live
                    </Button>
                </HStack>
            </Flex>

            {/* Stats Grid */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Total Submissions</StatLabel>
                    <StatNumber color="purple.600">{stats.total}</StatNumber>
                    <StatHelpText><Icon as={MdInbox} /> All time</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Pending Review</StatLabel>
                    <StatNumber color="orange.500">{stats.pending}</StatNumber>
                    <StatHelpText><Icon as={MdPending} /> Needs action</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Approved</StatLabel>
                    <StatNumber color="green.500">{stats.approved}</StatNumber>
                    <StatHelpText><Icon as={MdCheckCircle} /> Verified</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Rejected</StatLabel>
                    <StatNumber color="red.500">{stats.rejected}</StatNumber>
                    <StatHelpText><Icon as={MdTrendingUp} /> Declined</StatHelpText>
                </Stat>
            </SimpleGrid>

            {/* Recent Submissions */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Recent Submissions</Heading>
                    <Button as={Link} to={`/admin/event/${slug}/submissions`} size="sm" variant="ghost">
                        View All →
                    </Button>
                </Flex>
                <VStack spacing={3} align="stretch">
                    {recentSubmissions.length === 0 && (
                        <Text color="gray.400" textAlign="center" py={4}>No submissions yet.</Text>
                    )}
                    {recentSubmissions.map((sub) => (
                        <Flex key={sub.id} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md">
                            <HStack>
                                <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">{sub.name}</Text>
                                    <Text fontSize="xs" color="gray.500">{sub.phone}</Text>
                                </VStack>
                            </HStack>
                            <HStack>
                                <Badge colorScheme={sub.status === "approved" ? "green" : sub.status === "pending" ? "orange" : "red"}>
                                    {sub.status}
                                </Badge>
                                <Text fontSize="xs" color="gray.400">{sub.time}</Text>
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
            </Box>
        </Box>
    );
}
