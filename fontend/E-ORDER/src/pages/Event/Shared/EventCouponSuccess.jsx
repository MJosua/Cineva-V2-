import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Image,
    Icon
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';

/**
 * EventCouponSuccess - Success page after coupon redemption
 */
function EventCouponSuccess() {
    const { code } = useParams();
    const location = useLocation();
    const { couponData, redeemedAt } = location.state || {};

    return (
        <Box
            minH="100vh"
            bg="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
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

                    {/* Success Card */}
                    <Box
                        bg="white"
                        borderRadius="20px"
                        p={8}
                        w="100%"
                        boxShadow="xl"
                        textAlign="center"
                    >
                        <VStack spacing={4}>
                            <Icon as={FaCheckCircle} boxSize="60px" color="green.500" />

                            <Heading size="lg" color="green.600">
                                Success!
                            </Heading>

                            <Text fontSize="lg" color="gray.600">
                                Your coupon has been redeemed successfully.
                            </Text>

                            {/* Coupon Code Display */}
                            <Box
                                bg="gray.100"
                                borderRadius="10px"
                                p={4}
                                w="100%"
                            >
                                <Text fontSize="sm" color="gray.500" mb={1}>
                                    Coupon Code
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="purple.600">
                                    {code}
                                </Text>
                            </Box>

                            {/* Prize Info */}
                            {couponData?.value && (
                                <Box
                                    bg="green.50"
                                    borderRadius="10px"
                                    p={4}
                                    w="100%"
                                    border="2px solid"
                                    borderColor="green.200"
                                >
                                    <Text fontSize="sm" color="gray.500" mb={1}>
                                        Prize
                                    </Text>
                                    <Text fontSize="lg" fontWeight="bold" color="green.600">
                                        {couponData.value}
                                    </Text>
                                </Box>
                            )}

                            {/* Timestamp */}
                            {redeemedAt && (
                                <Text fontSize="sm" color="gray.400">
                                    Redeemed at: {new Date(redeemedAt).toLocaleString()}
                                </Text>
                            )}

                            <Text fontSize="sm" color="gray.500" mt={4}>
                                Thank you for participating! Winners will be announced soon.
                            </Text>
                        </VStack>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
}

export default EventCouponSuccess;
