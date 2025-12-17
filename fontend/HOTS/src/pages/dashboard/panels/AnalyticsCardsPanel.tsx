// src/pages/dashboard/panels/AnalyticsCardsPanel.tsx
// Renders analytics as collapsible cards in responsive grid
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, FileText, Clock, CheckCircle, XCircle, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';

interface AnalyticsCardsPanelProps {
    config: {
        cards?: CardConfig[];
        showTrendChart?: boolean;
        showStatusPie?: boolean;
        showBarChart?: boolean;
        showKpis?: boolean;
    };
    serviceId?: number;
}

interface CardConfig {
    id: string;
    title: string;
    type: 'kpi' | 'trend' | 'pie' | 'bar' | 'activity';
    defaultCollapsed?: boolean;
}

// Collapsible Card Component
const CollapsibleCard: React.FC<{
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = true, children }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden transition-all duration-300">
            <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {icon}
                        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </CardHeader>
            <div className={cn(
                "transition-all duration-300 overflow-hidden",
                isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <CardContent className="pt-0 pb-4">
                    {children}
                </CardContent>
            </div>
        </Card>
    );
};

// KPI Card Component
const KPICard: React.FC<{
    label: string;
    value: number;
    trend?: number;
    color: string;
    icon: React.ReactNode;
}> = ({ label, value, trend, color, icon }) => (
    <div className={cn(
        "p-4 rounded-lg bg-gradient-to-br text-white",
        color
    )}>
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">{label}</span>
            {icon}
        </div>
        <div className="flex items-end gap-2">
            <span className="text-2xl font-bold">{value.toLocaleString()}</span>
            {trend !== undefined && trend !== 0 && (
                <span className={cn("text-xs flex items-center gap-0.5 opacity-80", trend > 0 ? "text-white" : "text-white")}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
    </div>
);

const AnalyticsCardsPanel: React.FC<AnalyticsCardsPanelProps> = ({ config, serviceId }) => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, trend: 0 });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);

    const {
        showTrendChart = true,
        showStatusPie = true,
        showBarChart = true,
        showKpis = true
    } = config;

    useEffect(() => {
        if (serviceId) {
            fetchData();
        } else {
            // No serviceId - use mock data immediately
            setKpis({ total: 156, pending: 23, approved: 120, rejected: 13, trend: 12 });
            setTrendData(generateMockTrend());
            setStatusData(generateMockStatus());
            setLoading(false);
        }
    }, [serviceId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');

            const res = await axios.get(`${API_URL}/hotsdashboard/service_summary/${serviceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setKpis(res.data.kpis || { total: 0, pending: 0, approved: 0, rejected: 0 });
                setTrendData(res.data.trendData || generateMockTrend());
                setStatusData(res.data.statusDistribution || generateMockStatus());
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            // Use mock data for demo
            setKpis({ total: 156, pending: 23, approved: 120, rejected: 13, trend: 12 });
            setTrendData(generateMockTrend());
            setStatusData(generateMockStatus());
        } finally {
            setLoading(false);
        }
    };

    // Mock data generators
    const generateMockTrend = () => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((d, i) => ({
            date: d,
            requests: 20 + Math.floor(Math.random() * 30),
            approved: 15 + Math.floor(Math.random() * 20),
        }));
    };

    const generateMockStatus = () => [
        { name: 'Approved', value: 65, color: '#22c55e' },
        { name: 'Pending', value: 20, color: '#f59e0b' },
        { name: 'In Progress', value: 10, color: '#3b82f6' },
        { name: 'Rejected', value: 5, color: '#ef4444' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KPI Cards */}
            {showKpis && (
                <CollapsibleCard
                    title="Key Metrics"
                    icon={<Activity className="w-4 h-4 text-primary" />}
                    defaultOpen={true}
                >
                    <div className="grid grid-cols-2 gap-3">
                        <KPICard
                            label="Total"
                            value={kpis.total}
                            trend={kpis.trend}
                            color="from-blue-500 to-blue-600"
                            icon={<FileText className="w-5 h-5 opacity-70" />}
                        />
                        <KPICard
                            label="Pending"
                            value={kpis.pending}
                            color="from-amber-500 to-amber-600"
                            icon={<Clock className="w-5 h-5 opacity-70" />}
                        />
                        <KPICard
                            label="Approved"
                            value={kpis.approved}
                            color="from-green-500 to-green-600"
                            icon={<CheckCircle className="w-5 h-5 opacity-70" />}
                        />
                        <KPICard
                            label="Rejected"
                            value={kpis.rejected}
                            color="from-red-500 to-red-600"
                            icon={<XCircle className="w-5 h-5 opacity-70" />}
                        />
                    </div>
                </CollapsibleCard>
            )}

            {/* Trend Chart */}
            {showTrendChart && (
                <CollapsibleCard
                    title="Request Trends"
                    icon={<BarChart3 className="w-4 h-4 text-primary" />}
                    defaultOpen={true}
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAppr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="url(#colorReq)" strokeWidth={2} name="Requests" />
                            <Area type="monotone" dataKey="approved" stroke="#22c55e" fill="url(#colorAppr)" strokeWidth={2} name="Approved" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CollapsibleCard>
            )}

            {/* Status Distribution Pie */}
            {showStatusPie && (
                <CollapsibleCard
                    title="Status Distribution"
                    icon={<PieChartIcon className="w-4 h-4 text-primary" />}
                    defaultOpen={true}
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </CollapsibleCard>
            )}

            {/* Bar Chart */}
            {showBarChart && (
                <CollapsibleCard
                    title="Weekly Comparison"
                    icon={<BarChart3 className="w-4 h-4 text-primary" />}
                    defaultOpen={false}
                >
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} />
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
                            <Bar dataKey="approved" fill="#22c55e" radius={[4, 4, 0, 0]} name="Approved" />
                        </BarChart>
                    </ResponsiveContainer>
                </CollapsibleCard>
            )}
        </div>
    );
};

export default AnalyticsCardsPanel;
