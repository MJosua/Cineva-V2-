import { useState } from 'react';
import Axios from 'axios';
import * as XLSX from "xlsx";
import { useToast } from "@chakra-ui/react";
import { API_URL } from "../../../config";

export const useExcelImport = () => {
    const toast = useToast();

    const convertExcel = async (poFile, containerOrders, setContainerOrders, orderIndex, flavours, onCloseModalconvertexcel) => {
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
            return; // Exit if failed
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
            return; // Exit if failed
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

            rows.forEach((r) => {
                const key = r[0]?.toString().trim();
                const value = r[1]?.toString().trim();

                if (!key) return;

                // Start a new order when "Order Number:" appears
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

                // Map header fields
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
                        default:
                            break;
                    }
                }

                // SKU rows (start from table, not header section)
                if (r[0] && r[4]) {
                    const sku = r[0].toString().trim();
                    const qty = r[4];

                    // skip table header row
                    if (sku === "OM Code" || qty === "Qty(carton)") return;

                    const isSubtotal = sku.toLowerCase().includes("subtotal");

                    if (currentOrder) {
                        if (isSubtotal) {
                            // Handle subtotal if needed
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

            // Save to sessionStorage
            sessionStorage.setItem("containerOrders", JSON.stringify(wrappedOrders));
            setContainerOrders(wrappedOrders);
            onCloseModalconvertexcel();
        };

        reader.readAsBinaryString(poFile);
    };

    return { convertExcel };
};
