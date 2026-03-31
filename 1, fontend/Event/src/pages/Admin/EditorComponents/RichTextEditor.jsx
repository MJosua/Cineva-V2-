import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Box, HStack, Input, Select, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

const Quill = ReactQuill.Quill;
const Parchment = Quill.import("parchment");
const Font = Quill.import("formats/font");
const FONT_VALUES = [
    { value: "", label: "Default" },
    { value: "inter", label: "Inter" },
    { value: "poppins", label: "Poppins" },
    { value: "montserrat", label: "Montserrat" },
    { value: "roboto", label: "Roboto" },
    { value: "playfair", label: "Playfair" },
    { value: "bebas", label: "Bebas" },
    { value: "courier", label: "Courier" }
];
const STROKE_VALUES = ["none", "soft", "medium", "strong"];
const SIZE_MIN = 1;
const SIZE_MAX = 100;
const LINE_HEIGHT_MIN = 0.1;
const LINE_HEIGHT_MAX = 3;

Font.whitelist = FONT_VALUES.map((font) => font.value).filter(Boolean);

const SizeStyle = new Parchment.Attributor.Style("size", "font-size", {
    scope: Parchment.Scope.INLINE
});
const LineHeightStyle = new Parchment.Attributor.Style("lineheight", "line-height", {
    scope: Parchment.Scope.BLOCK
});
const StrokeClass = new Parchment.Attributor.Class("stroke", "ql-stroke", {
    scope: Parchment.Scope.INLINE,
    whitelist: STROKE_VALUES
});

Quill.register(Font, true);
Quill.register(SizeStyle, true);
Quill.register(LineHeightStyle, true);
Quill.register(StrokeClass, true);

function clampNumber(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
}

export default function RichTextEditor({ value, onChange }) {
    const quillRef = useRef(null);
    const lastRangeRef = useRef(null);
    const [fontValue, setFontValue] = useState("");
    const [fontSizePx, setFontSizePx] = useState(16);
    const [lineHeightValue, setLineHeightValue] = useState(1.4);
    const [strokeValue, setStrokeValue] = useState("none");

    const applyFormat = (fn) => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return;
        const range = editor.getSelection() || lastRangeRef.current;
        if (range) {
            editor.setSelection(range, "silent");
        }
        fn(editor);
        editor.focus();
    };

    const handleFontChange = (nextFont) => {
        setFontValue(nextFont);
        applyFormat((editor) => {
            editor.format("font", nextFont || false);
        });
    };

    const handleFontSizeChange = (nextSizeRaw) => {
        const nextSize = clampNumber(nextSizeRaw, SIZE_MIN, SIZE_MAX, 16);
        setFontSizePx(nextSize);
        applyFormat((editor) => {
            editor.format("size", `${nextSize}px`);
        });
    };

    const handleLineHeightChange = (nextLineHeightRaw) => {
        const nextLineHeight = clampNumber(nextLineHeightRaw, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX, 1.4);
        const rounded = Number(nextLineHeight.toFixed(1));
        setLineHeightValue(rounded);
        applyFormat((editor) => {
            editor.format("lineheight", String(rounded));
        });
    };

    const handleStrokeChange = (nextStroke) => {
        setStrokeValue(nextStroke);
        applyFormat((editor) => {
            editor.format("stroke", nextStroke === "none" ? false : nextStroke);
        });
    };

    useEffect(() => {
        const editor = quillRef.current?.getEditor();
        if (!editor) return undefined;

        const syncUiFromSelection = (range) => {
            if (range) {
                lastRangeRef.current = range;
            }
            const activeRange = range || editor.getSelection() || lastRangeRef.current || { index: 0, length: 0 };
            const formats = editor.getFormat(activeRange);

            setFontValue(typeof formats.font === "string" ? formats.font : "");

            const sizeRaw = typeof formats.size === "string" ? parseFloat(formats.size) : NaN;
            setFontSizePx(Number.isFinite(sizeRaw) ? clampNumber(sizeRaw, SIZE_MIN, SIZE_MAX, 16) : 16);

            const lhRaw = formats.lineheight != null ? parseFloat(String(formats.lineheight)) : NaN;
            setLineHeightValue(Number.isFinite(lhRaw) ? clampNumber(lhRaw, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX, 1.4) : 1.4);

            setStrokeValue(typeof formats.stroke === "string" ? formats.stroke : "none");
        };

        const textChangeHandler = () => syncUiFromSelection(editor.getSelection());
        editor.on("selection-change", syncUiFromSelection);
        editor.on("text-change", textChangeHandler);
        syncUiFromSelection(editor.getSelection());

        return () => {
            editor.off("selection-change", syncUiFromSelection);
            editor.off("text-change", textChangeHandler);
        };
    }, []);

    return (
        <Box
            sx={{
                ".ql-toolbar": { borderTopRadius: "md", borderColor: "gray.300" },
                ".ql-container": { minHeight: "150px", fontSize: "14px", borderBottomRadius: "md", borderColor: "gray.300" },
                ".ql-editor": {
                    minHeight: "150px",
                    background: "#d1d5db",
                    color: "#111827",
                    lineHeight: "1.4"
                },
                ".ql-editor.ql-blank::before": {
                    color: "#4b5563",
                    fontStyle: "normal"
                },
                ".ql-editor p": { margin: "0", lineHeight: "inherit" },
                ".ql-editor p + p": { marginTop: "0.35em" },
                ".ql-editor h1, .ql-editor h2, .ql-editor h3": { margin: "0.25em 0" },
                ".ql-font-inter": { fontFamily: "Inter, sans-serif" },
                ".ql-font-poppins": { fontFamily: "Poppins, sans-serif" },
                ".ql-font-montserrat": { fontFamily: "Montserrat, sans-serif" },
                ".ql-font-roboto": { fontFamily: "Roboto, sans-serif" },
                ".ql-font-playfair": { fontFamily: "\"Playfair Display\", serif" },
                ".ql-font-bebas": { fontFamily: "\"Bebas Neue\", cursive" },
                ".ql-font-courier": { fontFamily: "\"Courier New\", monospace" },
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
                ".ql-toolbar button": { marginRight: "2px" }
            }}
        >
            <HStack spacing={2} mb={2} flexWrap="wrap" align="center">
                <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.600">Font</Text>
                    <Select size="xs" w="120px" value={fontValue} onChange={(e) => handleFontChange(e.target.value)}>
                        {FONT_VALUES.map((font) => (
                            <option key={font.value || "default"} value={font.value}>{font.label}</option>
                        ))}
                    </Select>
                </HStack>
                <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.600">Size px</Text>
                    <Input
                        size="xs"
                        type="range"
                        w="120px"
                        min={SIZE_MIN}
                        max={SIZE_MAX}
                        step="1"
                        value={fontSizePx}
                        onChange={(e) => handleFontSizeChange(e.target.value)}
                    />
                    <Text fontSize="xs" color="gray.600" minW="42px" textAlign="right">{Math.round(fontSizePx)}px</Text>
                </HStack>
                <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.600">LH</Text>
                    <Input
                        size="xs"
                        type="range"
                        w="120px"
                        min={LINE_HEIGHT_MIN}
                        max={LINE_HEIGHT_MAX}
                        step="0.1"
                        value={lineHeightValue}
                        onChange={(e) => handleLineHeightChange(e.target.value)}
                    />
                    <Text fontSize="xs" color="gray.600" minW="32px" textAlign="right">{lineHeightValue.toFixed(1)}</Text>
                </HStack>
                <HStack spacing={1}>
                    <Text fontSize="xs" color="gray.600">Stroke</Text>
                    <Select size="xs" w="108px" value={strokeValue} onChange={(e) => handleStrokeChange(e.target.value)}>
                        <option value="none">Off</option>
                        <option value="soft">Soft</option>
                        <option value="medium">Medium</option>
                        <option value="strong">Strong</option>
                    </Select>
                </HStack>
            </HStack>
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={{
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline"],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"]
                    ]
                }}
                formats={[
                    "header",
                    "font",
                    "size",
                    "lineheight",
                    "stroke",
                    "bold",
                    "italic",
                    "underline",
                    "color",
                    "background",
                    "align",
                    "list",
                    "bullet",
                    "link"
                ]}
            />
        </Box>
    );
}
