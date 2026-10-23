import type {PortableStudio} from './model';
import {validatePortable} from './model';
import type {ContentState} from '../types';
/** File-protocol local storage with a session-only fallback, always exportable. */
export function createPortableStorage(initial:PortableStudio,storageId:string,notify:(message:string)=>void){
  let current=structuredClone(validatePortable(initial));const key=`cineva_portable_studio_${storageId}`;let persistent=true;
  try{const saved=localStorage.getItem(key);if(saved)current=validatePortable(JSON.parse(saved));}
  catch{persistent=false;notify('Penyimpanan browser tidak tersedia atau tidak valid. Perubahan tetap bisa dicoba pada sesi ini. Unduh HTML terbaru untuk menyimpannya.');}
  function persist(){if(!persistent)return;try{const data=JSON.stringify(current);localStorage.setItem(key,data);if(localStorage.getItem(key)!==data)throw new Error('readback');}catch{persistent=false;notify('Penyimpanan browser penuh atau diblokir. Unduh HTML terbaru agar perubahan tidak hilang.');}}
  return {
    snapshot:()=>structuredClone(current),
    replace(data:PortableStudio){current=structuredClone(validatePortable(data));persist();},
    forRole(role:'hq'|'creator'){return {get<T=unknown>(_name:string,fallback:T|null=null):T|null{return structuredClone(current.workspaces[role]) as T??fallback;},set(_name:string,value:unknown){const next=structuredClone(current);next.workspaces[role]=value as ContentState;validatePortable(next);current=next;persist();},remove(){current.workspaces[role]=structuredClone(initial.workspaces[role]);persist();}};},
  };
}
