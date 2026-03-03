import { Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tooltip, useDisclosure, useToast } from '@chakra-ui/react';
import React, { useState } from 'react';
import Axios from 'axios';
import { API_URL } from "../../../../config";
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useData } from "../../../auth/components/CheckToken/FetchData/DataContext";
import { AiFillFile, AiOutlineDelete } from 'react-icons/ai';
import PdfViewer from "../../../../components/media/PDFViewer/PdfViewer";



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

function AddMoreTruckHeader({
  truckOrders,
  orderIndex,
  shipToParties,
  ports,
  stuffingDate,
  setPorts,
  setShipToParties,
  setLoading,
  setTruckOrders,
  seasonOut,
  setStuffingDate,
  order,
  reset,
  billtoparties,
  setbilltoparties,

}) {


  const { company_name, company_id, user } = useSelector((state) => {
    return {
      company_name: state.userReducer.company_name,
      company_id: state.userReducer.company_id,
      user: state.userReducer.user,


    }
  });

  const { container, ostp, stuffingDateList } = useData();


  const truncatedData = truncateText(company_name, 36);

  const toast = useToast();

  useEffect(() => {

    setbilltoparties(ostp);

    if (ostp.length > 1) {
      setTruckOrders(prevOrders =>
        prevOrders.map(order => {
          const newOrder = { ...order };
          if (!newOrder.bill_to) {
            newOrder.bill_to = company_id;
          }
          return newOrder;
        })
      );

    }
  }, [ostp])

  useEffect(() => {

    setStuffingDate(stuffingDateList);

  }, [stuffingDateList])

  const fileInputRef = React.useRef();




  useEffect(() => {
    if (shipToParties.length > 1) {

      setTruckOrders(prevOrders =>
        prevOrders.map(order => {
          const newOrder = { ...order };
          if (!newOrder.shipToParty) {
            newOrder.shipToParty = shipToParties[0].keyy.toLocaleString();
          }
          return newOrder;
        })
      );

    }


  }, [shipToParties, ports])



  const handlepo_buyerChange = (orderIndex, value) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].po_buyer = value;
    setTruckOrders(newOrders);
  };

  const handleOrderDateChange = (orderIndex, value) => {
    const selectedDate = value;
    const newOrders = [...truckOrders];
    // Check if the selected date is before the minimum date
    if (stuffingDate[0]?.minDate && selectedDate < stuffingDate[0].minDate) {
      // If selected date is before minimum date, reset input value to minimum date
      newOrders[orderIndex].delv_date = stuffingDate[0].minDate;
    } else {
      // Otherwise, update the delivery date state with the selected date
      newOrders[orderIndex].delv_date = selectedDate;
    }

    setTruckOrders(newOrders);
  };

  const handleshipToPartyChange = (orderIndex, value) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].shipToParty = value;
    setTruckOrders(newOrders);
  };

  const handleBillToChange = (value, orderIndex) => {
    // console.log("testShipTo", value)
    const newOrders = [...truckOrders];
    newOrders[orderIndex].bill_to = value;
    setTruckOrders(newOrders);
  };

  const handleNotify1Change = (value, orderIndex) => {
    // console.log("testShipTo", value)
    const newOrders = [...truckOrders];
    newOrders[orderIndex].notify_to_1 = value;

    if (newOrders[orderIndex].notify_to_1 === newOrders[orderIndex].notify_to_2) {
      newOrders[orderIndex].notify_to_2 = "";
    }
    setTruckOrders(newOrders);

  };

  const handleNotify2Change = (value, orderIndex) => {
    // console.log("testShipTo", value)
    const newOrders = [...truckOrders];
    newOrders[orderIndex].notify_to_2 = value;
    setTruckOrders(newOrders);

  };

  const handlePortChange = (orderIndex, value, name) => {
    const newOrders = [...truckOrders];
    newOrders[orderIndex].port = value;
    newOrders[orderIndex].final_dest = name;
    setTruckOrders(newOrders);
  };

  const dateNow = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


  const validateInputPoBuyer = (value) => {
    // Simple validation example: allow only alphanumeric characters and some special characters
    const regex = /^[a-zA-Z0-9\s\/\\\-_()]*$/
    if (!regex.test(value)) {
      toast({
        title: "Error!",
        description: `Input Can't Use That Special Character`,
        status: "error",
        duration: 6000,
        isClosable: true
      });
      return false;
    } else {
      return true;

    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0]; // Formats as "YYYY-MM-DD"
  };

  const {
    isOpen: isOpenModalUpload,
    onOpen: onOpenModalUpload,
    onClose: onCloseModalUpload,
  } = useDisclosure();

  const {
    isOpen: isOpenModalImage,
    onOpen: onOpenModalImage,
    onClose: onCloseModalImage,
  } = useDisclosure();

  const handleDeleteImage = async (orderIndex) => {
    const newOrders = [...truckOrders];
    const header = newOrders[orderIndex];

    if (header) {
      header.fileOriginalName = "";
      header.po_url = "";
      setTruckOrders(newOrders);
    }
  }

  const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;
  const [poFile, setPoFile] = useState(null);
  const fileUrl = API_URL + order.po_url;
  const lowerUrl = order.po_url.toLowerCase();
  // Check if the URL ends with a PDF extension
  const isPdf = lowerUrl.endsWith('.pdf');
  // Check for common image extensions (png, jpg, jpeg, gif)
  const isImage = /\.(png|jpe?g|gif)$/.test(lowerUrl);

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
          const newOrders = [...truckOrders];
          const header = newOrders[orderIndex];

          if (header) {
            header.fileOriginalName = res.data.fileOriginalName;
            header.po_url = res.data.fileUrl;


            setTruckOrders(newOrders);
            onCloseModalUpload()
            toast({
              title: "Yeay!",
              description: res.data.message,
              status: "success",
              duration: 2000,
              isClosable: true,
            });
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

  return (
    <div className='container px-5 position-relative'>
      <div className='row mx-3 pt-3'>
        <div className="col-12 d-flex  justify-content-center grey_text_bold fs-6 mb-2">
          {`Truck ${orderIndex + 1}`}
        </div>
        <div className="col-4 col-md-2 grey_text_bold d-flex align-items-center  ratakiri fs-6 d-flex px-0">
          PO Buyer
          <span className="color_red">
            *
          </span>
        </div>

        <div className='col-8  px-4'>
          <Input
            className="grey_text fs-6"
            size="sm"
            type="text"
            placeholder="Order ID"
            value={order.po_buyer}
            onChange={(e) => {
              const value = e.target.value;
              if (validateInputPoBuyer(value)) {
                handlepo_buyerChange(orderIndex, value);
              }
            }}
          />

        </div>

      </div>

      <div className="row mx-3 pt-3">
        <div className="col-4 col-md-2 grey_text_bold d-flex align-items-center  ratakiri fs-6 d-flex px-0">
          PO File

          {/* <span className="color_red">*</span> */}
        </div>
        <div className="col-8  px-4 d-flex justify-content-start">

          <button
            className="btn btn-outline-secondary  px-2 py-1 fw-bold"
            onClick={onOpenModalUpload}
          >
            Choose file...
          </button>
          {order.po_url.trim() === '' || !order.po_url ? null :
            <button
              className="btn text-muted mx-1 px-2 py-1 fw-bold fs-6"
              target='_blank'
              rel="noopener noreferrer"
              onClick={() => onOpenModalImage()}
            >
              {!order.fileOriginalName ? (
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
                order.fileOriginalName
              )}
            </button>
          }
          {order.po_url.trim() === '' || !order.po_url ? null :
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

      <div className='row mx-3 pt-3'>

        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex  px-0">
          Delivery Date
        </div>

        <Tooltip label="You can't do back order date, the system will automatically correct it" placement='right'>

          <div className='col-8  px-4'>
            <Input
              className="grey_text fs-6"
              type="date"
              size="sm"
              placeholder="mm/dd/yyyy"
              min={company_id.toString() === "118" ? getTomorrowDate() : stuffingDate[0]?.min_date}
              // max={company_id.toString() === "118" ? "" : stuffingDate[0]?.max_date}
              value={order.delv_date}
              onChange={(e) => handleOrderDateChange(orderIndex, e.target.value)}

            />
          </div>

        </Tooltip>
      </div>
      <div className='row mx-3 pt-3'>
        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex px-0">
          Ship to Party

        </div>

        <div className='col-8  px-4'>
          <Select
            className="grey_text fs-6"
            type="text"
            size="sm"
            value={order.shipToParty}
            onChange={(e) => handleshipToPartyChange(orderIndex, e.target.value)}
          >

            {shipToParties.map((shipToParty, shipToPartyIndex) => (
              <option key={shipToPartyIndex} value={shipToParty.keyy}>
                {shipToParty.txt}
              </option>
            ))}
          </Select>

        </div>

      </div>



      {/* Bill TO PARTY */}
      <div className='row mx-3 pt-3'>
        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex px-0">
          Bill To Party
        </div>

        <div className='col-8  px-4'>
          <Select
            className="grey_text fs-6"
            size="sm"
            onChange={(e) => handleBillToChange(e.target.value, orderIndex)}
            value={order.bill_to}

          >
            <option value={company_id}>{truncatedData}</option>


            {billtoparties?.BillTP?.length > 0 && (
              billtoparties.BillTP.map((shipToParty, shipToPartyIndex) => (
                <option key={shipToPartyIndex} value={shipToParty.company_id}>
                  {shipToParty.company_name} {shipToParty.company_notice ? `| ${shipToParty.company_notice}` : ""}
                </option>
              ))
            )}



          </Select>
        </div>

      </div>

      {/* Notify TO PARTY 1 */}
      <div className='row mx-3 pt-3'>
        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex px-0">
          Notify Party 1st
        </div>

        <div className='col-8  px-4'>
          <Select
            className="grey_text fs-6"
            size="sm"
            onChange={(e) => handleNotify1Change(e.target.value, orderIndex)}
            value={order.notify_to_1}
          >
            <option value="0">
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

      {/* Notify TO PARTY 2 */}
      <div className='row mx-3 pt-3'>
        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex px-0">
          Notify Party 2nd
        </div>

        <div className='col-8  px-4'>
          <Select
            className="grey_text fs-6"
            size="sm"
            onChange={(e) => handleNotify2Change(e.target.value, orderIndex)}
            value={order.notify_to_2}
          >
            <option value="0">
              Select Notify Party
            </option>
            {billtoparties?.Notify?.length > 0 ? (
              billtoparties.Notify
                .filter(shipToParty => shipToParty.company_id !== parseInt(order.notify_to_1)) // Exclude selected Notify 1
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


      <div className='row mx-3 pt-3'>
        <div className="col-4 col-md-2 grey_text_bold ratakiri fs-6 d-flex px-0">
          Destination
        </div>

        <div className='col-8  px-4'>
          <Select
            className="grey_text fs-6"
            type="text"
            size="sm"
            value={order.port}
            onChange={(e) => {
              const selectedOption = e.target.options[e.target.selectedIndex];
              const harbourName = selectedOption.getAttribute('data-harbour-name');
              handlePortChange(orderIndex, e.target.value, harbourName);

            }
            }
          >
            <option value="-1">
              Please select destination
            </option>
            {ports
              .filter((port => port.harbour_code.includes("WH-")))
              .map((ports, portsIndex) => (
                <option
                  key={portsIndex}
                  value={ports.md_id.toString()}
                  data-harbour-name={ports.harbour_name}
                >
                  {ports.harbour_name}
                </option>
              ))}
          </Select>
        </div>


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

    </div>
  );
}

export default AddMoreTruckHeader;





