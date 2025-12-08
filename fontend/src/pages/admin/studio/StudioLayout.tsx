
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Save, Settings, Sliders, Play, Box, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/layout/AppLayout';

interface StudioLayoutProps {
    children: React.ReactNode;
    title: string;
    onSave?: () => void;
    isSaving?: boolean;
    onBack?: () => void;
    mode?: 'form' | 'workflow' | 'triggers' | 'settings';
    setMode?: (mode: 'form' | 'workflow' | 'triggers' | 'settings') => void;
}

export const StudioLayout: React.FC<StudioLayoutProps> = ({
    children,
    title,
    onSave,
    isSaving = false,
    onBack,
    mode = 'form',
    setMode
}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/admin/studio');
        }
    };

    return (
        <SidebarProvider defaultOpen={false}>
            <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
                {/* Collapsible Sidebar */}
                <AppSidebar />

                {/* Main Studio Area */}
                <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                    {/* Top Bar */}
                    <div className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm z-10 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="bg-secondary hover:bg-secondary/50" />
                            <Button variant="ghost" size="sm" onClick={handleBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <div className='flex items-center gap-2'>
                                <div className="bg-blue-600 p-1.5 rounded-md">
                                    <Box className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-lg font-semibold">{title || 'Untitled Service'} <span className="text-gray-400 font-normal text-sm ml-2">Infinity Studio</span></h1>
                            </div>
                        </div>

                        {/* Mode Switcher - Center */}
                        {setMode && (
                            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setMode('form')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'form' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Form Design
                                </button>
                                <button
                                    onClick={() => setMode('workflow')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'workflow' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Workflow
                                </button>
                                <button
                                    onClick={() => setMode('triggers')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'triggers' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Triggers
                                </button>
                                <button
                                    onClick={() => setMode('settings')}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'settings' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Settings
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {onSave && (
                                <Button onClick={onSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area - Full height minus header */}
                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};
