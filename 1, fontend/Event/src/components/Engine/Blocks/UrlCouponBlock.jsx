import {
    Box, VStack, HStack, Heading, Text, Spinner, Button, Icon,
    useToast, useDisclosure, FormControl, FormLabel, Input, Textarea, Select,
    Image, IconButton, Progress, Badge,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MdCheckCircle, MdCancel, MdWarning, MdArrowForward, MdCloudUpload, MdDelete } from "react-icons/md";
import { submitEntry } from "../../../services/eventEngineApi";

// ── Status UI configs ───────────────────────────────────────────────────────
const STATUS_CONFIG = {
    AVAILABLE: {
        icon: MdCheckCircle,
        color: "green.500",
        bg: "green.50",
        border: "green.200",
    },
    ALREADY_USED: {
        icon: MdWarning,
        color: "orange.500",
        bg: "orange.50",
        border: "orange.200",
    },
    INVALID: {
        icon: MdCancel,
        color: "red.500",
        bg: "red.50",
        border: "red.200",
    },
};

// ── API: check coupon status ────────────────────────────────────────────────
async function checkCouponStatus(eventSlug, couponCode, poolId) {
    try {
        const { getApiBase } = await import("../../../services/eventEngineApi");
        const base = getApiBase ? getApiBase() : "/api";
        // Append ?pool=poolId when a pool is configured
        const poolQuery = poolId ? `?pool=${poolId}&encrypted=true` : '?encrypted=true';
        const res = await fetch(`${base}/event-engine/public/campaigns/${eventSlug}/check-coupon/${encodeURIComponent(couponCode)}${poolQuery}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        if (!res.ok) {
            if (res.status === 404) return { status: "INVALID", message: "Coupon not found." };
            const err = await res.json().catch(() => ({}));
            return { status: "INVALID", message: err.message || "Unknown error." };
        }
        const data = await res.json();
        return data?.data || data;
    } catch (e) {
        return { status: "INVALID", message: e.message || "Network error." };
    }
}

// ── Main Block Component ────────────────────────────────────────────────────
export default function UrlCouponBlock({
    // Admin-configurable
    title = "Enter Your Code",
    subtitle = "We will verify your coupon automatically.",
    fields = [],
    buttonText = "Submit",
    buttonColor = "rgba(72,187,120,1)",
    buttonTextColor = "rgba(255,255,255,1)",
    successMessage = "Your coupon has been submitted!",
    invalidTitle = "Invalid Code",
    invalidMessage = "This code does not exist or has expired.",
    usedTitle = "Already Claimed",
    usedMessage = "This code has already been used.",
    usedNavLabel = "Go Back to Home",
    onSuccessAction = "/success",
    onUsedAction = "",
    onInvalidAction = "",
    poolId = null,
    theme,
    eventSlug: propEventSlug,
    eventId,
    isEditor = false,   // true when rendered inside the admin visual editor
}) {
    const { slug: routeSlug, "*": wildcard } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const fileInputRef = useRef();
    const { isOpen: isActionModalOpen, onOpen: openActionModal, onClose: closeActionModal } = useDisclosure();
    const [actionModalInfo, setActionModalInfo] = useState({ title: '', body: '' });

    const showEditorAction = (title, body) => {
        setActionModalInfo({ title, body });
        openActionModal();
    };

    // ── Extract coupon code (3 source priority) ─────────────────────────────
    // 1. sessionStorage set by EnginePage when it strips trailing code from URL
    // 2. ?code= query string param  (/coupon?code=IPL336Z)
    // 3. Last URL path segment fallback (/coupon/IPL336Z via wildcard)
    const couponCode = (() => {
        // Source 1: SessionStorage (most reliable — set by EnginePage route parser)
        const ss = sessionStorage.getItem("event_url_code");
        if (ss) return ss;

        // Source 2: Query string ?code=VALUE
        const qp = new URLSearchParams(window.location.search).get("code");
        if (qp) return qp;

        // Source 3: Last path segment (fallback)
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const last = pathParts[pathParts.length - 1];
        // Don't use the event slug or page slug as the code
        if (last && last !== routeSlug && last !== "coupon") return last;

        return null;
    })();

    // The event slug: prefer prop, fall back to React Router param
    const eventSlug = propEventSlug || routeSlug;

    const [phase, setPhase] = useState("loading"); // loading | available | used | invalid | submitted
    const [couponInfo, setCouponInfo] = useState(null);
    const [formData, setFormData] = useState({});
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Fetch coupon status on mount ────────────────────────────────────────
    useEffect(() => {
        // Editor mode: always show the form preview, never call the API
        if (isEditor) {
            setPhase("available");
            return;
        }
        let mounted = true;
        async function verify() {
            // Live mode: no code in URL → truly invalid
            if (!couponCode) {
                setPhase("invalid");
                return;
            }
            setPhase("loading");
            const result = await checkCouponStatus(eventSlug, couponCode, poolId);
            if (!mounted) return;

            const s = (result?.status || "INVALID").toUpperCase();
            setCouponInfo(result);

            if (s === "AVAILABLE" || s === "VALID") {
                setPhase("available");
            } else if (s === "ALREADY_USED" || s === "CLAIMED") {
                setPhase("used");
            } else {
                setPhase("invalid");
            }
        }
        verify();
        return () => { mounted = false; };
    }, [isEditor, eventSlug, couponCode, poolId]);


    // ── Form handling ───────────────────────────────────────────────────────
    const handleChange = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadProgress(10);
        files.forEach(file => {
            if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
            if (file.size > 5 * 1024 * 1024) return;
            const preview = URL.createObjectURL(file);
            setUploadedImages(prev => [...prev, { id: `img-${Date.now()}`, file, preview, name: file.name }]);
        });
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 500);
        e.target.value = "";
    };

    const removeImage = (id) => setUploadedImages(prev => prev.filter(i => i.id !== id));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const payload = {
            participant_name: formData.name || "",
            participant_contact: formData.email || formData.phone || "",
            receipt_codes: [couponCode],
            is_encrypted: true,
            extra_data: { ...formData, images: uploadedImages.map(i => i.name) }
        };
        try {
            const result = await submitEntry(eventSlug, payload);
            const status = (result?.status || "VALID").toUpperCase();

            if (status === "VALID" || status === "PENDING" || status === "OK") {
                setPhase("submitted");
                if (onSuccessAction?.startsWith("/")) {
                    setTimeout(() => navigate(`/${eventSlug}${onSuccessAction}`), 1200);
                }
            } else if (status === "ALREADY_USED" || status === "CLAIMED") {
                setPhase("used");
                if (onUsedAction?.startsWith("/")) navigate(`/${eventSlug}${onUsedAction}`);
            } else {
                toast({ title: "Error", description: result?.message || "Submission failed.", status: "error" });
            }
        } catch (e) {
            toast({ title: "Failed", description: e.message || "Please try again.", status: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNav = (action) => {
        if (isEditor) return; // no navigation in editor
        if (action?.startsWith("/")) navigate(`/${eventSlug}${action}`);
        else navigate(`/${eventSlug}`);
    };

    const textColor = theme?.color || "#1a1a1a";

    // ── Editor action badge: replaces buttons in editor mode ─────────────────
    const ActionBadge = ({ label, action, colorScheme = "gray" }) => (
        <Badge
            colorScheme={colorScheme}
            px={3} py={1} borderRadius="full" fontSize="xs"
            display="inline-flex" alignItems="center" gap={1}
        >
            <Icon as={MdArrowForward} />
            {label}{action ? `: ${action}` : ""}
        </Badge>
    );


    if (phase === "loading") {
        return (
            <VStack py={16} spacing={4}>
                <Spinner size="xl" color="brand.500" thickness="3px" />
                <Text color={textColor} opacity={0.7}>Verifying your code…</Text>
            </VStack>
        );
    }

    if (phase === "submitted") {
        return (
            <Box textAlign="center" py={16} px={8}>
                <Icon as={MdCheckCircle} boxSize={16} color="green.400" mb={4} />
                <Heading size="lg" mb={2} color={textColor}>{successMessage}</Heading>
                <Text color={textColor} opacity={0.7}>You will be redirected shortly.</Text>
            </Box>
        );
    }

    if (phase === "used") {
        const cfg = STATUS_CONFIG.ALREADY_USED;
        return (
            <Box mx="auto" maxW="480px" my={8} px={6} py={10} borderRadius="2xl" border="1.5px solid" borderColor={cfg.border} bg={cfg.bg} textAlign="center">
                <Icon as={cfg.icon} boxSize={14} color={cfg.color} mb={4} />
                <Heading size="md" mb={2} color={cfg.color}>{usedTitle}</Heading>
                <Text color="gray.600" mb={6}>{couponInfo?.message || usedMessage}</Text>
                <Button
                    size="lg"
                    colorScheme="orange"
                    rightIcon={<Icon as={MdArrowForward} />}
                    onClick={() => isEditor
                        ? showEditorAction("Navigate To", `This button will navigate to: ${onUsedAction || "(no redirect configured)"}`)
                        : handleNav(onUsedAction)
                    }
                >
                    {usedNavLabel}
                </Button>
            </Box>
        );
    }

    if (phase === "invalid") {
        const cfg = STATUS_CONFIG.INVALID;
        return (
            <Box mx="auto" maxW="480px" my={8} px={6} py={10} borderRadius="2xl" border="1.5px solid" borderColor={cfg.border} bg={cfg.bg} textAlign="center">
                <Icon as={cfg.icon} boxSize={14} color={cfg.color} mb={4} />
                <Heading size="md" mb={2} color={cfg.color}>{invalidTitle}</Heading>
                <Text color="gray.600" mb={6}>{couponInfo?.message || invalidMessage}</Text>
                <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => isEditor
                        ? showEditorAction("Navigate To", `Go Back button will navigate to: ${onInvalidAction || "(no redirect configured)"}`)
                        : handleNav(onInvalidAction)
                    }
                >
                    Go Back
                </Button>
            </Box>
        );
    }

    // ── AVAILABLE: show credential form ──────────────────────────────────────
    return (
        <Box bg="white" p={{ base: 6, md: 10 }} borderRadius="2xl" shadow="xl" maxW="500px" mx="auto" my={8}>
            {/* Code confirmation badge */}
            <HStack mb={4} justify="center">
                <Icon as={MdCheckCircle} color="green.400" />
                <Badge colorScheme="green" px={3} py={1} borderRadius="full" fontSize="sm" fontFamily="mono">
                    {isEditor ? "● PREVIEW" : (couponInfo?.item?.value || couponCode)}
                </Badge>
                {isEditor && (
                    <Badge colorScheme="purple" px={2} py={1} borderRadius="full" fontSize="xs">editor mode</Badge>
                )}
            </HStack>

            <VStack spacing={5} align="stretch">
                <Box textAlign="center">
                    <Heading size="md" mb={1}>{title}</Heading>
                    {subtitle && <Text color="gray.500" fontSize="sm">{subtitle}</Text>}
                </Box>

                {fields.map((field, i) => (
                    <FormControl key={i}>
                        <FormLabel fontSize="sm">{field.label}</FormLabel>
                        {(field.type === "text" || !field.type) && (
                            <Input value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} placeholder={field.placeholder || ""} />
                        )}
                        {field.type === "email" && (
                            <Input type="email" value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} placeholder="your@email.com" />
                        )}
                        {field.type === "phone" && (
                            <Input type="tel" value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} placeholder="0812-345-6789" />
                        )}
                        {field.type === "textarea" && (
                            <Textarea value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)} rows={3} />
                        )}
                        {field.type === "select" && (
                            <Select value={formData[field.name] || ""} onChange={e => handleChange(field.name, e.target.value)}>
                                <option value="">Select…</option>
                                {(field.options || []).map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                            </Select>
                        )}
                        {field.type === "image" && (
                            <Box>
                                <input type="file" accept="image/jpeg,image/png,image/webp" multiple ref={fileInputRef} style={{ display: "none" }} onChange={handleImageUpload} />
                                <Button leftIcon={<MdCloudUpload />} variant="outline" w="100%" h="70px" borderStyle="dashed" onClick={() => fileInputRef.current?.click()}>
                                    Upload Image
                                </Button>
                                {uploadProgress > 0 && <Progress value={uploadProgress} size="xs" colorScheme="green" mt={1} />}
                                {uploadedImages.length > 0 && (
                                    <HStack mt={2} flexWrap="wrap" spacing={2}>
                                        {uploadedImages.map(img => (
                                            <Box key={img.id} position="relative">
                                                <Image src={img.preview} w="72px" h="72px" objectFit="cover" borderRadius="md" />
                                                <IconButton icon={<MdDelete />} size="xs" colorScheme="red" position="absolute" top={-1} right={-1} borderRadius="full" onClick={() => removeImage(img.id)} aria-label="Remove" />
                                            </Box>
                                        ))}
                                    </HStack>
                                )}
                            </Box>
                        )}
                    </FormControl>
                ))}

                {fields.length === 0 && (
                    <Text color="gray.400" textAlign="center" fontSize="sm">No fields configured in the builder yet.</Text>
                )}

                <Button
                    size="lg"
                    bg={buttonColor}
                    color={buttonTextColor}
                    onClick={() => isEditor
                        ? showEditorAction("Submit Form", `Submits all credential fields, then navigates to: ${onSuccessAction || "(no redirect configured)"}`)
                        : handleSubmit()
                    }
                    isLoading={!isEditor && isSubmitting}
                    _hover={{ opacity: 0.88 }}
                    borderRadius="xl"
                >
                    {buttonText}
                </Button>
            </VStack>
            {/* Editor action info modal */}
            <Modal isOpen={isActionModalOpen} onClose={closeActionModal} size="sm" isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="sm">🛠️ Editor Info – Button Action</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text fontWeight="bold" mb={1}>{actionModalInfo.title}</Text>
                        <Text fontSize="sm" color="gray.600">{actionModalInfo.body}</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" onClick={closeActionModal}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}
