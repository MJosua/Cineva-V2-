import React from 'react';
import { DashboardPanel } from './DashboardPanelRenderer';
import WidgetRenderer from '@/widgets/WidgetRenderer';
import { widgetRegistry } from '@/registry/widgetRegistry';

// Panel Components (lazy loading for performance)
const SummaryCardsPanel = React.lazy(() => import('./panels/SummaryCardsPanel'));
const AnalyticsPanel = React.lazy(() => import('./panels/AnalyticsPanel'));
const AnalyticsCardsPanel = React.lazy(() => import('./panels/AnalyticsCardsPanel'));
const GenericReportPanel = React.lazy(() => import('./panels/GenericReportPanel'));
const CMSPanel = React.lazy(() => import('./panels/CMSPanel'));
const ChartPanel = React.lazy(() => import('./panels/ChartPanel'));

// ============================================================
// 🔥 Auto-discovery using Vite's import.meta.glob
// This automatically bundles ALL .tsx files in ./report/ folder
// No manual registration needed - just create a file with default export!
// ============================================================
const reportModules = import.meta.glob<{ default: React.ComponentType<any> }>(
    './report/*.tsx'
);

// Helper: Extract component key from path (e.g., './report/SRFReportPage.tsx' -> 'SRFReportPage')
const getComponentKey = (path: string): string => {
    const match = path.match(/\.\/report\/(.+)\.tsx$/);
    return match ? match[1] : path;
};

// Build a lookup map: { 'SRFReportPage': () => import(...), ... }
const moduleMap = Object.fromEntries(
    Object.entries(reportModules).map(([path, importFn]) => [
        getComponentKey(path),
        importFn
    ])
);

/**
 * Load a custom component by key.
 * Components are auto-discovered from ./report/*.tsx
 * Just ensure your component has a default export!
 */
const loadCustomComponent = (componentKey: string): React.LazyExoticComponent<React.ComponentType<any>> => {
    const importFn = moduleMap[componentKey];

    if (importFn) {
        return React.lazy(importFn);
    }

    // Component not found - return error placeholder
    console.error(`❌ Component "${componentKey}" not found in ./report/ folder`);
    console.info(`📁 Available components:`, Object.keys(moduleMap));

    return React.lazy(() => Promise.resolve({
        default: () => (
            <div className="p-4 text-red-500 bg-red-50 rounded border border-red-200">
                <strong>Component "{componentKey}" not found</strong>
                <p className="text-sm mt-1">
                    Create file: <code>./report/{componentKey}.tsx</code> with a default export
                </p>
            </div>
        )
    }));
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
                if (panel.config?.widgetId) {
                    const widgetConfig = widgetRegistry[panel.config.widgetId];
                    if (widgetConfig) {
                        return <WidgetRenderer config={widgetConfig} data={panel.config} />;
                    }
                    return (
                        <div className="p-4 bg-orange-50 text-orange-600 rounded">
                            Widget "{panel.config.widgetId}" not found in registry.
                        </div>
                    );
                }

                if (panel.component_key) {
                    const CustomComponent = loadCustomComponent(panel.component_key);
                    return <CustomComponent {...panel.config} serviceId={serviceId} />;
                }
                return (
                    <div className="p-4 text-muted-foreground text-center">
                        No component_key or widgetId specified for custom panel
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
