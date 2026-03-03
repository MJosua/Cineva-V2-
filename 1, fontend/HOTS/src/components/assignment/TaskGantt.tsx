import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { Task } from './TaskCard';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';
import { GanttTaskModal } from './GanttTaskModal';
import { TaskFilterBar, TaskFilters, applyTaskFilters } from './TaskFilterBar';

interface TaskGanttProps {
    assignmentId: number;
    assignedType: string;
    assignedId: number;
}

const statusColors: Record<string, string> = {
    todo: 'bg-slate-400',
    in_progress: 'bg-blue-500',
    done: 'bg-green-500'
};

const priorityBorders: Record<string, string> = {
    low: 'border-l-gray-400',
    medium: 'border-l-yellow-500',
    high: 'border-l-red-500'
};

export const TaskGantt: React.FC<TaskGanttProps> = ({ assignmentId, assignedType, assignedId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [eligibleAssignees, setEligibleAssignees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ── Filter state ───────────────────────────────────────────────────────
    const [filters, setFilters] = useState<TaskFilters>({
        searchQuery: '',
        assigneeFilter: [],
        statusFilter: [],
        showOverdue: false,
        viewMode: 'column'
    });

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.ok) {
                setTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibleAssignees = async () => {
        try {
            const token = localStorage.getItem('tokek');
            if (assignedType === 'team') {
                const response = await fetch(`${API_URL}/hots_settings/get/team_members/${assignedId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.ok || data.data) {
                    setEligibleAssignees(data.data || []);
                }
            } else if (assignedType === 'user') {
                const response = await fetch(`${API_URL}/hots_settings/get/user`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.ok || data.data) {
                    const user = (data.data || []).find((u: any) => u.user_id === assignedId);
                    if (user) setEligibleAssignees([user]);
                }
            }
        } catch (error) {
            console.error('Error fetching eligible assignees:', error);
        }
    };

    useEffect(() => {
        if (assignmentId) {
            fetchTasks();
            fetchEligibleAssignees();
        }
    }, [assignmentId, assignedId, assignedType]);

    const { sseSignals } = useAppSelector(state => state.tickets);

    // 🆕 SSE Signal Listener: Refetch tasks when backend signals a change
    useEffect(() => {
        if (sseSignals?.task) {
            console.log('📡 [GANTT] SSE Signal received, refetching tasks...');
            fetchTasks();
        }
    }, [sseSignals?.task]);

    // Flatten tasks with depth for hierarchical rendering
    const flattenTasks = (taskList: Task[], depth = 0): (Task & { depth: number })[] => {
        return taskList.reduce((acc, t) => {
            return [...acc, { ...t, depth }, ...flattenTasks(t.subtasks || [], depth + 1)];
        }, [] as (Task & { depth: number })[]);
    };

    // Apply filters BEFORE flattening for Gantt
    const filteredTasks = applyTaskFilters(tasks, filters);
    const flatTasks = flattenTasks(filteredTasks);

    // Calculate date range for Gantt based on flat tasks
    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let minDate = new Date(today);
        let maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 14); // Default max 14 days ahead

        if (flatTasks.length > 0) {
            flatTasks.forEach(t => {
                if (t.start_date) {
                    const sd = new Date(t.start_date);
                    if (sd < minDate) minDate = new Date(sd);
                }
                if (t.due_date) {
                    const dd = new Date(t.due_date);
                    if (dd > maxDate) maxDate = new Date(dd);
                }
            });
        }

        // Add padding: 3 days before min, 3 days after max
        minDate.setDate(minDate.getDate() - 3);
        maxDate.setDate(maxDate.getDate() + 3);

        const dates: Date[] = [];
        const current = new Date(minDate);
        while (current <= maxDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const dates = getDateRange();

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isWeekend = (date: Date) => {
        return date.getDay() === 0 || date.getDay() === 6;
    };

    const getTaskPosition = (task: Task) => {
        if (!task.start_date && !task.due_date) return null;

        const startDate = task.start_date ? new Date(task.start_date) : new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : new Date(startDate);

        startDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const gridStart = dates[0];
        const gridEnd = dates[dates.length - 1];

        if (dueDate < gridStart || startDate > gridEnd) return null;

        const totalDays = dates.length;

        // Find indices mapping to our 'dates' array
        let startIdx = dates.findIndex(d => d.toDateString() === startDate.toDateString());
        let endIdx = dates.findIndex(d => d.toDateString() === dueDate.toDateString());

        // Clamp if outside
        if (startIdx === -1 && startDate < gridStart) startIdx = 0;
        if (endIdx === -1 && dueDate > gridEnd) endIdx = totalDays - 1;

        // Fallbacks if exactly 1 day
        if (startIdx === -1) startIdx = endIdx;
        if (endIdx === -1) endIdx = startIdx;

        if (startIdx === -1 || endIdx === -1) return null;

        const durationDays = (endIdx - startIdx) + 1; // Inclusive

        return {
            left: (startIdx / totalDays) * 100,
            width: (durationDays / totalDays) * 100,
            startIdx,
            endIdx
        };
    };

    const getStepProgress = (task: Task) => {
        if (task.steps.length === 0) return task.status === 'done' ? 100 : 0;
        const completed = task.steps.filter(s => s.checked === 'true').length;
        return (completed / task.steps.length) * 100;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{filteredTasks.length}/{tasks.length} tasks</Badge>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-auto">
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-slate-400"></div> To Do
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-blue-500"></div> In Progress
                    </span>
                    <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500"></div> Done
                    </span>
                </div>
            </div>

            {/* Filter Bar */}
            <TaskFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                eligibleAssignees={eligibleAssignees}
                showSwimlaneToggle={false}
            />

            {/* Empty state — shown AFTER filter bar so user can clear filters */}
            {flatTasks.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>{filters.searchQuery || filters.assigneeFilter.length > 0 || filters.statusFilter.length > 0 || filters.showOverdue
                            ? 'No tasks match the current filters'
                            : 'No tasks with due dates to display'}</p>
                    </CardContent>
                </Card>
            )}

            {/* Gantt Board — only when tasks exist */}
            {flatTasks.length > 0 && (
                <div className="border rounded-lg overflow-x-auto overflow-y-hidden shadow-sm">
                    <div style={{ minWidth: `${Math.max(800, 192 + dates.length * 36)}px` }} className="bg-white">
                        {/* Date header */}
                        <div className="flex border-b bg-muted/50 sticky top-0 z-20">
                            <div className="w-48 flex-shrink-0 p-2 border-r border-slate-200 font-medium text-sm flex items-end pb-2 sticky left-0 bg-slate-100 z-30">
                                Task
                            </div>
                            <div className="flex-1 flex flex-col">
                                {/* Top tier: Months */}
                                <div className="flex border-b">
                                    {(() => {
                                        const groups: { label: string, colSpan: number }[] = [];
                                        if (dates.length > 0) {
                                            let currentLabel = dates[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                            let count = 0;
                                            dates.forEach(date => {
                                                const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                                if (label === currentLabel) count++;
                                                else {
                                                    groups.push({ label: currentLabel, colSpan: count });
                                                    currentLabel = label;
                                                    count = 1;
                                                }
                                            });
                                            if (count > 0) groups.push({ label: currentLabel, colSpan: count });
                                        }
                                        return groups.map((g, i) => (
                                            <div key={i} className="text-[11px] font-semibold text-center py-1 border-r border-slate-300 last:border-r-0 bg-slate-200/40 text-slate-700" style={{ flex: g.colSpan }}>
                                                {g.label}
                                            </div>
                                        ));
                                    })()}
                                </div>
                                {/* Bottom tier: Days */}
                                <div className="flex">
                                    {dates.map((date, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex-1 p-1 text-center text-[10px] border-r border-slate-200 last:border-r-0 
                                            ${isToday(date) ? 'bg-blue-100/50 font-bold text-blue-700' : 'text-slate-600'}
                                            ${isWeekend(date) ? 'bg-gray-100/80 text-slate-400' : ''}
                                        `}
                                        >
                                            <div className={isWeekend(date) ? 'opacity-50' : ''}>{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</div>
                                            <div className="font-semibold text-xs leading-none mt-0.5">{date.getDate()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Task rows */}
                        {flatTasks.map((task, taskIdx) => {
                            const position = getTaskPosition(task);
                            const isSubtask = task.depth > 0;

                            return (
                                <div
                                    key={task.entity_id}
                                    className={`flex border-b last:border-b-0 group transition-colors
                                ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-slate-100
                            `}
                                >
                                    {/* Task name column */}
                                    <div
                                        className={`w-48 flex-shrink-0 py-2 pr-2 border-r border-slate-200 border-l-4 sticky left-0 z-20 transition-colors
                                    ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} group-hover:bg-slate-100
                                    ${priorityBorders[task.priority || 'medium']}`}
                                        style={{ paddingLeft: `${0.5 + (task.depth * 1.5)}rem` }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {task.status === 'done' ? (
                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            ) : (
                                                isSubtask && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={`${isSubtask ? 'text-xs' : 'text-sm'} font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline cells */}
                                    <div className="flex-1 flex relative">
                                        {dates.map((date, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex-1 relative border-r last:border-r-0 min-h-[48px]
                                            ${isToday(date) ? 'bg-blue-50' : ''}
                                            ${isWeekend(date) ? 'bg-gray-50' : ''}
                                        `}
                                            >
                                                {/* Due date marker / Duration bar */}
                                                {position && position.startIdx === idx && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`absolute top-1/2 -translate-y-1/2 ${isSubtask ? 'h-4 opacity-80 rounded-sm top-[60%]' : 'h-8 rounded-md'} shadow-sm flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all
                                                                ${statusColors[task.status]} text-white text-xs px-2
                                                            `}
                                                                    style={{
                                                                        left: 0,
                                                                        width: `calc(${((position.endIdx - position.startIdx) + 1) * 100}% + ${position.endIdx - position.startIdx}px)`,
                                                                        minWidth: isSubtask ? '20px' : '60px',
                                                                        zIndex: 10
                                                                    }}
                                                                    onClick={() => {
                                                                        setSelectedTask(task);
                                                                        setIsModalOpen(true);
                                                                    }}
                                                                >
                                                                    {!isSubtask && (
                                                                        <span className="truncate w-full text-center font-medium">
                                                                            {task.title}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs break-words z-50">
                                                                <div className="space-y-1">
                                                                    <p className="font-semibold text-sm">{task.title}</p>
                                                                    <p className="text-xs text-muted-foreground capitalize">
                                                                        Status: {task.status.replace('_', ' ')}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Start: {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Today'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                                                                    </p>
                                                                    <p className="text-xs text-blue-500 font-medium pt-1">
                                                                        Click to edit task
                                                                    </p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <div className="w-1 h-4 bg-gray-400 rounded"></div> Low Priority
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-1 h-4 bg-yellow-500 rounded"></div> Medium Priority
                </span>
                <span className="flex items-center gap-1">
                    <div className="w-1 h-4 bg-red-500 rounded"></div> High Priority
                </span>
            </div>

            <GanttTaskModal
                assignmentId={assignmentId}
                task={selectedTask}
                eligibleAssignees={eligibleAssignees}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedTask(null);
                }}
                onTaskUpdated={fetchTasks}
            />
        </div>
    );
};

export default TaskGantt;
