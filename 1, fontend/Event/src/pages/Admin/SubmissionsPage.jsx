import {
    Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Flex, Text,
    HStack, VStack, Input, Select, IconButton, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    Image, Textarea, useToast, Tooltip,
    Stat, StatLabel, StatNumber, SimpleGrid, Spinner, Alert, AlertIcon,
    Menu, MenuButton, MenuList, MenuItem, MenuDivider, Checkbox,
    Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverBody,
    MenuOptionGroup, MenuItemOption
} from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    MdCheck, MdClose, MdVisibility, MdSearch, MdRefresh, MdDownload,
    MdViewColumn, MdFilterList, MdDateRange
} from "react-icons/md";
import { getSubmissionsByEvent, getSubmissionStats, updateSubmissionStatus } from "../../services/eventEngineApi";
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

    // NEW Feature States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem(`event_cols_${slug}`);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return ["name", "phone", "receipt", "images", "extra", "status", "submitted", "actions"];
            }
        }
        return ["name", "phone", "receipt", "images", "extra", "status", "submitted", "actions"];
    });

    useEffect(() => {
        localStorage.setItem(`event_cols_${slug}`, JSON.stringify(visibleColumns));
    }, [visibleColumns, slug]);

    const allColumns = [
        { id: "name", label: "Name" },
        { id: "phone", label: "Phone" },
        { id: "receipt", label: "Receipt #" },
        { id: "images", label: "Images" },
        { id: "extra", label: "Extra Data" },
        { id: "status", label: "Status" },
        { id: "submitted", label: "Submitted" },
        { id: "actions", label: "Actions" },
    ];

    // toggleColumn removed, using MenuOptionGroup built-in behavior

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
    useSSE('event-engine/admin/stream', {
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

            // Date Filtering
            let matchesDate = true;
            if (startDate || endDate) {
                const subDate = new Date(s.submitted_at);
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (subDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (subDate > end) matchesDate = false;
                }
            }

            return matchesStatus && matchesSearch && matchesDate;
        });
    }, [submissions, filterStatus, searchTerm, startDate, endDate]);

    const openDetail = (sub) => {
        setSelectedSubmission(sub);
        setReviewNotes(sub.rejection_reason || "");
        onOpen();
    };

    const handleApprove = async () => {
        if (!selectedSubmission) return;

        const originalSubmissions = [...submissions];
        const originalStats = { ...stats };

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
            setSubmissions(originalSubmissions);
            setStats(originalStats);
            toast({ title: "Failed to reject", description: error.message, status: "error" });
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

            {/* Filters Toolbar */}
            <Flex mb={4} gap={4} wrap="wrap" justify="space-between" align="center">
                <HStack spacing={4} wrap="wrap">
                    <HStack>
                        <MdSearch />
                        <Input
                            placeholder="Search name, phone, receipt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            w="220px"
                            size="sm"
                            bg="white"
                            borderRadius="md"
                        />
                    </HStack>

                    <Select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        w="130px"
                        size="sm"
                        bg="white"
                        borderRadius="md"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </Select>

                    <HStack spacing={1} bg="white" p={1} borderRadius="md" border="1px solid" borderColor="gray.200">
                        <MdDateRange size={16} color="gray.400" />
                        <Input
                            type="date"
                            size="xs"
                            variant="unstyled"
                            w="110px"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Text fontSize="xs" color="gray.400">-</Text>
                        <Input
                            type="date"
                            size="xs"
                            variant="unstyled"
                            w="110px"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        {(startDate || endDate) && (
                            <IconButton
                                icon={<MdClose />}
                                size="xs"
                                variant="ghost"
                                onClick={() => { setStartDate(""); setEndDate(""); }}
                            />
                        )}
                    </HStack>
                </HStack>

                <HStack>
                    <Menu closeOnSelect={false}>
                        <MenuButton as={Button} size="sm" variant="outline" leftIcon={<MdViewColumn />} bg="white">
                            Columns
                        </MenuButton>
                        <MenuList zIndex={10}>
                            <MenuOptionGroup
                                title="Visible Columns"
                                type="checkbox"
                                value={visibleColumns}
                                onChange={(vals) => setVisibleColumns(vals)}
                            >
                                {allColumns.map(col => (
                                    <MenuItemOption key={col.id} value={col.id}>
                                        {col.label}
                                    </MenuItemOption>
                                ))}
                            </MenuOptionGroup>
                        </MenuList>
                    </Menu>

                    <Button size="sm" variant="ghost" color="gray.500" leftIcon={<MdRefresh />} onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                </HStack>
            </Flex>

            {/* Table */}
            <Box bg="white" borderRadius="lg" shadow="sm" overflow="auto">
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        <Tr>
                            {allColumns.filter(c => visibleColumns.includes(c.id)).map(col => (
                                <Th key={col.id}>{col.label}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredSubmissions.length === 0 ? (
                            <Tr>
                                <Td colSpan={visibleColumns.length} textAlign="center" py={10}>
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
                            filteredSubmissions.map((sub) => {
                                // Enhance Display Data dynamically for Custom Forms
                                const findExtra = (regex) => {
                                    if (!sub.extra_data) return null;
                                    const entry = Object.entries(sub.extra_data).find(([k]) => regex.test(k));
                                    return entry ? entry[1] : null;
                                };

                                const displayName = sub.participant_name !== 'Guest' && sub.participant_name
                                    ? sub.participant_name
                                    : (findExtra(/name|nama/i) || 'Guest');

                                const displayPhone = sub.participant_contact
                                    ? sub.participant_contact
                                    : (findExtra(/contact|phone|hp|telepon|email/i) || '-');

                                let displayReceipt = '-';
                                if (sub.receipt_codes && sub.receipt_codes !== '[]') {
                                    try {
                                        const parsed = JSON.parse(sub.receipt_codes);
                                        displayReceipt = Array.isArray(parsed) && parsed.length > 0 ? parsed.join(", ") : sub.receipt_codes;
                                    } catch (e) {
                                        displayReceipt = sub.receipt_codes;
                                    }
                                } else {
                                    displayReceipt = findExtra(/code|receipt|coupon|serial|resi/i) || '-';
                                }

                                return (
                                    <Tr key={sub.submission_id} _hover={{ bg: "gray.50" }}>
                                        {visibleColumns.includes("name") && (
                                            <Td fontWeight="medium">{displayName}</Td>
                                        )}
                                        {visibleColumns.includes("phone") && (
                                            <Td>{displayPhone}</Td>
                                        )}
                                        {visibleColumns.includes("receipt") && (
                                            <Td><Text fontFamily="mono" fontSize="xs" title={displayReceipt}>
                                                {displayReceipt.length > 20 ? displayReceipt.substring(0, 20) + "..." : displayReceipt}
                                            </Text></Td>
                                        )}
                                        {visibleColumns.includes("images") && (
                                            <Td>
                                                <Badge colorScheme={(sub.extra_data?.images?.length || 0) > 0 ? "blue" : "gray"}>
                                                    {sub.extra_data?.images?.length || 0} img
                                                </Badge>
                                            </Td>
                                        )}
                                        {visibleColumns.includes("extra") && (
                                            <Td maxW="200px">
                                                <Tooltip label={<pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px' }}>{JSON.stringify(sub.extra_data || {}, null, 2)}</pre>} hasArrow placement="top">
                                                    <Text fontFamily="mono" fontSize="xs" cursor="pointer" color="brand.600" noOfLines={1}>
                                                        {Object.keys(sub.extra_data || {}).filter(k => k !== 'images').length > 0
                                                            ? JSON.stringify(Object.fromEntries(Object.entries(sub.extra_data || {}).filter(([k]) => k !== 'images')))
                                                            : '-'}
                                                    </Text>
                                                </Tooltip>
                                            </Td>
                                        )}
                                        {visibleColumns.includes("status") && (
                                            <Td><Badge colorScheme={statusColor(sub.status)}>{sub.status}</Badge></Td>
                                        )}
                                        {visibleColumns.includes("submitted") && (
                                            <Td fontSize="xs" color="gray.500">{formatDate(sub.submitted_at)}</Td>
                                        )}
                                        {visibleColumns.includes("actions") && (
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
                                        )}
                                    </Tr>
                                );
                            })
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
                        {selectedSubmission && (() => {
                            const findExtraModal = (regex) => {
                                if (!selectedSubmission.extra_data) return null;
                                const entry = Object.entries(selectedSubmission.extra_data).find(([k]) => regex.test(k));
                                return entry ? entry[1] : null;
                            };

                            const modalName = selectedSubmission.participant_name !== 'Guest' && selectedSubmission.participant_name
                                ? selectedSubmission.participant_name
                                : (findExtraModal(/name|nama/i) || 'Guest');

                            const modalPhone = selectedSubmission.participant_contact
                                ? selectedSubmission.participant_contact
                                : (findExtraModal(/contact|phone|hp|telepon|email/i) || '-');

                            let modalReceipt = '-';
                            if (selectedSubmission.receipt_codes && selectedSubmission.receipt_codes !== '[]') {
                                try {
                                    const parsed = JSON.parse(selectedSubmission.receipt_codes);
                                    modalReceipt = Array.isArray(parsed) && parsed.length > 0 ? parsed.join(", ") : selectedSubmission.receipt_codes;
                                } catch (e) {
                                    modalReceipt = selectedSubmission.receipt_codes;
                                }
                            } else {
                                modalReceipt = findExtraModal(/code|receipt|coupon|serial|resi/i) || '-';
                            }

                            return (
                                <VStack spacing={4} align="stretch">
                                    <Box bg="gray.50" p={4} borderRadius="md">
                                        <Text fontWeight="bold" mb={2}>Guest Information</Text>
                                        <SimpleGrid columns={2} spacing={2}>
                                            <Text fontSize="sm"><strong>Name:</strong> {modalName}</Text>
                                            <Text fontSize="sm"><strong>Contact:</strong> {modalPhone}</Text>
                                            <Text fontSize="sm"><strong>Receipt:</strong> {modalReceipt}</Text>
                                            <Text fontSize="sm"><strong>Submitted:</strong> {formatDate(selectedSubmission.submitted_at)}</Text>
                                        </SimpleGrid>
                                    </Box>

                                    <Box bg="gray.50" p={4} borderRadius="md">
                                        <Text fontWeight="bold" mb={2}>Extra Data</Text>
                                        {selectedSubmission.extra_data && Object.entries(selectedSubmission.extra_data).filter(([k]) => k !== 'images').map(([key, value]) => (
                                            <Text key={key} fontSize="sm">
                                                <strong>{key.replace(/_/g, " ")}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </Text>
                                        ))}
                                    </Box>

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

                                    <Box>
                                        <Text fontWeight="bold" mb={2}>Review Notes</Text>
                                        <Textarea
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add notes about this submission..."
                                            isDisabled={selectedSubmission.status !== "pending"}
                                        />
                                    </Box>
                                </VStack>
                            );
                        })()}

                        {selectedSubmission?.updated_at && (
                            <Box bg="blue.50" p={3} borderRadius="md" mt={4}>
                                <Text fontSize="sm" color="blue.700">
                                    Reviewed on {formatDate(selectedSubmission.updated_at)} by ID: {selectedSubmission.updated_by}
                                </Text>
                            </Box>
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
