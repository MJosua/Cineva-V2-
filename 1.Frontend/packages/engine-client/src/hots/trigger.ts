/**
 * @hots/engine-client — Trigger Function client
 * Head: src/index.ts
 * Source: HOTS/src/hooks/useTriggerFunction.ts (2026-10-06) — the fetch calls pulled out of the
 * React hooks so any app can use them. Same endpoints under `/hots_settings/trigger-functions`.
 */
import type { AxiosInstance } from 'axios';
import { createEngineCall } from '../core/request';

export interface TriggerFunction {
  function_id: number;
  function_key: string;
  function_name: string;
  function_type: 'sql' | 'handler' | 'template';
  category: string;
  description?: string;
  sql_params?: string[] | { name: string; type?: string; default?: any }[];
  is_active: boolean;
}

export interface ExecuteResult<T = any> {
  success: boolean;
  data?: T;
  rowCount?: number;
  message?: string;
  error?: string;
}

export interface TriggerFunctionFilter {
  category?: string;
  function_type?: TriggerFunction['function_type'];
  /** @deprecated Use function_type. The canonical key takes precedence. */
  type?: string;
  search?: string;
  is_active?: boolean | 'true' | 'false';
}

export interface TriggerFunctionCategory {
  category: string;
  count: number;
}

/** The legacy controller recognizes only the literal query string 'true' as active. */
export function normalizeTriggerFilter(filter: TriggerFunctionFilter = {}) {
  const { type, function_type, is_active, ...rest } = filter;
  return {
    ...rest,
    ...(function_type !== undefined || type !== undefined ? { function_type: function_type ?? type } : {}),
    ...(is_active !== undefined ? { is_active: String(is_active) } : {}),
  };
}

export function createTriggerClient(http: AxiosInstance, basePath = '/hots_settings/trigger-functions') {
  const call = createEngineCall(http, basePath, 'TRIGGER_API_ERROR');
  return {
    list: (filter: TriggerFunctionFilter = {}) => call<TriggerFunction[]>('get', '', { params: normalizeTriggerFilter(filter) }),
    categories: () => call<TriggerFunctionCategory[]>('get', '/categories'),
    details: (functionKey: string) => call<TriggerFunction>('get', `/${functionKey}`),
    /** Resolves with the full `{ success, data, rowCount }` body, like the original hook. */
    execute: <T = any>(functionKey: string, params: Record<string, any> = {}) =>
      call<ExecuteResult<T>>('post', `/${functionKey}/execute`, { data: { params }, raw: true }),
  };
}

export type TriggerClient = ReturnType<typeof createTriggerClient>;
