import {
    Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Badge, Button, Flex, Text,
    HStack, VStack, Input, Select, IconButton, useDisclosure,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    FormControl, FormLabel, Textarea, useToast, SimpleGrid, Stat, StatLabel, StatNumber,
    Switch, Divider, Tag, TagLabel, Code, NumberInput, NumberInputField,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Spinner, Alert, AlertIcon,
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter
} from "@chakra-ui/react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MdAdd, MdEdit, MdDelete, MdPlayArrow, MdPause, MdContentCopy, MdList } from "react-icons/md";
import { getPoolsByEvent as getCouponsByEvent, getPoolStats as getCouponStats, createPool, updatePool, deletePool as deletePoolApi, RULE_TYPES, EFFECT_TYPES } from "../../services/eventEngineApi";
import ManageItemsModal from "./EditorComponents/ManageItemsModal";
import { useSSE } from "../../hooks/useSSE";

export default function CouponsPage() {
    const { slug } = useParams();
    const { admin } = useAuth();
    const isSuperAdmin = admin?.role === 'superadmin';
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isManageItemsOpen, onOpen: openManageItems, onClose: onCloseManageItems } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const cancelRef = useRef();

    // ... items state
    const [selectedPoolForItems, setSelectedPoolForItems] = useState(null);
    const [poolToDelete, setPoolToDelete] = useState(null);

    const [coupons, setCoupons] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, exhausted: 0, disabled: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCoupon, setSelectedCoupon] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");

    // Form state for pool creation/editing
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "VOUCHER",
        uses_per_user: 1,
        valid_from: "",
        valid_until: "",
        rules: [],
        effects: []
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [couponsData, statsData] = await Promise.all([
                getCouponsByEvent(slug),
                getCouponStats(slug)
            ]);

            setCoupons(Array.isArray(couponsData) ? couponsData : []);
            setStats(statsData);
        } catch (e) {
            console.error("Failed to load coupons", e);
            setError("Failed to load pools.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [slug]);

    // Live Updates
    useSSE('event-engine/stream', {
        pool_created: (msg) => {
            if (msg.slug !== slug) return;
            setCoupons(prev => {
                if (prev.some(c => c.pool_id === msg.pool.pool_id)) return prev;
                return [...prev, msg.pool];
            });
            toast({ title: "New Pool Created", status: "info", position: "top-right" });
        },
        pool_updated: (msg) => {
            if (msg.slug !== slug) return;
            // Optimistic update of the pool list
            setCoupons(prev => prev.map(c => c.pool_id === msg.pool.pool_id ? { ...c, ...msg.pool } : c));
        },
        pools_changed: (msg) => {
            if (msg.slug !== slug) return;
            // Reload stats and pools (usage changed)
            // We reuse fetchData but silent updates would be better to avoid spinner flickering.
            // For now, full reload is safer for data consistency.
            fetchData();
        }
    });

    const filteredCoupons = useMemo(() => {
        return coupons.filter(c => filterStatus === "all" || c.status === filterStatus);
    }, [coupons, filterStatus]);

    const openCreate = () => {
        setIsEditing(false);
        setSelectedCoupon(null);
        setFormData({
            name: "",
            description: "",
            type: "VOUCHER",
            uses_per_user: 1,
            valid_from: "",
            valid_until: "",
            rules: [],
            effects: []
        });
        onOpen();
    };

    const openEdit = (pool) => {
        setIsEditing(true);
        setSelectedCoupon(pool);
        setFormData({
            name: pool.name,
            description: pool.description,
            type: pool.type || "VOUCHER",
            uses_per_user: pool.config?.uses_per_user || 1,
            valid_from: pool.config?.valid_from?.split("T")[0] || "",
            valid_until: pool.config?.valid_until?.split("T")[0] || "",
            rules: pool.config?.rules || [],
            effects: pool.config?.effects || []
        });
        onOpen();
    };

    const generatePoolId = () => {
        return Math.max(0, ...coupons.map(c => c.pool_id)) + 1;
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast({ title: "Name is required", status: "warning" });
            return;
        }

        const poolPayload = {
            name: formData.name,
            description: formData.description,
            type: formData.type,
            config: {
                uses_per_user: formData.uses_per_user,
                valid_from: formData.valid_from ? formData.valid_from + "T00:00:00Z" : null,
                valid_until: formData.valid_until ? formData.valid_until + "T23:59:59Z" : null,
                rules: formData.rules,
                effects: formData.effects
            },
            status: isEditing ? (selectedCoupon.status || 'draft') : 'active'
        };

        try {
            if (isEditing) {
                const updated = await updatePool(selectedCoupon.pool_id, poolPayload);
                setCoupons(prev => prev.map(c => c.pool_id === updated.pool_id ? { ...c, ...updated } : c));
                toast({ title: "Pool Updated", status: "success" });
            } else {
                const created = await createPool(slug, poolPayload);
                setCoupons(prev => {
                    if (prev.some(c => c.pool_id === created.pool_id)) return prev;
                    return [...prev, created];
                });
                toast({ title: "Pool Created", status: "success" });
                // Reload to get stats if needed
            }
            onClose();
        } catch (e) {
            console.error(e);
            toast({ title: "Operation failed", description: e.message, status: "error" });
        }
    };

    const toggleStatus = async (pool) => {
        const newStatus = pool.status === "active" ? "disabled" : "active";
        try {
            await updatePool(pool.pool_id, { status: newStatus });
            setCoupons(prev => prev.map(c => c.pool_id === pool.pool_id ? { ...c, status: newStatus } : c));
            toast({ title: `Pool ${newStatus}`, status: "info" });
        } catch (e) {
            toast({ title: "Failed to update status", status: "error" });
        }
    };

    const confirmDelete = (pool) => {
        setPoolToDelete(pool);
        onDeleteOpen();
    };

    const executeDelete = async () => {
        if (!poolToDelete) return;
        try {
            await deletePoolApi(poolToDelete.pool_id);
            setCoupons(prev => prev.filter(c => c.pool_id !== poolToDelete.pool_id));
            toast({ title: "Pool Deleted", status: "info" });
            onDeleteClose();
        } catch (e) {
            toast({ title: "Failed to delete pool", description: e.message, status: "error" });
        }
    };

    const addRule = (type) => {
        const ruleType = RULE_TYPES.find(r => r.type === type);
        const newRule = { type, config: {} };
        // Set default values based on type
        if (type === "min_spend") newRule.config = { amount: 100, currency: "TWD" };
        if (type === "first_n_users") newRule.config = { limit: 100 };
        if (type === "date_range") newRule.config = { start: formData.valid_from, end: formData.valid_until };
        setFormData(prev => ({ ...prev, rules: [...prev.rules, newRule] }));
    };

    const removeRule = (index) => {
        setFormData(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
    };

    const addEffect = (type) => {
        const newEffect = { type, config: {} };
        if (type === "points") newEffect.config = { points: 50 };
        if (type === "points_multiplier") newEffect.config = { multiplier: 2 };
        if (type === "discount_percent") newEffect.config = { percent: 10, max_discount: 100 };
        setFormData(prev => ({ ...prev, effects: [...prev.effects, newEffect] }));
    };

    const removeEffect = (index) => {
        setFormData(prev => ({ ...prev, effects: prev.effects.filter((_, i) => i !== index) }));
    };

    const statusColor = (status) => {
        switch (status) {
            case "active": return "green";
            case "disabled": return "gray";
            case "exhausted": return "orange";
            case "draft": return "blue";
            default: return "gray";
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">Reward Pools</Heading>
                {isSuperAdmin && (
                    <Button leftIcon={<MdAdd />} colorScheme="purple" onClick={openCreate}>
                        Create Pool
                    </Button>
                )}
            </Flex>

            {/* Stats */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                <Stat bg="white" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Total</StatLabel>
                    <StatNumber>{stats.total}</StatNumber>
                </Stat>
                <Stat bg="green.50" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Active</StatLabel>
                    <StatNumber color="green.500">{stats.active}</StatNumber>
                </Stat>
                <Stat bg="orange.50" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Exhausted</StatLabel>
                    <StatNumber color="orange.500">{stats.exhausted}</StatNumber>
                </Stat>
                <Stat bg="gray.100" p={4} borderRadius="lg" shadow="sm">
                    <StatLabel>Disabled</StatLabel>
                    <StatNumber color="gray.500">{stats.disabled}</StatNumber>
                </Stat>
            </SimpleGrid>

            {/* Filters */}
            <Flex mb={4} gap={4}>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} w="150px" bg="white">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                    <option value="exhausted">Exhausted</option>
                    <option value="draft">Draft</option>
                </Select>
            </Flex>

            {/* Table */}
            <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>Name</Th>
                            <Th>Type</Th>
                            <Th>Usage</Th>
                            <Th>Valid Until</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredCoupons.length === 0 ? (
                            <Tr><Td colSpan={6} textAlign="center" py={8} color="gray.400">No coupons found</Td></Tr>
                        ) : (
                            filteredCoupons.map((pool) => (
                                <Tr key={pool.pool_id} _hover={{ bg: "gray.50" }}>
                                    <Td>
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="medium">{pool.name}</Text>
                                            <Text fontSize="xs" color="gray.500" noOfLines={1}>{pool.description}</Text>
                                        </VStack>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={pool.type === 'SERIAL' ? 'blue' : 'purple'}>{pool.type}</Badge>
                                    </Td>
                                    <Td>
                                        <Text fontSize="sm">
                                            {pool.used_items || 0} / {pool.total_items || "∞"}
                                        </Text>
                                    </Td>
                                    <Td fontSize="xs" color="gray.500">{formatDate(pool.config?.valid_until)}</Td>
                                    <Td><Badge colorScheme={statusColor(pool.status)}>{pool.status}</Badge></Td>
                                    <Td>
                                        <HStack spacing={1}>
                                            {isSuperAdmin && (
                                                <IconButton
                                                    icon={<MdEdit />}
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEdit(pool)}
                                                    aria-label="Edit"
                                                />
                                            )}
                                            <IconButton
                                                icon={<MdList />}
                                                size="sm"
                                                variant="ghost"
                                                title="Manage Items"
                                                onClick={() => { setSelectedPoolForItems(pool); openManageItems(); }}
                                                aria-label="Manage Items"
                                            />
                                            {isSuperAdmin && (
                                                <>
                                                    <IconButton
                                                        icon={pool.status === "active" ? <MdPause /> : <MdPlayArrow />}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme={pool.status === "active" ? "orange" : "green"}
                                                        onClick={() => toggleStatus(pool)}
                                                        aria-label="Toggle"
                                                        isDisabled={pool.status === "exhausted"}
                                                    />
                                                    <IconButton
                                                        icon={<MdDelete />}
                                                        size="sm"
                                                        variant="ghost"
                                                        colorScheme="red"
                                                        onClick={() => confirmDelete(pool)}
                                                        aria-label="Delete"
                                                    />
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

            {/* Create/Edit Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{isEditing ? "Edit Pool" : "Create Pool"}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            {/* Basic Info */}
                            <SimpleGrid columns={2} spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Name</FormLabel>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="New Year Promo Pool"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Type</FormLabel>
                                    <Select
                                        value={formData.type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="VOUCHER">Voucher (Reusable Code)</option>
                                        <option value="SERIAL">Serial (Unique Codes)</option>
                                        <option value="WHITELIST">Whitelist (Allowed Emails)</option>
                                    </Select>
                                </FormControl>
                            </SimpleGrid>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Uses Per User</FormLabel>
                                <Input
                                    type="number"
                                    value={formData.uses_per_user}
                                    onChange={(e) => setFormData(prev => ({ ...prev, uses_per_user: parseInt(e.target.value) || 1 }))}
                                />
                            </FormControl>

                            <SimpleGrid columns={2} spacing={4}>
                                <FormControl>
                                    <FormLabel>Valid From</FormLabel>
                                    <Input
                                        type="date"
                                        value={formData.valid_from}
                                        onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Valid Until</FormLabel>
                                    <Input
                                        type="date"
                                        value={formData.valid_until}
                                        onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <Divider />

                            {/* Rules */}
                            <Box>
                                <Flex justify="space-between" align="center" mb={2}>
                                    <Text fontWeight="bold">Conditions (Rules)</Text>
                                    <Select
                                        size="sm"
                                        w="200px"
                                        placeholder="+ Add Rule"
                                        onChange={(e) => { if (e.target.value) addRule(e.target.value); e.target.value = ""; }}
                                    >
                                        {RULE_TYPES.map(r => (
                                            <option key={r.type} value={r.type}>{r.icon} {r.label}</option>
                                        ))}
                                    </Select>
                                </Flex>
                                {formData.rules.length === 0 ? (
                                    <Text fontSize="sm" color="gray.400">No conditions - coupon applies to all</Text>
                                ) : (
                                    <VStack spacing={2} align="stretch">
                                        {formData.rules.map((rule, i) => {
                                            const ruleType = RULE_TYPES.find(r => r.type === rule.type);
                                            return (
                                                <HStack key={i} bg="gray.50" p={3} borderRadius="md">
                                                    <Text>{ruleType?.icon}</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{ruleType?.label}</Text>
                                                    <Code fontSize="xs">{JSON.stringify(rule.config)}</Code>
                                                    <IconButton
                                                        icon={<MdDelete />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeRule(i)}
                                                        aria-label="Remove"
                                                        ml="auto"
                                                    />
                                                </HStack>
                                            );
                                        })}
                                    </VStack>
                                )}
                            </Box>

                            <Divider />

                            {/* Effects */}
                            <Box>
                                <Flex justify="space-between" align="center" mb={2}>
                                    <Text fontWeight="bold">Effects (Rewards)</Text>
                                    <Select
                                        size="sm"
                                        w="200px"
                                        placeholder="+ Add Effect"
                                        onChange={(e) => { if (e.target.value) addEffect(e.target.value); e.target.value = ""; }}
                                    >
                                        {EFFECT_TYPES.map(e => (
                                            <option key={e.type} value={e.type}>{e.icon} {e.label}</option>
                                        ))}
                                    </Select>
                                </Flex>
                                {formData.effects.length === 0 ? (
                                    <Text fontSize="sm" color="gray.400">No effects configured</Text>
                                ) : (
                                    <VStack spacing={2} align="stretch">
                                        {formData.effects.map((effect, i) => {
                                            const effectType = EFFECT_TYPES.find(e => e.type === effect.type);
                                            return (
                                                <HStack key={i} bg="green.50" p={3} borderRadius="md">
                                                    <Text>{effectType?.icon}</Text>
                                                    <Text fontSize="sm" fontWeight="medium">{effectType?.label}</Text>
                                                    <Code fontSize="xs">{JSON.stringify(effect.config)}</Code>
                                                    <IconButton
                                                        icon={<MdDelete />}
                                                        size="xs"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => removeEffect(i)}
                                                        aria-label="Remove"
                                                        ml="auto"
                                                    />
                                                </HStack>
                                            );
                                        })}
                                    </VStack>
                                )}
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={2} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handleSave}>
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            {/* Manage Items Modal */}
            <ManageItemsModal
                isOpen={isManageItemsOpen}
                onClose={onCloseManageItems}
                pool={selectedPoolForItems}
            />
            {/* Delete Confirmation Modal */}
            <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Pool
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete <Text as="span" fontWeight="bold">{poolToDelete?.name}</Text>?
                            This action cannot be undone and will delete all items/history.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={executeDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box >
    );
}
