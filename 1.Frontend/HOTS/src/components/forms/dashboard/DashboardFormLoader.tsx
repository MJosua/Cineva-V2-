// src/pages/dashboard/DashboardModuleLoader.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/hooks/useAppSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDashboardFunctions } from "@/store/slices/dashboardSlice";
import { DashboardFunction } from "@/types/hotsDashboard";
import DashboardPanelRenderer from "@/pages/dashboard/DashboardPanelRenderer";
import { CUSTOM_COMPONENT_REGISTRY } from "@/pages/dashboard/PanelContent";

export const DashboardModuleLoader: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const params = useParams();
    const location = useLocation();

    // Resolve current path from URL
    const currentPath =
        params["*"] ||
        Object.values(params)[0] ||
        location.pathname.replace(/^\/+/, "");

    const { data: dashboardFunctions, loading } = useAppSelector(
        (state) => state.dashboard
    );

    const [dashboardInfo, setDashboardInfo] = useState<DashboardFunction | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch dashboard definitions if not available
    useEffect(() => {
        dispatch(fetchDashboardFunctions());
    }, [dispatch]);

    // Match dashboard info by path
    useEffect(() => {
        if (!loading && dashboardFunctions.length > 0) {
            const module = dashboardFunctions.find(
                (f) => f.path?.replace(/^\/+/, "") === currentPath
            );
            if (!module) {
                setError(`No dashboard module found for path: ${currentPath}`);
                setDashboardInfo(null);
            } else {
                setDashboardInfo(module);
                setError(null);
            }
            setIsLoading(false);
        }
    }, [dashboardFunctions, loading, currentPath]);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-96" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-4 p-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
                <div className="text-red-600 text-lg">{error}</div>
            </div>
        );
    }

    // Module not found
    if (!dashboardInfo) {
        return (
            <div className="p-4 text-gray-400 text-center">
                No module data available.
            </div>
        );
    }

    // ✅ Resolve component from central registry using the 'widget' key from DB
    const widgetKey = dashboardInfo.widget;
    const Component = CUSTOM_COMPONENT_REGISTRY[widgetKey];

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {dashboardInfo.title}
                </div>

                {dashboardInfo.widget && (
                    <div className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        Widget: {dashboardInfo.widget}
                    </div>
                )}
            </div>

            {/* Description */}
            {dashboardInfo.description && (
                <p className="text-gray-500">{dashboardInfo.description}</p>
            )}

            {/* Module Body */}
            <div className="border rounded-lg p-6 bg-white shadow-sm min-h-[500px]">
                {Component ? (
                    <React.Suspense fallback={
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    }>
                        <Component serviceId={dashboardInfo.related_service_id || undefined} />
                    </React.Suspense>
                ) : (
                    /* Fallback to panel renderer (composite dashboards) */
                    <DashboardPanelRenderer
                        dashboardId={dashboardInfo.id}
                        serviceId={dashboardInfo.related_service_id || undefined}
                    />
                )}
            </div>
        </div>
    );
};
