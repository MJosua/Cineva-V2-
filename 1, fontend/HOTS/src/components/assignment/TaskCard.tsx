import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    ChevronDown,
    ChevronUp,
    Calendar,
    MoreVertical,
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    FileText,
    Loader2,
    Clock,
    X,
    ListTodo,
    Package,
    User
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { SharedReportTimeline } from './SharedReportTimeline';

export interface Task {
    entity_id: string;
    parent_task_id?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    start_date?: string;
    due_date?: string;
    order: string | number;
    depth?: number;
    report?: string;
    custom_fields?: Record<string, any>;
    usages?: Record<string, number>;
    subtasks?: Task[];
    steps?: any[];
    created_at?: string;
    created_by?: string;
    estimated_hours?: string;
    actual_hours?: string;
    difficulty_level?: string;
    primary_assignee_id?: string;
}

interface TaskCardProps {
    task: Task;
    assignmentId?: number;
    onStatusChange?: (taskId: string, status: string) => void;
    onAddSubtask?: (parentId: string) => void;
    onDelete?: (taskId: string) => void;
    draggable?: boolean;
    isSubtask?: boolean;
    onDragStart?: (e: React.DragEvent, task: Task) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onGenerateReport?: (taskId: string) => void;
    eligibleAssignees?: any[];
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
};

// ── SubtaskList ─────────────────────────────────────────────────────────────
// Self-contained DnD reorder container for subtasks within a parent card.
interface SubtaskListProps {
    subtasks: Task[];
    parentId: string;
    assignmentId?: number;
    onStatusChange?: (taskId: string, status: string) => void;
    onAddSubtask?: (parentId: string) => void;
    onDelete?: (taskId: string) => void;
    onGenerateReport?: (taskId: string) => void;
    eligibleAssignees?: any[];
}

const SubtaskList: React.FC<SubtaskListProps> = ({
    subtasks,
    parentId,
    assignmentId,
    onStatusChange,
    onAddSubtask,
    onDelete,
    onGenerateReport,
    eligibleAssignees
}) => {
    const [ordered, setOrdered] = useState<Task[]>(subtasks);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [dragEnabled, setDragEnabled] = useState<string | null>(null); // which row's grip is held
    const { toast } = useToast();

    React.useEffect(() => { setOrdered(subtasks); }, [subtasks]);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        if (dragEnabled !== taskId) {
            e.preventDefault(); // only allow drag from grip
            return;
        }
        e.stopPropagation();
        setDraggedId(taskId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('subtask-id', taskId);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setDraggedId(null);
        setDragEnabled(null);
        setOverId(null);
    };

    const handleDragOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (overId !== taskId) setOverId(taskId);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const srcId = e.dataTransfer.getData('subtask-id');
        if (!srcId || srcId === targetId) {
            setDraggedId(null); setOverId(null); return;
        }
        const oldIdx = ordered.findIndex(t => t.entity_id === srcId);
        const newIdx = ordered.findIndex(t => t.entity_id === targetId);
        if (oldIdx === -1 || newIdx === -1) return;
        const reordered = [...ordered];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);
        setOrdered(reordered);
        setDraggedId(null); setOverId(null);
        if (assignmentId) {
            try {
                const token = localStorage.getItem('tokek');
                await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ ordered_ids: reordered.map(t => t.entity_id) })
                });
            } catch {
                toast({ title: 'Error', description: 'Failed to save subtask order', variant: 'destructive' });
            }
        }
    };

    return (
        <div className="mt-1 flex flex-col relative w-full space-y-0.5">
            {ordered.map((subtask, index) => {
                const isLast = index === ordered.length - 1;
                return (
                    <div
                        key={subtask.entity_id}
                        draggable={dragEnabled === subtask.entity_id}
                        onDragStart={(e) => handleDragStart(e, subtask.entity_id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, subtask.entity_id)}
                        onDrop={(e) => handleDrop(e, subtask.entity_id)}
                        className={`group relative transition-all ${overId === subtask.entity_id && draggedId !== subtask.entity_id
                            ? 'border-t-2 border-[#5d87ff] pt-0.5'
                            : ''
                            } ${draggedId === subtask.entity_id ? 'opacity-40' : ''}`}
                    >
                        {/* Folder tree structure visual lines */}
                        <div
                            className={`absolute border-l-[1.5px] border-[#bcccf2] pointer-events-none z-0 ${isLast ? 'h-[16px]' : 'h-full'}`}
                            style={{ top: '-10px', left: '0px' }}
                        />
                        <div
                            className="absolute border-t-[1.5px] border-[#bcccf2] pointer-events-none z-0"
                            style={{ top: '10px', left: '0px', width: '12px' }}
                        />
                        {/* Dot */}
                        <div
                            className="absolute rounded-full z-10 w-2 h-2 bg-[#5d87ff]"
                            style={{ top: '7px', left: '-3px' }}
                        />

                        {/* External grip handle */}
                        <div className="absolute left-[-15px] top-[10px] -translate-y-1/2 flex items-center z-20 bg-white border border-slate-200 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                                onMouseDown={() => setDragEnabled(subtask.entity_id)}
                                onMouseUp={() => setDragEnabled(null)}
                                className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-50 transition-colors"
                                title="Drag to reorder"
                            >
                                <GripVertical className="w-3 h-3 text-slate-400" />
                            </div>
                        </div>

                        {/* Subtask card content */}
                        <div className="pl-4 relative z-10 w-full mb-1">
                            <TaskCard
                                task={subtask}
                                assignmentId={assignmentId}
                                onStatusChange={onStatusChange}
                                onAddSubtask={onAddSubtask}
                                onDelete={onDelete}
                                draggable={false}
                                onGenerateReport={onGenerateReport}
                                isSubtask={true}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const getHierarchicalUsage = (t: Task, resourceKey: string): number => {
    let sum = 0;
    if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach(st => {
            sum += getHierarchicalUsage(st, resourceKey);
        });
    } else {
        sum += t.usages?.[resourceKey] || 0;
    }
    return sum;
};

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    assignmentId,
    onStatusChange,
    onAddSubtask,
    onDelete,
    draggable = false,
    isSubtask = false,
    onDragStart,
    onDragEnd,
    onGenerateReport,
    eligibleAssignees
}) => {
    const [expanded, setExpanded] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const handleAssigneeChange = async (userId: number, userName: string) => {
        try {
            const token = localStorage.getItem('tokek');
            const currentFields = task.custom_fields || {};

            // Normalize current assignees from either legacy object or array
            let currentAssignees: any[] = [];
            if (Array.isArray(currentFields.assignees)) {
                currentAssignees = [...currentFields.assignees];
            } else if (currentFields.assignee) {
                currentAssignees = [currentFields.assignee];
            }

            // Check if user is already assigned
            const index = currentAssignees.findIndex(a => String(a.userId) === String(userId));
            if (index !== -1) {
                // User is already assigned, so we REMOVE them
                currentAssignees.splice(index, 1);
            } else {
                // User is not assigned, determine role
                // First assignee becomes PIC, rest are CONTRIBUTOR
                const role = currentAssignees.length === 0 ? 'PIC' : 'CONTRIBUTOR';
                currentAssignees.push({
                    value: userName,
                    color: 'indigo',
                    type: 'text',
                    userId: userId,
                    role: role
                });
            }

            const newFields: Record<string, any> = { ...currentFields };
            if (currentAssignees.length > 0) {
                newFields.assignees = currentAssignees;
            } else {
                delete newFields.assignees;
            }
            delete newFields.assignee; // Ensure legacy is cleaned up

            // Determine primary_assignee_id from array
            const pic = currentAssignees.find(a => a.role === 'PIC');
            const primaryAssigneeId = pic ? String(pic.userId) : (currentAssignees.length > 0 ? String(currentAssignees[0].userId) : null);

            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    custom_fields: newFields,
                    primary_assignee_id: primaryAssigneeId
                })
            });

            const data = await response.json();
            if (data.ok) {
                toast({ title: 'Success', description: `Assignees updated` });
                if ((window as any).refreshTasks) (window as any).refreshTasks();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to assign task', variant: 'destructive' });
        }
    };

    // Helper to extract normalized assignees for rendering
    const getNormalizedAssignees = () => {
        const cfs = task.custom_fields || {};
        if (Array.isArray(cfs.assignees)) return cfs.assignees;
        if (cfs.assignee) return [cfs.assignee];
        return [];
    };
    const currentAssignees = getNormalizedAssignees();

    // Filter eligible assignees for subtasks based on parent's assignees
    let filteredEligibleAssignees = eligibleAssignees;
    if (currentAssignees && currentAssignees.length > 0) {
        const parentAssigneeIds = currentAssignees.map(a => String(a.userId));
        filteredEligibleAssignees = eligibleAssignees?.filter(member => parentAssigneeIds.includes(String(member.user_id)));
    }

    const [isReportOpen, setIsReportOpen] = useState(false);

    const { toast } = useToast();

    const isRootTask = !isSubtask && (!task.depth || task.depth <= 1);

    const openReportDialog = () => {
        setIsReportOpen(true);
    };


    const formatDueDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
        if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' };
        if (diffDays === 1) return { text: 'Tomorrow', color: 'text-yellow-600' };
        return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    };

    const handleToggleStep = async (stepId: string, checked: boolean) => {
        if (!assignmentId) return;
        try {
            const token = localStorage.getItem('tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks-steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ checked })
            });
            const data = await res.json();
            if (data.ok) {
                // Relying on SSE to refresh TaskKanban, or we can Toast
                toast({
                    title: checked ? '✅ Step marked as done' : '🔄 Step unchecked',
                    duration: 1500
                });
            }
        } catch (e) {
            toast({ title: 'Error toggling step', variant: 'destructive' });
        }
    };

    const dueInfo = formatDueDate(task.due_date);

    return (
        <>
            <Card
                draggable={draggable}
                onDragStart={(e) => {
                    if (draggable && onDragStart) {
                        e.stopPropagation();
                        onDragStart(e, task);
                    } else {
                        e.preventDefault();
                    }
                }}
                onDragEnd={(e) => {
                    if (draggable && onDragEnd) {
                        onDragEnd(e);
                    }
                }}
                className={isSubtask
                    ? "border-transparent bg-transparent shadow-none rounded-none"
                    : `mb-3 shadow-sm transition-all hover:shadow-md border ${task.status === 'done' ? 'bg-slate-50/80 border-slate-200 opacity-80' : 'bg-white border-slate-200'}`}
            >
                <CardHeader className={isSubtask ? "p-0 pb-1" : "p-3 pb-2"}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            {draggable && !isSubtask && (
                                <div
                                    className="cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
                                >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                            <Checkbox
                                className={`mt-[1px] ${isSubtask ? 'data-[state=checked]:bg-[#5d87ff] data-[state=checked]:border-[#5d87ff] border-[#5d87ff] h-4 w-4 rounded' : 'mt-1'}`}
                                checked={task.status === 'done'}
                                onCheckedChange={(checked) => onStatusChange?.(task.entity_id, checked ? 'done' : 'todo')}
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h4 className={`font-medium ${isSubtask ? 'text-[13px]' : 'text-sm'} leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-slate-700'}`}>
                                    {task.title}
                                </h4>


                                {task.description && (
                                    <div
                                        className="text-xs text-muted-foreground mt-1 line-clamp-2 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: task.description }}
                                    />
                                )}
                                {task.report && (
                                    <div className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        <span className="line-clamp-1">{task.report.replace(/<[^>]*>/g, '').slice(0, 60)}…</span>
                                    </div>
                                )}

                                {/* Badges row for subtasks (aligned under title) */}
                                {isSubtask && (
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        {task.depth && task.depth > 1 && (
                                            <Badge className="text-[10px] px-1.5 h-4.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-none border-[#c7d2fe]">
                                                L{task.depth}
                                            </Badge>
                                        )}
                                        {task.priority && (
                                            <Badge className={`text-[10px] px-1.5 h-4.5 uppercase font-bold tracking-tight shadow-none border-0 ${task.status === 'done' ? 'bg-slate-100 text-slate-400' : priorityColors[task.priority]}`}>
                                                {task.priority}
                                            </Badge>
                                        )}
                                        {currentAssignees.length > 0 ? (
                                            currentAssignees.map(a => (
                                                <Badge key={a.userId} className={`text-[10px] px-1.5 h-4.5 font-medium tracking-tight shadow-none bg-indigo-50 text-indigo-600 border-[0.5px] border-indigo-200`}>
                                                    <User className="w-2.5 h-2.5 inline mr-1 opacity-70" />
                                                    {a.value}
                                                </Badge>
                                            ))
                                        ) : (
                                            eligibleAssignees && eligibleAssignees.length > 0 && (
                                                <Badge variant="outline" className={`text-[10px] px-1.5 h-4.5 font-medium tracking-tight shadow-none text-slate-400 border-dashed border-slate-300 bg-transparent hover:bg-slate-50`}>
                                                    <User className="w-2.5 h-2.5 inline mr-1 opacity-50" />
                                                    Unassigned
                                                </Badge>
                                            )
                                        )}
                                        {task.custom_fields && Object.entries(task.custom_fields).map(([key, data]: [string, any]) => {
                                            // Skip assignee as it's handled separately
                                            if (key === 'assignee') return null;

                                            const value = typeof data === 'object' && data !== null ? data.value : String(data);
                                            if (!value) return null;

                                            const meta = typeof data === 'object' && data !== null ? data : { color: 'slate', type: 'text' };
                                            const color = meta.color || 'slate';
                                            const type = meta.type || 'text';

                                            let displayValue = (type === 'number' || type === 'resource') && !isNaN(Number(value))
                                                ? Number(value).toLocaleString('id-ID')
                                                : value;

                                            if (type === 'resource') {
                                                const consumed = getHierarchicalUsage(task, key);
                                                const total = Number(value) || 0;
                                                const remaining = total - consumed;
                                                displayValue = `${remaining.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')}`;
                                            }

                                            const colorClass = task.status === 'done'
                                                ? `bg-slate-50 text-slate-400 border-[0.5px] border-slate-200`
                                                : `bg-${color}-50 text-${color}-600 border-[0.5px] border-${color}-200`;
                                            return (
                                                <Badge key={key} variant="secondary" className={`text-[10px] px-1.5 h-4.5 font-medium tracking-tight shadow-none ${colorClass}`}>
                                                    <span className="opacity-60 mr-1">{key}:</span>
                                                    {type === 'resource' && <Package className="w-2.5 h-2.5 inline mr-1 opacity-70" />}
                                                    {displayValue}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            {/* Report shortcut button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); openReportDialog(); }}
                                className={`relative p-1 rounded transition-colors 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                                title={'Write Report'}
                            >
                                <FileText className="w-4 h-4" />
                            </button>
                            {/* Mini Progress Bar for Steps */}
                            {task.steps && task.steps.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1.5 mr-1 bg-slate-50/80 px-1.5 py-0.5 rounded-full border border-slate-200/50">
                                    <div className="text-[9px] font-bold text-slate-500 min-w-[20px]">
                                        {task.steps.filter(s => s.checked === 'true').length}/{task.steps.length}
                                    </div>
                                    <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${(task.steps.filter(s => s.checked === 'true').length / task.steps.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            {/* Menu dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {/* Status change: only for root tasks (depth=1) */}
                                    {isRootTask && (
                                        <>
                                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'todo')}>
                                                Move to To Do
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'in_progress')}>
                                                Move to In Progress
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'done')}>
                                                Move to Done
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => (window as any).editTask?.(task)}
                                        className="font-medium"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => { setExpanded(true); onAddSubtask?.(task.entity_id); }}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Subtask
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openReportDialog()}>
                                        <FileText className="w-4 h-4 mr-2" />
                                        Write Report
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {eligibleAssignees && eligibleAssignees.length > 0 && (
                                        <>
                                            <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign To</div>
                                            {eligibleAssignees.map((member: any) => (
                                                <DropdownMenuItem
                                                    key={member.user_id}
                                                    onClick={() => handleAssigneeChange(member.user_id, member.user_name || member.firstname)}
                                                    className="text-xs"
                                                >
                                                    <User className="w-3 h-3 mr-2 text-slate-400" />
                                                    {member.user_name || `${member.firstname} ${member.lastname || ''}`}
                                                </DropdownMenuItem>
                                            ))}
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => onDelete?.(task.entity_id)}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Badges row for root tasks */}
                    {!isSubtask && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {task.depth && task.depth > 1 && (
                                <Badge className="text-[10px] px-1.5 h-4.5 bg-indigo-100 text-indigo-700">
                                    L{task.depth}
                                </Badge>
                            )}
                            {task.priority && (
                                <Badge className={`text-[10px] px-1.5 h-4.5 uppercase font-bold tracking-tight ${task.status === 'done' ? 'bg-slate-100 text-slate-400' : priorityColors[task.priority]}`}>
                                    {task.priority}
                                </Badge>
                            )}
                            {currentAssignees.length > 0 ? (
                                <>
                                    {/* PIC badge (primary assignee) */}
                                    {currentAssignees.filter(a => a.role === 'PIC' || (!a.role && currentAssignees.indexOf(a) === 0)).map(a => (
                                        <Badge key={a.userId} className={`text-[10px] px-1.5 h-4.5 font-bold tracking-tight shadow-none bg-indigo-100 text-indigo-700 border-[0.5px] border-indigo-300`}>
                                            <span className="mr-0.5">👑</span>
                                            {a.value}
                                        </Badge>
                                    ))}
                                    {/* Contributor avatars */}
                                    {currentAssignees.filter(a => a.role && a.role !== 'PIC').length > 0 && (
                                        <div className="flex -space-x-1">
                                            {currentAssignees.filter(a => a.role && a.role !== 'PIC').map(a => (
                                                <span
                                                    key={a.userId}
                                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[8px] font-bold border border-white ring-1 ring-slate-300"
                                                    title={`${a.value} (${a.role || 'Contributor'})`}
                                                >
                                                    {(a.value || '?').charAt(0).toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                eligibleAssignees && eligibleAssignees.length > 0 && (
                                    <Badge variant="outline" className={`text-[10px] px-1.5 h-4.5 font-medium tracking-tight shadow-none text-slate-400 border-dashed border-slate-300 bg-transparent hover:bg-slate-50`}>
                                        <User className="w-2.5 h-2.5 inline mr-1 opacity-50" />
                                        Unassigned
                                    </Badge>
                                )
                            )}
                            {/* Estimated hours / Difficulty badges */}
                            {task.estimated_hours && (
                                <Badge variant="outline" className="text-[10px] px-1.5 h-4.5 font-medium tracking-tight shadow-none border-emerald-200 text-emerald-600 bg-emerald-50">
                                    <Clock className="w-2.5 h-2.5 inline mr-1 opacity-70" />
                                    {task.estimated_hours}h
                                </Badge>
                            )}
                            {task.difficulty_level && (
                                <Badge variant="outline" className="text-[10px] px-1.5 h-4.5 font-bold tracking-tight shadow-none border-amber-200 text-amber-600 bg-amber-50">
                                    {'⚡'.repeat(Math.min(Number(task.difficulty_level) || 1, 5))}
                                </Badge>
                            )}
                            {(task.start_date || task.due_date) && (
                                <Badge variant="outline" className={`text-[10px] h-4.5 gap-1 font-bold ${dueInfo ? dueInfo.color.replace('text-', 'border-').replace('600', '200') : 'border-gray-200'} ${dueInfo ? dueInfo.color : 'text-gray-600'} bg-white shadow-sm`}>
                                    <Calendar className="w-3 h-3" />
                                    {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Anytime'} - {dueInfo ? dueInfo.text : (task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date')}
                                </Badge>
                            )}
                            {task.custom_fields && Object.entries(task.custom_fields).map(([key, data]: [string, any]) => {
                                const value = typeof data === 'object' && data !== null ? data.value : String(data);
                                if (!value) return null;

                                const meta = typeof data === 'object' && data !== null ? data : { color: 'slate', type: 'text' };
                                const color = meta.color || 'slate';
                                const type = meta.type || 'text';

                                // 🔢 Format number with dots (Indonesian style)
                                let displayValue = (type === 'number' || type === 'resource') && !isNaN(Number(value))
                                    ? Number(value).toLocaleString('id-ID')
                                    : value;

                                if (type === 'resource') {
                                    const consumed = getHierarchicalUsage(task, key);
                                    const total = Number(value) || 0;
                                    const remaining = total - consumed;
                                    displayValue = `${remaining.toLocaleString('id-ID')} / ${total.toLocaleString('id-ID')}`;
                                }

                                const colorClass = task.status === 'done'
                                    ? `bg-slate-100 text-slate-400 border-[0.5px] border-slate-200`
                                    : `bg-${color}-100 text-${color}-800 border-[0.5px] border-${color}-200`;
                                return (
                                    <Badge key={key} variant="secondary" className={`text-[10px] px-1.5 h-4.5 font-medium tracking-tight ${colorClass}`}>
                                        <span className="opacity-60 mr-1">{key}:</span>
                                        {type === 'resource' && <Package className="w-2.5 h-2.5 inline mr-1 opacity-70" />}
                                        {displayValue}
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                    {/* Task Steps (Checklist) */}
                    {task.steps && task.steps.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t pt-3 border-slate-100">
                            <div className="flex items-center gap-1.5 mb-1">
                                <ListTodo className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Checklist</span>
                            </div>
                            {task.steps.map((step) => (
                                <div key={step.entity_id} className="flex items-center gap-2 group/step">
                                    <Checkbox
                                        id={step.entity_id}
                                        checked={step.checked === 'true'}
                                        onCheckedChange={(checked) => handleToggleStep(step.entity_id, !!checked)}
                                        className="h-3.5 w-3.5 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <label
                                        htmlFor={step.entity_id}
                                        className={`text-xs select-none transition-colors cursor-pointer ${step.checked === 'true' ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                    >
                                        {step.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </CardHeader>

                {/* Expandable subtasks section */}
                {(task.subtasks && task.subtasks.length > 0) && (
                    <CardContent className={isSubtask ? "p-1 pl-[0px] pt-1" : "p-3 pt-0 border-t bg-slate-50/50 rounded-b-xl"}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className={`h-7 text-[11px] ${isSubtask ? 'w-auto justify-start text-slate-500 hover:text-slate-700 bg-transparent hover:bg-slate-100/50 px-2 gap-1.5 ml-[-6px] border border-transparent shadow-none' : 'w-full justify-between'}`}
                        >
                            <span className="flex items-center gap-1.5">
                                {isSubtask && <div className="w-[12px] h-[12px] border rounded-sm flex items-center justify-center border-slate-300 bg-white"><div className="w-1.5 h-[1px] bg-slate-300" /></div>}
                                {isSubtask ? 'Subtasks' : `Subtasks (${task.subtasks.filter(s => s.status === 'done').length}/${task.subtasks.length})`}
                            </span>
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </Button>

                        {expanded && (
                            <div className={isSubtask ? "ml-[7.5px] pt-1 mt-0" : "mt-2"}>
                                <SubtaskList
                                    subtasks={task.subtasks}
                                    parentId={task.entity_id}
                                    assignmentId={assignmentId}
                                    eligibleAssignees={filteredEligibleAssignees}
                                    onStatusChange={onStatusChange}
                                    onAddSubtask={onAddSubtask}
                                    onDelete={onDelete}
                                    onGenerateReport={onGenerateReport}
                                />
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* ── Per-Card Multi-Entry Report Dialog ───────────────────────────── */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            Report Timeline — {task.title}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">
                            Each entry appears in Activity → Card Reports, sorted by date.
                        </p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-2 pr-2 space-y-4 min-h-0 bg-slate-50 relative rounded-md border p-4">
                        <SharedReportTimeline assignmentId={assignmentId || 0} task={task} />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReportOpen(false)}>
                            <X className="w-4 h-4 mr-1" /> Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
export default TaskCard;
