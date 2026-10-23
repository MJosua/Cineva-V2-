'use strict';
const crypto = require('node:crypto');
// Canonical universal contract snapshot; contains no React/browser dependencies.
const {TenantError, requiredString, tenantKey, companyId, normalizeContext, assertOwner, validateBrand} = require('../../../../1.Frontend/packages/tenant-contracts');

function createTenantEngine({resolveIdentity, resolveTenant, memberships, contextStore, branding, clock = Date.now, contextTtlMs = 15 * 60 * 1000}) {
  if (!Number.isSafeInteger(contextTtlMs) || contextTtlMs <= 0) throw new Error('Finite positive context TTL required');
  for (const fn of [resolveIdentity, resolveTenant, memberships?.list, memberships?.get, contextStore?.put, contextStore?.get]) if (typeof fn !== 'function') throw new Error('Trusted identity, tenant, membership and context adapters required');
  const issued = new WeakMap();
  async function principal(req) {
    const identity = await resolveIdentity(req);
    if (!identity || identity.active !== true) throw new TenantError('AUTHENTICATION_REQUIRED', 401);
    requiredString(identity.user_id, 'USER_ID'); requiredString(identity.session_id, 'SESSION_ID');
    return {identity, tenant_key: tenantKey(await resolveTenant(req))};
  }
  function activeMembership(member, actor, company) {
    if (!member || member.active !== true || member.user_id !== actor.identity.user_id || member.tenant_key !== actor.tenant_key || member.company_id !== company || (member.expires_at != null && (!Number.isFinite(member.expires_at) || member.expires_at <= clock()))) throw new TenantError('MEMBERSHIP_REQUIRED');
    requiredString(member.version, 'MEMBERSHIP_VERSION');
    if (!Array.isArray(member.permissions) || member.permissions.some(p => typeof p !== 'string' || !p || p === '*')) throw new TenantError('INVALID_MEMBERSHIP');
    return member;
  }
  async function bootstrap(req) {
    const actor = await principal(req), rows = await memberships.list(actor.identity.user_id, actor.tenant_key);
    const companies = [];
    for (const member of rows) {
      if (member.active !== true || (member.expires_at != null && member.expires_at <= clock())) continue;
      activeMembership(member, actor, companyId(member.company_id));
      companies.push({company_id: member.company_id, company_name: requiredString(member.company_name, 'COMPANY_NAME')});
    }
    return {user_id: actor.identity.user_id, tenant_key: actor.tenant_key, companies};
  }
  async function select(req, requestedCompany) {
    const actor = await principal(req), id = companyId(requestedCompany);
    const member = activeMembership(await memberships.get(actor.identity.user_id, actor.tenant_key, id), actor, id);
    const context = normalizeContext({schema_version: 1, tenant_key: actor.tenant_key, company_id: id, user_id: actor.identity.user_id, membership_version: member.version});
    const context_id = crypto.randomBytes(32).toString('base64url');
    await contextStore.put(context_id, {context, session_id: actor.identity.session_id, expires_at: clock() + contextTtlMs});
    return {context_id, context};
  }
  async function authorize(req, contextId, permission) {
    const actor = await principal(req);
    if (typeof contextId !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(contextId)) throw new TenantError('CONTEXT_REQUIRED');
    const stored = await contextStore.get(contextId);
    if (!stored || stored.expires_at <= clock() || stored.session_id !== actor.identity.session_id || stored.context.user_id !== actor.identity.user_id || stored.context.tenant_key !== actor.tenant_key) throw new TenantError('CONTEXT_EXPIRED');
    const context = normalizeContext(stored.context);
    const member = activeMembership(await memberships.get(context.user_id, context.tenant_key, context.company_id), actor, context.company_id);
    if (member.version !== context.membership_version) throw new TenantError('MEMBERSHIP_CHANGED');
    if (!member.permissions.includes(permission)) throw new TenantError('PERMISSION_DENIED');
    issued.set(context, {permissions: new Set(member.permissions), req, contextId}); return context;
  }
  function assertContext(context, permission) {
    if (!issued.has(context)) throw new TenantError('UNVERIFIED_CONTEXT');
    if (!issued.get(context).permissions.has(permission)) throw new TenantError('PERMISSION_DENIED');
  }
  async function revalidate(context, permission) {
    assertContext(context, permission);
    const {req, contextId} = issued.get(context);
    await authorize(req, contextId, permission);
  }
  async function brand(context) {
    await revalidate(context, 'brand.read');
    if (!branding?.get) throw new TenantError('BRANDING_NOT_CONFIGURED', 503);
    const result = validateBrand({...await branding.get(context), asset: undefined}); assertOwner(context, result);
    // Asset resolution must be tenant-scoped; URL/asset ownership is not inferred from a string id.
    if (result.brand.logo_asset_id) {
      if (!branding.canReadAsset || !await branding.canReadAsset(context, result.brand.logo_asset_id) || !branding.resolveAsset) throw new TenantError('INVALID_BRAND_ASSET');
      const asset = await branding.resolveAsset(context, result.brand.logo_asset_id);
      if (!asset) throw new TenantError('INVALID_BRAND_ASSET');
      return validateBrand({...result, asset});
    }
    return result;
  }
  function repository(adapter) {
    if (!adapter?.get) throw new Error('Scoped repository adapter required');
    return {
      async get(context, id) { await revalidate(context, 'resources.read'); const row = await adapter.get(context, id); assertOwner(context, row); return row; },
      async list(context, query) {
        await revalidate(context, 'resources.read');
        const result = await adapter.list(context, query);
        if (!result || !Array.isArray(result.rows) || !Number.isSafeInteger(result.total) || result.total < result.rows.length) throw new TenantError('INVALID_REPOSITORY_RESULT', 500);
        for (const row of result.rows) assertOwner(context, row);
        // COUNT/filter/pagination must be scoped inside persistence adapter, not post-filtered here.
        return result;
      },
      async update(context, id, patch, unitOfWork) {
        await revalidate(context, 'resources.write');
        if (!unitOfWork?.run || !adapter.update || !adapter.getForUpdate) throw new TenantError('TRANSACTION_ADAPTER_REQUIRED', 503);
        const clean = {...patch};
        if (['tenant_key', 'company_id', 'user_id', 'id'].some(key => Object.hasOwn(clean, key))) throw new TenantError('OWNER_CHANGE_FORBIDDEN');
        return unitOfWork.run(async connection => {
          assertOwner(context, await adapter.getForUpdate(connection, context, id));
          const result = await adapter.update(connection, context, id, clean); assertOwner(context, result);
          await revalidate(context, 'resources.write'); return result;
        });
      },
    };
  }
  return {bootstrap, select, authorize, brand, repository,
    invitations(adapters) { return require('./invitations').createInvitationService({...adapters, authorizeContext: revalidate, resolvePrincipal: principal}); },
  };
}

/** Self-registration activates identity only; company/campaign membership is invitation-only. */
function createRegistrationService({unitOfWork, users, resolveRegistrationIdentity}) {
  if (!unitOfWork?.run || !users?.createPersonalClient || typeof resolveRegistrationIdentity !== 'function') throw new Error('Registration persistence and identity verification adapters required');
  return {async register(input) {
    const identity = await resolveRegistrationIdentity(input);
    if (!identity || identity.verified !== true) throw new TenantError('VERIFIED_IDENTITY_REQUIRED', 401);
    requiredString(identity.issuer, 'ISSUER'); requiredString(identity.subject, 'SUBJECT');
    return unitOfWork.run(async connection => {
      const account = await users.createPersonalClient(connection, {issuer: identity.issuer, subject: identity.subject, active: true, account_type: 'client'});
      return {user_id: requiredString(account.user_id, 'USER_ID'), active: true, account_type: 'client', companies: []};
    });
  }};
}
module.exports = {createTenantEngine, createRegistrationService, TenantError};
