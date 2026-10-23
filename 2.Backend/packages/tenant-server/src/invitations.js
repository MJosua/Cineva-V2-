'use strict';
const crypto = require('node:crypto');
const {TenantError, requiredString} = require('../../../../1.Frontend/packages/tenant-contracts');
/** Stores implement locking/unique grant inside the supplied transaction-kit unit of work. */
function createInvitationService({authorizeContext, resolvePrincipal, resolveRole, unitOfWork, invites, grantMembership, clock = Date.now}) {
 for (const fn of [authorizeContext, resolvePrincipal, resolveRole, unitOfWork?.run, invites?.insert, invites?.lockByHash, invites?.markAccepted, grantMembership]) if (typeof fn !== 'function') throw new Error('Invitation transaction, policy and persistence adapters required');
 const hash = token => crypto.createHash('sha256').update(token).digest('hex');
 return {
  async issue(context, {invitee_user_id, role_key}) {
   await authorizeContext(context, 'memberships.invite'); requiredString(invitee_user_id, 'INVITEE_USER_ID'); requiredString(role_key, 'ROLE_KEY');
   const role = await resolveRole(context, role_key); // Explicit delegation policy, not global role_id promotion.
   if (!role || !Array.isArray(role.permissions) || role.permissions.some(p => typeof p !== 'string' || !p || p === '*')) throw new TenantError('ROLE_NOT_DELEGATABLE');
   const token = crypto.randomBytes(32).toString('base64url');
   const invitation = {tenant_key: context.tenant_key, company_id: context.company_id, invitee_user_id, role_key, permissions: [...role.permissions], token_hash: hash(token), expires_at: clock() + 24 * 60 * 60 * 1000, issued_by: context.user_id};
   await unitOfWork.run(connection => invites.insert(connection, invitation));
   return {token, expires_at: invitation.expires_at}; // Only returned to authorized issuer; never logged or auto-sent.
  },
  async accept(req, token) {
   if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new TenantError('INVALID_INVITATION', 400);
   const principal = await resolvePrincipal(req);
   return unitOfWork.run(async connection => {
    const invitation = await invites.lockByHash(connection, hash(token));
    if (!invitation || invitation.accepted_at || invitation.revoked_at || !Number.isFinite(invitation.expires_at) || invitation.expires_at <= clock() || invitation.invitee_user_id !== principal.identity.user_id || invitation.tenant_key !== principal.tenant_key) throw new TenantError('INVALID_INVITATION');
    // Recheck issuer's current delegation authority in persistence/policy adapter at acceptance time.
    const role = await resolveRole({tenant_key: invitation.tenant_key, company_id: invitation.company_id, user_id: invitation.issued_by}, invitation.role_key);
    if (!role || !Array.isArray(role.permissions) || role.permissions.some(p => typeof p !== 'string' || !p || p === '*')) throw new TenantError('ROLE_NOT_DELEGATABLE');
    const membership = await grantMembership(connection, {...invitation, permissions: [...role.permissions]}, {current_role: role});
    if (!membership || membership.tenant_key !== invitation.tenant_key || membership.company_id !== invitation.company_id) throw new TenantError('INVALID_MEMBERSHIP');
    if (membership.user_id !== principal.identity.user_id) throw new TenantError('INVALID_MEMBERSHIP');
    await invites.markAccepted(connection, invitation.token_hash, clock());
    return {tenant_key: membership.tenant_key, company_id: membership.company_id};
   });
  },
 };
}
module.exports = {createInvitationService};
