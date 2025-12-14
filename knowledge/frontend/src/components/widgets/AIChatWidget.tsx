import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';
import { API_URL } from '@/config/sourceConfig';
import axios from 'axios';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AIChatWidget: React.FC<WidgetProps> = ({ data }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! I\'m HOTS Copilot. Ask me anything about tickets, services, or how to use the system!',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.post(
                `${API_URL}/ai/chat`,
                { message: input },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.data.reply || 'I couldn\'t process that. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            // Fallback for demo/mock mode
            const mockResponses: Record<string, string> = {
                'ticket': 'To create a ticket, go to **Service Catalog** and select the service you need.',
                'approve': 'Check your **Task List** for pending approvals. Click Approve or Reject.',
                'status': 'You can track your tickets in **My Tickets** page.',
                'help': 'I can help with: tickets, approvals, services, and system status.',
            };

            const keyword = Object.keys(mockResponses).find(k => input.toLowerCase().includes(k));
            const fallbackReply = keyword
                ? mockResponses[keyword]
                : `I'm currently in offline mode. Here's a tip: Visit the **FAQ** section above for common questions!`;

            const assistantMessage: Message = {
                role: 'assistant',
                content: fallbackReply,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card className="h-[500px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    HOTS Copilot (AI Assistant)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                {msg.role === 'user' ? (
                                    <User className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <Bot className="w-4 h-4 text-purple-600" />
                                )}
                            </div>
                            <div className={`max-w-[75%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-3 flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask anything..."
                        disabled={loading}
                        className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={loading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AIChatWidget;
