// widgets/DataExecutionTools.tsx
// Modern data management widget for assignment work data
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, Pencil, Save, X, ChevronDown, ChevronUp,
    Calculator, History, Database, CheckCircle, Loader2, TrendingUp, FileText
} from 'lucide-react';

interface DataRow {
    id: number;
    field_key: string;
    label: string;
    value: string;
    field_type?: string;
}

interface HistoryEntry {
    id: string;
    changes: { field: string; value: string }[];
    created_at: string;
    user_name: string;
}

const DataExecutionTools: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [rows, setRows] = useState<DataRow[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newType, setNewType] = useState('text');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Factory selection for SRF service (service_id=6)
    const [factories, setFactories] = useState<{ factory_id: number; factory_name: string; factory_sname?: string }[]>([]);
    const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
    const [factoryLoading, setFactoryLoading] = useState(false);
    const [factorySaving, setFactorySaving] = useState(false);

    // Invoice number, product category, and document number for SRF
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [productCategory, setProductCategory] = useState<'RM' | 'FG' | 'GEN'>('GEN');
    const [srfDocumentNumber, setSrfDocumentNumber] = useState<string | null>(null);
    const [previewNumberLoading, setPreviewNumberLoading] = useState(false);
    const [invoiceSaving, setInvoiceSaving] = useState(false);
    const [docNumberSaving, setDocNumberSaving] = useState(false);

    // Fix: support both 'id' and 'assignment_id' 
    const assignmentData = widgetData?.assignmentData;
    const assignmentId = assignmentData?.assignment_id || assignmentData?.id;
    const serviceId = assignmentData?.service_id || ticketData?.service_id;
    const ticketId = assignmentData?.ticket_id || ticketData?.ticket_id;
    const isSRFService = serviceId === 6;




    useEffect(() => {
        if (assignmentId) {
            fetchDataRows();
        } else {
            console.log('📊 [DataExecutionTools] No assignmentId, stopping loading');
            setLoading(false);
        }
    }, [assignmentId]);

    // Fetch factory list and current selection for SRF service
    useEffect(() => {
        if (isSRFService && ticketId) {
            fetchFactories();
            fetchCurrentFactory();
        }
    }, [isSRFService, ticketId]);

    const fetchFactories = async () => {
        try {
            setFactoryLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_settings/factories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFactories(response.data.factories || []);
        } catch (error) {
            console.error('Error fetching factories:', error);
        } finally {
            setFactoryLoading(false);
        }
    };

    const fetchCurrentFactory = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/factory_id`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.value) {
                setSelectedFactoryId(parseInt(response.data.value));
            }
        } catch (error) {
            console.error('Error fetching current factory:', error);
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
            toast({ title: 'Success', description: 'Factory saved to work data' });
            // Fetch preview number after factory is saved
            if (productCategory) {
                fetchSRFPreviewNumber(selectedFactoryId, productCategory);
            }
        } catch (error) {
            console.error('Error saving factory:', error);
            toast({ title: 'Error', description: 'Failed to save factory', variant: 'destructive' });
        } finally {
            setFactorySaving(false);
        }
    };

    // Fetch existing invoice number and SRF document number from work_data
    const fetchSRFWorkData = async () => {
        if (!ticketId) return;
        try {
            const token = localStorage.getItem('tokek');
            // Fetch invoice number
            const invResponse = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/invoice_number`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (invResponse?.data?.value) {
                setInvoiceNumber(invResponse.data.value);
            }
            // Fetch product category
            const catResponse = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/product_category`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (catResponse?.data?.value) {
                setProductCategory(catResponse.data.value as 'RM' | 'FG' | 'GEN');
            }
            // Fetch SRF document number
            const docResponse = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/srf_document_number`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).catch(() => null);
            if (docResponse?.data?.value) {
                setSrfDocumentNumber(docResponse.data.value);
            }
        } catch (error) {
            console.error('Error fetching SRF work data:', error);
        }
    };

    // Fetch SRF preview number from backend
    const fetchSRFPreviewNumber = async (factoryId: number, category: string) => {
        try {
            setPreviewNumberLoading(true);
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/hots_settings/custom_functions/srf/preview_number`,
                {
                    params: { factory_id: factoryId, product_category: category },
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.data.success) {
                setSrfDocumentNumber(response.data.preview_number);
            }
        } catch (error) {
            console.error('Error fetching SRF preview number:', error);
        } finally {
            setPreviewNumberLoading(false);
        }
    };

    // Save invoice number
    const handleSaveInvoice = async () => {
        if (!ticketId) return;
        try {
            setInvoiceSaving(true);
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'invoice_number', field_value: invoiceNumber },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Success', description: 'Invoice number saved' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save invoice number', variant: 'destructive' });
        } finally {
            setInvoiceSaving(false);
        }
    };

    // Save product category and fetch new preview number
    const handleCategoryChange = async (newCategory: 'RM' | 'FG' | 'GEN') => {
        setProductCategory(newCategory);
        if (!ticketId) return;
        try {
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'product_category', field_value: newCategory },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Fetch new preview number
            if (selectedFactoryId) {
                fetchSRFPreviewNumber(selectedFactoryId, newCategory);
            }
        } catch (error) {
            console.error('Error saving product category:', error);
        }
    };

    // Save SRF document number (lock it)
    const handleSaveDocumentNumber = async () => {
        if (!ticketId || !srfDocumentNumber) return;
        try {
            setDocNumberSaving(true);
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'srf_document_number', field_value: srfDocumentNumber },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: 'Success', description: 'Document number saved: ' + srfDocumentNumber });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save document number', variant: 'destructive' });
        } finally {
            setDocNumberSaving(false);
        }
    };

    // Load SRF work data on mount
    useEffect(() => {
        if (isSRFService && ticketId) {
            fetchSRFWorkData();
        }
    }, [isSRFService, ticketId]);

    const fetchDataRows = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/assignment/${assignmentId}/data-rows`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRows(response.data.rows || []);
            setHistory(response.data.history || []);
        } catch (error) {
            console.error('Error fetching data rows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRow = async () => {
        if (!newLabel.trim()) {
            toast({ title: 'Error', description: 'Label is required', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('tokek');
            await axios.post(
                `${API_URL}/engine/assignment/${assignmentId}/data-row`,
                { label: newLabel, value: newValue, field_type: newType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: '✓ Added', description: `"${newLabel}" saved successfully` });
            setNewLabel('');
            setNewValue('');
            setNewType('text');
            setShowAddForm(false);
            fetchDataRows();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add row', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = (row: DataRow) => {
        setEditingId(row.id);
        setEditValue(row.value);
    };

    const handleSaveEdit = async (rowId: number) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('tokek');
            await axios.put(
                `${API_URL}/engine/assignment/${assignmentId}/data-row/${rowId}`,
                { value: editValue },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast({ title: '✓ Updated', description: 'Value saved successfully' });
            setEditingId(null);
            fetchDataRows();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    // Calculations - Only count quantities with units (pcs, ctn, qty, box, kg, unit)
    const calculations = useMemo(() => {
        // Regex to match quantities with units
        const quantityPattern = /(\d+(?:\.\d+)?)\s*(pcs|ctn|qty|box|kg|unit|ea|carton|pack|set)/i;

        const quantityRows = rows.filter(r => quantityPattern.test(r.value));

        // Extract numeric values from quantity strings
        const values = quantityRows.map(r => {
            const match = r.value.match(quantityPattern);
            return match ? parseFloat(match[1]) : 0;
        }).filter(v => v > 0);

        if (values.length === 0) return null;

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        // Get units used
        const units = [...new Set(quantityRows.map(r => {
            const match = r.value.match(quantityPattern);
            return match ? match[2].toLowerCase() : '';
        }).filter(Boolean))];

        return { sum, avg, max, min, count: values.length, units };
    }, [rows]);

    // Loading state with modern spinner
    if (loading) {
        return (
            <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-500 font-medium">Loading data...</p>
                </div>
            </div>
        );
    }

    // No assignment ID
    if (!assignmentId) {
        return (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
                <p className="text-orange-700">No assignment selected</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Modern Data Grid Card */}
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500 text-white">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Data Execution</h3>
                            <p className="text-xs text-slate-500">Manage and edit ticket data rows</p>
                        </div>
                    </div>
                </div>

                {/* Factory Selection for SRF Service (service_id=6) */}
                {isSRFService && (
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-amber-50 to-orange-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500 text-white">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">Factory Assignment</p>
                                    <p className="text-xs text-slate-500">Select factory for SRF document</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedFactoryId || ''}
                                    onChange={(e) => setSelectedFactoryId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[200px] focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                                    disabled={factoryLoading}
                                >
                                    <option value="">Select Factory...</option>
                                    {factories.map(f => (
                                        <option key={f.factory_id} value={f.factory_id}>
                                            {f.factory_name}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    onClick={handleSaveFactory}
                                    disabled={!selectedFactoryId || factorySaving}
                                    className="bg-amber-500 hover:bg-amber-600"
                                >
                                    {factorySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span className="ml-1">Set</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice Number Input for SRF */}
                {isSRFService && (
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500 text-white">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">Invoice Number</p>
                                    <p className="text-xs text-slate-500">Enter invoice reference</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Input
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    placeholder="INV-2026-001"
                                    className="w-48 h-9 text-sm"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleSaveInvoice}
                                    disabled={!invoiceNumber.trim() || invoiceSaving}
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    {invoiceSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span className="ml-1">Save</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Category for SRF */}
                {isSRFService && (
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500 text-white">
                                    <Database className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">Product Category</p>
                                    <p className="text-xs text-slate-500">RM = Raw Material, FG = Finished Goods</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(['RM', 'FG', 'GEN'] as const).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryChange(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${productCategory === cat
                                            ? 'bg-purple-500 text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-purple-50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SRF Document Number Preview */}
                {isSRFService && (
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500 text-white">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800 text-sm">SRF Document Number</p>
                                    <p className="text-xs text-slate-500">Auto-generated based on factory & category</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {previewNumberLoading ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Loading...</span>
                                    </div>
                                ) : srfDocumentNumber ? (
                                    <div className="px-4 py-2 bg-white border-2 border-green-300 rounded-lg font-mono text-green-700 font-semibold">
                                        {srfDocumentNumber}
                                    </div>
                                ) : (
                                    <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-400 text-sm">
                                        Select factory & category first
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSaveDocumentNumber}
                                    disabled={!srfDocumentNumber || docNumberSaving}
                                    className="bg-green-500 hover:bg-green-600"
                                >
                                    {docNumberSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span className="ml-1">Generate</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-slate-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Label</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Value</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Database className="w-10 h-10 opacity-30" />
                                            <p className="text-sm">No data rows yet</p>
                                            <p className="text-xs">Click "Add Row" to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-slate-700">{row.label}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === row.id ? (
                                                <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-9 max-w-xs border-blue-300 focus:border-blue-500"
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(row.id)}
                                                />
                                            ) : (
                                                <span className={`${row.field_type === 'number' ? 'font-mono text-blue-600 font-semibold' : 'text-slate-600'}`}>
                                                    {row.value || <span className="text-slate-300 italic">empty</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {editingId === row.id ? (
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => handleSaveEdit(row.id)}
                                                        disabled={saving}
                                                        className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleStartEdit(row)}
                                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Row Section */}
                <div className="px-4 py-3 border-t bg-slate-50">
                    {showAddForm ? (
                        <div className="p-4 bg-white rounded-lg border-2 border-dashed border-blue-200 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Label</Label>
                                    <Input
                                        placeholder="e.g. Quantity, Unit Price"
                                        value={newLabel}
                                        onChange={(e) => setNewLabel(e.target.value)}
                                        className="h-10"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">Value</Label>
                                    <Input
                                        placeholder="e.g. 100, 25.50"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className="h-10"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddRow()}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleAddRow} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Add Row
                                </Button>
                                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => setShowAddForm(true)}
                            className="w-full border-dashed hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Row
                        </Button>
                    )}
                </div>
            </div>

            {/* Calculations Panel - Modern Design (Only counts quantities with units) */}
            {calculations && (
                <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-emerald-800 text-sm">Quantity Calculations</span>
                        <Badge variant="outline" className="ml-auto text-xs bg-white">
                            {calculations.count} items ({calculations.units?.join(', ') || 'mixed'})
                        </Badge>
                    </div>
                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white/80 rounded-lg p-3 text-center shadow-sm border border-blue-100">
                            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Sum</p>
                            <p className="font-mono text-lg font-bold text-blue-600">{calculations.sum.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 text-center shadow-sm border border-green-100">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Average</p>
                            <p className="font-mono text-lg font-bold text-green-600">{calculations.avg.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 text-center shadow-sm border border-purple-100">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Max</p>
                            <p className="font-mono text-lg font-bold text-purple-600">{calculations.max.toLocaleString()}</p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-3 text-center shadow-sm border border-orange-100">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Min</p>
                            <p className="font-mono text-lg font-bold text-orange-600">{calculations.min.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit History - Modern Collapsible */}
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                    <CollapsibleTrigger asChild>
                        <div className="px-5 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-slate-700 text-sm">Edit History</span>
                                {history.length > 0 && (
                                    <Badge className="bg-slate-100 text-slate-600 text-xs">
                                        {history.length}
                                    </Badge>
                                )}
                            </div>
                            {historyOpen ?
                                <ChevronUp className="w-4 h-4 text-slate-400" /> :
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            }
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="border-t px-5 py-4">
                            {history.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No changes recorded yet</p>
                            ) : (
                                <div className="space-y-3 max-h-52 overflow-y-auto">
                                    {history.map((entry) => {
                                        const action = entry.changes.find(c => c.field === 'action')?.value || 'unknown';
                                        const before = entry.changes.find(c => c.field === 'before');
                                        const after = entry.changes.find(c => c.field === 'after');

                                        let beforeData: any = {};
                                        let afterData: any = {};
                                        try {
                                            if (before) beforeData = JSON.parse(before.value);
                                            if (after) afterData = JSON.parse(after.value);
                                        } catch { }

                                        return (
                                            <div key={entry.id} className="flex gap-3 text-sm border-l-2 border-blue-200 pl-3 py-1">
                                                <div className="flex-shrink-0 text-[10px] text-slate-400 font-mono mt-0.5">
                                                    {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">{entry.user_name}</span>
                                                    {action === 'add' && (
                                                        <span className="text-slate-600"> added <strong className="text-slate-800">{afterData.label}</strong>: <span className="text-green-600">{afterData.value}</span></span>
                                                    )}
                                                    {action === 'edit' && (
                                                        <span className="text-slate-600"> changed <strong className="text-slate-800">{beforeData.label}</strong>: <span className="line-through text-red-400">{beforeData.value}</span> → <span className="text-green-600 font-medium">{afterData.value}</span></span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
};

export default DataExecutionTools;
