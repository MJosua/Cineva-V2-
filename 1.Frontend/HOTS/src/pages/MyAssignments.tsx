import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    ListTodo,
    LayoutGrid,
    Search
} from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useHeader } from '@/contexts/HeaderContext';
import { CompactAssignmentCard } from '@/components/assignment/CompactAssignmentCard';
import { TicketPagination } from '@/components/ui/TicketPagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import CompletionModal from '@/components/modals/CompletionModal';
import axios from 'axios';

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

interface PaginationData {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface CategorySummary {
    folder: string;
    count: number;
}

export const MyAssignments: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { searchValue, setSearchValue, setSearchPlaceholder } = useHeader();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('active');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortOrder, setSortOrder] = useState<'active_first' | 'newest' | 'oldest'>('active_first');
    const [viewMode, setViewMode] = useState<'folder' | 'compact'>(() => {
        return (localStorage.getItem('hots_assignment_view_mode') as 'folder' | 'compact') || 'folder';
    });
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isBulkCompleting, setIsBulkCompleting] = useState(false);
    const [processingIds, setProcessingIds] = useState<number[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        localStorage.setItem('hots_assignment_view_mode', viewMode);
    }, [viewMode]);

    // 🔗 URL Persistence for Category
    const selectedFolder = searchParams.get('category');
    const setSelectedFolder = (folder: string | null) => {
        setPage(1); // Reset to page 1 when category changes
        if (folder) {
            setSearchParams({ category: folder });
        } else {
            setSearchParams({});
        }
    };

    const { sseSignals } = useAppSelector(state => state.tickets);

    useEffect(() => {
        fetchAssignments();
        setSearchPlaceholder("Search assignments...");
    }, [setSearchPlaceholder, page, limit, statusFilter, searchValue, sortOrder, selectedFolder]);

    useEffect(() => {
        if (sseSignals?.assignment) {
            fetchAssignments(false);
        }
    }, [sseSignals?.assignment]);

    useEffect(() => {
        if (searchValue) {
            setSelectedFolder(null); // Clear folder selection when searching
        }
    }, [searchValue]);

    const fetchAssignments = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
            const searchParam = searchValue ? `&search=${encodeURIComponent(searchValue)}` : '';
            const sortParam = `&sort=${sortOrder}`;
            const categoryParam = selectedFolder ? `&service=${encodeURIComponent(selectedFolder)}` : '';

            const response = await fetch(`${API_URL}/engine/my-assignments?page=${page}&limit=${limit}${statusParam}${searchParam}${sortParam}${categoryParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch assignments');
            const data = await response.json();
            setAssignments(data.assignments || []);
            setPagination(data.pagination);
            setCategories(data.categories || []);
        } catch (err: any) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const activeIds = assignments
            .filter(a => a.assignment_status === 'active')
            .map(a => a.assignment_id);

        if (selectedIds.length === activeIds.length && activeIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(activeIds);
        }
    };

    const handleBulkComplete = async (note: string, tempFileIds: number[]) => {
        // Optimistic UI: Hide selected tasks immediately
        const idsToProcess = [...selectedIds];
        setProcessingIds(prev => [...prev, ...idsToProcess]);
        const count = idsToProcess.length;
        
        setSelectedIds([]);
        setIsBulkModalOpen(false);

        // Don't set isBulkCompleting to true for the whole page if we want it seamless
        // setIsBulkCompleting(true); 

        const token = localStorage.getItem('hots_tokek');

        try {
            await axios.post(
                `${API_URL}/engine/assignment/bulk-complete`,
                { 
                    assignmentIds: idsToProcess, 
                    completion_note: note, 
                    temp_file_ids: tempFileIds 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast({
                title: 'Bulk Completion Started',
                description: `Processing ${count} tasks in the background. They will disappear from your list shortly.`,
            });

            // Wait a bit then refresh to sync with server
            setTimeout(() => {
                fetchAssignments(false);
                // Clear processing status after refresh
                setProcessingIds(prev => prev.filter(id => !idsToProcess.includes(id)));
            }, 2000);

        } catch (err: any) {
            console.error(`Bulk completion failed:`, err);
            // Revert optimistic hide on error
            setProcessingIds(prev => prev.filter(id => !idsToProcess.includes(id)));
            
            toast({
                title: 'Operation Failed',
                description: err.response?.data?.error || 'Could not start bulk completion',
                variant: 'destructive'
            });
        }
    };

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

    const totalActiveCount = categories.reduce((acc, cat) => acc + cat.count, 0);

    // Re-render components
    const renderPagination = () => {
        if (!pagination || pagination.pages <= 1) return null;
        return (
            <div className="py-4 border-t border-slate-100 mt-4">
                <TicketPagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                />
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Hierarchical Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <nav className="flex items-center gap-2 text-sm">
                    <button
                        onClick={() => setSelectedFolder(null)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Briefcase className="w-4 h-4" />
                        My Assignments
                    </button>
                    {selectedFolder && (
                        <>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{selectedFolder}</span>
                        </>
                    )}
                </nav>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                        placeholder="Search assignments or ticket titles then press enter"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <div className="flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-muted-foreground" />
                        <Select value={sortOrder} onValueChange={(v: any) => { setSortOrder(v); setPage(1); }}>
                            <SelectTrigger className="w-40 bg-white">
                                <SelectValue placeholder="Sort By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active_first">Active First</SelectItem>
                                <SelectItem value="newest">Newest Assigned</SelectItem>
                                <SelectItem value="oldest">Oldest Assigned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">
                        {selectedFolder || "Assigned Tasks"}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {selectedFolder
                            ? `${pagination?.total || 0} items in this category`
                            : totalActiveCount > 0 ? `You have ${totalActiveCount} tasks across ${categories.length} categories` : "No pending assignments."
                        }
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => { setViewMode('folder'); setSelectedFolder(null); }}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'folder' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
                            title="Folder View"
                        >
                            <Folder className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setViewMode('compact'); setSelectedFolder(null); }}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
                            title="Compact View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg">
                        {(['active', 'completed', 'all'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-muted p-1 rounded-lg ml-2">
                        <Select value={String(limit)} onValueChange={v => { setLimit(Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-8 w-16 bg-transparent border-none shadow-none text-xs font-semibold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchAssignments(true)} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Top Pagination (only for long lists) */}
            {(viewMode === 'compact' || selectedFolder) && renderPagination()}

            {/* Main Content Area */}
            <div className="mt-6">
                {viewMode === 'compact' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {assignments.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <LayoutGrid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">No assignments found for the current filters.</p>
                            </div>
                        ) : (
                             assignments
                                .filter(a => !processingIds.includes(a.assignment_id))
                                .map(assignment => (
                                <div key={assignment.assignment_id} className="w-full flex justify-center h-full">
                                    <CompactAssignmentCard
                                        assignment={assignment as any}
                                        onComplete={() => fetchAssignments(false)}
                                        isSelected={selectedIds.includes(assignment.assignment_id)}
                                        onToggleSelect={toggleSelect}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                ) : !selectedFolder ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {categories.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-lg bg-muted/20">
                                <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">No assignment categories found</p>
                            </div>
                        ) : (
                            categories.map(cat => (
                                <Card
                                    key={cat.folder}
                                    onClick={() => setSelectedFolder(cat.folder)}
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
                                                {cat.count}
                                            </Badge>
                                        </div>
                                        <h3 className="font-semibold text-sm text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                                            {cat.folder || "Uncategorized"}
                                        </h3>
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">View Tasks</p>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
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
                        {assignments
                            .filter(a => !processingIds.includes(a.assignment_id))
                            .map((assignment) => {
                            const s = getStatusConfig(assignment.assignment_status, assignment.is_overdue);
                            const isOverdue = assignment.is_overdue;
                            const hasPreviewTasks = assignment.task_preview && assignment.task_preview.length > 0;

                            return (
                                <div
                                    key={assignment.assignment_id}
                                    className={`group relative flex flex-col md:flex-row p-4 md:p-5 bg-white border rounded-lg hover:shadow-md transition-all cursor-pointer gap-6 ${isOverdue ? 'border-l-4 border-l-orange-500 border-slate-200' : 'border-slate-200 hover:border-blue-300'} ${selectedIds.includes(assignment.assignment_id) ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/30' : ''}`}
                                >
                                    {assignment.assignment_status === 'active' && (
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.includes(assignment.assignment_id)}
                                                onCheckedChange={() => toggleSelect(assignment.assignment_id)}
                                                className="w-5 h-5 border-slate-300"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 flex gap-4 min-w-0" onClick={() => navigate(`/assignment/${assignment.ticket_id}`)}>
                                        <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition-colors border border-slate-100">
                                            <ClipboardList className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono font-bold text-slate-500 tracking-tight">#{assignment.ticket_id}</span>
                                                {s.icon && (
                                                    <Badge variant="secondary" className={`${s.bgColor} ${s.color} text-[10px] px-2 py-0.5 h-auto gap-1 border-none font-bold uppercase tracking-tight`}>
                                                        {s.icon} {s.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
                                                {assignment.ticket_title || "Untitled Assignment"}
                                            </h3>
                                            <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 opacity-70" /> {getTimeAgo(assignment.assigned_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {hasPreviewTasks && (
                                        <div className="hidden md:flex flex-col justify-center min-w-[240px] max-w-[300px] gap-2 px-6 border-l border-slate-100">
                                            <div className="space-y-1.5">
                                                {assignment.task_preview.slice(0, 3).map((pt: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                                                        <span className="truncate flex-1 pr-2">• {pt.title}</span>
                                                        <Badge className={`text-[9px] px-1 py-0 h-3.5 ${pt.status === 'completed' ? 'bg-green-100 text-green-700' : (pt.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}`}>
                                                            {pt.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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

            {/* Bottom Pagination */}
            {(viewMode === 'compact' || selectedFolder) && renderPagination()}

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl border border-slate-700 flex items-center gap-6 min-w-[400px]">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-blue-600 text-white border-none h-6 min-w-[24px] flex items-center justify-center rounded-full p-0 font-bold">
                                {selectedIds.length}
                            </Badge>
                            <span className="text-sm font-bold tracking-tight">Tasks Selected</span>
                        </div>
                        <div className="h-6 w-px bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedIds([])}
                                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full px-4"
                            >
                                Deselect All
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 font-bold shadow-lg shadow-green-900/20"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Bulk Complete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CompletionModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onConfirm={handleBulkComplete}
                title="Bulk Complete Assignments"
                description={<>Are you sure you want to mark <b>{selectedIds.length} tasks</b> as complete? All selected assignments will be closed with this closing statement.</>}
                isLoading={isBulkCompleting}
            />
        </div>
    );
};

export default MyAssignments;
