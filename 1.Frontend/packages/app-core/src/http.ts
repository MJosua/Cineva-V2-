/**
 * @purpose Creates cookie-auth HTTP clients with exact-origin credential and CSRF boundaries.
 * http.ts — axios factory for cookie-only auth.
 *
 * Rules (shared-platform/06_identity_and_auth_standard.md):
 *  - Auth tokens live ONLY in httpOnly cookies. This client never reads or writes
 *    a token and never sets `Authorization: Bearer`.
 *  - `withCredentials: true` only for our API origins (third-party hosts untouched).
 *  - Mutating requests carry the double-submit CSRF header copied from the
 *    readable `csrf_token` cookie.
 *  - Responses in the standard envelope can be unwrapped with `unwrap()`.
 */
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { DEFAULT_CSRF_COOKIE, DEFAULT_CSRF_HEADER, type HotsCoreConfig } from './config';

const MUTATING = new Set(['post', 'put', 'patch', 'delete']);

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function isOurApi(url: string, baseURL: string | undefined, config: HotsCoreConfig): boolean {
  const page = typeof window !== 'undefined' ? window.location.href : undefined;
  try {
    const base = new URL(baseURL || config.baseUrl || page || '', page);
    const target = new URL(url, url.startsWith('//') && page ? page : base);
    if (!/^https?:$/.test(target.protocol)) return false;
    const origins = [config.baseUrl, ...(config.apiOrigins ?? []), page].filter(Boolean);
    return origins.some((origin) => {
      try {
        return target.origin === new URL(origin!, page).origin;
      } catch {
        return false;
      }
    });
  } catch {
    // Non-browser relative requests have no origin until the transport resolves them.
    return !page && !baseURL && !config.baseUrl && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url);
  }
}

export function createHttpClient(config: HotsCoreConfig): AxiosInstance {
  const client = axios.create({ baseURL: config.baseUrl || undefined });
  const csrfCookie = config.csrfCookieName ?? DEFAULT_CSRF_COOKIE;
  const csrfHeader = config.csrfHeaderName ?? DEFAULT_CSRF_HEADER;

  client.interceptors.request.use((req: InternalAxiosRequestConfig) => {
    if (!isOurApi(req.url ?? '', req.baseURL, config)) return req;

    req.withCredentials = true;
    // Correlation id (standard 11 §6): one id per request, echoed in logs / Problem Details trace_id.
    if (!req.headers.get?.(REQUEST_ID_HEADER)) req.headers.set(REQUEST_ID_HEADER, newRequestId());
    // Cookie-only auth: drop any Bearer a caller may still try to send.
    req.headers.delete?.('Authorization');

    if (MUTATING.has((req.method ?? 'get').toLowerCase())) {
      const csrf = readCookie(csrfCookie);
      if (csrf) req.headers.set(csrfHeader, csrf);
    }
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) config.onUnauthorized?.();
      // Attach a normalized ApiError (RFC 9457 aware) without changing the rejected value type.
      if (error && typeof error === 'object') (error as { apiError?: ApiError }).apiError = toApiError(error);
      return Promise.reject(error);
    },
  );

  return client;
}

/** Standard API envelope: { success, data, message, pagination, errors? } */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages?: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  errors?: Array<{ code: string; message: string; field?: string }>;
}

export class ApiError extends Error {
  code?: string;
  errors?: ApiEnvelope<unknown>['errors'];
  /** HTTP status (0 = network error). Added 0.5.0. */
  status?: number;
  /** Correlation id from Problem Details `trace_id` or the X-Request-Id response header. Added 0.5.0. */
  traceId?: string;
  /** Problem Details `type` URI / `details` object, when the server sent them. Added 0.5.0. */
  type?: string;
  details?: unknown;

  constructor(message: string, code?: string, errors?: ApiEnvelope<unknown>['errors'], extra: { status?: number; traceId?: string; type?: string; details?: unknown } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
    this.status = extra.status;
    this.traceId = extra.traceId;
    this.type = extra.type;
    this.details = extra.details;
  }
}

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Random correlation id (crypto.randomUUID when available). */
export function newRequestId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'req-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/** RFC 9457 Problem Details body (+ HOTS `code`, `errors`, `trace_id`). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: ApiEnvelope<unknown>['errors'];
  details?: unknown;
  trace_id?: string;
}

export function isProblemDetails(body: unknown): body is ProblemDetails {
  return Boolean(body && typeof body === 'object' && ('title' in body || 'type' in body) && ('status' in body || 'detail' in body));
}

/**
 * Normalizes any failure (axios error, Problem Details, legacy { success:false, message }, network) into ApiError.
 * Use in UI: `catch (e) { const err = toApiError(e); toast.error(err.message + (err.traceId ? ' (' + err.traceId + ')' : '')) }`
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const e = error as { response?: { status?: number; data?: unknown; headers?: Record<string, string> }; message?: string };
  const status = e?.response?.status ?? 0;
  const body = e?.response?.data as Record<string, unknown> | undefined;
  const headerTrace = e?.response?.headers?.['x-request-id'];
  if (isProblemDetails(body)) {
    const pd = body as ProblemDetails;
    return new ApiError(String(pd.detail ?? pd.title ?? 'Request failed'), pd.code, pd.errors, {
      status: pd.status ?? status, traceId: pd.trace_id ?? headerTrace, type: pd.type, details: pd.details,
    });
  }
  if (body && typeof body === 'object' && 'success' in body) {
    const env = body as unknown as ApiEnvelope<unknown> & { code?: string };
    return new ApiError(env.message ?? 'Request failed', env.code ?? env.errors?.[0]?.code, env.errors, { status, traceId: headerTrace });
  }
  return new ApiError(e?.message ?? 'Network error', status ? 'HTTP_' + status : 'NETWORK_ERROR', undefined, { status, traceId: headerTrace });
}

/** Unwraps the standard envelope; also tolerates legacy `{ data }` / raw payloads. */
export function unwrap<T>(payload: unknown): { data: T; pagination?: Pagination; message?: string } {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const env = payload as ApiEnvelope<T>;
    if (!env.success) {
      if (isProblemDetails(payload)) throw toApiError({ response: { status: (payload as ProblemDetails).status, data: payload } });
      throw new ApiError(env.message ?? 'Request failed', env.errors?.[0]?.code, env.errors);
    }
    return { data: env.data, pagination: env.pagination, message: env.message };
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return { data: (payload as { data: T }).data };
  }
  return { data: payload as T };
}

/** Standard list params: page + limit (max 100), sort/order. */
export const MAX_PAGE_SIZE = 100;

export function listParams(p: { page?: number; limit?: number; sort?: string; order?: 'asc' | 'desc' } = {}) {
  return {
    page: Math.max(1, p.page ?? 1),
    limit: Math.min(MAX_PAGE_SIZE, Math.max(1, p.limit ?? 50)),
    ...(p.sort ? { sort: p.sort, order: p.order ?? 'asc' } : {}),
  };
}
