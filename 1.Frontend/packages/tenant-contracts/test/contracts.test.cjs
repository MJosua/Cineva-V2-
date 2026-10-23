const test = require('node:test');
const assert = require('node:assert/strict');
const {normalizeContext, contextKey, validateBrand, assertOwner} = require('../src/index.cjs');
const context = {schema_version: 1, tenant_key: 'cineva', company_id: 1, user_id: '17', membership_version: 'v1'};
test('context forbids company sentinel and coerced ids', () => {for (const company_id of [0, -1, '1', null, 1.5]) assert.throws(() => normalizeContext({...context, company_id}));});
test('context requires membership/user/tenant/version', () => {for (const key of Object.keys(context)) assert.throws(() => normalizeContext({...context, [key]: undefined}));});
test('context and cache namespaces separate user tenant company and version', () => {
 const original = contextKey(context, 'a:b', 'c');
 for (const patch of [{tenant_key: 'overseas'}, {company_id: 2}, {user_id: '18'}, {membership_version: 'v2'}]) assert.notEqual(original, contextKey({...context, ...patch}, 'a:b', 'c'));
 assert.notEqual(contextKey(context, 'a:b', 'c'), contextKey(context, 'a', 'b:c'));
 assert(Object.isFrozen(normalizeContext(context)));
});
test('ownership rejects cross program and company', () => {assertOwner(context, context);for (const patch of [{tenant_key: 'overseas'}, {company_id: 2}, {company_id: '1'}]) assert.throws(() => assertOwner(context, {...context, ...patch}));});
test('branding rejects CSS injection and invalid HSL', () => {
 const brand = {schema_version: 1, revision: 1, tenant_key: 'cineva', company_id: 1, brand: {display_name: 'Cineva', logo_asset_id: null}, tokens: {primary: '37 62% 31%'}};
 assert.equal(validateBrand(brand).tokens.primary, '37 62% 31%');
 for (const tokens of [{primary: 'url(https://evil.test)'}, {primary: '400 20% 20%'}, {'arbitrary-css': '20 20% 20%'}]) assert.throws(() => validateBrand({...brand, tokens}));
});
test('brand logo requires matching ownership/id, safe HTTPS and supported MIME', () => {
 const brand = {schema_version: 1, revision: 1, tenant_key: 'cineva', company_id: 1, brand: {display_name: 'Cineva', logo_asset_id: 'logo'}, tokens: {}};
 const asset = {tenant_key: 'cineva', company_id: 1, asset_id: 'logo', url: 'https://cineva.com/brand/logo.png', mime_type: 'image/png'};
 assert(validateBrand({...brand, asset}).asset);
 for (const patch of [{company_id: 2}, {asset_id: 'other'}, {url: 'javascript:alert(1)'}, {mime_type: 'image/svg+xml'}]) assert.throws(() => validateBrand({...brand, asset: {...asset, ...patch}}));
});
