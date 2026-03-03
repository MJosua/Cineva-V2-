import {
    Box, Heading, VStack, HStack, Button, Text, Badge, Flex,
    Table, Thead, Tbody, Tr, Th, Td, Avatar, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    FormControl, FormLabel, Input, Select, IconButton,
    Alert, AlertIcon, Spinner
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getCampaignTeam,
    addTeamMember,
    removeTeamMember,
    searchUsers
} from "../../services/eventEngineApi";
import { MdAdd, MdDelete, MdPersonAdd } from "react-icons/md";
import debounce from "lodash.debounce";

export default function AdminManagementPage() {
    const { slug } = useParams();
    const toast = useToast();
    const { isSuperAdmin, admin: currentAdmin } = useAuth(); // Assuming currentAdmin has info

    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Member State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("admin");

    // Load Team
    const loadTeam = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCampaignTeam(slug);
            setTeam(data);
        } catch (e) {
            toast({ title: "Failed to load team", description: e.message, status: "error" });
        } finally {
            setLoading(false);
        }
    }, [slug, toast]);

    useEffect(() => {
        loadTeam();
    }, [loadTeam]);

    // Search Users
    const doSearch = async (q) => {
        if (q.length < 3) return;
        setSearching(true);
        try {
            const results = await searchUsers(q);
            // Filter out existing team members
            const existingIds = team.map(m => m.user_id);
            setSearchResults(results.filter(u => !existingIds.includes(u.user_id)));
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(debounce(doSearch, 500), [team]);

    useEffect(() => {
        if (searchQuery.length >= 3) {
            debouncedSearch(searchQuery);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, debouncedSearch]);

    // Handlers
    const handleAddMember = async () => {
        if (!selectedUser) return;
        try {
            await addTeamMember(slug, selectedUser.user_id, selectedRole);
            toast({ title: "Member added", status: "success" });
            setIsAddOpen(false);
            setSearchQuery("");
            setSelectedUser(null);
            loadTeam();
        } catch (e) {
            toast({ title: "Failed to add member", description: e.message, status: "error" });
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await removeTeamMember(slug, userId);
            toast({ title: "Member removed", status: "success" });
            loadTeam();
        } catch (e) {
            toast({ title: "Failed to remove member", description: e.message, status: "error" });
        }
    };

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <VStack align="start" spacing={0}>
                    <Heading size="lg">👥 Team Management</Heading>
                    <Text color="gray.500" fontSize="sm">Manage access to this event</Text>
                </VStack>
                <Button colorScheme="purple" leftIcon={<MdAdd />} onClick={() => setIsAddOpen(true)}>
                    Add Member
                </Button>
            </Flex>

            {loading ? (
                <Flex justify="center" p={8}><Spinner /></Flex>
            ) : (
                <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
                    <Table variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>User</Th>
                                <Th>Role</Th>
                                <Th>Assigned At</Th>
                                <Th w="50px"></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {team.length === 0 ? (
                                <Tr>
                                    <Td colSpan={4} textAlign="center" py={8} color="gray.500">
                                        No team members assigned yet.
                                    </Td>
                                </Tr>
                            ) : team.map((member) => (
                                <Tr key={member.relation_id} _hover={{ bg: "gray.50" }}>
                                    <Td>
                                        <HStack>
                                            <Avatar size="sm" name={`${member.firstname} ${member.lastname}`} />
                                            <VStack align="start" spacing={0}>
                                                <Text fontWeight="medium">{member.firstname} {member.lastname}</Text>
                                                <Text fontSize="xs" color="gray.500">{member.email}</Text>
                                            </VStack>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={member.role === 'admin' ? 'purple' : 'gray'}>
                                            {member.role}
                                        </Badge>
                                    </Td>
                                    <Td color="gray.500" fontSize="sm">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </Td>
                                    <Td>
                                        {isSuperAdmin && (
                                            <IconButton
                                                icon={<MdDelete />}
                                                colorScheme="red"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveMember(member.user_id)}
                                                isDisabled={currentAdmin?.uid === member.email}
                                                aria-label="Remove member"
                                            />
                                        )}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}

            {/* Add Member Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add Team Member</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Search User</FormLabel>
                                <Input
                                    placeholder="Type name or email (min 3 chars)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searching && <Text fontSize="xs" color="gray.500" mt={1}>Searching...</Text>}
                            </FormControl>

                            {/* Search Results */}
                            {searchQuery.length >= 3 && (
                                <Box w="100%" maxH="200px" overflowY="auto" borderWidth="1px" borderRadius="md">
                                    {searchResults.length === 0 && !searching ? (
                                        <Text p={2} color="gray.500" fontSize="sm">No users found.</Text>
                                    ) : (
                                        <VStack align="stretch" spacing={0}>
                                            {searchResults.map(user => (
                                                <HStack
                                                    key={user.user_id}
                                                    p={2}
                                                    _hover={{ bg: "gray.100", cursor: "pointer" }}
                                                    bg={selectedUser?.user_id === user.user_id ? "blue.50" : "white"}
                                                    onClick={() => setSelectedUser(user)}
                                                    justify="space-between"
                                                >
                                                    <HStack>
                                                        <Avatar size="xs" name={`${user.firstname} ${user.lastname}`} />
                                                        <VStack align="start" spacing={0}>
                                                            <Text fontSize="sm" fontWeight="medium">{user.firstname} {user.lastname}</Text>
                                                            <Text fontSize="xs" color="gray.500">{user.email}</Text>
                                                        </VStack>
                                                    </HStack>
                                                    {selectedUser?.user_id === user.user_id && <MdPersonAdd color="blue" />}
                                                </HStack>
                                            ))}
                                        </VStack>
                                    )}
                                </Box>
                            )}

                            {selectedUser && (
                                <FormControl>
                                    <FormLabel>Role</FormLabel>
                                    <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                                        <option value="admin">Admin (Full Access)</option>
                                        <option value="viewer">Viewer (Read Only)</option>
                                    </Select>
                                </FormControl>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={2} onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handleAddMember} isDisabled={!selectedUser}>
                            Add Member
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
