import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import * as Icons from "lucide-react";
import { AppWindow, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardFunction } from "@/types/hotsDashboard";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Pin, Settings, ArrowRight } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface DashboardCardEnhancedProps {
    func: DashboardFunction;
    summary?: {
        total: number;
        trend: number; // percentage change
        trendDirection: 'up' | 'down' | 'neutral';
        sparklineData: { value: number }[];
        quickStats?: {
            label: string;
            value: number;
            color?: string;
        }[];
    };
}

const DashboardCardEnhanced: React.FC<DashboardCardEnhancedProps> = ({ func, summary }) => {
    const navigate = useNavigate();
    // Safety check for dynamic icon loading
    const getIcon = () => {
        try {
            const iconName = func.icon || "AppWindow";
            const ValidIcon = (Icons as any)[iconName];
            return ValidIcon || AppWindow || Square; // Fallbacks
        } catch (e) {
            return AppWindow || Square;
        }
    };
    const Icon = getIcon();

    // Check if we have real data
    const hasData = summary && summary.total > 0;

    const TrendIcon = summary?.trendDirection === 'up'
        ? TrendingUp
        : summary?.trendDirection === 'down'
            ? TrendingDown
            : Minus;

    const trendColor = summary?.trendDirection === 'up'
        ? 'text-green-600'
        : summary?.trendDirection === 'down'
            ? 'text-red-600'
            : 'text-gray-400';

    const chartConfig = {
        value: {
            color: summary?.trendDirection === 'up' ? "hsl(142, 76%, 36%)" :
                summary?.trendDirection === 'down' ? "hsl(0, 84%, 60%)" :
                    "hsl(210, 100%, 50%)"
        }
    };

    return (
        <Card
            className="group hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => navigate(func.path || `/dashboard/view/${func.id}`)}
        >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 pointer-events-none" />

            {/* Quick action buttons (show on hover) */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    className="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700"
                    onClick={(e) => { e.stopPropagation(); /* TODO: Pin logic */ }}
                    title="Pin to Home"
                >
                    <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700"
                    onClick={(e) => { e.stopPropagation(); /* TODO: Settings */ }}
                    title="Settings"
                >
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>

            <CardHeader className="pb-2 relative">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-1 leading-snug">
                                {func.title}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-0.5">{func.description?.slice(0, 40)}{func.description && func.description.length > 40 ? '...' : ''}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-2 pb-4 relative">
                {/* Stats Section - only show if we have data */}
                {hasData && summary ? (
                    <>
                        {/* Main Stats Row */}
                        <div className="flex items-end justify-between mb-3">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-gray-900">
                                    {summary.total.toLocaleString()}
                                </span>
                                <div className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
                                    <TrendIcon className="w-3.5 h-3.5" />
                                    <span>{summary.trend}%</span>
                                </div>
                            </div>

                            {/* Sparkline */}
                            {summary.sparklineData && summary.sparklineData.length > 0 && (
                                <div className="w-20 h-10">
                                    <ChartContainer config={chartConfig} className="w-full h-full">
                                        <AreaChart data={summary.sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`sparkGradient-${func.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={chartConfig.value.color} stopOpacity={0.3} />
                                                    <stop offset="100%" stopColor={chartConfig.value.color} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={chartConfig.value.color}
                                                strokeWidth={1.5}
                                                fill={`url(#sparkGradient-${func.id})`}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                </div>
                            )}
                        </div>

                        {/* Quick Stats Pills */}
                        {summary.quickStats && (
                            <div className="flex gap-2 mb-3">
                                {summary.quickStats.map((stat, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 px-2 py-1.5 rounded-lg text-center",
                                            stat.color || 'bg-gray-100 text-gray-700'
                                        )}
                                    >
                                        <div className="text-sm font-semibold">{stat.value}</div>
                                        <div className="text-[10px] opacity-80">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    /* No data - show description card */
                    <div className="py-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">
                            {func.description || 'Click to open this dashboard'}
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 group/btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(func.path || `/dashboard/view/${func.id}`);
                    }}
                >
                    <span>Open Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
            </CardContent>
        </Card>
    );
};

export default DashboardCardEnhanced;
