import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Clock, Users } from 'lucide-react';
import { API_URL } from '@/config/sourceConfig';
import { useAppSelector } from '@/hooks/useAppSelector';

interface JobListing {
    ticket_id: string;
    title: string;
    description: string;
    budget: number;
    employment_type: string;
    location: string;
    experience_level: string;
    requirements: string;
    status_id: number;
    creation_date: string;
    creator_id: number;
}

export const JobMarketplace: React.FC = () => {
    const [jobs, setJobs] = useState<JobListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAppSelector(state => state.auth);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokek');
            const url = `${API_URL}/engine/tickets?service_id=19&status_id=5,6`;

            console.log('🔍 [MARKETPLACE] Fetching jobs from:', url);
            console.log('🔍 [MARKETPLACE] Token:', token ? 'Present' : 'Missing');

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('🔍 [MARKETPLACE] Response status:', response.status);
            console.log('🔍 [MARKETPLACE] Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 [MARKETPLACE] Error response:', errorText);
                throw new Error(`Failed to fetch jobs: ${response.status}`);
            }

            const data = await response.json();
            console.log('🔍 [MARKETPLACE] Received data:', data);
            console.log('🔍 [MARKETPLACE] Jobs count:', data.rows?.length || 0);

            if (data.rows) {
                console.log('🔍 [MARKETPLACE] First job:', data.rows[0]);
            }

            setJobs(data.rows || []);
        } catch (err: any) {
            console.error('🔍 [MARKETPLACE] Fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId: string) => {
        try {
            const token = localStorage.getItem('tokek');

            // Create an application sub-ticket
            const response = await fetch(`${API_URL}/engine/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    service_id: 10, // Application service (would need to create this)
                    parent_ticket_id: jobId,
                    creator_id: user?.user_id,
                    creator_email: user?.email,
                    form_data: {
                        job_id: jobId,
                        message: 'I would like to apply for this position'
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit application');
            }

            alert('✅ Application submitted successfully!');
        } catch (err: any) {
            alert(`❌ ${err.message}`);
        }
    };

    const getEmploymentTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            'full-time': 'bg-blue-100 text-blue-800',
            'part-time': 'bg-green-100 text-green-800',
            'contract': 'bg-purple-100 text-purple-800',
            'freelance': 'bg-orange-100 text-orange-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getExperienceBadge = (level: string) => {
        const labels: Record<string, string> = {
            'entry': 'Entry Level',
            'mid': 'Mid Level',
            'senior': 'Senior',
            'lead': 'Lead/Principal'
        };
        return labels[level] || level;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6">
                        <p className="text-red-800">Error loading jobs: {error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Job Marketplace
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Browse available positions and apply with one click
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{jobs.length}</p>
                                <p className="text-sm text-gray-600">Open Positions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{jobs.filter(j => j.status_id === 5).length}</p>
                                <p className="text-sm text-gray-600">Accepting Applications</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">24h</p>
                                <p className="text-sm text-gray-600">Review Time</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Listings */}
            <div className="space-y-6">
                {jobs.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No jobs available
                            </h3>
                            <p className="text-gray-500">
                                Check back later for new opportunities
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    jobs.map((job) => (
                        <Card key={job.ticket_id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <Badge className={getEmploymentTypeBadge(job.employment_type)}>
                                                {job.employment_type}
                                            </Badge>
                                            <Badge variant="outline">
                                                <Users className="w-3 h-3 mr-1" />
                                                {getExperienceBadge(job.experience_level)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-green-600 font-semibold text-lg">
                                            <DollarSign className="w-5 h-5" />
                                            {job.budget ?job.budget.toLocaleString() : "0"}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {job.location}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Description</h4>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Requirements</h4>
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                            {job.requirements}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <span className="text-sm text-gray-500">
                                            Posted: {new Date(job.creation_date).toLocaleDateString()}
                                        </span>
                                        <Button
                                            onClick={() => handleApply(job.ticket_id)}
                                            className="gap-2"
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            Apply Now
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default JobMarketplace;
