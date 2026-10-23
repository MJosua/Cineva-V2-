import {TenantError, normalizeContext, contextKey, assertOwner, validateBrand} from '@hots/tenant-contracts';

/** Transport is injected: use app-core's exact-origin HTTP/CSRF client. No token storage here. */
export function createTenantClient({transport, onDisposeError = () => {}}) {
  let current = null, generation = 0, disposed = false;
  const cache = new Map(), controllers = new Set(), subscriptions = new Set(), listeners = new Set();
  const snapshot = () => current;
  function reset() {
    generation++; current = null; cache.clear();
    for (const controller of controllers) controller.abort();
    controllers.clear();
    for (const close of subscriptions) { try { close(); } catch (error) { onDisposeError(error); } }
    subscriptions.clear();
    for (const listener of listeners) listener();
  }
  function ensure() { if (disposed) throw new TenantError('CLIENT_DISPOSED', 409); }
  async function selectCompany(company_id) {
    ensure(); reset();
    const ticket = generation;
    const reply = await transport('/context', {method: 'POST', body: {company_id}});
    if (ticket !== generation || disposed) throw new TenantError('STALE_CONTEXT', 409);
    const context = normalizeContext(reply.context);
    if (context.company_id !== company_id || typeof reply.context_id !== 'string' || !reply.context_id) throw new TenantError('INVALID_CONTEXT_RESPONSE', 400);
    current = Object.freeze({context, context_id: reply.context_id});
    for (const listener of listeners) listener();
    return current;
  }
  async function request(path, options = {}) {
    ensure();
    // Fixed path within the injected platform transport; no credentials/context sent to arbitrary hosts.
    if (!/^\/[a-z0-9/_-]+$/i.test(path) || path.startsWith('//') || path === '/context') throw new TenantError('INVALID_SCOPED_PATH', 400);
    if (!current) throw new TenantError('CONTEXT_REQUIRED', 403);
    const {context, context_id} = current, ticket = generation;
    const key = contextKey(context, path);
    // Revalidate on every server read. A cached snapshot must not outlive membership revocation.
    const controller = new AbortController(); controllers.add(controller);
    try {
      const result = await transport(path, {method: 'GET', signal: controller.signal, context_id});
      if (ticket !== generation || disposed) throw new TenantError('STALE_CONTEXT', 409);
      // Every scoped response carries its owner; stale/revoked server contexts cannot be silently adopted.
      assertOwner(context, result.context);
      if (contextKey(result.context) !== contextKey(context)) { reset(); throw new TenantError('MEMBERSHIP_CHANGED', 403); }
      if (options.cache === true) cache.set(key, result);
      return result;
    } catch (error) {
      if (ticket === generation && [401, 403].includes(error?.status)) reset();
      throw error;
    } finally { controllers.delete(controller); }
  }
  return {
    snapshot,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async bootstrap() { ensure(); return transport('/bootstrap', {method: 'GET'}); },
    selectCompany, request,
    async acceptInvitation(token) {
      ensure(); reset(); const ticket = generation;
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new TenantError('INVALID_INVITATION', 400);
      const result = await transport('/invitations/accept', {method: 'POST', body: {token}});
      if (ticket !== generation || disposed) throw new TenantError('STALE_CONTEXT', 409);
      return result;
    },
    async brand() {
      const result = await request('/brand'); const brand = validateBrand(result.brand); assertOwner(result.context, brand);
      if (!current || contextKey(current.context) !== contextKey(result.context)) throw new TenantError('STALE_CONTEXT', 409);
      return brand;
    },
    addSubscription(close) { ensure(); if (!current) throw new TenantError('CONTEXT_REQUIRED', 403); subscriptions.add(close); return () => { if (subscriptions.delete(close)) close(); }; },
    clear() { reset(); },
    dispose() { reset(); disposed = true; listeners.clear(); },
  };
}
