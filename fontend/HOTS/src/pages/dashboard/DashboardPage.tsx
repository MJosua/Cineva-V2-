import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import DashboardCardEnhanced from "./DashboardCardEnhanced";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Database, Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

// Type for service summary data from API
interface ServiceSummary {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'neutral';
    sparklineData: { value: number }[];
}

const DashboardPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, error } = useSelector((state: RootState) => state.dashboard);
    const [summaries, setSummaries] = useState<Record<number, ServiceSummary>>({});
    const [summaryLoading, setSummaryLoading] = useState(false);

    useEffect(() => {
        dispatch(fetchDashboardFunctions());
    }, [dispatch]);

    // Fetch summaries for dashboard functions with related_service_id
    useEffect(() => {
        const fetchSummaries = async () => {
            if (!data || data.length === 0) return;

            const token = localStorage.getItem('tokek');
            if (!token) return;

            setSummaryLoading(true);
            const newSummaries: Record<number, ServiceSummary> = {};

            // Get unique service IDs that need summaries
            const serviceIds = new Set<number>();
            data.forEach(func => {
                if (func.related_service_id) {
                    serviceIds.add(func.related_service_id);
                }
            });

            // Fetch summaries in parallel
            await Promise.all(
                Array.from(serviceIds).map(async (serviceId) => {
                    try {
                        const res = await axios.get(
                            `${API_URL}/hotsdashboard/service_summary/${serviceId}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (res.data.success) {
                            newSummaries[serviceId] = {
                                total: res.data.kpis.total,
                                pending: res.data.kpis.pending,
                                approved: res.data.kpis.approved,
                                rejected: res.data.kpis.rejected,
                                trend: res.data.kpis.trend,
                                trendDirection: res.data.kpis.trendDirection,
                                sparklineData: res.data.sparklineData || []
                            };
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch summary for service ${serviceId}:`, err);
                    }
                })
            );

            setSummaries(newSummaries);
            setSummaryLoading(false);
        };

        fetchSummaries();
    }, [data]);

    // Group by category
    const grouped = data.reduce<Record<string, typeof data>>((acc, func) => {
        const category = func.category_name || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(func);
        return acc;
    }, {});

    // Transform API summary to card summary format
    const getCardSummary = (func: typeof data[0]) => {
        if (!func.related_service_id) return undefined;

        const summary = summaries[func.related_service_id];
        if (!summary) return undefined;

        return {
            total: summary.total,
            trend: Math.abs(summary.trend),
            trendDirection: summary.trendDirection,
            sparklineData: summary.sparklineData,
            quickStats: [
                { label: 'Pending', value: summary.pending, color: 'bg-amber-100 text-amber-700' },
                { label: 'Approved', value: summary.approved, color: 'bg-green-100 text-green-700' },
                { label: 'Rejected', value: summary.rejected, color: 'bg-red-100 text-red-700' }
            ]
        };
    };

    return (
        <AppLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Dashboard Item</h1>
                        <p className="text-gray-600">Browse all reporting function available in HOTS</p>
                    </div>
                </div>

                {loading && (
                    <Skeleton className="h-48 w-full">
                    </Skeleton>
                )}

                {grouped && Object.entries(grouped).map(([category, functions]) => (
                    <div key={category}>

                        <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg rounded-lg bg-green-100`}>
                                <Database className="w-6 h-6 text-green-700" />
                            </div>
                            <h2 className="text-xl font-semibold text-green-900">{category}</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {functions.map((func) => (
                                <DashboardCardEnhanced
                                    key={func.id}
                                    func={func}
                                    summary={getCardSummary(func)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
};

export default DashboardPage;

