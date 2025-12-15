import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetProps } from '@/types/widgetTypes';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowRight, FileText, Users, Settings, Database,
    HelpCircle, ExternalLink, Shield, LayoutDashboard,
    Briefcase, ShoppingCart, MessageSquare
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    FileText, Users, Settings, Database, HelpCircle,
    ExternalLink, Shield, LayoutDashboard, Briefcase,
    ShoppingCart, MessageSquare
};

const QuickLinksWidget: React.FC<WidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    const items = data?.items || [
        {
            title: 'Guest Info',
            description: 'Visitor logs and access',
            url: '/guest-info',
            icon: 'Users',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Admin Report',
            description: 'System-wide analytics',
            url: '/admin/reports',
            icon: 'FileText',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'System Health',
            description: 'Server status & logs',
            url: '/admin/system',
            icon: 'Database',
            color: 'bg-green-50 text-green-600'
        },
        {
            title: 'Help Center',
            description: 'Guides and FAQs',
            url: '/help-center',
            icon: 'HelpCircle',
            color: 'bg-orange-50 text-orange-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {items.map((item: any, idx: number) => {
                const Icon = ICON_MAP[item.icon] || ExternalLink;
                const isExternal = item.url.startsWith('http');

                const handleClick = () => {
                    if (isExternal) window.open(item.url, '_blank');
                    else navigate(item.url);
                };

                return (
                    <Card
                        key={idx}
                        className="group hover:shadow-md transition-all cursor-pointer border-l-4"
                        style={{ borderLeftColor: item.color?.includes('blue') ? '#3b82f6' : 'currentColor' }}
                        onClick={handleClick}
                    >
                        <CardContent className="p-4 flex items-start justify-between">
                            <div className="flex gap-3">
                                <div className={`p-2 rounded-lg ${item.color || 'bg-gray-100 text-gray-600'}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default QuickLinksWidget;
