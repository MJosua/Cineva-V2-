// widgets/SRFInvoiceInput.tsx
// Invoice input widget for SRF service (service_id = 6)
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WidgetProps } from '@/types/widgetTypes';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';
import { Receipt, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { CardCollapsible } from '@/components/ui/CardCollapsible';

const SRFInvoiceInput: React.FC<WidgetProps> = ({ ticketData, widgetData }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [currentInvoice, setCurrentInvoice] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const ticketId = widgetData?.assignmentData?.ticket_id || ticketData?.ticket_id;

    // Fetch current invoice number on mount
    useEffect(() => {
        if (ticketId) {
            fetchCurrentInvoice();
        } else {
            setLoading(false);
        }
    }, [ticketId]);

    const fetchCurrentInvoice = async () => {
        try {
            const token = localStorage.getItem('tokek');
            const response = await axios.get(
                `${API_URL}/engine/ticket/${ticketId}/work-data/invoice_number`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.value) {
                setCurrentInvoice(response.data.value);
                setInvoiceNumber(response.data.value);
            }
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveInvoice = async () => {
        if (!ticketId || !invoiceNumber.trim()) {
            toast({ title: 'Error', description: 'Invoice number is required', variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('tokek');

            await axios.post(
                `${API_URL}/engine/ticket/${ticketId}/work-data`,
                { field_name: 'invoice_number', field_value: invoiceNumber.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setCurrentInvoice(invoiceNumber.trim());
            toast({ title: 'Saved', description: 'Invoice number saved successfully' });
        } catch (error: any) {
            console.error('Error saving invoice:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to save invoice',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
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
        <CardCollapsible
            title="Invoice Number"
            description="Enter invoice for this SRF ticket"
            icon={Receipt}
            color="bg-green-500/10"
            defaultOpen
            className="border-green-200"
            headerExtra={
                currentInvoice && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Saved
                    </Badge>
                )
            }
        >
            <div className="space-y-3">
                <div>
                    <Label htmlFor="invoice" className="text-xs font-medium text-slate-600">Invoice Number</Label>
                    <Input
                        id="invoice"
                        placeholder="e.g. INV-2026-001234"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="mt-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveInvoice()}
                    />
                </div>
                <Button
                    onClick={handleSaveInvoice}
                    disabled={saving || !invoiceNumber.trim()}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                >
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Invoice
                        </>
                    )}
                </Button>
            </div>
        </CardCollapsible>
    );
};

export default SRFInvoiceInput;
