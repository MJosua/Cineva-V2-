import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    Image,
    useToast
} from '@chakra-ui/react';
import Axios from 'axios';
import { API_URL } from '../../../../config';
import DynamicFormRenderer from '../../../../components/event/DynamicFormRenderer';

/**
 * EventCouponPage - Main coupon redemption page
 * User scans QR code â†’ lands here â†’ fills form â†’ submits
 */
function EventCouponPage() {
    const { code } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    // State
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [couponData, setCouponData] = useState(null);
    const [formSchema, setFormSchema] = useState(null);
    const [status, setStatus] = useState(null); // valid, used, expired, not_found
    const [formValues, setFormValues] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // Fetch coupon and form data on mount
    useEffect(() => {
        if (code) {
            fetchCouponData();
        }
    }, [code]);

    const fetchCouponData = async () => {
        try {
            setLoading(true);
            const response = await Axios.get(`${API_URL}/api/event/coupon/${code}`);

            if (response.data.status === 'valid') {
                setCouponData(response.data.coupon);
                setFormSchema(response.data.form?.schema || null);
                setStatus('valid');
            } else {
                setStatus(response.data.status);
            }
        } catch (error) {
            console.error('Error fetching coupon:', error);
            if (error.response?.data?.status) {
                setStatus(error.response.data.status);
            } else {
                setStatus('error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (fieldName, value) => {
        setFormValues(prev => ({
            ...prev,
            [fieldName]: value
        }));
        // Clear error when user starts typing
        if (formErrors[fieldName]) {
            setFormErrors(prev => ({
                ...prev,
                [fieldName]: null
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (formSchema && formSchema.fields) {
            formSchema.fields.forEach(field => {
                if (field.required && !formValues[field.name]) {
                    errors[field.name] = `${field.label || field.name} is required`;
                }
                // Email validation
                if (field.type === 'email' && formValues[field.name]) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formValues[field.name])) {
                        errors[field.name] = 'Please enter a valid email address';
                    }
                }
            });
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields correctly.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return;
        }

        try {
            setSubmitting(true);

            const response = await Axios.post(`${API_URL}/api/event/coupon/${code}/redeem`, {
                answers: formValues,
                user: {
                    name: formValues.name || formValues.full_name || '',
                    email: formValues.email || '',
                    phone: formValues.phone || ''
                }
            });

            if (response.data.status === 'redeemed') {
                // Success - redirect to success page
                navigate(`/event/coupon/${code}/success`, {
                    state: {
                        couponData,
                        redeemedAt: response.data.redeemed_at
                    }
                });
            } else {
                // Handle other statuses
                setStatus(response.data.status);
            }
        } catch (error) {
            console.error('Error redeeming coupon:', error);
            toast({
                title: 'Submission Failed',
                description: error.response?.data?.message || 'An error occurred. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Render loading state
    if (loading) {
        return (
            <Box
                minH="100vh"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <VStack spacing={4}>
                    <Spinner size="xl" color="white" thickness="4px" />
                    <Text color="white" fontSize="lg">Loading...</Text>
                </VStack>
            </Box>
        );
    }

    // Render error states
    if (status === 'not_found') {
        return (
            <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center" p={4}>
                <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" p={8} maxW="400px">
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">Coupon Not Found</AlertTitle>
                    <AlertDescription maxWidth="sm">
                        The coupon code "{code}" does not exist or has been removed.
                    </AlertDescription>
                </Alert>
            </Box>
        );
    }

    if (status === 'used' || status === 'already_redeemed') {
        return (
            <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center" p={4}>
                <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" p={8} maxW="400px">
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">Already Redeemed</AlertTitle>
                    <AlertDescription maxWidth="sm">
                        This coupon has already been used and cannot be redeemed again.
                    </AlertDescription>
                </Alert>
            </Box>
        );
    }

    if (status === 'expired') {
        return (
            <Box minH="100vh" bg="gray.100" display="flex" alignItems="center" justifyContent="center" p={4}>
                <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="lg" p={8} maxW="400px">
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">Coupon Expired</AlertTitle>
                    <AlertDescription maxWidth="sm">
                        This coupon has expired and is no longer valid.
                    </AlertDescription>
                </Alert>
            </Box>
        );
    }

    // Render valid coupon form
    return (
        <Box
            minH="100vh"
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            py={8}
            px={4}
        >
            <Container maxW="500px">
                <VStack spacing={6}>
                    {/* Logo */}
                    <Image
                        src="/image/event/aset/IndomieLogo-tw.png"
                        alt="Indomie Logo"
                        width="150px"
                        fallbackSrc="https://via.placeholder.com/150x50?text=Event+Logo"
                    />

                    {/* Form Card */}
                    <Box
                        bg="white"
                        borderRadius="20px"
                        p={6}
                        w="100%"
                        boxShadow="xl"
                    >
                        <VStack spacing={4} align="stretch">
                            <Heading size="md" textAlign="center" color="purple.600">
                                Redeem Your Coupon
                            </Heading>

                            {couponData?.value && (
                                <Text textAlign="center" color="green.500" fontWeight="bold">
                                    Prize: {couponData.value}
                                </Text>
                            )}

                            {/* Dynamic Form */}
                            <DynamicFormRenderer
                                schema={formSchema}
                                values={formValues}
                                errors={formErrors}
                                onChange={handleFieldChange}
                                couponCode={couponData?.coupon_code || code}
                            />

                            {/* Submit Button */}
                            <Button
                                colorScheme="purple"
                                size="lg"
                                width="100%"
                                borderRadius="full"
                                onClick={handleSubmit}
                                isLoading={submitting}
                                loadingText="Submitting..."
                                mt={4}
                            >
                                Submit & Redeem
                            </Button>
                        </VStack>
                    </Box>

                    {/* Footer */}
                    <Text color="whiteAlpha.800" fontSize="sm" textAlign="center">
                        By submitting, you agree to the Terms & Conditions
                    </Text>
                </VStack>
            </Container>
        </Box>
    );
}

export default EventCouponPage;






