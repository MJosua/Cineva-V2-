import React from 'react';
import { Task } from './TaskCard';

interface WorkloadBarProps {
    tasks: Task[];
    eligibleAssignees: any[];
}

const DIFFICULTY_HOURS: Record<number, number> = {
    1: 2,
    2: 4,
    3: 8,
    4: 16,
    5: 32
};
const WEEKLY_CAPACITY = 40;

function getTaskHours(task: Task): number {
    if (task.estimated_hours) return Number(task.estimated_hours);
    const diff = Number(task.difficulty_level) || 3;
    return DIFFICULTY_HOURS[diff] || 8;
}

export const WorkloadBar: React.FC<WorkloadBarProps> = ({ tasks, eligibleAssignees }) => {
    // Build workload per assignee
    const workloads = eligibleAssignees.map(member => {
        const userId = String(member.user_id);
        const activeTasks = tasks.filter(t => {
            if (t.status === 'done') return false;
            const picId = t.primary_assignee_id
                || t.custom_fields?.assignees?.find((a: any) => a.role === 'PIC')?.userId
                || t.custom_fields?.assignees?.[0]?.userId;
            return String(picId) === userId;
        });
        const totalHours = activeTasks.reduce((sum, t) => sum + getTaskHours(t), 0);
        const percentage = WEEKLY_CAPACITY > 0 ? Math.round((totalHours / WEEKLY_CAPACITY) * 100) : 0;
        return {
            userId,
            name: member.user_name || member.firstname || 'Unknown',
            totalHours,
            percentage,
            taskCount: activeTasks.length,
            isOverloaded: percentage >= 100
        };
    });

    // Only show if there are assignees with work
    if (workloads.every(w => w.taskCount === 0)) return null;

    return (
        <div className="bg-white/80 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    📊 Team Workload (Weekly Capacity: {WEEKLY_CAPACITY}h)
                </span>
            </div>
            <div className="space-y-1.5">
                {workloads
                    .filter(w => w.taskCount > 0)
                    .sort((a, b) => b.percentage - a.percentage)
                    .map(w => (
                        <div key={w.userId} className="flex items-center gap-2">
                            {/* Avatar */}
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold border ${w.isOverloaded ? 'bg-red-100 text-red-700 border-red-300' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                {w.name.charAt(0).toUpperCase()}
                            </span>
                            {/* Name */}
                            <span className="text-xs font-medium text-slate-600 w-20 truncate" title={w.name}>{w.name}</span>
                            {/* Progress bar */}
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${w.isOverloaded
                                        ? 'bg-gradient-to-r from-red-400 to-red-600'
                                        : w.percentage >= 80
                                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                            : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                        }`}
                                    style={{ width: `${Math.min(w.percentage, 100)}%` }}
                                />
                            </div>
                            {/* Percentage */}
                            <span className={`text-[11px] font-bold min-w-[42px] text-right ${w.isOverloaded ? 'text-red-600' : w.percentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {w.percentage}%
                            </span>
                            {/* Hours detail */}
                            <span className="text-[10px] text-slate-400 min-w-[48px]">
                                {w.totalHours}h / {WEEKLY_CAPACITY}h
                            </span>
                            {/* Warning icon */}
                            {w.isOverloaded && <span className="text-sm" title="Overloaded!">🔴</span>}
                        </div>
                    ))
                }
            </div>
        </div>
    );
};
