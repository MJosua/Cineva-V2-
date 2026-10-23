import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, FileText, Pencil, Trash2, Clock } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Task } from './TaskCard';

interface SharedReportTimelineProps {
    assignmentId: number;
    task: Task | null;
}

export const SharedReportTimeline: React.FC<SharedReportTimelineProps> = ({ assignmentId, task }) => {
    const { toast } = useToast();
    const [reportEntries, setReportEntries] = useState<any[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(false);
    const [newReportContent, setNewReportContent] = useState('');
    const [isSavingReport, setIsSavingReport] = useState(false);
    const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [selectedResource, setSelectedResource] = useState<string>('');
    const [consumedQty, setConsumedQty] = useState<string>('');

    // Find all resource typed custom properties for this task
    const resourceKeys = Object.entries(task?.custom_fields || {})
        .filter(([_, data]: [string, any]) => {
            const meta = typeof data === 'object' && data !== null ? data : {};
            return meta.type === 'resource';
        })
        .map(([k, data]: [string, any]) => {
            const valStr = typeof data === 'object' && data !== null ? data.value : String(data);
            return { key: k, total: Number(valStr) || 0 };
        });

    const fetchReportEntries = async () => {
        if (!assignmentId || !task?.entity_id) return;
        setIsLoadingReports(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) setReportEntries(data.reports || []);
            else console.error('getTaskReports error:', data.error);
        } catch (e) {
            console.error('Failed to load report entries:', e);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        if (task?.entity_id) fetchReportEntries();
    }, [assignmentId, task?.entity_id]);

    if (!task) return null;

    const handleAddReport = async () => {
        let finalContent = newReportContent.trim();
        const hasUsage = selectedResource && consumedQty && !isNaN(Number(consumedQty));

        if (!finalContent && !hasUsage) {
            toast({ title: 'Error', description: 'Please write a report or log resource usage', variant: 'destructive' }); return;
        }

        if (hasUsage) {
            // Visible HTML badge for display
            const badgeHtml = `<div class="bg-blue-50/80 border border-blue-200 text-blue-800 text-xs px-2.5 py-1.5 rounded-md inline-flex items-center gap-1.5 mb-2 font-medium"><span class="text-blue-500">📉</span> Consumed <b>${consumedQty}</b> ${selectedResource}</div>`;
            // Hidden machine-readable token — parsed by backend regex: /\[USAGE:({[^}]+})\]/g
            const usageToken = `<span style="display:none">[USAGE:{"resource":"${selectedResource}","qty":${consumedQty}}]</span>`;
            finalContent = badgeHtml + usageToken + `<br/>` + finalContent;
        }

        setIsSavingReport(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: finalContent })
            });
            const data = await res.json();
            if (data.ok) {
                setNewReportContent('');
                setConsumedQty('');
                setSelectedResource('');
                toast({ title: '✅ Report entry added' });
                fetchReportEntries();
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
        } finally {
            setIsSavingReport(false);
        }
    };

    const handleEditReport = async (entryId: number) => {
        const trimmed = editingContent.replace(/<[^>]*>/g, '').trim();
        if (!trimmed) return;
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}/reports/${entryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: editingContent })
            });
            const data = await res.json();
            if (data.ok) {
                setEditingEntryId(null);
                setEditingContent('');
                toast({ title: '✅ Report updated' });
                fetchReportEntries();
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
        }
    };

    const handleDeleteReport = async (entryId: number) => {
        if (!confirm('Are you sure you want to delete this report entry?')) return;
        try {
            const token = localStorage.getItem('hots_tokek');
            const res = await fetch(`${API_URL}/engine/assignment/${assignmentId}/tasks/${task.entity_id}/reports/${entryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                toast({ title: '✅ Report deleted' });
                fetchReportEntries();
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            {/* 1. Add new entry (Sticky Top) */}
            <div className="sticky top-0 z-10 bg-white border border-blue-200 shadow-sm p-3 rounded-lg mb-6 mt-2">
                <p className="text-xs font-semibold text-blue-800 mb-2">+ Add New Activity Report</p>
                {resourceKeys.length > 0 && (
                    task.subtasks && task.subtasks.length > 0 ? (
                        <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-[11px] font-medium text-slate-500 italic">🔒 As a parent task, resource consumption is locked. Resources are consumed via subtasks.</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-3 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Log Usage:</span>
                            <Select value={selectedResource} onValueChange={setSelectedResource}>
                                <SelectTrigger className="h-7 text-xs flex-1 bg-white">
                                    <SelectValue placeholder="Select Resource..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {resourceKeys.map(r => (
                                        <SelectItem key={r.key} value={r.key}>{r.key} (Total: {r.total.toLocaleString('id-ID')})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                placeholder="Qty"
                                className="h-7 text-xs w-[80px] bg-white"
                                value={consumedQty}
                                onChange={e => setConsumedQty(e.target.value)}
                            />
                        </div>
                    )
                )}
                <RichTextEditor
                    value={newReportContent}
                    onChange={setNewReportContent}
                    minHeight="60px"
                />
                <div className="flex justify-end mt-2">
                    <Button
                        size="sm"
                        onClick={handleAddReport}
                        disabled={isSavingReport || !newReportContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSavingReport ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        Post Report
                    </Button>
                </div>
            </div>

            {/* 2. Timeline Entries List */}
            {isLoadingReports ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <p className="text-xs">Loading reports...</p>
                </div>
            ) : reportEntries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    No report entries yet.
                </div>
            ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {(() => {
                        // Group by date
                        const grouped = reportEntries.reduce((acc, entry) => {
                            const d = new Date(entry.created_at).toLocaleDateString();
                            if (!acc[d]) acc[d] = [];
                            acc[d].push(entry);
                            return acc;
                        }, {} as Record<string, any[]>);

                        return Object.entries(grouped).map(([dateLabel, entries], gIdx) => (
                            <div key={dateLabel} className="relative">
                                {/* Date Header Badge */}
                                <div className="sticky top-[205px] z-10 flex items-center justify-center mb-6 py-2 bg-slate-50">
                                    <div className="bg-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ring-4 ring-slate-50">
                                        {dateLabel}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(entries as any[]).map(entry => (
                                        <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Timeline Dot */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                                <FileText className="w-4 h-4" />
                                            </div>

                                            {/* Card Content */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                {editingEntryId === entry.id ? (
                                                    <div className="space-y-2">
                                                        <RichTextEditor
                                                            value={editingContent}
                                                            onChange={setEditingContent}
                                                            minHeight="60px"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" variant="outline" onClick={() => setEditingEntryId(null)}>Cancel</Button>
                                                            <Button size="sm" onClick={() => handleEditReport(entry.id)}>
                                                                Save Changes
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            className="text-sm prose prose-sm max-w-none text-slate-700 break-words overflow-wrap-anywhere [&_img]:max-w-full [&_img]:h-auto"
                                                            dangerouslySetInnerHTML={{ __html: entry.content }}
                                                        />
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                &nbsp;·&nbsp;{entry.author_name}
                                                            </span>
                                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-slate-400 hover:text-blue-600"
                                                                    onClick={() => {
                                                                        setEditingEntryId(entry.id);
                                                                        setEditingContent(entry.content);
                                                                    }}
                                                                >
                                                                    <Pencil className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                                    onClick={() => handleDeleteReport(entry.id)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            )}
        </div>
    );
};
