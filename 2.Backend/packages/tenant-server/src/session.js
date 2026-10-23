'use strict';
const crypto = require('node:crypto');
const {TenantError, requiredString} = require('../../../../1.Frontend/packages/tenant-contracts');
function readCookie(req, name) {
 const matches = String(req.headers?.cookie || '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${name}=`));
 if (matches.length !== 1) return null;
 try {return decodeURIComponent(matches[0].slice(name.length + 1));} catch {return null;}
}
function setCookie(res, cookie) {
 const previous = res.getHeader('Set-Cookie');res.setHeader('Set-Cookie', [...(Array.isArray(previous) ? previous : previous ? [previous] : []), cookie]);
}
function createAppSessionManager({store, resolveUser, origin, cookieName = '__Host-cineva_session', csrfCookieName = 'cineva_csrf', ttlMs = 8 * 60 * 60 * 1000, clock = Date.now}) {
 if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) throw new Error('Finite positive session TTL required');
 if (new URL(origin).origin !== origin || !origin.startsWith('https://')) throw new Error('Explicit HTTPS app origin required');
 if (!/^__Host-[a-z0-9_-]+$/i.test(cookieName) || !/^[a-z0-9_-]+$/i.test(csrfCookieName)) throw new Error('Invalid application cookie names');
 if (!store?.get || !store?.put || !store?.delete || typeof resolveUser !== 'function') throw new Error('Persistent session store and active user resolver required');
 const options = '; Path=/; Secure; SameSite=Lax';
 async function read(req) {
  const sid = readCookie(req, cookieName);
  if (!sid || !/^[A-Za-z0-9_-]{43}$/.test(sid)) throw new TenantError('AUTHENTICATION_REQUIRED', 401);
  const session = await store.get(sid);
  if (!session || session.expires_at <= clock()) throw new TenantError('SESSION_EXPIRED', 401);
  const user = await resolveUser(session.user_id);
  if (!user || user.active !== true || user.user_id !== session.user_id) throw new TenantError('ACCOUNT_INACTIVE', 401);
  return {session, sid};
 }
 return {
  async issue(res, userId) {
   requiredString(userId, 'USER_ID');
   const user = await resolveUser(userId);if (!user || user.active !== true || user.user_id !== userId) throw new TenantError('ACCOUNT_INACTIVE', 401);
   const sid = crypto.randomBytes(32).toString('base64url'), csrf = crypto.randomBytes(32).toString('base64url');
   await store.put(sid, {user_id: userId, csrf, expires_at: clock() + ttlMs});
   setCookie(res, `${cookieName}=${sid}${options}; HttpOnly; Max-Age=${Math.floor(ttlMs / 1000)}`);
   setCookie(res, `${csrfCookieName}=${csrf}${options}; Max-Age=${Math.floor(ttlMs / 1000)}`);
  },
  async resolveIdentity(req) {const {session, sid} = await read(req);return {user_id: session.user_id, session_id: sid, active: true};},
  async assertMutation(req) {
   if (req.headers.origin !== origin) throw new TenantError('INVALID_ORIGIN');
   const {session} = await read(req), token = req.headers['x-csrf-token'];
   if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token) || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(session.csrf))) throw new TenantError('INVALID_CSRF');
  },
  async revoke(req, res) {
   await this.assertMutation(req);const {sid} = await read(req);await store.delete(sid);
   setCookie(res, `${cookieName}=${options}; HttpOnly; Max-Age=0`);setCookie(res, `${csrfCookieName}=${options}; Max-Age=0`);
  },
 };
}
module.exports = {createAppSessionManager, readCookie, setCookie};
