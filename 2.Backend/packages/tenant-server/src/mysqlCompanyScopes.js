'use strict';
const {TenantError,tenantKey,companyId}=require('../../../../1.Frontend/packages/tenant-contracts');
const {resolveCompanyScopes}=require('./companyScope');
function createMysqlCompanyScopes({query,programs}) {
 if(typeof query!=='function'||!programs)throw new Error('Query and explicit program mappings required');
 async function list(userId,key) {
  tenantKey(key);const program=programs[key];
  if(!program||!Number.isSafeInteger(program.program_id)||program.program_id<=0)throw new TenantError('TENANT_NOT_CONFIGURED',503);
  if(typeof userId!=='string'||!/^[1-9]\d*$/.test(userId)||!Number.isSafeInteger(Number(userId))||Number(userId)>2147483647)throw new TenantError('INVALID_USER_ID',401);
  const grants=await query('SELECT g.* FROM t_tenant_company_grant g JOIN user u ON u.user_id=g.user_id AND u.active=1 WHERE g.user_id=? AND g.program_id=? AND g.is_active=1 ORDER BY g.grant_id LIMIT 2001',[Number(userId),program.program_id]);
  if(grants.length>=2001)throw new TenantError('SCOPE_RESULT_TOO_LARGE',503);
  if(!grants.length)return [];
  const companies=await query('SELECT company_id,company_name,is_active FROM m_company ORDER BY company_id LIMIT 2001',[]);
  const relations=await query('SELECT parent_company_id,child_company_id FROM t_tenant_company_relation WHERE is_active=1 ORDER BY child_company_id LIMIT 2001',[]);
  if(companies.length>=2001||relations.length>=2001)throw new TenantError('SCOPE_RESULT_TOO_LARGE',503);
  return resolveCompanyScopes({userId,tenantKey:key,companies,relations,grants:grants.map(g=>({...g,tenant_key:key,active:g.is_active===1,include_descendants:g.include_descendants===1,permissions:typeof g.permissions==='string'?JSON.parse(g.permissions):g.permissions}))});
 }
 return {list,async get(userId,key,id){companyId(id);return(await list(userId,key)).find(m=>m.company_id===id)||null;}};
}
module.exports={createMysqlCompanyScopes};
