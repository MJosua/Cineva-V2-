import React, { useRef, useState } from "react";
import axios from "axios";
import { API_URL } from "../../../config";
import { useLocation } from "react-router-dom"

import {
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  useToast,
  Button,
} from "@chakra-ui/react";


import Sidebar from "../../../components/layout/Sidebar.jsx";


function ImageUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef();
  const location = useLocation();
  const meta = {
    title: `${location.pathname} page Indofood`,
    description: `Page of ${location.pathname} from Indofood`,
    canonical: `https://www.indofoodinternational.com/e-order${location.pathname}`,
    meta: {
      charset: 'utf-8',
      name: {
        keywords: 'react,meta,document,html,tags'
      }
    }
  };
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };
  const onOpen = () => {
    window.location.replace(
      "http://172.16.32.71:8888/image/feedback/feedback-1693380574465.png"
    );
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await axios.post(API_URL + "/public/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("Upload success:", response.data);
    } catch (error) {
      console.error("Upload error:", error);
    }

    // console.log("formData", formData);
  };
  // let url = 'http://172.16.32.71:8888/image/feedback/feedback-1693380574465.png'
  let url =
    "http://172.16.32.71:8888/image/feedback/feedback-1693380574465.png";

  //MODAL UPLOAD
  const {
    isOpen: isOpenModalUpload,
    onOpen: onOpenModalUpload,
    onClose: onCloseModalUpload,
  } = useDisclosure();

  return (
    <div>


      {/* MODAL UPLOAD  */}
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
                You can add file that refers the PO.  <br/>The file extention must be *.pdf, *.jpg, *.jpeg, *.docx, *.xlsx
              </span> 
              <input type="file"/>
            </ModalBody>
            <ModalFooter className="px-3">
              
              <button className="btn btn-danger px-2 mx-1">
                Upload
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      </Modal>
      {/* <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
      /> */}
      <button classname="btn my-2" onClick={handleUpload}>
        Upload
      </button>
      <button classname="btn my-2" onClick={onOpen}>
        buka
      </button>
      <button classname="btn my-2 " onClick={ onOpenModalUpload}>
        Choose file...
      </button>
      <img url={url} alt="kok gue lagi sih" />
      <Image
        boxSize="200px"
        src="http://172.16.32.71:8888/image/feedback/feedback-1693380574465.png"
        alt="Dan Abramov"
      />
    </div>
  );
}

export default ImageUploader;






