'use strict';
const CONTRACT_VERSION = 1;
class TenantError extends Error {
  constructor(code, status = 403) { super(code); this.name = 'TenantError'; this.code = code; this.status = status; }
}
function requiredString(value, name, max = 200) {
  if (typeof value !== 'string' || !value || value !== value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new TenantError(`INVALID_${name}`, 400);
  return value;
}
function tenantKey(value) {
  requiredString(value, 'TENANT_KEY', 64);
  if (!/^[a-z][a-z0-9_-]*$/.test(value)) throw new TenantError('INVALID_TENANT_KEY', 400);
  return value;
}
function companyId(value) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new TenantError('INVALID_COMPANY_ID', 400);
  return value;
}
function normalizeContext(input) {
  if (!input || input.schema_version !== CONTRACT_VERSION) throw new TenantError('INVALID_CONTEXT_VERSION', 400);
  return Object.freeze({
    schema_version: CONTRACT_VERSION,
    tenant_key: tenantKey(input.tenant_key),
    company_id: companyId(input.company_id),
    user_id: requiredString(input.user_id, 'USER_ID'),
    membership_version: requiredString(input.membership_version, 'MEMBERSHIP_VERSION'),
  });
}
function contextKey(context, ...parts) {
  const c = normalizeContext(context);
  if (parts.some(p => typeof p !== 'string' || p.length > 500)) throw new TenantError('INVALID_CACHE_KEY', 400);
  return JSON.stringify([c.schema_version, c.tenant_key, c.company_id, c.user_id, c.membership_version, ...parts]);
}
const TOKENS = new Set(['primary', 'primary-foreground', 'background', 'foreground', 'card', 'card-foreground', 'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground', 'ring']);
function validateBrand(input) {
  if (!input || input.schema_version !== 1 || !Number.isSafeInteger(input.revision) || input.revision <= 0) throw new TenantError('INVALID_BRAND_VERSION', 400);
  const brand = input.brand;
  if (!brand || !input.tokens || typeof input.tokens !== 'object' || Array.isArray(input.tokens)) throw new TenantError('INVALID_BRAND', 400);
  const tokens = {};
  for (const [key, value] of Object.entries(input.tokens)) {
    // HSL triples match existing HOTS semantic CSS tokens; arbitrary CSS/URLs are rejected.
    if (!TOKENS.has(key) || typeof value !== 'string' || !/^\d{1,3}(?:\.\d+)? \d{1,3}(?:\.\d+)?% \d{1,3}(?:\.\d+)?%$/.test(value)) throw new TenantError('INVALID_BRAND_TOKEN', 400);
    const [h, s, l] = value.split(' ').map(v => Number(v.replace('%', '')));
    if (h > 360 || s > 100 || l > 100) throw new TenantError('INVALID_BRAND_TOKEN', 400);
    tokens[key] = value;
  }
  let asset;
  if (input.asset != null) {
    const a = input.asset;
    if (a.tenant_key !== input.tenant_key || a.company_id !== input.company_id || a.asset_id !== brand.logo_asset_id || !['image/png', 'image/jpeg', 'image/webp'].includes(a.mime_type)) throw new TenantError('INVALID_BRAND_ASSET', 400);
    let url;try {url = new URL(a.url);} catch {throw new TenantError('INVALID_BRAND_ASSET', 400);}
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new TenantError('INVALID_BRAND_ASSET', 400);
    asset = Object.freeze({asset_id: requiredString(a.asset_id, 'ASSET_ID'), tenant_key: tenantKey(a.tenant_key), company_id: companyId(a.company_id), url: url.href, mime_type: a.mime_type});
  }
  return Object.freeze({schema_version: 1, revision: input.revision, tenant_key: tenantKey(input.tenant_key), company_id: companyId(input.company_id), brand: Object.freeze({display_name: requiredString(brand.display_name, 'BRAND_NAME', 100), logo_asset_id: brand.logo_asset_id == null ? null : requiredString(brand.logo_asset_id, 'ASSET_ID')}), tokens: Object.freeze(tokens), ...(asset ? {asset} : {})});
}
function assertOwner(context, resource) {
  const c = normalizeContext(context);
  if (!resource || resource.tenant_key !== c.tenant_key || resource.company_id !== c.company_id) throw new TenantError('RESOURCE_NOT_FOUND', 404);
  return resource;
}
module.exports = {CONTRACT_VERSION, TenantError, requiredString, tenantKey, companyId, normalizeContext, contextKey, validateBrand, assertOwner};
