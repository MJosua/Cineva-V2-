import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, Check, X, ArrowRight } from 'lucide-react';
import { WidgetProps } from '@/types/widgetTypes';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config/sourceConfig';
import axios from 'axios';

interface Approval {
    ticket_id: string;
    service_name: string;
    requester_name: string;
    creation_date: string;
    reason: string;
}

const PendingApprovalsWidget: React.FC<WidgetProps> = ({ data }) => {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const limit = data?.limit || 5;

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                const token = localStorage.getItem('hots_tokek');
                const response = await axios.get(`${API_URL}/hots_ticket/pending-approvals?limit=${limit}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setApprovals(response.data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch approvals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchApprovals();
    }, [limit]);

    return (
        <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-orange-50 rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-800">
                    <CheckSquare className="w-5 h-5" />
                    Pending Approvals
                    {approvals.length > 0 && (
                        <Badge variant="destructive" className="ml-2">{approvals.length}</Badge>
                    )}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/task-list')}>
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
            </CardHeader>
            <CardContent className="pt-4">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                        ))}
                    </div>
                ) : approvals.length === 0 ? (
                    <div className="text-center text-gray-500 py-4 flex flex-col items-center">
                        <Check className="w-8 h-8 text-green-500 mb-2" />
                        No pending approvals
                    </div>
                ) : (
                    <div className="space-y-2">
                        {approvals.map(approval => (
                            <div
                                key={approval.ticket_id}
                                className="flex items-center justify-between p-3 border border-orange-100 rounded-lg hover:bg-orange-50 cursor-pointer transition"
                                onClick={() => navigate(`/tickets/${approval.ticket_id}`)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{approval.service_name}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                        From: {approval.requester_name}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 border-green-200 hover:bg-green-50">
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-red-600 border-red-200 hover:bg-red-50">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PendingApprovalsWidget;
