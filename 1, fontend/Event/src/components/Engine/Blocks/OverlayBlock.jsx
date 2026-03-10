import { Box, Image } from "@chakra-ui/react";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { useRef, useState, useEffect } from "react";
import { useDraggable } from '@dnd-kit/core';

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
    parentRef,
    parentSectionIndex,
    childIndex,
    _id,
    isDragOverlay = false
}) {
    const containerRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const resizeCleanupRef = useRef(null);

    let customStyles = {};
    try {
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch {
        console.warn("Invalid CSS JSON in OverlayBlock:", customCss);
    }

    // Ensure every overlay can register with dnd-kit, even if legacy data has no _id yet.
    const draggableId = _id || `overlay-${parentSectionIndex}-${childIndex}`;

    // Stability: If in editor, force a coordinate if it's 'auto' so drag math works immediately
    useEffect(() => {
        if (isEditor && onPropsChange && parentRef?.current && containerRef.current && !isDragOverlay) {
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
    }, [isEditor, top, left, onPropsChange, parentRef, isDragOverlay]);

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: draggableId,
        disabled: !isEditor || isResizing || isDragOverlay,
    });

    const handleResize = (e) => {
        if (!isEditor || !onPropsChange || isDragOverlay) return;
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = containerRef.current.offsetWidth;
        const pointerId = e.pointerId;

        const cleanup = () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
            resizeCleanupRef.current = null;
            setIsResizing(false);
        };

        const onPointerMove = (moveEvent) => {
            if (moveEvent.pointerId !== pointerId) return;
            const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX));
            onPropsChange({ width: `${newWidth}px`, maxWidth: "none" });
        };

        const onPointerUp = (upEvent) => {
            if (upEvent.pointerId !== pointerId) return;
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
    };

    useEffect(() => {
        return () => {
            if (resizeCleanupRef.current) {
                resizeCleanupRef.current();
            }
        };
    }, []);

    const handleResizePointerDownCapture = (e) => {
        e.stopPropagation();
    };

    if (!imageUrl) return null;

    // When in DragOverlay, we don't want absolute positioning or top/left
    // because the DragOverlay provider handles the transform/positioning for us.
    const overlayStyles = isDragOverlay ? {
        width: width,
        maxW: maxWidth,
        zIndex: 999999,
        opacity: opacity,
        position: 'relative',
        cursor: 'grabbing',
        ...customStyles
    } : {
        position: "absolute",
        top: top,
        left: left,
        right: right,
        bottom: bottom,
        width: width,
        maxW: maxWidth,
        zIndex: zIndex,
        opacity: isDragging ? 0 : opacity,
        ...customStyles
    };

    return (
        <Box
            ref={(node) => {
                if (!isDragOverlay) {
                    setNodeRef(node);
                }
                containerRef.current = node;
            }}
            {...(!isDragOverlay ? attributes : {})}
            {...(!isDragOverlay ? listeners : {})}
            {...overlayStyles}
            transition={isDragging ? "none" : "all 0.1s"}
            style={{
                ...overlayStyles.style,
                cursor: isEditor && !isDragOverlay ? (isResizing ? "nwse-resize" : (isDragging ? "grabbing" : "grab")) : overlayStyles.cursor,
                touchAction: "none"
            }}
            _active={{ cursor: isEditor ? "grabbing" : "default" }}
            pointerEvents={isEditor ? "auto" : "none"}
            border={isEditor && !isDragging && !isDragOverlay ? "1px dashed rgba(66, 153, 225, 0.4)" : "none"}
            _hover={{ border: isEditor && !isDragging && !isDragOverlay ? "1px solid #4299E1" : "none" }}
            boxShadow={isDragOverlay ? "2xl" : "none"}
        >
            {isEditor && !isDragging && !isDragOverlay && (
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

            {isDragOverlay && (
                <Box
                    position="absolute"
                    top="-18px"
                    left="50%"
                    transform="translateX(-50%)"
                    bg="orange.500"
                    color="white"
                    px={1}
                    borderRadius="sm"
                    fontSize="9px"
                    fontWeight="bold"
                    zIndex={20}
                    pointerEvents="none"
                    whiteSpace="nowrap"
                >
                    DRAGGING...
                </Box>
            )}

            <Image
                src={resolveMediaUrl(imageUrl)}
                alt="Overlay Asset"
                w="100%"
                objectFit="contain"
                draggable={false}
            />

            {isEditor && !isDragging && !isDragOverlay && (
                <Box
                    position="absolute"
                    bottom="-4px"
                    right="-4px"
                    w="12px"
                    h="12px"
                    bg="blue.500"
                    cursor="nwse-resize"
                    borderRadius="sm"
                    onPointerDown={handleResize}
                    zIndex={30}
                    _hover={{ transform: "scale(1.2)" }}
                    onPointerDownCapture={handleResizePointerDownCapture}
                />
            )}
        </Box>
    );
}
