/**
 * @hots/transaction-kit — idempotency store
 * Head: src/index.js
 * Pattern from core/outbox.js (UNIQUE idempotency_key + ER_DUP_ENTRY = "already done").
 * New: the stored result is returned on a repeat, so a double click / retry gets the SAME answer
 * instead of a second order / second stock deduction.
 *
 * Table (proposal, see 3.Knowledge/domains/shared-platform/sql/transaction_kit_ddl.sql):
 *   tx_idempotency(idem_key PK, tx_type, result_json, created_at)
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */

function createIdempotencyStore({ table = 'hots.tx_idempotency' } = {}) {
  assertIdentifier(table);
  return {
    async find(conn, key) {
      const [rows] = await conn.query(`SELECT result_json FROM ${table} WHERE idem_key = ? FOR UPDATE`, [key]);
      if (!rows.length) return undefined; // not seen yet (a stored result may itself be null)
      const raw = rows[0].result_json;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    },
    async save(conn, key, txType, result) {
      await conn.query(`INSERT INTO ${table} (idem_key, tx_type, result_json, created_at) VALUES (?, ?, ?, NOW())`, [
        key,
        txType,
        JSON.stringify(result === undefined ? null : result),
      ]);
    },
  };
}

function assertIdentifier(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)?$/.test(name)) throw new Error(`Invalid SQL identifier: ${name}`);
}

module.exports = { createIdempotencyStore, assertIdentifier };
