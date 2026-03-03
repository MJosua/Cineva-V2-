import {
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    Tooltip,
    ModalCloseButton,
    useToast,
    Button,
    Image,
} from "@chakra-ui/react";
import { useSelector } from "react-redux";
import PdfViewer from "../../../../../components/media/PDFViewer/PdfViewer";

function truncateText(text, maxLength) {
    // Split the text into words
    const words = text.split(' ');

    // Initialize an empty string to store the truncated text
    let truncatedText = '';

    // Loop through each word
    for (const word of words) {
        // Check if adding the current word will exceed the maxLength
        if ((truncatedText + word).length > maxLength) {
            break; // Stop if adding the current word exceeds maxLength
        }

        // Add the word to the truncatedText
        truncatedText += word + ' ';
    }

    // Trim any trailing whitespace
    truncatedText = truncatedText.trim();

    return truncatedText;
}

function Header({

    orderItem,
    currentDate,
    portsDetails,
    shiptoDetails,
    API_URL,
    Tooltip,
    AiFillFile,
    billtoDetails,
    notifytoDetails1,
    notifytoDetails2,
}) {


    const { company_name } = useSelector((state) => {
        return {
            company_name: state.userReducer.company_name,
        }
    });

    const toast = useToast();


    const truncatedData = truncateText(company_name, 36);


    const {
        isOpen: isOpenModalImage,
        onOpen: onOpenModalImage,
        onClose: onCloseModalImage,
    } = useDisclosure();


    const fileUrl = API_URL + orderItem.order.header.po_url;
    const poUrl = orderItem.order?.header?.po_url;
    const lowerUrl = typeof poUrl === "string" ? poUrl.toLowerCase() : "";

    // Check if the URL ends with a PDF extension
    const isPdf = lowerUrl.endsWith('.pdf');

    // Check for common image extensions (png, jpg, jpeg, gif)
    const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);


    return (
        <>



            <div className="col-6 px-3 mb-3">

                <div className="row ">
                    <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                        PO Buyer
                    </div>

                    <div className="col-12 col-md-8  grey_text fs-6 text-start ">
                        {orderItem.order.header.po_buyer}
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                        PO Date
                    </div>

                    <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">
                        {currentDate}
                    </div>
                </div>

                <div className="row">
                    <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                        Bill To
                    </div>

                    <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">
                        {billtoDetails ? billtoDetails.company_name : truncatedData}
                    </div>
                </div>
                {orderItem.order.header.notify_to_1 === null || orderItem.order.header.notify_to_1 === "" || orderItem.order.header.notify_to_1 === undefined ?
                    null
                    :
                    <div className="row">
                        <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                            1st Notify Party
                        </div>

                        <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">
                            {notifytoDetails1 ? `${notifytoDetails1.company_name} ${notifytoDetails1.company_notice ? ` -  ${notifytoDetails1.company_notice}` : ``}` : "Loading..."}
                        </div>
                    </div>
                }
                {orderItem.order.header.notify_to_2 === null || orderItem.order.header.notify_to_2 === "" || orderItem.order.header.notify_to_2 === undefined ?
                    null
                    :
                    <div className="row">
                        <div className="col-12 col-md-4 d-flex grey_text_bold fs-6 text-start">
                            2nd Notify Party
                        </div>

                        <div className="col-12 col-md-8 d-flex grey_text fs-6 text-start">
                            {notifytoDetails2 ? `${notifytoDetails2.company_name} ${notifytoDetails2.company_notice ? ` -  ${notifytoDetails2.company_notice}` : ``}` : "Loading..."}

                        </div>
                    </div>
                }
            </div>

            <div className="col-6 px-3 mb-3">
                <div className="row">
                    <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                        Port
                    </div>

                    <div className="col-md-8 col-12 d-flex grey_text fs-6 text-start">
                        {portsDetails ? portsDetails.harbour_name : "Loading..."}
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                        Ship to Party
                    </div>

                    <div className="col-md-8 col-12 d-flex grey_text fs-6 text-start">
                        {shiptoDetails ? shiptoDetails.txt : " Loading... "}
                    </div>
                </div>


                {orderItem.order.header.po_url ?
                    <div className="row">
                        <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                            Document
                        </div>
                        <div className="col-md-8 ps-0 col-12 d-flex  justify-content-start grey_text fs-6 text-start"

                            onClick={() => onOpenModalImage()}>
                            <Tooltip
                                label="Click to show PO"
                                hasArrow
                                arrowSize={15}
                            >
                                <div className="">
                                    <span className="grey_text fs-6  btn">
                                        <AiFillFile className="pointer" size={15} />
                                    </span>
                                    <span className="grey_text_bold fs-6 pointer">
                                        Document &nbsp;
                                    </span>
                                </div>
                            </Tooltip>
                        </div>

                    </div>


                    :
                    <div className="row">
                        <div className="col-md-4 col-12 d-flex grey_text_bold fs-6 text-start">
                            Document
                        </div>

                        <div className="col-md-8  col-12 d-flex grey_text fs-6 text-start">
                            No PO file&nbsp;
                        </div>
                    </div>


                }

            </div>
            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalImage}
                onClose={onCloseModalImage}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>PO File</ModalHeader>
                        <ModalCloseButton onClick={onCloseModalImage} />
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

        </>
    )
}
export default Header





