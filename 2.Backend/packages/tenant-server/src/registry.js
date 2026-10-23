'use strict';
const {TenantError, tenantKey} = require('../../../../1.Frontend/packages/tenant-contracts');

function httpsOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password) throw new Error('Canonical HTTPS origin required');
  return value;
}

/** Server-owned deployment registry. Never accepts tenant from body/header/forwarded host. */
function createProgramRegistry(config) {
  if (config?.schema_version !== 1 || !Array.isArray(config.programs)) throw new Error('Registry version 1 required');
  const entries = new Map(), ids = new Set(), modules = new Set(), mounts = new Set();
  for (const row of config.programs) {
    const key = tenantKey(row.tenant_key);
    const apiBasePath = row.api_base_path || '/api/tenant/v1';
    if (entries.has(key) || typeof row.enabled !== 'boolean') throw new Error('Unique program and explicit enabled flag required');
    if (row.enabled) {
      if (!Number.isSafeInteger(row.program_id) || row.program_id <= 0 || ids.has(row.program_id)) throw new Error('Unique physical program ID required');
      if (typeof row.permission_module !== 'string' || !/^[a-z][a-z0-9_.-]{0,79}$/.test(row.permission_module) || modules.has(row.permission_module)) throw new Error('Unique permission namespace required');
      httpsOrigin(row.origin);
      if (!/^\/api(?:\/[a-z0-9_-]+)+$/i.test(apiBasePath)) throw new Error('Canonical API base path required');
      const mount = JSON.stringify([row.origin, apiBasePath]);
      if (mounts.has(mount)) throw new Error('Unique server program mount required');
      if (typeof row.workspace_path !== 'string' || !/^\/(?!\/)/.test(row.workspace_path) || /[\\\u0000-\u0020?#]/.test(row.workspace_path)) throw new Error('Local workspace path required');
      ids.add(row.program_id); modules.add(row.permission_module); mounts.add(mount);
    }
    entries.set(key, Object.freeze({tenant_key: key, enabled: row.enabled, program_id: row.program_id, permission_module: row.permission_module, origin: row.origin, api_base_path: apiBasePath, workspace_path: row.workspace_path}));
  }
  function get(key) {
    const row = entries.get(tenantKey(key));
    if (!row?.enabled) throw new TenantError('TENANT_NOT_CONFIGURED', 503);
    return row;
  }
  return Object.freeze({
    get,
    bind(key) {
      const row = get(key);
      return Object.freeze({program: row, programs: Object.freeze({[key]: Object.freeze({program_id: row.program_id, permission_module: row.permission_module})}), resolveTenant: () => key});
    },
    status: () => [...entries.values()].map(row => ({tenant_key: row.tenant_key, enabled: row.enabled})),
  });
}
module.exports = {createProgramRegistry};
