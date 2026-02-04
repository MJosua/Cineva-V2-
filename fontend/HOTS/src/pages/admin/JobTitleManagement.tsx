import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface JobTitle {
    jobtitle_id: number;
    job_title: string;
    description?: string;
    creation_date?: string;
}

const JobTitleManagement = () => {
    const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

    // Form state
    const [formData, setFormData] = useState({
        job_title: '',
        description: ''
    });

    const { toast } = useToast();

    // Fetch job titles
    const fetchJobTitles = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL}/hots_settings/get/jobtitle`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('tokek')}`,
                }
            });

            if (response.data.success) {
                setJobTitles(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching job titles:', error);
            toast({
                title: "Error",
                description: "Failed to fetch job titles",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobTitles();
    }, []);

    // Filter job titles by search
    const filteredJobTitles = jobTitles.filter(job =>
        job.job_title?.toLowerCase().includes(searchValue.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Handlers
    const handleAdd = () => {
        setSelectedJobTitle(null);
        setFormData({ job_title: '', description: '' });
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEdit = (job: JobTitle) => {
        setSelectedJobTitle(job);
        setFormData({
            job_title: job.job_title || '',
            description: job.description || ''
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = (job: JobTitle) => {
        setSelectedJobTitle(job);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'add') {
                await axios.post(`${API_URL}/hots_settings/post/jobtitle`, formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
                    }
                });
                toast({
                    title: "Success",
                    description: "Job title created successfully",
                });
            } else {
                await axios.put(`${API_URL}/hots_settings/update/jobtitle/${selectedJobTitle?.jobtitle_id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('tokek')}`,
                    }
                });
                toast({
                    title: "Success",
                    description: "Job title updated successfully",
                });
            }

            setIsModalOpen(false);
            fetchJobTitles();
        } catch (error: any) {
            console.error('Error saving job title:', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save job title",
                variant: "destructive",
            });
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/hots_settings/delete/jobtitle/${selectedJobTitle?.jobtitle_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('tokek')}`,
                }
            });

            toast({
                title: "Success",
                description: "Job title deleted successfully",
            });

            setIsDeleteModalOpen(false);
            setSelectedJobTitle(null);
            fetchJobTitles();
        } catch (error: any) {
            console.error('Error deleting job title:', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete job title",
                variant: "destructive",
            });
        }
    };

    return (

        <div
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search job titles..."

            className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Title Management</h1>
                    <p className="text-gray-600">Manage employee job titles and positions</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Job Title
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="w-5 h-5" />
                        <span>Job Titles ({filteredJobTitles.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-lg">Loading job titles...</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[600px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">Job Title</TableHead>
                                        <TableHead className="whitespace-nowrap">Description</TableHead>
                                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJobTitles.map((job) => (
                                        <TableRow key={job.jobtitle_id}>
                                            <TableCell className="font-medium">{job.job_title}</TableCell>
                                            <TableCell className="text-gray-600">{job.description || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(job)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(job)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredJobTitles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                                                No job titles found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{modalMode === 'add' ? 'Add Job Title' : 'Edit Job Title'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="job_title">Job Title Name</Label>
                            <Input
                                id="job_title"
                                value={formData.job_title}
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                placeholder="e.g. Senior Developer"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this role"
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {modalMode === 'add' ? 'Create' : 'Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete Job Title</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedJobTitle?.job_title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default JobTitleManagement;
