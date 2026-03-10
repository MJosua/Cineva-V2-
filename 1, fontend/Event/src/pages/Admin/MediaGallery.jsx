import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Box, Heading, SimpleGrid, Image, Text, Flex, Button, IconButton,
    useToast, Spinner, Input, HStack, VStack, Badge,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
    useDisclosure, Tooltip, Tabs, TabList, TabPanels, Tab, TabPanel,
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Icon, Divider, Center
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import {
    MdDelete, MdCloudUpload, MdContentCopy, MdInsertLink,
    MdCollections, MdSearch, MdZoomIn, MdFileDownload,
    MdToday, MdCalendarMonth, MdAccessTime
} from 'react-icons/md';
import { getCampaignMedia, uploadCampaignMedia, deleteCampaignMedia } from '../../services/eventEngineApi';
import { resolveMediaUrl } from '../../utils/mediaHelper';

const MediaGallery = ({ isPicker = false, onSelect = null }) => {
    const { slug } = useParams();
    const toast = useToast();
    const fileInputRef = useRef();

    // Preview Disclosure
    const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
    const [selectedImage, setSelectedImage] = useState(null);

    const [media, setMedia] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        fetchMedia();
    }, [slug]);

    const fetchMedia = async () => {
        setIsLoading(true);
        try {
            const data = await getCampaignMedia(slug);
            setMedia(data || []);
        } catch (error) {
            toast({
                title: 'Error loading media',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        // Mark as media to trigger correct backend storage
        formData.append('type', 'media');

        setIsUploading(true);
        try {
            await uploadCampaignMedia(slug, formData);
            toast({
                title: 'Upload successful',
                status: 'success',
                duration: 2000,
            });
            fetchMedia();
            setTabIndex(0); // Switch to gallery after upload
        } catch (error) {
            toast({
                title: 'Upload failed',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const copyToClipboard = (text) => {
        const fullUrl = resolveMediaUrl(text);
        navigator.clipboard.writeText(fullUrl);
        toast({
            title: 'URL copied',
            description: fullUrl,
            status: 'success',
            duration: 1500,
        });
    };

    const handleImageClick = (item) => {
        if (isPicker && onSelect) {
            onSelect(item.file_path);
        } else {
            setSelectedImage(item);
            onPreviewOpen();
        }
    };

    const handleDelete = async (mediaId) => {
        if (!window.confirm('Are you sure you want to delete this media? This cannot be undone.')) return;

        try {
            await deleteCampaignMedia(slug, mediaId);
            toast({
                title: 'Media deleted',
                status: 'success',
                duration: 2000,
            });
            onPreviewClose();
            fetchMedia(); // Refresh list
        } catch (error) {
            toast({
                title: 'Error deleting media',
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    // Grouping & Filtering Logic
    const groupedMedia = useMemo(() => {
        const filtered = media.filter(item =>
            item.original_name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'Older': []
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisWeek = new Date(today);
        thisWeek.setDate(thisWeek.getDate() - 7);

        filtered.forEach(item => {
            const uploadDate = new Date(item.upload_date);
            if (uploadDate.toDateString() === today.toDateString()) {
                groups['Today'].push(item);
            } else if (uploadDate.toDateString() === yesterday.toDateString()) {
                groups['Yesterday'].push(item);
            } else if (uploadDate > thisWeek) {
                groups['This Week'].push(item);
            } else {
                groups['Older'].push(item);
            }
        });

        return groups;
    }, [media, searchQuery]);

    const hasMedia = media.length > 0;

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px">
                <VStack spacing={4}>
                    <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
                    <Text fontWeight="medium" color="gray.500">Loading your media library...</Text>
                </VStack>
            </Flex>
        );
    }

    return (
        <Box p={isPicker ? 0 : 6} h="100%">
            {!isPicker && (
                <Flex justify="space-between" align="center" mb={6}>
                    <VStack align="start" spacing={1}>
                        <Heading size="lg" color="gray.700">Media Library</Heading>
                        <Breadcrumb fontSize="sm" color="gray.500">
                            <BreadcrumbItem>
                                <BreadcrumbLink href="#">Campaign</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage>
                                <BreadcrumbLink href="#">Media Assets</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                    </VStack>
                </Flex>
            )}

            <Tabs variant="enclosed-colored" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
                <TabList mb={4}>
                    <Tab fontWeight="bold" fontSize="sm">Browse Files</Tab>
                    <Tab fontWeight="bold" fontSize="sm">Upload New</Tab>
                </TabList>

                <TabPanels>
                    {/* Browse Tab */}
                    <TabPanel p={0}>
                        {hasMedia && (
                            <Box mb={6}>
                                <HStack spacing={4} mb={6}>
                                    <Box position="relative" maxW="400px" flex="1">
                                        <Flex align="center" position="absolute" left={3} height="100%" zIndex={2}>
                                            <Icon as={MdSearch} color="gray.400" />
                                        </Flex>
                                        <Input
                                            placeholder="Search by filename..."
                                            size="md"
                                            pl={10}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            bg="white"
                                        />
                                    </Box>
                                </HStack>

                                {Object.entries(groupedMedia).map(([title, items]) => (
                                    items.length > 0 && (
                                        <Box key={title} mb={8}>
                                            <Flex align="center" mb={4}>
                                                <Icon
                                                    as={title === 'Today' ? MdToday : title === 'Older' ? MdCalendarMonth : MdAccessTime}
                                                    color="gray.400"
                                                    mr={2}
                                                />
                                                <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.500">
                                                    {title}
                                                </Heading>
                                                <Badge ml={3} borderRadius="full" px={2} variant="subtle" colorScheme="gray">
                                                    {items.length}
                                                </Badge>
                                                <Divider ml={4} />
                                            </Flex>

                                            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 6 }} spacing={4}>
                                                {items.map((item) => (
                                                    <MediaItem
                                                        key={item.id}
                                                        item={item}
                                                        isPicker={isPicker}
                                                        onSelect={handleImageClick}
                                                        onCopy={copyToClipboard}
                                                        onDelete={handleDelete}
                                                    />
                                                ))}
                                            </SimpleGrid>
                                        </Box>
                                    )
                                ))}
                            </Box>
                        )}

                        {!hasMedia && !isLoading && (
                            <Center h="300px" flexDir="column" bg="gray.50" borderRadius="xl" border="2px dashed" borderColor="gray.200">
                                <Icon as={MdCollections} w={12} h={12} color="gray.300" mb={4} />
                                <Text fontWeight="bold" color="gray.600">Your media library is empty</Text>
                                <Text color="gray.500" mb={6}>Start by uploading some assets for your campaign</Text>
                                <Button leftIcon={<MdCloudUpload />} colorScheme="brand" size="sm" onClick={() => setTabIndex(1)}>
                                    Go to Upload
                                </Button>
                            </Center>
                        )}
                    </TabPanel>

                    {/* Upload Tab */}
                    <TabPanel p={0}>
                        <VStack
                            spacing={8}
                            p={10}
                            bg="gray.50"
                            borderRadius="xl"
                            border="2px dashed"
                            borderColor="gray.200"
                            textAlign="center"
                            transition="all 0.2s"
                            _hover={{ bg: 'blue.50', borderColor: 'brand.300' }}
                            onClick={() => fileInputRef.current.click()}
                            cursor="pointer"
                        >
                            <Box p={6} bg="white" borderRadius="full" shadow="sm">
                                <Icon as={MdCloudUpload} w={12} h={12} color="brand.500" />
                            </Box>
                            <VStack spacing={2}>
                                <Heading size="md" color="gray.700">Drag and drop images here</Heading>
                                <Text color="gray.500">or click to browse your files</Text>
                                <Text fontSize="xs" color="gray.400">Supported formats: JPG, PNG, WEBP, SVG</Text>
                            </VStack>
                            <Button
                                colorScheme="brand"
                                isLoading={isUploading}
                                loadingText="Uploading..."
                            >
                                Select Files
                            </Button>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleUpload}
                            />
                        </VStack>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Preview Modal */}
            <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="3xl">
                <ModalOverlay backdropFilter="blur(5px)" bgColor="rgba(25, 30, 48, 0.7)" />
                <ModalContent overflow="hidden">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100" pr={12}>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="md" noOfLines={1}>{selectedImage?.original_name}</Text>
                            <Text fontSize="xs" color="gray.500" fontWeight="normal">
                                Uploaded on {new Date(selectedImage?.upload_date).toLocaleDateString()}
                            </Text>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p={4} bg="gray.900" minH="500px" display="flex" alignItems="center" justifyContent="center">
                        {selectedImage && (
                            <Image
                                src={resolveMediaUrl(selectedImage.file_path)}
                                maxH="80vh"
                                w="auto"
                                objectFit="contain"
                                shadow="2xl"
                            />
                        )}
                    </ModalBody>
                    <Flex p={4} bg="white" justify="space-between" align="center">
                        <HStack spacing={4}>
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase">Dimensions</Text>
                                <Text fontSize="sm" fontWeight="bold">Auto</Text>
                            </VStack>
                            <Divider orientation="vertical" h="30px" />
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xs" color="gray.500" textTransform="uppercase">Size</Text>
                                <Text fontSize="sm" fontWeight="bold">{(selectedImage?.file_size / 1024).toFixed(1)} KB</Text>
                            </VStack>
                        </HStack>
                        <HStack>
                            <Button variant="ghost" size="sm" leftIcon={<MdContentCopy />} onClick={() => copyToClipboard(selectedImage.file_path)}>
                                Copy link
                            </Button>
                            <Button
                                colorScheme="red"
                                variant="outline"
                                size="sm"
                                leftIcon={<MdDelete />}
                                onClick={() => handleDelete(selectedImage.id)}
                            >
                                Delete
                            </Button>
                            <Button as="a" href={resolveMediaUrl(selectedImage?.file_path)} download={selectedImage?.original_name} colorScheme="brand" size="sm" leftIcon={<MdFileDownload />}>
                                Download
                            </Button>
                        </HStack>
                    </Flex>
                </ModalContent>
            </Modal>
        </Box>
    );
};

const MediaItem = ({ item, isPicker, onSelect, onCopy, onDelete }) => {
    const fullUrl = resolveMediaUrl(item.file_path);

    return (
        <Box
            bg="white"
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="gray.200"
            position="relative"
            role="group"
            transition="all 0.2s"
            _hover={{ shadow: 'lg', borderColor: 'brand.500', transform: 'translateY(-2px)' }}
            cursor="pointer"
            onClick={() => onSelect(item)}
        >
            <Box h="180px" overflow="hidden" bg="gray.50" display="flex" alignItems="center" justifyContent="center" position="relative">
                <Image
                    src={fullUrl}
                    alt={item.original_name}
                    maxW="100%"
                    maxH="100%"
                    objectFit="contain" // Contain ensures full asset is visible (not cut)
                    p={2}
                    fallback={
                        <Box p={4} textAlign="center">
                            <MdCollections size={32} color="gray.300" />
                            <Text fontSize="8px" color="gray.400" mt={1}>Preview Unavailable</Text>
                            <Text fontSize="8px" color="gray.400" mt={1}>{fullUrl}</Text>
                        </Box>
                    }
                />

                {/* Visual Overlay on Hover */}
                <Box
                    position="absolute"
                    inset={0}
                    bg="rgba(0,0,0,0.1)"
                    opacity={0}
                    _groupHover={{ opacity: 1 }}
                    transition="opacity 0.2s"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Icon as={isPicker ? MdInsertLink : MdZoomIn} w={8} h={8} color="brand.500" />
                </Box>
            </Box>
            <Box p={3}>
                <Text fontSize="xs" fontWeight="bold" noOfLines={1} title={item.original_name} color="gray.700">
                    {item.original_name}
                </Text>
                <Flex justify="space-between" align="center" mt={1}>
                    <Text fontSize="10px" color="gray.500">
                        {(item.file_size / 1024).toFixed(1)} KB
                    </Text>
                    <HStack spacing={1}>
                        <Tooltip label="Delete Media" placement="top">
                            <IconButton
                                icon={<MdDelete />}
                                size="xs"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                                aria-label="Delete Media"
                            />
                        </Tooltip>
                        <Tooltip label="Copy URL" placement="top">
                            <IconButton
                                icon={<MdContentCopy />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(item.file_path);
                                }}
                                aria-label="Copy URL"
                            />
                        </Tooltip>
                    </HStack>
                </Flex>
            </Box>
        </Box>
    );
};

export default MediaGallery;
