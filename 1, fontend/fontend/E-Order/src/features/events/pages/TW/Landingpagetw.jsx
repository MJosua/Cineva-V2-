import { Button, Image, Input, InputGroup, InputLeftElement, InputRightElement, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, Stack, useDisclosure, useToast } from "@chakra-ui/react"
import { useEffect, useRef, useState } from "react"
import axios from "axios";
import { API_URL } from "../../../../config";
import { Bs1SquareFill } from "react-icons/bs";
import MobileTaiwanEvent2024 from "./Mobile";
import DesktopTaiwanEvent2024 from "./Destop";
import { set } from "react-ga";
import SyaratdanKetentuan from "./SyaratdanKetentuan/SyaratdanKetentuan";

function Landingpagetw() {

    const toast = useToast();

    const { isOpen, onOpen, onClose } = useDisclosure()
    const [inputCode, setInputCode] = useState(false)

    const {
        isOpen: isOpenModalSuccess,
        onOpen: onOpenModalSuccess,
        onClose: oncCloseModalSuccess,
    } = useDisclosure();

    const {
        isOpen: isOpenModal2625,
        onOpen: onOpenModal2625,
        onClose: oncCloseModal2625,
    } = useDisclosure();

    const [event_id, setEvent_id] = useState(1)
    const [country, setCountry] = useState(765)

    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [channel, setChannel] = useState("")
    const [date, setDate] = useState("")
    const [packetCount, setPacketCount] = useState("")
    const [file, setFile] = useState(null)
    const [invoice, setInvoice] = useState("")
    const [idnumber, setIdnumber] = useState("");

    const [error, setError] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // useEffect(() => {
    //     onOpenModalSuccess()
    // }, [])



    const btnRef2 = useRef()

    const [audio] = useState(new Audio("/image/event/aset/indomie_nwjns.wav"));

    const {
        isOpen: isOpenSideMenu,
        onOpen: onOpenSideMenu,
        onClose: onCloseSideMenu,
    } = useDisclosure();

    const {
        isOpen: isOpenModalStart,
        onOpen: onOpenModalStart,
        onClose: onCloseModalStart,
    } = useDisclosure();



    const startAudio = () => {
        audio.loop = true;
        audio.play()
            .then(() => {
                onClose(); // Close modal on successful audio play
            })
            .catch((error) => {
                console.error("Error playing audio:", error);
            });
    };

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0]; // Retrieve the first selected file
        setFile(uploadedFile);
    };

    const currentDate = new Date();
    const comparisonDate = new Date('2025-01-26');


    const fileInputRef = useRef(null);
    const handleInput = () => {
        let hasError = false;


        if (currentDate >= comparisonDate) {
            onOpenModal2625();
    
            return;
        }

        // Validate Name
        if (name.trim() === "") {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'name')) {
                    return [...prevErrors, { category: 'name', message: "Please select the name of support." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'name'));
        }

        // Validate Phone
        if (phone.trim() === "") {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'phone')) {
                    return [...prevErrors, { category: 'phone', message: "Please provide a valid phone number." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'phone'));
        }

        // Validate Channel
        if (channel.trim() === "") {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'channel')) {
                    return [...prevErrors, { category: 'channel', message: "Please provide a valid channel description." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'channel'));
        }

        // Validate Invoice
        if (invoice.trim() === "") {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'invoice')) {
                    return [...prevErrors, { category: 'invoice', message: "Please provide a valid invoice number." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'invoice'));
        }

        // Validate File
        if (!file) {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'file')) {
                    return [...prevErrors, { category: 'file', message: "Please upload an invoice photo." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'file'));
        }

        if (!idnumber) {
            setError(prevErrors => {
                if (!prevErrors.some(error => error.category === 'idnumber')) {
                    return [...prevErrors, { category: 'idnumber', message: "Please fill an idnumber." }];
                }
                return prevErrors;
            });
            hasError = true;
        } else {
            setError(prevErrors => prevErrors.filter(error => error.category !== 'idnumber'));
        }

        // If no errors, proceed with API call
        if (!hasError && error.length === 0) {
            setIsLoading(true);

            const formData = new FormData();
            formData.append("Event_id", "1");
            formData.append("Country", "765");
            formData.append("column_1", name);
            formData.append("column_2", idnumber);
            formData.append("column_3", phone);
            formData.append("column_4", channel);
            formData.append("column_5", invoice);
            formData.append("column_6", date);
            formData.append("column_7", packetCount);
            formData.append("queryUnique", "5");
            formData.append("file", file);

            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
            }

            axios.post(`${API_URL}/event/doorprize`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
                .then(response => {
                    if (response.status === 200) {
                        console.log("success", response.data)
                        setName("");
                        setPhone("");
                        setChannel("");
                        setIdnumber("");
                        setInvoice("");
                        setDate("");
                        setPacketCount("");
                        setFile(null);
                        onOpenModalSuccess(); // Open modal with spinner
                    } else {
                        toast({
                            title: "Error",
                            description: response.data.message,
                            status: "error",
                            duration: 3000,
                            isClosable: true,
                        });
                    }
                })
                .catch(error => {
                    toast({
                        title: "Error",
                        description: error.response?.data?.message || "An error occurred.",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                    });
                    console.log("error", error);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            toast({
                title: "è«‹åœ¨é€å‡ºå‰ç¢ºèªæ‰€æœ‰å¡«å¯«çš„è³‡æ–™ç„¡èª¤.",
                duration: 3000,
                isClosable: true,
            });
            console.log("error", error);
        }
    };


    const scrollToSection = (id) => {
        console.log("jalan")
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth', // Smooth scroll
                block: 'start', // Scroll to the top of the section
            });
        }
    };


    return (
        <div className="container-fluid page-contain">

            {/* batas mobile */}
            <MobileTaiwanEvent2024
                scrollToSection={scrollToSection}
                btnRef2={btnRef2}
                onOpenSideMenu={onOpenSideMenu}
                isOpenSideMenu={isOpenSideMenu}
                onCloseSideMenu={onCloseSideMenu}
                idnumber={idnumber}
                setIdnumber={setIdnumber}
                handleInput={handleInput}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                channel={channel}
                setChannel={setChannel}
                date={date}
                setDate={setDate}
                packetCount={packetCount}
                setPacketCount={setPacketCount}
                file={file}
                setFile={setFile}
                invoice={invoice}
                setInvoice={setInvoice}
                error={error}

                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
            />
            <DesktopTaiwanEvent2024
                scrollToSection={scrollToSection}
                handleInput={handleInput}
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                channel={channel}
                setChannel={setChannel}
                date={date}
                setDate={setDate}
                packetCount={packetCount}
                idnumber={idnumber}
                setIdnumber={setIdnumber}
                setPacketCount={setPacketCount}
                file={file}
                setFile={setFile}
                invoice={invoice}
                setInvoice={setInvoice}
                error={error}

                handleFileChange={handleFileChange}
                fileInputRef={fileInputRef}
            />







            <Modal isOpen={isOpen} size="xl" onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalCloseButton />
                    <ModalBody>
                        <Image
                            src={`/Image/event/BG2tw.jpg`}
                            alt="Picture of Banner"
                            style={{ borderRadius: "20px", width: "100%", height: "auto", objectFit: "cover" }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isOpenModalSuccess} size="xl" onClose={oncCloseModalSuccess}>
                <ModalOverlay />
                <ModalContent>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="container-fluid">
                            {isLoading ? (
                                <div className="row py-5">
                                    <div className="col-12 d-flex justify-content-center align-items-center text-center">
                                        <Spinner size="xl" color="green.500" />
                                    </div>
                                    <div className="col-12 d-flex justify-content-center align-items-center">
                                        Processing your submission, please wait...
                                    </div>
                                </div>
                            ) : (
                                <div className="row py-5">
                                    <div className="col-12 d-flex justify-content-center align-items-center text-center fw-bold fs-1 text-success">
                                        å·²ç™»éŒ„æˆåŠŸ, <Image
                                            src="/image/event/aset/Rabbithugindomie.png"
                                            alt="Icon star"
                                            className="egg-asset-tw animated-star mt-4"

                                        />
                                    </div>
                                    <div className="col-12 d-flex justify-content-center align-items-center">
                                        ç¥æ‚¨å¥½é‹
                                    </div>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Modal isOpen={isOpenModal2625} size="xl" onClose={oncCloseModal2625}>
                <ModalOverlay />
                <ModalContent>
                    <ModalCloseButton />
                    <ModalBody>
                        <div className="container-fluid">
                            {isLoading ? (
                                <div className="row py-5">
                                    <div className="col-12 d-flex justify-content-center align-items-center text-center">
                                        <Spinner size="xl" color="green.500" />
                                    </div>
                                    <div className="col-12 d-flex justify-content-center align-items-center">
                                        Processing your submission, please wait...
                                    </div>
                                </div>
                            ) : (
                                <div className="row py-5">
                                    <div className="col-12 d-flex justify-content-center align-items-center text-center fw-bold fs-1 text-success">
                                        æ´»å‹•å·²æ–¼1/25æˆªæ­¢, <Image
                                            src="/image/event/aset/Rabbithugindomie.png"
                                            alt="Icon star"
                                            className="egg-asset-tw animated-star mt-4"

                                        />
                                    </div>
                                    <div className="col-12 d-flex justify-content-center align-items-center">
                                        å¾—çŽåå–®æ–¼ 2/7ä¸­åˆå…¬å¸ƒ
                                    </div>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>


            <Modal isOpen={isOpenModalStart} size="sm" onClose={onCloseModalStart}>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody>
                        <div className="container-fluid">
                            <div className="row py-5">
                                <div className="col-12 mb-3 d-flex justify-content-center align-items-center text-center fw-bold fs-4 text-success">
                                </div>
                                <div className="col-12 mt-4 d-flex justify-content-center align-items-center text-center fw-bold fs-1 text-success">
                                    <Spinner
                                        thickness="4px"
                                        speed="0.65s"
                                        emptyColor="gray.200"
                                        color="blue.500"
                                        size="xl"
                                    />
                                </div>
                                <div className="col-12 mt-5 d-flex justify-content-center align-items-center">
                                    <Button
                                        onClick={() => {
                                            onCloseModalStart();
                                        }}
                                        colorScheme="purple"
                                    >
                                        START
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </div>
    )
}
export default Landingpagetw





