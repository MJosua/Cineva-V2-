import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { Table, Thead, Tbody, Tr, Th, Td, Image, Box } from "@chakra-ui/react";

const ExcelToImage = ({ fileUrl }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const tableRef = useRef(null);
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);

    useEffect(() => {
        fetch(fileUrl)
            .then((response) => response.arrayBuffer())
            .then((buffer) => {
                const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                // 🔹 Remove empty rows (where all cells are empty)
                jsonData = jsonData.filter((row) => row.some((cell) => cell !== ""));

                if (jsonData.length > 0) {
                    const maxColumns = Math.max(...jsonData.map((row) => row.length));

                    // Normalize all rows to have the same number of columns
                    const normalizedData = jsonData.map((row) => {
                        while (row.length < maxColumns) {
                            row.push(""); // Fill missing cells with empty strings
                        }
                        return row;
                    });

                    setHeaders(normalizedData[0]);
                    setData(normalizedData.slice(1));
                }
            })
            .catch((error) => console.error("Error loading Excel:", error));
    }, [fileUrl]);

    useEffect(() => {
        // Convert the table to an image after data is loaded
        if (data.length > 0 && tableRef.current) {
            html2canvas(tableRef.current, { scale: 2 }).then((canvas) => {
                setImageSrc(canvas.toDataURL("image/png"));
            });
        }
    }, [data]);

    return (
        <div>
            <h3>Excel File Preview</h3>
            {imageSrc ? (
                <Box
                    overflow="hidden"
                    _hover={{ transform: "scale(2)" }} // Zoom on hover
                    transition="transform 0.3s ease-in-out"
                    cursor="zoom-in"
                    display="inline-block"
                >
                    <Image
                        src={imageSrc}
                        alt="Excel Table"
                        width="100%"
                        border="1px solid #ccc"
                    />
                </Box>
            ) : (
                <p>Loading...</p>
            )}

            {/* Invisible Table (Only Used for Image Capture) */}
            <div ref={tableRef} style={{ position: "absolute", left: "-9999px" }}>
                <Table variant="simple" size="sm" width="100%" bg="white">
                    <Thead>
                        <Tr>
                            {headers.map((header, index) => (
                                <Th key={index}>{header || " "}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.map((row, rowIndex) => (
                            <Tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <Td key={cellIndex.toLocaleString()}>{cell || " "}</Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>
        </div>
    );
};

export default ExcelToImage;
