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


            {/* Upload Deliverable */}


            {/* Add Notes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Data Execution
                    </CardTitle>
                    <CardDescription>Add execution notes and data entries</CardDescription>
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


        </div>
    );
};

export default JobExecutionTools;
