import { Box } from "@chakra-ui/react";

export default function TextBlock({ content, align = "center" }) {
    return (
        <Box
            w="100%"
            p={4}
            textAlign={align}
            dangerouslySetInnerHTML={{ __html: content }}
            sx={{
                'h1, h2, h3': { fontWeight: 'bold', marginBottom: '0.5em' },
                'h1': { fontSize: '2xl' },
                'h2': { fontSize: 'xl' },
                'h3': { fontSize: 'lg' },
                'p': { marginBottom: '1em' },
                'ul, ol': { marginLeft: '1.5em', marginBottom: '1em' },
                'a': { color: 'blue.500', textDecoration: 'underline' }
            }}
        />
    );
}
