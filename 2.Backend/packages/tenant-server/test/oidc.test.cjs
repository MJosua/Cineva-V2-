const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {createOidcBridge} = require('../src/oidc');
const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
const config = {issuer: 'https://idp.test/oauth', authorization_endpoint: 'https://idp.test/oauth/authorize', token_endpoint: 'https://idp.test/oauth/token', redirect_uri: 'https://cineva.com/auth/callback', client_id: 'cineva-web', client_secret: 'server-only-test'};
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
function fixture(patch = {}, verifyFail = false) {
 const transactions = new Map();let nonce;let posted;
 const bridge = createOidcBridge({config, clock: () => 100000, transactions: {put: async (id, v) => {nonce = v.nonce;transactions.set(id, v);}, consume: async id => {const row = transactions.get(id);transactions.delete(id);return row;}},
 fetchImpl: async (_url, request) => {posted = request;const claims = {iss: config.issuer, aud: config.client_id, sub: 'opaque-subject', nonce, exp: 200, iat: 100, ...patch};const data = `${encode({alg: 'RS256'})}.${encode(claims)}`;return {ok: true, json: async () => ({id_token: `${data}.${crypto.sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url')}`})};},
 verifyIdToken: async (token, options) => {
  assert.deepEqual(options.algorithms, ['RS256']);if (verifyFail) throw Error('signature rejected');
  const [h, p, sig] = token.split('.');assert(crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(sig, 'base64url')));return JSON.parse(Buffer.from(p, 'base64url').toString());
 }});
 return {bridge, transactions, posted: () => posted};
}
test('SSO uses server-owned state nonce and PKCE; returns opaque identity without token', async () => {
 const f = fixture(), url = new URL(await f.bridge.begin('browser-session', '/workspaces'));
 assert.equal(url.searchParams.get('code_challenge_method'), 'S256');assert(url.searchParams.get('nonce'));assert(!url.href.includes('server-only-test'));
 const result = await f.bridge.finish({code: 'code', state: url.searchParams.get('state'), sessionBinding: 'browser-session'});
 assert.equal(result.identity.subject, 'opaque-subject');assert.equal(result.id_token, undefined);assert.equal(result.returnTo, '/workspaces');assert(f.posted().body.get('code_verifier'));
 await assert.rejects(f.bridge.finish({code: 'code', state: url.searchParams.get('state'), sessionBinding: 'browser-session'}), {code: 'INVALID_OIDC_TRANSACTION'});
});
for (const [name, patch] of Object.entries({issuer: {iss: 'https://evil.test'}, audience: {aud: 'other'}, nonce: {nonce: 'wrong'}, expired: {exp: 50}, future: {iat: 500}, multiAudience: {aud: ['cineva-web', 'other']}})) test(`SSO rejects invalid ${name}`, async () => {const f = fixture(patch), url = new URL(await f.bridge.begin('browser-session'));await assert.rejects(f.bridge.finish({code: 'code', state: url.searchParams.get('state'), sessionBinding: 'browser-session'}), {code: 'INVALID_ID_TOKEN_CLAIMS'});});
test('SSO rejects another browser session and invalid signature', async () => {
 const f = fixture(), url = new URL(await f.bridge.begin('one'));await assert.rejects(f.bridge.finish({code: 'code', state: url.searchParams.get('state'), sessionBinding: 'two'}));
 const g = fixture({}, true), other = new URL(await g.bridge.begin('one'));await assert.rejects(g.bridge.finish({code: 'code', state: other.searchParams.get('state'), sessionBinding: 'one'}));
});
test('SSO returnTo cannot navigate to another origin', async () => {const f = fixture();for (const path of ['//evil.test', '/\\evil.test', 'https://evil.test']) await assert.rejects(f.bridge.begin('one', path));});
