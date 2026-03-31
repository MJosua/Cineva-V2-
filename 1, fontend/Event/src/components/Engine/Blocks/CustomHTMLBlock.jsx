import { Box } from "@chakra-ui/react";
import { useMemo } from "react";

export default function CustomHTMLBlock({ html, customCss }) {
    const safeStyles = useMemo(() => {
        if (!customCss) return {};
        try {
            return typeof customCss === 'string' ? JSON.parse(customCss) : customCss;
        } catch (e) {
            console.error("CustomHTMLBlock: Invalid JSON in customCss", e);
            return {};
        }
    }, [customCss]);

    return (
        <Box
            w="100%"
            sx={safeStyles}
            dangerouslySetInnerHTML={{ __html: html || "" }}
        />
    );
}
