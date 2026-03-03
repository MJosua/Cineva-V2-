import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
    fonts: {
        heading: "Inter, sans-serif",
        body: "Inter, sans-serif",
    },
    colors: {
        brand: {
            50: "#eff6ff", // tailwind blue-50
            100: "#dbeafe",
            500: "#3b82f6", // tailwind blue-500
            600: "#2563eb",
            900: "#1e3a8a",
        },
        indigo: {
            50: "#eef2ff",
            100: "#e0e7ff",
            200: "#c7d2fe",
            300: "#a5b4fc",
            400: "#818cf8",
            500: "#6366f1",
            600: "#4f46e5",
            700: "#4338ca",
            800: "#3730a3",
            900: "#312e81",
        }
    },
    styles: {
        global: {
            body: {
                bgGradient: "linear(to-br, brand.50, indigo.100)",
                color: "gray.800",
            },
        },
    },
});

export default theme;
