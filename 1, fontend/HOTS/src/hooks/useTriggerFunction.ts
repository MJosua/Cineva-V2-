import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '../config/sourceConfig';

interface TriggerFunction {
    function_id: number;
    function_key: string;
    function_name: string;
    function_type: 'sql' | 'handler' | 'template';
    category: string;
    description?: string;
    sql_params?: string[] | { name: string; type?: string; default?: any }[];
    is_active: boolean;
}

interface ExecuteResult<T = any> {
    success: boolean;
    data?: T;
    rowCount?: number;
    message?: string;
    error?: string;
}

interface UseTriggerFunctionOptions {
    autoExecute?: boolean;
    params?: Record<string, any>;
}

const API_BASE = `${API_URL}/hots_settings`;

/**
 * React Hook for using trigger functions
 * 
 * @example
 * // Auto-execute on mount
 * const { data, loading, error } = useTriggerFunction('get_ticket_summary', { 
 *   autoExecute: true, 
 *   params: { ticketId: '123' } 
 * });
 * 
 * @example
 * // Manual execution
 * const { execute, data, loading } = useTriggerFunction('update_work_data_field');
 * const handleSave = () => execute({ ticketId: '123', fieldName: 'status', newValue: 'done' });
 */
export function useTriggerFunction<T = any>(
    functionKey: string,
    options: UseTriggerFunctionOptions = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rowCount, setRowCount] = useState<number>(0);

    const execute = useCallback(async (params?: Record<string, any>): Promise<ExecuteResult<T>> => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/trigger-functions/${functionKey}/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('tokek')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ params: params || options.params || {} })
            });

            const result = await response.json();

            if (result.success) {
                setData(result.data);
                setRowCount(result.rowCount || 0);
                return { success: true, data: result.data, rowCount: result.rowCount };
            } else {
                setError(result.message || result.error);
                return { success: false, message: result.message, error: result.error };
            }
        } catch (err) {
            const errorMsg = (err as Error).message;
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [functionKey, options.params]);

    // Auto-execute on mount if enabled
    useEffect(() => {
        if (options.autoExecute) {
            execute(options.params);
        }
    }, [options.autoExecute]); // eslint-disable-line

    return {
        data,
        loading,
        error,
        rowCount,
        execute,
        refresh: () => execute(options.params)
    };
}

/**
 * Hook to get available trigger functions for pickers/dropdowns
 */
export function useTriggerFunctionList(filter?: { category?: string; type?: string }) {
    const [functions, setFunctions] = useState<TriggerFunction[]>([]);
    const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ is_active: 'true' });
                if (filter?.category) params.append('category', filter.category);
                if (filter?.type) params.append('function_type', filter.type);

                const [funcRes, catRes] = await Promise.all([
                    fetch(`${API_BASE}/trigger-functions?${params}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('tokek')}` }
                    }),
                    fetch(`${API_BASE}/trigger-functions/categories`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('tokek')}` }
                    })
                ]);

                const [funcData, catData] = await Promise.all([funcRes.json(), catRes.json()]);

                if (funcData.success) setFunctions(funcData.data);
                if (catData.success) setCategories(catData.data);
            } catch (err) {
                console.error('Failed to fetch trigger functions:', err);
            }
            setLoading(false);
        };

        fetchData();
    }, [filter?.category, filter?.type]);

    return { functions, categories, loading };
}

/**
 * Hook to get a single function's details (for building param forms)
 */
export function useTriggerFunctionDetails(functionKey: string | null) {
    const [func, setFunc] = useState<TriggerFunction | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!functionKey) {
            setFunc(null);
            return;
        }

        const fetchDetails = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE}/trigger-functions/${functionKey}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('tokek')}` }
                });
                const data = await response.json();
                if (data.success) {
                    // Parse sql_params if string
                    if (typeof data.data.sql_params === 'string') {
                        try {
                            data.data.sql_params = JSON.parse(data.data.sql_params);
                        } catch { }
                    }
                    setFunc(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch function details:', err);
            }
            setLoading(false);
        };

        fetchDetails();
    }, [functionKey]);

    return { func, loading };
}

export default useTriggerFunction;
