import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, AlertTriangle, LayoutGrid, Users } from 'lucide-react';

export interface TaskFilters {
    searchQuery: string;
    assigneeFilter: string[];     // user_id strings
    statusFilter: string[];       // 'todo' | 'in_progress' | 'done'
    showOverdue: boolean;
    viewMode: 'column' | 'swimlane';
}

interface TaskFilterBarProps {
    filters: TaskFilters;
    onFiltersChange: (filters: TaskFilters) => void;
    eligibleAssignees: any[];
    showSwimlaneToggle?: boolean;
}

const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'done', label: 'Done', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
];

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
    filters,
    onFiltersChange,
    eligibleAssignees,
    showSwimlaneToggle = false
}) => {
    const update = (partial: Partial<TaskFilters>) => onFiltersChange({ ...filters, ...partial });

    const hasActiveFilters = filters.searchQuery || filters.assigneeFilter.length > 0 || filters.statusFilter.length > 0 || filters.showOverdue;

    return (
        <div className="space-y-2 p-3 bg-white/80 backdrop-blur rounded-lg border border-slate-200 shadow-sm">
            {/* Row 1: Search + View mode toggle */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search tasks by title or description..."
                        value={filters.searchQuery}
                        onChange={(e) => update({ searchQuery: e.target.value })}
                        className="pl-9 h-8 text-sm"
                    />
                    {filters.searchQuery && (
                        <button
                            onClick={() => update({ searchQuery: '' })}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Overdue toggle */}
                <Button
                    variant={filters.showOverdue ? 'default' : 'outline'}
                    size="sm"
                    className={`h-8 text-xs gap-1 ${filters.showOverdue ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-slate-500 hover:text-red-600'}`}
                    onClick={() => update({ showOverdue: !filters.showOverdue })}
                >
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                </Button>

                {/* Swimlane toggle (Kanban only) */}
                {showSwimlaneToggle && (
                    <div className="flex bg-slate-100 rounded-md p-0.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 text-xs px-2.5 rounded ${filters.viewMode === 'column' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => update({ viewMode: 'column' })}
                        >
                            <LayoutGrid className="w-3 h-3 mr-1" />
                            Columns
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 text-xs px-2.5 rounded ${filters.viewMode === 'swimlane' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => update({ viewMode: 'swimlane' })}
                        >
                            <Users className="w-3 h-3 mr-1" />
                            Swimlane
                        </Button>
                    </div>
                )}

                {/* Clear all filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-slate-400 hover:text-red-500"
                        onClick={() => update({
                            searchQuery: '',
                            assigneeFilter: [],
                            statusFilter: [],
                            showOverdue: false
                        })}
                    >
                        <X className="w-3 h-3 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Row 2: Status chips + Assignee chips */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Status chips */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                {STATUS_OPTIONS.map((s) => {
                    const active = filters.statusFilter.includes(s.value);
                    return (
                        <Badge
                            key={s.value}
                            variant="outline"
                            className={`text-[10px] px-2 h-5 cursor-pointer transition-all select-none ${active ? s.color + ' border font-bold' : 'bg-transparent text-slate-400 border-slate-200 hover:border-slate-400'}`}
                            onClick={() => {
                                const newFilter = active
                                    ? filters.statusFilter.filter((f) => f !== s.value)
                                    : [...filters.statusFilter, s.value];
                                update({ statusFilter: newFilter });
                            }}
                        >
                            {s.label}
                        </Badge>
                    );
                })}

                {eligibleAssignees.length > 0 && (
                    <>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee:</span>
                        {eligibleAssignees.map((member: any) => {
                            const active = filters.assigneeFilter.includes(String(member.user_id));
                            return (
                                <Badge
                                    key={member.user_id}
                                    variant="outline"
                                    className={`text-[10px] px-2 h-5 cursor-pointer transition-all select-none ${active ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-bold' : 'bg-transparent text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                                    onClick={() => {
                                        const id = String(member.user_id);
                                        const newFilter = active
                                            ? filters.assigneeFilter.filter((f) => f !== id)
                                            : [...filters.assigneeFilter, id];
                                        update({ assigneeFilter: newFilter });
                                    }}
                                >
                                    {member.user_name || member.firstname}
                                </Badge>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

// ── Filter utility function (shared between Kanban & Gantt) ─────────────────
export function applyTaskFilters(tasks: any[], filters: TaskFilters): any[] {
    return tasks.filter(task => {
        // Search filter (title + description)
        if (filters.searchQuery) {
            const q = filters.searchQuery.toLowerCase();
            const titleMatch = (task.title || '').toLowerCase().includes(q);
            const descMatch = (task.description || '').toLowerCase().includes(q);
            if (!titleMatch && !descMatch) return false;
        }

        // Status filter
        if (filters.statusFilter.length > 0) {
            if (!filters.statusFilter.includes(task.status)) return false;
        }

        // Assignee filter (by primary_assignee_id)
        if (filters.assigneeFilter.length > 0) {
            const taskPrimaryId = task.primary_assignee_id
                || task.custom_fields?.assignees?.[0]?.userId
                || task.custom_fields?.assignee?.userId;
            if (!taskPrimaryId || !filters.assigneeFilter.includes(String(taskPrimaryId))) return false;
        }

        // Overdue filter
        if (filters.showOverdue) {
            if (task.status === 'done') return false;
            if (!task.due_date) return false;
            const dueDate = new Date(task.due_date);
            if (dueDate >= new Date()) return false;
        }

        return true;
    });
}
