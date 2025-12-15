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
import { FileText, CheckCircle, Clock, XCircle, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface SRFData {
    'SRF No.': string;
    'Tgl Email SRF': string;
    'Distributor': string;
    'Country': string;
    'Product Category': string;
    'Sample Category': string;
    'Status': string;
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

const SRFReportPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SRFData[]>([]);
    const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [filters, setFilters] = useState({
        year: new Date().getFullYear().toString(),
        distributor: '',
        country: '',
        type: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 25,
        total: 0
    });

    const token = localStorage.getItem('tokek');

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
                ...(filters.type && { type: filters.type })
            });

            const res = await axios.get(`${API_URL}/hotsdashboard/report_srf?${params}`, { headers });

            if (res.data.success) {
                setData(res.data.results || []);
                setPagination(prev => ({ ...prev, total: res.data.total }));

                // Calculate summary from data or fetch separately
                const pending = res.data.results?.filter((r: SRFData) =>
                    ['Open', 'Pending', 'In Progress'].some(s => r.Status?.toLowerCase()?.includes(s.toLowerCase()))
                ).length || 0;
                const approved = res.data.results?.filter((r: SRFData) =>
                    r.Status?.toLowerCase()?.includes('approved') || r.Status?.toLowerCase()?.includes('completed')
                ).length || 0;
                const rejected = res.data.results?.filter((r: SRFData) =>
                    r.Status?.toLowerCase()?.includes('reject')
                ).length || 0;

                setSummary({
                    total: res.data.total,
                    pending,
                    approved,
                    rejected
                });
            }
        } catch (err) {
            console.error('Error fetching SRF report:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters, pagination.page]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const totalPages = Math.ceil(pagination.total / pagination.limit);

    if (loading && data.length === 0) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

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
                        <p className="text-sm text-muted-foreground">All time</p>
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

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <CardTitle>SRF Records</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SRF No.</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Distributor</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Product Category</TableHead>
                                    <TableHead>Sample Category</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No SRF records found for the selected filters
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono">{row['SRF No.'] || '-'}</TableCell>
                                            <TableCell>{formatDate(row['Tgl Email SRF'])}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={row['Distributor']}>
                                                {row['Distributor'] || '-'}
                                            </TableCell>
                                            <TableCell>{row['Country'] || '-'}</TableCell>
                                            <TableCell>{row['Product Category'] || '-'}</TableCell>
                                            <TableCell>{row['Sample Category'] || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    row['Status']?.toLowerCase()?.includes('approved') ? 'default' :
                                                        row['Status']?.toLowerCase()?.includes('reject') ? 'destructive' :
                                                            'secondary'
                                                }>
                                                    {row['Status'] || 'Unknown'}
                                                </Badge>
                                            </TableCell>
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
    );
};

export default SRFReportPage;
