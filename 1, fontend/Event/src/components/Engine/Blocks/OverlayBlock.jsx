import { Box, Image } from "@chakra-ui/react";
import { resolveMediaUrl } from "../../../utils/mediaHelper";
import { useRef, useState, useEffect } from "react";
import { useDraggable } from '@dnd-kit/core';
import { BREAKPOINTS } from "../responsiveLayout";

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
    height = "auto",
    maxWidth = "200px",
    maxHeight = "none",
    zIndex = "10",
    opacity = "1",
    translateX = "",
    translateY = "",
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
        if (customCss && typeof customCss === 'string') {
            customStyles = JSON.parse(customCss);
        } else if (typeof customCss === 'object' && customCss !== null) {
            customStyles = customCss;
        }
    } catch {
        console.warn("Invalid CSS JSON in OverlayBlock:", customCss);
    }
    const { opacity: _customCssOpacity, ...customStylesWithoutOpacity } = customStyles;

    // Ensure every overlay can register with dnd-kit, even if legacy data has no _id yet.
    const draggableId = _id || `overlay-${parentSectionIndex}-${childIndex}`;

    // Stability: If in editor, force a coordinate if it's 'auto' so drag math works immediately
    useEffect(() => {
        if (isEditor && onPropsChange && parentRef?.current && containerRef.current && !isDragOverlay) {
            if (top === 'auto' || left === 'auto') {
                const safeScale = editorScale > 0 ? editorScale : 1;
                const childRect = containerRef.current.getBoundingClientRect();
                const parentRect = parentRef.current.getBoundingClientRect();

                const relativeTop = (childRect.top - parentRect.top) / safeScale;
                const relativeLeft = (childRect.left - parentRect.left) / safeScale;

                onPropsChange({
                    top: top === 'auto' ? `${Math.round(relativeTop)}px` : top,
                    left: left === 'auto' ? `${Math.round(relativeLeft)}px` : left,
                    right: "auto",
                    bottom: "auto"
                });
            }
        }
    }, [isEditor, top, left, onPropsChange, parentRef, isDragOverlay, editorScale]);

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: draggableId,
        disabled: !isEditor || isResizing || isDragOverlay,
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
        const aspectRatio = startWidth / Math.max(startHeight, 1);
        const pointerId = e.pointerId;
        const resizeHandle = e.currentTarget;

        if (resizeHandle?.setPointerCapture) {
            try {
                resizeHandle.setPointerCapture(pointerId);
            } catch {
                // no-op; capture can fail in some browsers
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

        const applyResize = (clientX, clientY, freeResize) => {
            const deltaX = (clientX - startX) / safeScale;
            const deltaY = (clientY - startY) / safeScale;

            const dominantDelta = Math.abs(deltaX) >= Math.abs(deltaY)
                ? deltaX
                : (deltaY * aspectRatio);

            let nextWidth = Math.max(20, startWidth + (freeResize ? deltaX : dominantDelta));
            let nextHeight = freeResize
                ? Math.max(20, startHeight + deltaY)
                : Math.max(20, nextWidth / Math.max(aspectRatio, 0.0001));

            if (parentRef?.current && containerRef.current) {
                const parentRect = parentRef.current.getBoundingClientRect();
                const nodeRect = containerRef.current.getBoundingClientRect();
                const offsetLeft = Math.max(0, (nodeRect.left - parentRect.left) / safeScale);
                const offsetTop = Math.max(0, (nodeRect.top - parentRect.top) / safeScale);
                const maxAllowedWidth = Math.max(20, (parentRect.width / safeScale) - offsetLeft);
                const maxAllowedHeight = Math.max(20, (parentRect.height / safeScale) - offsetTop);

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
            applyResize(moveEvent.clientX, moveEvent.clientY, !!moveEvent.shiftKey);
        };

        const onPointerUp = (upEvent) => {
            if (typeof pointerId === "number" && upEvent.pointerId !== pointerId) return;
            cleanup();
        };

        const onMouseMove = (moveEvent) => {
            applyResize(moveEvent.clientX, moveEvent.clientY, !!moveEvent.shiftKey);
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

    const handleResizePointerDownCapture = (e) => {
        e.stopPropagation();
    };

    if (!imageUrl) return null;

    // When in DragOverlay, we don't want absolute positioning or top/left
    // because the DragOverlay provider handles the transform/positioning for us.
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

    const overlayStyles = isDragOverlay ? {
        ...customStylesWithoutOpacity,
        width: width,
        height: height,
        maxW: maxWidth,
        maxH: maxHeight,
        zIndex: 999999,
        opacity: opacity,
        position: 'relative',
        cursor: 'grabbing'
    } : {
        ...customStylesWithoutOpacity,
        position: "absolute",
        top: top,
        left: runtimeLeft,
        right: runtimeRight,
        bottom: bottom,
        width: runtimeWidth,
        height: height,
        maxW: runtimeMaxWidth,
        maxH: maxHeight,
        zIndex: zIndex,
        opacity: isDragging ? 0 : opacity
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
            {...overlayStyles}
            transition={isDragging ? "none" : "all 0.1s"}
            style={{
                ...overlayStyles.style,
                touchAction: "none",
                ...(transformStr ? { transform: transformStr } : {})
            }}
            pointerEvents={isEditor ? "auto" : "none"}
            onPointerDown={(e) => {
                if (isEditor && !isDragOverlay && onSelectBlock) {
                    onSelectBlock(_id || draggableId);
                    e.stopPropagation();
                }
            }}
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

            <Box
                {...(!isDragOverlay ? attributes : {})}
                {...(!isDragOverlay ? listeners : {})}
                cursor={isEditor && !isDragOverlay ? (isDragging ? "grabbing" : "grab") : "default"}
                userSelect="none"
                touchAction="none"
            >
                <Image
                    src={resolveMediaUrl(imageUrl)}
                    alt="Overlay Asset"
                    w="100%"
                    h={height && height !== "auto" ? "100%" : "auto"}
                    objectFit="contain"
                    draggable={false}
                />
            </Box>

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
                    border="1px solid #fff"
                    onPointerDown={handleResize}
                    onMouseDown={handleResize}
                    zIndex={30}
                    _hover={{ transform: "scale(1.2)" }}
                    onPointerDownCapture={handleResizePointerDownCapture}
                    touchAction="none"
                />
            )}
        </Box>
    );
}
