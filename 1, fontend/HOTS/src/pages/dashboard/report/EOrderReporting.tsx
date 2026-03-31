// src/pages/dashboard/report/EOrderReporting.tsx
// E-Order Reporting Dashboard with real-time data from spectator APIs
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Package, Truck, Ship, BarChart3, Globe, Building2 } from 'lucide-react';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrderVolumeData {
    ttl_order_now: number;
    ttl_order_lm: number;
    diffPercent: string;
    increase: boolean;
    cont_20: number;
    cont_40: number;
    cont_40hc: number;
    truck: number;
    cont_20_qty: number;
    cont_40_qty: number;
    cont_40hc_qty: number;
    truck_qty: number;
}

interface WeeklyData {
    week: number;
    volume: number;
}

interface DistributorData {
    company_name: string;
    txt: string; // country
    sales: number;
}

interface CountryData {
    country_name: string;
    sales: number;
}

const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
};

interface EOrderReportingProps {
    searchValue?: string;
    serviceId?: number;
}

const EOrderReporting: React.FC<EOrderReportingProps> = ({ searchValue }) => {
    const [uomType, setUomType] = useState<'pack' | 'carton'>('pack');
    const [dateRange, setDateRange] = useState<'7' | '30' | '90' | '365'>('30');
    const [loading, setLoading] = useState(true);
    const [orderVolume, setOrderVolume] = useState<OrderVolumeData | null>(null);
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [topDistributors, setTopDistributors] = useState<DistributorData[]>([]);
    const [topCountries, setTopCountries] = useState<CountryData[]>([]);

    const token = localStorage.getItem('hots_tokek');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token}` };

            const [volumeRes, weeklyRes, distRes, countryRes] = await Promise.all([
                axios.get(`${API_URL}/hotsreporting/total_order/${uomType}?days=${dateRange}`, { headers }).catch(() => ({ data: null })),
                axios.get(`${API_URL}/hotsreporting/total_order_week/${uomType}`, { headers }).catch(() => ({ data: { results: [] } })),
                axios.get(`${API_URL}/hotsreporting/top_dist/${uomType}?upto=10&days=${dateRange}`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_URL}/hotsreporting/top_country/${uomType}?upto=10&days=${dateRange}`, { headers }).catch(() => ({ data: [] })),
            ]);

            setOrderVolume(volumeRes.data);
            setWeeklyData(weeklyRes.data?.results || []);
            setTopDistributors(distRes.data || []);
            setTopCountries(countryRes.data || []);
        } catch (err) {
            console.error('Error fetching E-Order report data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [uomType, dateRange]);

    // Client-side filtering for the tables
    const filteredCountries = topCountries.filter(c =>
        !searchValue || c.country_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const filteredDistributors = topDistributors.filter(d =>
        !searchValue ||
        d.company_name.toLowerCase().includes(searchValue.toLowerCase()) ||
        d.txt.toLowerCase().includes(searchValue.toLowerCase())
    );

    const dateRangeLabels: Record<string, string> = {
        '7': 'Last 7 Days',
        '30': 'Last 30 Days',
        '90': 'Last 90 Days',
        '365': 'Last Year'
    };

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    const chartConfig = {
        volume: { color: "hsl(210, 100%, 50%)" }
    };

    return (
        <div className="space-y-6 ">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">E-Order Reporting</h1>
                    <p className="text-sm text-muted-foreground">Real-time order analytics and insights</p>
                </div>
                <div className="flex gap-2">
                    <Select value={dateRange} onValueChange={(v: '7' | '30' | '90' | '365') => setDateRange(v)}>
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                            <SelectItem value="365">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={uomType} onValueChange={(v: 'pack' | 'carton') => setUomType(v)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pack">Pack</SelectItem>
                            <SelectItem value="carton">Carton</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Order Volume Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Order Volume */}
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Order Volume (MTD)
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {formatNumber(orderVolume?.ttl_order_now)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                            {orderVolume?.increase ? (
                                <Badge variant="default" className="bg-green-500">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{orderVolume.diffPercent}%
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    {orderVolume?.diffPercent}%
                                </Badge>
                            )}
                            <span className="text-muted-foreground">vs previous {dateRange} days</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Container 40HC */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Ship className="w-4 h-4" />
                            Container 40HC
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {formatNumber(orderVolume?.cont_40hc)} <span className="text-sm font-normal text-muted-foreground">units</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {formatNumber(orderVolume?.cont_40hc_qty)} {uomType}s loaded
                        </p>
                    </CardContent>
                </Card>

                {/* Container 40 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Ship className="w-4 h-4" />
                            Container 40ft
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {formatNumber(orderVolume?.cont_40)} <span className="text-sm font-normal text-muted-foreground">units</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {formatNumber(orderVolume?.cont_40_qty)} {uomType}s loaded
                        </p>
                    </CardContent>
                </Card>

                {/* Truck */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Truck Shipments
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {formatNumber(orderVolume?.truck)} <span className="text-sm font-normal text-muted-foreground">units</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {formatNumber(orderVolume?.truck_qty)} {uomType}s loaded
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Incoming Order by Week Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Incoming Order by Week
                    </CardTitle>
                    <CardDescription>Weekly order volume for current year</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ChartContainer config={chartConfig} className="w-full h-full">
                            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="week" tick={{ fontSize: 10 }} interval={3} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatNumber(v)} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="volume" fill="hsl(210, 100%, 50%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Top 10 Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Countries */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Top 10 Countries by Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Volume</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCountries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCountries.map((country, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{idx + 1}</TableCell>
                                            <TableCell>{country.country_name || 'Unknown'}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatNumber(country.sales)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Top Distributors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Top 10 Distributors by Volume
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Distributor</TableHead>
                                    <TableHead>Country</TableHead>
                                    <TableHead className="text-right">Volume</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDistributors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDistributors.map((dist, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{idx + 1}</TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={dist.company_name}>
                                                {dist.company_name}
                                            </TableCell>
                                            <TableCell>{dist.txt || '-'}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatNumber(dist.sales)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EOrderReporting;
