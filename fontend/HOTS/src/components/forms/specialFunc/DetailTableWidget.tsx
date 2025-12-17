import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit3, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API_URL } from '@/config/sourceConfig';

interface DetailTableWidgetProps {
    config: {
        api_source: string;
        trigger_field: string;
        columns: ColumnConfig[];
    };
    globalValues: Record<string, any>;
    setGlobalValues: (values: any) => void;
    id: string;
}

interface ColumnConfig {
    key: string;
    label: string;
    editable: boolean;
    type?: 'text' | 'number' | 'date';
    rounding?: number;
}

interface DetailRow {
    detail_nr: number;
    [key: string]: any;
    _original?: Record<string, any>;
    _changed?: Record<string, boolean>;
}

interface DetailChange {
    detail_nr: number;
    field_name: string;
    old_value: string;
    new_value: string;
}

export const DetailTableWidget: React.FC<DetailTableWidgetProps> = ({
    config,
    globalValues,
    setGlobalValues,
    id
}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<DetailRow[]>([]);
    const [meta, setMeta] = useState<{ so_id?: string | number }>({});

    // Watch the trigger field (e.g., 'so_id' from meta, or derived from po_number)
    const triggerValue = globalValues[config.trigger_field] || globalValues['_meta']?.so_id;

    // Fetch data when trigger value changes
    useEffect(() => {
        if (!triggerValue) {
            setRows([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const apiPath = `${config.api_source}/${triggerValue}`;
                const url = apiPath.startsWith('http') ? apiPath : `${API_URL}${apiPath}`;
                const token = localStorage.getItem('tokek');

                const res = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data && res.data.success) {
                    // Add original values and change tracking
                    const dataWithTracking = res.data.data.map((row: any) => ({
                        ...row,
                        _original: { ...row },
                        _changed: {}
                    }));
                    setRows(dataWithTracking);
                    setMeta(res.data.meta || {});
                } else {
                    toast({
                        title: "No Data Found",
                        description: res.data.message || "Could not load line items.",
                        variant: "destructive"
                    });
                    setRows([]);
                }
            } catch (e: any) {
                console.error('DetailTableWidget fetch error:', e);
                toast({
                    title: "Error",
                    description: e.message || "Failed to load data.",
                    variant: "destructive"
                });
                setRows([]);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(fetchData, 500);
        return () => clearTimeout(timeout);
    }, [triggerValue, config.api_source]);

    // Handle cell edit
    const handleEdit = useCallback((rowIndex: number, fieldKey: string, newValue: string) => {
        setRows(prev => {
            const updated = [...prev];
            const row = { ...updated[rowIndex] };
            const originalValue = String(row._original?.[fieldKey] ?? '');

            // Update value
            row[fieldKey] = newValue;

            // Track if changed from original
            row._changed = {
                ...row._changed,
                [fieldKey]: originalValue !== newValue
            };

            updated[rowIndex] = row;

            // Sync changes to globalValues
            const changes: DetailChange[] = [];
            updated.forEach(r => {
                if (r._changed) {
                    Object.keys(r._changed).forEach(key => {
                        if (r._changed![key]) {
                            changes.push({
                                detail_nr: r.detail_nr,
                                field_name: key,
                                old_value: String(r._original?.[key] ?? ''),
                                new_value: String(r[key] ?? '')
                            });
                        }
                    });
                }
            });

            setGlobalValues((g: any) => ({
                ...g,
                [id]: changes,
                [`${id}_rows`]: updated,
                '_meta': { ...g['_meta'], so_id: meta.so_id }
            }));

            return updated;
        });
    }, [id, setGlobalValues, meta.so_id]);

    // Check if any cell in row is changed
    const isRowChanged = (row: DetailRow) => {
        return row._changed && Object.values(row._changed).some(v => v);
    };

    // Check if specific cell is changed
    const isCellChanged = (row: DetailRow, key: string) => {
        return row._changed?.[key] === true;
    };

    // Get column config
    const columns = config.columns || [
        { key: 'product_sku', label: 'SKU', editable: false },
        { key: 'product_name', label: 'Product', editable: false },
        { key: 'quantity', label: 'Qty', editable: true, type: 'number' },
        { key: 'value', label: 'Price', editable: true, type: 'number' },
        { key: 'disc', label: 'Discount', editable: true, type: 'number' }
    ];

    return (
        <Card className="border-l-4 border-l-emerald-500 bg-slate-50">
            <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-emerald-700">
                    {loading ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                        <Edit3 className="w-4 h-4" />
                    )}
                    Line Items Editor
                    {rows.length > 0 && (
                        <span className="ml-auto text-xs text-gray-400">
                            {rows.length} items | SO: {meta.so_id || 'N/A'}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 border-b">
                            <tr>
                                <th className="text-left py-2 px-3 w-12">#</th>
                                {columns.map(col => (
                                    <th key={col.key} className="text-left py-2 px-3">
                                        {col.label}
                                        {col.editable && (
                                            <span className="ml-1 text-xs text-emerald-500">✎</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">
                                        Select a PO Number to load line items
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={columns.length + 1} className="text-center py-8">
                                        <Loader2 className="animate-spin w-6 h-6 mx-auto text-emerald-500" />
                                    </td>
                                </tr>
                            )}
                            {rows.map((row, rowIndex) => (
                                <tr
                                    key={row.detail_nr}
                                    className={`border-b border-gray-100 last:border-0 hover:bg-white transition-colors ${isRowChanged(row) ? 'bg-yellow-50' : ''
                                        }`}
                                >
                                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">
                                        {row.detail_nr}
                                    </td>
                                    {columns.map(col => (
                                        <td
                                            key={col.key}
                                            className={`py-1 px-2 ${!col.editable ? 'bg-gray-50/50 text-gray-600' : ''
                                                } ${isCellChanged(row, col.key) ? 'bg-yellow-100' : ''
                                                }`}
                                        >
                                            {col.editable ? (
                                                <div className="relative">
                                                    <Input
                                                        type={col.type === 'number' ? 'number' : 'text'}
                                                        value={String(row[col.key] ?? '')}
                                                        onChange={e => handleEdit(rowIndex, col.key, e.target.value)}
                                                        className={`h-8 border-transparent focus:border-emerald-500 bg-transparent ${isCellChanged(row, col.key)
                                                                ? 'font-bold text-emerald-700'
                                                                : 'text-gray-600'
                                                            }`}
                                                        step={col.type === 'number' ? 'any' : undefined}
                                                    />
                                                    {isCellChanged(row, col.key) && (
                                                        <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                            <Check className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="block truncate max-w-[200px]" title={String(row[col.key] ?? '')}>
                                                    {row[col.key] ?? '-'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Changes Summary */}
                {rows.some(isRowChanged) && (
                    <div className="p-3 bg-yellow-50 border-t border-yellow-200">
                        <div className="text-xs text-yellow-700 font-medium flex items-center gap-2">
                            <span>⚠️ You have unsaved changes in {rows.filter(isRowChanged).length} row(s)</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DetailTableWidget;
