import {createContentService} from './service.mjs';
import {createPublishWorker} from './social.mjs';
import {syncInsights} from './integrations.mjs';
import {fail} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
/** Must be explicitly supplied by the owning deployment. No memory store fallback. */
export function createContentRuntime({store,authorize,assertMutation,authorizeJob,credentials,assets,logger,...options}){
  fail(store?.kind==='mysql'&&typeof authorize==='function'&&typeof assertMutation==='function','PERSISTENT_CONTENT_RUNTIME_REQUIRED',503);
  const service=createContentService({...options,store,logger});
  const worker=createPublishWorker({service,authorizeJob,credentials,assets,logger});
  return {service,worker,assets,authorize,assertMutation,connections:options.connections,sync:principal=>syncInsights({service,principal,credentials}),async creatorInfo(principal,accountId){const state=await store.read(principal.scope),account=state.accounts.find(a=>a.id===accountId&&a.active);fail(account&&service.providers[account.provider]?.creatorInfo,'CREATOR_INFO_UNAVAILABLE',409);return service.providers[account.provider].creatorInfo((await credentials(account,principal.scope)).accessToken);}};
}
/** Scope/user/permissions derived only from the authenticated tenant engine result. */
export function tenantContentAuthorization(tenantRuntime){return async(req,permission)=>{
  const context=await tenantRuntime.engine.authorize(req,req.headers['x-workspace-context'],permission);
  fail(context.tenant_key==='cineva','CONTENT_PROGRAM_FORBIDDEN',403);
  const permissions=[permission];
  for(const candidate of ['content.read','content.write','content.approve','content.accounts'])if(candidate!==permission){try{await tenantRuntime.engine.authorize(req,req.headers['x-workspace-context'],candidate);permissions.push(candidate);}catch(error){if(error.status!==403)throw error;}}
  return {scope:{tenant_key:context.tenant_key,kind:'company',company_id:context.company_id},actor:{id:String(context.user_id),permissions}};
};}
