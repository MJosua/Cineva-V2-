// src/pages/dashboard/panels/SummaryCardsPanel.tsx
// Renders summary KPI cards from config
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CardConfig {
    key: string;
    label: string;
    color?: string;
    icon?: string;
}

interface SummaryCardsPanelProps {
    config: {
        cards?: CardConfig[];
        apiEndpoint?: string;
    };
    serviceId?: number;
}

const ICONS: Record<string, React.FC<{ className?: string }>> = {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
};

const COLORS: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
};

const SummaryCardsPanel: React.FC<SummaryCardsPanelProps> = ({ config, serviceId }) => {
    const [data, setData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [trend, setTrend] = useState<number>(0);

    useEffect(() => {
        fetchData();
    }, [serviceId, config.apiEndpoint]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');

            // Use provided endpoint or default service summary
            const endpoint = config.apiEndpoint?.replace('{service_id}', String(serviceId))
                || `/hotsdashboard/service_summary/${serviceId}`;

            const res = await axios.get(`${API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success && res.data.kpis) {
                setData(res.data.kpis);
                setTrend(res.data.kpis.trend || 0);
            }
        } catch (err) {
            console.error('Error fetching summary data:', err);
        } finally {
            setLoading(false);
        }
    };

    const cards = config.cards || [
        { key: 'total', label: 'Total', color: 'blue', icon: 'FileText' },
        { key: 'pending', label: 'Pending', color: 'amber', icon: 'Clock' },
        { key: 'approved', label: 'Approved', color: 'green', icon: 'CheckCircle' },
        { key: 'rejected', label: 'Rejected', color: 'red', icon: 'XCircle' },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = ICONS[card.icon || 'FileText'] || FileText;
                const colorClass = COLORS[card.color || 'blue'];
                const value = data[card.key] ?? 0;

                return (
                    <Card
                        key={card.key}
                        className={`relative overflow-hidden bg-gradient-to-br ${colorClass} text-white`}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium opacity-80">{card.label}</p>
                                    <p className="text-3xl font-bold mt-1">{value}</p>
                                </div>
                                <Icon className="w-8 h-8 opacity-50" />
                            </div>

                            {/* Show trend only on first card */}
                            {card.key === 'total' && trend !== 0 && (
                                <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                                    {trend > 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    <span>{Math.abs(trend)}% vs last period</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default SummaryCardsPanel;
