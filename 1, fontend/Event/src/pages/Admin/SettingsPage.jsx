import {
    Box, Heading, VStack, HStack, Button, Text, Badge, Flex, SimpleGrid,
    FormControl, FormLabel, Input, Textarea, Select, Switch, Divider,
    useToast, Tabs, TabList, TabPanels, Tab, TabPanel, Code, Alert, AlertIcon,
    AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
    useDisclosure
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { updateCampaign, deleteCampaign, duplicateCampaign } from "../../services/eventEngineApi";
import { useAuth } from "../../context/AuthContext";
import { MOCK_EVENTS } from "../../data/mockEvents";

export default function SettingsPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { currentEvent, selectEvent, isSuperAdmin } = useAuth();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef();

    // Get event data
    const event = MOCK_EVENTS[slug] || currentEvent;
    const isLocked = event?.is_locked || event?.status === 'active';

    const blocksArray = Array.isArray(event?.blocks)
        ? event.blocks
        : (event?.blocks?.pages?.["/"] || []);
    const heroTitle = blocksArray.find(b => b.type?.toLowerCase().includes("hero"))?.props?.title || blocksArray.find(b => b.type?.toLowerCase().includes("hero"))?.data?.title || "";

    // Form state
    const [settings, setSettings] = useState({
        name: heroTitle,
        slug: slug,
        description: event?.description || "",
        status: event?.status || "active",
        startDate: event?.startDate || "",
        endDate: event?.endDate || "",
        // Theme settings
        themeBackground: event?.theme_config?.background || event?.theme?.background || "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
        themeFontFamily: event?.theme_config?.fontFamily || event?.theme?.fontFamily || "Inter, sans-serif",
        themeTextColor: event?.theme_config?.color || event?.theme?.color || "#ffffff",
        // Submission settings
        requireApproval: true,
        allowMultipleSubmissions: false,
        maxSubmissionsPerUser: 1,
        // Form settings
        enableImageUpload: true,
        maxImageSize: 5, // MB
        allowedImageTypes: "jpg,png,jpeg",
        // Notification settings
        emailNotifications: true,
        notifyOnNewSubmission: true,
        notifyOnApproval: false
    });

    const handleSave = async () => {
        if (isLocked) {
            toast({ title: "Event is locked", status: "warning" });
            return;
        }

        try {
            const updates = {
                name: settings.name,
                description: settings.description,
                status: settings.status,
                settings_config: {
                    start_date: settings.startDate,
                    end_date: settings.endDate,
                    require_approval: settings.requireApproval,
                    allow_multiple_submissions: settings.allowMultipleSubmissions,
                    max_submissions_per_user: settings.maxSubmissionsPerUser,
                    enable_image_upload: settings.enableImageUpload,
                    max_image_size: settings.maxImageSize,
                    allowed_image_types: settings.allowedImageTypes,
                    email_notifications: settings.emailNotifications,
                    notify_on_new_submission: settings.notifyOnNewSubmission,
                    notify_on_approval: settings.notifyOnApproval
                },
                theme_config: event?.theme_config || event?.theme || {
                    background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                    fontFamily: "Inter, sans-serif",
                    color: "#ffffff"
                }
            };

            const updatedEvent = await updateCampaign(slug, updates);
            selectEvent(updatedEvent); // Update context
            toast({ title: "Settings saved!", status: "success" });
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to save settings", description: e.message, status: "error" });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCampaign(slug);
            toast({ title: "Event deleted", status: "info" });
            navigate("/admin/events");
        } catch (e) {
            toast({ title: "Failed to delete", description: e.message, status: "error" });
        }
    };

    const handleDuplicate = async () => {
        try {
            const newEvent = await duplicateCampaign(slug);
            toast({ title: "Event duplicated!", description: `New event: ${newEvent.slug}`, status: "success" });
            navigate(`/admin/event/${newEvent.slug}/settings`);
        } catch (e) {
            toast({ title: "Failed to duplicate", description: e.message, status: "error" });
        }
    };

    return (
        <Box p={6}>
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="lg">⚙️ Settings</Heading>
                <HStack>
                    <Button variant="outline" onClick={handleDuplicate}>
                        Duplicate Event
                    </Button>
                    <Button colorScheme="purple" onClick={handleSave} isDisabled={isLocked}>
                        Save Changes
                    </Button>
                </HStack>
            </Flex>

            {isLocked && (
                <Alert status="info" mb={4} borderRadius="md">
                    <AlertIcon />
                    This event is currently Active/Published. Editing settings is disabled to prevent inconsistencies.
                    <Button size="sm" variant="link" colorScheme="blue" ml={2} onClick={() => navigate('../dashboard')}>
                        Return to Dashboard
                    </Button>
                </Alert>
            )}

            <Tabs colorScheme="purple">
                <TabList bg="white" borderRadius="lg" p={1} mb={4}>
                    <Tab>General</Tab>
                    <Tab>Submissions</Tab>
                    <Tab>Notifications</Tab>
                    {isSuperAdmin && <Tab color="red.500">Danger Zone</Tab>}
                </TabList>

                <TabPanels>
                    {/* General Settings */}
                    <TabPanel p={0}>
                        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                            <VStack spacing={4} align="stretch">
                                <FormControl isDisabled={isLocked}>
                                    <FormLabel>Event Name</FormLabel>
                                    <Input
                                        value={settings.name}
                                        onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl isDisabled={isLocked}>
                                    <FormLabel>URL Slug</FormLabel>
                                    <HStack>
                                        <Text color="gray.500">/</Text>
                                        <Input value={settings.slug} isReadOnly bg="gray.50" />
                                    </HStack>
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        Slug cannot be changed after creation
                                    </Text>
                                </FormControl>

                                <FormControl isDisabled={isLocked}>
                                    <FormLabel>Description</FormLabel>
                                    <Textarea
                                        value={settings.description}
                                        onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                    />
                                </FormControl>

                                <FormControl isDisabled={true}>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={settings.status}
                                        onChange={(e) => setSettings(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="draft">🟡 Draft</option>
                                        <option value="active">🟢 Active</option>
                                        <option value="paused">🟠 Paused</option>
                                        <option value="ended">🔴 Ended</option>
                                    </Select>
                                    <Text fontSize="xs" color="gray.500" mt={1}>Status is managed via the Publish button in the toolbar.</Text>
                                </FormControl>

                                <SimpleGrid columns={2} spacing={4}>
                                    <FormControl isDisabled={isLocked}>
                                        <FormLabel>Start Date</FormLabel>
                                        <Input
                                            type="date"
                                            value={settings.startDate}
                                            onChange={(e) => setSettings(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </FormControl>
                                    <FormControl isDisabled={isLocked}>
                                        <FormLabel>End Date</FormLabel>
                                        <Input
                                            type="date"
                                            value={settings.endDate}
                                            onChange={(e) => setSettings(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </FormControl>
                                </SimpleGrid>
                            </VStack>
                        </Box>
                    </TabPanel>



                    {/* Submission Settings */}
                    <TabPanel p={0}>
                        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                            <fieldset disabled={isLocked}>
                                <VStack spacing={4} align="stretch">
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel mb={0}>Require Admin Approval</FormLabel>
                                        <Switch
                                            isChecked={settings.requireApproval}
                                            onChange={(e) => setSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                                            colorScheme="purple"
                                        />
                                    </FormControl>

                                    <Divider />

                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel mb={0}>Allow Multiple Submissions per User</FormLabel>
                                        <Switch
                                            isChecked={settings.allowMultipleSubmissions}
                                            onChange={(e) => setSettings(prev => ({ ...prev, allowMultipleSubmissions: e.target.checked }))}
                                            colorScheme="purple"
                                        />
                                    </FormControl>

                                    {settings.allowMultipleSubmissions && (
                                        <FormControl>
                                            <FormLabel>Max Submissions per User</FormLabel>
                                            <Input
                                                type="number"
                                                value={settings.maxSubmissionsPerUser}
                                                onChange={(e) => setSettings(prev => ({ ...prev, maxSubmissionsPerUser: parseInt(e.target.value) }))}
                                            />
                                        </FormControl>
                                    )}

                                    <Divider />

                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel mb={0}>Enable Image Upload</FormLabel>
                                        <Switch
                                            isChecked={settings.enableImageUpload}
                                            onChange={(e) => setSettings(prev => ({ ...prev, enableImageUpload: e.target.checked }))}
                                            colorScheme="purple"
                                        />
                                    </FormControl>

                                    {settings.enableImageUpload && (
                                        <>
                                            <FormControl>
                                                <FormLabel>Max Image Size (MB)</FormLabel>
                                                <Input
                                                    type="number"
                                                    value={settings.maxImageSize}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, maxImageSize: parseInt(e.target.value) }))}
                                                />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel>Allowed Image Types</FormLabel>
                                                <Input
                                                    value={settings.allowedImageTypes}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, allowedImageTypes: e.target.value }))}
                                                    placeholder="jpg,png,jpeg"
                                                />
                                            </FormControl>
                                        </>
                                    )}
                                </VStack>
                            </fieldset>
                        </Box>
                    </TabPanel>

                    {/* Notification Settings */}
                    <TabPanel p={0}>
                        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                            <fieldset disabled={isLocked}>
                                <VStack spacing={4} align="stretch">
                                    <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                        <FormLabel mb={0}>Email Notifications</FormLabel>
                                        <Switch
                                            isChecked={settings.emailNotifications}
                                            onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                                            colorScheme="purple"
                                        />
                                    </FormControl>

                                    {settings.emailNotifications && (
                                        <>
                                            <Divider />
                                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                                <VStack align="start" spacing={0}>
                                                    <FormLabel mb={0}>Notify on New Submission</FormLabel>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Get email when a new form is submitted
                                                    </Text>
                                                </VStack>
                                                <Switch
                                                    isChecked={settings.notifyOnNewSubmission}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, notifyOnNewSubmission: e.target.checked }))}
                                                    colorScheme="purple"
                                                />
                                            </FormControl>

                                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                                                <VStack align="start" spacing={0}>
                                                    <FormLabel mb={0}>Notify User on Approval</FormLabel>
                                                    <Text fontSize="xs" color="gray.500">
                                                        Send email to user when their submission is approved
                                                    </Text>
                                                </VStack>
                                                <Switch
                                                    isChecked={settings.notifyOnApproval}
                                                    onChange={(e) => setSettings(prev => ({ ...prev, notifyOnApproval: e.target.checked }))}
                                                    colorScheme="purple"
                                                />
                                            </FormControl>
                                        </>
                                    )}
                                </VStack>
                            </fieldset>
                        </Box>
                    </TabPanel>

                    {/* Danger Zone */}
                    {isSuperAdmin && (
                        <TabPanel p={0}>
                            <Box bg="red.50" p={6} borderRadius="lg" border="2px solid" borderColor="red.200">
                                <Heading size="md" color="red.600" mb={4}>⚠️ Danger Zone</Heading>
                                <VStack spacing={4} align="stretch">
                                    <Alert status="warning">
                                        <AlertIcon />
                                        These actions are irreversible. Please be careful.
                                    </Alert>

                                    <HStack justify="space-between" p={4} bg="white" borderRadius="md">
                                        <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold">Delete Event</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                Permanently delete this event and all its data
                                            </Text>
                                        </VStack>
                                        <Button colorScheme="red" onClick={onOpen}>
                                            Delete Event
                                        </Button>
                                    </HStack>
                                </VStack>
                            </Box>
                        </TabPanel>
                    )}
                </TabPanels>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>Delete Event</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete <strong>{slug}</strong>?
                            This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>Cancel</Button>
                            <Button colorScheme="red" onClick={handleDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}
