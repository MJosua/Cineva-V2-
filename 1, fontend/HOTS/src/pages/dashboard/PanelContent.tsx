// src/pages/dashboard/PanelContent.tsx
// Renders the correct content based on panel type
import React from 'react';
import { DashboardPanel } from './DashboardPanelRenderer';

// Panel Components (lazy loading for performance)
const SummaryCardsPanel = React.lazy(() => import('./panels/SummaryCardsPanel'));
const AnalyticsPanel = React.lazy(() => import('./panels/AnalyticsPanel'));
const AnalyticsCardsPanel = React.lazy(() => import('./panels/AnalyticsCardsPanel'));
const GenericReportPanel = React.lazy(() => import('./panels/GenericReportPanel'));
const CMSPanel = React.lazy(() => import('./panels/CMSPanel'));
const ChartPanel = React.lazy(() => import('./panels/ChartPanel'));

// EXPLICIT COMPONENT REGISTRY - Required for production builds
// Dynamic imports with variables don't work in Vite production builds,
// so we must explicitly list all custom components here
export const CUSTOM_COMPONENT_REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    'srf_report': React.lazy(() => import('./report/srf_report')),
    'report_srf2': React.lazy(() => import('./report/srf_report2')),
    'report_srf': React.lazy(() => import('./report/srf_report')),
    'EOrderReporting': React.lazy(() => import('./report/EOrderReporting')),
    'JobListPage': React.lazy(() => import('./report/JobListPage')),
    'DefaultDashboard': React.lazy(() => import('./report/DefaultDashboard')),
    'ReportPublic': React.lazy(() => import('./report/ReportPublic')),
    'ReportService': React.lazy(() => import('./report/ReportService')),
    'WorkflowSummary': React.lazy(() => import('./report/WorkflowSummary')),
    'LaporanCuti': React.lazy(() => import('./report/LaporanCuti')),
    'LaporanIzin': React.lazy(() => import('./report/LaporanIzin')),
    'LaporanKoreksi': React.lazy(() => import('./report/LaporanKoreksi')),
    'LaporanLembur': React.lazy(() => import('./report/LaporanLembur')),
    'CardNameGenerator': React.lazy(() => import('./report/CardNameGenerator')),
    'ProjectDashboard': React.lazy(() => import('./report/ProjectDashboard')),
    'gantt_room_schedule': React.lazy(() => import('../../widgets/GanttRoomUsage')),
    'room_monitoring_panel': React.lazy(() => import('../../widgets/RoomMonitoringPanel')),
};

// Dynamic component loader - looks up from registry for production compatibility
const loadCustomComponent = (componentKey: string) => {
    const Component = CUSTOM_COMPONENT_REGISTRY[componentKey];
    if (Component) {
        return Component;
    }
    // Fallback for development (won't work in production for unlisted components)
    console.error(`Custom panel component not found in registry: ${componentKey}`);
    return React.lazy(() => Promise.resolve({
        default: () => <div className="p-4 text-red-500">Component "{componentKey}" not found. Add it to CUSTOM_COMPONENT_REGISTRY.</div>
    }));
};

interface PanelContentProps {
    panel: DashboardPanel;
    serviceId?: number;
    searchValue?: string;
}

export const PanelContent: React.FC<PanelContentProps> = ({ panel, serviceId, searchValue }) => {
    const renderPanel = () => {
        switch (panel.panel_type) {
            case 'summary':
                return <SummaryCardsPanel config={panel.config} serviceId={serviceId} />;

            case 'analytics':
                return <AnalyticsPanel config={panel.config} serviceId={serviceId} />;

            case 'report':
                return <GenericReportPanel config={panel.config} serviceId={serviceId} searchValue={searchValue} />;

            case 'cms':
                return <CMSPanel config={panel.config} />;

            case 'chart':
                return <ChartPanel config={panel.config} serviceId={serviceId} />;

            case 'analytics_cards':
                return <AnalyticsCardsPanel config={panel.config} serviceId={serviceId} />;

            case 'custom':
                if (panel.component_key) {
                    const CustomComponent = loadCustomComponent(panel.component_key);
                    return <CustomComponent {...panel.config} serviceId={serviceId} searchValue={searchValue} />;
                }
                return (
                    <div className="p-4 text-muted-foreground text-center">
                        No component_key specified for custom panel
                    </div>
                );

            default:
                return (
                    <div className="p-4 text-muted-foreground text-center">
                        Unknown panel type: {panel.panel_type}
                    </div>
                );
        }
    };

    return (
        <React.Suspense
            fallback={
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            }
        >
            {renderPanel()}
        </React.Suspense>
    );
};
