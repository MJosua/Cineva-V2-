import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { Task } from './TaskCard';
import { API_URL } from '@/config/sourceConfig';

interface TaskGanttProps {
    assignmentId: number;
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

export const TaskGantt: React.FC<TaskGanttProps> = ({ assignmentId }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (assignmentId) {
            fetchTasks();
        }
    }, [assignmentId]);

    // Calculate date range for Gantt
    const getDateRange = () => {
        const today = new Date();
        const dates: Date[] = [];

        // Show 14 days from today
        for (let i = -3; i < 11; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
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
        if (!task.due_date) return null;

        const dueDate = new Date(task.due_date);
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        // Check if due date is within range
        if (dueDate < startDate || dueDate > endDate) return null;

        // Calculate position (percentage)
        const totalDays = dates.length;
        const dayIndex = dates.findIndex(d => d.toDateString() === dueDate.toDateString());

        if (dayIndex === -1) return null;

        return {
            left: (dayIndex / totalDays) * 100,
            dayIndex
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

    if (tasks.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks with due dates to display</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{tasks.length} tasks</Badge>
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

            <div className="border rounded-lg overflow-hidden">
                {/* Date header */}
                <div className="flex border-b bg-muted/50">
                    <div className="w-48 flex-shrink-0 p-2 border-r font-medium text-sm">
                        Task
                    </div>
                    <div className="flex-1 flex">
                        {dates.map((date, idx) => (
                            <div
                                key={idx}
                                className={`flex-1 p-1 text-center text-xs border-r last:border-r-0 
                                    ${isToday(date) ? 'bg-blue-100 font-bold' : ''}
                                    ${isWeekend(date) ? 'bg-gray-50' : ''}
                                `}
                            >
                                {formatDate(date)}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task rows */}
                {tasks.map((task, taskIdx) => {
                    const position = getTaskPosition(task);
                    const progress = getStepProgress(task);

                    return (
                        <div
                            key={task.entity_id}
                            className={`flex border-b last:border-b-0 hover:bg-muted/30 transition-colors
                                ${taskIdx % 2 === 0 ? 'bg-white' : 'bg-muted/10'}
                            `}
                        >
                            {/* Task name column */}
                            <div className={`w-48 flex-shrink-0 p-2 border-r border-l-4 ${priorityBorders[task.priority || 'medium']}`}>
                                <div className="flex items-center gap-2">
                                    {task.status === 'done' && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                            }`}>
                                            {task.title}
                                        </p>
                                        {task.steps.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Progress value={progress} className="h-1 flex-1" />
                                                <span className="text-xs text-muted-foreground">
                                                    {task.steps.filter(s => s.checked === 'true').length}/{task.steps.length}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Timeline cells */}
                            <div className="flex-1 flex relative">
                                {dates.map((date, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex-1 border-r last:border-r-0 min-h-[48px]
                                            ${isToday(date) ? 'bg-blue-50' : ''}
                                            ${isWeekend(date) ? 'bg-gray-50' : ''}
                                        `}
                                    >
                                        {/* Due date marker */}
                                        {position && position.dayIndex === idx && (
                                            <div
                                                className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md shadow-sm flex items-center justify-center
                                                    ${statusColors[task.status]} text-white text-xs px-2
                                                `}
                                                style={{
                                                    left: `calc(${(idx / dates.length) * 100}% + 4px)`,
                                                    minWidth: '60px'
                                                }}
                                                title={`Due: ${task.due_date}`}
                                            >
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Due
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

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
        </div>
    );
};

export default TaskGantt;
