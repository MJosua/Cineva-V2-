import { Button } from '@chakra-ui/react';
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const PdfViewer = ({ file }) => {
    const [numPages, setNumPages] = useState(null);
    const [pageWidth, setPageWidth] = useState(0);
    const containerRef = useRef(null);

    // Update pageWidth to follow parent's width
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setPageWidth(containerRef.current.offsetWidth);
            }
        };

        // Initial measurement
        updateWidth();

        // Update on window resize
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleDownload = () => {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = file;
        // Extract file name from URL
        const fileName = file.split('/').pop();
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div
            ref={containerRef}
            style={{
                width: '100%', // Container takes 100% width of its parent
                margin: '0 auto',
                border: '1px solid #ccc',
                padding: '0',
                maxHeight: "70vh",
                overflowY: "auto",
                overflowX: "hidden"
            }}
        >
            {/* <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <Button colorScheme='teal' onClick={handleDownload} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>
                    Download PDF
                </Button>
            </div> */}

            <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                {numPages &&
                    Array.from(new Array(numPages), (el, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={pageWidth}
                            renderTextLayer={false}
                        />
                    ))}
            </Document>
        </div>
    );
};

export default PdfViewer;




