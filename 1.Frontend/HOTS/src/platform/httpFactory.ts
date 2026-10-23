import axios, { type AxiosInstance } from 'axios';

/** App-owned transport for the legacy Bearer contract. Upstream cookie factory is unchanged. */
export function createCinevaHttpClient(getBase: () => string, getToken: () => string | null): AxiosInstance {
  const http = axios.create();
  http.interceptors.request.use((request) => {
    const base = getBase().replace(/\/+$/, '');
    const url = request.url || '';
    if (/^(?:https?:)?\/\//i.test(url)) {
      const origin = new URL(base, globalThis.location?.origin || 'http://localhost');
      const target = new URL(url, origin);
      if (target.origin !== origin.origin) throw new Error('Cineva API client cannot send credentials to another origin');
    }
    request.baseURL = base;
    const token = getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    else request.headers.delete('Authorization');
    return request;
  });
  return http;
}
