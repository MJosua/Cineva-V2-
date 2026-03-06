// components/widgets/JobApplicantsTable.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { User, FileText, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Application {
    entity_id: string;
    applicant_id: string;
    applicant_name?: string;
    cover_letter?: string;
    resume_path?: string;
    status: string;
    applied_at: string;
    [key: string]: any;
}

const JobApplicantsTable: React.FC<WidgetProps> = ({ ticketData }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (ticketData?.ticket_id) {
            fetchApplications();
        }
    }, [ticketData]);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.get(
                `${API_URL}/engine/tickets/${ticketData.ticket_id}/work-data`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { data_type: 'application' }
                }
            );

            // Group work data by entity_id
            const groupedData: Record<string, any> = {};
            response.data.work_data?.forEach((item: any) => {
                if (!groupedData[item.entity_id]) {
                    groupedData[item.entity_id] = { entity_id: item.entity_id };
                }
                groupedData[item.entity_id][item.field_name] = item.field_value;
            });

            setApplications(Object.values(groupedData));
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast({
                title: 'Error',
                description: 'Failed to load applications',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (application: Application) => {
        try {
            const token = localStorage.getItem('hots_tokek');

            // Create assignment for this applicant
            await axios.post(
                `${API_URL}/engine/tickets/${ticketData.ticket_id}/assign`,
                {
                    assigned_type: 'user',
                    assigned_id: application.applicant_id,
                    notes: `Assignment created from application ${application.entity_id}`
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Update application status
            await axios.patch(
                `${API_URL}/engine/tickets/${ticketData.ticket_id}/work-data/${application.entity_id}`,
                {
                    updates: [
                        { field_name: 'status', field_value: 'accepted' }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Assignment created successfully'
            });

            fetchApplications(); // Refresh list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to create assignment',
                variant: 'destructive'
            });
        }
    };

    const handleRejectApplication = async (application: Application) => {
        try {
            const token = localStorage.getItem('hots_tokek');

            await axios.patch(
                `${API_URL}/engine/tickets/${ticketData.ticket_id}/work-data/${application.entity_id}`,
                {
                    updates: [
                        { field_name: 'status', field_value: 'rejected' }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Application rejected'
            });

            fetchApplications();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to reject application',
                variant: 'destructive'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; icon: any }> = {
            pending: { variant: 'secondary', icon: Calendar },
            accepted: { variant: 'default', icon: CheckCircle },
            rejected: { variant: 'destructive', icon: XCircle }
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                <Icon className="w-3 h-3" />
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Job Applicants</CardTitle>
                    <CardDescription>Loading applications...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (applications.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Job Applicants</CardTitle>
                    <CardDescription>No applications received for this job yet</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Job Applicants ({applications.length})
                </CardTitle>
                <CardDescription>Review and manage job applications</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Applicant ID</TableHead>
                            <TableHead>Applied Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Cover Letter</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((app) => (
                            <TableRow key={app.entity_id}>
                                <TableCell className="font-medium">
                                    {app.applicant_id}
                                </TableCell>
                                <TableCell>
                                    {new Date(app.applied_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(app.status)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                    {app.cover_letter || '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {app.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCreateAssignment(app)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRejectApplication(app)}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {app.status !== 'pending' && (
                                            <span className="text-sm text-gray-500">
                                                {app.status === 'accepted' ? 'Assignment created' : 'Application rejected'}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default JobApplicantsTable;
