'use strict';
const crypto = require('node:crypto');
const {TenantError, companyId} = require('../../../../1.Frontend/packages/tenant-contracts');
/** Explicit root grants; role names never become global access. No company-name inference. */
function resolveCompanyScopes({userId, tenantKey, companies, relations, grants}) {
  const catalog = new Map(companies.map(c => [companyId(c.company_id), c])), parent = new Map(), children = new Map();
  for (const edge of relations) {
    const from = companyId(edge.parent_company_id), to = companyId(edge.child_company_id);
    if (!catalog.has(from) || !catalog.has(to) || from === to || parent.has(to)) throw new TenantError('INVALID_COMPANY_HIERARCHY', 503);
    parent.set(to, from);children.set(from, [...(children.get(from)||[]), to]);
  }
  for (const id of catalog.keys()) {
    const seen = new Set();let cursor = id;
    while (cursor !== undefined) {if (seen.has(cursor)) throw new TenantError('INVALID_COMPANY_HIERARCHY', 503);seen.add(cursor);cursor=parent.get(cursor);}
  }
  const effective = new Map();
  for (const grant of grants) {
    if (String(grant.user_id) !== userId || grant.tenant_key !== tenantKey || grant.active !== true) continue;
    if (!Array.isArray(grant.permissions) || grant.permissions.some(p => typeof p!=='string' || !p || p==='*')) throw new TenantError('INVALID_SCOPE_GRANT',503);
    const stack = [companyId(grant.root_company_id)];
    while(stack.length) {
      const id=stack.pop(), company=catalog.get(id);
      if (!company || company.is_active !== 1) continue; // Inactive ancestor cuts traversal.
      const permissions = effective.get(id) || new Set();grant.permissions.forEach(p=>permissions.add(p));effective.set(id, permissions);
      if(grant.include_descendants === true)stack.push(...(children.get(id)||[]));
    }
  }
  const version=crypto.createHash('sha256').update(JSON.stringify({companies,relations,grants})).digest('hex');
  return [...effective].sort(([a],[b])=>a-b).map(([id,permissions])=>({user_id:userId,tenant_key:tenantKey,company_id:id,company_name:catalog.get(id).company_name,active:true,permissions:[...permissions].sort(),version}));
}
module.exports={resolveCompanyScopes};
