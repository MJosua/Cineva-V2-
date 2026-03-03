// pages/dashboard/AssignmentDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';

interface Assignment {
    id: number;
    ticket_id: string;
    ticket_title: string;
    service_id: number;
    service_name: string;
    assignment_status: string;
    assigned_at: string;
    notes?: string;
}

interface WorkData {
    [entityId: string]: {
        [fieldName: string]: string;
    };
}

const AssignmentDetailPage: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [workData, setWorkData] = useState<WorkData>({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (assignmentId) {
            fetchAssignmentDetail();
            fetchWorkData();
        }
    }, [assignmentId]);

    const fetchAssignmentDetail = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/assignment/${assignmentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setAssignment(response.data.assignment);
        } catch (error) {
            console.error('Error fetching assignment:', error);
            toast({
                title: 'Error',
                description: 'Failed to load assignment details',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkData = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/assignment/${assignmentId}/work-data`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setWorkData(response.data.work_data || {});
        } catch (error) {
            console.error('Error fetching work data:', error);
        }
    };

    const handleComplete = async () => {
        if (!window.confirm('Are you sure you want to complete this assignment?')) {
            return;
        }

        try {
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/complete`,
                {
                    completion_note: 'Assignment completed'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Assignment completed successfully'
            });

            navigate('/my-assignments');
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to complete assignment',
                variant: 'destructive'
            });
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-48 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!assignment) {
        return (
            <AppLayout>
                <div className="p-6">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-500">Assignment not found</p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate('/my-assignments')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{assignment.ticket_title}</h1>
                            <p className="text-gray-600">{assignment.service_name}</p>
                        </div>
                    </div>
                    <Badge variant={assignment.assignment_status === 'active' ? 'default' : 'secondary'}>
                        {assignment.assignment_status}
                    </Badge>
                </div>

                {/* Assignment Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Ticket ID</label>
                                <p className="text-sm">{assignment.ticket_id}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Assigned Date</label>
                                <p className="text-sm">{new Date(assignment.assigned_at).toLocaleString()}</p>
                            </div>
                        </div>
                        {assignment.notes && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Notes</label>
                                <p className="text-sm">{assignment.notes}</p>
                            </div>
                        )}
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/ticket/${assignment.ticket_id}`)}
                            >
                                View Full Ticket Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Work Data Table (Excel-like) */}
                {Object.keys(workData).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Data</CardTitle>
                            <CardDescription>Application and task information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Object.entries(workData).map(([entityId, fields]) => (
                                <div key={entityId} className="mb-6 last:mb-0">
                                    <h3 className="font-semibold text-sm text-gray-700 mb-3">{entityId}</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {Object.entries(fields).map(([fieldName, fieldValue]) => (
                                                    <tr key={fieldName}>
                                                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{fieldName}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">{fieldValue}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                {assignment.assignment_status === 'active' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleComplete}
                                className="w-full"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete Assignment
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default AssignmentDetailPage;
