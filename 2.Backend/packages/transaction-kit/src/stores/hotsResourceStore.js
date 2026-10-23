/**
 * @hots/transaction-kit — stock store for the CURRENT HOTS inventory model
 * Head: src/index.js
 * Tables (3.Knowledge/schema/hots.md): resource_m_data(id, resource_label, attributes JSON with `stocks` map,
 * `total_stock`) and resource_t_log(transaction_id, resource_id, location_id, operation, quantity,
 * current_stock_snapshot, user_id, notes, created_at). Same shapes core/transaction/types/inventory.js writes,
 * incl. the legacy `current_stock` → `stocks.DEFAULT` migration — so HOTS screens keep working.
 *
 * Note: POSM trigger script/trigger-functions/deduct_posm_stock.js still decrements the legacy
 * `$.current_stock` path; items handled by this store use `stocks` only (documented gap, HOTS unchanged).
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { assertIdentifier } = require('../kernel/idempotency');

function createHotsResourceStore({ itemTable = 'hots.resource_m_data', logTable = 'hots.resource_t_log', category = null } = {}) {
  assertIdentifier(itemTable);
  assertIdentifier(logTable);

  return {
    async lockItems(conn, ids) {
      if (!ids.length) return new Map();
      const where = category ? 'id IN (?) AND resource_category = ?' : 'id IN (?)';
      const params = category ? [ids, category] : [ids];
      const [rows] = await conn.query(`SELECT id, resource_label, attributes FROM ${itemTable} WHERE ${where} ORDER BY id FOR UPDATE`, params);
      const map = new Map();
      for (const row of rows) {
        const attributes = typeof row.attributes === 'string' ? JSON.parse(row.attributes || '{}') : row.attributes || {};
        const stocks = { ...(attributes.stocks || {}) };
        if (attributes.current_stock !== undefined && Object.keys(stocks).length === 0) stocks.DEFAULT = Number(attributes.current_stock) || 0;
        map.set(String(row.id), { id: row.id, label: row.resource_label, stocks, attributes });
      }
      return map;
    },

    async saveItem(conn, item) {
      const attributes = { ...item.attributes, stocks: item.stocks };
      delete attributes.current_stock;
      attributes.total_stock = Object.values(item.stocks).reduce((t, v) => t + (Number(v) || 0), 0);
      await conn.query(`UPDATE ${itemTable} SET attributes = ? WHERE id = ?`, [JSON.stringify(attributes), item.id]);
    },

    async appendMovements(conn, rows) {
      if (!rows.length) return;
      await conn.query(
        `INSERT INTO ${logTable} (transaction_id, resource_id, location_id, operation, quantity, current_stock_snapshot, user_id, notes, created_at) VALUES ?`,
        [rows.map((r) => [r.transaction_id, r.item_id, numericOrNull(r.location_id), r.operation, r.quantity, r.snapshot, r.user_id, r.notes, new Date()])],
      );
    },
  };
}

// resource_t_log.location_id is INT; the legacy 'DEFAULT' bucket is stored as NULL (as before).
const numericOrNull = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

module.exports = { createHotsResourceStore };
