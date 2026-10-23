const test = require('node:test');
const assert = require('node:assert/strict');
const {createInvitationService} = require('../src/invitations');
function fixture() {
 const rows = new Map();let grants = 0, authorized = true;
 const context = {schema_version: 1, tenant_key: 'cineva', company_id: 1, user_id: 'admin', membership_version: '1'};
 const service = createInvitationService({authorizeContext: (c, permission) => {assert.equal(c, context);assert.equal(permission, 'memberships.invite');}, resolvePrincipal: async req => ({identity: {user_id: req.user_id}, tenant_key: req.tenant_key}), resolveRole: async () => authorized ? {permissions: ['brand.read']} : null, unitOfWork: {run: fn => fn({})},
 invites: {insert: async (_c, row) => rows.set(row.token_hash, row), lockByHash: async (_c, hash) => rows.get(hash), markAccepted: async (_c, hash) => {rows.get(hash).accepted_at = 1;}}, grantMembership: async (_c, row) => {grants++;return {tenant_key: row.tenant_key, company_id: row.company_id, user_id: row.invitee_user_id};}});
 return {context, service, rows, grants: () => grants, revokeIssuer: () => {authorized = false;}};
}
test('invite stores only token hash and grants only the intended program/company/user', async () => {
 const f = fixture(), invitation = await f.service.issue(f.context, {invitee_user_id: '7', role_key: 'client'});
 assert(!JSON.stringify([...f.rows.values()]).includes(invitation.token));
 const accepted = await f.service.accept({user_id: '7', tenant_key: 'cineva'}, invitation.token);assert.equal(accepted.company_id, 1);assert.equal(f.grants(), 1);
 await assert.rejects(f.service.accept({user_id: '7', tenant_key: 'cineva'}, invitation.token));assert.equal(f.grants(), 1);
});
test('invite cannot be accepted by another user or tenant', async () => {const f = fixture(), invitation = await f.service.issue(f.context, {invitee_user_id: '7', role_key: 'client'});for (const req of [{user_id: '8', tenant_key: 'cineva'}, {user_id: '7', tenant_key: 'overseas'}]) await assert.rejects(f.service.accept(req, invitation.token));assert.equal(f.grants(), 0);});
test('issuer permission must remain delegatable at acceptance', async () => {const f = fixture(), invitation = await f.service.issue(f.context, {invitee_user_id: '7', role_key: 'client'});f.revokeIssuer();await assert.rejects(f.service.accept({user_id: '7', tenant_key: 'cineva'}, invitation.token), {code: 'ROLE_NOT_DELEGATABLE'});assert.equal(f.grants(), 0);});
