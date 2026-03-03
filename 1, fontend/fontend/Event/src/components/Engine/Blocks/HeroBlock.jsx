import { Box, Image, Heading, Text, VStack } from "@chakra-ui/react";

export default function HeroBlock({ imageUrl, title, subtitle, theme }) {
    const textColor = theme?.color || "white";
    return (
        <VStack spacing={4} py={10}>
            {imageUrl && <Image src={imageUrl} maxH="150px" fallbackSrc="https://via.placeholder.com/150" />}
            <Heading color={textColor} textShadow="0 2px 4px rgba(0,0,0,0.5)">{title}</Heading>
            <Text color={textColor} fontSize="xl" fontWeight="bold">{subtitle}</Text>
        </VStack>
    );
}
