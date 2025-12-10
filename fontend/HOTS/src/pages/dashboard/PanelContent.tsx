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

// Dynamic component loader - loads from pages/dashboard/report/{component_key}.tsx
// No hardcoding needed! Just name your file to match component_key in database
const loadCustomComponent = (componentKey: string) => {
    return React.lazy(() =>
        import(`./report/${componentKey}`).catch(() => {
            console.error(`Custom panel component not found: ./report/${componentKey}`);
            return { default: () => <div className="p-4 text-red-500">Component "{componentKey}" not found</div> };
        })
    );
};

interface PanelContentProps {
    panel: DashboardPanel;
    serviceId?: number;
}

export const PanelContent: React.FC<PanelContentProps> = ({ panel, serviceId }) => {
    const renderPanel = () => {
        switch (panel.panel_type) {
            case 'summary':
                return <SummaryCardsPanel config={panel.config} serviceId={serviceId} />;

            case 'analytics':
                return <AnalyticsPanel config={panel.config} serviceId={serviceId} />;

            case 'report':
                return <GenericReportPanel config={panel.config} serviceId={serviceId} />;

            case 'cms':
                return <CMSPanel config={panel.config} />;

            case 'chart':
                return <ChartPanel config={panel.config} serviceId={serviceId} />;

            case 'analytics_cards':
                return <AnalyticsCardsPanel config={panel.config} serviceId={serviceId} />;

            case 'custom':
                if (panel.component_key) {
                    const CustomComponent = loadCustomComponent(panel.component_key);
                    return <CustomComponent {...panel.config} serviceId={serviceId} />;
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
