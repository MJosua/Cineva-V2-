import { Box, Heading, Image } from "@chakra-ui/react";
import { resolveComponent } from "../Registry";
import { resolveMediaUrl } from "../../../utils/mediaHelper";

export default function CardBlock({
    title,
    subtitle,
    imageUrl,
    children,
    bgColor = "rgba(255,255,255,1)",
    titleBgColor = "transparent",
    titleColor,
    subtitleColor,
    textColor,
    margin = "0",
    padding = "6",
    theme,
    customCss
}) {
    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch (e) {
        console.warn("Invalid CSS JSON in CardBlock:", customCss);
    }

    const finalColor = textColor || theme?.color || "#1a1a1a";
    const finalTitleColor = titleColor || finalColor;
    const finalSubtitleColor = subtitleColor || finalColor;

    return (
        <Box
            bg={bgColor}
            color={finalColor}
            p={padding}
            m={margin}
            borderRadius="xl"
            shadow="xl"
            maxW="480px"
            mx="auto"
            sx={customStyles}
            overflow="hidden"
        >
            {imageUrl && <Image src={resolveMediaUrl(imageUrl)} w="100%" borderRadius="md" mb={4} />}

            {(title || subtitle) && (
                <Box mb={4}>
                    {title && (
                        <Box bg={titleBgColor} p={titleBgColor !== 'transparent' ? 3 : 0} borderRadius="md" mb={subtitle ? 1 : 0}>
                            <Heading size="md" color={finalTitleColor}>{title}</Heading>
                        </Box>
                    )}
                    {subtitle && (
                        <Text fontSize="sm" color={finalSubtitleColor} fontWeight="medium">
                            {subtitle}
                        </Text>
                    )}
                </Box>
            )}

            <Box>
                {children && children.map((child, index) => {
                    const Component = resolveComponent(child.type);
                    if (!Component) return null;
                    return (
                        <Component
                            key={child._id || index}
                            {...child.props}
                            theme={theme}
                        />
                    );
                })}
            </Box>
        </Box>
    );
}
