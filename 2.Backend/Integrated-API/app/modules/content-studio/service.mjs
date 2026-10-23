import crypto from 'node:crypto';
import {clone,fail,identifier,text,validateBrand,validateDocument,createDocument,editDocument,renderManifest,scopeKey,analytics,insightSummary,templates} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
import {scheduleTargets,cancelTarget,rescheduleTarget,publicAccount} from './social.mjs';
const id=()=>crypto.randomUUID();
const digest=input=>crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
export function createContentService({store,providers={},generator=null,extractor=null,insightGenerator=null,relations=null,workflow=null,entitlements,clock=Date.now,notify=()=>{},logger}){
  fail(store?.transact&&typeof entitlements==='function'&&logger?.warn,'CONTENT_RUNTIME_CONFIGURATION',503);
  const stamp=()=>new Date(clock()).toISOString();
  const limits=async principal=>{const p=await entitlements(principal);fail(p&&['generation','render','publish'].every(k=>Number.isSafeInteger(p[k])&&p[k]>=0),'INVALID_ENTITLEMENT',503);return p;};
  function protectPrincipal(principal){scopeKey(principal.scope);identifier(principal.actor.id);fail(Array.isArray(principal.actor.permissions),'AUTH_REQUIRED',401);}
  function permit(principal,permission){protectPrincipal(principal);fail(principal.actor.permissions.includes(permission),'CONTENT_FORBIDDEN',403);}
  async function transaction(principal,action,fn){permit(principal,action==='read'?'content.read':'content.write');const result=await store.transact(principal.scope,async(state,tx)=>{const value=await fn(state,tx);state.revision++;state.audit.push({id:id(),action,actor:principal.actor.id,at:stamp()});state.audit=state.audit.slice(-200);return value;});try{await notify(principal.scope,{type:'content_changed',action});}catch{logger.warn('[CONTENT][WARN] : notification_failed_after_commit');}return result;}
  const document=(s,input)=>{const doc=s.documents.find(d=>d.id===input.id);fail(doc,'DOCUMENT_NOT_FOUND',404);return doc;};
  const quota=(s,key,plan,n=1)=>{for(const [id,r]of Object.entries(s.reservations))if(r.deadline&&r.deadline<=clock())delete s.reservations[id];const reserved=Object.values(s.reservations).filter(r=>r.kind===key).length;fail(s.usage[key]+reserved+n<=plan[key],'QUOTA_EXCEEDED',409);};
  const api={
    store,providers,clock,
    async read(principal){permit(principal,'content.read');const state=await store.read(principal.scope),plan=await limits(principal);return {...state,accounts:state.accounts.map(publicAccount),oauth:undefined,reservations:undefined,operations:undefined,permissions:principal.actor.permissions,templates,capabilities:Object.entries(providers).map(([provider,p])=>({provider,...p.capabilities,configured:true})),plan,mode:store.kind==='memory'?'test':'persistent'};},
    async command(principal,{command,input={},key}){
      permit(principal,'content.write');identifier(key);text(command,50,'COMMAND');const plan=await limits(principal),signature=digest({command,input});
      return transaction(principal,command,async(s,tx)=>{
        const replay=s.operations[key];if(replay){fail(replay.signature===signature,'IDEMPOTENCY_CONFLICT',409);return replay.result;}
        fail(Object.keys(s.operations).length<2000,'OPERATION_HISTORY_LIMIT',409);
        let result;
        if(command==='document.create'){fail(s.documents.length<100,'DOCUMENT_LIMIT',409);const doc=createDocument({...input,id:input.id??id(),brand:s.brand});if(input.reference){fail(relations?.canLink&&await relations.canLink(principal,input.reference,tx),'CAMPAIGN_REFERENCE_FORBIDDEN',403);doc.reference=clone(input.reference);}fail(!s.documents.some(d=>d.id===doc.id),'DUPLICATE_DOCUMENT',409);s.documents.push(doc);result=doc;}
        else if(command==='document.edit'){const before=document(s,input);const next=editDocument(before,input.patch,input.expectedRevision,stamp());if(!plan.removeWatermark)fail(next.brand.watermark,'WATERMARK_ENTITLEMENT',403);validateDocument(next);renderManifest(next);s.documents=s.documents.map(d=>d.id===next.id?next:d);s.targets.filter(t=>t.documentId===next.id&&['scheduled','queued'].includes(t.status)).forEach(t=>{t.status='cancelled';t.error='CONTENT_CHANGED_REAPPROVAL_REQUIRED';});result=next;}
        else if(command==='document.review'){fail(workflow?.review,'WORKFLOW_ADAPTER_REQUIRED',503);const before=document(s,input);if(input.action!=='submit')permit(principal,'content.approve');const next=await workflow.review(clone(before),input,{...principal.actor,canApprove:principal.actor.permissions.includes('content.approve')},tx);validateDocument(next);fail(next.id===before.id&&next.revision===before.revision+1,'INVALID_WORKFLOW_RESULT',500);if(next.status==='approved')renderManifest(next);s.documents=s.documents.map(d=>d.id===next.id?next:d);result=next;}
        else if(command==='brand.save'){validateBrand(input.brand);if(!plan.removeWatermark)fail(input.brand.watermark,'WATERMARK_ENTITLEMENT',403);s.brand=clone(input.brand);result=s.brand;}
        else if(command==='settings.save'){fail(templates.some(t=>t.id===input.defaultTemplate),'UNKNOWN_TEMPLATE');fail(Array.isArray(input.favoriteTemplates)&&input.favoriteTemplates.every(x=>templates.some(t=>t.id===x)),'INVALID_FAVORITES');s.settings={defaultTemplate:input.defaultTemplate,favoriteTemplates:[...new Set(input.favoriteTemplates)]};result=s.settings;}
        else if(command==='publish.schedule'){const doc=document(s,input);fail(Array.isArray(input.targets)&&input.targets.length>0&&s.targets.length+input.targets.length<=500,'TARGET_LIMIT',409);quota(s,'publish',plan,input.targets.length);result=scheduleTargets(s,doc,input,{now:clock(),actor:principal.actor,providers});s.usage.publish+=result.length;}
        else if(command==='publish.cancel'){result=cancelTarget(s,input);}
        else if(command==='publish.reschedule'){result=rescheduleTarget(s,input,clock());}
        else if(command==='account.disconnect'){permit(principal,'content.accounts');const account=s.accounts.find(a=>a.id===input.accountId);fail(account,'ACCOUNT_NOT_FOUND',404);account.active=false;delete account.credentials;s.targets.filter(t=>t.accountId===account.id&&['scheduled','queued'].includes(t.status)).forEach(t=>t.status='cancelled');result=publicAccount(account);}
        else throw Object.assign(new Error('UNKNOWN_COMMAND'),{code:'UNKNOWN_COMMAND',status:400});
        s.operations[key]={signature,result:clone(result)};return result;
      });
    },
    async generate(principal,{documentId,expectedRevision,kind,source,key,model}){
      permit(principal,'content.write');identifier(key);text(source,20000,'SOURCE');fail(['text','idea','link'].includes(kind),'INVALID_SOURCE_KIND');fail(generator?.generate,'AI_PROVIDER_NOT_CONFIGURED',503);
      const plan=await limits(principal),signature=digest({documentId,expectedRevision,kind,source,model}),reservationId=id();
      const existing=await store.read(principal.scope);if(existing.operations[key]){fail(existing.operations[key].signature===signature,'IDEMPOTENCY_CONFLICT',409);return existing.operations[key].result;}
      await transaction(principal,'generation.reserve',s=>{const doc=document(s,{id:documentId});fail(doc.revision===expectedRevision,'REVISION_CONFLICT',409);if(s.reservations[key]?.deadline<=clock())delete s.reservations[key];fail(!s.reservations[key],'GENERATION_IN_PROGRESS',409);quota(s,'generation',plan);s.reservations[key]={kind:'generation',at:stamp(),deadline:clock()+150000,token:reservationId};});
      try{
        const extracted=kind==='link'?(fail(extractor?.extract,'LINK_EXTRACTOR_NOT_CONFIGURED',503),await extractor.extract(source)):null;
        const doc=existing.documents.find(d=>d.id===documentId),answer=await generator.generate({source:extracted?.text??source,kind,model,count:doc.slides.length,language:doc.language});
        fail(answer&&Array.isArray(answer.slides)&&answer.slides.length===doc.slides.length,'INVALID_AI_SLIDE_COUNT');
        const patch={slides:answer.slides.map((slide,i)=>({id:doc.slides[i].id,title:slide.title,body:slide.body})),caption:answer.caption??'',hashtags:answer.hashtags??'',source:{kind,text:extracted?.text??source,url:kind==='link'?source:'',model:answer.model??model??'',generatedAt:stamp()}};
        const preview=editDocument(doc,patch,expectedRevision,stamp());renderManifest(preview);
        return await transaction(principal,'generation.complete',s=>{fail(s.reservations[key]?.token===reservationId&&s.reservations[key].deadline>clock(),"GENERATION_RESERVATION_EXPIRED",409);const current=document(s,{id:documentId});fail(current.revision===expectedRevision,'REVISION_CONFLICT',409);const next=editDocument(current,patch,expectedRevision,stamp());s.documents=s.documents.map(d=>d.id===next.id?next:d);delete s.reservations[key];s.usage.generation++;s.operations[key]={signature,result:next};s.targets.filter(t=>t.documentId===documentId&&['scheduled','queued'].includes(t.status)).forEach(t=>t.status='cancelled');return next;});
      }catch(error){await transaction(principal,'generation.release',s=>{if(s.reservations[key]?.token===reservationId)delete s.reservations[key];});throw error;}
    },
    async render(principal,{id:documentId,revision,key}){permit(principal,'content.write');identifier(key);const plan=await limits(principal);return transaction(principal,'render',s=>{const doc=document(s,{id:documentId});fail(doc.revision===revision,'REVISION_CONFLICT',409);const result=renderManifest(doc),signature=digest({documentId,revision,kind:'render'});if(s.operations[key])fail(s.operations[key].signature===signature,'IDEMPOTENCY_CONFLICT',409);else{quota(s,'render',plan);s.usage.render++;s.operations[key]={signature,result:{documentId,revision}};}return result;});},
    async analytics(principal,filter){permit(principal,'content.read');const s=await store.read(principal.scope),result=analytics(s.targets,s.snapshots,filter);return {...result,insight:insightSummary(result)};},
    async insight(principal,{filter={},key}){
      permit(principal,'content.write');identifier(key);fail(insightGenerator?.summarize,'INSIGHT_AI_NOT_CONFIGURED',503);
      const signature=digest({kind:'insight',filter}),prior=(await store.read(principal.scope)).operations[key];
      if(prior){fail(prior.signature===signature,'IDEMPOTENCY_CONFLICT',409);return prior.result;}
      const result=await api.analytics(principal,filter);fail(result.measured>=3,'INSUFFICIENT_INSIGHT_SAMPLE',409);
      const evidence=result.rows.filter(r=>r.metrics).map(({id,provider,publishedAt,templateId,metrics})=>({id,provider,publishedAt,templateId,metrics}));
      const plan=await limits(principal),token=id();
      await transaction(principal,'insight.reserve',s=>{quota(s,'generation',plan);fail(!s.reservations[key],'GENERATION_IN_PROGRESS',409);s.reservations[key]={kind:'generation',token,deadline:clock()+90000};});
      try{const answer=await insightGenerator.summarize({evidence,filter,definition:result.definition});fail(typeof answer.text==='string'&&answer.text.length<=2000&&Array.isArray(answer.targetIds)&&answer.targetIds.length>0&&answer.targetIds.every(id=>evidence.some(row=>row.id===id)),'UNGROUNDED_INSIGHT_RESPONSE',502);
        const output={text:answer.text,targetIds:answer.targetIds,filter,sample:result.measured,generatedAt:stamp(),kind:'ai_observation',model:answer.model??null};
        return await transaction(principal,'insight.complete',s=>{fail(s.reservations[key]?.token===token&&s.reservations[key].deadline>clock(),'GENERATION_RESERVATION_EXPIRED',409);delete s.reservations[key];s.usage.generation++;s.operations[key]={signature,result:output};return output;});
      }catch(error){await transaction(principal,'insight.release',s=>{if(s.reservations[key]?.token===token)delete s.reservations[key];});throw error;}
    },
  };
  return api;
}
