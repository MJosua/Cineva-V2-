import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config/sourceConfig';
import axios from 'axios';

interface Ticket {
    ticket_id: string;
    service_name: string;
    status_name: string;
    status_id: number;
    creation_date: string;
    reason: string;
}

const MyTicketsWidget: React.FC<WidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const limit = data?.limit || 5;

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const token = localStorage.getItem('hots_tokek');
                const response = await axios.get(`${API_URL}/hots_ticket/my-tickets?limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setTickets(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch tickets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, [limit]);

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 0: return 'bg-yellow-100 text-yellow-800';
            case 1: return 'bg-blue-100 text-blue-800';
            case 2: return 'bg-green-100 text-green-800';
            case 3: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    My Recent Tickets
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No tickets found</div>
                ) : (
                    <div className="space-y-2">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.ticket_id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                onClick={() => navigate(`/tickets/${ticket.ticket_id}`)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{ticket.service_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{ticket.reason}</div>
                                </div>
                                <Badge className={getStatusColor(ticket.status_id)}>
                                    {ticket.status_name}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MyTicketsWidget;
