// widgets/SRFDocumentGenerator.tsx
// Document generation widget for SRF service (service_id = 6)
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const SRFDocumentGenerator: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [generating, setGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);
    const { toast } = useToast();

    const ticketId = widgetData?.assignmentData?.ticket_id || ticketData?.ticket_id;

    const handleGenerateDocument = async () => {
        if (!ticketId) {
            toast({ title: 'Error', description: 'No ticket ID available', variant: 'destructive' });
            return;
        }

        try {
            setGenerating(true);
            const token = localStorage.getItem('tokek');

            // Call document generation API
            const response = await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/generate-document`,
                { document_type: 'srf' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setLastGenerated(new Date().toLocaleString());
                toast({
                    title: 'Document Generated',
                    description: 'SRF document has been created successfully'
                });

                // If a download URL is provided, trigger download
                if (response.data.download_url) {
                    window.open(response.data.download_url, '_blank');
                }
            } else {
                toast({
                    title: 'Generation Failed',
                    description: response.data.message || 'Could not generate document',
                    variant: 'destructive'
                });
            }
        } catch (error: any) {
            console.error('Document generation error:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to generate document',
                variant: 'destructive'
            });
        } finally {
            setGenerating(false);
        }
    };

    if (!ticketId) {
        return (
            <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-orange-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">No ticket selected</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500 text-white">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-medium">SRF Document Generator</CardTitle>
                            <p className="text-xs text-slate-500">Generate official SRF document</p>
                        </div>
                    </div>
                    {lastGenerated && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Last: {lastGenerated}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <Button
                    onClick={handleGenerateDocument}
                    disabled={generating}
                    className="w-full gap-2"
                >
                    {generating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Generate SRF Document
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
};

export default SRFDocumentGenerator;
