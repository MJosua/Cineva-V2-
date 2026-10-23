import { useState, useCallback, useEffect } from 'react';
import type { TriggerFunction, TriggerFunctionCategory, TriggerFunctionFilter, ExecuteResult } from '@hots/engine-client';
import { cinevaEngines } from '@/platform/clients';

interface UseTriggerFunctionOptions { autoExecute?: boolean; params?: Record<string, any> }

export function useTriggerFunction<T = any>(functionKey: string, options: UseTriggerFunctionOptions = {}) {
  const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null), [rowCount, setRowCount] = useState(0);
  const execute = useCallback(async (params?: Record<string, any>): Promise<ExecuteResult<T>> => {
    setLoading(true); setError(null);
    try {
      const result = await cinevaEngines.trigger.execute<T>(functionKey, params || options.params || {});
      setData(result.data ?? null); setRowCount(result.rowCount || 0); return result;
    } catch (failure) {
      const message = (failure as Error).message; setError(message); return { success: false, message, error: message };
    } finally { setLoading(false); }
  }, [functionKey, options.params]);
  useEffect(() => { if (options.autoExecute) void execute(options.params); }, [options.autoExecute]);
  return { data, loading, error, rowCount, execute, refresh: () => execute(options.params) };
}

export function useTriggerFunctionList(filter?: TriggerFunctionFilter) {
  const [functions, setFunctions] = useState<TriggerFunction[]>([]);
  const [categories, setCategories] = useState<TriggerFunctionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true; setLoading(true);
    const parameters: TriggerFunctionFilter = { ...filter, is_active: filter?.is_active ?? true };
    void Promise.all([cinevaEngines.trigger.list(parameters), cinevaEngines.trigger.categories()])
      .then(([list, groups]) => { if (alive) { setFunctions(list); setCategories(groups); } })
      .catch(() => undefined).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filter?.category, filter?.type, filter?.function_type, filter?.search, filter?.is_active]);
  return { functions, categories, loading };
}

export function useTriggerFunctionDetails(functionKey: string | null) {
  const [func, setFunc] = useState<TriggerFunction | null>(null), [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!functionKey) { setFunc(null); return; }
    setLoading(true);
    void cinevaEngines.trigger.details(functionKey).then(result => {
      if (typeof result.sql_params === 'string') { try { result.sql_params = JSON.parse(result.sql_params); } catch {} }
      if (alive) setFunc(result);
    }).catch(() => undefined).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [functionKey]);
  return { func, loading };
}
export default useTriggerFunction;
