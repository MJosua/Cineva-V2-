import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { BREAKPOINTS } from "../responsiveLayout";

export default function TextOverlayBlock({
    content = "<p>Text Overlay</p>",
    top = "auto",
    left = "auto",
    right = "auto",
    bottom = "auto",
    width = "260px",
    height = "140px",
    maxWidth = "none",
    maxHeight = "none",
    zIndex = "11",
    opacity = "1",
    translateX = "",
    translateY = "",
    textColor = "inherit",
    customCss = "",
    isEditor = false,
    onPropsChange,
    onSelectBlock,
    parentRef,
    parentSectionIndex,
    childIndex,
    _id,
    isDragOverlay = false,
    editorScale = 1,
    currentViewport = BREAKPOINTS.desktop
}) {
    const containerRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const resizeCleanupRef = useRef(null);

    let customStyles = {};
    try {
        if (customCss && typeof customCss === "string") {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === "object" && customCss !== null) {
            customStyles = customCss;
        }
    } catch {
        console.warn("Invalid CSS JSON in TextOverlayBlock:", customCss);
    }
    const { opacity: _customCssOpacity, ...customStylesWithoutOpacity } = customStyles;

    const draggableId = _id || `text-overlay-${parentSectionIndex}-${childIndex}`;

    useEffect(() => {
        if (isEditor && onPropsChange && parentRef?.current && containerRef.current && !isDragOverlay) {
            if (top === "auto" || left === "auto") {
                const safeScale = editorScale > 0 ? editorScale : 1;
                const childRect = containerRef.current.getBoundingClientRect();
                const parentRect = parentRef.current.getBoundingClientRect();

                const relativeTop = (childRect.top - parentRect.top) / safeScale;
                const relativeLeft = (childRect.left - parentRect.left) / safeScale;

                onPropsChange({
                    top: top === "auto" ? `${Math.round(relativeTop)}px` : top,
                    left: left === "auto" ? `${Math.round(relativeLeft)}px` : left,
                    right: "auto",
                    bottom: "auto"
                });
            }
        }
    }, [isEditor, onPropsChange, parentRef, top, left, editorScale, isDragOverlay]);

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: draggableId,
        disabled: !isEditor || isResizing || isDragOverlay
    });

    const handleResize = (e) => {
        if (!isEditor || !onPropsChange || isDragOverlay) return;
        e.preventDefault();
        e.stopPropagation();

        const safeScale = editorScale > 0 ? editorScale : 1;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = containerRef.current.offsetWidth;
        const startHeight = containerRef.current.offsetHeight || 1;
        const pointerId = e.pointerId;
        const resizeHandle = e.currentTarget;

        if (resizeHandle?.setPointerCapture) {
            try {
                resizeHandle.setPointerCapture(pointerId);
            } catch {
                // no-op
            }
        }

        const cleanup = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            if (resizeHandle?.releasePointerCapture) {
                try {
                    resizeHandle.releasePointerCapture(pointerId);
                } catch {
                    // no-op
                }
            }
            resizeCleanupRef.current = null;
            setIsResizing(false);
        };

        const applyResize = (clientX, clientY) => {
            const deltaX = (clientX - startX) / safeScale;
            const deltaY = (clientY - startY) / safeScale;

            let nextWidth = Math.max(40, startWidth + deltaX);
            let nextHeight = Math.max(24, startHeight + deltaY);

            if (parentRef?.current && containerRef.current) {
                const parentRect = parentRef.current.getBoundingClientRect();
                const nodeRect = containerRef.current.getBoundingClientRect();
                const offsetLeft = Math.max(0, (nodeRect.left - parentRect.left) / safeScale);
                const offsetTop = Math.max(0, (nodeRect.top - parentRect.top) / safeScale);
                const maxAllowedWidth = Math.max(40, (parentRect.width / safeScale) - offsetLeft);
                const maxAllowedHeight = Math.max(24, (parentRect.height / safeScale) - offsetTop);

                nextWidth = Math.min(nextWidth, maxAllowedWidth);
                nextHeight = Math.min(nextHeight, maxAllowedHeight);
            }

            onPropsChange({
                width: `${Math.round(nextWidth)}px`,
                height: `${Math.round(nextHeight)}px`,
                maxWidth: "none",
                maxHeight: "none"
            });
        };

        const onPointerMove = (moveEvent) => {
            if (typeof pointerId === "number" && moveEvent.pointerId !== pointerId) return;
            applyResize(moveEvent.clientX, moveEvent.clientY);
        };

        const onPointerUp = (upEvent) => {
            if (typeof pointerId === "number" && upEvent.pointerId !== pointerId) return;
            cleanup();
        };

        const onMouseMove = (moveEvent) => {
            applyResize(moveEvent.clientX, moveEvent.clientY);
        };

        const onMouseUp = () => {
            cleanup();
        };

        if (resizeCleanupRef.current) {
            resizeCleanupRef.current();
        }

        setIsResizing(true);
        resizeCleanupRef.current = cleanup;
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    useEffect(() => {
        return () => {
            if (resizeCleanupRef.current) {
                resizeCleanupRef.current();
            }
        };
    }, []);

    if (!content && !isEditor) return null;

    const toPxNumber = (value) => {
        if (typeof value === "number") return value;
        if (typeof value !== "string") return null;
        const trimmed = value.trim();
        if (!trimmed.toLowerCase().endsWith("px")) return null;
        const numeric = parseFloat(trimmed);
        return Number.isFinite(numeric) ? numeric : null;
    };

    const toScaledPercent = (value, designWidth) => {
        const px = toPxNumber(value);
        if (px === null || !designWidth) return value;
        return `${(px / designWidth) * 100}%`;
    };

    const mobileTabletRuntime = !isEditor
        && !isDragOverlay
        && (currentViewport === BREAKPOINTS.mobile || currentViewport === BREAKPOINTS.tablet);
    const designWidth = currentViewport === BREAKPOINTS.mobile ? 390 : 768;
    const runtimeLeft = mobileTabletRuntime ? toScaledPercent(left, designWidth) : left;
    const runtimeRight = mobileTabletRuntime ? toScaledPercent(right, designWidth) : right;
    const runtimeWidth = mobileTabletRuntime ? toScaledPercent(width, designWidth) : width;
    const runtimeMaxWidth = mobileTabletRuntime ? toScaledPercent(maxWidth, designWidth) : maxWidth;

    const blockStyles = isDragOverlay ? {
        position: "relative",
        width,
        height,
        maxW: maxWidth,
        maxH: maxHeight,
        zIndex: 999999,
        opacity
    } : {
        position: "absolute",
        top,
        left: runtimeLeft,
        right: runtimeRight,
        bottom,
        width: runtimeWidth,
        height,
        maxW: runtimeMaxWidth,
        maxH: maxHeight,
        zIndex,
        opacity: isDragging ? 0 : opacity
    };
    const normalizedTextColor = typeof textColor === "string"
        ? textColor.replace(/\s/g, "").toLowerCase()
        : "";
    const isWhiteTextColor = [
        "#fff",
        "#ffffff",
        "white",
        "rgb(255,255,255)",
        "rgba(255,255,255,1)"
    ].includes(normalizedTextColor);
    const whiteTextOutline = {
        textShadow: "0 0 1px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.8)"
    };

    const transformParts = [];
    if (translateX) transformParts.push(`translateX(${translateX})`);
    if (translateY) transformParts.push(`translateY(${translateY})`);
    const transformStr = transformParts.length > 0 ? transformParts.join(' ') : undefined;

    return (
        <Box
            ref={(node) => {
                if (!isDragOverlay) {
                    setNodeRef(node);
                }
                containerRef.current = node;
            }}
            {...blockStyles}
            pointerEvents={isEditor ? "auto" : "none"}
            onPointerDown={(e) => {
                if (isEditor && !isDragOverlay && onSelectBlock) {
                    onSelectBlock(_id || draggableId);
                    e.stopPropagation();
                }
            }}
            border={isEditor && !isDragging && !isDragOverlay ? "1px dashed rgba(66, 153, 225, 0.45)" : "none"}
            _hover={{ border: isEditor && !isDragging && !isDragOverlay ? "1px solid #4299E1" : "none" }}
            boxShadow={isDragOverlay ? "2xl" : "none"}
            sx={customStylesWithoutOpacity}
            style={{
                touchAction: "none",
                ...(transformStr ? { transform: transformStr } : {})
            }}
        >
            {isEditor && !isDragging && !isDragOverlay && (
                <Box
                    position="absolute"
                    top="-18px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="teal.500"
                    color="white"
                    px={1}
                    borderRadius="sm"
                    fontSize="9px"
                    fontWeight="bold"
                    zIndex={20}
                    pointerEvents="none"
                    whiteSpace="nowrap"
                >
                    TEXT OVERLAY
                </Box>
            )}

            <Box
                {...(!isDragOverlay ? attributes : {})}
                {...(!isDragOverlay ? listeners : {})}
                cursor={isEditor && !isDragOverlay ? (isDragging ? "grabbing" : "grab") : "default"}
                userSelect="none"
                touchAction="none"
                w="100%"
                h={height && height !== "auto" ? "100%" : "auto"}
                minH="24px"
                overflow="hidden"
                color={textColor}
                textShadow={isWhiteTextColor ? whiteTextOutline.textShadow : undefined}
                p={1}
                dangerouslySetInnerHTML={{ __html: content || "<p>Text Overlay</p>" }}
                sx={{
                    "p": { margin: 0, lineHeight: "inherit" },
                    "p + p": { marginTop: "0.35em" },
                    "h1, h2, h3": { fontWeight: "bold", marginBottom: "0.5em" },
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

            {isEditor && !isDragging && !isDragOverlay && (
                <Box
                    position="absolute"
                    bottom="-4px"
                    right="-4px"
                    w="12px"
                    h="12px"
                    bg="teal.500"
                    border="1px solid #fff"
                    cursor="nwse-resize"
                    borderRadius="sm"
                    onPointerDown={handleResize}
                    onMouseDown={handleResize}
                    zIndex={30}
                    _hover={{ transform: "scale(1.2)" }}
                    touchAction="none"
                />
            )}
        </Box>
    );
}
