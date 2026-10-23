import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Task } from './TaskCard';
import { SharedReportTimeline } from './SharedReportTimeline';
import { SharedTaskEditor, CustomFieldDraft } from './SharedTaskEditor';

interface GanttTaskModalProps {
    assignmentId: number;
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated: () => void;
    eligibleAssignees?: any[];
}

export const GanttTaskModal: React.FC<GanttTaskModalProps> = ({
    assignmentId,
    task,
    isOpen,
    onClose,
    onTaskUpdated,
    eligibleAssignees
}) => {
    const { toast } = useToast();

    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editCustomFields, setEditCustomFields] = useState<CustomFieldDraft[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && task) {
            setEditingTask({ ...task });
            if (task.custom_fields) {
                const arr: CustomFieldDraft[] = Object.entries(task.custom_fields)
                    .filter(([k]) => k !== 'assignee')
                    .map(([k, v]: [string, any]) => ({
                        key: k,
                        value: typeof v === 'object' && v !== null ? v.value : String(v),
                        color: typeof v === 'object' && v !== null && v.color ? v.color : 'blue',
                        type: typeof v === 'object' && v !== null && v.type ? v.type : 'text',
                        _isEditing: false,
                    }));
                setEditCustomFields(arr);
            } else {
                setEditCustomFields([]);
            }
        }
    }, [isOpen, task]);

    const handleSave = async () => {
        if (!editingTask || !editingTask.title.trim()) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const payloadCustomFields = editCustomFields.reduce((acc, curr) => {
                if (curr.key && curr.value) acc[curr.key] = { value: curr.value, color: curr.color, type: curr.type };
                return acc;
            }, {} as Record<string, any>);

            const response = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${editingTask.entity_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                }),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.ok) {
                    toast({ title: 'Task updated successfully' });
                    onTaskUpdated();
                } else {
                    toast({ title: 'Error', description: data.error || 'Failed to update', variant: 'destructive' });
                }
            } else {
                const errorData = await response.json();
                toast({ title: 'Error', description: errorData.error || 'Failed to update', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Connection failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!editingTask) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[70vw] max-h-[85vh] flex flex-col p-6 gap-0">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl">
                        Task Settings &amp; Reports: {task?.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 overflow-hidden min-h-0 divide-x -mx-6">
                    {/* LEFT PANE: EDIT TASK */}
                    <div className="w-1/2 flex flex-col px-6 min-h-0 overflow-y-auto">
                        <h3 className="font-semibold text-lg mb-4 sticky top-0 bg-white/95 backdrop-blur z-10 pb-2">Edit Task Details</h3>
                        <div className="pb-6">
                            <SharedTaskEditor
                                assignmentId={assignmentId}
                                task={editingTask}
                                onChange={(updated) => setEditingTask(prev => prev ? { ...prev, ...updated } : null)}
                                customFields={editCustomFields}
                                onCustomFieldsChange={setEditCustomFields}
                                onStepRefetch={onTaskUpdated}
                                eligibleAssignees={eligibleAssignees}
                            />
                        </div>
                    </div>

                    {/* RIGHT PANE: REPORT TIMELINE */}
                    <div className="w-1/2 flex flex-col px-6 min-h-0 pb-6 border-l bg-slate-50 relative">
                        <div className="flex items-center gap-2 mb-4 sticky top-0 bg-white/95 backdrop-blur z-20 pb-2 pt-2 border-b">
                            <h3 className="font-semibold text-lg">Report Timeline</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 min-h-0 relative">
                            <SharedReportTimeline assignmentId={assignmentId} task={task} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        <X className="w-4 h-4 mr-1" /> Close Modal
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting || !editingTask?.title.trim()}>
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Task Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
