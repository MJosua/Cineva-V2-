// pages/dashboard/JobListPage.tsx
import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Calendar, Users } from 'lucide-react';
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

const JobListPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('tokek');
            // Fetch tickets with service_id = 19 (Job Marketplace) and status = 5 (In Fulfillment)
            const response = await axios.get(`${API_URL}/engine/tickets`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    service_id: 19,
                    status_id: 5
                }
            });

            setJobs(response.data.tickets || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load job listings',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (ticketId: string) => {
        try {
            const token = localStorage.getItem('tokek');
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

    if (loading) {
        return (
            <AppLayout>
                <div className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
                    <p className="text-gray-600 mt-2">Browse available job opportunities</p>
                </div>

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
                                        {/* Add more job details here from detail_rows if available */}
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
            </div>
        </AppLayout>
    );
};

export default JobListPage;
