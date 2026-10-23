// src/pages/dashboard/panels/ChartPanel.tsx
// Renders configurable charts from config
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid
} from 'recharts';

interface SeriesConfig {
    key: string;
    label: string;
    color?: string;
}

interface ChartPanelProps {
    config: {
        chartType?: 'area' | 'bar' | 'line';
        title?: string;
        apiEndpoint?: string;
        xAxis?: string;
        series?: SeriesConfig[];
    };
    serviceId?: number;
}

const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const ChartPanel: React.FC<ChartPanelProps> = ({ config, serviceId }) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        chartType = 'area',
        title = 'Chart',
        apiEndpoint,
        xAxis = 'date',
        series = [{ key: 'value', label: 'Value' }]
    } = config;

    useEffect(() => {
        fetchData();
    }, [serviceId, apiEndpoint]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');

            const endpoint = apiEndpoint?.replace('{service_id}', String(serviceId))
                || `/hotsdashboard/service_summary/${serviceId}`;

            const res = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Try different possible data locations
                setData(res.data.trendData || res.data.chartData || res.data.results || []);
            }
        } catch (err) {
            console.error('Error fetching chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Skeleton className="h-64 w-full" />;
    }

    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 }
        };

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        {series.map((s, i) => (
                            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        {series.map((s, i) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                strokeWidth={2}
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
            default:
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {series.map((s, i) => (
                                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis dataKey={xAxis} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        {series.map((s, i) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label}
                                stroke={s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
                                fill={`url(#gradient-${s.key})`}
                            />
                        ))}
                    </AreaChart>
                );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default ChartPanel;
