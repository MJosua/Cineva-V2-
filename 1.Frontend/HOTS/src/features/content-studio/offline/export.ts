import {download} from '../export';
import {safeJson,validatePortable,type PortableStudio} from './model';
export function portableHtml(data:PortableStudio){
  validatePortable(data);const html=document.documentElement.cloneNode(true) as HTMLElement,seed=html.querySelector('#cineva-studio-seed'),root=html.querySelector('#root');
  if(!seed||!root)throw new Error('Template demo mandiri tidak tersedia.');seed.textContent=safeJson(data);seed.setAttribute('data-storage-id',crypto.randomUUID());root.innerHTML='';html.querySelectorAll('[data-portable-temporary]').forEach(node=>node.remove());return '<!doctype html>\n'+html.outerHTML;
}
export function downloadPortable(data:PortableStudio){download(new Blob([portableHtml(data)],{type:'text/html;charset=utf-8'}),'Cineva-Demo-Terbaru.html');}
