import type {AxiosInstance} from 'axios';
import {createEngineCall,EngineApiError} from './core/request';
/** Additive client. Auth/CSRF from injected app-core transport; context never persisted. */
export function createContentClient(http:AxiosInstance,{context,basePath='/api/content/v1'}:{context:()=>string|null;basePath?:string}){
  if(!/^\/api(?:\/[a-z0-9_-]+)+$/i.test(basePath))throw new Error('Invalid content API path');
  const call=createEngineCall(http,basePath);
  async function request<T>(path:string,body?:unknown):Promise<T>{const before=context();if(!before)throw new EngineApiError(403,'CONTENT_CONTEXT_REQUIRED','Pilih workspace terlebih dahulu.');const result=await call<T>(body===undefined?'get':'post',path,{data:body,headers:{'X-Workspace-Context':before}});if(context()!==before)throw new EngineApiError(409,'STALE_CONTENT_CONTEXT','Workspace berubah. Muat ulang data.');return result;}
  return {creatorInfo:(accountId:string)=>request<{privacy_level_options:string[]}>('/accounts/creator-info',{accountId}),read:<T>()=>request<T>('/workspace'),command:<T>(body:unknown)=>request<T>('/commands',body),generate:<T>(body:unknown)=>request<T>('/generate',body),render:<T>(body:unknown)=>request<T>('/render',body),insight:<T>(body:unknown)=>request<T>('/insights/ai',body),sync:()=>request('/insights/sync',{}),reconcile:(targetId:string)=>request('/reconcile',{targetId}),begin:(provider:string,binding:string)=>request<{url:string}>('/accounts/begin',{provider,binding}),finish:(body:unknown)=>request('/accounts/finish',body)};
}
