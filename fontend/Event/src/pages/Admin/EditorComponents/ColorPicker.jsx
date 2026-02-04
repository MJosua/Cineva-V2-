import { Box, HStack, Input, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, VStack, Popover, PopoverTrigger, PopoverContent, PopoverBody, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";

// Convert hex + opacity to rgba
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Parse rgba string to {hex, opacity}
function parseColor(color) {
    if (!color) return { hex: "#ffffff", opacity: 1 };
    if (color === "transparent") return { hex: "#ffffff", opacity: 0 };
    if (color.startsWith("rgba")) {
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
        if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            return { hex: `#${r}${g}${b}`, opacity: match[4] ? parseFloat(match[4]) : 1 };
        }
    }
    if (color.startsWith("#")) {
        return { hex: color.slice(0, 7), opacity: 1 };
    }
    return { hex: "#ffffff", opacity: 1 };
}

export default function ColorPicker({ label, value, onChange }) {
    const parsed = parseColor(value);
    const [hex, setHex] = useState(parsed.hex);
    const [opacity, setOpacity] = useState(parsed.opacity);

    useEffect(() => {
        const p = parseColor(value);
        setHex(p.hex);
        setOpacity(p.opacity);
    }, [value]);

    const handleHexChange = (newHex) => {
        setHex(newHex);
        onChange(hexToRgba(newHex, opacity));
    };

    const handleOpacityChange = (newOpacity) => {
        setOpacity(newOpacity);
        onChange(hexToRgba(hex, newOpacity));
    };

    const presetColors = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#f5f5f5", "#333333"];

    return (
        <VStack align="stretch" spacing={2}>
            {label && <Text fontSize="sm" fontWeight="medium">{label}</Text>}
            <HStack>
                <Popover>
                    <PopoverTrigger>
                        <Box
                            w="40px"
                            h="40px"
                            borderRadius="md"
                            border="2px solid"
                            borderColor="gray.300"
                            cursor="pointer"
                            style={{ background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`, backgroundSize: "10px 10px", backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px" }}
                        >
                            <Box w="100%" h="100%" borderRadius="md" bg={hexToRgba(hex, opacity)} />
                        </Box>
                    </PopoverTrigger>
                    <PopoverContent w="200px">
                        <PopoverBody>
                            <VStack spacing={2}>
                                <Input type="color" w="100%" h="40px" value={hex} onChange={(e) => handleHexChange(e.target.value)} />
                                <HStack wrap="wrap" spacing={1}>
                                    {presetColors.map((c) => (
                                        <Box key={c} w="20px" h="20px" bg={c} border="1px solid #ccc" borderRadius="sm" cursor="pointer" onClick={() => handleHexChange(c)} />
                                    ))}
                                </HStack>
                            </VStack>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
                <VStack flex={1} spacing={0} align="stretch">
                    <HStack>
                        <Text fontSize="xs" w="60px">Opacity:</Text>
                        <Text fontSize="xs" fontWeight="bold">{Math.round(opacity * 100)}%</Text>
                    </HStack>
                    <Slider value={opacity} min={0} max={1} step={0.01} onChange={handleOpacityChange}>
                        <SliderTrack><SliderFilledTrack bg="blue.400" /></SliderTrack>
                        <SliderThumb />
                    </Slider>
                </VStack>
            </HStack>
            <Input size="xs" value={hexToRgba(hex, opacity)} readOnly fontFamily="monospace" />
        </VStack>
    );
}
