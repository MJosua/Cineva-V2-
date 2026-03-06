import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import { DataTableReportPro } from "@/components/report/DataTableReport";
import { API_URL } from "@/config/sourceConfig";

export default function UniversalReportPage() {
    const { service_id } = useParams();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [service_id, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("hots_tokek");

            // Pass through query params like ?status_id=2
            const queryString = searchParams.toString();
            const res = await axios.get(
                `${API_URL}/engine/report/${service_id}?${queryString}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.data) {
                const { columns: rawCols, rows } = res.data.data;

                // Transform columns for DataTable
                const tableCols = rawCols.map((key: string) => ({
                    header: key.replace(/_/g, ' ').toUpperCase(),
                    accessor: key,
                    sortable: true,
                    filterable: true,
                    // Make dynamic fields editable (heuristic: not standard headers)
                    editable: !['ticket_id', 'service_name', 'status_name', 'creation_date', 'creator_name'].includes(key)
                }));

                setColumns(tableCols);
                setData(rows);
            }
        } catch (err) {
            console.error("Error fetching report:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading Report...</div>;

    return (
        <div className="p-6 bg-white min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Universal Service Report</h1>
            <DataTableReportPro
                title={`Service ${service_id} Report`}
                data={data}
                setData={setData}
                columns={columns}
                searchKeys={['ticket_id', 'status_name']}
                ticketKey="ticket_id"
                // Use new Core Engine Update Endpoint
                updateUrl={`${API_URL}/engine/report/update`}
            />
        </div>
    );
}
