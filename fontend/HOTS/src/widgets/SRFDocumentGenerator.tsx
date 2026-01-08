// widgets/SRFDocumentGenerator.tsx
// Document generation widget for SRF service (service_id = 6)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2, AlertCircle, FolderOpen, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { FilePreview } from '@/components/ui/FilePreview';

interface GeneratedDocument {
    id: number;
    ticket_id: string;
    document_type: string;
    file_path: string;
    file_name: string;
    generated_date: string;
    generated_by: string;
}

const SRFDocumentGenerator: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [generating, setGenerating] = useState(false);
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentsOpen, setDocumentsOpen] = useState(true);
    const [hasDocumentNumber, setHasDocumentNumber] = useState(false);
    const { toast } = useToast();

    const ticketId = widgetData?.assignmentData?.ticket_id || ticketData?.ticket_id;

    // Fetch existing documents and check for document number on mount
    useEffect(() => {
        if (ticketId) {
            fetchDocuments();
            checkDocumentNumber();
        }
    }, [ticketId]);

    const checkDocumentNumber = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/srf_document_number`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHasDocumentNumber(!!response.data?.value);
        } catch (error) {
            setHasDocumentNumber(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            setDocumentsLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_customfunction/documents/${ticketId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setDocuments(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setDocumentsLoading(false);
        }
    };

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
                `${API_URL}/hots_customfunction/execute-doc-gen/${ticketId}`,
                { document_type: 'srf' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast({
                    title: 'Document Generated',
                    description: 'SRF document has been created successfully'
                });

                // Refresh document list
                fetchDocuments();

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

    // Download handler - same method as TicketDetail
    const handleDownload = (filePath: string, fileName: string) => {
        const downloadUrl = `${API_URL}/${filePath.replace(/\\/g, '/')}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    {documents.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <FolderOpen className="w-3 h-3 mr-1" />
                            {documents.length} document{documents.length > 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Warning if no document number */}
                {!hasDocumentNumber && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">
                            Please set Factory & Document Number first
                        </span>
                    </div>
                )}

                {/* Generate Button */}
                <Button
                    onClick={handleGenerateDocument}
                    disabled={generating || !hasDocumentNumber}
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

                {/* Documents List - Using FilePreview component like TicketDetail */}
                {documents.length > 0 && (
                    <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Generated Documents</span>
                            </div>
                            {documentsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                            <div className="space-y-3">
                                {documentsLoading ? (
                                    <div className="flex items-center gap-2 py-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                ) : (
                                    documents.map((doc) => (
                                        <FilePreview
                                            key={doc.id}
                                            generated={true}
                                            fileName={doc.file_name || `SRF_${doc.ticket_id}.pdf`}
                                            filePath={doc.file_path}
                                            uploadDate={doc.generated_date}
                                            onDownload={() => handleDownload(doc.file_path, doc.file_name || `SRF_${doc.ticket_id}.pdf`)}
                                        />
                                    ))
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDocuments}
                    disabled={documentsLoading}
                    className="w-full gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${documentsLoading ? 'animate-spin' : ''}`} />
                    Refresh Documents
                </Button>
            </CardContent>
        </Card>
    );
};

export default SRFDocumentGenerator;

