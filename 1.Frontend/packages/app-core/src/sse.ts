/**
 * sse.ts — Server-Sent Events without a login token in the URL.
 *
 * Modes:
 *  - 'cookie' : EventSource with credentials; the httpOnly session cookie authenticates.
 *  - 'ticket' : POST <ticketPath> (cookie-authenticated) returns a short-lived,
 *               single-use ticket; it is the only thing placed in the URL.
 *
 * Backend contract for 'ticket' mode (to be implemented in Integrated-API):
 *   POST /sse/ticket  -> { success: true, data: { ticket: string, expires_in: number } }
 *   GET  /sse/stream?ticket=...   ticket TTL 30–60s, consumed on first use.
 */
import { useEffect, useRef } from 'react';
import type { AxiosInstance } from 'axios';
import { apiUrl } from './config';
import { unwrap } from './http';

export interface SSEOptions {
  baseUrl: string;
  http: AxiosInstance;
  mode?: 'cookie' | 'ticket';
  streamPath?: string;
  ticketPath?: string;
  /** Event names to listen to, e.g. ['par_data_changed']. 'message' is always included. */
  events?: string[];
  onEvent: (eventName: string, data: unknown) => void;
  onError?: (err: unknown) => void;
  /** Reconnect delay in ms (default 5000). */
  retryMs?: number;
}

function parse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function connectSSE(opts: SSEOptions): () => void {
  const { baseUrl, http, mode = 'cookie', streamPath = '/sse/stream', ticketPath = '/sse/ticket', events = [], onEvent, onError, retryMs = 5000 } = opts;
  let source: EventSource | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const open = async () => {
    if (closed) return;
    try {
      let url = apiUrl(baseUrl, streamPath);
      if (mode === 'ticket') {
        const res = await http.post(ticketPath);
        const { data } = unwrap<{ ticket: string }>(res.data);
        url += `?ticket=${encodeURIComponent(data.ticket)}`;
      }
      if (closed) return;
      source = new EventSource(url, { withCredentials: true });
      for (const name of ['message', ...events]) {
        source.addEventListener(name, (e) => onEvent(name, parse((e as MessageEvent).data)));
      }
      source.onerror = (err) => {
        onError?.(err);
        source?.close();
        source = null;
        if (!closed) retryTimer = setTimeout(open, retryMs); // new ticket on every reconnect
      };
    } catch (err) {
      onError?.(err);
      if (!closed) retryTimer = setTimeout(open, retryMs);
    }
  };

  void open();
  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    source?.close();
  };
}

/** React hook wrapper. `onEvent` may change between renders without reconnecting. */
export function useSSE(opts: SSEOptions & { enabled?: boolean }) {
  const handler = useRef(opts.onEvent);
  handler.current = opts.onEvent;
  const { enabled = true, baseUrl, mode, streamPath, ticketPath } = opts;
  const eventsKey = (opts.events ?? []).join(',');

  useEffect(() => {
    if (!enabled) return;
    return connectSSE({ ...opts, onEvent: (n, d) => handler.current(n, d) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, baseUrl, mode, streamPath, ticketPath, eventsKey]);
}
