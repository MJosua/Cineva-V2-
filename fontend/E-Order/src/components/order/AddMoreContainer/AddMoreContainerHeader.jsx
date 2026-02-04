import {
    Input, Select, Tooltip, useDisclosure, useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    Image,
} from "@chakra-ui/react";
import { API_URL } from "../../../config";
import { AiFillFile, AiOutlineDelete } from "react-icons/ai";
import Axios from "axios";
import { seasonOut } from "../../../action/userAction";
import React, { useEffect, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import { useSelector } from "react-redux";
import PdfViewer from "../../media/PDFViewer/PdfViewer";
import { useData } from "../../auth/CheckToken/FetchData/DataContext";
import * as XLSX from "xlsx";

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


function AddMoreContainerHeader({
    order,
    orderIndex,
    containerOrders,
    setContainerOrders,
    ports,
    setPorts,
    shipToParties,
    setShipToParties,
    hasPoBuyerError,
    errors,
    setCustombale,
    customable,
    billtoparties,
    setbilltoparties,
    setSessionStorageTrigger,
    refresh,
    flavours

}) {

    const { container, ostp } = useData();



    const company_name = useSelector((state) => state.userReducer.company_name);
    const company_id = useSelector((state) => state.userReducer.company_id);
    const user = useSelector((state) => state.userReducer.user);
    const spc_condition = useSelector((state) => state.userReducer.spc_condition);


    const truncatedData = truncateText(company_name, 36);

    const handlePoBuyerChange = (value, orderIndex) => {
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.po_buyer = value;
            setContainerOrders(newOrders);
        }
    };
    const removeOrder = (index) => {
        const newOrders = [...containerOrders];
        newOrders.splice(index, 1);
        setContainerOrders(newOrders);
        setSessionStorageTrigger(prev => !prev);

    };

    const addContainer = (orderIndex) => {
        const newOrders = [...containerOrders];
        let contQty = newOrders[orderIndex]?.order.detail.cont_qty;
        contQty = parseInt(contQty, 10); // Convert to number
        contQty += 1;

        if (newOrders[orderIndex]?.order.detail
            &&
            newOrders[orderIndex].order.detail.containerList.length < 20
        ) {

            newOrders[orderIndex].order.detail.cont_qty = contQty.toString(); // Convert back to string if needed
            newOrders[orderIndex].order.detail.containerList.push({
                custom: false,
                detail_id: contQty.toLocaleString(),
                Flavour:
                    [{
                        sku: "-1",
                        qty: 0,
                        Flavour_tollingID: "",
                        qty_perpallet: 0,
                        qty_max: "",
                        moq: "",
                        palete_qty: 0,

                    },
                    {
                        sku: "-1",
                        qty: 0,
                        Flavour_tollingID: "",
                        qty_perpallet: 0,
                        qty_max: "",
                        moq: "",
                        palete_qty: 0,

                    }]

            });
        }

        const updatedBulkListFlavours = newOrders[orderIndex].order.detail.bulkList.Flavour.map(flavour => {
            return {
                ...flavour,
                qty: flavour.qty_real * contQty
            };
        });

        newOrders[orderIndex].order.detail.bulkList.Flavour = updatedBulkListFlavours;
        setSessionStorageTrigger(prev => !prev);
        setContainerOrders(newOrders);
    };





    useEffect(() => {
        if (ports.length > 0) {
            const defaultData = ports[0];
            const updatedOrders = containerOrders.map(order => {
                // Make a copy of the current order object
                const newOrder = { ...order };

                if (newOrder.order.detail === "" || !newOrder.order.header.port_shipment) {

                    newOrder.order.header.port_shipment = defaultData ? (defaultData.md_id).toString() : "";
                    newOrder.order.header.final_dest = defaultData ? (defaultData.final_dest).toString() : "";
                }

                return newOrder; // Return updated order object
            });
            setContainerOrders(updatedOrders);

        }

        if (shipToParties.length > 0) {
            const defaultData = shipToParties[0];
            const updatedOrders = containerOrders.map(order => {

                // Make a copy of the current order object
                const newOrder = { ...order };

                if (newOrder.order.header === "" || !newOrder.order.header.ship_to) {
                    // console.log("Updating cont_size for order:", newOrder);

                    newOrder.order.header.ship_to = defaultData ? (defaultData.keyy).toString() : "";
                }

                return newOrder; // Return updated order object
            });

            setContainerOrders(updatedOrders);
        }


        if (container.length > 0) {

            const defaultData = container.find(item => item.container_id === 4) || container[0];


            const updatedOrders = containerOrders.map(order => {

                // Make a copy of the current order object
                const newOrder = { ...order };

                if (newOrder.order.detail.cont_size === "") {
                    // console.log("Updating cont_size for order:", newOrder);

                    newOrder.order.detail.cont_size = defaultData ? (defaultData.container_id).toString() : "";



                }

                return newOrder; // Return updated order object
            });

            let custom = container.find(item => [16].includes(item.container_id));

            if (custom) {
                setCustombale(true);
            }

            setContainerOrders(updatedOrders);
        }


    }, [refresh, shipToParties, ports, container])



    const handlePortChange = (value, orderIndex) => {
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.port_shipment = value;
            setContainerOrders(newOrders);
        }
    };

    useEffect(() => {

        setbilltoparties(ostp);

        if (ostp) {
            const updatedOrders = containerOrders.map(order => {

                // Make a copy of the current order object
                const newOrder = { ...order };

                if (newOrder.order.header === "" || !newOrder.order.header.bill_to) {
                    // console.log("Updating cont_size for order:", newOrder);
                    newOrder.order.header.bill_to = company_id;
                }

                if (newOrder.order.header === "" || !newOrder.order.header.notify_to_1) {
                    // console.log("Updating cont_size for order:", newOrder);
                    newOrder.order.header.notify_to_1 = "";
                }

                if (newOrder.order.header === "" || !newOrder.order.header.notify_to_2) {
                    // console.log("Updating cont_size for order:", newOrder);
                    newOrder.order.header.notify_to_2 = "";
                }


                if (newOrder.order.header === "" || spc_condition.includes(18)) {
                    // console.log("Updating cont_size for order:", newOrder);
                    newOrder.order.header.notify_to_1 = String(ostp?.Notify?.[0]?.company_id ?? "");

                }

                return newOrder; // Return updated order object
            });

            setContainerOrders(updatedOrders);

        }

    }, [ostp])

    useEffect(() => {

        if (ostp && ostp.length > 0) {

            const updatedOrders = containerOrders.map(order => {

                // Make a copy of the current order object

                const newOrder = { ...order };



                if ((spc_condition.includes(18))) {
                    console.log("ostp", ostp)
                    console.log("Updating cont_size for order:", newOrder);
                    newOrder.order.header.notify_to_1 = ostp.Notify[0].company_id || "";

                }


                return newOrder; // Return updated order object
            });

            setContainerOrders(updatedOrders);
        }

    }, [])



    const handleShipToChange = (value, orderIndex) => {
        // console.log("testShipTo", value)
        const newOrders = [...containerOrders];

        const portsLookup = ports.reduce((lookup, stp) => {
            if (!lookup[stp.port_link]) {
                lookup[stp.port_link] = [];
            }
            lookup[stp.port_link].push(stp);
            return lookup;
        }, {});

        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.ship_to = value;

            const selectedPort = portsLookup[value];
            if (selectedPort) {
                console.log("selectedport", selectedPort)
                header.port_shipment = selectedPort[0].md_id;
            }


            setContainerOrders(newOrders);
        }
    };

    const handleBillToChange = (value, orderIndex) => {
        // console.log("testShipTo", value)
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.bill_to = value;
            setContainerOrders(newOrders);
        }
    };

    const handleNotify1Change = (value, orderIndex) => {
        // console.log("testShipTo", value)
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.notify_to_1 = value;
            if (header.notify_to_1 === header.notify_to_2) {
                header.notify_to_2 = "";
            }
            setContainerOrders(newOrders);
        }
    };

    const handleNotify2Change = (value, orderIndex) => {
        // console.log("testShipTo", value)
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;
        if (header) {
            header.notify_to_2 = value;
            setContainerOrders(newOrders);
        }
    };


    const handleChangeContainerLength = (e, orderIndex) => {
        let newLength = parseInt(e, 10) || 0;
        const newOrders = [...containerOrders];

        // Ensure the value is within the range 1 to 20
        let bulkStatus = newOrders[orderIndex]?.order.detail.bulk;

        if (newLength < 1 && (bulkStatus === false || bulkStatus === 0)) {
            newLength = 1;
        } else if (newLength > 20) {
            newLength = 20;
        } else if (newLength < 2 && (bulkStatus === true || bulkStatus === 1)) {
            newLength = 2;
        }


        if (newOrders[orderIndex]?.order.detail) {
            const currentLength = newOrders[orderIndex].order.detail.containerList.length;

            // Update cont_qty
            newOrders[orderIndex].order.detail.cont_qty = newLength.toString(); // Convert back to string if needed

            // Adjust containerList length
            if (newLength > currentLength) {
                // Add new containers
                const additionalContainers = Array.from({ length: newLength - currentLength }, (_, index) => ({
                    custom: false,
                    detail_id: (currentLength + index + 1).toString(),
                    Flavour: [
                        {
                            sku: "-1",
                            qty: 0,
                            Flavour_tollingID: "",
                            qty_perpallet: 0,
                            qty_max: "",
                            moq: "",
                            palete_qty: 0,
                        },
                        {
                            sku: "-1",
                            qty: 0,
                            Flavour_tollingID: "",
                            qty_perpallet: 0,
                            qty_max: "",
                            moq: "",
                            palete_qty: 0,
                        }
                    ]
                }));
                newOrders[orderIndex].order.detail.containerList = newOrders[orderIndex].order.detail.containerList.concat(additionalContainers);
            } else if (newLength < currentLength) {
                // Remove excess containers
                newOrders[orderIndex].order.detail.containerList = newOrders[orderIndex].order.detail.containerList.slice(0, newLength);
            }

            // Update bulkList.Flavour.qty values
            newOrders[orderIndex].order.detail.bulkList.Flavour = newOrders[orderIndex].order.detail.bulkList.Flavour.map(flavour => ({
                ...flavour,
                qty: flavour.qty_real * newLength
            }));
        }

        // Update state
        setContainerOrders(newOrders);
        setSessionStorageTrigger(prev => !prev);
    };


    const [containers, setContainers] = useState([]);

    useEffect(() => {
        setContainers(container);

        if (containers.length > 1) {
            let defaultweek = container.find(item => item.container_id === 4);

            // If defaultweek with container_id === 4 doesn't exist, fallback to res.data[0]
            if (!defaultweek) {
                defaultweek = container[0];
            } // Assuming this gets the correct data
            // Check conditions and update cont_size if necessary


            // Update containerOrders
            const updatedOrders = containerOrders.map(order => {
                // Make a copy of the current order object
                const newOrder = { ...order };

                if (newOrder.order.detail === "" || !newOrder.order.detail.cont_size || newOrder.order.detail.cont_size === "0") {
                    // console.log("Updating cont_size for order:", newOrder);

                    newOrder.order.detail.cont_size = defaultweek ? (defaultweek.container_id).toString() : "";
                }

                return newOrder; // Return updated order object
            });

            let custom = container.find(item => [16].includes(item.container_id));

            if (custom) {
                setCustombale(true);
            }


            // Set the updated containerOrders state
            setContainerOrders(updatedOrders);
        }
    }, [container])



    const handleContainerSizeChange = (value, orderIndex) => {
        // console.log("testContainerSize", value)
        const newOrders = [...containerOrders];
        const detail = newOrders[orderIndex]?.order.detail;
        const summary = newOrders[orderIndex]?.order.summary;

        if (detail) {
            detail.cont_size = value;

            detail.containerList.forEach(container => {
                container.Flavour.forEach(flavour => {
                    flavour.Flavour_tollingID = 0
                    flavour.moq = ""
                    flavour.qty_perpallet = ""
                    flavour.palete_qty = 0; // Assuming you want qty_max set to 0 as well
                    flavour.qty = 0;
                    flavour.qty_max = ""
                    flavour.sku = "-1"

                });
            });

            summary.Flavour.forEach(flavour => {
                flavour.moq = ""
                flavour.qty = ""
                flavour.sku = ""
            }
            )

            // Reset flavour.qty and flavour.qty_max for each flavour in bulkList
            detail.bulkList.Flavour.forEach(flavour => {
                flavour.Flavour_tollingID = 0
                flavour.moq = ""
                flavour.qty_perpallet = ""
                flavour.palete_qty = 0; // Assuming you want qty_max set to 0 as well
                flavour.qty = 0;
                flavour.qty_max = ""
                flavour.sku = "-1"// Assuming you want qty_max set to 0 as well
            });

            setContainerOrders(newOrders);
        }
    };




    const removeContainer = (value, orderIndex) => {
        const newOrders = [...containerOrders];
        let contQty = newOrders[orderIndex]?.order.detail.cont_qty;
        let bulkStatus = newOrders[orderIndex]?.order.detail.bulk;
        contQty = parseInt(contQty, 10); // Convert to number
        contQty -= 1;

        if (bulkStatus === false) {

            if (newOrders[orderIndex]?.order?.detail?.containerList
                &&
                newOrders[orderIndex].order.detail.containerList.length > 1
            ) {


                newOrders[orderIndex].order.detail.cont_qty = contQty.toString(); // Convert back to string if needed

                // Remove the container at the specified index
                newOrders[orderIndex].order.detail.containerList.pop();

                const updatedBulkListFlavours = newOrders[orderIndex].order.detail.bulkList.Flavour.map(flavour => {
                    return {
                        ...flavour,
                        qty: flavour.qty_real * contQty
                    };
                });

                newOrders[orderIndex].order.detail.bulkList.Flavour = updatedBulkListFlavours;


                setContainerOrders(newOrders);
                setSessionStorageTrigger(prev => !prev);
            }
        }
        else {
            if (newOrders[orderIndex]?.order?.detail?.containerList
                &&
                newOrders[orderIndex].order.detail.containerList.length > 2
            ) {


                newOrders[orderIndex].order.detail.cont_qty = contQty.toString(); // Convert back to string if needed

                // Remove the container at the specified index
                newOrders[orderIndex].order.detail.containerList.pop();

                const updatedBulkListFlavours = newOrders[orderIndex].order.detail.bulkList.Flavour.map(flavour => {
                    return {
                        ...flavour,
                        qty: flavour.qty_real * contQty
                    };
                });

                newOrders[orderIndex].order.detail.bulkList.Flavour = updatedBulkListFlavours;


                setContainerOrders(newOrders);
                setSessionStorageTrigger(prev => !prev);
            }
        }
    };


    const handleBulkChange = (value, orderIndex) => {
        // console.log("testBulk", value)
        const newOrders = [...containerOrders];
        const detail = newOrders[orderIndex]?.order.detail;
        if (detail) {
            if ((value === true) && (detail.cont_qty < 2)) {
                handleChangeContainerLength(2, orderIndex)
                detail.bulk = value;
                setSessionStorageTrigger(prev => !prev);
                setContainerOrders(newOrders);
            } else {
                detail.bulk = value;
                setContainerOrders(newOrders);
                setSessionStorageTrigger(prev => !prev);
            }
        }
    };

    const hasExistingPoBuyerError = errors.some(error => error.orderIndex === orderIndex && error.errorType === 'existing_po_buyer');

    const toast = useToast();

    const {
        isOpen: isOpenModalUpload,
        onOpen: onOpenModalUpload,
        onClose: onCloseModalUpload,
    } = useDisclosure();

    const [matchingPoRef, setMatchingPoRef] = useState(false);
    const [existingPo, setExsitingPo] = useState([]);
    const getExistingPo = () => {
        let userToken = localStorage.getItem("tokek");
        Axios.get(API_URL + "/order/get_po", {
            headers: {
                Authorization: `Bearer ${userToken}`,
            },
        })
            .then((res) => {
                setExsitingPo(res.data);
            })
            .catch((err) => {
            });
    };
    useEffect(() => {
        getExistingPo();




    }, []);


    const fileInputRef = React.useRef();

    // file size limiter
    //file size 2mb
    const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;
    const [poFile, setPoFile] = useState(null);

    const handleFileUpload = (event, orderIndex) => {
        const file = event.target.files[0];
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.docx', '.xlsx'];
        if (file) {
            const extension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

            if (allowedExtensions.includes(`.${extension}`)) {
                setPoFile(file);
            } else {
                toast({
                    title: "Oopsie!",
                    description: "Invalid file type. Please select a .pdf, .jpg, .jpeg, .docx, or .xlsx file. Please Try Again",
                    status: "warning",
                    duration: 2000,
                    isClosable: true,
                });
                setPoFile();
                onCloseModalUpload()
            }
        }
    };

    const handleDeleteImage = async (orderIndex) => {
        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;

        if (header) {
            header.fileOriginalName = "";
            header.po_url = "";
            setContainerOrders(newOrders);
        }
    }



    const onUpload = async () => {
        if (poFile == null) {
            toast({
                title: "Oopsie!",
                description: 'please pick a file first!',
                status: "warning",
                duration: 2000,
                isClosable: true,
            });
        } else if (poFile.size > MAX_FILE_SIZE_BYTES) {
            toast({
                title: "Oopsie!",
                description: "File size exceeds the maximum allowed size!",
                status: "warning",
                duration: 2000,
                isClosable: true,
            });
        } else {

            const file = new FormData();
            file.append("file", poFile);
            let userToken = localStorage.getItem("tokek")
            await Axios.post(
                API_URL + "/order/upload-po/", file, {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            }
            )
                .then((res) => {
                    const newOrders = [...containerOrders];
                    const header = newOrders[orderIndex]?.order.header;

                    if (header) {
                        header.fileOriginalName = res.data.fileOriginalName;
                        header.po_url = res.data.fileUrl;


                        setContainerOrders(newOrders);
                        onCloseModalUpload()
                        toast({
                            title: "Yeay!",
                            description: res.data.message,
                            status: "success",
                            duration: 2000,
                            isClosable: true,
                        });

                        const validTypes = [
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "application/vnd.ms-excel",
                        ];


                        if (validTypes.includes(poFile.type) && spc_condition.includes(20)) {

                            onOpenModalconvertexcel()

                        }

                    }

                })
                .catch((err) => {
                    toast({
                        title: "Oopsiee!",
                        description: 'Something bad just happend! Please try again!',
                        status: "error",
                        duration: 6000,
                        isClosable: true,
                    });
                });




        }
    }


    const onConvertExcel = async () => {
        const reader = new FileReader();
        reader.onerror = (err) => {
            console.error("FileReader error", err);
            toast({
                title: "Read error",
                description: "Unable to read file",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        };

        let skuMap = {};

        try {
            let userToken = localStorage.getItem("tokek");
            const res = await Axios.get(API_URL + "/product/omcode", {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            // convert backend result -> { other_code: product_code }
            skuMap = res.data[0]?.skuMap || {};
        } catch (err) {
            console.error("Failed to fetch skuMap", err);
            toast({
                title: "Data error",
                description: "Unable to fetch SKU mapping",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }

        let portMap = {};

        try {
            let userToken = localStorage.getItem("tokek");
            const res = await Axios.get(API_URL + `/user/portfind/`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            // convert backend result -> { other_code: product_code }
            portMap = res.data;
            console.log("portMap", res.data)
        } catch (err) {
            console.error("Failed to fetch portMap", err);
            toast({
                title: "Data error",
                description: "Unable to fetch port mapping",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        }



        const newOrders = [...containerOrders];
        const header = newOrders[orderIndex]?.order.header;

        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const workbook = XLSX.read(bstr, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

            let orders = [];
            let currentOrder = null;




            const flavorLookup = flavours.reduce((lookup, flavor) => {
                lookup[flavor.product_code] = flavor;
                return lookup;
            }, {});


            // Optionally, for reverse lookups


            rows.forEach((r) => {
                const key = r[0]?.toString().trim();
                const value = r[1]?.toString().trim();

                if (!key) return;

                // ðŸ”¹ Start a new order when "Order Number:" appears
                if (key === "Order Number:") {
                    if (currentOrder) orders.push(currentOrder);

                    currentOrder = {
                        header: {
                            po_buyer: value || "",
                            port_shipment: header.port_shipment,
                            ship_to: header.ship_to,
                            final_dest: header.final_dest,
                            notify_to_1: header.notify_to_1,
                            notify_to_2: header.notify_to_2,
                            bill_to: header.bill_to,
                            po_url: header.po_url,
                            fileOriginalName: poFile?.name || "",
                        },
                        detail: {
                            cont_size: "",
                            cont_qty: "1",
                            bulk: false,
                            remarks: "",
                            containerList: [
                                { detail_id: "1", custom: false, Flavour: [] }
                            ],
                            bulkList: { detail_id: 1, custom: false, Flavour: [] }
                        },
                        summary: { detail_id: "1", Flavour: [] }
                    };
                }

                const contSizeMap = {
                    "20ft": "2",
                    "40ft": "3",
                    "40ftHQ": "4",
                    "45ftHQ": "5"
                };

                // ðŸ”¹ Map header fields
                if (currentOrder) {
                    switch (key) {
                        case "Destination Port:": {
                            const portPrefix = value.substring(0, 3).toUpperCase(); // e.g. "FMT"
                            // Find matching entry: last 3 chars of harbour_code === prefix
                            const match = portMap.find(p => {
                                const suffix = p.harbour_code.slice(-3).toUpperCase();
                                return suffix === portPrefix;
                            });

                            if (match) {
                                currentOrder.header.port_shipment_id = match.id;
                                currentOrder.header.port_shipment = match.id.toString();
                            } else {
                                console.log("No match found for prefix:", portPrefix);
                            }
                            break;
                        }
                        case "Final Dest:":
                            currentOrder.header.final_dest = value;
                            break;
                        case "Container Type:":
                            // convert container size before saving
                            currentOrder.detail.cont_size = contSizeMap[value] || value;
                            break;
                        case "Ship By:":
                            currentOrder.detail.remarks = "Ship By: " + value;
                            break;
                    }
                }

                // ðŸ”¹ SKU rows (start from table, not header section)
                if (r[0] && r[4]) {
                    const sku = r[0].toString().trim();
                    const supplier = r[2];
                    const qty = r[4];

                    // skip table header row
                    if (sku === "OM Code" || qty === "Qty(carton)") return;

                    const isSubtotal = sku.toLowerCase().includes("subtotal");

                    if (currentOrder) {
                        if (isSubtotal) {

                        } else {

                            const internalSku = skuMap[sku.toString()] || sku.toString();
                            const selectedFlavor = flavorLookup[internalSku];
                            const item = {
                                sku: internalSku.toString(),
                                qty: qty,
                                Flavour_tollingID: selectedFlavor ? selectedFlavor.tolling_id : "0",
                                qty_max: selectedFlavor ? selectedFlavor.cont40hc : 0,
                                moq: selectedFlavor ? selectedFlavor.moq : 0,
                                palete_qty: selectedFlavor ? qty / selectedFlavor.qty_per_pallet : 0,
                                qty_perpallet: selectedFlavor ? selectedFlavor.qty_per_pallet : 0,
                            };

                            currentOrder.detail.containerList[0].Flavour.push(item);

                            currentOrder.summary.Flavour.push({
                                sku: internalSku,
                                qty: qty,
                                moq: selectedFlavor ? selectedFlavor.moq : 0,
                            });
                        }
                    }
                }
            });


            // Push the last order
            if (currentOrder) orders.push(currentOrder);




            // Wrap new parsed orders
            const wrappedOrders = orders.map(o => ({ order: o }));

            // Combine with existing ones

            // âœ… Save to sessionStorage
            sessionStorage.setItem("containerOrders", JSON.stringify(wrappedOrders));
            setContainerOrders(wrappedOrders);
            onCloseModalconvertexcel()
        };

        reader.readAsBinaryString(poFile);
    };


    const {
        isOpen: isOpenModalImage,
        onOpen: onOpenModalImage,
        onClose: onCloseModalImage,
    } = useDisclosure();

    const {
        isOpen: isOpenModalconvertexcel,
        onOpen: onOpenModalconvertexcel,
        onClose: onCloseModalconvertexcel,
    } = useDisclosure();

    const fileUrl = API_URL + order.order.header.po_url;
    const lowerUrl = order.order.header.po_url.toLowerCase();

    // Check if the URL ends with a PDF extension
    const isPdf = lowerUrl.endsWith('.pdf');

    const isExcel = lowerUrl.endsWith('.csv') || lowerUrl.endsWith('.xls') || lowerUrl.endsWith('.xlsx');


    // Check for common image extensions (png, jpg, jpeg, gif)
    const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);






    return (
        <>
            <button
                className={orderIndex !== 0 ? "position-absolute top-0 start-100 translate-middle" : "d-none"}
                onClick={() => removeOrder(orderIndex)}
            >
                <AiFillCloseCircle className="remove_cont_button" size={25} />
            </button>

            <div className="row d-flex  justify-content-center grey_text_bold fs-6">
                {`Order ${orderIndex + 1}`}
            </div>

            <div className="row mx-2 pt-3">
                <div className="grey_text_bold ratakiri fs-6 d-flex col-12 col-md-2 mt-2">
                    PO Buyer&nbsp;
                    <span className="color_red">*</span>
                </div>

                <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                    <Input
                        className={`grey_text fs-6 ${hasPoBuyerError || hasExistingPoBuyerError ? 'border-danger' : 'border'}`}
                        type="text"
                        placeholder="Insert your PO here..."
                        size="sm"
                        onChange={(e) => {

                            const newPoRef = e.target.value;
                            setMatchingPoRef(
                                existingPo.some((item) => item.po_buyer.toLowerCase() === newPoRef.toLowerCase())
                            );
                            const sanitizedValue = newPoRef.replace(/[^a-zA-Z0-9\s\/\-_()]/g, "");

                            handlePoBuyerChange(sanitizedValue, orderIndex)
                        }}
                        value={order.order.header.po_buyer}
                    />



                </div>
            </div>

            <div className="row mx-2 py-2">
                <div className="grey_text_bold ratakiri fs-6 d-flex col-12 col-md-2 mt-2">
                    PO File&nbsp;

                    {/* <span className="color_red">*</span> */}
                </div>
                <div className="d-flex justify-content-start align-items-center col-md-8 col-12 ps-3 ps-md-0">

                    <button
                        className="btn btn-outline-secondary  px-2 py-1 fw-bold"
                        onClick={onOpenModalUpload}
                    >
                        Choose file...
                    </button>
                    {order.order.header.po_url.trim() === '' || !order.order.header.po_url ? null :
                        <button
                            className="btn text-muted mx-1 px-2 py-1 fw-bold fs-6"
                            target='_blank'
                            rel="noopener noreferrer"
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
                                className="btn    text-muted  mx-1 px-2 py-1 fw-bold fs-6"
                                target='blank'
                                rel="noopener noreferrer"
                                onClick={() => handleDeleteImage(orderIndex)}
                            >
                                <AiOutlineDelete className="pointer" size={25} />
                            </button>
                        </Tooltip>
                    }

                </div>
            </div>

            {/* SHIP TO PARTY */}
            <div className="row d-flex mx-2 pt-1">
                <div className="d-flex col-12 col-md-2 mt-1 ps-4">
                    <div className="grey_text_bold ratakiri fs-6 row pt-1">
                        Ship to Party
                    </div>
                </div>

                <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                    <Select
                        className="grey_text fs-6"
                        size="sm"
                        onChange={(e) => handleShipToChange(e.target.value, orderIndex)}
                        value={order.order.header.ship_to}

                    >
                        {shipToParties.map((shipToParty, shipToPartyIndex) => (
                            <option key={shipToPartyIndex} value={shipToParty.keyy}>
                                {shipToParty.txt}
                            </option>
                        ))}


                    </Select>
                </div>
            </div>

            {/* PORT */}
            <div className="row d-flex mx-2 pt-1">
                <div className="d-flex col-12 col-md-2  mt-1 ps-4">
                    <div className="grey_text_bold fs-6  ratakiri row pt-1">
                        Port
                    </div>
                </div>
                <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                    <Select
                        isDisabled={order.order.header.ship_to === "" || order.order.header.ship_to === 0 || order.order.header.ship_to === "0" || !order.order.header.ship_to}
                        className="grey_text fs-6"
                        size="sm"
                        onChange={(e) => handlePortChange(e.target.value, orderIndex)}
                        value={order.order.header.port_shipment}
                    >
                        {ports
                            .filter((port => !port.harbour_code.includes("WH-")
                                && port.port_link.toLocaleString() === order.order.header.ship_to.toLocaleString()
                            ))
                            .map((port, portIndex) => (
                                <option key={portIndex} value={port.md_id}>
                                    {port.harbour_name}
                                </option>
                            ))}


                    </Select>
                </div>
            </div>


            {/* Bill TO PARTY */}
            {!spc_condition.includes(17) ? (
                <div className="row d-flex mx-2 pt-1">
                    <div className="d-flex col-12 col-md-2 mt-1 ps-4">
                        <div className="grey_text_bold ratakiri fs-6 row pt-1">
                            Bill to Party
                        </div>
                    </div>
                    <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                        <Select
                            className="grey_text fs-6"
                            size="sm"
                            onChange={(e) => handleBillToChange(e.target.value, orderIndex)}
                            value={order.order.header.bill_to}

                        >

                            {billtoparties?.BillTP?.length > 0 ? (
                                billtoparties.BillTP.map((shipToParty, shipToPartyIndex) => (
                                    <option key={shipToPartyIndex} value={shipToParty.company_id}>
                                        {shipToParty.company_name} {shipToParty.company_notice ? `| ${shipToParty.company_notice}` : ""}
                                    </option>
                                ))
                            )
                                :
                                <option value={company_id}>
                                    {company_name}
                                </option>

                            }

                        </Select>
                    </div>
                </div>
            )
                :
                ""
            }



            {!spc_condition.includes(19) && (
                /* Notify TO PARTY 1 */
                <>

                    <div className="row d-flex mx-2 pt-1">
                        <div className="d-flex col-12 col-md-2 mt-1 ps-4">
                            <div className="grey_text_bold ratakiri fs-6 row pt-1">
                                Notify Party 1st
                            </div>
                        </div>

                        <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                            <Select
                                className="grey_text fs-6"
                                size="sm"
                                onChange={(e) => handleNotify1Change(e.target.value, orderIndex)}
                                value={order.order.header.notify_to_1}
                            >
                                <option value="">
                                    Select Notify Party
                                </option>
                                {billtoparties?.Notify?.length > 0 ? (
                                    billtoparties.Notify.map((shipToParty, shipToPartyIndex) => (
                                        <option key={shipToPartyIndex} value={shipToParty.company_id}>
                                            {shipToParty.company_name}  {shipToParty.company_notice ? `| ${shipToParty.company_notice}` : ""}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No Notify Party Listed</option>
                                )}

                            </Select>
                        </div>
                    </div>

                </>


            )
            }

            {!spc_condition.includes(19) && (
                /* Notify TO PARTY 1 */
                <>

                    <div className="row d-flex mx-2 pt-1">
                        <div className="d-flex col-12 col-md-2 mt-1 ps-4">
                            <div className="grey_text_bold ratakiri fs-6 row pt-1">
                                Notify Party 2nd
                            </div>
                        </div>

                        <div className="col-md-8 col-12 ps-2 ps-md-0 mt-1">
                            <Select
                                className="grey_text fs-6"
                                size="sm"
                                onChange={(e) => handleNotify2Change(e.target.value, orderIndex)}
                                value={order.order.header.notify_to_2}
                                isDisabled={order.order.header.notify_to_1 === "" || order.order.header.notify_to_1 === 0 || order.order.header.notify_to_1 === "0" || !order.order.header.notify_to_1}
                            >
                                <option value="">
                                    Select Notify Party
                                </option>
                                {billtoparties?.Notify?.length > 0 ? (
                                    billtoparties.Notify
                                        .filter(shipToParty => shipToParty.company_id !== parseInt(order.order.header.notify_to_1)) // Exclude selected Notify 1
                                        .map((shipToParty, shipToPartyIndex) => (
                                            <option key={shipToPartyIndex} value={shipToParty.company_id}>
                                                {shipToParty.company_name} {shipToParty.company_notice ? `| ${shipToParty.company_notice}` : ""}
                                            </option>
                                        ))
                                ) : (
                                    <option disabled>No Notify Party Listed</option>
                                )}

                            </Select>
                        </div>
                    </div>

                </>


            )
            }





            {/* CONT SIZE - CONT QTY - BULK CHECKBOX */}
            <div className="row d-flex mx-2 mt-2">
                <div className="d-flex col-12 col-md-2 ps-4">
                    <div className="grey_text_bold fs-6 ratakiri row pt-1">
                        Container Size
                    </div>
                </div>

                <div className="col-12 ps-2 ps-md-0 my-1 col-md-3">
                    <Select
                        className="grey_text fs-6"
                        size="sm"
                        onChange={(e) => handleContainerSizeChange(e.target.value, orderIndex)}
                        value={order.order.detail.cont_size}

                    >

                        {containers.sort((a, b) => {
                            if (a.container_id === 4) return -1; // a comes before b
                            if (b.container_id === 4) return 1; // b comes before a
                            return 0; // No change in order
                        }).map((cnt_size, cntidx) => (
                            <option
                                key={cntidx}
                                value={cnt_size.container_id}
                                className={[16].includes(cnt_size.container_id) ? "d-none" : ""}

                            >
                                {cnt_size.container_name}
                            </option>
                        ))}

                    </Select>
                </div>



                <div className="grey_text ratakiri align-items-center fs-6 d-flex col-6 col-md-2 ">
                    Container Qty
                </div>

                <div className="col-6 col-md-3 d-flex justify-content-end mt-2 mt-md-0">
                    <Tooltip
                        label="Maximum 20 Containers"
                        hasArrow
                        arrowSize={15}
                    >
                        <div className="input-group border border-muted border-radius d-flex custom_numberinput_height">
                            <button
                                className="input-group-text border-0 px-0 border-radius w-25 d-flex justify-content-center h-100"
                                onClick={() => removeContainer(order.length, orderIndex)}
                            >
                                -
                            </button>
                            <input
                                className="grey_text fs-6 text-center form-control px-1 border-0 border border-muted border-radius h-100"
                                type="number"
                                min="1"
                                max="20"
                                value={order.order.detail.cont_qty}
                                onChange={(e) => handleChangeContainerLength(e.target.value, orderIndex)}
                            />
                            <button
                                className="input-group-text border-0 px-0 border-radius w-25 d-flex justify-content-center h-100
                                          "
                                onClick={() => addContainer(orderIndex)}
                            >
                                +
                            </button>
                        </div>
                    </Tooltip>
                </div>

                {/* {!editCart.editStatus && ( */}
                <div className="col-md-2 col-12 justify-content-end form-check pt-1 position-relative d-flex align-items-center">
                    <div>
                        <input
                            className="form-check-input "
                            type="checkbox"
                            checked={order.order.detail.bulk === "1" || order.order.detail.bulk === true}
                            onChange={(e) => handleBulkChange(e.target.checked, orderIndex)}
                        />
                    </div>
                    <label className="text-nowrap grey_text fs-6 ms-2">
                        Bulk Order
                    </label>
                </div>

                {/* )} */}
            </div>

            <Modal
                // initialFocusRef={initialRefConfirm}
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
                            <span className="  py-0">
                                You can add file that refers the PO. <br />
                                The file extention must be *.pdf, *.jpg, *.jpeg, *.docx, *.xlsx <br />
                                The maximum file size is 1MB
                            </span>
                            <br></br>
                            <input
                                type="file"
                                accept=".jpg, .jpeg, .png, .pdf, .docx, .doc, .xls, .xlsx"
                                ref={fileInputRef}
                                // onChange={(event) => setPoFile(event.target.files[0])}
                                onChange={handleFileUpload}
                            />
                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button className="btn btn-danger px-2 mx-1" onClick={onUpload}>Upload</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>


            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalImage}
                onClose={onCloseModalImage}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>PO File Review</ModalHeader>
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


            <Modal
                // initialFocusRef={initialRefConfirm}
                isOpen={isOpenModalconvertexcel}
                onClose={onCloseModalconvertexcel}
                motionPreset="slideInBottom"
                size="xl"
            >
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>Excel Feature</ModalHeader>
                        <ModalCloseButton onClick={onCloseModalconvertexcel} />
                        <ModalBody>
                            <span className="  py-0">
                                Hello User, i can help you to try to convert excel format into our
                                order data, would you try ?
                            </span>

                        </ModalBody>
                        <ModalFooter className="px-3">
                            <button className="btn btn-danger px-4 mx-1" onClick={onConvertExcel}>yes</button>
                            <button className="btn btn-secondary px-4 mx-1" onClick={onCloseModalconvertexcel}>No</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            </Modal>

            {/* test */}
        </>
    )
}
export default AddMoreContainerHeader




