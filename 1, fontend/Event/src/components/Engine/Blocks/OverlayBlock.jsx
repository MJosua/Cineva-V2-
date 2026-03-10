import { Box, Image, Icon } from "@chakra-ui/react";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { motion } from "framer-motion";
import { MdDragIndicator } from "react-icons/md";
import { useRef, useState, useEffect } from "react";

/**
 * OverlayBlock allows absolute positioning of assets (images) 
 * over other blocks within a container or globally.
 */
export default function OverlayBlock({
    imageUrl = "",
    top = "auto",
    left = "auto",
    right = "auto",
    bottom = "auto",
    width = "auto",
    maxWidth = "200px",
    zIndex = "10",
    opacity = "1",
    customCss = "",
    isEditor = false,
    onPropsChange,
    parentRef
}) {
    const containerRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);

    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch (e) {
        console.warn("Invalid CSS JSON in OverlayBlock:", customCss);
    }

    // Stability: If in editor, force a coordinate if it's 'auto' so drag math works immediately
    // Instead of snapping to 0,0, we calculate where it is CURRENTLY relative to parent
    useEffect(() => {
        if (isEditor && onPropsChange && parentRef?.current && containerRef.current) {
            if (top === 'auto' || left === 'auto') {
                const childRect = containerRef.current.getBoundingClientRect();
                const parentRect = parentRef.current.getBoundingClientRect();

                const relativeTop = childRect.top - parentRect.top;
                const relativeLeft = childRect.left - parentRect.left;

                onPropsChange({
                    top: top === 'auto' ? `${Math.round(relativeTop)}px` : top,
                    left: left === 'auto' ? `${Math.round(relativeLeft)}px` : left,
                    right: "auto",
                    bottom: "auto"
                });
            }
        }
    }, [isEditor, top, left, onPropsChange, parentRef]);

    if (!imageUrl) return null;

    const handleDragEnd = (event, info) => {
        if (!isEditor || !onPropsChange || !parentRef?.current) return;

        // Get the bounding box of the child element (using the ref)
        const childRect = containerRef.current.getBoundingClientRect();
        // Get the bounding box of the parent container
        const parentRect = parentRef.current.getBoundingClientRect();

        // Calculate the relative position from the top-left of the parent
        const relativeTop = childRect.top - parentRect.top;
        const relativeLeft = childRect.left - parentRect.left;

        // Update the source props with the final calculated pixel values
        onPropsChange({
            top: `${Math.round(relativeTop)}px`,
            left: `${Math.round(relativeLeft)}px`,
            right: "auto",
            bottom: "auto"
        });
    };

    const handleResize = (e) => {
        if (!isEditor || !onPropsChange) return;
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = containerRef.current.offsetWidth;

        const onMouseMove = (moveEvent) => {
            const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX));
            onPropsChange({ width: `${newWidth}px`, maxWidth: "none" });
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            setIsResizing(false);
        };

        setIsResizing(true);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    return (
        <Box
            as={isEditor ? motion.div : "div"}
            ref={containerRef}
            drag={isEditor && !isResizing}
            dragConstraints={parentRef}
            dragMomentum={false}
            dragElastic={0}
            onDragEnd={handleDragEnd}
            position="absolute"
            top={top}
            left={left}
            right={right}
            bottom={bottom}
            width={width}
            maxW={maxWidth}
            zIndex={zIndex}
            opacity={opacity}
            style={{
                ...customStyles,
                cursor: isEditor ? (isResizing ? "nwse-resize" : "grab") : "default"
            }}
            _active={{ cursor: isEditor ? "grabbing" : "default" }}
            pointerEvents={isEditor ? "auto" : "none"}
            border={isEditor ? "1px dashed rgba(66, 153, 225, 0.4)" : "none"}
            _hover={{ border: isEditor ? "1px solid #4299E1" : "none" }}
        >
            {isEditor && (
                <Box
                    position="absolute"
                    top="-18px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="blue.500"
                    color="white"
                    px={1}
                    borderRadius="sm"
                    fontSize="9px"
                    fontWeight="bold"
                    zIndex={20}
                    pointerEvents="none"
                    whiteSpace="nowrap"
                >
                    OVERLAY
                </Box>
            )}

            <Image
                src={resolveMediaUrl(imageUrl)}
                alt="Overlay Asset"
                w="100%"
                objectFit="contain"
                draggable={false}
            />

            {isEditor && (
                <Box
                    position="absolute"
                    bottom="-4px"
                    right="-4px"
                    w="12px"
                    h="12px"
                    bg="blue.500"
                    cursor="nwse-resize"
                    borderRadius="sm"
                    onMouseDown={handleResize}
                    zIndex={30}
                    _hover={{ transform: "scale(1.2)" }}
                />
            )}
        </Box>
    );
}
