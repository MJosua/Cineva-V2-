'use strict';
const crypto = require('node:crypto');
const {TenantError, requiredString} = require('../../../../1.Frontend/packages/tenant-contracts');
function createOidcBridge({config, transactions, verifyIdToken, fetchImpl = fetch, clock = Date.now}) {
  for (const key of ['issuer', 'authorization_endpoint', 'token_endpoint', 'redirect_uri']) {
    const url = new URL(config[key]);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('OIDC requires explicit HTTPS URLs');
  }
  if (new URL(config.authorization_endpoint).origin !== new URL(config.issuer).origin || new URL(config.token_endpoint).origin !== new URL(config.issuer).origin) throw new Error('Unexpected IdP endpoint origin');
  requiredString(config.client_id, 'CLIENT_ID'); requiredString(config.client_secret, 'CLIENT_SECRET', 4096);
  if (!transactions?.put || !transactions?.consume || typeof verifyIdToken !== 'function') throw new Error('Atomic transaction store and cryptographic verifier required');
  const random = () => crypto.randomBytes(32).toString('base64url');
  return {
    async begin(sessionBinding, returnTo = '/') {
      requiredString(sessionBinding, 'SESSION_BINDING');
      if (typeof returnTo !== 'string' || !/^\/(?!\/)/.test(returnTo) || /[\\\u0000-\u001f]/.test(returnTo)) throw new TenantError('INVALID_RETURN_PATH', 400);
      const state = random(), verifier = random(), nonce = random();
      await transactions.put(state, {sessionBinding, verifier, nonce, returnTo, expires_at: clock() + 5 * 60 * 1000});
      const url = new URL(config.authorization_endpoint);
      Object.entries({client_id: config.client_id, response_type: 'code', scope: 'openid profile email', redirect_uri: config.redirect_uri, state, nonce, code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256'}).forEach(([key, value]) => url.searchParams.set(key, value));
      return url.href;
    },
    async finish({code, state, sessionBinding}) {
      requiredString(code, 'AUTHORIZATION_CODE', 4096); requiredString(state, 'OIDC_STATE'); requiredString(sessionBinding, 'SESSION_BINDING');
      const tx = await transactions.consume(state); // MUST be atomic, one-use, and expire server-side.
      if (!tx || tx.expires_at <= clock() || tx.sessionBinding !== sessionBinding) throw new TenantError('INVALID_OIDC_TRANSACTION', 401);
      const response = await fetchImpl(config.token_endpoint, {method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: {'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${Buffer.from(`${encodeURIComponent(config.client_id)}:${encodeURIComponent(config.client_secret)}`).toString('base64')}`}, body: new URLSearchParams({grant_type: 'authorization_code', code, code_verifier: tx.verifier, redirect_uri: config.redirect_uri})});
      if (!response.ok) throw new TenantError('OIDC_EXCHANGE_FAILED', 401);
      const tokens = await response.json();
      if (typeof tokens.id_token !== 'string') throw new TenantError('OIDC_ID_TOKEN_REQUIRED', 401);
      let claims;
      try {claims = await verifyIdToken(tokens.id_token, {issuer: config.issuer, audience: config.client_id, algorithms: ['RS256']});}
      catch {throw new TenantError('OIDC_ID_TOKEN_INVALID', 401);}
      if (!claims || typeof claims !== 'object') throw new TenantError('OIDC_ID_TOKEN_INVALID', 401);
      const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (claims.iss !== config.issuer || !audiences.includes(config.client_id) || (audiences.length > 1 && claims.azp !== config.client_id) || (claims.azp != null && claims.azp !== config.client_id) || claims.nonce !== tx.nonce || !Number.isFinite(claims.exp) || claims.exp * 1000 <= clock() || !Number.isFinite(claims.iat) || claims.iat * 1000 > clock() + 5000) throw new TenantError('INVALID_ID_TOKEN_CLAIMS', 401);
      return {identity: {issuer: config.issuer, subject: requiredString(claims.sub, 'SUBJECT'), verified: true}, returnTo: tx.returnTo};
      // Identity is not membership. Tokens are not returned to the browser by this bridge.
    },
  };
}
module.exports = {createOidcBridge};
