import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Image,
    Icon,
    Button
} from '@chakra-ui/react';
import { FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

/**
 * EventCouponFail - Failure page for invalid/used/expired coupons
 */
function EventCouponFail() {
    const { code } = useParams();
    const location = useLocation();
    const { reason } = location.state || {};

    const getErrorInfo = () => {
        switch (reason) {
            case 'used':
            case 'already_redeemed':
                return {
                    icon: FaExclamationTriangle,
                    color: 'orange',
                    title: 'Already Redeemed',
                    message: 'This coupon has already been used and cannot be redeemed again.'
                };
            case 'expired':
                return {
                    icon: FaTimesCircle,
                    color: 'red',
                    title: 'Coupon Expired',
                    message: 'This coupon has expired and is no longer valid.'
                };
            case 'not_found':
            default:
                return {
                    icon: FaTimesCircle,
                    color: 'red',
                    title: 'Coupon Not Found',
                    message: 'The coupon code does not exist or has been removed.'
                };
        }
    };

    const errorInfo = getErrorInfo();

    return (
        <Box
            minH="100vh"
            bg="linear-gradient(135deg, #eb3349 0%, #f45c43 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            py={8}
            px={4}
        >
            <Container maxW="500px">
                <VStack spacing={6}>
                    {/* Logo */}
                    <Image
                        src="/image/event/aset/IndomieLogo-tw.png"
                        alt="Event Logo"
                        width="150px"
                        fallbackSrc="https://via.placeholder.com/150x50?text=Event+Logo"
                    />

                    {/* Error Card */}
                    <Box
                        bg="white"
                        borderRadius="20px"
                        p={8}
                        w="100%"
                        boxShadow="xl"
                        textAlign="center"
                    >
                        <VStack spacing={4}>
                            <Icon
                                as={errorInfo.icon}
                                boxSize="60px"
                                color={`${errorInfo.color}.500`}
                            />

                            <Heading size="lg" color={`${errorInfo.color}.600`}>
                                {errorInfo.title}
                            </Heading>

                            <Text fontSize="lg" color="gray.600">
                                {errorInfo.message}
                            </Text>

                            {/* Coupon Code Display */}
                            {code && (
                                <Box
                                    bg="gray.100"
                                    borderRadius="10px"
                                    p={4}
                                    w="100%"
                                >
                                    <Text fontSize="sm" color="gray.500" mb={1}>
                                        Coupon Code
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold" color="gray.400" textDecoration="line-through">
                                        {code}
                                    </Text>
                                </Box>
                            )}

                            <Button
                                colorScheme="gray"
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                                mt={4}
                            >
                                Go to Homepage
                            </Button>
                        </VStack>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}

export default EventCouponFail;
