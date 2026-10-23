import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowRight, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface DiffWidgetProps {
    config: {
        api_source: string;
        trigger_field: string;
        auto_lock_old: boolean;
    };
    globalValues: Record<string, any>;
    setGlobalValues: (values: any) => void;
    id: string; // The widget ID (e.g. widget-diff)
}

interface DiffRow {
    field_name: string;
    old_value: string;
    new_value: string;
    is_changed: boolean;
}

export const DiffWidget: React.FC<DiffWidgetProps> = ({ config, globalValues, setGlobalValues, id }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<DiffRow[]>([]);

    // Watch the trigger field (e.g., 'record_id')
    const rawTriggerValue = globalValues[config.trigger_field];

    // Extract string value from object/array if needed (suggestion-insert fields can return objects or arrays)
    const triggerValue: string | undefined = (() => {
        if (!rawTriggerValue) return undefined;
        if (typeof rawTriggerValue === 'string') return rawTriggerValue;

        // Handle arrays - find first non-empty value
        if (Array.isArray(rawTriggerValue)) {
            const firstValid = rawTriggerValue.find((v: any) => {
                if (typeof v === 'string' && v.trim()) return true;
                if (typeof v === 'object' && v && (v.value || v.label || v.po_number)) return true;
                return false;
            });
            if (!firstValid) return undefined;
            if (typeof firstValid === 'string') return firstValid;
            return firstValid.value || firstValid.label || firstValid.po_number || String(firstValid);
        }

        // Handle objects
        if (typeof rawTriggerValue === 'object') {
            return rawTriggerValue.value || rawTriggerValue.label || rawTriggerValue.po_number || String(rawTriggerValue);
        }
        return String(rawTriggerValue);
    })();

    useEffect(() => {
        if (!triggerValue) {
            setRows([]); // Clear if no ID
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                // Determine API URL - use query parameter instead of path segment (handles slashes in PO numbers)
                let apiPath = config.api_source.replace('${trigger_field}', encodeURIComponent(triggerValue));

                // If api_source doesn't contain the triggerValue, append it as a query parameter
                if (!apiPath.includes(encodeURIComponent(triggerValue)) && !apiPath.includes(triggerValue)) {
                    // Use query parameter format (safer for values with special characters like slashes)
                    const separator = apiPath.includes('?') ? '&' : '?';
                    apiPath = `${config.api_source}${separator}po_number=${encodeURIComponent(triggerValue)}`;
                }

                // Ensure the URL starts with API_URL
                const url = apiPath.startsWith('http') ? apiPath : `${API_URL}${apiPath}`;

                const token = localStorage.getItem('hots_tokek');

                // MOCK DATA for now until backend is ready
                // Remove this block when backend is real
                /*
                await new Promise(r => setTimeout(r, 1000));
                const mockData = [
                    { field_name: "PO Number", old_value: triggerValue, new_value: triggerValue },
                    { field_name: "Supplier", old_value: "Indofood CBP", new_value: "Indofood CBP" },
                    { field_name: "Order Date", old_value: "2024-01-01", new_value: "2024-01-01" },
                    { field_name: "Total Amount", old_value: "5000.00", new_value: "5000.00" },
                    { field_name: "Status", old_value: "Open", new_value: "Open" }
                ];
                setRows(mockData.map(r => ({ ...r, is_changed: false })));
                setLoading(false);
                return;
                */
                // END MOCK

                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.success) {
                    const apiRows = res.data.data.map((item: any) => ({
                        field_name: item.field || item.key,
                        old_value: String(item.value || item.old_val || ''),
                        new_value: String(item.value || item.old_val || ''),
                        is_changed: false
                    }));
                    setRows(apiRows);

                    // Sync meta (so_id) to global values for DetailTableWidget to use
                    if (res.data.meta) {
                        setGlobalValues((g: any) => ({
                            ...g,
                            '_meta': { ...g['_meta'], ...res.data.meta },
                            'so_id': res.data.meta.so_id  // Also set so_id directly for trigger_field
                        }));
                    }
                } else {
                    toast({ title: "No Data Found", description: "Could not load record details.", variant: "destructive" });
                }

            } catch (e) {
                console.error(e);
                toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchData, 800); // Debounce
        return () => clearTimeout(timeout);
    }, [triggerValue, config.api_source]);

    const handleEdit = (index: number, val: string) => {
        setRows(prev => {
            const next = [...prev];
            next[index].new_value = val;
            next[index].is_changed = next[index].old_value !== val;

            // Sync to Global Values (The Widget saves its state to the form payload)
            // We save it as a structured JSON in the widget's ID
            setGlobalValues((g: any) => ({
                ...g,
                [id]: next.filter(r => r.is_changed) // Only save CHANGED rows
            }));

            return next;
        });
    };

    return (
        <Card className="border-l-4 border-l-blue-500 bg-slate-50">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "📊 Analysis Mode"}
                    {triggerValue && <span className="ml-auto text-xs text-gray-400">Ref: {triggerValue}</span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 border-b">
                            <tr>
                                <th className="text-left py-2 px-4 w-1/3">Field Name</th>
                                <th className="text-left py-2 px-4 w-1/3">Original Value</th>
                                <th className="text-left py-2 px-4 w-1/3">Proposed Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={3} className="text-center py-8 text-gray-400">
                                        Enter a Record ID to load data
                                    </td>
                                </tr>
                            )}
                            {rows.map((row, i) => (
                                <tr key={i} className={`border-b border-gray-100 last:border-0 hover:bg-white transition-colors ${row.is_changed ? 'bg-yellow-50' : ''}`}>
                                    <td className="py-2 px-4 font-medium text-gray-700">{row.field_name}</td>
                                    <td className="py-2 px-4 text-gray-500 bg-gray-50/50 relative group">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate max-w-[200px] block" title={row.old_value || "(empty)"}>
                                                {row.old_value || <span className="italic text-gray-300">empty</span>}
                                            </span>
                                            {config.auto_lock_old && <Lock className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />}
                                        </div>
                                    </td>
                                    <td className="py-1 px-2 relative">
                                        <Input
                                            value={row.new_value}
                                            onChange={e => handleEdit(i, e.target.value)}
                                            className={`h-8 border-transparent focus:border-blue-500 bg-transparent ${row.is_changed ? 'font-bold text-blue-700' : 'text-gray-600'}`}
                                        />
                                        {row.is_changed && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded shadow-sm border border-yellow-200">
                                                Changed
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
