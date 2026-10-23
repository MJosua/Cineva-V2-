import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DataTableReportPro } from "@/components/report/DataTableReport";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Calendar,
    Download,
    RefreshCw,
    LayoutDashboard,
    BarChart3,
    Table2,
    Sparkles,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { useToast } from "@/hooks/use-toast";

// Demo/Mock data for fallback when no real data exists
const mockOverviewData = {
    kpis: [
        { label: "Total Requests", value: 1247, trend: 12, trendUp: true, icon: LayoutDashboard },
        { label: "Pending Review", value: 89, trend: -5, trendUp: false, icon: Clock },
        { label: "Approved", value: 1023, trend: 8, trendUp: true, icon: CheckCircle2 },
        { label: "Rejected", value: 45, trend: 2, trendUp: false, icon: XCircle }
    ],
    statusDistribution: [
        { name: "Approved", value: 68, color: "hsl(142, 76%, 36%)" },
        { name: "Pending", value: 22, color: "hsl(38, 92%, 50%)" },
        { name: "Rejected", value: 10, color: "hsl(0, 84%, 60%)" }
    ],
    topChangedFields: [
        { field: "Unit Price", count: 156 },
        { field: "Quantity", count: 134 },
        { field: "Discount %", count: 89 },
        { field: "Delivery Date", count: 67 },
        { field: "Payment Terms", count: 45 }
    ],
    trendData: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        requests: Math.floor(30 + Math.random() * 20 + Math.sin(i / 3) * 10),
        approved: Math.floor(25 + Math.random() * 15 + Math.sin(i / 3) * 8)
    })),
    recentActivity: [
        { user: "John Doe", action: "approved", item: "PO-2024-1847", time: "5 min ago" },
        { user: "Jane Smith", action: "submitted", item: "Price Change #456", time: "12 min ago" },
        { user: "Mike Chen", action: "rejected", item: "Qty Adjustment #789", time: "1 hour ago" },
        { user: "Sarah Lee", action: "approved", item: "Terms Update #321", time: "2 hours ago" }
    ]
};

interface ServiceSummaryData {
    kpis: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        trend: number;
        trendDirection: 'up' | 'down' | 'neutral';
    };
    sparklineData: { value: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
    trendData: { date: string; requests: number; approved: number }[];
}

interface TicketRow {
    ticket_id: string;
    title: string;
    created_at: string;
    status_id: number;
    status_name: string;
    requester_name: string;
    completed_at: string | null;
}

const ServiceAnalyticsView: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState("overview");
    const [dateRange, setDateRange] = useState("30d");
    const [loading, setLoading] = useState(true);
    const [useDemo, setUseDemo] = useState(false);

    // Real data states
    const [summaryData, setSummaryData] = useState<ServiceSummaryData | null>(null);
    const [ticketsData, setTicketsData] = useState<TicketRow[]>([]);
    const [serviceName, setServiceName] = useState<string>("Service Analytics");

    // Chart configurations
    const trendChartConfig = {
        requests: { label: "Requests", color: "hsl(210, 100%, 50%)" },
        approved: { label: "Approved", color: "hsl(142, 76%, 36%)" }
    };

    const barChartConfig = {
        count: { label: "Changes", color: "hsl(210, 100%, 50%)" }
    };

    // Fetch summary data
    const fetchSummary = async () => {
        try {
            const token = localStorage.getItem("hots_tokek");
            const res = await axios.get(
                `${API_URL}/hotsdashboard/service_summary/${serviceId}?range=${dateRange}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                setSummaryData(res.data);
                setUseDemo(false);
            } else {
                setUseDemo(true);
            }
        } catch (err) {
            console.warn("Using demo data - real API not available", err);
            setUseDemo(true);
        }
    };

    // Fetch tickets data for table
    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem("hots_tokek");
            const res = await axios.get(
                `${API_URL}/hotsdashboard/service_tickets/${serviceId}?range=${dateRange}&limit=1000`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success && res.data.results) {
                setTicketsData(res.data.results);
            }
        } catch (err) {
            console.warn("Could not fetch tickets", err);
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchSummary(), fetchTickets()]);
            setLoading(false);
        };
        load();
    }, [serviceId, dateRange]);

    // Determine data source
    const kpis = useDemo ? mockOverviewData.kpis : [
        { label: "Total Requests", value: summaryData?.kpis.total || 0, trend: summaryData?.kpis.trend || 0, trendUp: summaryData?.kpis.trendDirection === 'up', icon: LayoutDashboard },
        { label: "Pending Review", value: summaryData?.kpis.pending || 0, trend: 0, trendUp: false, icon: Clock },
        { label: "Approved", value: summaryData?.kpis.approved || 0, trend: 0, trendUp: true, icon: CheckCircle2 },
        { label: "Rejected", value: summaryData?.kpis.rejected || 0, trend: 0, trendUp: false, icon: XCircle }
    ];

    const statusDistribution = useDemo
        ? mockOverviewData.statusDistribution
        : summaryData?.statusDistribution || [];

    const trendData = useDemo
        ? mockOverviewData.trendData
        : summaryData?.trendData || [];

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-80" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {serviceName}
                        </h1>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                            Service ID: {serviceId}
                            {useDemo && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                    Demo Mode
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {['7d', '30d', '90d', 'YTD'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    dateRange === range
                                        ? "bg-white shadow text-gray-900"
                                        : "text-gray-600 hover:text-gray-900"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => { fetchSummary(); fetchTickets(); }}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button
                        variant={useDemo ? "default" : "outline"}
                        size="sm"
                        onClick={() => setUseDemo(!useDemo)}
                    >
                        {useDemo ? "Using Demo" : "Use Demo"}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100/80 p-1">
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="charts" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <BarChart3 className="w-4 h-4" />
                        Charts
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Table2 className="w-4 h-4" />
                        Data Table
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        Custom Views
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        {kpis.map((kpi, i) => (
                            <Card key={i} className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                                            <p className="text-3xl font-bold text-gray-900">
                                                {kpi.value.toLocaleString()}
                                            </p>
                                            {kpi.trend !== 0 && (
                                                <div className={cn(
                                                    "flex items-center gap-1 mt-2 text-xs font-medium",
                                                    kpi.trendUp ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {kpi.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    <span>{Math.abs(kpi.trend)}% vs last period</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 rounded-xl bg-blue-50">
                                            <kpi.icon className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-3 gap-6">
                        {/* Trend Chart */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Request Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {trendData.length > 0 ? (
                                    <ChartContainer config={trendChartConfig} className="h-[250px] w-full">
                                        <AreaChart data={trendData}>
                                            <defs>
                                                <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="hsl(210, 100%, 50%)" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="approvedGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <ChartTooltip content={<ChartTooltipContent />} />
                                            <Area
                                                type="monotone"
                                                dataKey="requests"
                                                stroke="hsl(210, 100%, 50%)"
                                                strokeWidth={2}
                                                fill="url(#requestGradient)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="approved"
                                                stroke="hsl(142, 76%, 36%)"
                                                strokeWidth={2}
                                                fill="url(#approvedGradient)"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-400">
                                        No trend data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                {statusDistribution.length > 0 ? (
                                    <>
                                        <div className="h-[180px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusDistribution}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={70}
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                    >
                                                        {statusDistribution.map((entry, index) => (
                                                            <Cell key={index} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex gap-4 mt-2 flex-wrap justify-center">
                                            {statusDistribution.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[180px] flex items-center justify-center text-gray-400">
                                        No status data
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Activity Feed (Demo) */}
                    {useDemo && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Recent Activity (Demo)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockOverviewData.recentActivity.map((activity, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium",
                                                activity.action === 'approved' ? 'bg-green-500' :
                                                    activity.action === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                                            )}>
                                                {activity.user.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm">
                                                    <span className="font-medium">{activity.user}</span>
                                                    <span className="text-gray-500"> {activity.action} </span>
                                                    <span className="font-medium text-blue-600">{activity.item}</span>
                                                </p>
                                                <p className="text-xs text-gray-400">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Charts Tab (Placeholder) */}
                <TabsContent value="charts">
                    <Card className="py-20">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Chart Builder</h3>
                            <p className="text-gray-500 max-w-md">
                                Create custom visualizations by selecting dimensions, metrics, and chart types.
                                Coming in Phase 2.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Data Table Tab - Using DataTableReportPro */}
                <TabsContent value="table">
                    {ticketsData.length > 0 ? (
                        <DataTableReportPro
                            title={`${serviceName} - Tickets`}
                            data={ticketsData}
                            ticketKey="ticket_id"
                            columns={[
                                { header: "Ticket ID", accessor: "ticket_id", sortable: true },
                                { header: "Title", accessor: "title", sortable: true },
                                { header: "Requester", accessor: "requester_name", filterable: true },
                                { header: "Status", accessor: "status_name", filterable: true },
                                { header: "Created", accessor: "created_at", sortable: true },
                                { header: "Completed", accessor: "completed_at", sortable: true }
                            ]}
                            searchKeys={["ticket_id", "title", "requester_name"]}
                        />
                    ) : (
                        <Card className="py-20">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <Table2 className="w-12 h-12 text-gray-300 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
                                <p className="text-gray-500 max-w-md">
                                    No tickets found for this service in the selected date range.
                                    Try adjusting the date range or check back later.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Custom Views Tab (Placeholder) */}
                <TabsContent value="custom">
                    <Card className="py-20">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Custom Dashboard Builder</h3>
                            <p className="text-gray-500 max-w-md">
                                Drag and drop widgets to create your own personalized analytics dashboard.
                                Save and share templates with your team. Coming in Phase 4.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ServiceAnalyticsView;
