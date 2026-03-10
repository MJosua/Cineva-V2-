import React from 'react';
import { FormControl, FormLabel, Input, HStack } from '@chakra-ui/react';
import MediaPickerModal from './MediaPickerModal';

const ImageField = ({ label, value, onChange, placeholder = "Image URL..." }) => {
    return (
        <FormControl>
            {label && <FormLabel fontSize="xs">{label}</FormLabel>}
            <HStack>
                <Input
                    size="sm"
                    placeholder={placeholder}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    bg="white"
                />
                <MediaPickerModal
                    label="Media"
                    onSelect={(url) => onChange(url)}
                />
            </HStack>
        </FormControl>
    );
};

export default ImageField;
