import crypto from 'node:crypto';
import {clone,fail,identifier,renderManifest} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
export const publicAccount=a=>({id:a.id,provider:a.provider,name:a.name,active:a.active,formats:a.formats,expiresAt:a.expiresAt??null});
export function scheduleTargets(state,doc,input,{now,actor,providers}){
  fail(doc.status==='approved'&&doc.approval?.revision===doc.revision,'APPROVAL_REQUIRED',409);
  fail(doc.revision===input.expectedRevision,'REVISION_CONFLICT',409);
  fail(Array.isArray(input.targets)&&input.targets.length>0&&input.targets.length<=20,'INVALID_TARGETS');
  const at=new Date(input.scheduledAt);fail(Number.isFinite(+at)&&+at>=now-60000&&+at<=now+366*86400000,'INVALID_SCHEDULE');
  const unique=new Set(),manifest=renderManifest(doc);
  return input.targets.map(destination=>{
    const account=state.accounts.find(a=>a.id===destination.accountId&&a.active);
    fail(account,'ACCOUNT_NOT_CONNECTED',409);const provider=providers[account.provider];
    fail(provider&&provider.capabilities.formats.includes(destination.format)&&account.formats.includes(destination.format),'FORMAT_NOT_SUPPORTED',409);
    fail(manifest.slides.length<=(provider.capabilities.maxSlides??10),'PROVIDER_SLIDE_LIMIT');
    if(destination.format==='story')fail(manifest.slides.length===1&&doc.format==='9:16','STORY_REQUIRES_ONE_PORTRAIT_SLIDE');
    fail(!destination.audio||provider.capabilities.audio===true,'AUDIO_NOT_SUPPORTED');
    const key=`${account.id}:${destination.format}`;fail(!unique.has(key),'DUPLICATE_TARGET');unique.add(key);
    fail(!state.targets.some(t=>t.documentId===doc.id&&t.revision===doc.revision&&t.accountId===account.id&&t.format===destination.format&&t.status!=='cancelled'),'REVISION_ALREADY_SCHEDULED',409);
    if(account.provider==='tiktok')fail(provider.capabilities.watermarkAllowed!==false||!doc.brand.watermark,'TIKTOK_WATERMARK_UNSUPPORTED');
    const row={id:crypto.randomUUID(),documentId:doc.id,revision:doc.revision,title:doc.title,templateId:doc.templateId,accountId:account.id,provider:account.provider,format:destination.format,audio:destination.audio===true,options:clone(destination.options??{}),scheduledAt:at.toISOString(),status:'scheduled',attempts:0,actorId:actor.id,createdAt:new Date(now).toISOString(),snapshot:clone(doc),renderInfo:{rendererVersion:manifest.rendererVersion,templateVersion:manifest.templateVersion}};
    state.targets.push(row);return clone({...row,snapshot:undefined});
  });
}
export function cancelTarget(s,input){const t=s.targets.find(x=>x.id===input.targetId);fail(t,'TARGET_NOT_FOUND',404);fail(['scheduled','queued','failed'].includes(t.status),'CANNOT_CANCEL_IN_FLIGHT',409);t.status='cancelled';return {...clone(t),snapshot:undefined};}
export function rescheduleTarget(s,input,now){const t=s.targets.find(x=>x.id===input.targetId);fail(t,'TARGET_NOT_FOUND',404);fail(['scheduled','queued'].includes(t.status),'CANNOT_RESCHEDULE_IN_FLIGHT',409);const due=Date.parse(input.scheduledAt);fail(Number.isFinite(due)&&due>=now&&due<=now+366*86400000,'INVALID_SCHEDULE');t.scheduledAt=new Date(due).toISOString();return {...clone(t),snapshot:undefined};}
/** Explicit worker tick. Host starts/stops scheduling; importing never starts cron. */
export function createPublishWorker({service,authorizeJob,assets,credentials,logger,leaseMs=120000,clock=Date.now}){
  fail(typeof authorizeJob==='function'&&assets?.prepare&&typeof credentials==='function'&&logger?.warn,'WORKER_CONFIGURATION',503);
  const store=service.store;
  async function tick(scope){
    const claim=await store.transact(scope,s=>{
      for(const t of s.targets)if(t.status==='publishing'&&t.leaseUntil<=clock()){t.status='unknown';t.error='LEASE_EXPIRED_RECONCILE_REQUIRED';}
      const t=s.targets.find(t=>['scheduled','queued'].includes(t.status)&&Date.parse(t.scheduledAt)<=clock());
      if(!t)return null;const account=s.accounts.find(a=>a.id===t.accountId&&a.active);
      if(!account){t.status='failed';t.error='ACCOUNT_REVOKED';return null;}
      t.status='publishing';t.attempts++;t.leaseId=crypto.randomUUID();t.leaseUntil=clock()+leaseMs;
      return {target:clone(t),account:clone(account)};
    });
    if(!claim){
      const pending=await store.transact(scope,s=>{const t=s.targets.find(t=>t.status==='unknown'&&(t.postId||t.providerRequestId)&&service.providers[t.provider]?.status&&(t.nextReconcileAt??0)<=clock());if(!t)return null;t.nextReconcileAt=clock()+30000;return t.id;});
      if(pending){try{await reconcile(scope,pending);}catch{logger.warn('[CONTENT][WARN] : reconciliation_pending');}}
      return {processed:false};
    }
    const {target,account}=claim;
    let heartbeatBusy=false;
    const heartbeat=setInterval(async()=>{if(heartbeatBusy)return;heartbeatBusy=true;try{await store.transact(scope,s=>{const t=s.targets.find(t=>t.id===target.id);if(t?.status==='publishing'&&t.leaseId===target.leaseId)t.leaseUntil=clock()+leaseMs;});}catch{logger.warn('[CONTENT][WARN] : worker_heartbeat_failed');}finally{heartbeatBusy=false;}},Math.max(1000,Math.floor(leaseMs/3)));
    heartbeat.unref?.();
    let status='unknown',result,error;
    try{
      fail(await authorizeJob(scope,target.actorId,target),'JOB_ACCESS_REVOKED',403);
      const provider=service.providers[target.provider];fail(provider,'PROVIDER_NOT_CONFIGURED',503);
      const media=await assets.prepare(target.snapshot,scope,target);fail(Array.isArray(media)&&media.length>0,'ASSET_PREPARATION_FAILED');
      // Recheck revocation/revision immediately before the external side effect.
      const latest=await store.read(scope);fail(latest.accounts.some(a=>a.id===account.id&&a.active),'ACCOUNT_REVOKED',403);
      const claimed=latest.targets.find(t=>t.id===target.id);fail(claimed?.status==='publishing'&&claimed.leaseId===target.leaseId&&claimed.leaseUntil>clock(),'WORKER_LEASE_LOST',409);
      const current=latest.documents.find(d=>d.id===target.documentId);fail(current?.revision===target.revision&&current.status==='approved','APPROVED_REVISION_CHANGED',409);
      fail(await authorizeJob(scope,target.actorId,target),'JOB_ACCESS_REVOKED',403);
      result=await provider.publish({target,account,media,credentials:await credentials(account,scope),onCheckpoint:async checkpoint=>{await store.transact(scope,s=>{const t=s.targets.find(x=>x.id===target.id);fail(t?.leaseId===target.leaseId,'WORKER_LEASE_LOST',409);t.providerStage=checkpoint.stage;if(checkpoint.requestId)t.providerRequestId=checkpoint.requestId;if(checkpoint.postId)t.postId=checkpoint.postId;});}});
      fail(result&&typeof result.postId==='string'&&result.postId.length>0,'PROVIDER_RESULT_UNKNOWN',502);
      status=result.status==='processing'?'unknown':'published';
    }catch(e){error=e.code??'PROVIDER_OUTCOME_UNKNOWN';status=e.safeToRetry===true&&target.attempts<3?'queued':e.definitive===true||['JOB_ACCESS_REVOKED','ACCOUNT_REVOKED','APPROVED_REVISION_CHANGED','ASSET_PREPARATION_FAILED','PROVIDER_NOT_CONFIGURED'].includes(error)?'failed':'unknown';}finally{clearInterval(heartbeat);}
    await store.transact(scope,s=>{const t=s.targets.find(x=>x.id===target.id);if(t?.leaseId!==target.leaseId)return;t.status=status;t.error=error??(status==='unknown'?'PROVIDER_PROCESSING_RECONCILE_REQUIRED':undefined);if(status==='queued')t.scheduledAt=new Date(clock()+Math.min(300000,1000*2**t.attempts)).toISOString();if(result){t.postId=result.postId;t.url=result.url;t.providerRequestId=result.requestId;}if(status==='published'){t.publishedAt=new Date(clock()).toISOString();}delete t.leaseUntil;delete t.leaseId;});
    return {processed:true,id:target.id,status};
  }
  async function reconcile(scope,targetId){
    const state=await store.read(scope),target=state.targets.find(t=>t.id===identifier(targetId));fail(target?.status==='unknown','RECONCILE_NOT_REQUIRED',409);
    fail(await authorizeJob(scope,target.actorId,target),'JOB_ACCESS_REVOKED',403);const account=state.accounts.find(a=>a.id===target.accountId&&a.active);fail(account,'ACCOUNT_REVOKED');const p=service.providers[target.provider];fail(p?.status&&(target.postId||target.providerRequestId),'MANUAL_RECONCILIATION_REQUIRED',409);
    const result=await p.status({target,account,credentials:await credentials(account,scope)});
    return store.transact(scope,s=>{const t=s.targets.find(t=>t.id===target.id);fail(t.status==='unknown','TARGET_CHANGED',409);if(result.status==='published'){t.status='published';t.publishedAt=new Date(clock()).toISOString();t.postId=result.postId??t.postId;t.url=result.url??t.url;delete t.error;}else if(result.status==='failed'){t.status='failed';t.error='PROVIDER_CONFIRMED_FAILED';}else if(result.status==='ready'&&t.providerStage==='container'){t.status='queued';t.resumeContainer=true;t.scheduledAt=new Date(clock()).toISOString();delete t.error;}return {...clone(t),snapshot:undefined};});
  }
  return {tick,reconcile};
}
