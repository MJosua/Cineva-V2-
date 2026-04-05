import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Loader2, X, FileText, MessageCircle, ClipboardCheck, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useNavigate } from 'react-router-dom';

interface Notification {
    notification_id: number;
    type: string;
    title: string;
    message: string;
    data_payload: {
        url?: string;
        ticket_id?: number | string;
        ticketId?: number | string;
        status?: 'loading' | 'success' | 'error';
    } | null;
    is_read: number;
    created_at: string;
}

interface GroupedNotifications {
    label: string;
    notifications: Notification[];
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(() => {
        const cached = localStorage.getItem('notification_unread_count');
        return cached ? parseInt(cached, 10) : 0;
    });
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const isFetchingUnread = React.useRef(false);
    const lastErrorTime = React.useRef(0);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setNotifications(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (isFetchingUnread.current) return;
        
        // Back-off: don't retry for 10 seconds after a 5xx error
        if (Date.now() - lastErrorTime.current < 10000) return;

        isFetchingUnread.current = true;
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(`${API_URL}/hots_notifications/unread_count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                const count = response.data.unread_count || 0;
                setUnreadCount(count);
                localStorage.setItem('notification_unread_count', count.toString());
                lastErrorTime.current = 0; // Reset on success
            }
        } catch (error: any) {
            console.error('Failed to fetch unread count:', error);
            if (error.response?.status >= 500) {
                lastErrorTime.current = Date.now();
            }
        } finally {
            isFetchingUnread.current = false;
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        // Set up interval to check for new notifications
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    // Listen for SSE events to update notifications in real-time
    useEffect(() => {
        const handleSSE = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                // Refresh count when we get a notification-related event
                if (['approval_needed', 'ticket_approved', 'ticket_rejected', 'new_comment', 'task_assigned', 'doc_generation_complete'].includes(data.type)) {
                    fetchUnreadCount();
                    if (isOpen) {
                        fetchNotifications();
                    }
                }
            } catch (e) {
                // Not JSON, ignore
            }
        };

        const eventSource = (window as any).__sseConnection;
        if (eventSource) {
            eventSource.onmessage = handleSSE;
        }
    }, [isOpen, fetchNotifications, fetchUnreadCount]);

    const markAsRead = async (notificationId: number) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.post(`${API_URL}/hots_notifications/read/${notificationId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev =>
                prev.map(n => n.notification_id === notificationId ? { ...n, is_read: 1 } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            await axios.post(`${API_URL}/hots_notifications/read_all`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead(notification.notification_id);
        }

        let targetUrl = notification.data_payload?.url;

        // Fallback or explicit construction if URL is missing or incorrect
        if (!targetUrl || targetUrl.startsWith('/ticket/')) {
            const ticketId = notification.data_payload?.ticket_id || notification.data_payload?.ticketId;
            if (['approval_needed', 'ticket_approved', 'ticket_rejected', 'new_comment'].includes(notification.type) && ticketId) {
                targetUrl = `/ticket/${ticketId}`;
            } else if (['task_assigned', "assignment_update", 'task_moved'].includes(notification.type) && ticketId) {
                targetUrl = `/assignment/${ticketId}`;
            }
        }

        if (targetUrl) {
            setIsOpen(false);
            navigate(targetUrl);
        }
        console.log("notification", notification);
    };
    const getIcon = (type: string) => {
        switch (type) {
            case 'approval_needed':
            case 'ticket_approved':
            case 'ticket_rejected':
                return <ClipboardCheck className="w-4 h-4" />;
            case 'new_comment':
                return <MessageCircle className="w-4 h-4" />;
            case 'task_assigned':
            case 'ticket_assigned':
                return <Users className="w-4 h-4" />;
            case 'doc_generation_started':
            case 'doc_generation_complete':
                return <FileText className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getIconColor = (type: string, status?: string) => {
        if (type === 'doc_generation_started' || status === 'loading') {
            return 'text-yellow-500';
        }
        switch (type) {
            case 'ticket_approved':
            case 'doc_generation_complete':
                return 'text-green-500';
            case 'ticket_rejected':
                return 'text-red-500';
            case 'approval_needed':
                return 'text-orange-500';
            default:
                return 'text-blue-500';
        }
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const groupByDate = (items: Notification[]): GroupedNotifications[] => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: { [key: string]: Notification[] } = {
            'Today': [],
            'Yesterday': [],
            'Earlier': []
        };

        items.forEach(item => {
            const itemDate = new Date(item.created_at);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate.getTime() === today.getTime()) {
                groups['Today'].push(item);
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(item);
            } else {
                groups['Earlier'].push(item);
            }
        });

        return Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([label, notifications]) => ({ label, notifications }));
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    id="notification-bell"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                            className="text-xs h-7"
                        >
                            <CheckCheck className="w-3 h-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        groupByDate(notifications).map((group) => (
                            <div key={group.label}>
                                <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground sticky top-0">
                                    {group.label}
                                </div>
                                {group.notifications.map((notification) => (
                                    <div
                                        key={notification.notification_id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50",
                                            !notification.is_read && "bg-primary/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-0.5 p-2 rounded-full bg-muted",
                                            getIconColor(notification.type, notification.data_payload?.status)
                                        )}>
                                            {notification.data_payload?.status === 'loading' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                getIcon(notification.type)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notification.is_read && "font-semibold"
                                                )}>
                                                    {(notification.data_payload as any)?.title || notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {getRelativeTime(notification.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                {/* Prioritize the DB message over the raw payload message for rich formatting */}
                                                {notification.message || (notification.data_payload as any)?.message}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
