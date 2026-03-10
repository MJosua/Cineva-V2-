import { Box, VStack, Heading, Text, Input, Button, FormControl, FormLabel, useToast, useDisclosure, Textarea, Select, Image, IconButton, HStack, Progress, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, Checkbox } from "@chakra-ui/react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MdCloudUpload, MdDelete, MdImage } from "react-icons/md";
import { submitEntry } from "../../../services/eventEngineApi";
import { resolveMediaUrl } from "../../../utils/mediaHelper";

// ── API: check coupon status ────────────────────────────────────────────────
async function checkCouponStatus(eventSlug, couponCode, poolId, useEncryption = false) {
    try {
        const { getApiBase } = await import("../../../services/eventEngineApi");
        const base = getApiBase ? getApiBase() : "/api";
        const poolQuery = poolId ? `?pool=${poolId}&encrypted=${useEncryption}` : `?encrypted=${useEncryption}`;
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

export default function CouponFormBlock({
    title = "Submit Your Receipt",
    description = "",
    buttonText = "Submit",
    buttonColor = "rgba(72,187,120,1)",
    buttonTextColor = "rgba(255,255,255,1)",
    fields = [],
    successMessage = "Thank you! Your submission has been received.",
    onSuccessAction = "",
    onSuccessCustomUrl = "",
    onUsedAction = "",
    onInvalidAction = "",
    apiEndpoint = "",
    eventSlug = "",
    isEditor = false,
    poolId = null,
    useEncryption = false,
    buttonImageUrl = "",
    theme,
    // Styling props
    bgColor = "transparent",
    containerBgColor = "transparent",
    backgroundImage = null,
    padding = "8",
    margin = "0",
    titleColor = null,
    labelColor = null,
    labelFontFamily = "inherit",
    inputBgColor = "white",
    inputTextColor = "inherit",
    customCss = ""
}) {
    const toast = useToast();
    const navigate = useNavigate();
    const { isOpen: isActionModalOpen, onOpen: openActionModal, onClose: closeActionModal } = useDisclosure();
    const [actionModalInfo, setActionModalInfo] = useState({ title: '', body: '' });
    const showEditorAction = (title, body) => { setActionModalInfo({ title, body }); openActionModal(); };
    const [formData, setFormData] = useState({});
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef();

    const finalLabelColor = labelColor || theme?.color || "gray.700";
    const finalTitleColor = titleColor || theme?.color || "gray.800";
    const finalFontFamily = labelFontFamily === "inter" ? "inherit" : labelFontFamily;

    const handleChange = (fieldName, value) => {
        setFormData({ ...formData, [fieldName]: value });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadProgress(10);

        for (const file of files) {
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                toast({ title: "Invalid file type", description: "Only JPG, PNG, WEBP allowed", status: "error" });
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: "File too large", description: "Max 5MB per image", status: "error" });
                continue;
            }

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setUploadedImages(prev => [...prev, {
                id: `img-${Date.now()}`,
                file,
                preview: previewUrl,
                name: file.name
            }]);
        }

        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 500);
        e.target.value = ""; // Reset input
    };

    const removeImage = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Identify fields dynamically, matching either explicit 'name' props or falling back to labels
        const findField = (regex) => Object.entries(formData).find(([k]) => regex.test(k))?.[1] || "";
        const nameField = findField(/name|nama/i);
        const contactField = findField(/email|phone|contact|hp/i);

        // Code Validation is strictly Opt-In for 'coupon' field types
        let codeValue = "";
        let requiresValidation = false;
        const explicitCouponField = fields.find(f => f.type === 'coupon');
        if (explicitCouponField) {
            codeValue = formData[explicitCouponField.name || explicitCouponField.label];
            requiresValidation = true;
        } else {
            // For multiple receipts WITHOUT validation, we extract a receipt field but don't run checkCouponStatus
            const rcptField = findField(/code|receipt|coupon|serial|resi/i);
            if (rcptField) codeValue = rcptField;
        }

        if (requiresValidation && codeValue) {
            const vRes = await checkCouponStatus(eventSlug, codeValue, poolId, useEncryption);
            const s = (vRes?.status || "INVALID").toUpperCase();
            if (s !== "AVAILABLE" && s !== "VALID") {
                setIsSubmitting(false);
                if (s === "ALREADY_USED" || s === "CLAIMED") {
                    if (onUsedAction && onUsedAction.startsWith("/")) {
                        navigate(`/${eventSlug}${onUsedAction}`);
                    } else {
                        toast({ title: "Already Used", description: "This code has already been claimed.", status: "warning" });
                    }
                } else {
                    if (onInvalidAction && onInvalidAction.startsWith("/")) {
                        navigate(`/${eventSlug}${onInvalidAction}`);
                    } else {
                        toast({ title: "Invalid", description: "This code is invalid.", status: "error" });
                    }
                }
                return;
            }
        }

        const payload = {
            participant_name: nameField,
            participant_contact: contactField,
            receipt_codes: codeValue ? [codeValue] : [],
            is_encrypted: useEncryption,
            extra_data: {
                ...formData,
                images: uploadedImages.map(img => img.name)
            }
        };

        try {
            const result = await submitEntry(eventSlug, payload);

            // Assuming successful submission for now if no specific error thrown
            // In a real API, result.status would be parsed here
            const status = result.status || 'VALID';

            if (status === 'VALID' || status === 'pending') {
                if (onSuccessAction === "/custom" && onSuccessCustomUrl) {
                    window.location.href = onSuccessCustomUrl;
                } else if (onSuccessAction && onSuccessAction.startsWith("/")) {
                    navigate(`/${eventSlug}${onSuccessAction}`);
                } else {
                    toast({ title: "Success!", description: successMessage, status: "success", duration: 5000 });
                    setFormData({});
                    setUploadedImages([]);
                }
            } else if (status === 'ALREADY_CLAIMED') {
                if (onUsedAction && onUsedAction.startsWith("/")) {
                    navigate(`/${eventSlug}${onUsedAction}`);
                } else {
                    toast({ title: "Already Used", description: "This code has already been claimed.", status: "warning" });
                }
            } else if (status === 'INVALID') {
                if (onInvalidAction && onInvalidAction.startsWith("/")) {
                    navigate(`/${eventSlug}${onInvalidAction}`);
                } else {
                    toast({ title: "Invalid", description: "This code is invalid.", status: "error" });
                }
            }
        } catch (e) {
            const errorMsg = e.message || "";
            // Handle HTTP errors throwing exceptions loosely
            if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('used')) {
                if (onUsedAction && onUsedAction.startsWith("/")) {
                    navigate(`/${eventSlug}${onUsedAction}`);
                    return;
                }
            } else if (errorMsg.toLowerCase().includes('invalid')) {
                if (onInvalidAction && onInvalidAction.startsWith("/")) {
                    navigate(`/${eventSlug}${onInvalidAction}`);
                    return;
                }
            }
            toast({ title: "Submission Failed", description: e.message || "Please try again", status: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasImageField = fields.some(f => f.type === 'image');

    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch (e) {
        console.warn("Invalid CSS JSON in CouponFormBlock:", customCss);
    }

    const finalDescColor = theme?.color ? `rgba(${theme.color.match(/\d+/g)?.join(",") || "26,26,26"}, 0.8)` : "gray.600";

    return (
        <Box
            minH="100vh"
            w="100%"
            bg={containerBgColor}
            backgroundImage={backgroundImage ? `url(${resolveMediaUrl(backgroundImage)})` : "none"}
            backgroundSize="cover"
            backgroundPosition="center"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            scrollSnapAlign="start"
            m={margin}
            p={padding}
            sx={customStyles}
        >
            <Box bg={bgColor === "transparent" ? "white" : bgColor} p={8} borderRadius="xl" shadow="xl" maxW="500px" w="100%" mx="auto">
                <VStack spacing={4} align="stretch">
                    <Heading size="md" textAlign="center" color={finalTitleColor}>{title}</Heading>
                    {description && <Text textAlign="center" color={finalDescColor}>{description}</Text>}

                    {fields.map((field, i) => {
                        const fieldKey = field.name || field.label; // Fallback to label if name omitted
                        return (
                            <FormControl key={i} isRequired={field.required}>
                                {(field.type === 'text' || field.type === 'coupon' || !field.type) && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Input
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder={field.placeholder || (field.type === 'coupon' ? "Enter code..." : "")}
                                            borderColor={field.type === 'coupon' ? "brand.200" : "inherit"}
                                            _focus={field.type === 'coupon' ? { borderColor: "brand.500", boxShadow: "0 0 0 1px brand.500" } : {}}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        />
                                    </>
                                )}
                                {field.type === 'email' && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Input
                                            type="email"
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder={field.placeholder || "your@email.com"}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        />
                                    </>
                                )}
                                {field.type === 'phone' && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Input
                                            type="tel"
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder={field.placeholder || "0912-345-678"}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        />
                                    </>
                                )}
                                {field.type === 'textarea' && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Textarea
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            placeholder={field.placeholder || ""}
                                            rows={3}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        />
                                    </>
                                )}
                                {field.type === 'date' && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Input
                                            type="date"
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        />
                                    </>
                                )}
                                {field.type === 'checkbox' && (
                                    <HStack align="flex-start" spacing={3}>
                                        <Checkbox
                                            isChecked={!!formData[fieldKey]}
                                            onChange={(e) => handleChange(fieldKey, e.target.checked)}
                                            mt={1}
                                            colorScheme="brand"
                                        />
                                        <FormLabel
                                            fontSize="sm"
                                            fontFamily={finalFontFamily}
                                            cursor="pointer"
                                            onClick={() => handleChange(fieldKey, !formData[fieldKey])}
                                            m={0}
                                        >
                                            <Box
                                                as="span"
                                                className="wysiwyg-label"
                                                display="inline-block"
                                                sx={{
                                                    'p': { m: 0 }, // prevent Quill <p> from adding margin
                                                    'span[style*="color"]': { color: 'inherit' }, // let the style attribute win
                                                }}
                                                dangerouslySetInnerHTML={{ __html: field.checkboxText }}
                                            />
                                        </FormLabel>
                                    </HStack>
                                )}
                                {field.type === 'select' && (
                                    <>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <Select
                                            value={formData[fieldKey] || ""}
                                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        >
                                            <option value="">{field.placeholder || "Select..."}</option>
                                            {(field.options || []).map((opt, j) => (
                                                <option key={j} value={opt}>{opt}</option>
                                            ))}
                                        </Select>
                                    </>
                                )}
                                {field.type === 'image' && (
                                    <Box>
                                        <FormLabel color={finalLabelColor} fontFamily={finalFontFamily}>{field.label}</FormLabel>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            onChange={handleImageUpload}
                                        />
                                        <Button
                                            leftIcon={<MdCloudUpload />}
                                            variant="outline"
                                            w="100%"
                                            h="80px"
                                            onClick={() => fileInputRef.current?.click()}
                                            borderStyle="dashed"
                                            bg={inputBgColor}
                                            color={inputTextColor}
                                        >
                                            Click to Upload Image
                                        </Button>
                                        {uploadProgress > 0 && (
                                            <Progress value={uploadProgress} size="xs" colorScheme="green" mt={2} />
                                        )}
                                        {uploadedImages.length > 0 && (
                                            <HStack mt={3} spacing={2} wrap="wrap">
                                                {uploadedImages.map((img) => (
                                                    <Box key={img.id} position="relative">
                                                        <Image
                                                            src={img.preview}
                                                            w="80px"
                                                            h="80px"
                                                            objectFit="cover"
                                                            borderRadius="md"
                                                            border="1px solid"
                                                            borderColor="gray.200"
                                                        />
                                                        <IconButton
                                                            icon={<MdDelete />}
                                                            size="xs"
                                                            colorScheme="red"
                                                            position="absolute"
                                                            top={-1}
                                                            right={-1}
                                                            borderRadius="full"
                                                            onClick={() => removeImage(img.id)}
                                                            aria-label="Remove"
                                                        />
                                                    </Box>
                                                ))}
                                            </HStack>
                                        )}
                                    </Box>
                                )}
                            </FormControl>
                        );
                    })}

                    {fields.length === 0 && (
                        <Text color="gray.400" textAlign="center" fontSize="sm">No fields configured</Text>
                    )}

                    {buttonImageUrl ? (
                        <Box
                            as="button"
                            onClick={() => isEditor
                                ? showEditorAction("Submit Form", `Submits all form fields, then navigates to: ${onSuccessAction || "(no redirect configured)"}`)
                                : handleSubmit()
                            }
                            disabled={!isEditor && isSubmitting}
                            opacity={(!isEditor && fields.length === 0) ? 0.5 : 1}
                            cursor={(!isEditor && fields.length === 0) ? "not-allowed" : "pointer"}
                            _hover={{ transform: "scale(1.02)" }}
                            _active={{ transform: "scale(0.98)" }}
                            transition="all 0.2s"
                            mx="auto"
                            display="block"
                        >
                            <Image src={resolveMediaUrl(buttonImageUrl)} alt={buttonText} maxH="80px" />
                        </Box>
                    ) : (
                        <Button
                            bg={buttonColor}
                            color={buttonTextColor}
                            size="lg"
                            onClick={() => isEditor
                                ? showEditorAction("Submit Form", `Submits all form fields, then navigates to: ${onSuccessAction || "(no redirect configured)"}`)
                                : handleSubmit()
                            }
                            isLoading={!isEditor && isSubmitting}
                            isDisabled={!isEditor && fields.length === 0}
                            _hover={{ opacity: 0.9 }}
                        >
                            {buttonText}
                        </Button>
                    )}
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
        </Box >
    );
}
