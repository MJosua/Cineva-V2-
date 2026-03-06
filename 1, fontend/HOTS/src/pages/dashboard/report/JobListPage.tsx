// pages/dashboard/report/JobListPage.tsx
import React, { useEffect, useState } from 'react';
// import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, MapPin, DollarSign, Calendar, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface JobPosting {
    ticket_id: string;
    title: string;
    service_name: string;
    created_at: string;
    status_id: number;
    detail_rows?: Array<{
        lbl_col: string;
        cstm_col: string;
    }>;
}

interface Application {
    application_ticket_id: string;
    job_ticket_id: string;
    application_status_id: number;
    applied_at: string;
    application_status: string;
    job_title: string;
    service_name: string;
    job_status_id: number;
    job_status: string;
    has_assignment: number;
    assignment_id: number | null;
}

const JobListPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all-jobs');
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'all-jobs') {
            fetchJobs();
        } else {
            fetchApplications();
        }
    }, [activeTab]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            console.log('🔍 [JobList] Fetching jobs from service_id 19');

            // Fetch all tickets from Job Marketplace service (service_id = 19)
            const response = await axios.get(`${API_URL}/engine/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    service_id: 19
                    // Removed status_id filter to show all job postings
                }
            });

            console.log('✅ [JobList] Response:', response.data);
            setJobs(response.data.rows || []);
        } catch (error) {
            console.error('❌ [JobList] Error fetching jobs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load job listings',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hots_tokek');
            console.log('🔍 [JobList] Fetching my applications');

            const response = await axios.get(`${API_URL}/engine/tickets/my-applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ [JobList] Applications:', response.data);
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('❌ [JobList] Error fetching applications:', error);
            toast({
                title: 'Error',
                description: 'Failed to load applications',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (ticketId: string) => {
        try {
            const token = localStorage.getItem('hots_tokek');
            const response = await axios.post(
                `${API_URL}/engine/tickets/${ticketId}/apply`,
                {
                    application_data: {
                        cover_letter: 'I am interested in this position',
                        // Add more fields as needed
                    }
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: response.data.message,
            });

            // Refresh job list
            fetchJobs();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.error || 'Failed to submit application',
                variant: 'destructive'
            });
        }
    };

    const getApplicationStatusBadge = (status: string, hasAssignment: number) => {
        if (hasAssignment > 0) {
            return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
        }

        const statusMap: Record<string, { variant: any; icon: any }> = {
            'Pending': { variant: 'secondary', icon: Clock },
            'Closed': { variant: 'destructive', icon: XCircle },
        };

        const config = statusMap[status] || { variant: 'secondary', icon: Clock };
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
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Job Marketplace</h1>
                <p className="text-gray-600 mt-2">Browse jobs and track your applications</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="all-jobs">All Jobs</TabsTrigger>
                    <TabsTrigger value="my-applications">
                        My Applications {applications.length > 0 && `(${applications.length})`}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all-jobs" className="mt-6">
                    {jobs.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-gray-500">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p>No active job postings at the moment</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {jobs.map((job) => (
                                <Card key={job.ticket_id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{job.title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {job.service_name}
                                                </CardDescription>
                                            </div>
                                            <Badge variant="secondary">Open</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {job.detail_rows?.find((r: any) => r.lbl_col === 'Location')?.cstm_col && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{job.detail_rows.find((r: any) => r.lbl_col === 'Location')?.cstm_col}</span>
                                                </div>
                                            )}
                                            {job.detail_rows?.find((r: any) => r.lbl_col === 'Budget')?.cstm_col && (
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    <span>{job.detail_rows.find((r: any) => r.lbl_col === 'Budget')?.cstm_col}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => navigate(`/ticket/${job.ticket_id}`)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={() => handleApply(job.ticket_id)}
                                            >
                                                Apply Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="my-applications" className="mt-6">
                    {applications.length === 0 ? (
                        <Card>
                            <CardContent className="pt-6 text-center text-gray-500">
                                <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p>You haven't applied to any jobs yet</p>
                                <Button
                                    className="mt-4"
                                    onClick={() => setActiveTab('all-jobs')}
                                >
                                    Browse Jobs
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {applications.map((app) => (
                                <Card key={app.application_ticket_id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{app.job_title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {app.service_name}
                                                </CardDescription>
                                            </div>
                                            {getApplicationStatusBadge(app.application_status, app.has_assignment)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                                            </div>
                                            {app.has_assignment > 0 && (
                                                <div className="text-green-600 font-medium">
                                                    ✓ You have been assigned to this job
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/ticket/${app.job_ticket_id}`)}
                                                >
                                                    📋 Job Posting
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/ticket/${app.application_ticket_id}`)}
                                                >
                                                    📝 My Application
                                                </Button>
                                            </div>
                                            {app.has_assignment > 0 && app.assignment_id && (
                                                <Button
                                                    className="w-full"
                                                    onClick={() => navigate(`/assignments/${app.assignment_id}`)}
                                                >
                                                    ✅ View Assignment
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default JobListPage;

