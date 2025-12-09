// src/pages/dashboard/DashboardView.tsx
// Main page that hosts the panel-based dashboard
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardPanelRenderer from './DashboardPanelRenderer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Settings } from 'lucide-react';

interface DashboardFunction {
    id: number;
    title: string;
    description: string;
    icon: string;
    related_service_id: number | null;
}

const DashboardView: React.FC = () => {
    const { dashboardId } = useParams<{ dashboardId: string }>();
    const navigate = useNavigate();
    const [dashboardInfo, setDashboardInfo] = useState<DashboardFunction | null>(null);
    const [dateRange, setDateRange] = useState('30d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (dashboardId) {
            fetchDashboardInfo();
        }
    }, [dashboardId]);

    const fetchDashboardInfo = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');

            // Fetch dashboard functions and find the current one
            const res = await axios.get(`${API_URL}/hotsdashboard/functions`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const found = res.data.find((f: DashboardFunction) => f.id === Number(dashboardId));
            setDashboardInfo(found || null);
        } catch (err) {
            console.error('Error fetching dashboard info:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-1/3" />
                        <div className="h-32 bg-muted rounded" />
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!dashboardInfo) {
        return (
            <AppLayout>
                <div className="p-6 text-center">
                    <p className="text-muted-foreground">Dashboard not found.</p>
                    <Button variant="outline" onClick={() => navigate('/dashboard')} className="mt-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{dashboardInfo.title}</h1>
                            <p className="text-sm text-muted-foreground">{dashboardInfo.description}</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-32">
                                <Calendar className="w-4 h-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">7 Days</SelectItem>
                                <SelectItem value="30d">30 Days</SelectItem>
                                <SelectItem value="90d">90 Days</SelectItem>
                                <SelectItem value="YTD">Year to Date</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" size="icon" title="Settings">
                            <Settings className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Panel Renderer */}
                <DashboardPanelRenderer
                    dashboardId={Number(dashboardId)}
                    serviceId={dashboardInfo.related_service_id || undefined}
                />
            </div>
        </AppLayout>
    );
};

export default DashboardView;
