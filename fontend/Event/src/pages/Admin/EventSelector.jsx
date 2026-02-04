import {
    Box, Heading, SimpleGrid, Text, VStack, Badge, Button, Flex, Icon, useColorModeValue,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    FormControl, FormLabel, Input, Textarea, Select, useDisclosure, useToast, HStack, Spinner
} from "@chakra-ui/react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
// import { MOCK_EVENTS } from "../../data/mockEvents"; // Removed mock data import
import { getCampaigns, createCampaign } from "../../services/eventEngineApi"; // Added API service
import { MdEvent, MdLogout, MdAdd, MdCloudOff } from "react-icons/md";

export default function EventSelector() {
    const { admin, logout, canAccessEvent, selectEvent, loading } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cardBg = useColorModeValue("white", "gray.800");

    // Form state for new event
    const [newEvent, setNewEvent] = useState({
        name: "",
        slug: "",
        description: "",
        startDate: "",
        endDate: "",
        template: "blank"
    });

    // Local state for events


    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch campaigns
    useEffect(() => {
        let isMounted = true;
        async function fetchEvents() {
            try {
                const data = await getCampaigns();
                if (isMounted) setEvents(data);
            } catch (e) {
                console.error("Failed to load events", e);
                if (isMounted) toast({ title: "Failed to load events", status: "error" });
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }
        fetchEvents();
        return () => { isMounted = false; };
    }, []);

    // 1. Wait for Auth Loading
    if (loading) {
        return (
            <Flex h="100vh" align="center" justify="center">
                <Spinner size="xl" color="purple.500" />
            </Flex>
        );
    }

    // 2. Auth Guard
    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    const accessibleEvents = events;

    const handleSelectEvent = (event) => {
        selectEvent(event);
        if (admin?.role === 'distributor') {
            navigate(`/admin/event/${event.slug}/reports`);
        } else {
            navigate(`/admin/event/${event.slug}/dashboard`);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const generateSlug = (name) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setNewEvent(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }));
    };

    const handleCreateEvent = async () => {
        if (!newEvent.name || !newEvent.slug) {
            toast({ title: "Name and slug are required", status: "warning" });
            return;
        }

        // Check if slug already exists (client-side pre-check)
        if (events.some(evt => evt.slug === newEvent.slug)) {
            toast({ title: "Slug already exists", description: "Please choose a different name", status: "error" });
            return;
        }

        const defaultBlocks = getTemplateBlocks(newEvent.template, newEvent.name);

        const campaignData = {
            slug: newEvent.slug,
            name: newEvent.name,
            theme: {
                background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                fontFamily: "Inter, sans-serif",
            },
            blocks: defaultBlocks,
            status: "draft",
            startDate: newEvent.startDate,
            endDate: newEvent.endDate,
            description: newEvent.description
        };

        try {
            const createdEvent = await createCampaign(campaignData);

            setEvents(prev => [...prev, createdEvent]);

            toast({ title: "Event Created!", description: `/${newEvent.slug}`, status: "success" });

            setNewEvent({ name: "", slug: "", description: "", startDate: "", endDate: "", template: "blank" });
            onClose();

            selectEvent(createdEvent);
            navigate(`/admin/event/${newEvent.slug}/editor`);
        } catch (error) {
            console.error(error);
            toast({ title: "Failed to create event", description: error.message, status: "error" });
        }
    };

    const getTemplateBlocks = (template, eventName) => {
        const baseId = Date.now();

        if (template === "landing") {
            return [
                {
                    type: "header",
                    _id: `block-${baseId}-1`,
                    props: { logo: "", links: [], bgColor: "rgba(255,255,255,0.9)" }
                },
                {
                    type: "hero",
                    _id: `block-${baseId}-2`,
                    props: { title: eventName, subtitle: "Your event description here", bgColor: "rgba(102,126,234,0.5)" }
                },
                {
                    type: "section",
                    _id: `block-${baseId}-3`,
                    props: { background: "rgba(255,255,255,1)", children: [] }
                }
            ];
        }

        if (template === "form") {
            return [
                {
                    type: "hero",
                    _id: `block-${baseId}-1`,
                    props: { title: eventName, subtitle: "Submit your entry" }
                },
                {
                    type: "couponForm",
                    _id: `block-${baseId}-2`,
                    props: {
                        title: "Registration Form",
                        fields: [
                            { name: "name", label: "Full Name", type: "text" },
                            { name: "phone", label: "Phone Number", type: "phone" },
                            { name: "email", label: "Email", type: "email" }
                        ],
                        buttonText: "Submit",
                        buttonColor: "rgba(102,126,234,1)"
                    }
                }
            ];
        }

        // Blank template
        return [
            {
                type: "hero",
                _id: `block-${baseId}-1`,
                props: { title: eventName, subtitle: "" }
            }
        ];
    };

    return (
        <Box minH="100vh" bg="gray.100" p={8}>
            <Flex justify="space-between" align="center" mb={8}>
                <VStack align="start" spacing={1}>
                    <Heading size="lg">🎉 Select Event</Heading>
                    <Text color="gray.600">Welcome, {admin.name} ({admin.role})</Text>
                </VStack>
                <Button leftIcon={<MdLogout />} variant="ghost" onClick={handleLogout}>
                    Logout
                </Button>
            </Flex>

            {isLoading ? (
                <Flex justify="center" align="center" h="200px">
                    <Spinner size="xl" color="purple.500" />
                </Flex>
            ) : accessibleEvents.length === 0 ? (
                <Box bg={cardBg} p={8} borderRadius="xl" textAlign="center">
                    <Text color="gray.500">No events assigned to your account.</Text>
                </Box>
            ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {accessibleEvents.map((event) => {
                        const heroBlock = event.blocks?.find(b => b.type === 'hero');
                        const title = heroBlock?.props?.title || event.name || "Untitled Event";

                        return (
                            <Box
                                key={event.slug}
                                bg={cardBg}
                                p={6}
                                borderRadius="xl"
                                shadow="md"
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{ shadow: "xl", transform: "translateY(-2px)" }}
                                onClick={() => handleSelectEvent(event)}
                            >
                                <VStack align="start" spacing={3}>
                                    <Flex w="100%" justify="space-between" align="center">
                                        <Icon as={MdEvent} boxSize={8} color="purple.500" />
                                        <Badge colorScheme={event.status === "draft" ? "yellow" : "green"}>
                                            {event.status || "Active"}
                                        </Badge>
                                    </Flex>
                                    <Heading size="md">{title}</Heading>
                                    <Text fontSize="sm" color="gray.500">/{event.slug}</Text>
                                    <Text fontSize="xs" color="gray.400">
                                        {event.blocks?.length || 0} blocks
                                    </Text>
                                </VStack>
                            </Box>
                        );
                    })}
                </SimpleGrid>
            )}

            {admin.role === "superadmin" && (
                <Box mt={8}>
                    <Button colorScheme="purple" size="lg" leftIcon={<MdAdd />} onClick={onOpen}>
                        Create New Event
                    </Button>
                </Box>
            )}

            {/* Create Event Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create New Event</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Event Name</FormLabel>
                                <Input
                                    placeholder="Taiwan New Year 2025"
                                    value={newEvent.name}
                                    onChange={handleNameChange}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>URL Slug</FormLabel>
                                <HStack>
                                    <Text color="gray.500">/</Text>
                                    <Input
                                        placeholder="tw-2025"
                                        value={newEvent.slug}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                                    />
                                </HStack>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    placeholder="Brief description of the event..."
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                                    rows={2}
                                />
                            </FormControl>

                            <SimpleGrid columns={2} spacing={4} w="100%">
                                <FormControl>
                                    <FormLabel>Start Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={newEvent.startDate}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>End Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={newEvent.endDate}
                                        onChange={(e) => setNewEvent(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </FormControl>
                            </SimpleGrid>

                            <FormControl>
                                <FormLabel>Template</FormLabel>
                                <Select
                                    value={newEvent.template}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, template: e.target.value }))}
                                >
                                    <option value="blank">🗒️ Blank (Hero only)</option>
                                    <option value="landing">🏠 Landing Page (Header + Hero + Section)</option>
                                    <option value="form">📝 Form Page (Hero + Registration Form)</option>
                                </Select>
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={2} onClick={onClose}>Cancel</Button>
                        <Button colorScheme="purple" onClick={handleCreateEvent}>
                            Create Event
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
