// src/pages/dashboard/report/reportsrf.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableReportPro } from "@/components/report/DataTableReport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataToolbar } from "@/components/report/DataToolbar";

interface SRFReportRow {
    "SRF No.": string;
    "Year": number;
    "Tgl Email SRF": string;
    "Requester": string;
    "Distributor": string;
    "Country": string;
    "Purpose": string;
    "Product Category": string;
    "Sample Category": string;
    "Factory": string;
    "PO Req": string;
    "Week": string;
    "Declare on Shipping Docs": string;
    "Item Name": string;
    "QTY Req": string;
    "Status ID": number;
    "Tanggal Created": string;
}

const ReportSRF: React.FC = () => {
    const [data, setData] = useState<SRFReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Filters
    const [selectedYear, setSelectedYear] = useState<string>("-1");
    const [selectedType, setSelectedType] = useState<string>("-1");
    const [searchDistributor, setSearchDistributor] = useState<string>("");
    const [searchCountry, setSearchCountry] = useState<string>("");

    // 🔹 Pagination
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pagination, setPagination] = useState({ total: 0, page: 1 });

    // ✅ Helper: clean up query params (skip -1 or empty)
    const buildQueryParams = () => {
        const query: Record<string, string> = {
            page: String(currentPage),
            limit: "1000",
        };
        if (selectedYear !== "-1" && selectedYear) query.year = selectedYear;
        if (selectedType !== "-1" && selectedType) query.type = selectedType;
        if (searchDistributor.trim() !== "") query.distributor = searchDistributor;
        if (searchCountry.trim() !== "") query.country = searchCountry;

        return new URLSearchParams(query).toString();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("tokek");

                const queryString = buildQueryParams();
                const url = `${API_URL}/hotsdashboard/report_srf?${queryString}`;

                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.data || !Array.isArray(res.data.results)) {
                    console.warn("⚠️ Unexpected API response:", res.data);
                    setData([]);
                    return;
                }

                setData(res.data.results);
                setPagination({ total: res.data.total || 0, page: res.data.page || 1 });
            } catch (err) {
                console.error("❌ Error fetching SRF Report:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [
        selectedYear,
        selectedType,
        searchDistributor,
        searchCountry,
        currentPage,
    ]);

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
        <div className="space-y-4">
            {/* 🔍 Filter Controls */}
            {/* Distributor Search */}
            <DataToolbar
                items={[
                    {
                        id: "typeSelect",
                        type: "select",
                        label: "Select Type",
                        value: selectedType,
                        onChange: setSelectedType,
                        order: 3,
                        width: "w-52",
                        options: [
                            { label: "All Types", value: "-1" },
                            { label: "Finished Goods", value: "FG" },
                            { label: "Raw Materials", value: "RM" },
                        ],
                    },


                ]}
            />

            {/* 📊 Table */}
            <div className="relative w-full max-w-[90vw] overflow-hidden">
                <DataTableReportPro
                    title="SRF Report Summary"
                    data={data}
                    setData={setData}   // ✅ add this line
                    ticketKey="SRF No."
                    detailKey="detail_id"
                    columns={[
                        { header: "SRF No.", accessor: "SRF No.", sortable: true },
                        { header: "Year", accessor: "Year", sortable: true, filterable: true },
                        { header: "Distributor", accessor: "Distributor", filterable: true },
                        { header: "Country", accessor: "Country", filterable: true },
                        { header: "Product Category", accessor: "Product Category", filterable: true },
                        { header: "Material Code", accessor: "Material Code" },
                        { header: "Product", accessor: "Product" },
                        { header: "QTY Req", accessor: "QTY Req", align: "right", sortable: true },
                        { header: "Satuan", accessor: "Satuan", align: "right", sortable: true },
                        { header: "Factory", accessor: "Factory", filterable: true },
                        { header: "Factory", accessor: "Factory", filterable: true },
                        { header: "Remarks", accessor: "Remarks", editable: true, sticky: "right-[70px]" },
                        { header: "Color", accessor: "Color", editable: true, sticky: "right-[0px]", colorField: "Color" },
                    ]}
                    searchKeys={[
                        "Distributor",
                        "Country",
                        "Product Category",
                        "Item Name",
                        "SRF No.",
                    ]}
                />
            </div>
        </div>
    );
};

export default ReportSRF;
