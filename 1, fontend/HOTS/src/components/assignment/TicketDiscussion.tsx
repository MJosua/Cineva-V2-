import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppSelector';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';

interface TicketDiscussionProps {
    ticketId: string;
    assignmentId?: number; // Added assignmentId to fetch active users
    triggerRefresh?: boolean;
}

const TicketDiscussion: React.FC<TicketDiscussionProps> = ({ ticketId, assignmentId, triggerRefresh = false }) => {
    const { user } = useAppSelector(state => state.auth);
    const { sseSignals } = useAppSelector(state => state.tickets);
    const { toast } = useToast();

    const [comment, setComment] = useState("");
    const [data_comment, setData_comment] = useState<any[]>([]);
    const [data_comment_count, setData_comment_count] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [url, setURL] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [mentionUsers, setMentionUsers] = useState<SuggestionDataItem[]>([]);

    const commentContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Group by comment_id to combine text and multiple attachments
    const processedMessages = data_comment?.reduce((acc, msg) => {
        const id = msg.comment_id;
        if (!acc[id]) {
            acc[id] = {
                ...msg,
                attachments: msg.attachment_url ? [msg.attachment_url] : []
            };
        } else if (msg.attachment_url) {
            acc[id].attachments.push(msg.attachment_url);
        }
        return acc;
    }, {} as Record<string, any>);

    // 2. Group by date for the UI separators
    const groupedMessages = Object.values(processedMessages).reduce((groups, msg: any) => {
        const date = msg.date_created;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(msg);
        return groups;
    }, {} as Record<string, any[]>);

    const scrollToBottom = () => {
        if (commentContainerRef.current) {
            commentContainerRef.current.scrollTop = commentContainerRef.current.scrollHeight;
        }
    };

    const adjustHeight = () => {
        // MentionsInput handles its own resizing, but we keep this for consistency if needed later
    };

    useEffect(() => {
        adjustHeight();
    }, [comment]);

    useEffect(() => {
        scrollToBottom();
    }, [data_comment]);

    const getData_comment = () => {
        if (!ticketId) return;
        axios.get(`${API_URL}/hots_ticket/comment/${ticketId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("tokek")}`,
            },
        })
            .then((res) => {
                setData_comment(res.data.comment_list || []);
                setData_comment_count(res.data.comment_count || 0);
                setTimeout(scrollToBottom, 100);
            })
            .catch((err) => {
                console.error("Error fetching comments:", err);
            });
    };

    useEffect(() => {
        getData_comment();
    }, [ticketId, triggerRefresh]);

    useEffect(() => {
        if (sseSignals?.comment) {
            console.log('📡 SSE Signal: Refreshing Comments in TicketDiscussion');
            getData_comment();
        }
    }, [sseSignals?.comment]);

    const handleComment = () => {
        if ((!comment || comment.trim() === '') && !image) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append('comment', comment.trim());
        if (image) formData.append('file', image);

        axios.post(
            `${API_URL}/hots_ticket/comment/${ticketId}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("tokek")}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        ).then(() => {
            setIsLoading(false);
            setComment('');
            setImage(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            getData_comment();
        }).catch(() => {
            setIsLoading(false);
            toast({
                title: 'Error',
                description: 'Error when uploading comment.',
                variant: 'destructive',
                duration: 3000,
            });
        });
    };

    // Fetch Active Users for Mentions
    useEffect(() => {
        if (!assignmentId) return;

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('tokek');
                const response = await axios.get(
                    `${API_URL}/engine/assignment/${assignmentId}/active-users`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.ok) {
                    const mappedUsers = response.data.users.map((u: any) => ({
                        id: u.user_id,
                        display: u.name
                    }));
                    setMentionUsers(mappedUsers);
                }
            } catch (error) {
                console.error("Failed to fetch active users for mentions:", error);
            }
        };

        fetchUsers();
    }, [assignmentId]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // react-mentions requires catching the enter key this way to prevent form submission when selecting a mention
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleComment();
        }
    };

    const handlePaste = (event: React.ClipboardEvent) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    setImage(blob);
                    const imgURL = URL.createObjectURL(blob);
                    setImagePreview(imgURL);
                }
            }
        }
    };

    const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border">
            <div
                ref={commentContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[500px]"
            >
                {groupedMessages && Object.keys(groupedMessages).length > 0 ? (
                    Object.entries(groupedMessages).map(([date, messages]) => (
                        <div key={date} className="mb-6">
                            <div className="text-center text-xs text-muted-foreground mb-4 font-medium px-2 py-1 bg-gray-50 rounded-full w-fit mx-auto border border-gray-100">
                                {date}
                            </div>

                            {(messages as any[]).map((msg) => (
                                <div key={msg.comment_id} className={`flex flex-col mb-4 ${msg.sender_id === user?.user_id ? 'items-end' : 'items-start'}`}>
                                    {/* Unified Message Bubble */}
                                    <div
                                        className={`max-w-[85%] rounded-2xl shadow-sm border overflow-hidden transition-all ${msg.sender_id === user?.user_id
                                            ? 'bg-primary text-primary-foreground border-primary rounded-tr-none'
                                            : 'bg-white text-foreground border-gray-200 rounded-tl-none'
                                            }`}
                                    >
                                        {/* Sender Name (if not user) */}
                                        {msg.sender_id !== user?.user_id && (
                                            <div className="px-3 pt-2">
                                                <p className="text-[11px] font-bold text-primary tracking-tight uppercase">{msg.sender}</p>
                                            </div>
                                        )}

                                        {/* Attachment(s) Section */}
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="p-1.5 flex flex-col gap-1.5">
                                                {msg.attachments.map((url: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        onClick={() => {
                                                            setURL(`${API_URL}${url}`);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="rounded-xl border border-black/5 max-h-64 w-full object-cover cursor-zoom-in hover:brightness-95 transition-all"
                                                        src={`${API_URL}${url}`}
                                                        alt="Attachment"
                                                        loading="lazy"
                                                    />
                                                ))}
                                                {/* Line separator if there is text below */}
                                                {msg.text && (
                                                    <div className={`mx-1.5 border-t ${msg.sender_id === user?.user_id ? 'border-primary-foreground/20' : 'border-gray-100'} my-1`}></div>
                                                )}
                                            </div>
                                        )}

                                        {/* Text Message Section */}
                                        {msg.text && (
                                            <div className="px-3 pb-2 pt-1.5">
                                                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                            </div>
                                        )}

                                        {/* Timestamp Footer */}
                                        <div className={`px-3 pb-1.5 pt-0.5 flex items-center gap-1 justify-end opacity-60`}>
                                            <span className="text-[9px] font-medium uppercase tracking-widest">{msg.time_created}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Send className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-muted-foreground text-xs font-medium">No messages yet...</p>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none">
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                            src={url}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Input Area */}
            <div className="border-t bg-gray-50 p-3 relative">
                {imagePreview && (
                    <div className="mb-2 relative inline-block">
                        <button
                            type="button"
                            onClick={() => {
                                setImage(null);
                                setImagePreview(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="absolute -top-2 -right-2 bg-white rounded-full text-foreground hover:text-red-500 shadow z-10 p-[2px]"
                        >
                            <X size={16} />
                        </button>
                        <img
                            src={imagePreview}
                            alt="Uploaded Preview"
                            className="rounded shadow-sm h-[60px] w-[60px] object-cover border"
                        />
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleComment();
                    }}
                    className="flex items-end gap-2"
                >
                    <div className="relative flex-1 bg-white border rounded-md shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                        <MentionsInput
                            placeholder="Type your message... use @ to mention (Shift+Enter for newline)"
                            value={comment}
                            onChange={(e, newValue) => setComment(newValue)}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className="mentions-input-container w-full px-3 py-2.5 min-h-[40px] max-h-[120px] text-sm overflow-y-auto"
                            style={{
                                control: { fontSize: '14px', lineHeight: '1.5' },
                                input: { paddingRight: '40px', outline: 'none', border: 'none' },
                                suggestions: { list: { backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '6px', fontSize: '14px', zIndex: 50 }, item: { padding: '5px 15px', borderBottom: '1px solid rgba(0,0,0,0.05)' } }
                            }}
                        >
                            <Mention
                                trigger="@"
                                data={mentionUsers}
                                displayTransform={(id, display) => `@${display}`}
                                style={{ backgroundColor: '#e2e8f0', borderRadius: '3px', padding: '1px' }}
                            />
                        </MentionsInput>
                        <div className="absolute right-1 bottom-1 flex items-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleImage}
                                accept="image/*"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Attach image"
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || (!comment.trim() && !image)}
                        size="icon"
                        className="h-10 w-10 shrink-0 rounded-full"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default TicketDiscussion;
