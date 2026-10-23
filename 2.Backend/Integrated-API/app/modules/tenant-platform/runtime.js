'use strict';
const {createTenantEngine} = require('../../../../packages/tenant-server');
const {createMysqlMemberships} = require('../../../../packages/tenant-server/src/mysqlMemberships');
const {createProgramRegistry} = require('../../../../packages/tenant-server/src/registry');
const {createMysqlTicketReads} = require('../../../../packages/tenant-server/src/mysqlTickets');
const {createMysqlCompanyScopes} = require('../../../../packages/tenant-server/src/mysqlCompanyScopes');
/** Explicit composition root. Never reads env secrets, opens pools, creates tables or starts cron. */
function createTenantRuntime({query, programs, rolePermissions, resolveIdentity, resolveTenant, contextStore, branding, assertMutation, oidc, sessions, identityService, memberships: suppliedMemberships}) {
  if (typeof assertMutation !== 'function') throw new Error('Cookie/Origin/CSRF verification adapter required');
  const memberships = suppliedMemberships || createMysqlMemberships({query, programs, rolePermissions});
  return {engine: createTenantEngine({memberships, resolveIdentity, resolveTenant, contextStore, branding}), assertMutation, oidc, sessions, identityService};
}
module.exports = {createTenantRuntime};

/** One deployment binds one program. Infrastructure adapters are supplied explicitly. */
function createRegisteredTenantRuntime({registry, tenantKey, ticketPilot = false, membershipMode = 'legacy', ...adapters}) {
  if (typeof ticketPilot !== 'boolean') throw new Error('Explicit ticket pilot flag required');
  const programs = createProgramRegistry(registry), bound = programs.bind(tenantKey);
  if(!['legacy','hierarchy'].includes(membershipMode))throw new Error('Explicit membership mode required');
  const memberships = membershipMode === 'hierarchy' ? createMysqlCompanyScopes({query:adapters.query,programs:bound.programs}) : undefined;
  const runtime = createTenantRuntime({...adapters, memberships, programs: bound.programs, resolveTenant: bound.resolveTenant});
  return {...runtime, program: bound.program, tickets: ticketPilot ? runtime.engine.repository(createMysqlTicketReads({query: adapters.query, registry: programs})) : null};
}
module.exports.createRegisteredTenantRuntime = createRegisteredTenantRuntime;
