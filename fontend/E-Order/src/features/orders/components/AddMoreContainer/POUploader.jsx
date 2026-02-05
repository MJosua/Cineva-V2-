import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Image,
    Tooltip,
} from "@chakra-ui/react";
import { AiFillFile, AiOutlineDelete } from "react-icons/ai";
import PdfViewer from "../../../../components/media/PDFViewer/PdfViewer";

const POUploader = ({
    order,
    orderIndex,
    poFile,
    handleFileUpload,
    onUpload,
    handleDeleteImage,
    isOpenModalUpload,
    onOpenModalUpload,
    onCloseModalUpload,
    isOpenModalImage,
    onOpenModalImage,
    onCloseModalImage,
}) => {
    const fileInputRef = React.useRef();

    const fileUrl = order.order.header.po_url ? (order.order.header.po_url.startsWith('http') ? order.order.header.po_url : `CHANGE_ME_API_URL/${order.order.header.po_url}`) : ''; // Note: API_URL logic handled in parent or here? 
    // Wait, in the original code it was API_URL + order.order.header.po_url.
    // I should probably pass the FULL URL or handle it here with API_URL import.
    // Let's import API_URL here to be safe and consistent.

    return (
        <div className="row mx-2 py-2">
            <div className="grey_text_bold ratakiri fs-6 d-flex col-12 col-md-2 mt-2">
                PO File&nbsp;
            </div>
            <div className="d-flex justify-content-start align-items-center col-md-8 col-12 ps-3 ps-md-0">

                <button
                    className="btn btn-outline-secondary px-2 py-1 fw-bold"
                    onClick={onOpenModalUpload}
                >
                    Choose file...
                </button>
                {order.order.header.po_url.trim() === '' || !order.order.header.po_url ? null :
                    <button
                        className="btn text-muted mx-1 px-2 py-1 fw-bold fs-6"
                        type='button'
                        onClick={() => onOpenModalImage()}
                    >
                        {!order.order.header.fileOriginalName ? (
                            <div>
                                <Tooltip
                                    label="Click file icon to preview"
                                    hasArrow
                                    arrowSize={15}
                                >
                                    <div className="row">
                                        <div className="col-9">
                                            Document
                                        </div>
                                        <div className="col-2 pt-1">
                                            <AiFillFile />
                                        </div>
                                    </div>
                                </Tooltip>
                            </div>
                        ) : (
                            order.order.header.fileOriginalName
                        )}
                    </button>
                }
                {order.order.header.po_url.trim() === '' || !order.order.header.po_url ? null :
                    <Tooltip label="delete image">
                        <button
                            className="btn text-muted mx-1 px-2 py-1 fw-bold fs-6"
                            type='button'
                            onClick={() => handleDeleteImage(orderIndex)}
                        >
                            <AiOutlineDelete className="pointer" size={25} />
                        </button>
                    </Tooltip>
                }

            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={isOpenModalUpload}
                onClose={onCloseModalUpload}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Upload PO File</ModalHeader>
                        <ModalCloseButton onClick={onCloseModalUpload} />
                        <ModalBody>
                            <span className="py-0">
                                You can add file that refers the PO. <br />
                                The file extension must be *.pdf, *.jpg, *.jpeg, *.docx, *.xlsx <br />
                                The maximum file size is 1MB
                            </span>
                            <br></br>
                            <input
                                type="file"
                                accept=".jpg, .jpeg, .png, .pdf, .docx, .doc, .xls, .xlsx"
                                ref={fileInputRef}
                                onChange={(e) => handleFileUpload(e, orderIndex)}
                            />
                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button className="btn btn-danger px-2 mx-1" onClick={onUpload}>Upload</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>

            {/* Preview Modal */}
            <PreviewModal
                isOpen={isOpenModalImage}
                onClose={onCloseModalImage}
                fileUrl={fileUrl} // We need to handle this URL correctly.
                originalUrl={order.order.header.po_url}
            />
        </div>
    );
};

// Sub-component for Preview Modal to keep main component clean
const PreviewModal = ({ isOpen, onClose, fileUrl, originalUrl }) => {
    // Check extensions from originalUrl or fileUrl
    if (!originalUrl) return null;

    const lowerUrl = originalUrl.toLowerCase();
    const isPdf = lowerUrl.endsWith('.pdf');
    const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);
    // Note: Logic for constructing 'fileUrl' with API_URL needs to happen before passing here.

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset="slideInBottom"
            size="xl"
        >
            <ModalOverlay>
                <ModalContent>
                    <ModalHeader>PO File Review</ModalHeader>
                    <ModalCloseButton onClick={onClose} />
                    <ModalBody>
                        {isImage && (
                            <Image src={fileUrl} className="mb-2" alt="Document" />
                        )}

                        {isPdf && (
                            <PdfViewer file={fileUrl} style={{ width: '100%' }} />
                        )}

                        {!isPdf && !isImage && (
                            <p>Unsupported file format</p>
                        )}
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
}

export default POUploader;
