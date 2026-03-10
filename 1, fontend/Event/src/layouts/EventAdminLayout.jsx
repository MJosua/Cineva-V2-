import {
    Box,
    Flex,
    VStack,
    HStack,
    Text,
    Icon,
    Divider,
    Button,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useColorModeValue,
    useToast,
    Badge
} from "@chakra-ui/react";

import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { publishCampaign } from "../services/eventEngineApi";
import SessionExpiredModal from "../components/SessionExpiredModal";


import {
    MdDashboard,
    MdWeb,
    MdLocalOffer,
    MdInbox,
    MdBarChart,
    MdSettings,
    MdArrowBack,
    MdPerson,
    MdCelebration,
    MdGroup,
    MdVisibility,
    MdPublic,
    MdPublish,
    MdCollections,
    MdPermMedia
} from "react-icons/md";

const SIDEBAR_ITEMS = [
    { label: "Dashboard", path: "dashboard", icon: MdDashboard },
    { label: "Submissions", path: "submissions", icon: MdInbox },
    { label: "Coupons & Pools", path: "coupons", icon: MdLocalOffer },
    { label: "Winner Generator", path: "winners", icon: MdCelebration },
    { label: "Reports", path: "reports", icon: MdBarChart },
    { label: "Account List", path: "admins", icon: MdGroup },
    { label: "Pages", path: "pages", icon: MdCollections },
    { label: "Media Library", path: "media", icon: MdPermMedia },
    { label: "Settings", path: "settings", icon: MdSettings },
];

export default function EventAdminLayout() {
    const { admin, currentEvent, loading, selectEvent, clearEvent, logout } = useAuth();
    const navigate = useNavigate();
    const [publishing, setPublishing] = useState(false);
    const toast = useToast();

    const sidebarBg = useColorModeValue("gray.900", "gray.900");
    const activeBg = useColorModeValue("brand.600", "brand.600");

    // Role-based visibility (case-insensitive for robustness)
    const role = admin?.role?.toLowerCase() || '';
    const isSuperAdmin = role === 'superadmin';
    const isDistributor = role === 'distributor';
    const isAdmin = role === 'admin' || role === 'event_admin';

    // Auto-redirect Distributor to reports if they are at the event root
    useEffect(() => {
        if (isDistributor && (window.location.pathname.endsWith('/dashboard') || window.location.pathname.endsWith(currentEvent?.slug))) {
            navigate(`/admin/event/${currentEvent?.slug}/reports`);
        }
    }, [isDistributor, currentEvent, navigate]);

    if (loading) return <Flex h="100vh" align="center" justify="center"><Text>Loading...</Text></Flex>;
    if (!admin) return <Navigate to="/admin/login" replace />;
    if (!currentEvent) return <Navigate to="/admin/events" replace />;

    const sidebarItemsFiltered = SIDEBAR_ITEMS.filter(item => {
        if (isSuperAdmin) return true;
        if (isDistributor) return item.path === 'reports';
        if (isAdmin) {
            // Admin: Now allowed to see Pages and Settings as requested
            return true;
        }
        return false;
    });

    const handleBackToEvents = () => { clearEvent(); navigate("/admin/events"); };
    const handleLogout = () => { logout(); navigate("/admin/login"); };

    const handlePublish = async () => {
        const newStatus = currentEvent.status === 'active' ? false : true; // Toggle
        const action = newStatus ? "Publish" : "Unpublish";

        if (!window.confirm(`Are you sure you want to ${action} this campaign?`)) return;

        setPublishing(true);
        try {
            const updated = await publishCampaign(currentEvent.slug, newStatus);
            selectEvent(updated); // Update context
            toast({ title: `Campaign ${newStatus ? 'Published' : 'Unpublished'}`, status: "success" });
        } catch (e) {
            toast({ title: "Failed to update status", description: e.message, status: "error" });
        } finally {
            setPublishing(false);
        }
    };

    const handleViewLive = () => {
        window.open(`/${currentEvent.slug}`, '_blank');
    };

    const isPublished = currentEvent.status === 'active' && !!currentEvent.published_at;

    const blocksArray = Array.isArray(currentEvent.blocks)
        ? currentEvent.blocks
        : (currentEvent.blocks?.pages?.["/"] || []);
    const heroBlock = blocksArray.find(b => b.type?.toLowerCase().includes('hero'));
    const displayTitle = heroBlock?.props?.title || heroBlock?.data?.title || currentEvent.name || currentEvent.slug;

    return (
        <>
            <Flex h="100vh">
                {/* Sidebar (Keep as is, mostly) */}
                <Box w="240px" bg={sidebarBg} color="white" p={4} display="flex" flexDirection="column">
                    {/* ... Sidebar Content ... */}
                    {/* Copying existing sidebar content is risky with replace_file, better to keep structure */}
                    <VStack align="start" spacing={1} mb={4}>
                        <HStack cursor="pointer" onClick={handleBackToEvents} _hover={{ opacity: 0.8 }}>
                            <Icon as={MdArrowBack} />
                            <Text fontSize="xs" color="gray.400">Back to Events</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                            {displayTitle}
                        </Text>
                        <Text fontSize="xs" color="gray.500">/{currentEvent.slug}</Text>
                    </VStack>
                    <Divider borderColor="gray.700" mb={4} />
                    <VStack spacing={1} align="stretch" flex={1}>
                        {sidebarItemsFiltered
                            .map(item => (
                                <NavLink key={item.path} to={`/admin/event/${currentEvent.slug}/${item.path}`} style={{ textDecoration: "none" }}>
                                    {({ isActive }) => (
                                        <HStack px={3} py={2} borderRadius="md" bg={isActive ? activeBg : "transparent"} _hover={{ bg: isActive ? activeBg : "gray.800" }} cursor="pointer">
                                            <Icon as={item.icon} />
                                            <Text fontSize="sm">{item.label}</Text>
                                        </HStack>
                                    )}
                                </NavLink>
                            ))}
                    </VStack>
                    <Divider borderColor="gray.700" my={4} />
                    <Menu>
                        <MenuButton>
                            <HStack>
                                <Avatar size="sm" name={admin.name} />
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="medium">{admin.name}</Text>
                                    <Text fontSize="xs" color="gray.400">{admin.role}</Text>
                                </VStack>
                            </HStack>
                        </MenuButton>
                        <MenuList bg="gray.800">
                            <MenuItem icon={<MdPerson />}>Profile</MenuItem>
                            <MenuItem icon={<MdArrowBack />} onClick={handleLogout} color="red.300">Logout</MenuItem>
                        </MenuList>
                    </Menu>
                </Box>

                {/* Main Content + Top Bar */}
                <Flex direction="column" flex={1} bgGradient="linear(to-br, brand.50, indigo.100)" overflow="hidden">
                    {/* Top Bar */}
                    <Flex bg="white" p={4} borderBottom="1px" borderColor="gray.200" justify="space-between" align="center">
                        <HStack>
                            <Text fontWeight="bold" color="gray.600">Event Status:</Text>
                            <Badge colorScheme={isPublished ? "green" : "yellow"} fontSize="0.9em">
                                {isPublished ? "LIVE" : "DRAFT"}
                            </Badge>
                            {currentEvent.is_locked && <Badge colorScheme="red">LOCKED</Badge>}
                        </HStack>

                        <HStack>
                            <Button
                                leftIcon={<Icon as={MdVisibility} />}
                                size="sm"
                                variant="ghost"
                                onClick={handleViewLive}
                                isDisabled={!isPublished && admin.role !== 'superadmin'} // Only superadmin sees draft preview? Or allow draft preview? User said "Hide or warn when event is Draft".
                            // Let's allow preview but it might 404 if not logged in context, but for now Public API blocks it properly.
                            >
                                View Live
                            </Button>
                            {isSuperAdmin && (
                                <Button
                                    size="sm"
                                    colorScheme={isPublished ? "red" : "green"}
                                    variant={isPublished ? "outline" : "solid"}
                                    onClick={handlePublish}
                                    isLoading={publishing}
                                >
                                    {isPublished ? "Unpublish Event" : "Publish Event"}
                                </Button>
                            )}
                        </HStack>
                    </Flex>

                    {/* Page Content */}
                    <Box flex={1} overflowY="auto" display="flex" flexDirection="column">
                        <Outlet />
                    </Box>
                </Flex>
            </Flex>

            {/* Session Expired Modal — global, rendered once inside auth shell */}
            <SessionExpiredModal />
        </>
    );
}

