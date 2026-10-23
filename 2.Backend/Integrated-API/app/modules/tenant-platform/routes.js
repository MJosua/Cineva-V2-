'use strict';
const {TenantError} = require('../../../../packages/tenant-server');
const crypto = require('node:crypto');
const {readCookie, setCookie} = require('../../../../packages/tenant-server/src/session');
/** No DB/runtime imports: caller supplies authenticated identity, membership and persistence adapters. */
function createTenantRouter({Router, runtime = null, logger}) {
  const router = Router();
  router.use((_req, res, next) => {res.setHeader('Cache-Control', 'no-store'); next();});
  const handle = action => async (req, res) => {
    try {
      if (!runtime) throw new TenantError('TENANT_PLATFORM_NOT_CONFIGURED', 503);
      const data = await action(req, runtime, res);
      if (!res.headersSent) res.json({success: true, data});
    } catch (error) {
      if (!(error instanceof TenantError)) logger?.error?.('[TENANT][ERROR] : request_failed');
      const status = error instanceof TenantError ? error.status : 500;
      res.status(status).json({success: false, error: {code: error instanceof TenantError ? error.code : 'TENANT_PLATFORM_ERROR'}});
    }
  };
  router.get('/sso/start', handle(async (_req, r, res) => {
    if (!r.oidc) throw new TenantError('SSO_NOT_CONFIGURED', 503);
    const binding = crypto.randomBytes(32).toString('base64url');
    const url = await r.oidc.begin(binding, r.program?.workspace_path || '/hots/platform/workspaces');
    const cookie = r.program ? `__Host-${r.program.tenant_key}_login` : '__Host-cineva_login';
    setCookie(res, `${cookie}=${binding}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`);
    res.redirect(303, url);
  }));
  router.get('/sso/callback', handle(async (req, r, res) => {
    if (!r.oidc || !r.sessions || !r.identityService?.resolveOrRegister) throw new TenantError('SSO_NOT_CONFIGURED', 503);
    const cookie = r.program ? `__Host-${r.program.tenant_key}_login` : '__Host-cineva_login';
    const result = await r.oidc.finish({code: req.query.code, state: req.query.state, sessionBinding: readCookie(req, cookie)});
    const user = await r.identityService.resolveOrRegister(result.identity);
    await r.sessions.issue(res, user.user_id);
    setCookie(res, `${cookie}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    res.redirect(303, result.returnTo);
  }));
  router.post('/logout', handle(async (req, r, res) => {
    if (!r.sessions) throw new TenantError('SESSION_NOT_CONFIGURED', 503);
    await r.sessions.revoke(req, res);return {signed_out: true};
  }));
  router.post('/invitations', handle(async (req, r) => {
    if (!r.invitations || !r.assertMutation) throw new TenantError('INVITATIONS_NOT_CONFIGURED', 503);
    await r.assertMutation(req);
    const context = await r.engine.authorize(req, req.headers['x-workspace-context'], 'memberships.invite');
    return r.invitations.issue(context, {invitee_user_id: req.body?.invitee_user_id, role_key: req.body?.role_key});
  }));
  router.post('/invitations/accept', handle(async (req, r) => {
    if (!r.invitations || !r.assertMutation) throw new TenantError('INVITATIONS_NOT_CONFIGURED', 503);
    await r.assertMutation(req);
    return r.invitations.accept(req, req.body?.token);
  }));
  router.get('/bootstrap', handle((req, r) => r.engine.bootstrap(req)));
  router.get('/tickets', handle(async (req, r) => {
    if (!r.tickets) throw new TenantError('TICKET_PILOT_NOT_CONFIGURED', 503);
    const context = await r.engine.authorize(req, req.headers['x-workspace-context'], 'resources.read');
    return {context, ...await r.tickets.list(context, {limit: req.query.limit === undefined ? 25 : Number(req.query.limit), offset: req.query.offset === undefined ? 0 : Number(req.query.offset)})};
  }));
  router.get('/tickets/:id', handle(async (req, r) => {
    if (!r.tickets) throw new TenantError('TICKET_PILOT_NOT_CONFIGURED', 503);
    const context = await r.engine.authorize(req, req.headers['x-workspace-context'], 'resources.read');
    return {context, ticket: await r.tickets.get(context, req.params.id)};
  }));
  router.post('/context', handle(async (req, r) => {
    // Adapter must validate Origin/CSRF for cookie authentication, before context is issued.
    if (!r.assertMutation) throw new TenantError('CSRF_ADAPTER_REQUIRED', 503);
    await r.assertMutation(req);
    return r.engine.select(req, req.body?.company_id);
  }));
  router.get('/brand', handle(async (req, r) => {
    const context = await r.engine.authorize(req, req.headers['x-workspace-context'], 'brand.read');
    return {context, brand: await r.engine.brand(context)};
  }));
  return router;
}
module.exports = {createTenantRouter};
