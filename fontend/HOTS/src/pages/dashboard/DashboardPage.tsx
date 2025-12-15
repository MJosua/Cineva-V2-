import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import DashboardCardEnhanced from "./DashboardCardEnhanced";
import { Database, LayoutDashboard, AlertTriangle, TrendingUp, Clock, CheckCircle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPublicPage } from "@/api/cms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WidgetRenderer from "@/widgets/WidgetRenderer";
import { widgetRegistry } from "@/registry/widgetRegistry";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

interface DashboardSummary {
    my_approvals_pending: number;
    my_tickets_open: number;
    my_assignments_active: number;
    tickets_this_week: number;
    tickets_this_month: number;
    srf_total: number;
    srf_pending: number;
    srf_approved: number;
    srf_rejected: number;
    order_volume_mtd: number;
    by_status: Record<string, number>;
    service_stats: { service_name: string; total_tickets: number; open_tickets: number; closed_tickets: number }[];
}

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
    const { data, loading, error, searchQuery } = useSelector((state: RootState) => state.dashboard);

    // CMS Hybrid State
    const [cmsPage, setCmsPage] = useState<any>(null);
    const [cmsLoading, setCmsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);

    // Dashboard Summary State
    const [summary, setSummary] = useState<DashboardSummary | null>(null);

    // Filter data based on search query
    const filteredData = data.filter(func =>
        func.title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
        (func.description && func.description.toLowerCase().includes((searchQuery || '').toLowerCase()))
    );

    // Group by category (for legacy dashboard)
    const grouped = filteredData.reduce<Record<string, typeof data>>((acc, func) => {
        const category = func.category_name || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(func);
        return acc;
    }, {});

    // Fetch dashboard summary
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('tokek');
                const res = await axios.get(`${API_URL}/hotsdashboard/summary`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setSummary(res.data.summary);
                }
            } catch (err) {
                console.warn('Failed to fetch dashboard summary:', err);
            }
        };
        fetchSummary();
    }, []);

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



    // Helper to get summary for a dashboard item
    const getSummaryForItem = (itemId: number): any => {
        if (!summary) return undefined;

        // Calculate service report totals from service_stats
        const serviceTotal = summary.service_stats?.reduce((sum, s: any) => sum + (s.total_tickets || 0), 0) || 0;
        const serviceOpen = summary.service_stats?.reduce((sum, s: any) => sum + (s.open_tickets || 0), 0) || 0;

        // Map dashboard IDs to relevant summary data
        const summaryMappings: Record<number, any> = {
            // Approvals dashboard
            1: summary.my_approvals_pending > 0 ? {
                total: summary.my_approvals_pending,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'Pending', value: summary.my_approvals_pending, color: 'bg-amber-100 text-amber-700' }
                ]
            } : undefined,
            // E-Order Reporting
            2: {
                total: summary.order_volume_mtd,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'MTD Volume', value: summary.order_volume_mtd?.toLocaleString() || '0' }
                ]
            },
            // SRF Ticket Report
            5: {
                total: summary.srf_total,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'Total', value: summary.srf_total },
                    { label: 'Pending', value: summary.srf_pending, color: 'bg-amber-100 text-amber-700' },
                    { label: 'Approved', value: summary.srf_approved, color: 'bg-green-100 text-green-700' }
                ]
            },
            // Tickets This Month
            6: {
                total: summary.tickets_this_month,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'This Month', value: summary.tickets_this_month },
                    { label: 'This Week', value: summary.tickets_this_week, color: 'bg-blue-100 text-blue-700' }
                ]
            },
            // My Tickets
            7: {
                total: summary.my_tickets_open,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'Open', value: summary.my_tickets_open, color: 'bg-amber-100 text-amber-700' }
                ]
            },
            // My Assignments
            8: summary.my_assignments_active > 0 ? {
                total: summary.my_assignments_active,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'Active', value: summary.my_assignments_active, color: 'bg-blue-100 text-blue-700' }
                ]
            } : undefined,
            // Service Report (ID 10)
            10: {
                total: serviceTotal,
                trend: 0,
                trendDirection: 'neutral' as const,
                sparklineData: [],
                quickStats: [
                    { label: 'Total', value: serviceTotal },
                    { label: 'Open', value: serviceOpen, color: 'bg-amber-100 text-amber-700' }
                ]
            },
            // Job Marketplace (ID 11)
            11: undefined // No summary for job marketplace
        };

        return summaryMappings[itemId];
    };

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

    if (cmsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    // CMS Dashboard (if page exists)
    if (cmsPage && blocks.length > 0) {
        return (
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
        );
    }

    // Legacy Dashboard (fallback)
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600">Browse all reporting functions available in HOTS</p>
                </div>
                {/* Setup Action for Admins */}
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-dashed border-2"
                    onClick={async () => {
                        if (!window.confirm("Create default dashboard page? This will set up the main Widgets view.")) return;
                        try {
                            const token = localStorage.getItem('tokek');
                            const defaultContent = {
                                slug: 'dashboard-home',
                                title: 'My Dashboard',
                                summary: 'Overview of your tickets and approvals',
                                is_published: true,
                                content_json: [
                                    {
                                        type: "heading",
                                        text: "Quick Actions"
                                    },
                                    {
                                        type: "widget",
                                        widgetId: "quick_links",
                                        params: {
                                            items: [
                                                { title: "Guest Info", description: "Visitor logs", url: "/guest-info", icon: "Users", color: "bg-blue-50 text-blue-600" },
                                                { title: "Admin Report", description: "System analytics", url: "/admin/reports", icon: "FileText", color: "bg-purple-50 text-purple-600" },
                                                { title: "Help Center", description: "Guides & FAQs", url: "/help-center", icon: "HelpCircle", color: "bg-orange-50 text-orange-600" }
                                            ]
                                        }
                                    },
                                    {
                                        type: "divider"
                                    },
                                    {
                                        type: "widget",
                                        widgetId: "my_tickets",
                                        params: {}
                                    },
                                    {
                                        type: "widget",
                                        widgetId: "pending_approvals",
                                        params: {}
                                    }
                                ]
                            };
                            const api = await import('@/config/sourceConfig');
                            await fetch(`${api.API_URL}/cms/pages`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(defaultContent)
                            });
                            window.location.reload();
                        } catch (e) {
                            alert("Failed to initialize dashboard: " + e);
                        }
                    }}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Initialize Dashboard
                </Button>
            </div>

            {loading && (
                <Skeleton className="h-48 w-full" />
            )}

            {grouped && Object.entries(grouped).map(([category, functions]) => (
                <div key={category}>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-2 rounded-lg bg-green-100`}>
                            <Database className="w-6 h-6 text-green-700" />
                        </div>
                        <h2 className="text-xl font-semibold text-green-900">{category}</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {functions.map((func) => (
                            <DashboardCardEnhanced
                                key={func.id}
                                func={func}
                                summary={getSummaryForItem(func.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardPage;
