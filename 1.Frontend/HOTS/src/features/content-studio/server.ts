import {createContentClient} from '@hots/engine-client';
import type {AxiosInstance} from 'axios';
import type {StudioPort,ContentState} from './types';
import type {ContentDocument,RenderManifest} from '@hots/content-kit';
export function createServerStudio(http:AxiosInstance,context:()=>string|null):StudioPort{
  const client=createContentClient(http,{context});
  return {mode:'server',creatorInfo:client.creatorInfo,insight:filter=>client.insight({filter,key:crypto.randomUUID()}),read:()=>client.read<ContentState>(),command:(command,input)=>client.command({command,input,key:crypto.randomUUID()}),generate:input=>client.generate<ContentDocument>({...input as object,key:crypto.randomUUID()}),render:input=>client.render<RenderManifest>({...input,key:crypto.randomUUID()}),sync:client.sync,reconcile:client.reconcile,
    async begin(provider){const binding=crypto.randomUUID();const result=await client.begin(provider,binding);const url=new URL(result.url);if(url.protocol!=='https:')throw new Error('INVALID_OAUTH_URL');sessionStorage.setItem('cineva_content_oauth_binding',binding);window.location.assign(url.href);},
    async finish(){const query=new URLSearchParams(window.location.search),code=query.get('code'),state=query.get('state'),binding=sessionStorage.getItem('cineva_content_oauth_binding');if(!code||!state||!binding)throw new Error('Callback OAuth belum lengkap.');await client.finish({code,state,binding});sessionStorage.removeItem('cineva_content_oauth_binding');const url=new URL(window.location.href);url.searchParams.delete('code');url.searchParams.delete('state');window.history.replaceState({},'',url);}};
}
