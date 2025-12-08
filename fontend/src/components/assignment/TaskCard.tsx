import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
    ChevronDown,
    ChevronUp,
    Calendar,
    MoreVertical,
    Plus,
    Trash2,
    GripVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export interface TaskStep {
    entity_id: string;
    task_id: string;
    label: string;
    checked: string;
    order: string;
}

export interface Task {
    entity_id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
    order: string;
    steps: TaskStep[];
    created_at?: string;
    created_by?: string;
}

interface TaskCardProps {
    task: Task;
    onStatusChange?: (taskId: string, status: string) => void;
    onStepToggle?: (taskId: string, stepId: string, checked: boolean) => void;
    onAddStep?: (taskId: string, label: string) => void;
    onDelete?: (taskId: string) => void;
    draggable?: boolean;
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
};

const statusColors: Record<string, string> = {
    todo: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700'
};

export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    onStatusChange,
    onStepToggle,
    onAddStep,
    onDelete,
    draggable = false
}) => {
    const [expanded, setExpanded] = useState(false);
    const [newStepLabel, setNewStepLabel] = useState('');
    const [showAddStep, setShowAddStep] = useState(false);

    const completedSteps = task.steps.filter(s => s.checked === 'true').length;
    const totalSteps = task.steps.length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    const handleAddStep = () => {
        if (newStepLabel.trim() && onAddStep) {
            onAddStep(task.entity_id, newStepLabel.trim());
            setNewStepLabel('');
            setShowAddStep(false);
        }
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

    const dueInfo = formatDueDate(task.due_date);

    return (
        <Card className="mb-3 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-3 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                        {draggable && (
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                        )}
                        <div className="flex-1">
                            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                            {task.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {task.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'todo')}>
                                Move to To Do
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'in_progress')}>
                                Move to In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange?.(task.entity_id, 'done')}>
                                Move to Done
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete?.(task.entity_id)}
                                className="text-red-600"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Badges row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.priority && (
                        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                            {task.priority}
                        </Badge>
                    )}
                    {dueInfo && (
                        <span className={`text-xs flex items-center gap-1 ${dueInfo.color}`}>
                            <Calendar className="w-3 h-3" />
                            {dueInfo.text}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                {totalSteps > 0 && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{completedSteps}/{totalSteps} steps</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                    </div>
                )}
            </CardHeader>

            {/* Expandable steps section */}
            {totalSteps > 0 && (
                <CardContent className="p-3 pt-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="w-full justify-between h-7 text-xs"
                    >
                        <span>Checklist</span>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>

                    {expanded && (
                        <div className="mt-2 space-y-1.5">
                            {task.steps.map(step => (
                                <div
                                    key={step.entity_id}
                                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50"
                                >
                                    <Checkbox
                                        checked={step.checked === 'true'}
                                        onCheckedChange={(checked) =>
                                            onStepToggle?.(task.entity_id, step.entity_id, !!checked)
                                        }
                                    />
                                    <span className={`text-sm flex-1 ${step.checked === 'true' ? 'line-through text-muted-foreground' : ''
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}

                            {/* Add step form */}
                            {showAddStep ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <Input
                                        value={newStepLabel}
                                        onChange={(e) => setNewStepLabel(e.target.value)}
                                        placeholder="Step label..."
                                        className="h-7 text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                                        autoFocus
                                    />
                                    <Button size="sm" className="h-7" onClick={handleAddStep}>
                                        Add
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7"
                                        onClick={() => setShowAddStep(false)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-7 text-xs text-muted-foreground"
                                    onClick={() => setShowAddStep(true)}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add step
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
};

export default TaskCard;
