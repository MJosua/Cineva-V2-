import React, { useState, useEffect } from "react";
import { Box, Image } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { resolveMediaUrl } from "../../../utils/mediaHelper";

export default function FlipBlock({ images = [], interval = 3000, direction = "horizontal" }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, interval);
        return () => clearInterval(timer);
    }, [images.length, interval]);

    if (!images || images.length === 0) {
        return <Box textAlign="center" py={10} color="gray.400">No images configured</Box>;
    }

    // Animation variants based on direction
    const variants = {
        horizontal: {
            initial: { rotateY: -90, opacity: 0 },
            animate: { rotateY: 0, opacity: 1 },
            exit: { rotateY: 90, opacity: 0 }
        },
        vertical: {
            initial: { rotateX: 90, opacity: 0 },
            animate: { rotateX: 0, opacity: 1 },
            exit: { rotateX: -90, opacity: 0 }
        }
    };

    const variant = variants[direction] || variants.horizontal;

    return (
        <Box
            position="relative"
            w="100%"
            h="250px"
            overflow="hidden"
            my={5}
            style={{ perspective: "1000px" }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={variant.initial}
                    animate={variant.animate}
                    exit={variant.exit}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d"
                    }}
                >
                    <Image
                        src={resolveMediaUrl(images[index])}
                        alt={`Slide ${index}`}
                        objectFit="contain"
                        w="100%"
                        h="100%"
                    />
                </motion.div>
            </AnimatePresence>
        </Box>
    );
}
