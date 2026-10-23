// src/pages/dashboard/report/SRFReportPage.tsx
// SRF (Sample Request Form) Report Dashboard with real-time data
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FileText, CheckCircle, Clock, XCircle, Search, Download, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal } from 'lucide-react';

interface SRFData {
    'SRF No.': string;
    'Tgl Email SRF': string;
    'Distributor': string;
    'Country': string;
    'Product Category': string;
    'Sample Category': string;
    'Product': string;
    'Status': string;
    'Material Code'?: string;
    'Factory'?: string;
    'PO Req'?: string;
    'Week'?: string;
    'QTY Req'?: string;
    'Color'?: string;
    'Remarks'?: string;
    [key: string]: any;
}

interface Summary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
};

const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

// Define all available columns matching srf_report VIEW + custom work_data columns
const AVAILABLE_COLUMNS = [
    { key: 'SRF No.', label: 'SRF No.', default: true },
    { key: 'Tgl Email SRF', label: 'Date', default: true },
    { key: 'Requester', label: 'Requester', default: false },
    { key: 'Deliver To', label: 'Deliver To', default: false },
    { key: 'Distributor', label: 'Distributor', default: true },
    { key: 'Country', label: 'Country', default: true },
    { key: 'Destination', label: 'Destination', default: false, isCustom: true },
    { key: 'Purpose', label: 'Purpose', default: false },
    { key: 'Product Category', label: 'Prod. Category', default: false },
    { key: 'Sample Category', label: 'Sample Category', default: true },
    { key: 'Factory', label: 'Factory', default: true },
    { key: 'PO Req', label: 'PO Req', default: true },
    { key: 'Week', label: 'Week', default: true },
    { key: 'Week RDD', label: 'Week RDD', default: false, isCustom: true },
    { key: 'Item Name', label: 'Item Name', default: false },
    { key: 'Material Code', label: 'Mat. Code', default: true },
    { key: 'Product', label: 'Product', default: true },
    { key: 'QTY Req', label: 'QTY Req', default: true },
    { key: 'QTY Act', label: 'QTY Act', default: false, isCustom: true },
    { key: 'Qty Outstanding', label: 'Outstanding', default: false, isCustom: true },
    { key: 'Satuan', label: 'UoM', default: true },
    { key: 'Reason', label: 'Reason', default: false },
    { key: 'Lead Time Approval (Factory)', label: 'Lead Time', default: false },
    { key: 'Realisasi Stuffing', label: 'Real. Stuffing', default: false, isCustom: true },
    { key: 'OASYS', label: 'OASYS', default: false, isCustom: true },
    { key: 'Color', label: 'Color', default: true },
    { key: 'Remarks', label: 'Remarks', default: true },
    { key: 'Status', label: 'Status', default: true },
];

interface SRFReportPageProps {
    searchValue?: string;
    serviceId?: number; // Added for consistency with other panels
}

const SRFReportPage: React.FC<SRFReportPageProps> = ({ searchValue }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SRFData[]>([]);
    const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [filters, setFilters] = useState({
        year: new Date().getFullYear().toString(),
        distributor: '',
        country: '',
        type: ''
    });
    // Tab state: 'FG' (default), 'RM'
    const [activeTab, setActiveTab] = useState('FG');

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        total: 0
    });

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const initial = {};
        AVAILABLE_COLUMNS.forEach(col => initial[col.key] = col.default);
        return initial;
    });

    const token = localStorage.getItem('hots_tokek');

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(filters.year && { year: filters.year }),
                ...(filters.distributor && { distributor: filters.distributor }),
                ...(filters.country && { country: filters.country }),
                ...(filters.type && { type: filters.type }),
                // Pass category based on activeTab
                ...(activeTab !== 'all' && { category: activeTab }),
                // Global Search
                ...(searchValue && { search: searchValue })
            });

            const res = await axios.get(`${API_URL}/hotsdashboard/report_srf?${params}`, { headers });

            if (res.data.success) {
                setData(res.data.results || []);
                setPagination(prev => ({ ...prev, total: res.data.total }));

                // Use stats from backend if available, otherwise 0
                if (res.data.stats) {
                    setSummary(res.data.stats);
                }
            }
        } catch (err) {
            console.error('Error fetching SRF report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, pagination.page, activeTab, searchValue]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    // Render logic for different column types
    const renderCell = (row: SRFData, colKey: string) => {
        if (colKey === 'Tgl Email SRF') return formatDate(row[colKey]);
        if (colKey === 'Realisasi Stuffing') return row[colKey] ? formatDate(row[colKey]) : '-'; // Assuming it's a date or excel serial
        if (colKey === 'Status') {
            return (
                <Badge variant={
                    row['Status']?.toLowerCase()?.includes('approved') ? 'default' :
                        row['Status']?.toLowerCase()?.includes('reject') ? 'destructive' :
                            'secondary'
                }>
                    {row['Status'] || 'Unknown'}
                </Badge>
            );
        }
        return row[colKey] || '-';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">SRF Ticket Report</h1>
                    <p className="text-sm text-muted-foreground">Sample Request Form tracking and analytics</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Total SRF
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">{formatNumber(summary.total)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{activeTab === 'all' ? 'All categories' : activeTab}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Pending
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-yellow-600">{formatNumber(summary.pending)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Awaiting approval</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Approved
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600">{formatNumber(summary.approved)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Completed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            Rejected
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold text-red-600">{formatNumber(summary.rejected)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Declined</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="FG" value={activeTab} onValueChange={(val) => { setActiveTab(val); setPagination(p => ({ ...p, page: 1 })); }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="FG">Finished Goods</TabsTrigger>
                        <TabsTrigger value="RM">Raw Material</TabsTrigger>
                    </TabsList>

                    {/* Column Visibility Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px] h-[300px] overflow-y-auto">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {AVAILABLE_COLUMNS.map((col) => (
                                <DropdownMenuCheckboxItem
                                    key={col.key}
                                    checked={visibleColumns[col.key]}
                                    onCheckedChange={() => toggleColumn(col.key)}
                                >
                                    {col.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-wrap gap-4">
                                <Select value={filters.year} onValueChange={(v) => handleFilterChange('year', v)}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(y => (
                                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search distributor..."
                                        className="pl-9 w-48"
                                        value={filters.distributor}
                                        onChange={(e) => handleFilterChange('distributor', e.target.value)}
                                    />
                                </div>

                                <Input
                                    placeholder="Country..."
                                    className="w-32"
                                    value={filters.country}
                                    onChange={(e) => handleFilterChange('country', e.target.value)}
                                />

                                <Input
                                    placeholder="Product type..."
                                    className="w-40"
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange('type', e.target.value)}
                                />

                                <Button variant="outline" onClick={() => setFilters({ year: '', distributor: '', country: '', type: '' })}>
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{activeTab === 'RM' ? 'Raw Material' : 'Finished Goods'} Records</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {AVAILABLE_COLUMNS.map(col => visibleColumns[col.key] && (
                                                <TableHead key={col.key}>{col.label}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    {AVAILABLE_COLUMNS.map(col => visibleColumns[col.key] && (
                                                        <TableCell key={col.key}><Skeleton className="h-6 w-full" /></TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : data.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center text-muted-foreground py-8">
                                                    No SRF records found for the selected filters
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    {AVAILABLE_COLUMNS.map(col => visibleColumns[col.key] && (
                                                        <TableCell key={col.key} className={col.key === 'SRF No.' ? "font-mono whitespace-nowrap" : ""}>
                                                            {renderCell(row, col.key)}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                        disabled={pagination.page <= 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Prev
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Page {pagination.page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                        disabled={pagination.page >= totalPages}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Content wrappers required by Tabs component */}
                <TabsContent value="FG" />
                <TabsContent value="RM" />
            </Tabs>
        </div>
    );
};

export default SRFReportPage;
