import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2, ChevronUp, Pencil, Package, ListTodo, User } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Task } from './TaskCard';

export type CustomFieldDraft = {
    key: string;
    value: string;
    color: string;
    type: string;
    _isEditing?: boolean;
};

interface SharedTaskEditorProps {
    assignmentId: number;
    task: Task;
    onChange: (updated: Partial<Task>) => void;
    customFields: CustomFieldDraft[];
    onCustomFieldsChange: (fields: CustomFieldDraft[]) => void;
    onStepRefetch?: () => void;
    /** Optional date constraints from parent task */
    parentMinDate?: string;
    parentMaxDate?: string;
    parentTaskLabel?: string;
    eligibleAssignees?: any[];
}

export const SharedTaskEditor: React.FC<SharedTaskEditorProps> = ({
    assignmentId,
    task,
    onChange,
    customFields,
    onCustomFieldsChange,
    onStepRefetch,
    parentMinDate,
    parentMaxDate,
    parentTaskLabel,
    eligibleAssignees
}) => {
    const { toast } = useToast();
    const [newStepLabel, setNewStepLabel] = useState('');
    const [isAddingStep, setIsAddingStep] = useState(false);

    // ─── Custom Fields ────────────────────────────────────────────────────────

    const handleCFChange = (idx: number, field: string, value: string) => {
        const arr = [...customFields];
        arr[idx] = { ...arr[idx], [field]: value };
        onCustomFieldsChange(arr);
    };

    const handleCFToggleEdit = (idx: number, editing: boolean) => {
        const arr = [...customFields];
        arr[idx] = { ...arr[idx], _isEditing: editing };
        onCustomFieldsChange(arr);
    };

    const handleCFRemove = (idx: number) => {
        onCustomFieldsChange(customFields.filter((_, i) => i !== idx));
    };

    const handleCFAdd = () => {
        onCustomFieldsChange([...customFields, { key: '', value: '', color: 'blue', type: 'text', _isEditing: true }]);
    };

    // ─── Steps ────────────────────────────────────────────────────────────────

    const handleAddStep = async () => {
        const label = newStepLabel.trim();
        if (!label) return;
        setIsAddingStep(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}/steps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ label })
            });
            if (res.ok) {
                setNewStepLabel('');
                toast({ title: 'Step added' });
                onStepRefetch?.();
            } else {
                toast({ title: 'Error adding step', variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Network error', variant: 'destructive' });
        } finally {
            setIsAddingStep(false);
        }
    };

    const handleDeleteStep = async (stepId: string) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks-steps/${stepId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast({ title: 'Step deleted' });
                onStepRefetch?.();
            }
        } catch (e) {
            toast({ title: 'Error deleting step', variant: 'destructive' });
        }
    };

    const handleUpdateStepLabel = async (stepId: string, newLabel: string) => {
        if (!newLabel.trim()) return;
        try {
            const token = localStorage.getItem('hots_tokek');
            await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks-steps/${stepId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ label: newLabel })
            });
        } catch (e) {
            toast({ title: 'Error updating step', variant: 'destructive' });
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* Title */}
            <div>
                <Label htmlFor="ste-title">Title *</Label>
                <Input
                    id="ste-title"
                    value={task.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    placeholder="Task title..."
                />
            </div>

            {/* Description */}
            <div>
                <Label>Description</Label>
                <RichTextEditor
                    value={task.description || ''}
                    onChange={(val) => onChange({ description: val })}
                />
            </div>

            {/* Priority / Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <Label>Priority</Label>
                    <Select
                        value={task.priority}
                        onValueChange={(v) => onChange({ priority: v as any })}
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Start Date</Label>
                    <Input
                        type="date"
                        min={parentMinDate}
                        max={parentMaxDate}
                        value={task.start_date || ''}
                        onChange={(e) => onChange({ start_date: e.target.value })}
                    />
                    {parentTaskLabel && (
                        <span className="text-[10px] text-muted-foreground block mt-1">Bound by parent task dates</span>
                    )}
                </div>
                <div>
                    <Label>Due Date</Label>
                    <Input
                        type="date"
                        min={task.start_date || parentMinDate}
                        max={parentMaxDate}
                        value={task.due_date || ''}
                        onChange={(e) => onChange({ due_date: e.target.value })}
                    />
                </div>
            </div>
            {/* Estimated Hours / Difficulty Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <Label>Estimated Hours</Label>
                    <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="e.g. 8"
                        value={task.estimated_hours || ''}
                        onChange={(e) => onChange({ estimated_hours: e.target.value })}
                    />
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Used for workload calculation</span>
                </div>
                <div>
                    <Label>Difficulty Level</Label>
                    <Select
                        value={task.difficulty_level || ''}
                        onValueChange={(v) => onChange({ difficulty_level: v })}
                    >
                        <SelectTrigger><SelectValue placeholder="Select difficulty..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 - Very Easy (~2h)</SelectItem>
                            <SelectItem value="2">2 - Easy (~4h)</SelectItem>
                            <SelectItem value="3">3 - Medium (~8h)</SelectItem>
                            <SelectItem value="4">4 - Hard (~16h)</SelectItem>
                            <SelectItem value="5">5 - Very Hard (~32h)</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Fallback when estimated hours is empty</span>
                </div>
            </div>

            {/* Assignees Bucket */}
            {eligibleAssignees && eligibleAssignees.length > 0 && (
                <div className="pt-4 border-t">
                    <Label className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold">Assignees</span>
                    </Label>

                    {/* Display current assignees with role badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(() => {
                            const cfs = task.custom_fields || {};
                            let currentAssignees: any[] = [];
                            if (Array.isArray(cfs.assignees)) {
                                currentAssignees = cfs.assignees;
                            } else if (cfs.assignee) {
                                currentAssignees = [{ ...cfs.assignee, role: 'PIC' }];
                            }

                            if (currentAssignees.length === 0) {
                                return <span className="text-xs text-muted-foreground italic">No members assigned.</span>;
                            }

                            const roleColors: Record<string, string> = {
                                PIC: 'bg-indigo-100 text-indigo-700 border-indigo-300',
                                CONTRIBUTOR: 'bg-sky-50 text-sky-700 border-sky-200',
                                REVIEWER: 'bg-amber-50 text-amber-700 border-amber-200'
                            };
                            const roleIcons: Record<string, string> = {
                                PIC: '\ud83d\udc51',
                                CONTRIBUTOR: '\ud83d\udc65',
                                REVIEWER: '\ud83d\udd0d'
                            };
                            const roleOrder = ['PIC', 'CONTRIBUTOR', 'REVIEWER'];

                            return currentAssignees.map(a => {
                                const role = a.role || 'PIC';
                                const colorClass = roleColors[role] || roleColors.CONTRIBUTOR;
                                const roleIcon = roleIcons[role] || '';

                                return (
                                    <div key={a.userId} className={`flex items-center gap-1 ${colorClass} border px-2 py-1 rounded-md text-xs font-medium`}>
                                        <span>{roleIcon}</span>
                                        <span>{a.value}</span>
                                        {/* Role cycle button */}
                                        <button
                                            onClick={() => {
                                                const nextRole = roleOrder[(roleOrder.indexOf(role) + 1) % roleOrder.length];
                                                const updated = currentAssignees.map(ca =>
                                                    ca.userId === a.userId ? { ...ca, role: nextRole } : ca
                                                );
                                                // If switching TO PIC, remove PIC from others
                                                const final = nextRole === 'PIC'
                                                    ? updated.map(ca => ca.userId === a.userId ? ca : { ...ca, role: ca.role === 'PIC' ? 'CONTRIBUTOR' : ca.role })
                                                    : updated;
                                                const pic = final.find(ca => ca.role === 'PIC');
                                                const newFields = { ...cfs, assignees: final };
                                                delete (newFields as any).assignee;
                                                onChange({
                                                    custom_fields: newFields,
                                                    primary_assignee_id: pic ? String(pic.userId) : (final.length > 0 ? String(final[0].userId) : undefined)
                                                } as any);
                                            }}
                                            className="ml-0.5 text-[9px] font-bold uppercase opacity-60 hover:opacity-100 bg-white/50 px-1 rounded"
                                            title={`Click to change role (current: ${role})`}
                                        >
                                            {role}
                                        </button>
                                        {/* Remove button */}
                                        <button
                                            onClick={() => {
                                                const updated = currentAssignees.filter(ca => ca.userId !== a.userId);
                                                const newFields = { ...cfs };
                                                if (updated.length > 0) {
                                                    newFields.assignees = updated;
                                                } else {
                                                    delete newFields.assignees;
                                                }
                                                delete (newFields as any).assignee;
                                                const pic = updated.find(ca => ca.role === 'PIC');
                                                onChange({
                                                    custom_fields: newFields,
                                                    primary_assignee_id: pic ? String(pic.userId) : (updated.length > 0 ? String(updated[0].userId) : undefined)
                                                } as any);
                                            }}
                                            className="ml-1 text-slate-400 hover:text-red-500 rounded bg-white/40 hover:bg-red-100 p-0.5"
                                            title="Remove Assignee"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <Select
                        value="" // Always show placeholder
                        onValueChange={(val) => {
                            if (!val) return;

                            const member = eligibleAssignees?.find(m => String(m.user_id) === val);
                            if (member) {
                                const cfs = task.custom_fields || {};
                                let currentAssignees: any[] = [];
                                if (Array.isArray(cfs.assignees)) {
                                    currentAssignees = [...cfs.assignees];
                                } else if (cfs.assignee) {
                                    currentAssignees = [cfs.assignee];
                                }

                                // Prevent duplicates
                                if (!currentAssignees.find(a => String(a.userId) === val)) {
                                    // First assignee becomes PIC, rest are CONTRIBUTOR
                                    const role = currentAssignees.length === 0 ? 'PIC' : 'CONTRIBUTOR';
                                    const newAssignee = {
                                        value: member.user_name || member.firstname,
                                        color: 'indigo',
                                        type: 'text',
                                        userId: member.user_id,
                                        role: role
                                    };

                                    const updatedAssignees = [...currentAssignees, newAssignee];
                                    const pic = updatedAssignees.find(a => a.role === 'PIC');
                                    const newFields = {
                                        ...cfs,
                                        assignees: updatedAssignees
                                    };
                                    delete (newFields as any).assignee;

                                    onChange({
                                        custom_fields: newFields,
                                        primary_assignee_id: pic ? String(pic.userId) : String(member.user_id)
                                    } as any);
                                }
                            }
                        }}
                    >
                        <SelectTrigger className="w-full h-8 max-w-sm border-dashed">
                            <SelectValue placeholder="+ Add Assignee..." />
                        </SelectTrigger>
                        <SelectContent>
                            {eligibleAssignees.map((member) => (
                                <SelectItem key={member.user_id} value={String(member.user_id)}>
                                    {member.user_name || `${member.firstname} ${member.lastname || ''}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Custom Properties */}
            <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Custom Properties</Label>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-primary bg-primary/10 hover:bg-primary/20"
                        onClick={handleCFAdd}
                    >
                        <Plus className="w-3 h-3 mr-1" /> Add Property
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 items-start">
                    {customFields.map((cf, idx) => (
                        cf._isEditing ? (
                            <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50/80 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Edit Property</span>
                                    <Button
                                        type="button" variant="ghost" size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-slate-600"
                                        onClick={() => handleCFToggleEdit(idx, false)}
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input placeholder="Key (e.g. Budget)" className="h-8 flex-1 text-sm bg-white" value={cf.key} onChange={e => handleCFChange(idx, 'key', e.target.value)} />
                                    <Input placeholder="Value (e.g. 5000)" className="h-8 flex-1 text-sm bg-white" value={cf.value} onChange={e => handleCFChange(idx, 'value', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={cf.type || 'text'} onValueChange={v => handleCFChange(idx, 'type', v)}>
                                        <SelectTrigger className="h-8 flex-1 bg-white"><SelectValue placeholder="Type" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text">Label (Text)</SelectItem>
                                            <SelectItem value="number">Numeric</SelectItem>
                                            <SelectItem value="resource">Resource</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={cf.color} onValueChange={v => handleCFChange(idx, 'color', v)}>
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
                                <Button type="button" variant="ghost" size="sm" className="h-8 mt-1 w-full text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => handleCFRemove(idx)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </Button>
                            </div>
                        ) : (
                            <div
                                key={idx}
                                className={`flex items-center justify-between p-2.5 rounded-lg border bg-${cf.color || 'slate'}-50/50 border-${cf.color || 'slate'}-200 cursor-pointer hover:shadow-sm transition-all group`}
                                onClick={() => handleCFToggleEdit(idx, true)}
                            >
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className={`text-[10px] uppercase font-bold text-${cf.color || 'slate'}-500 flex items-center gap-1.5`}>
                                        {cf.type === 'resource' && <Package className="w-3 h-3" />}
                                        {cf.key || 'Unnamed'}
                                    </span>
                                    <span className={`text-sm font-semibold truncate text-${cf.color || 'slate'}-800 mt-0.5`}>
                                        {cf.type === 'number' || cf.type === 'resource'
                                            ? (!isNaN(Number(cf.value)) ? Number(cf.value).toLocaleString('id-ID') : cf.value)
                                            : (cf.value || '-')}
                                    </span>
                                </div>
                                <Pencil className={`w-3.5 h-3.5 text-${cf.color || 'slate'}-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2`} />
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Checklist Steps */}
            <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-primary" />
                    <Label className="text-sm font-semibold">Checklist Steps</Label>
                </div>

                {/* Existing Steps */}
                <div className="space-y-2">
                    {(task.steps || []).map((step) => (
                        <div key={step.entity_id} className="flex items-center gap-2 bg-muted/30 p-2 rounded border border-dashed border-slate-200 group/estep">
                            <Checkbox checked={step.checked === 'true'} disabled className="h-4 w-4" />
                            <Input
                                defaultValue={step.label}
                                onBlur={(e) => handleUpdateStepLabel(step.entity_id, e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                className={`h-7 text-sm flex-1 ${step.checked === 'true' ? 'line-through text-muted-foreground' : ''} border-transparent hover:border-slate-200 focus:border-slate-300 bg-transparent px-2`}
                            />
                            <Button
                                variant="ghost" size="icon"
                                className="h-6 w-6 text-red-500 opacity-0 group-hover/estep:opacity-100 transition-opacity"
                                onClick={() => handleDeleteStep(step.entity_id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Add Step */}
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Add a new step..."
                        className="h-8 flex-1"
                        value={newStepLabel}
                        onChange={(e) => setNewStepLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddStep(); }}
                    />
                    <Button
                        type="button" variant="secondary" size="sm" className="h-8"
                        onClick={handleAddStep}
                        disabled={isAddingStep || !newStepLabel.trim()}
                    >
                        {isAddingStep ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
