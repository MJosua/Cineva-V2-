import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Edit3, Check, X, Search } from 'lucide-react';
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
    type?: 'text' | 'number' | 'date' | 'suggestion-insert';
    rounding?: number;
    // For suggestion-insert type
    api?: string;
    displayKey?: string;  // Key to display in dropdown (e.g., 'product_sku')
    valueKey?: string;    // Key to use as cell value (e.g., 'sku_id')
    searchable?: boolean;
    // Linked fields - when this column changes, also update these other columns
    linkedFields?: {
        targetKey: string;      // The column key to update (e.g., 'product_name')
        sourceKey: string;      // The key from selected option to use (e.g., 'product_name')
    }[];
}

interface ProductOption {
    sku_id: number;
    product_sku: string;
    product_name: string;
    product_desc?: string;
    per_carton?: number;
    [key: string]: any;
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

// Inline suggestion dropdown component for table cells
const SuggestionCell: React.FC<{
    value: string;
    options: ProductOption[];
    displayKey: string;
    valueKey: string;
    onSelect: (option: ProductOption) => void;
    onSearch: (query: string) => void;
    loading?: boolean;
    isChanged?: boolean;
}> = ({ value, options, displayKey, valueKey, onSelect, onSearch, loading, isChanged }) => {
    const [inputValue, setInputValue] = useState(String(value ?? ''));
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(String(value ?? ''));
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Client-side filtering - instant, no API calls needed
    const filteredOptions = React.useMemo(() => {
        if (!searchQuery.trim()) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(opt =>
            (opt.product_name?.toLowerCase().includes(query)) ||
            (opt.product_sku?.toLowerCase().includes(query))
        );
    }, [options, searchQuery]);

    // Reset highlight when filtered options change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filteredOptions]);

    // Calculate dropdown position when opening
    const openDropdown = () => {
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            const pos = {
                top: rect.bottom + 2,  // For fixed positioning, use viewport coords
                left: rect.left
            };
            setDropdownPos(pos);
        }
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSearchQuery(newValue);
        openDropdown();
    };

    // Keyboard navigation: Arrow Up/Down to navigate, Enter to select, Escape to close
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                openDropdown();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleSelect = (option: ProductOption) => {
        const displayValue = String(option[displayKey] ?? option[valueKey] ?? '');
        setInputValue(displayValue);
        setIsOpen(false);
        setHighlightedIndex(-1);
        onSelect(option);
    };

    return (
        <div ref={dropdownRef} className="relative">
            <div className="relative">
                <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={openDropdown}
                    onKeyDown={handleKeyDown}
                    className={`h-8 pr-8 border-transparent focus:border-emerald-500 bg-transparent ${isChanged ? 'font-bold text-emerald-700' : 'text-gray-600'
                        }`}
                    placeholder="Search..."
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                        <Search className="w-3 h-3 text-gray-400" />
                    )}
                    {isChanged && <Check className="w-3 h-3 text-emerald-500" />}
                </div>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div
                    className="fixed z-[9999] w-64 bg-white border border-gray-200 rounded-md shadow-xl max-h-48 overflow-auto"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                >
                    {filteredOptions.map((option, idx) => (
                        <div
                            key={`${option[valueKey]}-${idx}`}
                            className={`px-3 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-0 ${idx === highlightedIndex ? 'bg-emerald-100' : 'hover:bg-emerald-50'}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(option);
                            }}
                        >
                            <div className="font-medium text-gray-800">
                                {option.product_sku || option[displayKey]}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {option.product_name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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
    const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(false);

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

    // Fetch product options for suggestion-insert columns
    const searchProducts = useCallback(async (query: string) => {
        setOptionsLoading(true);
        try {
            // Find a column with suggestion-insert type to get the API endpoint
            const suggestionCol = config.columns?.find(col => col.type === 'suggestion-insert');
            console.log('🔍 DetailTableWidget: Looking for suggestion-insert column', {
                columns: config.columns,
                found: suggestionCol
            });

            if (!suggestionCol?.api) {
                console.warn('⚠️ No API configured for suggestion-insert column');
                return;
            }

            const apiPath = suggestionCol.api;
            // Load all products for client-side filtering (no search param needed)
            const url = apiPath.startsWith('http')
                ? `${apiPath}?limit=500`
                : `${API_URL}${apiPath}?limit=500`;
            const token = localStorage.getItem('tokek');

            console.log('📦 DetailTableWidget: Fetching products from', url);

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ DetailTableWidget: Got products', res.data);

            if (res.data && res.data.success) {
                setProductOptions(res.data.data || []);
            }
        } catch (err) {
            console.error('❌ Error fetching product options:', err);
        } finally {
            setOptionsLoading(false);
        }
    }, [config.columns]);

    // Load initial product options when component has suggestion-insert columns
    useEffect(() => {
        const hasSuggestionCol = config.columns?.some(col => col.type === 'suggestion-insert');
        console.log('🚀 DetailTableWidget mounted, checking for suggestion-insert:', {
            hasSuggestionCol,
            columns: config.columns
        });
        if (hasSuggestionCol) {
            searchProducts('');
        }
    }, [config.columns, searchProducts]);

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
            syncChangesToGlobal(updated);

            return updated;
        });
    }, [id, setGlobalValues, meta.so_id]);

    // Handle suggestion-insert selection with linked fields
    const handleSuggestionSelect = useCallback((
        rowIndex: number,
        col: ColumnConfig,
        selectedOption: ProductOption
    ) => {
        setRows(prev => {
            const updated = [...prev];
            const row = { ...updated[rowIndex] };

            // Get the value to store (using valueKey from config)
            const newValue = String(selectedOption[col.valueKey || 'sku_id'] ?? '');
            const originalValue = String(row._original?.[col.key] ?? '');

            // Update the primary field
            row[col.key] = newValue;
            row._changed = {
                ...row._changed,
                [col.key]: originalValue !== newValue
            };

            // Update linked fields if configured
            if (col.linkedFields && Array.isArray(col.linkedFields)) {
                col.linkedFields.forEach(link => {
                    const linkedValue = String(selectedOption[link.sourceKey] ?? '');
                    const linkedOriginal = String(row._original?.[link.targetKey] ?? '');

                    row[link.targetKey] = linkedValue;
                    row._changed = {
                        ...row._changed,
                        [link.targetKey]: linkedOriginal !== linkedValue
                    };
                });
            }

            updated[rowIndex] = row;

            // Sync changes to globalValues
            syncChangesToGlobal(updated);

            return updated;
        });
    }, [id, setGlobalValues, meta.so_id]);

    // Sync row changes to global values
    const syncChangesToGlobal = useCallback((updated: DetailRow[]) => {
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
            '_meta': {
                ...g['_meta'],
                so_id: meta.so_id,
                // Include analytics data from form fields
                distributor_id: g['distributor'],
                po_number: g['po_number'],
                client_id: meta.client_id
            }
        }));
    }, [id, setGlobalValues, meta.so_id, meta.client_id]);

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
                                                col.type === 'suggestion-insert' ? (
                                                    // Suggestion insert with dropdown for product selection
                                                    <SuggestionCell
                                                        value={String(row[col.displayKey || col.key] ?? '')}
                                                        options={productOptions}
                                                        displayKey={col.displayKey || 'product_sku'}
                                                        valueKey={col.valueKey || 'sku_id'}
                                                        onSelect={(option) => handleSuggestionSelect(rowIndex, col, option)}
                                                        onSearch={searchProducts}
                                                        loading={optionsLoading}
                                                        isChanged={isCellChanged(row, col.key)}
                                                    />
                                                ) : (
                                                    // Regular text/number input
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
                                                )
                                            ) : (
                                                <span
                                                    className={`block truncate max-w-[200px] ${isCellChanged(row, col.key) ? 'font-bold text-emerald-700' : ''}`}
                                                    title={String(row[col.key] ?? '')}
                                                >
                                                    {row[col.key] ?? '-'}
                                                    {isCellChanged(row, col.key) && (
                                                        <Check className="w-3 h-3 text-emerald-500 inline ml-1" />
                                                    )}
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
