import axios from 'axios';
import { createNotificationClient } from '@hots/app-core/notifications';
import { API_URL } from '@/config/sourceConfig';

// Legacy auth stays at the host boundary; generic package never reads browser tokens.
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('hots_tokek')}` });
const response = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || (value as { success?: unknown }).success !== true) throw new Error('Notification request failed.');
  return value as Record<string, unknown>;
};
export const notificationEvents = ['approval_needed', 'ticket_approved', 'ticket_rejected', 'new_comment', 'task_assigned', 'doc_generation_complete'];
export const notificationSignal = 'hots:notification';
export function createLegacyNotificationClient<T>() {
  return createNotificationClient<T>({
    http: {
      get: async path => (await axios.get(`${API_URL}${path}`, { headers: headers() })).data,
      post: async (path, body) => (await axios.post(`${API_URL}${path}`, body, { headers: headers() })).data,
    },
    routes: { list: '/hots_notifications', unread: '/hots_notifications/unread_count', read: id => `/hots_notifications/read/${encodeURIComponent(id)}`, readAll: '/hots_notifications/read_all' },
    decode: {
      list: value => (response(value).data ?? []) as T[],
      unread: value => (response(value).unread_count ?? 0) as number,
      acknowledge: value => { response(value); },
    },
  });
}
