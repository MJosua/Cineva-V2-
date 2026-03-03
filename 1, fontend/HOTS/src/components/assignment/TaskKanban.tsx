import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Loader2,
    ListTodo,
    Clock,
    CheckCircle2,
    GripVertical,
    Trash2,
    ChevronUp,
    Package,
    Pencil
} from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TaskCard, Task } from './TaskCard';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { SharedTaskEditor, CustomFieldDraft } from './SharedTaskEditor';
import { TaskFilterBar, TaskFilters, applyTaskFilters } from './TaskFilterBar';
import { WorkloadBar } from './WorkloadBar';

interface TaskKanbanProps {
    assignmentId: number;
    assignedType: string;
    assignedId: number;
}

const columns = [
    { id: 'todo', title: 'To Do', icon: ListTodo, bgColor: 'bg-slate-50', borderColor: 'border-slate-200', headerBg: 'bg-slate-100' },
    { id: 'in_progress', title: 'In Progress', icon: Clock, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100' },
    { id: 'done', title: 'Done', icon: CheckCircle2, bgColor: 'bg-green-50', borderColor: 'border-green-200', headerBg: 'bg-green-100' }
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({ assignmentId, assignedType, assignedId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [eligibleAssignees, setEligibleAssignees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const { toast } = useToast();

    // ── Filter state ───────────────────────────────────────────────────────
    const [filters, setFilters] = useState<TaskFilters>({
        searchQuery: '',
        assigneeFilter: [],
        statusFilter: [],
        showOverdue: false,
        viewMode: 'column'
    });

    // New task form state
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        start_date: '',
        due_date: '',
        custom_fields: [] as { key: string; value: string; color: string; type: string }[],
        steps: [] as { label: string }[],
        assignee: null as any
    });
    const [parentTaskId, setParentTaskId] = useState<string | undefined>(undefined);
    const [editCustomFields, setEditCustomFields] = useState<CustomFieldDraft[]>([]);

    // 🔗 Global listener for TaskCard Edit button
    useEffect(() => {
        (window as any).editTask = (task: Task) => {
            setEditingTask(task);
            if (task.custom_fields) {
                const arr = Object.entries(task.custom_fields)
                    .filter(([k]) => k !== 'assignee')
                    .map(([k, v]: [string, any]) => ({
                        key: k,
                        value: typeof v === 'object' && v !== null ? v.value : v,
                        color: typeof v === 'object' && v !== null && v.color ? v.color : 'blue',
                        type: typeof v === 'object' && v !== null && v.type ? v.type : 'text'
                    }));
                setEditCustomFields(arr);
            } else {
                setEditCustomFields([]);
            }
            setIsEditDialogOpen(true);
        };
        return () => {
            delete (window as any).editTask;
        };
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.ok) {
                const freshTasks: Task[] = data.tasks || [];
                setTasks(freshTasks);

                // 🔄 Sync editingTask steps from fresh data so the edit modal reflects
                // newly added/deleted steps without the user having to close and reopen.
                setEditingTask(prev => {
                    if (!prev) return prev;
                    const findTask = (list: Task[], id: string): Task | undefined => {
                        for (const t of list) {
                            if (t.entity_id === id) return t;
                            if (t.subtasks?.length) {
                                const found = findTask(t.subtasks, id);
                                if (found) return found;
                            }
                        }
                    };
                    const fresh = findTask(freshTasks, prev.entity_id);
                    if (!fresh) return prev;
                    // Preserve any in-progress edits (title, desc, priority, dates) but refresh steps
                    return { ...prev, steps: fresh.steps ?? prev.steps };
                });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast({ title: 'Error', description: 'Failed to load tasks', variant: 'destructive' });
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
                // If it's a direct user assignment, we can fetch that specific user's info
                // For now, let's assume we can at least show that user
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
            (window as any).refreshTasks = fetchTasks;
        }
        return () => {
            delete (window as any).refreshTasks;
        };
    }, [assignmentId, assignedId, assignedType]);

    const { sseSignals } = useAppSelector(state => state.tickets);

    // 🆕 SSE Signal Listener: Refetch tasks when backend signals a change
    useEffect(() => {
        if (sseSignals?.task) {
            console.log('📡 [KANBAN] SSE Signal received, refetching tasks...');
            fetchTasks();
        }
    }, [sseSignals?.task]);

    const handleCreateTask = async () => {
        if (!newTask.title.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');

            const payloadCustomFields = newTask.custom_fields.reduce((acc, curr) => {
                if (curr.key && curr.value) acc[curr.key] = { value: curr.value, color: curr.color, type: curr.type };
                return acc;
            }, {} as Record<string, { value: string, color: string, type: string }>);

            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newTask,
                    parent_task_id: parentTaskId,
                    custom_fields: {
                        ...payloadCustomFields,
                        ...(newTask.assignee ? { assignee: newTask.assignee } : {}),
                        ...((newTask.custom_fields as any)?.assignees ? { assignees: (newTask.custom_fields as any).assignees } : {})
                    }
                })
            });

            const data = await response.json();
            if (data.ok) {
                toast({ title: 'Success', description: 'Task created' });
                setNewTask({ title: '', description: '', priority: 'medium', start_date: '', due_date: '', custom_fields: [], steps: [], assignee: null });
                setParentTaskId(undefined);
                setIsAddDialogOpen(false);
                fetchTasks();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask || !editingTask.title.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');

            const payloadCustomFields = editCustomFields.reduce((acc, curr) => {
                if (curr.key && curr.value) acc[curr.key] = { value: curr.value, color: curr.color, type: curr.type };
                return acc;
            }, {} as Record<string, { value: string, color: string, type: string }>);

            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${editingTask.entity_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editingTask.title,
                    description: editingTask.description,
                    priority: editingTask.priority,
                    start_date: editingTask.start_date,
                    due_date: editingTask.due_date,
                    estimated_hours: editingTask.estimated_hours || null,
                    difficulty_level: editingTask.difficulty_level || null,
                    primary_assignee_id: editingTask.primary_assignee_id || null,
                    custom_fields: {
                        ...payloadCustomFields,
                        ...(editingTask.custom_fields?.assignee ? { assignee: editingTask.custom_fields.assignee } : {}),
                        ...(editingTask.custom_fields?.assignees ? { assignees: editingTask.custom_fields.assignees } : {})
                    }
                })
            });

            const data = await response.json();
            if (data.ok) {
                toast({ title: 'Success', description: 'Task updated' });
                setIsEditDialogOpen(false);
                setEditingTask(null);
                fetchTasks();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Recursive helper to update all subtasks
        const updateAllDescendants = (taskList: Task[], id: string, status: string, updates: any[]) => {
            const task = findTask(taskList, id);
            if (task && task.subtasks) {
                task.subtasks.forEach(sub => {
                    updates.push({ id: sub.entity_id, status });
                    updateAllDescendants(task.subtasks!, sub.entity_id, status, updates);
                });
            }
        };

        const statusUpdates: { id: string, status: string }[] = [{ id: taskId, status: newStatus }];
        if (newStatus === 'done') {
            updateAllDescendants(tasks, taskId, 'done', statusUpdates);
        }

        // Optimistic update
        setTasks(prev => {
            const newTasks = [...prev];
            const applyBatch = (list: Task[]) => {
                list.forEach(t => {
                    const match = statusUpdates.find(u => u.id === t.entity_id);
                    if (match) t.status = match.status as any;
                    if (t.subtasks) applyBatch(t.subtasks);
                });
            };
            applyBatch(newTasks);
            return newTasks;
        });

        try {
            const token = localStorage.getItem('tokek');
            // Batch update in backend or sequential calls (sequentially for now as backend exists for single)
            for (const upd of statusUpdates) {
                await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${upd.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: upd.status })
                });
            }

            // After subtasks are done, check if parent should be done
            if (newStatus === 'done') {
                checkAndMarkParentDone(taskId);
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            fetchTasks();
        }
    };

    const checkAndMarkParentDone = async (taskId: string) => {
        const task = findTask(tasks, taskId);
        if (!task || !task.parent_task_id) return;

        const parent = findTask(tasks, task.parent_task_id);
        if (!parent) return;

        // If all siblings are done, mark parent as done
        const allSiblingsDone = parent.subtasks?.every(s => s.status === 'done');
        if (allSiblingsDone && parent.status !== 'done') {
            await handleStatusChange(parent.entity_id, 'done');
        }
    };

    const handleAddSubtask = (parentId: string) => {
        setParentTaskId(parentId);
        setNewTask({ title: '', description: '', priority: 'medium', start_date: '', due_date: '', custom_fields: [] as { key: string; value: string; color: string; type: string }[], steps: [], assignee: null });
        setIsAddDialogOpen(false); // just in case
        setTimeout(() => setIsAddDialogOpen(true), 10);
    };

    const handleCustomFieldChange = (isEdit: boolean, index: number, field: string, value: string) => {
        if (isEdit) {
            setEditCustomFields(prev => {
                const arr = [...prev];
                arr[index] = { ...arr[index], [field]: value } as any;
                return arr;
            });
        } else {
            setNewTask(prev => {
                const arr = [...prev.custom_fields];
                arr[index] = { ...arr[index], [field]: value } as any;
                return { ...prev, custom_fields: arr };
            });
        }
    };

    const handleRemoveCustomField = (isEdit: boolean, index: number) => {
        if (isEdit) {
            setEditCustomFields(prev => prev.filter((_, i) => i !== index));
        } else {
            setNewTask(prev => ({ ...prev, custom_fields: prev.custom_fields.filter((_, i) => i !== index) }));
        }
    };

    const handleDeleteStep = async (taskId: string, stepId: string) => {
        try {
            const token = localStorage.getItem('tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks-steps/${stepId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: 'Step deleted' });
                // Optimistically update local state to avoid full refetch delay
                if (editingTask && editingTask.entity_id === taskId) {
                    setEditingTask(prev => prev ? ({
                        ...prev,
                        steps: (prev.steps || []).filter(s => s.entity_id !== stepId)
                    }) : null);
                }
                fetchTasks();
            }
        } catch (e) {
            toast({ title: 'Error deleting step', variant: 'destructive' });
        }
    };

    const handleUpdateStepLabel = async (taskId: string, stepId: string, newLabel: string) => {
        if (!newLabel.trim()) return;
        try {
            const token = localStorage.getItem('tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks-steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ label: newLabel })
            });
            if (res.ok) {
                toast({ title: 'Step updated' });
                if (editingTask && editingTask.entity_id === taskId) {
                    setEditingTask(prev => prev ? ({
                        ...prev,
                        steps: (prev.steps || []).map(s => s.entity_id === stepId ? { ...s, label: newLabel } : s)
                    }) : null);
                }
                fetchTasks();
            }
        } catch (e) {
            toast({ title: 'Error updating step', variant: 'destructive' });
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;

        // Optimistic update
        setTasks(prev => prev.filter(t => t.entity_id !== taskId));

        try {
            const token = localStorage.getItem('tokek');
            await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast({ title: 'Deleted', description: 'Task removed' });
        } catch (error) {
            console.error('Error deleting task:', error);
            fetchTasks();
        }
    };

    const handleGenerateTaskReport = async (taskId: string) => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/report/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ticket_id: taskId, is_task: true })
            });
            const data = await response.json();
            if (data.ok) {
                await fetch(`${API_URL}/engine/assignment/${assignmentId}/timeline`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ content: data.narrative_text })
                });
                toast({ title: 'Success', description: 'Task report posted to timeline' });
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
        }
    };

    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        setDraggedFromColumn(task.status);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.entity_id);
        const target = e.currentTarget as HTMLElement;
        setTimeout(() => { target.style.opacity = '0.5'; }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedTask(null);
        setDraggedFromColumn(null);
        setDragOverColumn(null);
        setDragOverTaskId(null);
        const target = e.currentTarget as HTMLElement;
        target.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string, overTaskId?: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumn !== columnId) setDragOverColumn(columnId);
        if (overTaskId && dragOverTaskId !== overTaskId) setDragOverTaskId(overTaskId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setDragOverColumn(null);
            setDragOverTaskId(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        setDragOverTaskId(null);

        if (!draggedTask) return;

        if (draggedTask.status !== columnId) {
            // Cross-column drop → change status
            await handleStatusChange(draggedTask.entity_id, columnId);
        } else {
            // Same-column drop → reorder
            const columnTasks = getTasksByStatus(columnId);
            const oldIdx = columnTasks.findIndex(t => t.entity_id === draggedTask.entity_id);
            const newIdx = dragOverTaskId
                ? columnTasks.findIndex(t => t.entity_id === dragOverTaskId)
                : columnTasks.length - 1;

            if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                const reordered = [...columnTasks];
                const [moved] = reordered.splice(oldIdx, 1);
                reordered.splice(newIdx, 0, moved);

                // Optimistic update
                setTasks(prev => {
                    const others = prev.filter(t => t.status !== columnId);
                    return [...others, ...reordered];
                });

                // Persist reorder
                const token = localStorage.getItem('tokek');
                await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/reorder`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ ordered_ids: reordered.map(t => t.entity_id) })
                });
            }
        }

        setDraggedTask(null);
        setDraggedFromColumn(null);
    };

    // Only root tasks (depth=1 or no parent) go into Kanban columns
    // Apply filters BEFORE distributing to columns
    const filteredTasks = applyTaskFilters(tasks, filters);
    const getTasksByStatus = (status: string) => {
        return filteredTasks.filter(t => t.status === status && (!t.depth || t.depth <= 1));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const findTask = (taskList: Task[], id: string): Task | null => {
        for (const t of taskList) {
            if (t.entity_id === id) return t;
            if (t.subtasks) {
                const found = findTask(t.subtasks, id);
                if (found) return found;
            }
        }
        return null;
    };

    const findTaskAnywhere = (taskList: Task[], id: string): Task | null => findTask(taskList, id);

    const parentTask = parentTaskId ? findTask(tasks, parentTaskId) : null;
    const parentMinDate = parentTask?.start_date ? new Date(parentTask.start_date).toISOString().split('T')[0] : undefined;
    const parentMaxDate = parentTask?.due_date ? new Date(parentTask.due_date).toISOString().split('T')[0] : undefined;

    const editingParentTask = editingTask?.parent_task_id ? findTask(tasks, editingTask.parent_task_id) : null;
    const editParentMinDate = editingParentTask?.start_date ? new Date(editingParentTask.start_date).toISOString().split('T')[0] : undefined;
    const editParentMaxDate = editingParentTask?.due_date ? new Date(editingParentTask.due_date).toISOString().split('T')[0] : undefined;

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{filteredTasks.length}/{tasks.length} tasks</Badge>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) setParentTaskId(undefined);
                }}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1" onClick={() => setParentTaskId(undefined)}>
                            <Plus className="w-4 h-4" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{parentTaskId ? 'Create Subtask' : 'Create New Task'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Task title..."
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <RichTextEditor
                                    value={newTask.description}
                                    onChange={(val) => setNewTask(prev => ({ ...prev, description: val }))}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <Label htmlFor="priority">Priority</Label>
                                    <Select
                                        value={newTask.priority}
                                        onValueChange={(v) => setNewTask(prev => ({ ...prev, priority: v }))}
                                    >
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
                                <div className="col-span-1">
                                    <Label htmlFor="new-start_date">Start Date</Label>
                                    <Input
                                        id="new-start_date"
                                        type="date"
                                        min={parentMinDate}
                                        max={parentMaxDate}
                                        value={newTask.start_date}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, start_date: e.target.value }))}
                                    />
                                    {parentTask && <span className="text-[10px] text-muted-foreground block mt-1">Bound by parent task dates</span>}
                                </div>
                                <div className="col-span-1">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        min={newTask.start_date || parentMinDate}
                                        max={parentMaxDate}
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {eligibleAssignees.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Assignee</Label>
                                    <Select
                                        value={newTask.assignee?.userId ? String(newTask.assignee.userId) : ""}
                                        onValueChange={(val) => {
                                            const member = eligibleAssignees.find(m => String(m.user_id) === val);
                                            if (member) {
                                                setNewTask({
                                                    ...newTask,
                                                    assignee: {
                                                        value: member.user_name || member.firstname,
                                                        color: 'indigo',
                                                        type: 'text',
                                                        userId: member.user_id
                                                    }
                                                });
                                            } else {
                                                setNewTask({ ...newTask, assignee: null });
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assignee..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {eligibleAssignees.map((member) => (
                                                <SelectItem key={member.user_id} value={String(member.user_id)}>
                                                    {member.user_name || `${member.firstname} ${member.lastname || ''}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2 mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Custom Properties</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-primary bg-primary/10 hover:bg-primary/20"
                                            onClick={() => setNewTask(prev => ({ ...prev, custom_fields: [...(prev.custom_fields || []), { key: '', value: '', color: 'blue', type: 'text', _isEditing: true } as any] }))}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Property
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 items-start">
                                        {(newTask.custom_fields || []).map((cf: any, idx) => (
                                            cf._isEditing ? (
                                                <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50/80 rounded-lg border border-slate-200 shadow-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Edit Property</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={() => {
                                                            const newFields = [...newTask.custom_fields];
                                                            newFields[idx] = { ...newFields[idx], _isEditing: false } as any;
                                                            setNewTask(prev => ({ ...prev, custom_fields: newFields }));
                                                        }}>
                                                            <ChevronUp className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Input placeholder="Key (e.g. Budget)" className="h-8 flex-1 text-sm bg-white" value={cf.key} onChange={e => handleCustomFieldChange(false, idx, 'key', e.target.value)} />
                                                        <Input placeholder="Value (e.g. 5000)" className="h-8 flex-1 text-sm bg-white" value={cf.value} onChange={e => handleCustomFieldChange(false, idx, 'value', e.target.value)} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Select value={cf.type || 'text'} onValueChange={v => handleCustomFieldChange(false, idx, 'type', v)}>
                                                            <SelectTrigger className="h-8 flex-1 bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Label (Text)</SelectItem>
                                                                <SelectItem value="number">Numeric</SelectItem>
                                                                <SelectItem value="resource">Resource</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <Select value={cf.color} onValueChange={v => handleCustomFieldChange(false, idx, 'color', v)}>
                                                            <SelectTrigger className="h-8 w-[100px] bg-white"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="slate">Slate</SelectItem>
                                                                <SelectItem value="blue">Blue</SelectItem>
                                                                <SelectItem value="red">Red</SelectItem>
                                                                <SelectItem value="green">Green</SelectItem>
                                                                <SelectItem value="orange">Orange</SelectItem>
                                                                <SelectItem value="indigo">Indigo</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" className="h-8 mt-1 w-full text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveCustomField(false, idx)}>
                                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border bg-${cf.color || 'slate'}-50/50 border-${cf.color || 'slate'}-200 cursor-pointer hover:shadow-sm transition-all group`} onClick={() => {
                                                    const newFields = [...newTask.custom_fields];
                                                    newFields[idx] = { ...newFields[idx], _isEditing: true } as any;
                                                    setNewTask(prev => ({ ...prev, custom_fields: newFields }));
                                                }}>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className={`text-[10px] uppercase font-bold text-${cf.color || 'slate'}-500 flex items-center gap-1.5`}>
                                                            {cf.type === 'resource' && <Package className="w-3 h-3" />}
                                                            {cf.key || 'Unnamed'}
                                                        </span>
                                                        <span className={`text-sm font-semibold truncate text-${cf.color || 'slate'}-800 mt-0.5`}>
                                                            {cf.type === 'number' || cf.type === 'resource' ? (!isNaN(Number(cf.value)) ? Number(cf.value).toLocaleString('id-ID') : cf.value) : (cf.value || '-')}
                                                        </span>
                                                    </div>
                                                    <Pencil className={`w-3.5 h-3.5 text-${cf.color || 'slate'}-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2`} />
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Checklist Steps</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-primary"
                                            onClick={() => setNewTask(prev => ({ ...prev, steps: [...(prev.steps || []), { label: '' }] }))}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Step
                                        </Button>
                                    </div>
                                    {(newTask.steps || []).map((step, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                placeholder={`Step ${idx + 1} (e.g. Brainstorming)`}
                                                className="h-8 flex-1"
                                                value={step.label}
                                                onChange={e => {
                                                    const newSteps = [...newTask.steps];
                                                    newSteps[idx].label = e.target.value;
                                                    setNewTask(prev => ({ ...prev, steps: newSteps }));
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                onClick={() => {
                                                    setNewTask(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); setParentTaskId(undefined); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTask} disabled={isSubmitting || !newTask.title.trim()}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Task Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Task</DialogTitle>
                        </DialogHeader>
                        {editingTask && (
                            <div className="py-4">
                                <SharedTaskEditor
                                    assignmentId={assignmentId}
                                    task={editingTask}
                                    onChange={(updated) => setEditingTask(prev => prev ? { ...prev, ...updated } : null)}
                                    customFields={editCustomFields}
                                    onCustomFieldsChange={setEditCustomFields}
                                    onStepRefetch={fetchTasks}
                                    eligibleAssignees={eligibleAssignees}
                                />
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateTask} disabled={isSubmitting || !editingTask?.title.trim()}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter Bar */}
            <TaskFilterBar
                filters={filters}
                onFiltersChange={setFilters}
                eligibleAssignees={eligibleAssignees}
                showSwimlaneToggle={true}
            />

            {/* Workload Indicator */}
            <WorkloadBar
                tasks={tasks}
                eligibleAssignees={eligibleAssignees}
            />

            {/* Kanban Board — Column Mode */}
            {filters.viewMode === 'column' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {columns.map(column => {
                        const columnTasks = getTasksByStatus(column.id);
                        const Icon = column.icon;
                        const isDragOver = dragOverColumn === column.id;

                        return (
                            <div
                                key={column.id}
                                className={`rounded-lg border-2 transition-all duration-200 min-h-[200px]
                                    ${column.bgColor} ${column.borderColor}
                                    ${isDragOver ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]' : ''}
                                `}
                                onDragOver={(e) => handleDragOver(e, column.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <div className={`p-3 border-b ${column.headerBg} flex items-center justify-between rounded-t-lg`}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium text-sm">{column.title}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {columnTasks.length}
                                    </Badge>
                                </div>
                                <div className="p-2 space-y-2">
                                    {columnTasks.length === 0 ? (
                                        <div className={`text-xs text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg
                                            ${isDragOver ? 'border-primary bg-primary/5' : 'border-transparent'}
                                        `}>
                                            {isDragOver ? 'Drop here' : 'No tasks'}
                                        </div>
                                    ) : (
                                        columnTasks.map(task => (
                                            <div key={task.entity_id}>
                                                <TaskCard
                                                    task={task}
                                                    assignmentId={assignmentId}
                                                    eligibleAssignees={eligibleAssignees}
                                                    onStatusChange={handleStatusChange}
                                                    onAddSubtask={handleAddSubtask}
                                                    onDelete={handleDeleteTask}
                                                    onGenerateReport={handleGenerateTaskReport}
                                                    draggable
                                                    onDragStart={handleDragStart}
                                                    onDragEnd={handleDragEnd}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Kanban Board — Swimlane Mode */}
            {filters.viewMode === 'swimlane' && (() => {
                // Group root tasks by primary_assignee_id
                const rootTasks = filteredTasks.filter(t => !t.depth || t.depth <= 1);
                const lanes: Record<string, { name: string; userId: string; tasks: typeof rootTasks }> = {};

                rootTasks.forEach(task => {
                    const picId = task.primary_assignee_id
                        || task.custom_fields?.assignees?.find((a: any) => a.role === 'PIC')?.userId
                        || task.custom_fields?.assignees?.[0]?.userId
                        || '__unassigned__';
                    const picName = task.custom_fields?.assignees?.find((a: any) => String(a.userId) === String(picId))?.value || null;

                    if (!lanes[picId]) {
                        const member = eligibleAssignees.find(m => String(m.user_id) === String(picId));
                        lanes[picId] = {
                            name: picName || member?.user_name || member?.firstname || 'Unassigned',
                            userId: String(picId),
                            tasks: []
                        };
                    }
                    lanes[picId].tasks.push(task);
                });

                // Sort: named lanes first, unassigned last
                const laneEntries = Object.entries(lanes).sort(([a], [b]) => {
                    if (a === '__unassigned__') return 1;
                    if (b === '__unassigned__') return -1;
                    return lanes[a].name.localeCompare(lanes[b].name);
                });

                return (
                    <div className="space-y-4">
                        {/* Swimlane Status Header */}
                        <div className="grid grid-cols-[180px_1fr_1fr_1fr] gap-2">
                            <div></div>
                            {columns.map(col => {
                                const Icon = col.icon;
                                return (
                                    <div key={col.id} className={`${col.headerBg} rounded-md px-3 py-1.5 flex items-center gap-1.5`}>
                                        <Icon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">{col.title}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Swimlane Rows */}
                        {laneEntries.map(([laneId, lane]) => (
                            <div key={laneId} className="grid grid-cols-[180px_1fr_1fr_1fr] gap-2 group">
                                {/* Assignee Label */}
                                <div className="flex flex-col justify-center items-start px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                            {laneId === '__unassigned__' ? '?' : lane.name.charAt(0).toUpperCase()}
                                        </span>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-700 leading-tight">{lane.name}</div>
                                            <div className="text-[10px] text-slate-400">{lane.tasks.length} task{lane.tasks.length !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini columns: To Do / In Progress / Done */}
                                {columns.map(col => {
                                    const colTasks = lane.tasks.filter(t => t.status === col.id);
                                    return (
                                        <div
                                            key={col.id}
                                            className={`${col.bgColor} rounded-lg border ${col.borderColor} p-1.5 min-h-[80px] transition-all`}
                                            onDragOver={(e) => handleDragOver(e, col.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                        >
                                            {colTasks.length === 0 ? (
                                                <div className="text-[10px] text-muted-foreground text-center py-6 border border-dashed border-slate-200 rounded">
                                                    —
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {colTasks.map(task => (
                                                        <div key={task.entity_id}>
                                                            <TaskCard
                                                                task={task}
                                                                assignmentId={assignmentId}
                                                                eligibleAssignees={eligibleAssignees}
                                                                onStatusChange={handleStatusChange}
                                                                onAddSubtask={handleAddSubtask}
                                                                onDelete={handleDeleteTask}
                                                                onGenerateReport={handleGenerateTaskReport}
                                                                draggable
                                                                onDragStart={handleDragStart}
                                                                onDragEnd={handleDragEnd}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Drag hint */}
            {tasks.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                    💡 {filters.viewMode === 'swimlane' ? 'Drag tasks between columns to change status' : 'Drag and drop tasks between columns to change status'}
                </p>
            )}
        </div>
    );
};

export default TaskKanban;
