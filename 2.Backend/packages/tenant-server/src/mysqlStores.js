'use strict';
const crypto = require('node:crypto');
const {tenantKey} = require('../../../../1.Frontend/packages/tenant-contracts');
/** New additive schema only. query returns rows; UoW supplies mysql2 promise connection. */
function createMysqlRuntimeStore({appKey, kind, query, unitOfWork, clock = Date.now}) {
  tenantKey(appKey);
  if (!['session', 'context', 'login'].includes(kind) || typeof query !== 'function' || !unitOfWork?.run) throw new Error('Explicit store namespace, query and transactional UoW required');
  function params(key) {
    if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(key)) throw new Error('Opaque 256-bit key required');
    return [appKey, kind, crypto.createHash('sha256').update(key).digest('hex')];
  }
  function value(row) {
    if (!row) return null;
    const parsed = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    if (!parsed || !Number.isSafeInteger(parsed.expires_at) || parsed.expires_at <= clock()) return null;
    return parsed;
  }
  return {
    async put(key, record) {
      const scope = params(key);
      if (!record || !Number.isSafeInteger(record.expires_at) || record.expires_at <= clock()) throw new Error('Future absolute expiry required');
      const payload = JSON.stringify(record);
      // INSERT deliberately rejects collisions; a consumed login transaction cannot be resurrected.
      return unitOfWork.run(async connection => {
        await connection.execute('INSERT INTO t_tenant_runtime_store (app_key, store_kind, key_hash, payload, expires_at) VALUES (?, ?, ?, ?, ?)', [...scope, payload, record.expires_at]);
      });
    },
    async get(key) {
      const rows = await query('SELECT payload FROM t_tenant_runtime_store WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1 AND expires_at > ? LIMIT 1', [...params(key), clock()]);
      return value(rows[0]);
    },
    async delete(key) {
      return unitOfWork.run(async connection => {
        await connection.execute('UPDATE t_tenant_runtime_store SET is_active = 0 WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1', params(key));
      });
    },
    async consume(key) {
      const scope = params(key);
      return unitOfWork.run(async connection => {
        const [rows] = await connection.execute('SELECT payload FROM t_tenant_runtime_store WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1 AND expires_at > ? LIMIT 1 FOR UPDATE', [...scope, clock()]);
        if (!rows.length) return null;
        await connection.execute('UPDATE t_tenant_runtime_store SET is_active = 0 WHERE app_key = ? AND store_kind = ? AND key_hash = ? AND is_active = 1', scope);
        return value(rows[0]);
      });
    },
  };
}
module.exports = {createMysqlRuntimeStore};
