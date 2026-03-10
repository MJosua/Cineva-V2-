import { Box, Image, Heading, Text, VStack } from "@chakra-ui/react";
import { resolveMediaUrl } from "../../../utils/mediaHelper";

export default function HeroBlock({
    imageUrl,
    title,
    subtitle,
    titleColor,
    textColor,
    bgColor,
    margin,
    padding = "10",
    imageWidth = "auto",
    imageHeight = "150px",
    theme
}) {
    const finalTitleColor = titleColor || theme?.color || "white";
    const finalSubColor = textColor || theme?.color || "white";

    return (
        <VStack
            spacing={4}
            m={margin}
            p={padding}
            bg={bgColor || "transparent"}
            w="100%"
            align="center"
        >
            {imageUrl && (
                <Image
                    src={resolveMediaUrl(imageUrl)}
                    maxH={imageHeight}
                    w={imageWidth}
                    fallbackSrc="https://via.placeholder.com/150"
                    alt="Hero"
                />
            )}
            <Heading
                color={finalTitleColor}
                textShadow="0 2px 4px rgba(0,0,0,0.5)"
                textAlign="center"
            >
                {title}
            </Heading>
            <Text
                color={finalSubColor}
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
            >
                {subtitle}
            </Text>
        </VStack>
    );
}
