/**
 * @hots/transaction-kit — transactional outbox
 * Head: src/index.js
 * Source: Integrated-API core/outbox.js (addEvent, claimAtomic, claimEvents with FOR UPDATE SKIP LOCKED,
 * ER_DUP_ENTRY → DUPLICATE). Defaults target the existing `trigger_outbox` table.
 *
 * Difference: `publish()` writes with the CALLER's connection, i.e. inside the business transaction.
 * The event exists if and only if the data was committed — e-mails/notifications are sent by a worker
 * after commit, never twice (unique idempotency_key + atomic claim).
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { assertIdentifier } = require('./idempotency');
const { isDuplicate } = require('./errors');

function createOutbox({ table = 'hots.trigger_outbox' } = {}) {
  assertIdentifier(table);

  /** @param events [{ event_type, ticket_id?, service_id?, version?, idempotency_key?, ...payload }] */
  async function publish(conn, events) {
    const saved = [];
    for (const event of events || []) {
      const version = event.version || event.event_version || 1;
      const ref = event.ticket_id != null ? event.ticket_id : event.ref_id;
      const key = event.idempotency_key || `${event.event_type}_${ref}_v${version}`;
      try {
        const [result] = await conn.query(
          `INSERT INTO ${table} (event_type, event_version, ticket_id, service_id, payload, status, idempotency_key, created_at)
           VALUES (?, ?, ?, ?, ?, 'PENDING', ?, NOW())`,
          [event.event_type, version, ref != null ? String(ref) : null, event.service_id || null, JSON.stringify(event), key],
        );
        saved.push({ id: result.insertId, idempotency_key: key, duplicate: false });
      } catch (err) {
        if (!isDuplicate(err)) throw err;
        saved.push({ id: null, idempotency_key: key, duplicate: true });
      }
    }
    return saved;
  }

  /** Worker side: claim one event exactly once. */
  async function claimAtomic(conn, id) {
    const [result] = await conn.query(
      `UPDATE ${table} SET status = 'PROCESSING', processing_started_at = NOW(), updated_at = NOW() WHERE id = ? AND status = 'PENDING'`,
      [id],
    );
    return result.affectedRows === 1;
  }

  /** Worker side: claim up to `limit` pending events (call inside a transaction). */
  async function claimBatch(conn, limit = 10) {
    const [rows] = await conn.query(`SELECT id FROM ${table} WHERE status = 'PENDING' ORDER BY id ASC LIMIT ? FOR UPDATE SKIP LOCKED`, [limit]);
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    await conn.query(`UPDATE ${table} SET status = 'PROCESSING', processing_started_at = NOW(), updated_at = NOW() WHERE id IN (?)`, [ids]);
    return ids;
  }

  async function markDone(conn, id) {
    await conn.query(`UPDATE ${table} SET status = 'DONE', updated_at = NOW() WHERE id = ?`, [id]);
  }

  async function markFailed(conn, id, error) {
    await conn.query(
      `UPDATE ${table} SET status = IF(COALESCE(retry_count,0) + 1 >= COALESCE(max_retry,3), 'DEAD', 'PENDING'),
         retry_count = COALESCE(retry_count,0) + 1, error_log = ?, updated_at = NOW() WHERE id = ?`,
      [JSON.stringify({ message: String(error && error.message ? error.message : error) }), id],
    );
  }

  return { publish, claimAtomic, claimBatch, markDone, markFailed };
}

module.exports = { createOutbox };
