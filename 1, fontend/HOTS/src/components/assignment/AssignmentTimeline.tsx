// components/assignment/AssignmentTimeline.tsx
// Unified timeline: manual posts + card reports merged & sorted by date
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Send, Clock, FileText, Activity, RefreshCw } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';

// ── Unified entry type ──────────────────────────────────────────────
interface UnifiedEntry {
    id: string;
    source: 'manual' | 'card_report' | 'smart_report';
    content: string;
    created_at: string;
    author_name: string;
    // manual-specific
    entry_type?: string;
    revision?: number;
    ticket_depth?: number;
    snapshot_meta_json?: any;
    images?: string;
    // card_report-specific
    task_title?: string;
    task_status?: string;
    depth?: number;
    updated_at?: string;
}

interface AssignmentTimelineProps {
    assignmentId: number | string;
    ticketId: string;
}

const statusEmoji = (s?: string) => {
    if (s === 'done') return '✅';
    if (s === 'in_progress') return '🔄';
    return '⬜';
};

const AssignmentTimeline: React.FC<AssignmentTimelineProps> = ({ assignmentId, ticketId }) => {
    const [entries, setEntries] = useState<UnifiedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState('<p></p>');
    const { toast } = useToast();
    const { sseSignals } = useAppSelector(state => state.tickets);

    useEffect(() => { fetchAll(); }, [assignmentId]);

    useEffect(() => {
        if (sseSignals?.assignment) {
            console.log('📡 [TIMELINE] SSE Signal received, refetching...');
            fetchAll();
        }
    }, [sseSignals?.assignment]);

    // ── Fetch both sources & merge ──────────────────────────────────
    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('tokek');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const [timelineRes, reportsRes] = await Promise.allSettled([
                axios.get(`${API_URL}/engine/assignment/${assignmentId}/timeline`, { headers }),
                axios.get(`${API_URL}/engine/report/card-reports/${assignmentId}`, { headers })
            ]);

            // Manual timeline posts
            const manualPosts: UnifiedEntry[] =
                (timelineRes.status === 'fulfilled' ? timelineRes.value.data.updates || [] : [])
                    .map((u: any) => ({
                        id: `manual_${u.entity_id}`,
                        source: u.entry_type === 'smart_report' ? 'smart_report' as const : 'manual' as const,
                        content: u.content,
                        created_at: u.created_at,
                        author_name: u.user_name || 'User',
                        entry_type: u.entry_type,
                        revision: u.revision,
                        ticket_depth: u.ticket_depth,
                        snapshot_meta_json: u.snapshot_meta_json,
                        images: u.images,
                    }));

            // Card report entries
            const cardReports: UnifiedEntry[] =
                (reportsRes.status === 'fulfilled' ? reportsRes.value.data.reports || [] : [])
                    .map((r: any) => ({
                        id: `report_${r.id}`,
                        source: 'card_report' as const,
                        content: r.content,
                        created_at: r.created_at,
                        author_name: r.author_name || 'User',
                        task_title: r.task_title,
                        task_status: r.task_status,
                        depth: r.depth,
                        updated_at: r.updated_at,
                    }));

            // Merge & sort newest first
            const merged = [...manualPosts, ...cardReports]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setEntries(merged);
        } catch (e) {
            console.error('[TIMELINE] fetchAll error:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Generate Status Report ──────────────────────────────────────
    const handleGenerateReport = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');
            const res = await axios.post(
                `${API_URL}/engine/report/suggest`,
                { ticket_id: ticketId, assignment_id: assignmentId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.ok) {
                await axios.post(
                    `${API_URL}/engine/assignment/${assignmentId}/timeline`,
                    { content: res.data.narrative_text },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast({ title: '✅ Report Generated', description: 'Smart status report posted to timeline.' });
                fetchAll();
            }
        } catch (error: any) {
            console.error('📊 [GENERATE_REPORT] Error:', error.response?.data || error.message);
            toast({
                title: 'Error generating report',
                description: error.response?.data?.error || 'Failed to generate smart report',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Post manual update ──────────────────────────────────────────
    const handleSubmit = async () => {
        if (!content || content.replace(/<[^>]*>/g, '').trim() === '') {
            toast({ title: 'Error', description: 'Please enter some content', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/timeline`,
                { content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Success', description: 'Update added to timeline' });
            setContent('<p></p>');
            fetchAll();
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.error || 'Failed to add update', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading state ───────────────────────────────────────────────
    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>Progress Timeline</CardTitle></CardHeader>
                <CardContent><p className="text-gray-500">Loading...</p></CardContent>
            </Card>
        );
    }

    // ── Render ───────────────────────────────────────────────────────
    return (
        <Card>
            <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>Manual updates + card reports, unified by date</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Editor + Action Buttons (Sticky Top) */}
                <div className="sticky top-0 z-20 bg-white border border-blue-200 shadow-sm p-3 rounded-lg mb-6 mt-2">
                    <RichTextEditor value={content} onChange={setContent} minHeight="80px" />
                    <div className="mt-3 flex justify-between items-center gap-2">
                        <p className="text-[10px] text-muted-foreground italic flex-1">
                            💡 Generate Status Report summarises all card reports into one narrative post.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleGenerateReport}
                                disabled={submitting}
                                variant="outline"
                                size="sm"
                                title="Compiles all card reports into a structured summary narrative and posts it to the timeline"
                            >
                                <FileText className="w-4 h-4 mr-1" />
                                Generate Status Report
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Send className="w-4 h-4 mr-1" />
                                {submitting ? 'Posting...' : 'Post Update'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Unified Timeline List */}
                <div className="space-y-3 relative z-0">
                    {entries.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No updates yet. Post one or write a card report!</p>
                    ) : (
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {(() => {
                                // Group by date
                                const grouped = entries.reduce((acc, entry) => {
                                    const d = new Date(entry.created_at).toLocaleDateString();
                                    if (!acc[d]) acc[d] = [];
                                    acc[d].push(entry);
                                    return acc;
                                }, {} as Record<string, UnifiedEntry[]>);

                                return Object.entries(grouped).map(([dateLabel, groupEntries], gIdx) => (
                                    <div key={dateLabel} className="relative">
                                        {/* Date Header Badge */}
                                        <div className="sticky top-[180px] z-10 flex items-center justify-center mb-6 mt-4 py-2 bg-white">
                                            <div className="bg-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ring-4 ring-white">
                                                {dateLabel}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {(groupEntries as UnifiedEntry[]).map(entry => (
                                                <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                                    {/* Timeline Dot (Avatar) */}
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 bg-white z-10 relative">
                                                        <Avatar className="w-8 h-8 flex-shrink-0">
                                                            <AvatarFallback className={
                                                                entry.source === 'card_report'
                                                                    ? 'bg-emerald-500 text-white text-[10px]'
                                                                    : entry.source === 'smart_report'
                                                                        ? 'bg-purple-500 text-white text-[10px]'
                                                                        : 'bg-blue-500 text-white text-[10px]'
                                                            }>
                                                                {entry.source === 'card_report'
                                                                    ? <FileText className="w-4 h-4" />
                                                                    : entry.source === 'smart_report'
                                                                        ? <Activity className="w-4 h-4" />
                                                                        : (entry.author_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </div>

                                                    {/* Content card */}
                                                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${entry.source === 'card_report'
                                                        ? 'border-emerald-200 bg-emerald-50/50'
                                                        : entry.source === 'smart_report'
                                                            ? 'border-purple-200 bg-purple-50/50'
                                                            : 'bg-white'
                                                        }`}>

                                                        {/* Header: name, badges, edit marker */}
                                                        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/5 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-sm text-gray-900">
                                                                    {entry.author_name}
                                                                </span>
                                                                {entry.source === 'card_report' && (
                                                                    <Badge className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 gap-0.5 shadow-none border-0">
                                                                        {statusEmoji(entry.task_status)} Card Report
                                                                    </Badge>
                                                                )}
                                                                {entry.source === 'smart_report' && (
                                                                    <Badge className="text-[9px] h-4 px-1.5 bg-purple-100 text-purple-700 shadow-none border-0">
                                                                        Smart Report
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {Number(entry.revision) > 0 && (
                                                                <span className="text-[10px] text-blue-500 italic">edited</span>
                                                            )}
                                                        </div>

                                                        {/* Card report: show task title row */}
                                                        {entry.source === 'card_report' && entry.task_title && (
                                                            <div className="text-xs text-emerald-700 mb-2 flex items-center gap-1 bg-white p-1.5 rounded border border-emerald-100">
                                                                <span className="font-medium">📌 {entry.task_title}</span>
                                                                {entry.depth && entry.depth > 1 && (
                                                                    <Badge className="text-[9px] h-3.5 px-1 bg-indigo-100 text-indigo-700 shadow-none border-0 absolute right-4">L{entry.depth}</Badge>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Content body */}
                                                        <div
                                                            className="prose prose-sm max-w-none text-gray-800 text-sm"
                                                            dangerouslySetInnerHTML={{ __html: entry.content }}
                                                        />

                                                        {/* Footer: Date row */}
                                                        <div className="flex items-center gap-1 mt-3 pt-2 text-[11px] text-gray-400 border-t border-black/5">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            {entry.updated_at && <span className="italic ml-1">· edited</span>}
                                                        </div>
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
            </CardContent>
        </Card>
    );
};

export default AssignmentTimeline;
