// widgets/SRFFactorySelector.tsx
// Factory selection, product category, and document number generator for SRF (service_id = 6)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Factory, Save, Loader2, CheckCircle, AlertCircle, Hash, Package } from 'lucide-react';

interface FactoryOption {
    factory_id: number;
    factory_name: string;
    factory_sname?: string;
}

const SRFFactorySelector: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [factories, setFactories] = useState<FactoryOption[]>([]);
    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [productCategory, setProductCategory] = useState<'RM' | 'FG' | 'GEN'>('GEN');
    const [srfDocumentNumber, setSrfDocumentNumber] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [docNumberSaving, setDocNumberSaving] = useState(false);
    const { toast } = useToast();

    const ticketId = widgetData?.assignmentData?.ticket_id || ticketData?.ticket_id;

    // Load data on mount
    useEffect(() => {
        if (ticketId) {
            Promise.all([fetchFactories(), fetchWorkData()]).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [ticketId]);

    const fetchFactories = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_settings/factories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFactories(response.data.factories || []);
        } catch (error) {
            console.error('Error fetching factories:', error);
        }
    };

    const fetchWorkData = async () => {
        try {
            const token = localStorage.getItem('tokek');
            // Fetch factory_id
            const factoryRes = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/factory_id`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (factoryRes?.data?.value) {
                setSelectedFactoryId(parseInt(factoryRes.data.value));
            }
            // Fetch product_category
            const catRes = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/product_category`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (catRes?.data?.value) {
                setProductCategory(catRes.data.value as 'RM' | 'FG' | 'GEN');
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
    };

    const fetchPreviewNumber = async (factoryId: number, category: string) => {
        try {
            setPreviewLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_customfunction/srf/preview_number`,
                {
                    params: { factory_id: factoryId, product_category: category },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.data.success) {
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
            setSaving(true);
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'factory_id', field_value: selectedFactoryId.toString() },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Also save category
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'product_category', field_value: productCategory },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Saved', description: 'Factory and category saved' });
            // Fetch preview number
            fetchPreviewNumber(selectedFactoryId, productCategory);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleCategoryChange = (cat: 'RM' | 'FG' | 'GEN') => {
        setProductCategory(cat);
        if (selectedFactoryId) {
            fetchPreviewNumber(selectedFactoryId, cat);
        }
    };

    const handleSaveDocNumber = async () => {
        // We send the preview number, but the backend will regenerate it to ensure uniqueness/sequence
        if (!ticketId) return;
        try {
            setDocNumberSaving(true);
            const token = localStorage.getItem('tokek');

            // Save to t_ticket_doc_no (and t_ticket_work_data via backend)
            const response = await axios.post(
                `${API_URL}/hots_customfunction/srf/save_number`,
                {
                    ticket_id: ticketId,
                    doc_no: srfDocumentNumber, // Sent as reference/preview
                    factory_id: selectedFactoryId,
                    product_category: productCategory
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Update state with the ACTUAL generated number from backend (might differ from preview if racing)
                const finalDocNo = response.data.doc_no;
                setSrfDocumentNumber(finalDocNo);
                toast({ title: 'Saved', description: 'Document number verified & saved: ' + finalDocNo });

                // Also refresh work data to ensure consistency
                fetchWorkData();
            } else {
                toast({ title: 'Error', description: response.data.message || 'Failed to save number', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error saving document number:', error);
            toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save document number', variant: 'destructive' });
        } finally {
            setDocNumberSaving(false);
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
        <Card className="border-amber-200">
            <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500 text-white">
                            <Factory className="w-4 h-4" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-medium">Factory & Document Number</CardTitle>
                            <p className="text-xs text-slate-500">Select factory and generate SRF number</p>
                        </div>
                    </div>
                    {srfDocumentNumber && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {srfDocumentNumber}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {/* Factory Selection */}
                <div className="flex items-center gap-3">
                    <Factory className="w-4 h-4 text-amber-600" />
                    <select
                        value={selectedFactoryId || ''}
                        onChange={(e) => setSelectedFactoryId(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-300"
                    >
                        <option value="">Select Factory...</option>
                        {factories.map(f => (
                            <option key={f.factory_id} value={f.factory_id}>
                                {f.factory_name} {f.factory_sname ? `(${f.factory_sname})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Product Category */}
                <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-slate-600">Category:</span>
                    <div className="flex gap-1">
                        {(['RM', 'FG', 'GEN'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${productCategory === cat
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Save Factory Button */}
                <Button
                    onClick={handleSaveFactory}
                    disabled={!selectedFactoryId || saving}
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Factory & Get Number
                </Button>

                {/* Document Number Preview */}
                {(previewLoading || srfDocumentNumber) && (
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-slate-600">Document Number:</span>
                            </div>
                            {previewLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                            ) : (
                                <span className="font-mono font-semibold text-green-700">{srfDocumentNumber}</span>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={handleSaveDocNumber}
                            disabled={!srfDocumentNumber || docNumberSaving}
                            className="w-full mt-2 gap-2 bg-green-500 hover:bg-green-600"
                        >
                            {docNumberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Confirm & Save Number
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SRFFactorySelector;
