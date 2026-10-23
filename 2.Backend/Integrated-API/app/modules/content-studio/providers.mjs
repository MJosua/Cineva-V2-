import {fail,validateMetrics,metricNames} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
const remoteId=value=>{fail(typeof value==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(value),'INVALID_PROVIDER_ID');return value;};
/** Version is supplied by deployment and recorded in a capability manifest, never guessed from date. */
export function createGraphProvider({provider,version,fetchImpl=fetch,storyEnabled=false,metrics=[],maxSlides=10}){
  fail(['instagram','facebook','threads'].includes(provider)&&/^v\d+\.\d+$/.test(version),'GRAPH_PROVIDER_CONFIGURATION');
  const origin=provider==='instagram'?'https://graph.instagram.com':provider==='threads'?'https://graph.threads.net':'https://graph.facebook.com';
  async function request(path,token,data){
    fail(typeof token==='string'&&token.length>0,'SOCIAL_TOKEN_REQUIRED',503);
    const response=await fetchImpl(`${origin}/${version}/${path}`,{method:data?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(data?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:data?new URLSearchParams(Object.entries(data).map(([k,v])=>[k,typeof v==='object'?JSON.stringify(v):String(v)])):undefined,signal:AbortSignal.timeout(20000),redirect:'error'});
    const body=await response.json();if(!response.ok||body.error){const error=Object.assign(new Error('SOCIAL_PROVIDER_REJECTED'),{code:'SOCIAL_PROVIDER_REJECTED',status:502,definitive:response.status>=400&&response.status<500&&response.status!==429});throw error;}return body;
  }
  return {capabilities:{formats:['carousel','feed',...(provider==='instagram'&&storyEnabled?['story']:[])],audio:false,metrics,maxSlides,apiVersion:version,verifiedLive:false},
    async publish({target,account,media,credentials,onCheckpoint=async()=>{}}){
      const accountId=remoteId(account.remoteId),token=credentials.accessToken;
      fail(media.every(m=>typeof m.url==='string'&&m.url.startsWith('https://')),'HTTPS_MEDIA_REQUIRED');
      const caption=[target.snapshot.caption,target.snapshot.hashtags].filter(Boolean).join('\n\n');
      if(provider==='facebook'){
        const photoIds=[];for(const asset of media){const p=await request(`${accountId}/photos`,token,{url:asset.url,published:false});photoIds.push(remoteId(p.id));}
        await onCheckpoint({stage:'uploaded',requestId:photoIds.join(',')});
        const post=await request(`${accountId}/feed`,token,{message:caption,attached_media:photoIds.map(media_fbid=>({media_fbid}))});
        await onCheckpoint({stage:'published',postId:post.id});return {postId:post.id,status:'published',url:`https://www.facebook.com/${post.id}`};
      }
      const children=[];let container=target.resumeContainer?remoteId(target.providerRequestId):null;
      if(!container){
      if(media.length>1){for(const asset of media){const child=await request(`${accountId}/${provider==='threads'?'threads':'media'}`,token,{image_url:asset.url,...(provider==='threads'?{media_type:'IMAGE',is_carousel_item:true}:{is_carousel_item:true})});children.push(remoteId(child.id));}}
      const root=await request(`${accountId}/${provider==='threads'?'threads':'media'}`,token,provider==='threads'
        ?(children.length?{media_type:'CAROUSEL',children:children.join(','),text:caption}:{media_type:'IMAGE',image_url:media[0].url,text:caption})
        :(children.length?{media_type:'CAROUSEL',children:children.join(','),caption}:{image_url:media[0].url,...(target.format==='story'?{media_type:'STORIES'}:{caption})}));
      container=remoteId(root.id);await onCheckpoint({stage:'container',requestId:container});
      }
      if(provider==='instagram'){
        const status=await request(`${container}?fields=status_code`,token);
        if(status.status_code!=='FINISHED')return {postId:container,requestId:container,status:'processing'};
      }
      await onCheckpoint({stage:'publish_requested',requestId:container});
      const final=await request(`${accountId}/${provider==='threads'?'threads_publish':'media_publish'}`,token,{creation_id:container});
      await onCheckpoint({stage:'published',postId:final.id,requestId:container});
      return {postId:final.id,requestId:container,status:'published'};
    },
    async status({target,credentials}){
      if(target.providerStage==='published')return {status:'published',postId:target.postId};
      // Do not blindly repeat media_publish after an ambiguous network response.
      const body=await request(`${remoteId(target.providerRequestId??target.postId)}?fields=${provider==='threads'?'status':'status_code'}`,credentials.accessToken);
      const state=body.status_code??body.status;
      return {status:['ERROR','EXPIRED','FAILED'].includes(state)?'failed':state==='FINISHED'&&target.providerStage==='container'?'ready':'unknown'};
    },
    async insights({target,credentials}){
      fail(metrics.length>0,'INSIGHTS_NOT_CONFIGURED',503);
      const result=await request(`${remoteId(target.postId)}/insights?metric=${encodeURIComponent(metrics.join(','))}`,credentials.accessToken);
      const values=Object.fromEntries(metricNames.map(k=>[k,null]));
      for(const row of result.data??[]){const raw=row.total_value?.value??row.values?.at(-1)?.value;if(Object.hasOwn(values,row.name)&&Number.isSafeInteger(raw)&&raw>=0)values[row.name]=raw;}
      return validateMetrics(values);
    }};
}
export function createTikTokProvider({fetchImpl=fetch,verifiedMediaPrefix}){
  const prefix=new URL(verifiedMediaPrefix);fail(prefix.protocol==='https:','TIKTOK_VERIFIED_MEDIA_REQUIRED');
  async function request(path,token,data){const r=await fetchImpl(`https://open.tiktokapis.com/v2/${path}/`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000),redirect:'error'});const body=await r.json();fail(r.ok&&(!body.error?.code||body.error.code==='ok'),'TIKTOK_REQUEST_FAILED',502);return body.data;}
  return {capabilities:{formats:['carousel','feed'],audio:true,maxSlides:35,watermarkAllowed:false,verifiedLive:false,requiresCreatorConsent:true},
    creatorInfo:token=>request('post/publish/creator_info/query',token,{}),
    async publish({target,media,credentials,onCheckpoint=async()=>{}}){
      fail(target.options?.creatorConsent===true&&typeof target.options.privacy==='string','TIKTOK_CREATOR_CONSENT_REQUIRED');
      const info=await request('post/publish/creator_info/query',credentials.accessToken,{});fail(info.privacy_level_options.includes(target.options.privacy),'TIKTOK_PRIVACY_CHANGED');
      fail(media.every(m=>{const u=new URL(m.url);return u.origin===prefix.origin&&u.pathname.startsWith(prefix.pathname);}), 'TIKTOK_MEDIA_DOMAIN_NOT_VERIFIED');
      const reply=await request('post/publish/content/init',credentials.accessToken,{media_type:'PHOTO',post_mode:'DIRECT_POST',post_info:{title:target.title.slice(0,90),description:[target.snapshot.caption,target.snapshot.hashtags].join('\n'),privacy_level:target.options.privacy,auto_add_music:target.audio,brand_content_toggle:target.options.paidPartnership===true,brand_organic_toggle:target.options.ownBrand===true},source_info:{source:'PULL_FROM_URL',photo_images:media.map(m=>m.url),photo_cover_index:0},is_aigc:target.snapshot.source?.aiGeneratedImage===true});
      await onCheckpoint({stage:'processing',requestId:reply.publish_id});return {status:'processing',postId:reply.publish_id,requestId:reply.publish_id};
    },
    async status({target,credentials}){const result=await request('post/publish/status/fetch',credentials.accessToken,{publish_id:target.providerRequestId??target.postId});const published=result.publicaly_available_post_id??[];return result.status==='PUBLISH_COMPLETE'&&published.length?{status:'published',postId:String(published[0])}:result.status==='FAILED'?{status:'failed'}:{status:'unknown'};},
  };
}
