import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ClipboardList,
    CheckCircle,
    Clock,
    Calendar,
    XCircle,
    ArrowRight,
    Briefcase,
    RefreshCw,
    Loader2,
    Folder,
    ChevronRight,
    ChevronLeft,
    AlertCircle,
    ListTodo
} from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useHeader } from '@/contexts/HeaderContext';
import { searchInObject } from '@/utils/searchUtils';

interface TaskPreview {
    title: string;
    status: 'todo' | 'in_progress' | 'done';
}

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
    is_overdue: boolean;
    overdue_task_count: number;
    task_preview: TaskPreview[];
}

export const MyAssignments: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { searchValue, setSearchPlaceholder } = useHeader();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');

    // 🔗 URL Persistence for Category
    const selectedFolder = searchParams.get('category');
    const setSelectedFolder = (folder: string | null) => {
        if (folder) {
            setSearchParams({ category: folder });
        } else {
            setSearchParams({});
        }
    };

    const { user } = useAppSelector(state => state.auth);
    const { sseSignals } = useAppSelector(state => state.tickets);

    useEffect(() => {
        fetchAssignments();
        setSearchPlaceholder("Search assignments...");
    }, [setSearchPlaceholder]);

    useEffect(() => {
        if (sseSignals?.assignment) {
            fetchAssignments(false);
        }
    }, [sseSignals?.assignment]);

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

    // 🧠 Hierarchical Grouping Logic
    const groupedData = useMemo(() => {
        const filtered = assignments.filter(a => {
            const statusMatch = statusFilter === 'all' || a.assignment_status === statusFilter;
            const searchMatch = !searchValue || searchInObject(a, searchValue);
            return statusMatch && searchMatch;
        });

        const groups: Record<string, Assignment[]> = {};
        filtered.forEach(a => {
            const cat = a.service_name || "Uncategorized";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(a);
        });

        return groups;
    }, [assignments, statusFilter, searchValue]);

    const activeFolders = Object.keys(groupedData).sort();

    const getStatusConfig = (status: string, isOverdueFromAPI: boolean) => {
        const configs: Record<string, { color: string, bgColor: string, icon: React.ReactNode, label: string }> = {
            'active': {
                color: isOverdueFromAPI ? 'text-orange-700' : 'text-blue-700',
                bgColor: isOverdueFromAPI ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200',
                icon: isOverdueFromAPI ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />,
                label: isOverdueFromAPI ? 'Overdue' : 'Active'
            },
            'completed': {
                color: 'text-green-700',
                bgColor: 'bg-green-50 border-green-200',
                icon: <CheckCircle className="w-4 h-4" />,
                label: 'Completed'
            },
            'cancelled': {
                color: 'text-gray-500',
                bgColor: 'bg-gray-50 border-gray-200',
                icon: <XCircle className="w-4 h-4" />,
                label: 'Cancelled'
            },
        };
        return configs[status] || { color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200', icon: null, label: status };
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentAssignments = selectedFolder ? groupedData[selectedFolder] || [] : [];
    const activeCount = assignments.filter(a => a.assignment_status === 'active').length;

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Hierarchical Navigation / Breadcrumbs */}
            <nav className="flex items-center gap-2 mb-6 text-sm">
                <button
                    onClick={() => setSelectedFolder(null)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                >
                    <ClipboardList className="w-4 h-4" />
                    My Assignments
                </button>
                {selectedFolder && (
                    <>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                        <span className="font-semibold text-foreground truncate max-w-[200px]">
                            {selectedFolder}
                        </span>
                    </>
                )}
            </nav>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">
                        {selectedFolder || "Assigned Tasks"}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {selectedFolder
                            ? `${currentAssignments.length} items in this category`
                            : activeCount > 0 ? `You have ${activeCount} active tasks across ${activeFolders.length} categories` : "No pending assignments."
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-muted p-1 rounded-lg">
                        {(['active', 'completed', 'all'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchAssignments(true)} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            {!selectedFolder ? (
                /* FOLDER GRID - CORPORATE STYLE */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {activeFolders.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed rounded-lg bg-muted/20">
                            <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">No assignment categories found</p>
                        </div>
                    ) : (
                        activeFolders.map(folder => (
                            <Card
                                key={folder}
                                onClick={() => setSelectedFolder(folder)}
                                className="group cursor-pointer hover:shadow-md transition-all border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50"
                            >
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                                            <Folder className="w-6 h-6" />
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="absolute -top-2 -right-2 px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-blue-600 text-white border-2 border-white text-[10px] font-bold"
                                        >
                                            {groupedData[folder].length}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold text-sm text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                                        {folder}
                                    </h3>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">View Tasks</p>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                /* FILE ROWS LIST - CORPORATE STYLE */
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFolder(null)}
                        className="px-0 h-auto gap-2 text-slate-500 hover:text-blue-600 mb-2 hover:bg-transparent"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Categories
                    </Button>

                    {currentAssignments.map((assignment) => {
                        const s = getStatusConfig(assignment.assignment_status, assignment.is_overdue);
                        const isOverdue = assignment.is_overdue;
                        const hasPreviewTasks = assignment.task_preview && assignment.task_preview.length > 0;

                        return (
                            <div
                                key={assignment.assignment_id}
                                onClick={() => navigate(`/assignment/${assignment.ticket_id}`)}
                                className={`group relative flex flex-col md:flex-row p-4 md:p-5 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer gap-6 ${isOverdue ? 'border-l-4 border-l-orange-500 border-slate-200' : 'border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                {/* Left Section: Info */}
                                <div className="flex-1 flex gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors border border-slate-100">
                                        <ClipboardList className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono font-bold text-slate-500 tracking-tight">#{assignment.ticket_id}</span>
                                            {s.icon && (
                                                <Badge
                                                    variant="secondary"
                                                    className={`${s.bgColor} ${s.color} text-[10px] px-2 py-0.5 h-auto gap-1 border-none font-bold uppercase tracking-tight`}
                                                >
                                                    {s.icon}
                                                    {s.label}
                                                    {isOverdue && assignment.overdue_task_count > 0 && (
                                                        <span className="ml-1 px-1 bg-white/50 rounded">{assignment.overdue_task_count} tasks</span>
                                                    )}
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                                            {assignment.ticket_title || "Untitled Assignment"}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 opacity-70" /> {getTimeAgo(assignment.assigned_at)}</span>
                                            {assignment.notes && (
                                                <span className="flex items-center gap-1 truncate opacity-80">
                                                    <span className="opacity-30">|</span>
                                                    <span className="truncate italic">{assignment.notes}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Mobile Task Preview */}
                                        {hasPreviewTasks && (
                                            <div className="block md:hidden mt-3 space-y-1.5 pt-3 border-t border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Actions</p>
                                                {assignment.task_preview.slice(0, 2).map((pt, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${pt.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                                        <span className="truncate">{pt.title}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Task Preview Area */}
                                {hasPreviewTasks && (
                                    <div className="hidden md:flex flex-col justify-center min-w-[240px] max-w-[300px] gap-2 px-6 border-l border-slate-100">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <ListTodo className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Internal Tasks</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {assignment.task_preview.slice(0, 3).map((pt, i) => (
                                                <div key={i} className="flex items-center justify-between text-[11px] font-medium text-slate-600 group/task">
                                                    <span className="truncate flex-1 pr-2 group-hover/task:text-blue-600 transition-colors">• {pt.title}</span>
                                                    <Badge className={`text-[9px] px-1 py-0 h-3.5 ${pt.status === 'in_progress' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}`}>
                                                        {pt.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            ))}
                                            {assignment.task_preview.length > 3 && (
                                                <p className="text-[10px] text-slate-400 font-medium ml-2">+{assignment.task_preview.length - 3} more tasks</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Button */}
                                <div className="hidden md:flex items-center justify-center pl-4">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 text-slate-400 shadow-sm border border-slate-100">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyAssignments;

