// src/pages/dashboard/panels/AnalyticsPanel.tsx
// Renders analytics overview with charts (ports from ServiceAnalyticsView)
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts';

interface AnalyticsPanelProps {
    config: {
        showTrendChart?: boolean;
        showStatusPie?: boolean;
        showRecentActivity?: boolean;
        defaultDateRange?: string;
    };
    serviceId?: number;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ config, serviceId }) => {
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [statusData, setStatusData] = useState<any[]>([]);

    const {
        showTrendChart = true,
        showStatusPie = true,
        defaultDateRange = '30d'
    } = config;

    useEffect(() => {
        if (serviceId) {
            fetchAnalytics();
        }
    }, [serviceId, defaultDateRange]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');

            const res = await axios.get(`${API_URL}/hotsdashboard/service_summary/${serviceId}?range=${defaultDateRange}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setTrendData(res.data.trendData || []);
                setStatusData(res.data.statusDistribution || []);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trend Chart */}
            {showTrendChart && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Request Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="#3b82f6"
                                    fill="url(#colorRequests)"
                                    name="Requests"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="approved"
                                    stroke="#22c55e"
                                    fill="url(#colorApproved)"
                                    name="Approved"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Status Distribution Pie */}
            {showStatusPie && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AnalyticsPanel;
