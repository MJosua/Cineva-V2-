/** Generic inbox HTTP client. Hosts own routes, response shape and authentication. */
export interface NotificationHttpPort {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
}
export interface NotificationClientOptions<T> {
  http: NotificationHttpPort;
  routes: { list: string; unread: string; read(id: string): string; readAll: string };
  decode: { list(response: unknown): T[]; unread(response: unknown): number; acknowledge(response: unknown): void };
}
export function createNotificationClient<T>({ http, routes, decode }: NotificationClientOptions<T>) {
  return {
    async list(): Promise<T[]> {
      const rows = decode.list(await http.get(routes.list));
      if (!Array.isArray(rows)) throw new TypeError('Invalid notification list.');
      return structuredClone(rows);
    },
    async unreadCount(): Promise<number> {
      const count = decode.unread(await http.get(routes.unread));
      if (!Number.isSafeInteger(count) || count < 0) throw new TypeError('Invalid unread count.');
      return count;
    },
    async markRead(id: string): Promise<void> {
      if (typeof id !== 'string' || !id.trim()) throw new TypeError('Notification ID required.');
      decode.acknowledge(await http.post(routes.read(id), {}));
    },
    async markAllRead(): Promise<void> { decode.acknowledge(await http.post(routes.readAll, {})); },
  };
}
/** Named SSE events are not delivered to onmessage. Subscribe without replacing other listeners. */
export function subscribeNotificationEvents(
  source: Pick<EventSource, 'addEventListener' | 'removeEventListener'>,
  events: readonly string[],
  onEvent: (eventName: string, payload: unknown) => void,
  onError?: (error: unknown) => void,
): () => void {
  const listeners = [...new Set(['message', ...events])].map(name => {
    const handler: EventListener = event => {
      try { onEvent(name, JSON.parse((event as MessageEvent).data)); }
      catch (error) { onError?.(error); }
    };
    source.addEventListener(name, handler);
    return { name, handler };
  });
  return () => listeners.forEach(({ name, handler }) => source.removeEventListener(name, handler));
}
