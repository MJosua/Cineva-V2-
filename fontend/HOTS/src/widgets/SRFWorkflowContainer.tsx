// widgets/SRFWorkflowContainer.tsx
// Unified container for SRF workflow with split layout
// Left: Factory, Category, Number | Right: Document Generator + List

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Factory, Save, Loader2, CheckCircle, Hash, Package, FileText, Download, RefreshCw, FolderOpen, AlertCircle } from 'lucide-react';
import { FilePreview } from '@/components/ui/FilePreview';

interface FactoryOption {
    factory_id: number;
    factory_name: string;
    factory_sname?: string;
}

interface GeneratedDocument {
    id: number;
    ticket_id: string;
    document_type: string;
    file_path: string;
    file_name: string;
    generated_date: string;
    generated_by: string;
}

const SRFWorkflowContainer: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const ticketId = widgetData?.assignmentData?.ticket_id || ticketData?.ticket_id;
    const { toast } = useToast();

    // --- LEFT SIDE STATE ---
    const [factories, setFactories] = useState<FactoryOption[]>([]);
    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [productCategory, setProductCategory] = useState<'RM' | 'FG' | 'GEN'>('GEN');
    const [srfDocumentNumber, setSrfDocumentNumber] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [factorySaving, setFactorySaving] = useState(false);
    const [docNumberSaving, setDocNumberSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    // --- RIGHT SIDE STATE ---
    const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Fetch factories on mount
    useEffect(() => {
        if (ticketId) {
            Promise.all([fetchFactories(), fetchWorkData(), fetchDocuments()])
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [ticketId]);

    const fetchFactories = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(`${API_URL}/hots_settings/factories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFactories(response.data.factories || []);
        } catch (error) {
            console.error('Error fetching factories:', error);
        }
    };

    const fetchWorkData = useCallback(async () => {
        if (!ticketId) return;
        try {
            const token = localStorage.getItem('tokek');

            // ✅ NEW: Auto-detect category from m_sample_category via t_ticket_work_data
            const autoCatRes = await axios.get(
                `${API_URL}/hots_customfunction/srf/auto_category/${ticketId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);

            if (autoCatRes?.data?.success && autoCatRes?.data?.category) {
                const cat = autoCatRes.data.category as 'RM' | 'FG' | 'GEN';
                setProductCategory(cat);
                console.log('🔑 [SRF] Auto-detected category:', cat);
            } else {
                // Fallback: fetch from saved product_category
                const catRes = await axios.get(
                    `${API_URL}/engine/ticket/${ticketId}/work-data/product_category`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ).catch(() => null);
                if (catRes?.data?.value) {
                    setProductCategory(catRes.data.value as 'RM' | 'FG' | 'GEN');
                }
            }

            // Fetch factory_id
            const factoryRes = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/factory_id`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (factoryRes?.data?.value) {
                setSelectedFactoryId(parseInt(factoryRes.data.value));
            }

            // Fetch srf_document_number
            const numRes = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/srf_document_number`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (numRes?.data?.value) {
                setSrfDocumentNumber(numRes.data.value);
            }
        } catch (error) {
            console.error('Error fetching work data:', error);
        }
    }, [ticketId]);

    const fetchDocuments = useCallback(async () => {
        if (!ticketId) return;
        try {
            setDocumentsLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(`${API_URL}/hots_customfunction/documents/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.success) {
                setDocuments(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setDocumentsLoading(false);
        }
    }, [ticketId]);


    const fetchPreviewNumber = async (factoryId: number, category: string) => {
        if (!factoryId || !category) return;
        try {
            setPreviewLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(`${API_URL}/hots_customfunction/srf/preview_number`, {
                params: { factory_id: factoryId, product_category: category },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data?.success) {
                setSrfDocumentNumber(response.data.preview_number);
            }
        } catch (error) {
            console.error('Error fetching preview number:', error);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSaveFactory = async () => {
        if (!selectedFactoryId || !ticketId) return;
        try {
            setFactorySaving(true);
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'factory_id', field_value: selectedFactoryId.toString() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'product_category', field_value: productCategory },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Saved', description: 'Factory and category saved' });
            fetchPreviewNumber(selectedFactoryId, productCategory);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save factory', variant: 'destructive' });
        } finally {
            setFactorySaving(false);
        }
    };

    const handleCategoryChange = (cat: 'RM' | 'FG' | 'GEN') => {
        setProductCategory(cat);
        if (selectedFactoryId) {
            fetchPreviewNumber(selectedFactoryId, cat);
        }
    };

    const handleConfirmDocNumber = async () => {
        if (!ticketId) return;
        try {
            setDocNumberSaving(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.post(
                `${API_URL}/hots_customfunction/srf/save_number`,
                {
                    ticket_id: ticketId,
                    doc_no: srfDocumentNumber,
                    factory_id: selectedFactoryId,
                    product_category: productCategory
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setSrfDocumentNumber(response.data.doc_no);
                toast({ title: 'Confirmed', description: 'Document number: ' + response.data.doc_no });
                fetchWorkData();
            } else {
                toast({ title: 'Error', description: response.data.message || 'Failed to confirm', variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to confirm number', variant: 'destructive' });
        } finally {
            setDocNumberSaving(false);
        }
    };

    const handleGenerateDocument = async () => {
        if (!ticketId) return;
        try {
            setGenerating(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.post(
                `${API_URL}/hots_customfunction/srf/generate`,
                { ticket_id: ticketId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data?.success) {
                toast({ title: 'Success', description: 'Document generated successfully' });
                fetchDocuments();
            } else {
                toast({ title: 'Error', description: response.data?.message || 'Failed to generate', variant: 'destructive' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.response?.data?.message || 'Generation failed', variant: 'destructive' });
        } finally {
            setGenerating(false);
        }
    };

    // Download handler for FilePreview component
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

    const canGenerate = selectedFactoryId && productCategory && srfDocumentNumber && !srfDocumentNumber.includes('To Be');

    // Group documents by date
    const groupedDocuments = useMemo(() => {
        const groups: { [key: string]: GeneratedDocument[] } = {};
        documents.forEach(doc => {
            const dateKey = new Date(doc.generated_date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(doc);
        });
        return groups;
    }, [documents]);

    if (!ticketId) {
        return (
            <Card className="border-indigo-200 bg-indigo-50">
                <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">No ticket selected</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Loading...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

            {/* LEFT: Factory & Number Card */}
            <Card className="border-amber-200 h-full flex flex-col">
                <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500 text-white">
                            <Factory className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-medium">Factory & Document Number</CardTitle>
                            <p className="text-xs text-slate-500">Select factory and generate number</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-1 min-h-0">
                    {/* Factory Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-600">Factory</label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedFactoryId?.toString() || ''}
                                onValueChange={(value) => setSelectedFactoryId(Number(value))}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select Factory..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {factories.map((f) => (
                                        <SelectItem key={f.factory_id} value={f.factory_id.toString()}>
                                            {f.factory_name} {f.factory_sname ? `(${f.factory_sname})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>



                    {/* Save Factory Button */}
                    <Button
                        onClick={handleSaveFactory}
                        disabled={!selectedFactoryId || factorySaving}
                        className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                        {factorySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Choose Factory
                    </Button>

                    {/* Document Number Preview */}
                    <div className="space-y-2 pt-2 border-t">
                        <label className="text-xs font-medium text-slate-600">Document Number</label>
                        <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border">
                            <span className="font-mono text-sm">
                                {previewLoading ? 'Loading...' : srfDocumentNumber || 'Select factory first'}
                            </span>
                            {srfDocumentNumber && (
                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    <Hash className="w-3 h-3 mr-1" />
                                    Preview
                                </Badge>
                            )}
                        </div>
                        <Button
                            onClick={handleConfirmDocNumber}
                            disabled={!selectedFactoryId || docNumberSaving}
                            className="w-full gap-2"
                            variant="secondary"
                        >
                            {docNumberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Confirm & Lock Number
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* RIGHT: Document Generator Card */}
            <Card className="border-blue-200 h-full flex flex-col">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500 text-white">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-medium">SRF Document Generator</CardTitle>
                                <p className="text-xs text-slate-500">Generate and manage documents</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchDocuments} disabled={documentsLoading}>
                            <RefreshCw className={`h-4 w-4 ${documentsLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3 flex flex-col max-h-[60vh]">
                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerateDocument}
                        disabled={!canGenerate || generating}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        {generating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                            <><FileText className="w-4 h-4" /> Generate SRF Document</>
                        )}
                    </Button>
                    {!canGenerate && (
                        <p className="text-xs text-muted-foreground text-center">
                            Complete factory, category, and confirm number first
                        </p>
                    )}

                    {/* Document List - Clean & User-Friendly - fills remaining space */}
                    {/* Document List – single scroll container */}
                    <div className="flex-1 min-h-0 flex flex-col space-y-2">
                        <div className="text-xs font-medium text-slate-600">
                            Generated Documents ({documents.length})
                        </div>

                        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-1">
                            {documentsLoading ? (
                                <div className="p-4 text-center text-slate-500 border rounded-lg">
                                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 text-sm border rounded-lg bg-slate-50">
                                    <FolderOpen className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                    No documents generated yet
                                </div>
                            ) : (
                                Object.entries(groupedDocuments).map(([dateKey, docs]) => (
                                    <div key={dateKey} className="space-y-2">
                                        {/* Date Header */}
                                        <div className="text-xs font-semibold text-slate-500 sticky top-0 bg-white py-1 border-b">
                                            📅 {dateKey}
                                        </div>
                                        {/* Documents for this date */}
                                        {docs.map((doc, index) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-3 p-2 rounded-lg border bg-gradient-to-r from-blue-50/50 to-indigo-50/50"
                                            >
                                                {/* Number Badge */}
                                                <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                    {documents.length - documents.indexOf(doc)}
                                                </div>
                                                {/* FilePreview with modal */}
                                                <div className="flex-1 min-w-0">
                                                    <FilePreview
                                                        generated={true}
                                                        fileName={doc.file_name || `SRF_${doc.ticket_id}.pdf`}
                                                        filePath={doc.file_path}
                                                        uploadDate={doc.generated_date}
                                                        onDownload={() => handleDownload(doc.file_path, doc.file_name || `SRF_${doc.ticket_id}.pdf`)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default SRFWorkflowContainer;
