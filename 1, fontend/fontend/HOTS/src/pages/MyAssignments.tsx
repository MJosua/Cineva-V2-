import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    Calendar,
    XCircle,
    ArrowRight,
    Briefcase,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    ticket_title?: string;
    assigned_type: string;
    assigned_id: number;
    assigned_at: string;
    assignment_status: string;
    notes: string;
    service_id: number;
    service_name: string;
    status_id: number;
    status_name: string;
    creation_date: string;
    creator_name: string;
}

import { useHeader } from '@/contexts/HeaderContext';
import { searchInObject } from '@/utils/searchUtils';

export const MyAssignments: React.FC = () => {
    const navigate = useNavigate();
    const { searchValue, setSearchPlaceholder } = useHeader();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
    const { user } = useAppSelector(state => state.auth);
    const { sseSignals } = useAppSelector(state => state.tickets);

    useEffect(() => {
        fetchAssignments();
        setSearchPlaceholder("Search assignments...");
    }, [setSearchPlaceholder]);

    // 🆕 SSE Signal Listener
    useEffect(() => {
        if (sseSignals?.assignment) {
            console.log('📡 SSE Signal: Refreshing MyAssignments');
            fetchAssignments(false);
        }
    }, [sseSignals?.assignment]);

    useEffect(() => {
        filterAssignments();
    }, [assignments, statusFilter, searchValue]);

    const fetchAssignments = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/my-assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch assignments');

            const data = await response.json();
            setAssignments(data.assignments || []);
        } catch (err: any) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterAssignments = () => {
        let result = assignments;

        if (statusFilter !== 'all') {
            result = result.filter(a => a.assignment_status === statusFilter);
        }

        if (searchValue) {
            result = result.filter(a => searchInObject(a, searchValue));
        }

        setFilteredAssignments(result);
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string, bgColor: string, icon: React.ReactNode }> = {
            'active': {
                color: 'text-blue-700',
                bgColor: 'bg-blue-50 border-blue-200',
                icon: <Clock className="w-4 h-4" />
            },
            'completed': {
                color: 'text-green-700',
                bgColor: 'bg-green-50 border-green-200',
                icon: <CheckCircle className="w-4 h-4" />
            },
            'cancelled': {
                color: 'text-red-700',
                bgColor: 'bg-red-50 border-red-200',
                icon: <XCircle className="w-4 h-4" />
            },
        };
        return configs[status] || { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', icon: null };
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const activeCount = assignments.filter(a => a.assignment_status === 'active').length;
    const completedCount = assignments.filter(a => a.assignment_status === 'completed').length;
    const cancelledCount = assignments.filter(a => a.assignment_status === 'cancelled').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        My Assignments
                    </h1>
                    <p className="text-muted-foreground">
                        {activeCount > 0
                            ? `You have ${activeCount} active assignment${activeCount > 1 ? 's' : ''} to work on`
                            : 'No active assignments at the moment'
                        }
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAssignments(true)}
                    disabled={refreshing}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'active' ? 'ring-2 ring-blue-500' : ''
                        }`}
                    onClick={() => setStatusFilter('active')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-blue-600">{activeCount}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'completed' ? 'ring-2 ring-green-500' : ''
                        }`}
                    onClick={() => setStatusFilter('completed')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''
                        }`}
                    onClick={() => setStatusFilter('all')}
                >
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-foreground">{assignments.length}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Pills (optional alternative to clicking cards) */}
            {cancelledCount > 0 && (
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('cancelled')}
                        className="gap-1"
                    >
                        <XCircle className="w-4 h-4" />
                        Cancelled ({cancelledCount})
                    </Button>
                </div>
            )}

            {/* Assignments Grid */}
            {filteredAssignments.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                            <ClipboardList className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {statusFilter === 'all'
                                ? 'No assignments yet'
                                : `No ${statusFilter} assignments`
                            }
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            {statusFilter === 'all'
                                ? "When tickets are assigned to you, they'll appear here"
                                : `You don't have any ${statusFilter} assignments`
                            }
                        </p>
                        {statusFilter !== 'all' && (
                            <Button
                                variant="link"
                                onClick={() => setStatusFilter('all')}
                                className="mt-4"
                            >
                                View all assignments
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredAssignments.map((assignment) => {
                        const statusConfig = getStatusConfig(assignment.assignment_status);

                        return (
                            <Card
                                key={assignment.assignment_id}
                                className={`group cursor-pointer transition-all hover:shadow-lg border-l-4 ${assignment.assignment_status === 'active'
                                    ? 'border-l-blue-500 hover:border-l-blue-600'
                                    : assignment.assignment_status === 'completed'
                                        ? 'border-l-green-500'
                                        : 'border-l-gray-300'
                                    }`}
                                onClick={() => navigate(`/assignment/${assignment.ticket_id}`)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        {/* Left: Main Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-mono font-semibold text-primary">
                                                    #{assignment.ticket_id}
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={`${statusConfig.bgColor} ${statusConfig.color} gap-1`}
                                                >
                                                    {statusConfig.icon}
                                                    {assignment.assignment_status}
                                                </Badge>
                                            </div>

                                            <h3 className="font-medium text-foreground mb-1 truncate">
                                                {assignment.ticket_title || assignment.service_name}
                                            </h3>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {assignment.service_name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {getTimeAgo(assignment.assigned_at)}
                                                </span>
                                            </div>

                                            {assignment.notes && (
                                                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                                    {assignment.notes}
                                                </p>
                                            )}
                                        </div>

                                        {/* Right: Arrow */}
                                        <div className="ml-4 flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyAssignments;
