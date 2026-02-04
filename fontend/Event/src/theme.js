import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
    },
    colors: {
        brand: {
            50: "#E6FFFA",
            100: "#B2F5EA",
            500: "#319795", // Teal default
            900: "#234E52",
        },
    },
    styles: {
        global: {
            body: {
                bg: "gray.50",
                color: "gray.800",
            },
        },
    },
});

export default theme;
