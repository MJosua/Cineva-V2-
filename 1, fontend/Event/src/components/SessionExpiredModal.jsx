import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
    VStack, HStack, Input, Button, Text, Icon, InputGroup, InputRightElement,
    IconButton, FormControl, FormLabel, FormErrorMessage, Box, Divider, Spinner
} from "@chakra-ui/react";
import { MdLock, MdWarning, MdVisibility, MdVisibilityOff, MdLogout, MdLogin } from "react-icons/md";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/**
 * SessionExpiredModal
 *
 * Listens for the global 'session-expired' CustomEvent fired by apiFetch
 * when the server returns 401. Shows a re-login modal pre-filled with
 * the current user's email. On success, the admin can continue without
 * losing their current page. On logout, clears state and redirects.
 */
export default function SessionExpiredModal() {
    const { admin, login, logout } = useAuth();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // ── Listen for session-expired event ────────────────────────────────────
    useEffect(() => {
        const handleExpired = () => {
            setIsOpen(true);
            setPassword("");
            setError("");
        };
        window.addEventListener("session-expired", handleExpired);
        return () => window.removeEventListener("session-expired", handleExpired);
    }, []);

    // ── Re-login ─────────────────────────────────────────────────────────────
    const handleRelogin = async () => {
        if (!password.trim()) { setError("Password is required."); return; }
        setIsLoading(true);
        setError("");
        try {
            const result = await login(admin?.email || "", password);
            if (result.success) {
                setIsOpen(false);
                setPassword("");
            } else {
                setError(result.error || "Incorrect password. Please try again.");
            }
        } catch (e) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        logout();
        setIsOpen(false);
        navigate("/admin/login", { replace: true });
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleRelogin();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // Prevent closing by clicking overlay
            isCentered
            closeOnOverlayClick={false}
            closeOnEsc={false}
            size="sm"
        >
            <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(6px)" />
            <ModalContent borderRadius="2xl" overflow="hidden" mx={4}>

                {/* Header stripe */}
                <Box bg="orange.400" px={6} py={5}>
                    <HStack spacing={3}>
                        <Icon as={MdWarning} color="white" boxSize={7} />
                        <Box>
                            <Text fontWeight="bold" color="white" fontSize="md">Session Expired</Text>
                            <Text color="orange.100" fontSize="xs">Your session timed out due to inactivity.</Text>
                        </Box>
                    </HStack>
                </Box>

                <ModalBody pt={6} pb={2}>
                    <VStack spacing={5} align="stretch">
                        {/* Who is logging back in */}
                        <Box bg="gray.50" borderRadius="lg" px={4} py={3}>
                            <Text fontSize="xs" color="gray.500" mb={0.5}>Continuing as</Text>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800">
                                {admin?.name || admin?.email || "Administrator"}
                            </Text>
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">{admin?.email}</Text>
                        </Box>

                        {/* Password field */}
                        <FormControl isInvalid={!!error}>
                            <FormLabel fontSize="sm">Enter your password to continue</FormLabel>
                            <InputGroup>
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    borderRadius="lg"
                                />
                                <InputRightElement>
                                    <IconButton
                                        icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label="Toggle password"
                                        tabIndex={-1}
                                    />
                                </InputRightElement>
                            </InputGroup>
                            {error && <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>}
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter pt={4} pb={6} px={6} flexDirection="column" gap={3}>
                    <Button
                        w="100%"
                        colorScheme="orange"
                        leftIcon={isLoading ? <Spinner size="xs" /> : <Icon as={MdLogin} />}
                        onClick={handleRelogin}
                        isLoading={isLoading}
                        loadingText="Signing in…"
                        borderRadius="xl"
                        size="md"
                    >
                        Continue Session
                    </Button>
                    <Divider />
                    <Button
                        w="100%"
                        variant="ghost"
                        colorScheme="red"
                        leftIcon={<Icon as={MdLogout} />}
                        onClick={handleLogout}
                        size="sm"
                    >
                        Logout &amp; Start Over
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
