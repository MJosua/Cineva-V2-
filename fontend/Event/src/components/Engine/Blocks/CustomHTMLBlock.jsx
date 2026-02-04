import { Box } from "@chakra-ui/react";

export default function CustomHTMLBlock({ html, customCss }) {
    return (
        <Box
            w="100%"
            sx={customCss ? JSON.parse(customCss) : {}}
            dangerouslySetInnerHTML={{ __html: html || "" }}
        />
    );
}
