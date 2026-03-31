import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchDashboardFunctions, fetchDashboardSummaries } from "@/store/slices/dashboardSlice";
import DashboardCardEnhanced from "./DashboardCardEnhanced";
import { AppLayout } from "@/components/layout/AppLayout";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";
import { useHeader } from "@/contexts/HeaderContext";

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
    const { data, summaries, loading, summaryLoading } = useSelector((state: RootState) => state.dashboard);

    useEffect(() => {
        if (data.length === 0) {
            dispatch(fetchDashboardFunctions());
        }
    }, [dispatch, data]);

    // Fetch summaries if we have data but no summaries
    useEffect(() => {
        if (data && data.length > 0 && Object.keys(summaries).length === 0) {
            dispatch(fetchDashboardSummaries(data));
        }
    }, [data, dispatch, summaries]);

    // Filter data based on search value
    const { searchValue, setSearchPlaceholder } = useHeader();

    useEffect(() => {
        setSearchPlaceholder("Search dashboard...");
    }, [setSearchPlaceholder]);

    const filteredData = data.filter(func =>
        !searchValue ||
        func.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        (func.description && func.description.toLowerCase().includes(searchValue.toLowerCase())) ||
        (func.category_name && func.category_name.toLowerCase().includes(searchValue.toLowerCase()))
    );

    // Group by category
    const grouped = filteredData.reduce<Record<string, typeof data>>((acc, func) => {
        const category = func.category_name || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(func);
        return acc;
    }, {});

    // Transform API summary to card summary format
    const getCardSummary = (func: typeof data[0]) => {
        // Look up by function ID (not service ID anymore)
        const summary = summaries[func.id];
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

            {grouped && Object.keys(grouped).length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                        {searchValue ? `No dashboard items match "${searchValue}"` : "You don't have access to any dashboard reports."}
                    </p>
                    {searchValue ? (
                        <p className="text-sm">Try using different keywords.</p>
                    ) : (
                        <p className="text-sm">Contact your administrator if you believe this is an error.</p>
                    )}
                </div>
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
    );
};

export default DashboardPage;

