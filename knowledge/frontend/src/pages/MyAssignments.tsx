import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock, User, Calendar } from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';

interface Assignment {
    assignment_id: number;
    ticket_id: string;
    assigned_type: string;
    assigned_id: number;
    assigned_at: string;
    assignment_status: string;
    notes: string;
    service_id: number;
    service_name: string;
    status_id: number;
    status_name: string;
    creation_date: string;
    creator_name: string;
    pending_tasks: number;
}

export const MyAssignments: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const { user } = useAppSelector(state => state.auth);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/my-assignments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch assignments');

            const data = await response.json();
            setAssignments(data.assignments || []);
        } catch (err: any) {
            console.error('Failed to fetch assignments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteAssignment = async (ticketId: string) => {
        if (!confirm('Mark this assignment as complete?')) return;

        try {
            const token = localStorage.getItem('tokek');
            const response = await fetch(`${API_URL}/engine/assignment/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ticket_id: ticketId, completed_by: user?.user_id })
            });

            if (!response.ok) throw new Error('Failed to complete assignment');

            alert('✅ Assignment completed successfully!');
            fetchAssignments();
        } catch (err: any) {
            alert(`❌ ${err.message}`);
        }
    };

    const getStatusBadgeColor = (statusId: number) => {
        const colors: Record<number, string> = {
            5: 'bg-blue-100 text-blue-800',  // In Fulfillment
            6: 'bg-green-100 text-green-800', // Completed
        };
        return colors[statusId] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        My Assignments
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Tickets assigned to you or your teams for fulfillment
                    </p>
                </div>

                {/* View Toggle */}
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'table' ? 'default' : 'outline'}
                        onClick={() => setViewMode('table')}
                        size="sm"
                    >
                        Table View
                    </Button>
                    <Button
                        variant={viewMode === 'cards' ? 'default' : 'outline'}
                        onClick={() => setViewMode('cards')}
                        size="sm"
                    >
                        Card View
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{assignments.length}</p>
                                <p className="text-sm text-gray-600">Active Assignments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {assignments.filter(a => a.pending_tasks > 0).length}
                                </p>
                                <p className="text-sm text-gray-600">With Pending Tasks</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {assignments.filter(a => a.pending_tasks === 0).length}
                                </p>
                                <p className="text-sm text-gray-600">Ready to Complete</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments List */}
            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            No active assignments
                        </h3>
                        <p className="text-gray-500">
                            You don't have any tickets assigned to you at the moment
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === 'table' ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ticket ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Service
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Assigned Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tasks
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.assignment_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <a
                                                    href={`/ticket/${assignment.ticket_id}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {assignment.ticket_id}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {assignment.service_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={getStatusBadgeColor(assignment.status_id)}>
                                                    {assignment.status_name}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(assignment.assigned_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {assignment.pending_tasks > 0 ? (
                                                    <span className="text-orange-600 font-medium">
                                                        {assignment.pending_tasks} pending
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 font-medium">
                                                        All done
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCompleteAssignment(assignment.ticket_id)}
                                                    className="gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Complete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignments.map((assignment) => (
                        <Card key={assignment.assignment_id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <a
                                        href={`/ticket/${assignment.ticket_id}`}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        {assignment.ticket_id}
                                    </a>
                                    <Badge className={getStatusBadgeColor(assignment.status_id)}>
                                        {assignment.status_name}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>{assignment.service_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        {assignment.pending_tasks > 0 ? (
                                            <span className="text-orange-600 font-medium">
                                                {assignment.pending_tasks} tasks pending
                                            </span>
                                        ) : (
                                            <span className="text-green-600 font-medium">
                                                All tasks done
                                            </span>
                                        )}
                                    </div>
                                    {assignment.notes && (
                                        <p className="text-sm text-gray-600 italic">{assignment.notes}</p>
                                    )}
                                    <Button
                                        onClick={() => handleCompleteAssignment(assignment.ticket_id)}
                                        className="w-full gap-2 mt-4"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Complete Assignment
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
