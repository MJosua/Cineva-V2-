import {
    Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Flex, Text,
    HStack, VStack, Input, Select, IconButton, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    Image, Textarea, useToast, Tooltip,
    Stat, StatLabel, StatNumber, SimpleGrid, Spinner, Alert, AlertIcon
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MdCheck, MdClose, MdVisibility, MdSearch, MdRefresh, MdDownload } from "react-icons/md";
import { getSubmissionsByEvent, getSubmissionStats, updateSubmissionStatus, exportSubmissionsCSV } from "../../services/eventEngineApi";
import { useSSE } from "../../hooks/useSSE";

export default function SubmissionsPage() {
    const { slug } = useParams();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const [submissions, setSubmissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [reviewNotes, setReviewNotes] = useState("");

    // Fetch Data on Mount
    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            if (!submissions.length && isLoading) setIsLoading(true);

            try {
                const [subsData, statsData] = await Promise.all([
                    getSubmissionsByEvent(slug),
                    getSubmissionStats(slug)
                ]);

                if (isMounted) {
                    const subArray = (subsData && (Array.isArray(subsData) ? subsData : subsData.submissions)) || [];
                    setSubmissions(subArray);

                    setStats({
                        total: parseInt(statsData.total || 0, 10),
                        pending: parseInt(statsData.pending || 0, 10),
                        approved: parseInt(statsData.approved || 0, 10),
                        rejected: parseInt(statsData.rejected || 0, 10)
                    });
                }
            } catch (e) {
                console.error("Failed to load submissions", e);
                if (isMounted && !submissions.length) setError("Failed to load submissions.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [slug]);

    // Live Updates via SSE
    useSSE('event-engine/stream', {
        submission_created: (msg) => {
            if (msg.slug !== slug) return;

            setSubmissions(prev => [msg.submission, ...prev]);
            setStats(prev => ({
                ...prev,
                total: prev.total + 1,
                pending: prev.pending + 1
            }));

            toast({
                title: "New Submission",
                description: `${msg.submission.participant_name} just submitted!`,
                status: "info",
                position: "top-right",
                duration: 3000
            });
        },
        submission_updated: (msg) => {
            setSubmissions(prev => prev.map(s =>
                s.submission_id === msg.submission_id
                    ? { ...s, status: msg.status, updated_at: msg.updated_at, updated_by: msg.updated_by }
                    : s
            ));
            refreshStatsQuietly();
        }
    });

    const refreshStatsQuietly = async () => {
        try {
            const statsData = await getSubmissionStats(slug);
            setStats({
                total: parseInt(statsData.total || 0, 10),
                pending: parseInt(statsData.pending || 0, 10),
                approved: parseInt(statsData.approved || 0, 10),
                rejected: parseInt(statsData.rejected || 0, 10)
            });
        } catch (e) { /* ignore */ }
    };

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s => {
            const matchesStatus = filterStatus === "all" || s.status === filterStatus;
            const matchesSearch = searchTerm === "" ||
                (s.participant_name && s.participant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (s.participant_contact && s.participant_contact.includes(searchTerm)) ||
                (s.receipt_codes && s.receipt_codes.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [submissions, filterStatus, searchTerm]);

    const openDetail = (sub) => {
        setSelectedSubmission(sub);
        setReviewNotes(sub.rejection_reason || "");
        onOpen();
    };

    const handleApprove = async () => {
        if (!selectedSubmission) return;

        // Optimistic UI updates are risky for "important" data, 
        // but we'll update local state immediately for responsiveness 
        // AND handle API errors if it fails.
        const originalSubmissions = [...submissions];
        const originalStats = { ...stats };

        // Optimistic Update
        setSubmissions(prev => prev.map(s =>
            s.submission_id === selectedSubmission.submission_id
                ? { ...s, status: "approved", updated_at: new Date().toISOString(), updated_by: "Me" }
                : s
        ));
        setStats(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
        onClose();

        try {
            await updateSubmissionStatus(selectedSubmission.submission_id, "approved");
            toast({ title: "Approved!", status: "success", duration: 2000 });
        } catch (error) {
            console.error(error);
            // Revert on error
            setSubmissions(originalSubmissions);
            setStats(originalStats);
            toast({ title: "Failed to approve", description: error.message, status: "error" });
        }
    };

    const handleReject = async () => {
        if (!reviewNotes.trim()) {
            toast({ title: "Please add a rejection reason", status: "warning", duration: 2000 });
            return;
        }

        const originalSubmissions = [...submissions];
        const originalStats = { ...stats };

        // Optimistic Update
        setSubmissions(prev => prev.map(s =>
            s.submission_id === selectedSubmission.submission_id
                ? { ...s, status: "rejected", updated_at: new Date().toISOString(), updated_by: "Me", rejection_reason: reviewNotes }
                : s
        ));
        setStats(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
        onClose();

        try {
            await updateSubmissionStatus(selectedSubmission.submission_id, "rejected", reviewNotes);
            toast({ title: "Rejected", status: "info", duration: 2000 });
        } catch (error) {
            // Revert on error
            setSubmissions(originalSubmissions);
            setStats(originalStats);
            toast({ title: "Failed to reject", description: error.message, status: "error" });
        }
    };

    const [isExporting, setIsExporting] = useState(false);
    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportSubmissionsCSV(slug);
            toast({ title: "CSV Exported", status: "success" });
        } catch (e) {
            toast({ title: "Export failed", description: e.message, status: "error" });
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const statusColor = (status) => {
        switch (status) {
            case "approved": return "green";
            case "rejected": return "red";
            case "pending": return "orange";
            default: return "gray";
        }
    };

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
                    {error}
                </Alert>
            </Box>
        );
    }

    return (
        <Box p={6}>
            <Heading size="lg" mb={6}>Form Submissions</Heading>

            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Total</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                </Stat>
                <Stat bg="orange.50" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Pending</StatLabel>
                    <StatNumber color="orange.500">{stats.pending}</StatNumber>
                </Stat>
                <Stat bg="green.50" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Approved</StatLabel>
                    <StatNumber color="green.500">{stats.approved}</StatNumber>
                </Stat>
                <Stat bg="red.50" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Rejected</StatLabel>
                    <StatNumber color="red.500">{stats.rejected}</StatNumber>
                </Stat>
            </SimpleGrid>

            {/* Filters */}
            <Flex mb={4} gap={4} wrap="wrap">
                <HStack>
                    <MdSearch />
                    <Input
                        placeholder="Search name, phone, receipt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        w="250px"
                        bg="white"
                    />
                </HStack>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} w="150px" bg="white">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </Select>
                <Button
                    leftIcon={<MdDownload />}
                    variant="outline"
                    size="md"
                    onClick={handleExport}
                    isLoading={isExporting}
                >
                    Export CSV
                </Button>
            </Flex>

            {/* Table */}
            <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>Name</Th>
                            <Th>Phone</Th>
                            <Th>Receipt #</Th>
                            <Th>Images</Th>
                            <Th>Status</Th>
                            <Th>Submitted</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredSubmissions.length === 0 ? (
                            <Tr>
                                <Td colSpan={7} textAlign="center" py={10}>
                                    <VStack spacing={3} color="gray.400">
                                        <Box bg="gray.100" p={3} borderRadius="full">
                                            <MdSearch size={24} />
                                        </Box>
                                        <Text fontWeight="medium">No submissions found</Text>
                                        <Text fontSize="sm">Try adjusting your filters or search terms</Text>
                                    </VStack>
                                </Td>
                            </Tr>
                        ) : (
                            filteredSubmissions.map((sub) => (
                                <Tr key={sub.submission_id} _hover={{ bg: "gray.50" }}>
                                    <Td fontWeight="medium">{sub.participant_name}</Td>
                                    <Td>{sub.participant_contact}</Td>
                                    <Td><Text fontFamily="mono" fontSize="xs">{sub.receipt_codes || "-"}</Text></Td>
                                    <Td>
                                        <Badge colorScheme={(sub.extra_data?.images?.length || 0) > 0 ? "blue" : "gray"}>
                                            {sub.extra_data?.images?.length || 0} img
                                        </Badge>
                                    </Td>
                                    <Td><Badge colorScheme={statusColor(sub.status)}>{sub.status}</Badge></Td>
                                    <Td fontSize="xs" color="gray.500">{formatDate(sub.submitted_at)}</Td>
                                    <Td>
                                        <HStack spacing={1}>
                                            <Tooltip label="View Details">
                                                <IconButton
                                                    icon={<MdVisibility />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openDetail(sub)}
                                                    aria-label="View"
                                                />
                                            </Tooltip>
                                            {sub.status === "pending" && (
                                                <>
                                                    <Tooltip label="Approve">
                                                        <IconButton
                                                            icon={<MdCheck />}
                                                            size="sm"
                                                            colorScheme="green"
                                                            variant="ghost"
                                                            onClick={() => { setSelectedSubmission(sub); handleApprove(); }}
                                                            aria-label="Approve"
                                                        />
                                                    </Tooltip>
                                                    <Tooltip label="Reject">
                                                        <IconButton
                                                            icon={<MdClose />}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => openDetail(sub)}
                                                            aria-label="Reject"
                                                        />
                                                    </Tooltip>
                                                </>
                                            )}
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>

            {/* Detail Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Submission Details
                        <Badge ml={2} colorScheme={statusColor(selectedSubmission?.status)}>
                            {selectedSubmission?.status}
                        </Badge>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedSubmission && (
                            <VStack spacing={4} align="stretch">
                                {/* Guest Info */}
                                <Box bg="gray.50" p={4} borderRadius="md">
                                    <Text fontWeight="bold" mb={2}>Guest Information</Text>
                                    <SimpleGrid columns={2} spacing={2}>
                                        <Text fontSize="sm"><strong>Name:</strong> {selectedSubmission.participant_name}</Text>
                                        <Text fontSize="sm"><strong>Contact:</strong> {selectedSubmission.participant_contact}</Text>
                                        <Text fontSize="sm"><strong>Receipt:</strong> {selectedSubmission.receipt_codes || "-"}</Text>
                                        <Text fontSize="sm"><strong>Submitted:</strong> {formatDate(selectedSubmission.submitted_at)}</Text>
                                    </SimpleGrid>
                                </Box>

                                {/* Extra Data */}
                                <Box bg="gray.50" p={4} borderRadius="md">
                                    <Text fontWeight="bold" mb={2}>Extra Data</Text>
                                    {selectedSubmission.extra_data && Object.entries(selectedSubmission.extra_data).filter(([k]) => k !== 'images').map(([key, value]) => (
                                        <Text key={key} fontSize="sm">
                                            <strong>{key.replace(/_/g, " ")}:</strong> {value}
                                        </Text>
                                    ))}
                                </Box>

                                {/* Images */}
                                {(selectedSubmission.extra_data?.images?.length || 0) > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Uploaded Images</Text>
                                        <HStack spacing={2} wrap="wrap">
                                            {selectedSubmission.extra_data.images.map((img, i) => (
                                                <Box
                                                    key={i}
                                                    w="150px"
                                                    h="150px"
                                                    bg="gray.200"
                                                    borderRadius="md"
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    border="1px solid"
                                                    borderColor="gray.300"
                                                    cursor="pointer"
                                                    onClick={() => window.open(img, "_blank")}
                                                >
                                                    <VStack>
                                                        <MdVisibility size={24} />
                                                        <Text fontSize="xs">Receipt {i + 1}</Text>
                                                    </VStack>
                                                </Box>
                                            ))}
                                        </HStack>
                                    </Box>
                                )}

                                {/* Review Notes */}
                                <Box>
                                    <Text fontWeight="bold" mb={2}>Review Notes</Text>
                                    <Textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add notes about this submission..."
                                        isDisabled={selectedSubmission.status !== "pending"}
                                    />
                                </Box>

                                {/* Previous Review */}
                                {selectedSubmission.updated_at && (
                                    <Box bg="blue.50" p={3} borderRadius="md">
                                        <Text fontSize="sm" color="blue.700">
                                            Reviewed on {formatDate(selectedSubmission.updated_at)} by ID: {selectedSubmission.updated_by}
                                        </Text>
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        {selectedSubmission?.status === "pending" && (
                            <HStack spacing={2}>
                                <Button colorScheme="green" leftIcon={<MdCheck />} onClick={handleApprove}>
                                    Approve
                                </Button>
                                <Button colorScheme="red" leftIcon={<MdClose />} onClick={handleReject}>
                                    Reject
                                </Button>
                            </HStack>
                        )}
                        <Button variant="ghost" ml={2} onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
