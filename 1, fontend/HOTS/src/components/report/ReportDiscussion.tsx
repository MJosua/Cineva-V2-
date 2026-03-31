import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';

interface Note {
    id: number;
    content: string;
    created_at: string;
    firstname: string;
    lastname: string;
    profile_picture?: string;
}

interface ReportDiscussionProps {
    reportKey?: string;
    title?: string;
    description?: string;
}

const ReportDiscussion: React.FC<ReportDiscussionProps> = ({ 
    reportKey = 'searates_analytics_main',
    title = 'Report Notes & Discussion',
    description = 'Versatile notes for this report view'
}) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const hots_token = localStorage.getItem('hots_tokek');
    const scrollRef = useRef<HTMLDivElement>(null);

    const headers = {
        'Authorization': `Bearer ${hots_token}`
    };

    const fetchNotes = async () => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${API_URL}/hotsdashboard/analytics/notes?reportKey=${reportKey}`, { headers });
            if (res.data.success) {
                setNotes(res.data.results || []);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast({
                title: "Error",
                description: "Failed to load discussion notes",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!newNote.trim()) return;
        
        try {
            setIsSending(true);
            const res = await axios.post(`${API_URL}/hotsdashboard/analytics/notes`, {
                reportKey,
                content: newNote.trim()
            }, { headers });
            
            if (res.data.success) {
                setNewNote('');
                fetchNotes();
                toast({
                    title: "Success",
                    description: "Note added successfully",
                });
            }
        } catch (error) {
            console.error("Error saving note:", error);
            toast({
                title: "Error",
                description: "Failed to save note",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [reportKey]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [notes]);

    return (
        <Card className="flex flex-col h-full overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm min-h-[500px]">
            <CardHeader className="bg-slate-50/50 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                            {title}
                        </CardTitle>
                        <CardDescription className="text-xs">{description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchNotes} disabled={isLoading} className="h-8 w-8">
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-slate-400 space-y-2">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm">No notes yet. Start the discussion!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {notes.map((note) => (
                                <div key={note.id} className="flex gap-3 items-start group">
                                    <Avatar className="h-9 w-9 border shadow-sm">
                                        <AvatarImage src={note.profile_picture} />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600">
                                            {note.firstname?.[0]}{note.lastname?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800">
                                                {note.firstname} {note.lastname}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 shadow-sm border border-slate-100 group-hover:bg-white transition-colors whitespace-pre-wrap">
                                            {note.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                    )}
                </ScrollArea>
                
                <div className="p-4 border-t bg-slate-50/30">
                    <div className="relative">
                        <Textarea 
                            placeholder="Write a note..." 
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="min-h-[80px] pr-12 resize-none bg-white border-slate-200 focus:border-indigo-300 focus:ring-indigo-100 text-sm"
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={isSending || !newNote.trim()}
                            size="icon"
                            className="absolute bottom-2 right-2 h-8 w-8 bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ReportDiscussion;
