import { Box, VStack, Heading, Text, Input, Button, FormControl, FormLabel, useToast, Textarea, Select, Image, IconButton, HStack, Progress } from "@chakra-ui/react";
import { useState, useRef } from "react";
import { MdCloudUpload, MdDelete, MdImage } from "react-icons/md";
import { submitEntry } from "../../../services/eventEngineApi";

export default function CouponFormBlock({
    title = "Submit Your Receipt",
    description = "",
    buttonText = "Submit",
    buttonColor = "rgba(72,187,120,1)",
    buttonTextColor = "rgba(255,255,255,1)",
    fields = [],
    successMessage = "Thank you! Your submission has been received.",
    apiEndpoint = "",
    eventSlug = ""
}) {
    const toast = useToast();
    const [formData, setFormData] = useState({});
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef();

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

        // Identify fields
        const nameField = formData['name'] || "";
        const contactField = formData['email'] || formData['phone'] || "";

        // Strategy to find code field:
        // 0. Priority: Explicit 'coupon' type field
        let codeValue = "";
        const explicitCouponField = fields.find(f => f.type === 'coupon');
        if (explicitCouponField) {
            codeValue = formData[explicitCouponField.name];
        }

        // 1. Fallback: Look for explicit names: 'code', 'receipt', 'coupon', 'serial'
        if (!codeValue) {
            const codeKey = Object.keys(formData).find(k => /code|receipt|coupon|serial/i.test(k));
            if (codeKey) {
                codeValue = formData[codeKey];
            } else {
                // 2. Fallback: First text field that isn't name/email/phone
                const otherKey = Object.keys(formData).find(k => !['name', 'email', 'phone'].includes(k));
                if (otherKey) codeValue = formData[otherKey];
            }
        }

        const payload = {
            participant_name: nameField,
            participant_contact: contactField,
            receipt_codes: codeValue ? [codeValue] : [],
            extra_data: {
                ...formData,
                images: uploadedImages.map(img => img.name)
            }
        };

        try {
            await submitEntry(eventSlug, payload);
            toast({ title: "Success!", description: successMessage, status: "success", duration: 5000 });
            setFormData({});
            setUploadedImages([]);
        } catch (e) {
            toast({ title: "Submission Failed", description: e.message || "Please try again", status: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasImageField = fields.some(f => f.type === 'image');

    return (
        <Box bg="white" p={8} borderRadius="xl" shadow="xl" maxW="500px" mx="auto" my={8}>
            <VStack spacing={4} align="stretch">
                <Heading size="md" textAlign="center">{title}</Heading>
                {description && <Text textAlign="center" color="gray.600">{description}</Text>}

                {fields.map((field, i) => (
                    <FormControl key={i}>
                        <FormLabel>
                            {field.label}
                            {field.type === 'coupon' && (
                                <Text as="span" fontSize="xs" color="purple.500" ml={2} fontWeight="normal">
                                    (Validates against Reward Pool)
                                </Text>
                            )}
                        </FormLabel>
                        {(field.type === 'text' || field.type === 'coupon') && (
                            <Input
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder || (field.type === 'coupon' ? "Enter code..." : "")}
                                borderColor={field.type === 'coupon' ? "purple.200" : "inherit"}
                                _focus={field.type === 'coupon' ? { borderColor: "purple.500", boxShadow: "0 0 0 1px purple.500" } : {}}
                            />
                        )}
                        {field.type === 'email' && (
                            <Input
                                type="email"
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder="your@email.com"
                            />
                        )}
                        {field.type === 'phone' && (
                            <Input
                                type="tel"
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder="0912-345-678"
                            />
                        )}
                        {field.type === 'textarea' && (
                            <Textarea
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                rows={3}
                            />
                        )}
                        {field.type === 'select' && (
                            <Select
                                value={formData[field.name] || ""}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                            >
                                <option value="">Select...</option>
                                {(field.options || []).map((opt, j) => (
                                    <option key={j} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        )}
                        {field.type === 'image' && (
                            <Box>
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
                ))}

                {fields.length === 0 && (
                    <Text color="gray.400" textAlign="center" fontSize="sm">No fields configured</Text>
                )}

                <Button
                    bg={buttonColor}
                    color={buttonTextColor}
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    isDisabled={fields.length === 0}
                    _hover={{ opacity: 0.9 }}
                >
                    {buttonText}
                </Button>
            </VStack>
        </Box>
    );
}
