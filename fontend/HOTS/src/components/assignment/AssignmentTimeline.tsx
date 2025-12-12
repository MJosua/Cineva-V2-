// components/assignment/AssignmentTimeline.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Send, Clock, X, ImageIcon, Loader2 } from 'lucide-react';

interface TimelineUpdate {
    entity_id: string;
    content: string;
    images?: string;
    created_at: string;
    created_by: number;
    user_name: string;
}

interface AssignmentTimelineProps {
    assignmentId: number | string;
}

interface UploadedImage {
    url: string;
    upload_id?: number;
}

const AssignmentTimeline: React.FC<AssignmentTimelineProps> = ({ assignmentId }) => {
    const [updates, setUpdates] = useState<TimelineUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<UploadedImage[]>([]);
    const { toast } = useToast();

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            const blob = items[i].getAsFile();
                            if (blob) {
                                handleImageUpload(blob);
                                event.preventDefault();
                                return true;
                            }
                        }
                    }
                }
                return false;
            },
        },
    });

    useEffect(() => {
        fetchTimeline();
    }, [assignmentId]);

    const fetchTimeline = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/assignment/${assignmentId}/timeline`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setUpdates(response.data.updates || []);
        } catch (error) {
            console.error('Error fetching timeline:', error);
            toast({
                title: 'Error',
                description: 'Failed to load timeline',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        try {
            const token = localStorage.getItem('tokek');
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(
                `${API_URL}/hots_ticket/upload/files/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const results = res.data.data || [];
            if (results.length > 0) {
                const uploadedUrl = `${API_URL}${results[0].fileUrl}`;
                setPendingImages(prev => [...prev, {
                    url: uploadedUrl,
                    upload_id: results[0].upload_id
                }]);
                toast({ title: 'Image uploaded', description: 'Image ready to post' });
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setPendingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!editor) return;

        const content = editor.getHTML();
        if ((!content || content.trim() === '<p></p>' || content.trim() === '') && pendingImages.length === 0) {
            toast({
                title: 'Error',
                description: 'Please enter some content or add an image',
                variant: 'destructive'
            });
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('tokek');
            const imageUrls = pendingImages.map(img => img.url);

            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/timeline`,
                {
                    content: content || '<p></p>',
                    images: imageUrls.length > 0 ? imageUrls : undefined
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Update added successfully'
            });

            // Clear editor and images
            editor.commands.setContent('');
            setPendingImages([]);

            // Refresh timeline
            fetchTimeline();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to add update',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Progress Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>Track your work progress and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Editor for new update */}
                <div className="border rounded-lg bg-white">
                    <EditorContent
                        editor={editor}
                        placeholder="Add your progress update..."
                    />

                    {/* Image preview section */}
                    {(pendingImages.length > 0 || uploading) && (
                        <div className="border-t p-2 flex flex-wrap gap-2">
                            {pendingImages.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img.url}
                                        alt={`Pending ${index}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {uploading && (
                                <div className="w-16 h-16 flex items-center justify-center border rounded bg-gray-100">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="border-t p-2 flex justify-between items-center bg-gray-50">
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" />
                            Paste images (Ctrl+V)
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || uploading}
                            size="sm"
                        >
                            <Send className="w-4 h-4 mr-1" />
                            {submitting ? 'Posting...' : 'Post Update'}
                        </Button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                    {updates.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                            No updates yet. Be the first to add one!
                        </p>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                            {updates.map((update, index) => (
                                <div key={update.entity_id} className="relative flex gap-4 pb-6">
                                    {/* Avatar */}
                                    <Avatar className="relative z-10 border-2 border-white">
                                        <AvatarFallback className="bg-blue-500 text-white">
                                            {update.user_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-900">{update.user_name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(update.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: update.content }}
                                        />



                                        {update.images && JSON.parse(update.images).length > 0 && (
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {JSON.parse(update.images).map((img: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        src={img}
                                                        alt="Attachment"
                                                        className="rounded border"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AssignmentTimeline;
