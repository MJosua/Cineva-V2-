import { Box, UnorderedList, ListItem } from "@chakra-ui/react";

export default function ListBlock({ items = [], textColor = "rgba(0,0,0,1)", customCss }) {
    const customStyles = customCss ? JSON.parse(customCss) : {};

    return (
        <Box p={4} color={textColor} sx={customStyles}>
            <UnorderedList spacing={2}>
                {items.map((item, i) => (
                    <ListItem key={i}>{item}</ListItem>
                ))}
            </UnorderedList>
        </Box>
    );
}
