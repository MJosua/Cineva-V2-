import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Loader2,
    ListTodo,
    Clock,
    CheckCircle2,
    GripVertical
} from 'lucide-react';
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

interface TaskKanbanProps {
    assignmentId: number;
}

const columns = [
    { id: 'todo', title: 'To Do', icon: ListTodo, bgColor: 'bg-slate-50', borderColor: 'border-slate-200', headerBg: 'bg-slate-100' },
    { id: 'in_progress', title: 'In Progress', icon: Clock, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-blue-100' },
    { id: 'done', title: 'Done', icon: CheckCircle2, bgColor: 'bg-green-50', borderColor: 'border-green-200', headerBg: 'bg-green-100' }
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({ assignmentId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
    const [dragOverPosition, setDragOverPosition] = useState<'above' | 'below' | null>(null);
    const { toast } = useToast();

    // New task form state
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
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
            toast({ title: 'Error', description: 'Failed to load tasks', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assignmentId) {
            fetchTasks();
        }
    }, [assignmentId]);

    const handleCreateTask = async () => {
        if (!newTask.title.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTask)
            });

            const data = await response.json();
            if (data.ok) {
                toast({ title: 'Success', description: 'Task created' });
                setNewTask({ title: '', description: '', priority: 'medium', due_date: '' });
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

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.entity_id === taskId ? { ...t, status: newStatus as Task['status'] } : t
        ));

        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            if (!data.ok) {
                // Revert on failure
                fetchTasks();
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            fetchTasks();
        }
    };

    const handleOrderChange = async (taskId: string, newOrder: number) => {
        try {
            const token = localStorage.getItem('tokek');
            await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ order: String(newOrder) })
            });
        } catch (error) {
            console.error('Error updating task order:', error);
            fetchTasks();
        }
    };

    const handleStepToggle = async (taskId: string, stepId: string, checked: boolean) => {
        // Optimistic update
        setTasks(prev => prev.map(task => {
            if (task.entity_id === taskId) {
                return {
                    ...task,
                    steps: task.steps.map(step =>
                        step.entity_id === stepId
                            ? { ...step, checked: checked ? 'true' : 'false' }
                            : step
                    )
                };
            }
            return task;
        }));

        try {
            const token = localStorage.getItem('tokek');
            await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${taskId}/steps/${stepId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ checked })
            });
        } catch (error) {
            console.error('Error toggling step:', error);
            fetchTasks();
        }
    };

    const handleAddStep = async (taskId: string, label: string) => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${taskId}/steps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ label })
            });

            const data = await response.json();
            if (data.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Error adding step:', error);
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

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, task: Task) => {
        setDraggedTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.entity_id);

        // Add drag styling
        const target = e.target as HTMLElement;
        setTimeout(() => {
            target.style.opacity = '0.5';
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedTask(null);
        setDragOverColumn(null);
        setDragOverTaskId(null);
        setDragOverPosition(null);
        const target = e.target as HTMLElement;
        target.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumn !== columnId) {
            setDragOverColumn(columnId);
        }
    };

    const handleTaskDragOver = (e: React.DragEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedTask || draggedTask.entity_id === task.entity_id) return;

        // Determine if we're above or below the task
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const position = e.clientY < midpoint ? 'above' : 'below';

        setDragOverTaskId(task.entity_id);
        setDragOverPosition(position);
    };

    const handleTaskDragLeave = (e: React.DragEvent) => {
        // Only clear if actually leaving
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setDragOverTaskId(null);
            setDragOverPosition(null);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if leaving the column entirely
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        if (!currentTarget.contains(relatedTarget)) {
            setDragOverColumn(null);
        }
    };

    const handleDrop = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();

        if (!draggedTask) {
            setDragOverColumn(null);
            setDragOverTaskId(null);
            setDragOverPosition(null);
            return;
        }

        const columnTasks = getTasksByStatus(columnId);
        const isSameColumn = draggedTask.status === columnId;

        // If dropping on a specific task
        if (dragOverTaskId && dragOverPosition) {
            const targetTask = tasks.find(t => t.entity_id === dragOverTaskId);
            if (targetTask) {
                // Calculate new order
                const sortedTasks = [...columnTasks].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
                const targetIndex = sortedTasks.findIndex(t => t.entity_id === dragOverTaskId);

                let newOrder: number;
                const targetOrder = Number(targetTask.order || 0);

                if (dragOverPosition === 'above') {
                    const prevTask = sortedTasks[targetIndex - 1];
                    const prevOrder = prevTask ? Number(prevTask.order || 0) : 0;
                    newOrder = prevTask ? (prevOrder + targetOrder) / 2 : targetOrder - 1;
                } else {
                    const nextTask = sortedTasks[targetIndex + 1];
                    const nextOrder = nextTask ? Number(nextTask.order || 0) : 0;
                    newOrder = nextTask ? (targetOrder + nextOrder) / 2 : targetOrder + 1;
                }

                // Optimistic update
                setTasks(prev => prev.map(t =>
                    t.entity_id === draggedTask.entity_id
                        ? { ...t, status: columnId as Task['status'], order: String(newOrder) }
                        : t
                ));

                // Update backend
                if (!isSameColumn) {
                    handleStatusChange(draggedTask.entity_id, columnId);
                }
                handleOrderChange(draggedTask.entity_id, newOrder);
            }
        } else if (!isSameColumn) {
            // Just changing column, add to end
            const maxOrder = columnTasks.reduce((max, t) => Math.max(max, Number(t.order || 0)), 0);
            handleStatusChange(draggedTask.entity_id, columnId);
            handleOrderChange(draggedTask.entity_id, maxOrder + 1);
        }

        setDragOverColumn(null);
        setDragOverTaskId(null);
        setDragOverPosition(null);
        setDraggedTask(null);
    };

    const getTasksByStatus = (status: string) => {
        return tasks
            .filter(t => t.status === status)
            .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
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
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">{tasks.length} tasks</Badge>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <Plus className="w-4 h-4" />
                            Add Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
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
                                <Textarea
                                    id="description"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description..."
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
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
                                <div>
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={newTask.due_date}
                                        onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTask} disabled={isSubmitting || !newTask.title.trim()}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Kanban Board */}
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
                                    columnTasks.map(task => {
                                        const isDropTarget = dragOverTaskId === task.entity_id;
                                        const dropAbove = isDropTarget && dragOverPosition === 'above';
                                        const dropBelow = isDropTarget && dragOverPosition === 'below';

                                        return (
                                            <div
                                                key={task.entity_id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task)}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={(e) => handleTaskDragOver(e, task)}
                                                onDragLeave={handleTaskDragLeave}
                                                className="cursor-grab active:cursor-grabbing relative"
                                            >
                                                {/* Drop indicator above */}
                                                {dropAbove && (
                                                    <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full z-10" />
                                                )}
                                                <TaskCard
                                                    task={task}
                                                    onStatusChange={handleStatusChange}
                                                    onStepToggle={handleStepToggle}
                                                    onAddStep={handleAddStep}
                                                    onDelete={handleDeleteTask}
                                                    draggable
                                                />
                                                {/* Drop indicator below */}
                                                {dropBelow && (
                                                    <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full z-10" />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Drag hint */}
            {tasks.length > 0 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                    💡 Drag and drop tasks between columns to change status
                </p>
            )}
        </div>
    );
};

export default TaskKanban;
