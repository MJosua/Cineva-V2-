/**
 * download.ts — fetch a file through the shared (cookie-auth) client and save it.
 * Replaces the two hand-written blob downloads in Event/src/services/eventEngineApi.js,
 * which read a token from localStorage. File name comes from Content-Disposition when present.
 */
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export function fileNameFromDisposition(header: string | null | undefined): string | null {
  if (!header) return null;
  const star = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
  const plain = header.match(/filename\s*=\s*"?([^";]+)"?/i);
  return plain ? plain[1].trim() : null;
}

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadFile(
  http: AxiosInstance,
  url: string,
  options: { fallbackName?: string; method?: 'get' | 'post'; data?: unknown; config?: AxiosRequestConfig } = {},
): Promise<string> {
  const { fallbackName = 'download', method = 'get', data, config } = options;
  const res = await http.request<Blob>({ url, method, data, responseType: 'blob', ...config });
  const name = fileNameFromDisposition(res.headers?.['content-disposition']) ?? fallbackName;
  saveBlob(res.data, name);
  return name;
}
