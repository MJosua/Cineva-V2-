// components/widgets/JobExecutionTools.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Send, CheckCircle2 } from 'lucide-react';

const JobExecutionTools: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [notes, setNotes] = useState('');
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const assignmentData = widgetData?.assignmentData;
    const assignmentId = assignmentData?.id;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDeliverableFile(e.target.files[0]);
        }
    };

    const handleUploadDeliverable = async () => {
        if (!deliverableFile || !assignmentId) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', deliverableFile);
            formData.append('field_name', 'deliverable');
            formData.append('data_type', 'deliverable');

            const token = localStorage.getItem('tokek');

            // Upload file (you may need to implement file upload endpoint)
            // For now, we'll just store the reference
            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/deliverable`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast({
                title: 'Success',
                description: 'Deliverable uploaded successfully'
            });

            setDeliverableFile(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upload deliverable',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleAddNote = async () => {
        if (!notes.trim() || !assignmentId) return;

        try {
            const token = localStorage.getItem('tokek');

            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/work-data`,
                {
                    data_type: 'note',
                    fields: {
                        content: notes,
                        created_at: new Date().toISOString()
                    }
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Note added successfully'
            });

            setNotes('');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add note',
                variant: 'destructive'
            });
        }
    };

    const handleCompleteAssignment = async () => {
        if (!assignmentId) return;

        try {
            const token = localStorage.getItem('tokek');

            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/complete`,
                {
                    completion_note: 'Assignment completed by worker'
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast({
                title: 'Success',
                description: 'Assignment marked as complete'
            });

            // Optionally redirect or refresh
            window.location.reload();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to complete assignment',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Assignment Progress</CardTitle>
                    <CardDescription>Track your work completion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span className="text-gray-500">70%</span>
                        </div>
                        <Progress value={70} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Status</p>
                            <p className="font-medium">{assignmentData?.assignment_status || 'Active'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Assigned Date</p>
                            <p className="font-medium">
                                {assignmentData?.assigned_at ? new Date(assignmentData.assigned_at).toLocaleDateString() : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upload Deliverable */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload Deliverable
                    </CardTitle>
                    <CardDescription>Upload your completed work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="deliverable">Select File</Label>
                        <Input
                            id="deliverable"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.zip"
                        />
                        {deliverableFile && (
                            <p className="text-sm text-gray-600">
                                Selected: {deliverableFile.name}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={handleUploadDeliverable}
                        disabled={!deliverableFile || uploading}
                        className="w-full"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Deliverable'}
                    </Button>
                </CardContent>
            </Card>

            {/* Add Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Work Notes
                    </CardTitle>
                    <CardDescription>Add notes about your progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Enter your work notes here..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                    />
                    <Button
                        onClick={handleAddNote}
                        disabled={!notes.trim()}
                        variant="outline"
                        className="w-full"
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Add Note
                    </Button>
                </CardContent>
            </Card>

            {/* Complete Assignment */}
            {assignmentData?.assignment_status === 'active' && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-800">
                            <CheckCircle2 className="w-5 h-5" />
                            Complete Assignment
                        </CardTitle>
                        <CardDescription className="text-green-700">
                            Mark this assignment as complete
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleCompleteAssignment}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Complete
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default JobExecutionTools;
