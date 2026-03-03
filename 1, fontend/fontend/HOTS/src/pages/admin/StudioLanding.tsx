import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogData } from '@/hooks/useCatalogData';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ArrowRight, FileText, GitBranch, Plus } from 'lucide-react';

const StudioLanding: React.FC = () => {
    const navigate = useNavigate();
    const { serviceCatalog, isLoading } = useCatalogData();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-white" />
                        </div>
                        Visual Studio
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Design forms and workflows visually with drag-and-drop
                    </p>
                </div>
                <Button onClick={() => navigate('/admin/studio/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Service
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{serviceCatalog.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {serviceCatalog.filter(s => s.active === 1).length}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Draft</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {serviceCatalog.filter(s => s.active !== 1).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services List */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Select a Service to Edit</h2>

                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading services...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {serviceCatalog.map((service) => (
                            <Card
                                key={service.service_id}
                                className="hover:shadow-lg transition-all cursor-pointer group hover:border-primary"
                                onClick={() => navigate(`/admin/studio/${service.service_id}`)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base group-hover:text-primary transition-colors">
                                            {service.service_name}
                                        </CardTitle>
                                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <CardDescription className="text-xs">
                                        {service.service_description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            <span>Form</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <GitBranch className="w-3 h-3" />
                                            <span>Workflow</span>
                                        </div>
                                        <span className={`ml-auto px-2 py-0.5 rounded text-xs ${service.active === 1
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {service.active === 1 ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioLanding;
