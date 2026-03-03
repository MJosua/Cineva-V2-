import {
    Box, Heading, Text, SimpleGrid, Card, CardHeader, CardBody,
    Stat, StatLabel, StatNumber, StatHelpText, Badge, Button, Flex,
    VStack, HStack, Icon, Divider, Spinner, Alert, AlertIcon
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import {
    MdDescription, MdCardGiftcard, MdCasino, MdBarChart,
    MdEvent, MdCheckCircle, MdCloudOff
} from "react-icons/md";
import { useState, useEffect } from "react";
import { getCampaigns, getSubmissionStats, getPoolStatsByCampaign } from "../../services/eventEngineApi";

export default function AdminDashboard() {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalStats, setGlobalStats] = useState({ submissions: 0, pools: 0 });

    const isMock = import.meta.env.VITE_USE_MOCK === 'true';

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            setIsLoading(true);
            try {
                const campaignList = await getCampaigns();

                if (!isMounted) return;

                // Fetch stats for each campaign in parallel
                const campaignsWithStats = await Promise.all(campaignList.map(async (c) => {
                    try {
                        const [subStats, poolStats] = await Promise.all([
                            getSubmissionStats(c.slug),
                            getPoolStatsByCampaign(c.slug)
                        ]);
                        return { ...c, subStats, poolStats };
                    } catch (e) {
                        console.error(`Failed to load stats for ${c.slug}`, e);
                        return { ...c, subStats: {}, poolStats: {} };
                    }
                }));

                if (isMounted) {
                    setEvents(campaignsWithStats);

                    // Aggregate global stats
                    const totalSubs = campaignsWithStats.reduce((acc, curr) => acc + (curr.subStats?.total || 0), 0);
                    const totalPools = campaignsWithStats.reduce((acc, curr) => acc + (curr.poolStats?.total || 0), 0);
                    setGlobalStats({ submissions: totalSubs, pools: totalPools });
                }

            } catch (err) {
                console.error("Dashboard Load Error:", err);
                if (isMounted) setError("Failed to load events. Please check your connection.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, []);

    // Navigation cards for quick access
    const navCards = [
        {
            title: "Submissions",
            description: "Review and approve participant entries",
            icon: MdDescription,
            color: "blue",
            path: "/admin/events" // Goes to event selector first
        },
        {
            title: "Reward Pools",
            description: "Manage coupons, serial codes, and prizes",
            icon: MdCardGiftcard,
            color: "purple",
            path: "/admin/events"
        },
        {
            title: "Winner Generator",
            description: "Draw winners from eligible pools",
            icon: MdCasino,
            color: "orange",
            path: "/admin/events"
        },
        {
            title: "Reports",
            description: "View analytics and export data",
            icon: MdBarChart,
            color: "green",
            path: "/admin/events"
        }
    ];

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px">
                <Spinner size="xl" color="purple.500" />
            </Flex>
        );
    }

    return (
        <Box>
            {/* Header Section */}
            <Box mb={8}>
                <Heading size="lg" mb={2}>Event Engine Dashboard</Heading>
                <Text color="gray.600" maxW="600px">
                    Manage promotional events, campaigns, and lucky draws.
                    Create landing pages, collect submissions, and generate winners.
                </Text>
            </Box>

            {error && (
                <Alert status="error" mb={6} borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* System Status */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Active Events</StatLabel>
                    <StatNumber>{events.length}</StatNumber>
                    <StatHelpText>
                        <Badge colorScheme="green">All Running</Badge>
                    </StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Total Submissions</StatLabel>
                    <StatNumber>{globalStats.submissions}</StatNumber>
                    <StatHelpText>Across all events</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Reward Pools</StatLabel>
                    <StatNumber>{globalStats.pools}</StatNumber>
                    <StatHelpText>Active pools</StatHelpText>
                </Stat>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>System Status</StatLabel>
                    <StatNumber fontSize="lg">
                        <HStack>
                            <Icon as={isMock ? MdCloudOff : MdCheckCircle} color={isMock ? "gray.500" : "green.500"} />
                            <Text>{isMock ? "Mock Mode" : "Online"}</Text>
                        </HStack>
                    </StatNumber>
                    <StatHelpText>{isMock ? "Local Data" : "Connected to API"}</StatHelpText>
                </Stat>
            </SimpleGrid>

            {/* Quick Navigation */}
            <Heading size="md" mb={4}>Quick Access</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={8}>
                {navCards.map((card) => (
                    <Card
                        key={card.title}
                        as={Link}
                        to={card.path}
                        bg="white"
                        shadow="sm"
                        _hover={{ shadow: "md", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                        cursor="pointer"
                    >
                        <CardHeader pb={2}>
                            <HStack>
                                <Icon as={card.icon} boxSize={6} color={`${card.color}.500`} />
                                <Heading size="sm">{card.title}</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody pt={0}>
                            <Text fontSize="sm" color="gray.600">{card.description}</Text>
                        </CardBody>
                    </Card>
                ))}
            </SimpleGrid>

            <Divider mb={8} />

            {/* Events List */}
            <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Your Events</Heading>
                <Button colorScheme="teal" size="sm" leftIcon={<MdEvent />}>
                    + Create New Event
                </Button>
            </Flex>

            {events.length === 0 && !error && (
                <VStack
                    py={16}
                    bg="gray.50"
                    borderRadius="lg"
                    border="2px dashed"
                    borderColor="gray.200"
                    spacing={4}
                >
                    <Icon as={MdEvent} boxSize={12} color="gray.300" />
                    <Heading size="md" color="gray.500">No Events Found</Heading>
                    <Text color="gray.500">Get started by creating your first promotional campaign.</Text>
                    <Button colorScheme="teal" leftIcon={<MdEvent />}>
                        Create New Event
                    </Button>
                </VStack>
            )}

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {events.map((evt) => {
                    const stats = evt.subStats;

                    return (
                        <Card key={evt.slug} bg="white" shadow="sm">
                            <CardHeader pb={2}>
                                <Flex justify="space-between" align="start">
                                    <VStack align="start" spacing={1}>
                                        <Heading size="sm">{evt.name}</Heading>
                                        <Text fontSize="xs" color="gray.500">/{evt.slug}</Text>
                                    </VStack>
                                    <Badge colorScheme={evt.status === 'active' ? 'green' : 'gray'}>
                                        {evt.status}
                                    </Badge>
                                </Flex>
                            </CardHeader>
                            <CardBody pt={2}>
                                <HStack spacing={4} mb={4}>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Submissions</Text>
                                        <Text fontWeight="bold">{stats?.total || 0}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Pending</Text>
                                        <Text fontWeight="bold" color="orange.500">{stats?.pending || 0}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="xs" color="gray.500">Approved</Text>
                                        <Text fontWeight="bold" color="green.500">{stats?.approved || 0}</Text>
                                    </Box>
                                </HStack>
                                <HStack spacing={2}>
                                    <Button
                                        as={Link}
                                        to={`/admin/event/${evt.slug}/dashboard`}
                                        size="xs"
                                        colorScheme="blue"
                                    >
                                        Manage
                                    </Button>
                                    <Button
                                        as={Link}
                                        to={`/admin/event/${evt.slug}/editor`}
                                        size="xs"
                                        variant="outline"
                                    >
                                        Edit Page
                                    </Button>
                                    <Button
                                        as={Link}
                                        to={`/${evt.slug}`}
                                        target="_blank"
                                        size="xs"
                                        variant="ghost"
                                    >
                                        Preview
                                    </Button>
                                </HStack>
                            </CardBody>
                        </Card>
                    );
                })}
            </SimpleGrid>

            {/* What is Event Engine? */}
            <Box mt={12} p={6} bg="gray.50" borderRadius="lg">
                <Heading size="sm" mb={3}>What is Event Engine?</Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                    Event Engine is an internal CMS for managing promotional campaigns, lucky draws,
                    and event landing pages. It integrates with the Core Ticketing System for approvals
                    and the Reward Pool system for prize distribution.
                </Text>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <HStack>
                        <Icon as={MdEvent} color="blue.500" />
                        <Text fontSize="sm">Landing Page Builder</Text>
                    </HStack>
                    <HStack>
                        <Icon as={MdDescription} color="purple.500" />
                        <Text fontSize="sm">Submission Management</Text>
                    </HStack>
                    <HStack>
                        <Icon as={MdCasino} color="orange.500" />
                        <Text fontSize="sm">Winner Generation</Text>
                    </HStack>
                </SimpleGrid>
            </Box>
        </Box>
    );
}
