// src/pages/dashboard/DashboardPanelRenderer.tsx
// Main renderer that loads panels and renders based on panel type
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardCollapsible } from '@/components/ui/CardCollapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelContent } from './PanelContent';
import { BarChart3, FileText, LayoutDashboard, Settings } from 'lucide-react';
import WidgetRenderer from '@/widgets/WidgetRenderer';
import { widgetRegistry } from '@/registry/widgetRegistry';

export interface DashboardPanel {
    id: number;
    dashboard_function_id: number;
    panel_type: 'summary' | 'analytics' | 'analytics_cards' | 'report' | 'cms' | 'chart' | 'custom';
    title: string;
    component_key?: string;
    order_index: number;
    is_tab: boolean;
    is_collapsible: boolean;
    default_collapsed: boolean;
    config: Record<string, any>;
}

interface DashboardPanelRendererProps {
    dashboardId: number;
    serviceId?: number;
}

const PANEL_ICONS: Record<string, React.ReactNode> = {
    summary: <LayoutDashboard className="w-4 h-4" />,
    analytics: <BarChart3 className="w-4 h-4" />,
    analytics_cards: <BarChart3 className="w-4 h-4" />,
    report: <FileText className="w-4 h-4" />,
    cms: <FileText className="w-4 h-4" />,
    chart: <BarChart3 className="w-4 h-4" />,
    custom: <Settings className="w-4 h-4" />,
};

const DashboardPanelRenderer: React.FC<DashboardPanelRendererProps> = ({ dashboardId, serviceId }) => {
    const [panels, setPanels] = useState<DashboardPanel[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('');

    useEffect(() => {
        fetchPanels();
    }, [dashboardId]);

    const fetchPanels = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');
            const res = await axios.get(`${API_URL}/hotsdashboard/panels/${dashboardId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                let fetchedPanels = res.data.panels;

                // Fallback for known missing panels (map to existing components)
                if (!fetchedPanels || fetchedPanels.length === 0) {
                    const id = Number(dashboardId);

                    // Map specific IDs to known components (component_key matches files in ./report/)
                    const componentMapping: Record<number, { title: string; component_key: string }> = {
                        2: { title: 'E-Order Reporting', component_key: 'EOrderReporting' },
                        5: { title: 'SRF Ticket Report', component_key: 'SRFReportPage' },
                        10: { title: 'Service Report', component_key: 'ReportService' },
                        11: { title: 'Job Marketplace', component_key: 'JobListPage' },
                        // Add more mappings as needed
                    };

                    if (componentMapping[id]) {
                        fetchedPanels = [
                            {
                                id: 999000 + id,
                                dashboard_function_id: id,
                                panel_type: 'custom',
                                title: componentMapping[id].title,
                                component_key: componentMapping[id].component_key,
                                order_index: 0,
                                is_tab: false,
                                is_collapsible: false,
                                default_collapsed: false,
                                config: {}
                            }
                        ];
                    }
                    // For unmapped IDs, leave panels empty - will show "No panels configured" message
                }

                setPanels(fetchedPanels);
                // Set first tab as active
                const firstTab = fetchedPanels.find((p: DashboardPanel) => p.is_tab);
                if (firstTab) {
                    setActiveTab(String(firstTab.id));
                }
            }
        } catch (err) {
            console.error('Error fetching panels:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    // No panels configured - show empty state
    if (panels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <LayoutDashboard className="w-12 h-12 mb-4 opacity-50" />
                <p>No panels configured for this dashboard.</p>
            </div>
        );
    }

    // Separate always-visible panels from tab panels
    const alwaysVisiblePanels = panels.filter(p => !p.is_tab);
    const tabPanels = panels.filter(p => p.is_tab);

    return (
        <div className="space-y-6">
            {/* Always-visible panels (summary cards, etc.) */}
            {alwaysVisiblePanels.map(panel => (
                panel.is_collapsible ? (
                    <CardCollapsible
                        key={panel.id}
                        title={panel.title}
                        defaultOpen={!panel.default_collapsed}
                    >
                        <PanelContent panel={panel} serviceId={serviceId} />
                    </CardCollapsible>
                ) : (
                    <div key={panel.id} className="rounded-lg border bg-card p-4">
                        <h3 className="font-semibold mb-4">{panel.title}</h3>
                        <PanelContent panel={panel} serviceId={serviceId} />
                    </div>
                )
            ))}

            {/* Tabbed panels */}
            {tabPanels.length > 0 && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabPanels.length}, 1fr)` }}>
                        {tabPanels.map(panel => (
                            <TabsTrigger key={panel.id} value={String(panel.id)} className="flex items-center gap-2">
                                {PANEL_ICONS[panel.panel_type]}
                                {panel.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {tabPanels.map(panel => (
                        <TabsContent key={panel.id} value={String(panel.id)} className="mt-4">
                            <PanelContent panel={panel} serviceId={serviceId} />
                        </TabsContent>
                    ))}
                </Tabs>
            )}
        </div>
    );
};

export default DashboardPanelRenderer;
