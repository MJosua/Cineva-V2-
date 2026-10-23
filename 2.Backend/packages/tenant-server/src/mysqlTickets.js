'use strict';
const {TenantError, companyId} = require('../../../../1.Frontend/packages/tenant-contracts');
/** Read pilot. No owner inference from legacy company=0, service, creator or JSON EAV. */
function createMysqlTicketReads({query, registry}) {
  if (typeof query !== 'function' || !registry?.get) throw new Error('Query and verified program registry required');
  const from = ' FROM t_ticket t JOIN t_tenant_ticket_owner o ON o.ticket_id = t.ticket_id AND o.company_id = t.company_id WHERE o.program_id = ? AND o.company_id = ?';
  const projection = 'SELECT ? AS tenant_key, o.company_id, t.ticket_id, t.title, t.status_id, t.service_id';
  const scope = context => [registry.get(context.tenant_key).program_id, companyId(context.company_id)];
  return {
    async get(context, id) {
      if (typeof id !== 'string' || !id || id.length > 36) throw new TenantError('INVALID_TICKET_ID', 400);
      const rows = await query(projection + from + ' AND t.ticket_id = ? LIMIT 1', [context.tenant_key, ...scope(context), id]);
      if (!rows.length) throw new TenantError('TICKET_NOT_FOUND', 404);
      return rows[0];
    },
    async list(context, {limit = 25, offset = 0} = {}) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) throw new TenantError('INVALID_PAGINATION', 400);
      const binding = scope(context);
      const totals = await query('SELECT COUNT(*) AS total' + from, binding);
      const rows = await query(projection + from + ' ORDER BY t.ticket_id LIMIT ? OFFSET ?', [context.tenant_key, ...binding, limit, offset]);
      return {rows, total: Number(totals[0].total)};
    },
  };
}
module.exports = {createMysqlTicketReads};
