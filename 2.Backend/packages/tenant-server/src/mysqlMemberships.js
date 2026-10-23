'use strict';
const crypto = require('node:crypto');
const {TenantError, tenantKey, companyId} = require('../../../../1.Frontend/packages/tenant-contracts');
/** Read-only adapter for the physical HOTS 2026-10-21 snapshot. No automatic grants/backfill. */
function createMysqlMemberships({query, programs, rolePermissions = () => []}) {
  if (typeof query !== 'function' || !programs) throw new Error('Query adapter and explicit tenant/program mappings required');
  async function list(userId, key) {
    tenantKey(key);
    const program = programs[key];
    if (!program || !Number.isSafeInteger(program.program_id) || program.program_id <= 0 || typeof program.permission_module !== 'string') throw new TenantError('TENANT_NOT_CONFIGURED', 503);
    if (typeof userId !== 'string' || !/^[1-9]\d*$/.test(userId) || !Number.isSafeInteger(Number(userId)) || Number(userId) > 2147483647) throw new TenantError('INVALID_USER_ID', 401);
    const rows = await query(`SELECT a.access_id, a.user_id, a.company_id, a.role_id, a.granted_at,
      c.company_name, p.id AS permission_id, p.permission_key, p.updated_at AS permission_updated_at
      FROM user_t_program_access a
      JOIN user u ON u.user_id = a.user_id AND u.active = 1
      JOIN m_company c ON c.company_id = a.company_id AND c.is_active = 1
      LEFT JOIN user_permission p ON p.user_id = a.user_id AND p.company_id = a.company_id
        AND p.module_key = ? AND p.active = 1
      WHERE a.user_id = ? AND a.program_id = ? AND a.is_active = 1 AND a.revoked_at IS NULL
      ORDER BY a.company_id, a.access_id, p.id LIMIT 2001`, [program.permission_module, Number(userId), program.program_id]);
    if (!Array.isArray(rows) || rows.length >= 2001) throw new TenantError('MEMBERSHIP_RESULT_TOO_LARGE', 503);
    const groups = new Map();
    for (const row of rows) {
      const id = companyId(row.company_id);
      let group = groups.get(id);
      if (group && group.access_id !== row.access_id) throw new TenantError('AMBIGUOUS_MEMBERSHIP', 503);
      if (!group) {group = {access_id: row.access_id, rows: []}; groups.set(id, group);}
      group.rows.push(row);
    }
    return [...groups.values()].map(({rows: group}) => {
      const row = group[0], role = rolePermissions({tenant_key: key, company_id: row.company_id, role_id: row.role_id});
      if (!Array.isArray(role)) throw new TenantError('INVALID_ROLE_POLICY', 503);
      const permissions = [...new Set([...role, ...group.filter(r => r.permission_key != null).map(r => r.permission_key)])].sort();
      const version = crypto.createHash('sha256').update(JSON.stringify({group, role})).digest('hex');
      return {user_id: userId, tenant_key: key, company_id: row.company_id, company_name: row.company_name, active: true, permissions, version};
    });
  }
  return {list, async get(userId, key, id) {companyId(id); return (await list(userId, key)).find(m => m.company_id === id) || null;}};
}
module.exports = {createMysqlMemberships};
