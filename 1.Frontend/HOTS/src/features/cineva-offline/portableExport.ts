import type { DemoData } from './model';
import { validateData } from './validation';
export const safeJson = (data: DemoData) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export function downloadFile(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime })), link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportHtml(data: DemoData) {
  validateData(data);
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const seed = clone.querySelector('#demo-seed'), root = clone.querySelector('#root');
  if (!seed || !root) throw new Error('Template HTML tidak tersedia.');
  seed.textContent = safeJson(data); seed.setAttribute('data-storage-id', crypto.randomUUID());
  root.innerHTML = ''; clone.querySelectorAll('[data-temporary]').forEach(node => node.remove());
  return '<!doctype html>\n' + clone.outerHTML;
}
