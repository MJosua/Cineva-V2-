import { Box } from "@chakra-ui/react";

export default function TextBlock({ content, align = "center", textColor, theme }) {
    const finalColor = textColor || theme?.color || "inherit";
    const normalizedFinalColor = typeof finalColor === "string"
        ? finalColor.replace(/\s/g, "").toLowerCase()
        : "";
    const isWhiteTextColor = [
        "#fff",
        "#ffffff",
        "white",
        "rgb(255,255,255)",
        "rgba(255,255,255,1)"
    ].includes(normalizedFinalColor);
    const whiteTextOutline = {
        textShadow: "0 0 1px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)"
    };

    return (
        <Box
            w="100%"
            p={4}
            textAlign={align}
            color={finalColor}
            textShadow={isWhiteTextColor ? whiteTextOutline.textShadow : undefined}
            dangerouslySetInnerHTML={{ __html: content }}
            sx={{
                "h1, h2, h3": { fontWeight: "bold", marginBottom: "0.5em", color: finalColor },
                "h1": { fontSize: "2xl" },
                "h2": { fontSize: "xl" },
                "h3": { fontSize: "lg" },
                "p": { margin: 0, lineHeight: "inherit" },
                "p + p": { marginTop: "0.35em" },
                "ul, ol": { marginLeft: "1.5em", marginBottom: "1em" },
                "a": { color: "blue.500", textDecoration: "underline" },
                ".ql-align-center": { textAlign: "center" },
                ".ql-align-right": { textAlign: "right" },
                ".ql-align-justify": { textAlign: "justify" },
                ".ql-font-inter": { fontFamily: "Inter, sans-serif" },
                ".ql-font-poppins": { fontFamily: "Poppins, sans-serif" },
                ".ql-font-montserrat": { fontFamily: "Montserrat, sans-serif" },
                ".ql-font-roboto": { fontFamily: "Roboto, sans-serif" },
                ".ql-font-playfair": { fontFamily: "\"Playfair Display\", serif" },
                ".ql-font-bebas": { fontFamily: "\"Bebas Neue\", cursive" },
                ".ql-font-courier": { fontFamily: "\"Courier New\", monospace" },
                ".ql-size-small": { fontSize: "0.75em" },
                ".ql-size-large": { fontSize: "1.5em" },
                ".ql-size-huge": { fontSize: "2.5em" },
                ".ql-lineheight-100": { lineHeight: "1" },
                ".ql-lineheight-120": { lineHeight: "1.2" },
                ".ql-lineheight-140": { lineHeight: "1.4" },
                ".ql-lineheight-160": { lineHeight: "1.6" },
                ".ql-lineheight-180": { lineHeight: "1.8" },
                ".ql-lineheight-200": { lineHeight: "2" },
                ".ql-stroke-soft": {
                    WebkitTextStroke: "0.5px rgba(0,0,0,0.85)",
                    textShadow: "0 0 1px rgba(0,0,0,0.65)"
                },
                ".ql-stroke-medium": {
                    WebkitTextStroke: "1px rgba(0,0,0,0.9)",
                    textShadow: "0 0 1px rgba(0,0,0,0.75)"
                },
                ".ql-stroke-strong": {
                    WebkitTextStroke: "1.5px rgba(0,0,0,0.95)",
                    textShadow: "0 0 2px rgba(0,0,0,0.8)"
                },
                "span[style*='color: rgb(255, 255, 255)']": whiteTextOutline,
                "span[style*='color:#fff']": whiteTextOutline,
                "span[style*='color: #fff']": whiteTextOutline,
                "span[style*='color: white']": whiteTextOutline
            }}
        />
    );
}
