// src/pages/dashboard/report/ShipmentReport.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ReportDiscussion from '@/components/report/ReportDiscussion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
    AlertTriangle, 
    CheckCircle2, 
    Calendar, 
    Ship, 
    Activity, 
    BarChart3, 
    Clock, 
    Gauge,
    AlertCircle,
    Globe,
    RefreshCcw,
    Search,
    Filter,
    Download,
    Eye,
    EyeOff,
    FileSpreadsheet,
    MapPin,
    List,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    X
} from 'lucide-react';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReliabilityEntry {
    scac: string;
    carrierName: string;
    trackedShipments: number;
    measurableShipments: number;
    deliveredShipments: number;
    onTimeShipments: number;
    avgEtaGapDays: number | null;
    avgActualEtaGapDays: number | null;
    onTimeRate: number | null;
    reliabilityScore: number;
}

interface TransitTimeEntry {
    routeLabel: string;
    polName: string;
    podName: string;
    scac: string;
    carrierName: string;
    shipmentCount: number;
    avgTransitDays: number;
}

interface RiskEntry {
    soId: number;
    containerNumber: string | null;
    blNumber: string | null;
    carrierName: string;
    trackingStatus: string;
    riskScore: number;
    riskReasons: string[];
    internalEta: string | null;
    searatesEta: string | null;
}

interface QuotaHistory {
    date: string;
    countedHits: number;
    usageRate: number;
}

interface ProviderQuotaHistory {
    date: string;
    apiCallsUsed: number;
    apiCallsTotal: number;
    uniqueShipmentsUsed: number;
    uniqueShipmentsTotal: number;
}

interface UsageDetailEntry {
    container_number: string;
    tracking_number: string;
    scac: string;
    sealine_name: string;
    last_updated: string;
    tracking_status: string;
    so_id: number;
}

interface QuotaData {
    dailyLimit: number;
    today: {
        countedHits: number;
        remainingHits: number;
        usageRate: number;
        quotaStatus: 'healthy' | 'warning' | 'critical';
    };
    history: QuotaHistory[];
    providerHistory: ProviderQuotaHistory[];
    providerStatus?: {
        apiCalls: { used: number; total: number; remaining: number; usageRate: number };
        uniqueShipments: { used: number; total: number; remaining: number; usageRate: number };
    };
}

interface DataListEntry {
    year_delv: number;
    delv_date: string;
    invoice_id: string;
    ship_line: string;
    fwd: string;
    bl_no: string;
    book_no: string;
    so_id: string;
    ct_tr: string;
    eta: string;
    etd: string;
    factory_sname: string;
}

interface FreightReportEntry {
    shipmentId: number;
    containerNumber: string;
    bookingNumber: string;
    poNumber: string;
    countries: string[];
    transitPath: string[];
    etd: string | null;
    eta: string | null;
    factory_sname?: string | null;
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return Math.round(num).toLocaleString('en-US');
};

const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

interface ShipmentReportProps {
    searchValue?: string;
}

const ShipmentReport: React.FC<ShipmentReportProps> = ({ searchValue }) => {
    const [loading, setLoading] = useState(false);
    const [reliability, setReliability] = useState<ReliabilityEntry[]>([]);
    const [transitTimes, setTransitTimes] = useState<TransitTimeEntry[]>([]);
    const [risks, setRisks] = useState<RiskEntry[]>([]);
    const [quota, setQuota] = useState<QuotaData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    // New State for tabs and data
    const [activeTab, setActiveTab] = useState('analytics');
    const [dataList, setDataList] = useState<DataListEntry[]>([]);
    const [freightReport, setFreightReport] = useState<FreightReportEntry[]>([]);
    const [loadingDataList, setLoadingDataList] = useState(false);
    const [loadingFreight, setLoadingFreight] = useState(false);

    // Search and Filters
    const [dataSearch, setDataSearch] = useState('');
    const [freightSearch, setFreightSearch] = useState('');

    // Date Filters
    const [dataDateRange, setDataDateRange] = useState<{from: string, to: string}>(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Manual date formatting to avoid timezone shift
        const formatStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return {
            from: formatStr(firstDay),
            to: formatStr(lastDay)
        };
    });
    const [freightDateRange, setFreightDateRange] = useState({ from: '', to: '' });
    const [factoryFilter, setFactoryFilter] = useState<string>('all');

    // Pagination State
    const [dataPage, setDataPage] = useState(1);
    const [dataPageSize, setDataPageSize] = useState(25);
    const [totalDataRows, setTotalDataRows] = useState(0);
    const [totalDataPages, setTotalDataPages] = useState(0);

    const [freightPage, setFreightPage] = useState(1);
    const [freightPageSize, setFreightPageSize] = useState(25);
    const [totalFreightRows, setTotalFreightRows] = useState(0);
    const [totalFreightPages, setTotalFreightPages] = useState(0);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        delv_date: true,
        invoice_id: true,
        bl_no: true,
        book_no: true,
        ct_tr: true,
        eta: true,
        factory_sname: true
    });

    const [hasLoadedAnalytics, setHasLoadedAnalytics] = useState(false);
    const [hasLoadedData, setHasLoadedData] = useState(false);
    const [hasLoadedFreight, setHasLoadedFreight] = useState(false);
    const [allFactories, setAllFactories] = useState<string[]>([]);

    // Sorting State
    const [dataSort, setDataSort] = useState<{ key: keyof DataListEntry; direction: 'asc' | 'desc' }>({ key: 'delv_date', direction: 'desc' });
    const [freightSort, setFreightSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'containerNumber', direction: 'asc' });

    // Usage Drilldown State
    const [usageType, setUsageType] = useState<'bl' | 'ct'>('bl');
    const [quotaDateRange, setQuotaDateRange] = useState({
        from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [transitDateRange, setTransitDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [reliabilityDateRange, setReliabilityDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [risksDateRange, setRisksDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [usageDateRange, setUsageDateRange] = useState({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [usageDetails, setUsageDetails] = useState<UsageDetailEntry[]>([]);
    const [usageSearch, setUsageSearch] = useState('');
    const [loadingUsage, setLoadingUsage] = useState(false);

    const handleDataSort = (key: keyof DataListEntry) => {
        setDataSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleFreightSort = (key: string) => {
        setFreightSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const uniqueFactories = useMemo(() => {
        if (allFactories.length > 0) return allFactories;
        
        const factories = new Set<string>();
        dataList.forEach(item => {
            if (item.factory_sname) factories.add(item.factory_sname);
        });
        freightReport.forEach(item => {
            if (item.factory_sname) factories.add(item.factory_sname);
        });
        return Array.from(factories).sort();
    }, [dataList, freightReport, allFactories]);

    // Reset page on filter change
    useEffect(() => { setDataPage(1); }, [dataSearch, dataDateRange, factoryFilter]);
    useEffect(() => { setFreightPage(1); }, [freightSearch, freightDateRange, factoryFilter]);

    const chartConfig = {
        countedHits: {
            label: "API Hits",
            color: quota?.today.quotaStatus === 'critical' ? '#ef4444' : quota?.today.quotaStatus === 'warning' ? '#f59e0b' : '#3b82f6',
        },
    };

    const token = localStorage.getItem('hots_tokek');

    const fetchReliability = async () => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/reliability?fromDate=${reliabilityDateRange.from}&toDate=${reliabilityDateRange.to}`, { headers });
            setReliability(res.data.results || []);
        } catch (err) {
            console.error("Error fetching reliability:", err);
        }
    };

    const fetchTransitTimes = async () => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/transit-times?fromDate=${transitDateRange.from}&toDate=${transitDateRange.to}`, { headers });
            setTransitTimes(res.data.results || []);
        } catch (err) {
            console.error("Error fetching transit times:", err);
        }
    };

    const fetchQuota = async () => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const resHits = await axios.get(`${API_URL}/hotsdashboard/analytics/quota?fromDate=${quotaDateRange.from}&toDate=${quotaDateRange.to}`, { headers });
            setQuota(resHits.data || null);
        } catch (err) {
            console.error("Error fetching quota:", err);
        }
    };

    const fetchRisks = async () => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        try {
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/risks?fromDate=${risksDateRange.from}&toDate=${risksDateRange.to}`, { headers });
            setRisks(res.data.results || []);
        } catch (err) {
            console.error("Error fetching risks:", err);
        }
    };

    const fetchData = async (isManual = false) => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) {
            setError("Authentication token not found. Please log in.");
            setLoading(false);
            setRefreshing(false);
            return;
        }
        setError(null);
        if (isManual) setRefreshing(true);
        else setLoading(true);

        try {
            await Promise.all([
                fetchReliability(),
                fetchTransitTimes(),
                fetchQuota(),
                fetchRisks()
            ]);
            setLastRefreshed(new Date());
            setHasLoadedAnalytics(true);
        } catch (err) {
            console.error("Error fetching shipment report:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchFactories = async () => {
        const token = localStorage.getItem('hots_tokek');
        if (!token) return;
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/factories`, { headers });
            if (res.data.success) {
                setAllFactories(res.data.results || []);
            }
        } catch (err) {
            console.error('Error fetching factories:', err);
        }
    };

    const fetchShipmentData = async () => {
        if (!token) return;
        setLoadingDataList(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const params = new URLSearchParams({
                page: String(dataPage),
                limit: String(dataPageSize),
                fromDate: dataDateRange.from || '',
                toDate: dataDateRange.to || '',
                factory: factoryFilter,
                search: dataSearch,
                sortBy: dataSort.key,
                sortDir: dataSort.direction
            });
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/data-list?${params.toString()}`, { headers });
            setDataList(res.data.results || []);
            setTotalDataRows(res.data.totalRows || 0);
            setTotalDataPages(res.data.totalPages || 0);
            setHasLoadedData(true);
        } catch (err) {
            console.error('Error fetching data list:', err);
        } finally {
            setLoadingDataList(false);
        }
    };

    const fetchFreightData = async () => {
        if (!token) return;
        setLoadingFreight(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const params = new URLSearchParams({
                page: String(freightPage),
                limit: String(freightPageSize),
                fromDate: freightDateRange.from || '',
                toDate: freightDateRange.to || '',
                factory: factoryFilter,
                search: freightSearch
            });
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/freight-report?${params.toString()}`, { headers });
            setFreightReport(res.data.results || []);
            setTotalFreightRows(res.data.totalRows || 0);
            setTotalFreightPages(res.data.totalPages || 0);
            setHasLoadedFreight(true);
        } catch (err) {
            console.error('Error fetching freight report:', err);
        } finally {
            setLoadingFreight(false);
        }
    };

    const fetchUsageDetails = async () => {
        if (!token) return;
        setLoadingUsage(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const params = new URLSearchParams({
                type: usageType,
                fromDate: usageDateRange.from,
                toDate: usageDateRange.to,
                search: usageSearch
            });
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/usage-details?${params.toString()}`, { headers });
            setUsageDetails(res.data.results || []);
        } catch (err) {
            console.error('Error fetching usage details:', err);
        } finally {
            setLoadingUsage(false);
        }
    };

    useEffect(() => {
        if (hasLoadedAnalytics && activeTab === 'analytics') {
            const timer = setTimeout(() => {
                fetchUsageDetails();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [usageType, usageDateRange, usageSearch, activeTab]);

    useEffect(() => {
        fetchFactories();
    }, []);

    useEffect(() => {
        if (hasLoadedAnalytics && activeTab === 'analytics') {
            const timer = setTimeout(() => {
                fetchReliability();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [reliabilityDateRange, activeTab, hasLoadedAnalytics]);

    useEffect(() => {
        if (hasLoadedAnalytics && activeTab === 'analytics') {
            const timer = setTimeout(() => {
                fetchTransitTimes();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [transitDateRange, activeTab]);

    useEffect(() => {
        if (hasLoadedAnalytics && activeTab === 'analytics') {
            const timer = setTimeout(() => {
                fetchQuota();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [quotaDateRange, activeTab, hasLoadedAnalytics]);

    useEffect(() => {
        if (hasLoadedAnalytics && activeTab === 'analytics') {
            const timer = setTimeout(() => {
                fetchRisks();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [risksDateRange, activeTab, hasLoadedAnalytics]);

    // Tab switch logic - Removed automatic fetching
    useEffect(() => {
        // No auto-fetch on tab change as requested
    }, [activeTab]);

    // Data tab refetch on dependency changes
    useEffect(() => {
        if (hasLoadedData && activeTab === 'data') {
            const timer = setTimeout(() => {
                fetchShipmentData();
            }, 300); // Debounce search/filters
            return () => clearTimeout(timer);
        }
    }, [dataPage, dataPageSize, dataDateRange, factoryFilter, dataSearch, dataSort]);

    // Freight tab refetch on dependency changes
    useEffect(() => {
        if (hasLoadedFreight && activeTab === 'freight') {
            const timer = setTimeout(() => {
                fetchFreightData();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [freightPage, freightPageSize, freightDateRange, factoryFilter, freightSearch]);

    const handleRefresh = () => {
        if (activeTab === 'analytics') {
            fetchReliability();
            fetchTransitTimes();
            fetchQuota();
            fetchRisks();
            fetchUsageDetails();
        }
        if (activeTab === 'data') fetchShipmentData();
        if (activeTab === 'freight') fetchFreightData();
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row =>
            Object.values(row).map(value =>
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
            ).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateDataCSV = (data: DataListEntry[]) => {
        if (data.length === 0) return;
        const csvData = data.map(item => ({
            'Delv Date': formatDate(item.delv_date),
            'Invoice Number': item.invoice_id,
            'BL Number': item.bl_no,
            'Booking Number': item.book_no,
            'Container ID': item.ct_tr,
            'ETA': formatDate(item.eta),
            'Factory': item.factory_sname
        }));
        exportToCSV(csvData, `Shipment_Data_List_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const generateFreightCSV = (data: FreightReportEntry[]) => {
        if (data.length === 0) return;
        const csvData = data.map(item => ({
            'Container': item.containerNumber,
            'Booking': item.bookingNumber,
            'PO Number': item.poNumber,
            'ETD': formatDate(item.etd),
            'ETA': formatDate(item.eta),
            'Transit Path': (item.transitPath || []).join(' -> '),
            'Stops': (item.transitPath || []).length,
            'Factory': item.factory_sname
        }));
        exportToCSV(csvData, `Freight_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const filteredReliability = reliability.filter(r =>
        !searchValue || r.carrierName.toLowerCase().includes(searchValue.toLowerCase()) || r.scac.toLowerCase().includes(searchValue.toLowerCase())
    );

    const filteredRisks = risks.filter(r =>
        !searchValue ||
        r.containerNumber?.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.blNumber?.toLowerCase().includes(searchValue.toLowerCase()) ||
        r.carrierName?.toLowerCase().includes(searchValue.toLowerCase())
    );

    const sortedDataList = useMemo(() => {
        return dataList; // Already sorted/filtered by server
    }, [dataList]);

    const paginatedDataList = useMemo(() => {
        return dataList; // Already paginated by server
    }, [dataList]);

    const sortedFreightReport = useMemo(() => {
        return freightReport; // Already filtered/sorted by server
    }, [freightReport]);

    const paginatedFreightReport = useMemo(() => {
        return freightReport; // Already paginated by server
    }, [freightReport]);

    const generateUsageCSV = (data: UsageDetailEntry[]) => {
        if (!data || data.length === 0) return;
        const headers = ["No", "Tracking Type", "Tracking Number", "Container Number", "Carrier", "SCAC", "Last Update", "Status", "SO ID"];
        const rows = data.map((item, idx) => [
            idx + 1,
            usageType.toUpperCase(),
            item.tracking_number || '',
            item.container_number || '',
            item.sealine_name || '',
            item.scac || '',
            item.last_updated || '',
            item.tracking_status || '',
            item.so_id || ''
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const fileName = `searates_usage_${usageType}_${new Date().toISOString().split('T')[0]}.csv`;
        
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSortIcon = (currentKey: string, sortConfig: { key: string; direction: 'asc' | 'desc' }) => {
        if (sortConfig.key !== currentKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
    };

    if (loading && !hasLoadedAnalytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-muted-foreground animate-pulse">Initializing Shipment Intelligence...</p>
            </div>
        );
    }

    const quotaColor = quota?.today.quotaStatus === 'critical' ? '#ef4444' : quota?.today.quotaStatus === 'warning' ? '#f59e0b' : '#3b82f6';

    return (
        <div className="space-y-6">
            {/* Header controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                        Shipment Report
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Real-time SeaRates tracking analytics & data insights
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-400">
                            Last updated: {lastRefreshed.toLocaleTimeString()}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant={(!hasLoadedAnalytics && activeTab === 'analytics') || (!hasLoadedData && activeTab === 'data') || (!hasLoadedFreight && activeTab === 'freight') ? "default" : "outline"}
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={refreshing || loadingDataList || loadingFreight}
                        className={(!hasLoadedAnalytics && activeTab === 'analytics') || (!hasLoadedData && activeTab === 'data') || (!hasLoadedFreight && activeTab === 'freight') ? "bg-blue-600 hover:bg-blue-700 shadow-lg animate-pulse" : "bg-white"}
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing || loadingDataList || loadingFreight ? 'animate-spin' : ''}`} />
                        {refreshing || loadingDataList || loadingFreight ? 'Updating...' : (!hasLoadedAnalytics && activeTab === 'analytics') || (!hasLoadedData && activeTab === 'data') || (!hasLoadedFreight && activeTab === 'freight') ? 'Load Data' : 'Refresh'}
                    </Button>
                    

                    {activeTab === 'data' && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => exportToCSV(dataList, 'shipment_data_export.csv')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Excel
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex items-center justify-start gap-4 bg-transparent border-b rounded-none h-auto p-0 mb-6 w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
                    <TabsTrigger 
                        value="analytics" 
                        className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none bg-transparent px-4 py-3 text-sm font-semibold transition-all hover:text-blue-500 whitespace-nowrap"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analytics Report
                    </TabsTrigger>
                    <TabsTrigger 
                        value="data" 
                        className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none bg-transparent px-4 py-3 text-sm font-semibold transition-all hover:text-blue-500 whitespace-nowrap"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Data List (Excel)
                    </TabsTrigger>
                    <TabsTrigger 
                        value="freight" 
                        className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none bg-transparent px-4 py-3 text-sm font-semibold transition-all hover:text-blue-500 whitespace-nowrap"
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        Freight Report
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6 mt-0">
                    {!hasLoadedAnalytics ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50/50">
                            <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Analytics Not Loaded</h3>
                            <p className="text-slate-500 mb-6">Click the Load Data button to analyze carrier performance and risks.</p>
                            <Button onClick={() => fetchData(true)} className="bg-blue-600">
                                <RefreshCcw className="w-4 h-4 mr-2" />
                                Fetch Analytics
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">

            {/* Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Ship className="w-4 h-4" />
                            Active Tracking
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {formatNumber(reliability.reduce((sum, r) => sum + r.trackedShipments, 0))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Shipments updated in the selected period</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-amber-600">
                            <Activity className="w-4 h-4" />
                            High Risk Alerts
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold text-amber-700">
                            {formatNumber(risks.filter(r => r.riskScore >= 60).length)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Score &ge; 60 (Critical attention needed)</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2 text-green-600">
                            <Ship className="w-4 h-4" />
                            Provider Quota (Unique)
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {formatNumber(quota?.providerStatus?.uniqueShipments.remaining || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ width: `${quota?.providerStatus?.uniqueShipments.usageRate || 0}%` }}
                                />
                            </div>
                            <span className="text-xs font-medium">{formatNumber(quota?.providerStatus?.uniqueShipments.usageRate || 0)}% used</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-indigo-600">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Avg ETA Precision
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            &plusmn;{formatNumber(reliability.reduce((sum, r) => sum + (r.avgEtaGapDays || 0) * r.measurableShipments, 0) / Math.max(reliability.reduce((sum, r) => sum + r.measurableShipments, 0), 1))} <span className="text-sm font-normal text-muted-foreground">days</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Internal ETA vs SeaRates ETA gap</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Carrier Reliability */}
                <Card className="flex flex-col">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Gauge className="w-5 h-5 text-indigo-500" />
                                    Carrier Reliability Ranking
                                </CardTitle>
                                <CardDescription>Based on SeaRates coverage and precision</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={reliabilityDateRange.from} 
                                    onChange={(e) => setReliabilityDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="h-7 w-28 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={reliabilityDateRange.to} 
                                    onChange={(e) => setReliabilityDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="h-7 w-28 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Carrier</TableHead>
                                    <TableHead className="text-center">Coverage</TableHead>
                                    <TableHead className="text-center">On-Time</TableHead>
                                    <TableHead className="text-center">Avg Gap</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReliability.map((row) => (
                                    <TableRow key={row.scac}>
                                        <TableCell>
                                            <div className="font-medium">{row.carrierName}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{row.scac}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="text-sm">{((row.measurableShipments / row.trackedShipments) * 100).toFixed(0)}%</div>
                                            <div className="text-[10px] text-muted-foreground">{row.measurableShipments}/{row.trackedShipments} units</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={row.onTimeRate && row.onTimeRate >= 80 ? 'default' : 'secondary'} className={row.onTimeRate && row.onTimeRate >= 80 ? 'bg-green-500' : ''}>
                                                {row.onTimeRate ? `${row.onTimeRate.toFixed(0)}%` : 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center font-mono">
                                            {row.avgEtaGapDays !== null ? `${row.avgEtaGapDays}d` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`font-bold ${(row.reliabilityScore || 0) >= 80 ? 'text-green-600' : (row.reliabilityScore || 0) >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                {(row.reliabilityScore || 0).toFixed(1)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Risk Radar */}
                <Card className="flex flex-col">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                                    Shipment Risk Monitoring
                                </CardTitle>
                                <CardDescription>Top shipments requiring intervention</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={risksDateRange.from} 
                                    onChange={(e) => setRisksDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="h-7 w-28 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={risksDateRange.to} 
                                    onChange={(e) => setRisksDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="h-7 w-28 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shipment Details</TableHead>
                                    <TableHead>Issues</TableHead>
                                    <TableHead className="text-right">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRisks.slice(0, 10).map((risk) => (
                                    <TableRow key={risk.soId}>
                                        <TableCell>
                                            <div className="font-medium text-sm">{risk.containerNumber || risk.blNumber || 'No ID'}</div>
                                            <div className="text-xs text-muted-foreground">{risk.carrierName || 'Unknown Carrier'}</div>
                                            <div className="text-xs mt-1">
                                                <Badge variant="outline" className="text-[10px] py-0">{risk.trackingStatus}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {risk.riskReasons.map((reason, i) => (
                                                    <span key={i} className="inline-flex items-center text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1 rounded">
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                            {risk.internalEta && (
                                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Calendar className="w-2.5 h-2.5" />
                                                    ETA: {formatDate(risk.internalEta)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`font-bold ${risk.riskScore >= 70 ? 'text-rose-600' : 'text-amber-600'}`}>
                                                {risk.riskScore}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

            {/* Quota & Transit Time Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Internal Quota Chart */}
                <Card>
                    <CardHeader className="pb-4 border-b bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                    HOTS Internal API Hits
                                </CardTitle>
                                <CardDescription>Daily API attempts tracked by HOTS platform</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm min-w-[320px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={quotaDateRange.from} 
                                    onChange={(e) => setQuotaDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={quotaDateRange.to} 
                                    onChange={(e) => setQuotaDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={quota?.history || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={quotaColor} stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor={quotaColor} stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} tick={{fontSize: 10}} />
                                        <YAxis tick={{fontSize: 10}} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Area type="monotone" dataKey="countedHits" stroke={quotaColor} fillOpacity={1} fill="url(#colorHits)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Provider Quota Consumption */}
                <Card>
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Gauge className="w-5 h-5 text-indigo-500" />
                                    SeaRates Provider Quota Status
                                </CardTitle>
                                <CardDescription>Historical API Calls & Unique Shipments usage</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm min-w-[320px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={quotaDateRange.from} 
                                    onChange={(e) => setQuotaDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={quotaDateRange.to} 
                                    onChange={(e) => setQuotaDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={quota?.providerHistory || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="date" tickFormatter={(val) => val.split('-').slice(2).join('/')} tick={{fontSize: 10}} />
                                    <YAxis tick={{fontSize: 10}} />
                                    <ChartTooltip />
                                    <Line type="monotone" name="API Calls" dataKey="apiCallsUsed" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" name="Unique Shipments" dataKey="uniqueShipmentsUsed" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div className="text-xs text-blue-600 font-semibold mb-1">API CALLS MTD</div>
                                <div className="text-xl font-bold text-blue-900">
                                    {formatNumber(quota?.providerHistory?.[quota.providerHistory.length-1]?.apiCallsUsed)}
                                    <span className="text-xs font-normal text-blue-500 ml-1">/ {formatNumber(quota?.providerHistory?.find(p => p.apiCallsTotal)?.apiCallsTotal)}</span>
                                </div>
                            </div>
                            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                <div className="text-xs text-indigo-600 font-semibold mb-1">UNIQUE SHIPMENTS</div>
                                <div className="text-xl font-bold text-indigo-900">
                                    {formatNumber(quota?.providerHistory?.[quota.providerHistory.length-1]?.uniqueShipmentsUsed)}
                                    <span className="text-xs font-normal text-indigo-500 ml-1">/ {formatNumber(quota?.providerHistory?.find(p => p.uniqueShipmentsTotal)?.uniqueShipmentsTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transit Benchmarks */}
                <Card>
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Globe className="w-5 h-5 text-indigo-500" />
                                    Route Transit Time Benchmarks
                                </CardTitle>
                                <CardDescription>Average transit days by carrier and route</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={transitDateRange.from} 
                                    onChange={(e) => setTransitDateRange(prev => ({ ...prev, from: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={transitDateRange.to} 
                                    onChange={(e) => setTransitDateRange(prev => ({ ...prev, to: e.target.value }))}
                                    className="h-7 w-32 border-none p-0 text-[11px] focus-visible:ring-0 shadow-none bg-transparent"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Route</TableHead>
                                        <TableHead className="text-center">Carrier</TableHead>
                                        <TableHead className="text-right">Avg Days</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transitTimes.slice(0, 10).map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="max-w-[180px] truncate" title={row.routeLabel}>
                                                {row.routeLabel}
                                            </TableCell>
                                            <TableCell className="text-center text-xs">
                                                <Badge variant="outline">{row.scac}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-blue-600">
                                                {row.avgTransitDays.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">d</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <ReportDiscussion 
                    reportKey="searates_analytics_main" 
                    title="Shipment Analytics Discussion" 
                    description="Team notes and testing logs for SeaRates data"
                />
            </div>
            {/* Usage Drilldown Section */}
            <Card className="border-t-4 border-t-indigo-500 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <List className="w-5 h-5 text-indigo-600" />
                                SeaRates Usage Drilldown
                            </CardTitle>
                            <CardDescription>Filter and list shipments by tracking type and date/month</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm flex-wrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    placeholder="Search tracking, so_id, or carrier..." 
                                    className="pl-8 h-8 w-full border-none shadow-none text-xs focus-visible:ring-0"
                                    value={usageSearch}
                                    onChange={(e) => setUsageSearch(e.target.value)}
                                />
                            </div>

                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[11px] border-green-200 text-green-700 hover:bg-green-50 shadow-sm font-semibold"
                                onClick={() => generateUsageCSV(usageDetails)}
                                disabled={usageDetails.length === 0}
                            >
                                <Download className="w-3.5 h-3.5 mr-2" />
                                Export CSV
                            </Button>

                            <div className="h-6 w-px bg-slate-200" />
                            
                            <Tabs value={usageType} onValueChange={(v: any) => setUsageType(v)} className="w-auto">
                                <TabsList className="bg-slate-100/50 h-8 p-1">
                                    <TabsTrigger value="bl" className="h-6 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">BL Numbers</TabsTrigger>
                                    <TabsTrigger value="ct" className="h-6 text-xs px-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">CT Numbers</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <div className="h-6 w-px bg-slate-200" />

                            <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-50 rounded-md border text-[11px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <Input 
                                    type="date" 
                                    value={usageDateRange.from} 
                                    onChange={(e) => setUsageDateRange(prev => ({ ...prev, from: e.target.value }))} 
                                    className="h-7 w-28 border-none shadow-none text-[11px] bg-transparent focus-visible:ring-0 p-0"
                                />
                                <span className="text-slate-300">-</span>
                                <Input 
                                    type="date" 
                                    value={usageDateRange.to} 
                                    onChange={(e) => setUsageDateRange(prev => ({ ...prev, to: e.target.value }))} 
                                    className="h-7 w-28 border-none shadow-none text-[11px] bg-transparent focus-visible:ring-0 p-0"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingUsage ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 animate-pulse">Retrieving usage details...</p>
                        </div>
                    ) : usageDetails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Search className="w-12 h-12 text-slate-200 mb-2" />
                            <p className="text-slate-500 font-medium">No {usageType.toUpperCase()} usage found for this period</p>
                            <p className="text-xs text-slate-400">Try changing the date or tracking type</p>
                        </div>
                    ) : (
                        <div className="overflow-auto max-h-[500px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-16 text-center">No</TableHead>
                                        <TableHead>Tracking Number</TableHead>
                                        <TableHead>Sealines / Carrier</TableHead>
                                        <TableHead>Last Update</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">SO ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usageDetails.map((item, idx) => (
                                        <TableRow key={`${item.tracking_number}-${idx}`} className="hover:bg-slate-50/50 group">
                                            <TableCell className="text-center font-mono text-xs text-slate-400">{idx + 1}</TableCell>
                                            <TableCell className="font-semibold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">{usageType.toUpperCase()}</Badge>
                                                    {item.tracking_number || item.container_number}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{item.sealine_name}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">{item.scac}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(item.last_updated)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal uppercase">
                                                    {item.tracking_status || 'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs text-indigo-600 font-medium">
                                                #{item.so_id}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

                        </div>
                    )}
                </TabsContent>

                <TabsContent value="data" className="space-y-4 mt-0">
                    {/* ... Rest of existing data tab content ... */}
                    {!hasLoadedData ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50/50">
                            <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Data List Not Initialized</h3>
                            <p className="text-slate-500 mb-6 font-medium">Click to explorer comprehensive shipment records.</p>
                            <Button onClick={() => fetchShipmentData()} className="bg-blue-600">
                                <Search className="w-4 h-4 mr-2" />
                                Initialize Data Explorer
                            </Button>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle>Shipment Data Explorer</CardTitle>
                                        <CardDescription>Comprehensive list of all shipments from IOD view</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-9 border-green-200 text-green-700 hover:bg-green-50"
                                            onClick={() => generateDataCSV(sortedDataList)}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export CSV
                                        </Button>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">Factory:</span>
                                                <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                                                    <SelectTrigger className="h-9 w-[130px] text-xs">
                                                        <SelectValue placeholder="All Factories" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Factories</SelectItem>
                                                        {uniqueFactories.map(f => (
                                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
                                                <div className="relative">
                                                    <Input 
                                                        type="date"
                                                        className="h-9 w-36 px-2 text-xs pr-7"
                                                        value={dataDateRange.from}
                                                        onChange={(e) => setDataDateRange(prev => ({ ...prev, from: e.target.value }))}
                                                    />
                                                    {dataDateRange.from && (
                                                        <button 
                                                            className="absolute right-1.5 top-2.5 text-muted-foreground hover:text-foreground"
                                                            onClick={() => setDataDateRange(prev => ({ ...prev, from: '' }))}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
                                                <div className="relative">
                                                    <Input 
                                                        type="date"
                                                        className="h-9 w-36 px-2 text-xs pr-7"
                                                        value={dataDateRange.to}
                                                        onChange={(e) => setDataDateRange(prev => ({ ...prev, to: e.target.value }))}
                                                    />
                                                    {dataDateRange.to && (
                                                        <button 
                                                            className="absolute right-1.5 top-2.5 text-muted-foreground hover:text-foreground"
                                                            onClick={() => setDataDateRange(prev => ({ ...prev, to: '' }))}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {(dataDateRange.from || dataDateRange.to) && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-9 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => setDataDateRange({ from: '', to: '' })}
                                                >
                                                    Reset Dates
                                                </Button>
                                            )}
                                            <div className="relative w-48">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    placeholder="Search table..." 
                                                    className="pl-8 h-9" 
                                                    value={dataSearch}
                                                    onChange={(e) => setDataSearch(e.target.value)}
                                                />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-9">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Columns
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {Object.keys(visibleColumns).map((col) => (
                                                        <DropdownMenuCheckboxItem
                                                            key={col}
                                                            checked={visibleColumns[col]}
                                                            onCheckedChange={(checked) => 
                                                                setVisibleColumns(prev => ({ ...prev, [col]: checked }))
                                                            }
                                                        >
                                                            {col.replace(/_/g, ' ').toUpperCase()}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                {visibleColumns.delv_date && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('delv_date')}>
                                                        <div className="flex items-center gap-1">
                                                            Delv Date {getSortIcon('delv_date', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.invoice_id && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('invoice_id')}>
                                                        <div className="flex items-center gap-1">
                                                            Invoice ID {getSortIcon('invoice_id', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.bl_no && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('bl_no')}>
                                                        <div className="flex items-center gap-1">
                                                            BL No {getSortIcon('bl_no', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.book_no && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('book_no')}>
                                                        <div className="flex items-center gap-1">
                                                            Booking {getSortIcon('book_no', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.ct_tr && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('ct_tr')}>
                                                        <div className="flex items-center gap-1">
                                                            Container {getSortIcon('ct_tr', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.eta && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('eta')}>
                                                        <div className="flex items-center gap-1">
                                                            ETA {getSortIcon('eta', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                                {visibleColumns.factory_sname && (
                                                    <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleDataSort('factory_sname')}>
                                                        <div className="flex items-center gap-1">
                                                            Factory {getSortIcon('factory_sname', dataSort)}
                                                        </div>
                                                    </TableHead>
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingDataList ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <TableRow key={i}>
                                                        {Object.values(visibleColumns).filter(v => v).map((_, j) => (
                                                            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))
                                            ) : paginatedDataList.length === 0 ? (
                                                <TableRow>
                                            <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="text-center py-20 text-muted-foreground bg-slate-50/30">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Search className="w-8 h-8 text-slate-200" />
                                                    <p className="font-medium text-slate-900">No results found</p>
                                                    <p className="text-sm max-w-[300px]">
                                                        {dataSearch || dataDateRange.from || dataDateRange.to 
                                                            ? "Try adjusting your search or date range filters to find what you're looking for."
                                                            : "No shipment data available for this year."}
                                                    </p>
                                                    {(dataSearch || dataDateRange.from || dataDateRange.to) && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="mt-2"
                                                            onClick={() => {
                                                                setDataSearch('');
                                                                setDataDateRange({ from: '', to: '' });
                                                            }}
                                                        >
                                                            Clear all filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                                </TableRow>
                                            ) : paginatedDataList.map((row, i) => (
                                                <TableRow key={i} className={dataSearch && Object.values(row).some(v => String(v).toLowerCase().includes(dataSearch.toLowerCase())) ? "bg-blue-50/50" : ""}>
                                                    {visibleColumns.delv_date && <TableCell className="whitespace-nowrap">{formatDate(row.delv_date)}</TableCell>}
                                                    {visibleColumns.invoice_id && <TableCell className="font-medium text-blue-600 cursor-pointer hover:underline">{row.invoice_id}</TableCell>}
                                                    {visibleColumns.bl_no && <TableCell>{row.bl_no || '-'}</TableCell>}
                                                    {visibleColumns.book_no && <TableCell>{row.book_no || '-'}</TableCell>}
                                                    {visibleColumns.ct_tr && <TableCell className="font-mono text-xs">{row.ct_tr || '-'}</TableCell>}
                                                    {visibleColumns.eta && <TableCell className="whitespace-nowrap">{formatDate(row.eta)}</TableCell>}
                                                    {visibleColumns.factory_sname && (
                                                        <TableCell>
                                                            <Badge variant="secondary">{row.factory_sname}</Badge>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination Controls */}
                                {!loadingDataList && totalDataRows > 0 && (
                                    <div className="flex items-center justify-between mt-4 px-2">
                                        <div className="text-sm text-muted-foreground">
                                            Showing <span className="font-medium">{(dataPage - 1) * dataPageSize + 1}</span> to <span className="font-medium">{Math.min(dataPage * dataPageSize, totalDataRows)}</span> of <span className="font-medium">{totalDataRows}</span> results
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                <Select value={String(dataPageSize)} onValueChange={(v) => {setDataPageSize(Number(v)); setDataPage(1);}}>
                                                    <SelectTrigger className="h-8 w-16 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[10, 25, 50, 100].map(size => (
                                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setDataPage(p => Math.max(1, p - 1))}
                                                    disabled={dataPage === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronDown className="h-4 w-4 rotate-90" />
                                                </Button>
                                                <span className="text-sm font-medium">Page {dataPage} of {totalDataPages}</span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setDataPage(p => p + 1)}
                                                    disabled={dataPage >= totalDataPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="freight" className="space-y-4 mt-0">
                    {!hasLoadedFreight ? (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-slate-50/50">
                            <MapPin className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">Freight Report Not Initialized</h3>
                            <p className="text-slate-500 mb-6 font-medium">Track container transit history across all ports.</p>
                            <Button onClick={() => fetchFreightData()} className="bg-blue-600">
                                <Globe className="w-4 h-4 mr-2" />
                                Initialize Freight Tracking
                            </Button>
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <CardTitle>Freight Tracking Report</CardTitle>
                                        <CardDescription>Transit path and country history per shipment</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">Factory:</span>
                                            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                                                <SelectTrigger className="h-9 w-[130px] text-xs">
                                                    <SelectValue placeholder="All Factories" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Factories</SelectItem>
                                                    {uniqueFactories.map(f => (
                                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
                                            <div className="relative">
                                                <Input 
                                                    type="date"
                                                    className="h-9 w-36 px-2 text-xs pr-7"
                                                    value={freightDateRange.from}
                                                    onChange={(e) => setFreightDateRange(prev => ({ ...prev, from: e.target.value }))}
                                                />
                                                {freightDateRange.from && (
                                                    <button 
                                                        className="absolute right-1.5 top-2.5 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setFreightDateRange(prev => ({ ...prev, from: '' }))}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
                                            <div className="relative">
                                                <Input 
                                                    type="date"
                                                    className="h-9 w-36 px-2 text-xs pr-7"
                                                    value={freightDateRange.to}
                                                    onChange={(e) => setFreightDateRange(prev => ({ ...prev, to: e.target.value }))}
                                                />
                                                {freightDateRange.to && (
                                                    <button 
                                                        className="absolute right-1.5 top-2.5 text-muted-foreground hover:text-foreground"
                                                        onClick={() => setFreightDateRange(prev => ({ ...prev, to: '' }))}
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {(freightDateRange.from || freightDateRange.to) && (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-9 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    const now = new Date();
                                                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                                    const formatStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                    setFreightDateRange({ from: formatStr(firstDay), to: formatStr(lastDay) });
                                                    setFreightPage(1);
                                                }}
                                            >
                                                Reset Dates
                                            </Button>
                                        )}
                                        <div className="relative w-48">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search by Container/PO..." 
                                                className="pl-8 h-9" 
                                                value={freightSearch}
                                                onChange={(e) => setFreightSearch(e.target.value)}
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" className="h-9" onClick={() => generateFreightCSV(sortedFreightReport)}>
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleFreightSort('containerNumber')}>
                                                    <div className="flex items-center gap-1">
                                                        Container / Booking {getSortIcon('containerNumber', freightSort)}
                                                    </div>
                                                </TableHead>
                                                <TableHead className="cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleFreightSort('poNumber')}>
                                                    <div className="flex items-center gap-1">
                                                        PO / SO {getSortIcon('poNumber', freightSort)}
                                                    </div>
                                                </TableHead>
                                                <TableHead>Transit Path (Countries)</TableHead>
                                                <TableHead>Factory</TableHead>
                                                <TableHead className="text-right cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => handleFreightSort('stops')}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        Stops {getSortIcon('stops', freightSort)}
                                                    </div>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loadingFreight ? (
                                                Array(5).fill(0).map((_, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                                    </TableRow>
                                                ))
                                            ) : paginatedFreightReport.length === 0 ? (
                                                <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-muted-foreground bg-slate-50/30">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <MapPin className="w-8 h-8 text-slate-200" />
                                                    <p className="font-medium text-slate-900">No freight records found</p>
                                                    <p className="text-sm max-w-[300px]">
                                                        {freightSearch || freightDateRange.from || freightDateRange.to 
                                                            ? "Try adjusting your search or date range filters."
                                                            : "No shipments with location history available."}
                                                    </p>
                                                    {(freightSearch || freightDateRange.from || freightDateRange.to) && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="mt-2"
                                                            onClick={() => {
                                                                setFreightSearch('');
                                                                setFreightDateRange({ from: '', to: '' });
                                                            }}
                                                        >
                                                            Clear all filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                                </TableRow>
                                            ) : paginatedFreightReport.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>
                                                        <div className="font-bold">{row.containerNumber}</div>
                                                        <div className="text-xs text-muted-foreground">{row.bookingNumber}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">{row.poNumber}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1 items-center">
                                                            {row.transitPath.map((country, idx) => (
                                                                <span key={idx} className="inline-flex items-center">
                                                                    <Badge variant="outline" className="bg-blue-50 text-[10px] py-0">{country}</Badge>
                                                                    {idx < row.transitPath.length - 1 && <span className="mx-1 text-slate-300">→</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.factory_sname ? <Badge variant="secondary" className="font-normal">{row.factory_sname}</Badge> : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {row.transitPath.length}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                {!loadingFreight && totalFreightRows > 0 && (
                                    <div className="flex items-center justify-between mt-4 px-2">
                                        <div className="text-sm text-muted-foreground">
                                            Showing <span className="font-medium">{(freightPage - 1) * freightPageSize + 1}</span> to <span className="font-medium">{Math.min(freightPage * freightPageSize, totalFreightRows)}</span> of <span className="font-medium">{totalFreightRows}</span> results
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Rows per page:</span>
                                                <Select value={String(freightPageSize)} onValueChange={(v) => {setFreightPageSize(Number(v)); setFreightPage(1);}}>
                                                    <SelectTrigger className="h-8 w-16 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[10, 25, 50, 100].map(size => (
                                                            <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setFreightPage(p => Math.max(1, p - 1))}
                                                    disabled={freightPage === 1}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronDown className="h-4 w-4 rotate-90" />
                                                </Button>
                                                <span className="text-sm font-medium">Page {freightPage} of {totalFreightPages}</span>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setFreightPage(p => p + 1)}
                                                    disabled={freightPage >= totalFreightPages}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ShipmentReport;
