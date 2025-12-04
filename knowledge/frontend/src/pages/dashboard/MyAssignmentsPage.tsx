// pages/dashboard/MyAssignmentsPage.tsx
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, Briefcase } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    ticket_title: string;
    service_name: string;
    service_display_name: string;
    assignment_status: string;
    assigned_at: string;
    assigned_type: string;
    ticket_status: number;
    notes?: string;
}

const MyAssignmentsPage: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchAssignments();
    }, [filter]);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(`${API_URL}/engine/my-assignments`, {
                headers: { Authorization: `Bearer ${token}` },
                params: filter !== 'all' ? { status: filter } : {}
            });

            setAssignments(response.data.assignments || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            toast({
                title: 'Error',
                description: 'Failed to load assignments',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            active: 'default',
            completed: 'secondary',
            cancelled: 'destructive'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
                        <p className="text-gray-600 mt-2">Manage your active work assignments</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'active' ? 'default' : 'outline'}
                            onClick={() => setFilter('active')}
                        >
                            Active
                        </Button>
                        <Button
                            variant={filter === 'completed' ? 'default' : 'outline'}
                            onClick={() => setFilter('completed')}
                        >
                            Completed
                        </Button>
                    </div>
                </div>

                {assignments.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center text-gray-500">
                            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No {filter !== 'all' && filter} assignments found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <Card key={assignment.assignment_id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{assignment.ticket_title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {assignment.service_display_name}
                                            </CardDescription>
                                        </div>
                                        {getStatusBadge(assignment.assignment_status)}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4" />
                                                <span>Ticket: {assignment.ticket_id}</span>
                                            </div>
                                        </div>

                                        {assignment.notes && (
                                            <p className="text-sm text-gray-600">{assignment.notes}</p>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/ticket/${assignment.ticket_id}`)}
                                            >
                                                View Ticket
                                            </Button>
                                            <Button
                                                onClick={() => navigate(`/assignments/${assignment.assignment_id}`)}
                                            >
                                                Work on Assignment
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default MyAssignmentsPage;
