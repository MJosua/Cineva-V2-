import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import DashboardCard from "./DashboardCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Database, Icon, LayoutDashboard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPublicPage } from "@/api/cms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { widgetRegistry } from "@/registry/widgetRegistry";
import ErrorBoundary from "@/components/ErrorBoundary";

// CMS Block Renderer with error handling
const renderBlock = (block: any, idx: number) => {
    try {
        switch (block.type) {
            case 'heading':
                return <h2 key={idx} className="text-2xl font-semibold">{block.text}</h2>;
            case 'text':
                return <p key={idx} className="prose">{block.text}</p>;
            case 'html':
                return <div key={idx} dangerouslySetInnerHTML={{ __html: block.html }} />;
            case 'image':
                return <img key={idx} src={block.src} alt={block.alt || ''} className="max-w-full" />;
            case 'divider':
                return <hr key={idx} className="my-4" />;
            case 'widget': {
                const widgetConfig = widgetRegistry[block.widgetId];
                if (!widgetConfig) {
                    return (
                        <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
                            Widget "{block.widgetId}" not found. It may not be installed yet.
                        </div>
                    );
                }
                return (
                    <ErrorBoundary key={idx} fallbackMessage={`Widget "${widgetConfig.name}" failed to load`}>
                        <div className="my-4">
                            <WidgetRenderer config={widgetConfig} data={block.params} />
                        </div>
                    </ErrorBoundary>
                );
            }
            default:
                return <pre key={idx} className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(block, null, 2)}</pre>;
        }
    } catch (error) {
        console.error('Error rendering block:', block, error);
        return (
            <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Failed to render block. Please check console for details.
            </div>
        );
    }
};

const DashboardPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, error } = useSelector((state: RootState) => state.dashboard);

    // CMS Hybrid State
    const [cmsPage, setCmsPage] = useState<any>(null);
    const [cmsLoading, setCmsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);

    // Attempt to load CMS dashboard page first
    useEffect(() => {
        fetchPublicPage('dashboard-home')
            .then(res => {
                if (res.ok && res.page) {
                    setCmsPage(res.page);
                } else {
                    setUseFallback(true);
                }
            })
            .catch(() => setUseFallback(true))
            .finally(() => setCmsLoading(false));
    }, []);

    // Load legacy dashboard data as fallback
    useEffect(() => {
        if (useFallback) {
            dispatch(fetchDashboardFunctions());
        }
    }, [dispatch, useFallback]);

    // Group by category (for legacy dashboard)
    const grouped = data.reduce<Record<string, typeof data>>((acc, func) => {
        const category = func.category_name || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(func);
        return acc;
    }, {});

    // Parse CMS content
    const blocks = (() => {
        if (!cmsPage) return [];
        try {
            if (Array.isArray(cmsPage.content_json)) return cmsPage.content_json;
            if (typeof cmsPage.content_json === "string") return JSON.parse(cmsPage.content_json);
            return [];
        } catch (err) {
            console.error("Failed to parse dashboard content_json:", err);
            return [];
        }
    })();

    // Loading state
    if (cmsLoading) {
        return (
            <AppLayout>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </AppLayout>
        );
    }

    // CMS Dashboard (if page exists)
    if (cmsPage && blocks.length > 0) {
        return (
            <AppLayout>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-primary" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{cmsPage.title || 'Dashboard'}</h1>
                                <p className="text-gray-600">{cmsPage.summary || 'Welcome to your personalized dashboard'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {blocks.map(renderBlock)}
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Legacy Dashboard (fallback)
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
                    <Skeleton className="h-48 w-full" />
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
                                <DashboardCard key={func.id} func={func} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </AppLayout>
    );
};

export default DashboardPage;

