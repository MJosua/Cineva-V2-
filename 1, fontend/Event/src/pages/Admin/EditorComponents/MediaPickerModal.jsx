import React from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    Button, useDisclosure
} from '@chakra-ui/react';
import { MdPhotoLibrary } from 'react-icons/md';
import MediaGallery from '../MediaGallery';

const MediaPickerModal = ({ onSelect, label = "Select Image" }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleSelect = (url) => {
        onSelect(url);
        onClose();
    };

    return (
        <>
            <Button
                size="xs"
                leftIcon={<MdPhotoLibrary />}
                onClick={onOpen}
                variant="outline"
                colorScheme="brand"
            >
                {label}
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Select Media</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <MediaGallery isPicker={true} onSelect={handleSelect} />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default MediaPickerModal;
