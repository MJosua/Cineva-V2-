// components/assignment/AssignmentTimeline.tsx
// Unified timeline: manual posts + card reports merged & sorted by date
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor, RichTextEditorRef } from '@/components/ui/RichTextEditor';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Send, Clock, FileText, Activity, RefreshCw, Paperclip, X, File as FileIcon, FilePieChart, Archive, FileDown, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import ImagePreviewModal from '@/components/modals/ImagePreviewModal';

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
    attached_files?: { id: number, name: string, url: string }[];
    // card_report-specific
    task_title?: string;
    task_status?: string;
    depth?: number;
    updated_at?: string;
}

interface AssignmentTimelineProps {
    assignmentId: number | string;
    ticketId: string;
    readOnly?: boolean;
}

const statusEmoji = (s?: string) => {
    if (s === 'done') return '✅';
    if (s === 'in_progress') return '🔄';
    return '⬜';
};

const AssignmentTimeline: React.FC<AssignmentTimelineProps> = ({ assignmentId, ticketId, readOnly = false }) => {
    const [entries, setEntries] = useState<UnifiedEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState('<p></p>');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<{ temp_id: number, name: string, url: string }[]>([]);
    const [uploadingFile, setUploadingFile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<RichTextEditorRef>(null);
    const [uploadingAttachments, setUploadingAttachments] = useState<{ tempKey: string, name: string }[]>([]);
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
        const token = localStorage.getItem('hots_tokek');
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
                        attached_files: u.attached_files || [],
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

    // ── File Upload Handlers ────────────────────────────────────────
    const handleFileUploadRequest = async (file: File) => {
        if (file.size > 3.6 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Maximum file size is 3.6MB',
                variant: 'destructive',
            });
            throw new Error("File too large");
        }

        const token = localStorage.getItem('hots_tokek');
        const formData = new FormData();
        formData.append('file', file);

        const res = await axios.post(`${API_URL}/engine/upload-temp`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data;
    };

    const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isImage = file.type.startsWith('image/');
            const tempKey = `uploading_${Date.now()}_${i}`;

            // Show loading badge for non-image files
            if (!isImage) {
                setUploadingAttachments(prev => [...prev, { tempKey, name: file.name }]);
            }

            try {
                const data = await handleFileUploadRequest(file);

                if (data.success || data.ok) {
                    const uploadedFile = data.data?.[0] || data;
                    if (isImage) {
                        // Insert image directly into editor via ref
                        if (editorRef.current) {
                            editorRef.current.insertImage(uploadedFile.url);
                        }
                    } else {
                        // Add as file badge
                        setUploadedFiles(prev => [...prev, {
                            temp_id: uploadedFile.upload_id,
                            name: uploadedFile.original_name || uploadedFile.name || file.name,
                            url: uploadedFile.url
                        }]);
                    }
                }
            } catch (err: any) {
                console.error('Timeline attach error:', err);
                toast({
                    title: 'Upload failed',
                    description: `${file.name}: ${err.response?.data?.message || err.message || 'Failed to upload'}`,
                    variant: 'destructive'
                });
            } finally {
                setUploadingAttachments(prev => prev.filter(f => f.tempKey !== tempKey));
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        const data = await handleFileUploadRequest(file);
        if (data.success || data.ok) {
            const uploadedFile = data.data?.[0] || data;
            return uploadedFile.url;
        }
        throw new Error("Failed to upload image");
    };

    const handleFileUpload = async (file: File): Promise<void> => {
        const data = await handleFileUploadRequest(file);
        if (data.success || data.ok) {
            const uploadedFile = data.data?.[0] || data;
            setUploadedFiles(prev => [...prev, {
                temp_id: uploadedFile.upload_id,
                name: uploadedFile.original_name || uploadedFile.name || file.name,
                url: uploadedFile.url
            }]);
        } else {
            throw new Error("Failed to upload file");
        }
    };

    const removeAttachedFile = (tempId: number) => {
        setUploadedFiles(prev => prev.filter(f => f.temp_id !== tempId));
    };

    // ── Generate Status Report ──────────────────────────────────────
    const handleGenerateReport = async () => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('hots_tokek');
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
        if (!content || (content.replace(/<[^>]*>/g, '').trim() === '' && !content.includes('<img') && uploadedFiles.length === 0)) {
            toast({ title: 'Error', description: 'Please enter some content or attach a file', variant: 'destructive' });
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/timeline`,
                {
                    content,
                    temp_file_ids: uploadedFiles.map(f => f.temp_id)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Success', description: 'Update added to timeline' });
            setContent('<p></p>');
            setUploadedFiles([]);
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
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    const handleContentClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            const imgSrc = (target as HTMLImageElement).src;
            setPreviewImage(imgSrc);
        }
    };

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            {!readOnly && (
                <div className="mb-4">
                    <h2 className="text-lg font-bold">Progress Timeline</h2>
                    <p className="text-xs text-muted-foreground">Manual updates + card reports, unified by date</p>
                </div>
            )}
            <div className="space-y-4">
                {!readOnly && (
                    <div className="sticky top-0 z-20 bg-white border border-blue-200 shadow-sm p-3 rounded-lg mb-6 mt-2">
                        <RichTextEditor
                            ref={editorRef}
                            value={content}
                            onChange={setContent}
                            minHeight="80px"
                            onImageUpload={handleImageUpload}
                            onFileUpload={handleFileUpload}
                        />

                        {(uploadedFiles.length > 0 || uploadingAttachments.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {uploadingAttachments.map(f => (
                                    <Badge key={f.tempKey} variant="outline" className="flex items-center gap-1.5 py-1 px-2 border-slate-300 bg-slate-50 font-normal animate-pulse">
                                        <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                                        <span className="text-xs truncate max-w-[200px]">{f.name}</span>
                                    </Badge>
                                ))}
                                {uploadedFiles.map(f => {
                                    const isExcel = f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx');
                                    const isZip = f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.rar') || f.name.toLowerCase().endsWith('.7z');
                                    const isPdf = f.name.toLowerCase().endsWith('.pdf');

                                    return (
                                        <Badge key={f.temp_id} variant="outline" className="flex items-center gap-1.5 py-1 px-2 border-slate-300 bg-slate-50 font-normal">
                                            {isExcel ? (
                                                <FilePieChart className="w-3.5 h-3.5 text-green-600" />
                                            ) : isZip ? (
                                                <Archive className="w-3.5 h-3.5 text-amber-600" />
                                            ) : isPdf ? (
                                                <FileText className="w-3.5 h-3.5 text-red-500" />
                                            ) : (
                                                <FileIcon className="w-3.5 h-3.5 text-slate-500" />
                                            )}
                                            <span className="text-xs truncate max-w-[200px]" title={f.name}>{f.name}</span>
                                            <div className="flex items-center gap-0.5 ml-1">
                                                <a
                                                    href={f.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-slate-400 hover:text-blue-500 rounded-full hover:bg-slate-200 p-0.5 transition-colors"
                                                    title="View/Download"
                                                >
                                                    <FileDown className="w-3 h-3" />
                                                </a>
                                                <button onClick={() => removeAttachedFile(f.temp_id)} className="text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 p-0.5 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-3 flex gap-2">
                            <p className="text-[10px] text-muted-foreground italic hidden sm:flex items-center flex-1">
                                💡 Generate Status Report summarises all card reports into one narrative post.
                            </p>
                            <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between">
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileAttach}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={submitting || uploadingFile}
                                    title="Attach File"
                                    type="button"
                                    className="text-slate-600 relative"
                                >
                                    {uploadingFile ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Paperclip className="w-4 h-4 mr-1.5" />}
                                    Attach
                                </Button>
                                <Button
                                    onClick={handleGenerateReport}
                                    disabled={submitting}
                                    variant="outline"
                                    size="sm"
                                    title="Compiles all card reports into a structured summary narrative and posts it to the timeline"
                                    className="hidden md:flex"
                                >
                                    <FileText className="w-4 h-4 mr-1" />
                                    Generate Report
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send className="w-4 h-4 mr-1.5" />
                                    {submitting ? 'Posting...' : 'Post Update'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unified Timeline List */}
                <div className="space-y-3 relative z-0">
                    {entries.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No updates yet. Post one or write a card report!</p>
                    ) : (
                        <div className={`space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px ${!readOnly ? 'md:before:mx-auto md:before:translate-x-0' : ''} before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent`}>
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
                                        <div className={`sticky ${readOnly ? 'top-0' : 'top-[180px]'} z-10 flex items-center justify-center mb-6 mt-4 py-2 bg-white`}>
                                            <div className="bg-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ring-4 ring-white">
                                                {dateLabel}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {(groupEntries as UnifiedEntry[]).map(entry => (
                                                <div key={entry.id} className={`relative flex items-center justify-between ${!readOnly ? 'md:justify-normal md:odd:flex-row-reverse' : 'justify-normal'} group is-active`}>

                                                    {/* Timeline Dot (Avatar) */}
                                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow shrink-0 ${!readOnly ? 'md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2' : ''} bg-white z-10 relative`}>
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
                                                    <div className={`w-[calc(100%-4rem)] ${!readOnly ? 'md:w-[calc(50%-2.5rem)]' : ''} border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${entry.source === 'card_report'
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
                                                            className="prose prose-sm max-w-none text-gray-800 text-sm cursor-zoom-in timeline-content break-words overflow-wrap-anywhere
                                                                       [&_img]:rounded-md [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-sm [&_img]:max-h-60 [&_img]:max-w-full [&_img]:object-contain [&_img]:cursor-zoom-in hover:[&_img]:opacity-90 transition-opacity"
                                                            onClick={handleContentClick}
                                                            dangerouslySetInnerHTML={{ __html: entry.content }}
                                                        />

                                                        {/* Footer: Date row */}
                                                        {entry.attached_files && entry.attached_files.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-black/5 flex flex-wrap gap-2">
                                                                {entry.attached_files.map(f => {
                                                                    const isExcel = f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx');
                                                                    const isZip = f.name.toLowerCase().endsWith('.zip') || f.name.toLowerCase().endsWith('.rar') || f.name.toLowerCase().endsWith('.7z');
                                                                    const isPdf = f.name.toLowerCase().endsWith('.pdf');

                                                                    return (
                                                                        <a
                                                                            key={f.id}
                                                                            href={f.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-1.5 py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm"
                                                                        >
                                                                            {isExcel ? (
                                                                                <FilePieChart className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                                            ) : isZip ? (
                                                                                <Archive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                            ) : isPdf ? (
                                                                                <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                                                            ) : (
                                                                                <FileIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                            )}
                                                                            <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
                                                                            <FileDown className="w-3 h-3 ml-1 text-blue-400" />
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
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
            </div>

            <ImagePreviewModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage || ''}
            />
        </div>
    );
};

export default AssignmentTimeline;
