// pages/project/ProjectDashboard.tsx
// Generic Project Dashboard - Modular & Reusable for IT Project, PDTS Project, etc.
// Route: /project-dashboard/:serviceId

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
    Plus,
    Clock,
    AlertTriangle,
    CheckCircle2,
    ArrowLeft,
    Search,
    Filter,
    RefreshCw,
    FolderKanban,
    TrendingUp,
    Timer,
    AlertCircle,
    ChevronRight,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface ProjectTicket {
    ticket_id: string;
    service_id: number;
    service_name: string;
    created_by: number;
    creator_name: string;
    status_name: string;
    status_id: number;
    creation_date: string;
    last_update: string;
    total_assignments: number;
    completed_assignments: number;
    completion_percent: number;
    days_remaining: number | null;
    risk_level: 'high' | 'medium' | 'low' | 'none';
    time_progress: number;
    form_data: Record<string, string>;
    project_title?: string;
    project_description?: string;
    target_date?: string;
    priority?: string;
    [key: string]: any;
}

interface ServiceInfo {
    service_id: number;
    service_name: string;
    service_description: string;
    service_category: string;
}

interface DashboardSummary {
    total_projects: number;
    fulfilled: number;
    in_progress: number;
    submitted: number;
    rejected: number;
}

// ============================================================
// Helpers
// ============================================================
const getRiskBadge = (risk: string) => {
    switch (risk) {
        case 'high':
            return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> At Risk</Badge>;
        case 'medium':
            return <Badge className="gap-1 bg-amber-500 hover:bg-amber-600 text-white"><AlertCircle className="w-3 h-3" /> Warning</Badge>;
        case 'low':
            return <Badge className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-3 h-3" /> On Track</Badge>;
        default:
            return <Badge variant="secondary" className="gap-1">No Data</Badge>;
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
        case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800';
        case 'low': return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
        default: return 'text-muted-foreground bg-muted border-border';
    }
};

const getStatusColor = (statusId: number) => {
    switch (statusId) {
        case 0: return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
        case 1: return 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900 dark:text-sky-300';
        case 3: return 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300';
        case 4: return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-muted text-muted-foreground';
    }
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// ============================================================
// Component
// ============================================================
const ProjectDashboard: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<ProjectTicket[]>([]);
    const [service, setService] = useState<ServiceInfo | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Create form
    const [formData, setFormData] = useState({
        project_title: '',
        project_description: '',
        target_date: '',
        priority: 'medium',
        initial_notes: '',
    });

    const token = localStorage.getItem('tokek');
    const headers = { Authorization: `Bearer ${token}` };

    // ============================================================
    // Fetchers
    // ============================================================
    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const statusParam = statusFilter !== 'all' ? `&status_id=${statusFilter}` : '';
            const res = await axios.get(
                `${API_URL}/engine/project/list/${serviceId}?limit=100${statusParam}`,
                { headers }
            );
            if (res.data.success) {
                setProjects(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    }, [serviceId, statusFilter]);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await axios.get(
                `${API_URL}/engine/project/summary/${serviceId}`,
                { headers }
            );
            if (res.data.success) {
                setService(res.data.service);
                setSummary(res.data.summary);
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
        }
    }, [serviceId]);

    useEffect(() => {
        if (serviceId) {
            fetchProjects();
            fetchSummary();
        }
    }, [serviceId, fetchProjects, fetchSummary]);

    // ============================================================
    // Actions
    // ============================================================
    const handleCreate = async () => {
        if (!formData.project_title || !formData.target_date) {
            toast({ title: 'Validation Error', description: 'Title and Target Date are required.', variant: 'destructive' });
            return;
        }

        try {
            setCreating(true);
            const res = await axios.post(
                `${API_URL}/engine/project/create`,
                { service_id: Number(serviceId), form_data: formData },
                { headers }
            );

            if (res.data.success) {
                toast({ title: 'Project Created', description: `Ticket ID: ${res.data.ticket_id}` });
                setCreateOpen(false);
                setFormData({ project_title: '', project_description: '', target_date: '', priority: 'medium', initial_notes: '' });
                fetchProjects();
                fetchSummary();
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.error || 'Failed to create project', variant: 'destructive' });
        } finally {
            setCreating(false);
        }
    };

    const handlePriorityChange = async (ticketId: string, priority: string) => {
        try {
            await axios.patch(
                `${API_URL}/engine/project/priority`,
                { ticket_id: ticketId, priority },
                { headers }
            );
            toast({ title: 'Priority Updated', description: `${ticketId} -> ${priority}` });

            // Update locally
            setProjects(prev =>
                prev.map(p => p.ticket_id === ticketId ? { ...p, priority, form_data: { ...p.form_data, priority } } : p)
            );
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to update priority', variant: 'destructive' });
        }
    };

    // ============================================================
    // Filter
    // ============================================================
    const filteredProjects = projects.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.ticket_id?.toLowerCase().includes(term) ||
            p.project_title?.toLowerCase().includes(term) ||
            p.creator_name?.toLowerCase().includes(term) ||
            p.form_data?.project_title?.toLowerCase().includes(term)
        );
    });

    // ============================================================
    // Render
    // ============================================================
    if (loading && !projects.length) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* ===== HEADER ===== */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {service?.service_name || 'Project Dashboard'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {service?.service_description || 'Monitor and manage projects'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { fetchProjects(); fetchSummary(); }}>
                        <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                    </Button>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-1" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Fill in the request details. This will create a project ticket and an initial timeline entry.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Project Title *</label>
                                    <Input
                                        placeholder="Enter project name..."
                                        value={formData.project_title}
                                        onChange={e => setFormData(p => ({ ...p, project_title: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Description *</label>
                                    <Textarea
                                        placeholder="What is this project about?"
                                        value={formData.project_description}
                                        onChange={e => setFormData(p => ({ ...p, project_description: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Target Date *</label>
                                        <Input
                                            type="date"
                                            value={formData.target_date}
                                            onChange={e => setFormData(p => ({ ...p, target_date: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Priority</label>
                                        <Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Initial Notes</label>
                                    <Textarea
                                        placeholder="Requirements, targets, initial notes..."
                                        value={formData.initial_notes}
                                        onChange={e => setFormData(p => ({ ...p, initial_notes: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {creating ? 'Creating...' : 'Create Project'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ===== SUMMARY CARDS ===== */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-indigo-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Projects</p>
                                    <p className="text-2xl font-bold mt-1">{summary.total_projects}</p>
                                </div>
                                <FolderKanban className="w-8 h-8 text-indigo-500 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">In Progress</p>
                                    <p className="text-2xl font-bold mt-1">{summary.in_progress}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-blue-500 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-emerald-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
                                    <p className="text-2xl font-bold mt-1">{summary.fulfilled}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">New/Submitted</p>
                                    <p className="text-2xl font-bold mt-1">{summary.submitted}</p>
                                </div>
                                <Timer className="w-8 h-8 text-amber-500 opacity-60" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ===== FILTER BAR ===== */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search by title, ID, or creator..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="0">Submitted</SelectItem>
                            <SelectItem value="3">In Progress</SelectItem>
                            <SelectItem value="1">Fulfilled</SelectItem>
                            <SelectItem value="4">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ===== PROJECT LIST ===== */}
            {filteredProjects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">No Projects Found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm ? 'Try adjusting your search.' : 'Click "New Project" to create your first project.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredProjects.map(project => (
                        <Card
                            key={project.ticket_id}
                            className="group hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-indigo-200 dark:hover:border-indigo-800"
                            onClick={() => navigate(`/assignment/${project.ticket_id}`)}
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Left: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">#{project.ticket_id}</span>
                                            <Badge variant="outline" className={`text-xs ${getStatusColor(project.status_id)}`}>
                                                {project.status_name}
                                            </Badge>
                                            {getRiskBadge(project.risk_level)}
                                        </div>
                                        <h3 className="font-semibold text-base truncate group-hover:text-indigo-600 transition-colors">
                                            {project.form_data?.project_title || project.project_title || 'Untitled Project'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                            {project.form_data?.project_description || project.project_description || '-'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>By {project.creator_name}</span>
                                            <span>Created {formatDate(project.creation_date)}</span>
                                            {project.form_data?.target_date && (
                                                <span>Target: {formatDate(project.form_data.target_date)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Center: Progress & Metrics */}
                                    <div className="flex items-center gap-6 lg:min-w-[320px]">
                                        {/* Countdown */}
                                        <div className="text-center min-w-[80px]">
                                            {project.days_remaining !== null ? (
                                                <>
                                                    <p className={`text-xl font-bold ${project.days_remaining <= 3 ? 'text-red-600' : project.days_remaining <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                        {project.days_remaining <= 0 ? 'Overdue' : project.days_remaining}
                                                    </p>
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                                        {project.days_remaining <= 0 ? '' : 'Days Left'}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No target</p>
                                            )}
                                        </div>

                                        {/* Assignment Progress */}
                                        <div className="flex-1 min-w-[120px]">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-muted-foreground">Assignments</span>
                                                <span className="text-xs font-medium">
                                                    {project.completed_assignments}/{project.total_assignments}
                                                </span>
                                            </div>
                                            <Progress value={project.completion_percent} className="h-2" />
                                            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                                                {project.completion_percent}% complete
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Priority & Action */}
                                    <div className="flex items-center gap-2 lg:min-w-[120px] justify-end" onClick={e => e.stopPropagation()}>
                                        <Select
                                            value={project.priority || project.form_data?.priority || 'medium'}
                                            onValueChange={v => handlePriorityChange(project.ticket_id, v)}
                                        >
                                            <SelectTrigger className={`w-24 h-8 text-xs ${getPriorityColor(project.priority || project.form_data?.priority || 'medium')}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectDashboard;
