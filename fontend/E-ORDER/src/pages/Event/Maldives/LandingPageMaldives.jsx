import React from 'react';
import {
    Box,
    Container,
    VStack,
    Image,
    Heading,
    Text,
    Button,
    Flex,
    Icon
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaQrcode, FaGift, FaTrophy } from 'react-icons/fa';

/**
 * LandingPageMaldives - Event landing page for Maldives campaign
 */
function LandingPageMaldives() {
    const navigate = useNavigate();

    return (
        <Box
            minH="100vh"
            bg="linear-gradient(180deg, #00b4db 0%, #0083b0 50%, #005f7f 100%)"
            position="relative"
            overflow="hidden"
        >
            {/* Background decorative elements */}
            <Box
                position="absolute"
                top="10%"
                right="-5%"
                width="200px"
                height="200px"
                borderRadius="full"
                bg="whiteAlpha.100"
                filter="blur(40px)"
            />
            <Box
                position="absolute"
                bottom="20%"
                left="-10%"
                width="300px"
                height="300px"
                borderRadius="full"
                bg="whiteAlpha.100"
                filter="blur(60px)"
            />

            <Container maxW="600px" py={8} px={4}>
                <VStack spacing={8} align="center">

                    {/* Logo Section */}
                    <Box textAlign="center">
                        <Image
                            src="/image/event/aset/IndomieLogo-tw.png"
                            alt="Indomie Logo"
                            width="200px"
                            mx="auto"
                            fallbackSrc="https://via.placeholder.com/200x60?text=Indomie"
                        />
                    </Box>

                    {/* Hero Section */}
                    <Box
                        bg="white"
                        borderRadius="30px"
                        p={8}
                        w="100%"
                        boxShadow="2xl"
                        textAlign="center"
                    >
                        <VStack spacing={6}>
                            <Heading
                                size="xl"
                                bgGradient="linear(to-r, #00b4db, #0083b0)"
                                bgClip="text"
                            >
                                🎉 Indomie Maldives
                            </Heading>
                            <Heading size="lg" color="gray.700">
                                Lucky Draw Event
                            </Heading>
                            <Text fontSize="lg" color="gray.600">
                                Scan your QR code to enter the lucky draw and win amazing prizes!
                            </Text>

                            {/* Event mascot or image */}
                            <Image
                                src="/image/event/aset/Bunny_HiRes4K.png"
                                alt="Event Mascot"
                                width="150px"
                                fallbackSrc="https://via.placeholder.com/150x150?text=🎁"
                            />
                        </VStack>
                    </Box>

                    {/* How It Works Section */}
                    <Box
                        bg="whiteAlpha.200"
                        borderRadius="20px"
                        p={6}
                        w="100%"
                        backdropFilter="blur(10px)"
                    >
                        <Heading size="md" color="white" textAlign="center" mb={6}>
                            How It Works
                        </Heading>
                        <VStack spacing={4}>
                            {/* Step 1 */}
                            <Flex
                                bg="white"
                                borderRadius="15px"
                                p={4}
                                w="100%"
                                align="center"
                                boxShadow="md"
                            >
                                <Flex
                                    bg="cyan.500"
                                    borderRadius="full"
                                    w="50px"
                                    h="50px"
                                    align="center"
                                    justify="center"
                                    mr={4}
                                >
                                    <Icon as={FaQrcode} color="white" boxSize="24px" />
                                </Flex>
                                <Box>
                                    <Text fontWeight="bold" color="gray.700">Step 1</Text>
                                    <Text color="gray.600" fontSize="sm">
                                        Scan the QR code on your product
                                    </Text>
                                </Box>
                            </Flex>

                            {/* Step 2 */}
                            <Flex
                                bg="white"
                                borderRadius="15px"
                                p={4}
                                w="100%"
                                align="center"
                                boxShadow="md"
                            >
                                <Flex
                                    bg="green.500"
                                    borderRadius="full"
                                    w="50px"
                                    h="50px"
                                    align="center"
                                    justify="center"
                                    mr={4}
                                >
                                    <Icon as={FaGift} color="white" boxSize="24px" />
                                </Flex>
                                <Box>
                                    <Text fontWeight="bold" color="gray.700">Step 2</Text>
                                    <Text color="gray.600" fontSize="sm">
                                        Fill in your details on the form
                                    </Text>
                                </Box>
                            </Flex>

                            {/* Step 3 */}
                            <Flex
                                bg="white"
                                borderRadius="15px"
                                p={4}
                                w="100%"
                                align="center"
                                boxShadow="md"
                            >
                                <Flex
                                    bg="yellow.500"
                                    borderRadius="full"
                                    w="50px"
                                    h="50px"
                                    align="center"
                                    justify="center"
                                    mr={4}
                                >
                                    <Icon as={FaTrophy} color="white" boxSize="24px" />
                                </Flex>
                                <Box>
                                    <Text fontWeight="bold" color="gray.700">Step 3</Text>
                                    <Text color="gray.600" fontSize="sm">
                                        Win exciting prizes!
                                    </Text>
                                </Box>
                            </Flex>
                        </VStack>
                    </Box>

                    {/* Prizes Section */}
                    <Box
                        bg="white"
                        borderRadius="20px"
                        p={6}
                        w="100%"
                        boxShadow="xl"
                    >
                        <Heading size="md" textAlign="center" mb={4} color="gray.700">
                            🎁 Prizes
                        </Heading>
                        <VStack spacing={3}>
                            <Flex
                                bg="yellow.50"
                                borderRadius="10px"
                                p={3}
                                w="100%"
                                justify="space-between"
                                align="center"
                            >
                                <Text fontWeight="bold" color="yellow.700">🥇 Grand Prize</Text>
                                <Text color="gray.600">Trip to Bali</Text>
                            </Flex>
                            <Flex
                                bg="gray.100"
                                borderRadius="10px"
                                p={3}
                                w="100%"
                                justify="space-between"
                                align="center"
                            >
                                <Text fontWeight="bold" color="gray.600">🥈 Second Prize</Text>
                                <Text color="gray.600">Smartphone</Text>
                            </Flex>
                            <Flex
                                bg="orange.50"
                                borderRadius="10px"
                                p={3}
                                w="100%"
                                justify="space-between"
                                align="center"
                            >
                                <Text fontWeight="bold" color="orange.600">🥉 Third Prize</Text>
                                <Text color="gray.600">Gift Vouchers</Text>
                            </Flex>
                        </VStack>
                    </Box>

                    {/* CTA Section */}
                    <Box textAlign="center" w="100%">
                        <Text color="white" mb={4}>
                            Have a QR code? Scan it or enter your code below:
                        </Text>
                        <Button
                            colorScheme="yellow"
                            size="lg"
                            borderRadius="full"
                            px={8}
                            onClick={() => {
                                const code = prompt("Enter your coupon code:");
                                if (code) {
                                    navigate(`/event/coupon/${code}`);
                                }
                            }}
                        >
                            Enter Coupon Code
                        </Button>
                    </Box>

                    {/* Footer */}
                    <Text color="whiteAlpha.700" fontSize="xs" textAlign="center">
                        Terms & Conditions apply. Winners will be announced on our official channels.
                    </Text>
                </VStack>
            </Container>
        </Box>
    );
}

export default LandingPageMaldives;
