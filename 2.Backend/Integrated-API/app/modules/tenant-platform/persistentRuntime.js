'use strict';
const {createProgramRegistry}=require('../../../../packages/tenant-server/src/registry');
const {createMysqlRuntimeStore}=require('../../../../packages/tenant-server/src/mysqlStores');
const {createAppSessionManager}=require('../../../../packages/tenant-server/src/session');
const {createOidcBridge}=require('../../../../packages/tenant-server/src/oidc');
const {createRegisteredTenantRuntime}=require('./runtime');
/** Explicit infrastructure composition, no env reads, pools, migrations or application startup. */
function createPersistentTenantRuntime({registry,tenantKey,query,unitOfWork,oidcConfig,verifyIdToken,resolveUser,identityService,branding,ticketPilot=false}) {
 const program=createProgramRegistry(registry).get(tenantKey);
 if(oidcConfig?.redirect_uri!==program.origin+program.api_base_path+'/sso/callback')throw new Error('Callback must match bound program origin and API mount');
 if(typeof identityService?.resolveOrRegister!=='function')throw new Error('Trusted canonical identity adapter required');
 const store=kind=>createMysqlRuntimeStore({appKey:tenantKey,kind,query,unitOfWork});
 const sessions=createAppSessionManager({store:store('session'),resolveUser,origin:program.origin,cookieName:`__Host-${tenantKey}_session`,csrfCookieName:`${tenantKey}_csrf`});
 const oidc=createOidcBridge({config:oidcConfig,transactions:store('login'),verifyIdToken});
 return createRegisteredTenantRuntime({registry,tenantKey,query,membershipMode:'hierarchy',ticketPilot,contextStore:store('context'),branding,oidc,sessions,identityService,resolveIdentity:req=>sessions.resolveIdentity(req),assertMutation:req=>sessions.assertMutation(req)});
}
module.exports={createPersistentTenantRuntime};
