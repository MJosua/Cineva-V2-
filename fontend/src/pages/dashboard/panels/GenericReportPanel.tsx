// src/pages/dashboard/panels/GenericReportPanel.tsx
// Renders a data table using DataTableReportPro from config
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableReportPro } from '@/components/report/DataTableReport';

interface ColumnConfig {
    header: string;
    accessor: string;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    align?: 'left' | 'center' | 'right';
}

interface GenericReportPanelProps {
    config: {
        apiEndpoint?: string;
        columns?: ColumnConfig[];
        searchKeys?: string[];
        ticketKey?: string;
        detailKey?: string;
    };
    serviceId?: number;
}

const GenericReportPanel: React.FC<GenericReportPanelProps> = ({ config, serviceId }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        apiEndpoint,
        columns = [],
        searchKeys = [],
        ticketKey = 'ticket_id',
        detailKey = 'id'
    } = config;

    useEffect(() => {
        fetchData();
    }, [serviceId, apiEndpoint]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');

            // Build endpoint with service_id replacement
            const endpoint = apiEndpoint?.replace('{service_id}', String(serviceId))
                || `/hotsdashboard/service_tickets/${serviceId}`;

            const res = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setData(res.data.results || []);
            } else if (Array.isArray(res.data.results)) {
                setData(res.data.results);
            }
        } catch (err) {
            console.error('Error fetching report data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-96 w-full" />;
    }

    // Default columns if none provided
    const defaultColumns: ColumnConfig[] = [
        { header: 'Ticket ID', accessor: 'ticket_id', sortable: true },
        { header: 'Title', accessor: 'title' },
        { header: 'Status', accessor: 'status_name', filterable: true },
        { header: 'Requester', accessor: 'requester_name' },
        { header: 'Created', accessor: 'creation_date', sortable: true },
    ];

    const tableColumns = columns.length > 0 ? columns : defaultColumns;

    return (
        <div className="w-full overflow-hidden">
            <DataTableReportPro
                title=""
                data={data}
                setData={setData}
                ticketKey={ticketKey}
                detailKey={detailKey}
                columns={tableColumns}
                searchKeys={searchKeys.length > 0 ? searchKeys : ['ticket_id', 'title']}
            />
        </div>
    );
};

export default GenericReportPanel;
