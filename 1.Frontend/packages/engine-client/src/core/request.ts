/**
 * @hots/engine-client — shared request core for every engine client.
 * Head: src/index.ts (createEngineClient)
 * Based on: form/src/formApi.ts `request` + FormApiError, Event/src/services/eventEngineApi.js `apiFetch`
 * (2026-10-06). Auth belongs to the injected Axios transport; this core never reads token storage.
 */
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

/** Error shape shared by all engines: `{ success:false, error:{ code, message, details } }` or `{ message }`. */
export class EngineApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  /** Correlation id (Problem Details trace_id / X-Request-Id). Added 0.2.0. */
  traceId?: string;
  /** Field errors from Problem Details `errors[]`. Added 0.2.0. */
  errors?: Array<{ field?: string; code?: string; message?: string }>;

  constructor(status: number, code: string, message: string, details?: unknown, extra: { traceId?: string; errors?: EngineApiError['errors'] } = {}) {
    super(message);
    this.name = 'EngineApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = extra.traceId;
    this.errors = extra.errors;
  }
}

export interface EngineCallOptions {
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Return the whole body instead of unwrapping `data`. */
  raw?: boolean;
  config?: AxiosRequestConfig;
}

export type EngineCall = <T>(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, options?: EngineCallOptions) => Promise<T>;

function cleanParams(params?: Record<string, unknown>) {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

/** Creates a caller bound to one engine base path, e.g. '/api/event-engine'. */
export function createEngineCall(http: AxiosInstance, basePath: string, errorCode = 'ENGINE_API_ERROR'): EngineCall {
  const base = basePath.replace(/\/+$/, '');
  return async <T>(method: Parameters<EngineCall>[0], path: string, options: EngineCallOptions = {}) => {
    try {
      const res = await http.request({
        method,
        url: `${base}${path}`,
        data: options.data,
        params: cleanParams(options.params),
        headers: options.headers,
        ...options.config,
      });
      const body = res.data as { success?: boolean; data?: T; error?: { code?: string; message?: string; details?: unknown }; message?: string };
      if (body && typeof body === 'object' && body.success === false) {
        const b = body as typeof body & { code?: string; detail?: string; details?: unknown; trace_id?: string; errors?: EngineApiError['errors'] };
        throw new EngineApiError(res.status, b.error?.code || b.code || errorCode, b.error?.message || b.detail || b.message || 'Request failed', b.error?.details ?? b.details, {
          traceId: b.trace_id,
          errors: Array.isArray(b.errors) ? b.errors : undefined,
        });
      }
      if (options.raw) return body as T;
      return (body && typeof body === 'object' && 'data' in body ? body.data : body) as T;
    } catch (err: any) {
      if (err instanceof EngineApiError) throw err;
      const status = err?.response?.status ?? 0;
      const body = err?.response?.data ?? {};
      // Legacy { error: { code, message, details } } and RFC 9457 { title, detail, code, errors, details, trace_id } both supported.
      throw new EngineApiError(
        status,
        body.error?.code || body.code || (status === 401 ? 'SESSION_EXPIRED' : errorCode),
        body.error?.message || body.detail || body.message || body.title || err?.message || `Request failed (${status})`,
        body.error?.details ?? body.details,
        { traceId: body.trace_id ?? err?.response?.headers?.['x-request-id'], errors: Array.isArray(body.errors) ? body.errors : undefined },
      );
    }
  };
}

/** Builds `FormData` with a single file field. */
export function fileForm(file: File, field = 'file', extra: Record<string, string> = {}): FormData {
  const body = new FormData();
  body.append(field, file);
  for (const [k, v] of Object.entries(extra)) body.append(k, v);
  return body;
}
