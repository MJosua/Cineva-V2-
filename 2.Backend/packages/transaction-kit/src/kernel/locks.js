/**
 * @hots/transaction-kit — locks
 * Head: src/index.js
 * Sources: named lock = app/modules/par-document/parDocument.service.js (acquire/releaseParSequenceLock,
 * GET_LOCK + RELEASE_LOCK, 503 when busy); row lock = SELECT … FOR UPDATE as in service/couponService.js,
 * core/reservation-engine.js, InventoryController.
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { busy } = require('./errors');

/**
 * Runs `fn` while holding a MySQL named lock (session-scoped). Use for number sequences and cron overlap.
 * The lock is released even when `fn` throws; MySQL also drops it if the connection dies.
 */
async function withNamedLock(conn, name, fn, { timeoutSeconds = 10, busyMessage } = {}) {
  const [rows] = await conn.query('SELECT GET_LOCK(?, ?) AS acquired', [name, timeoutSeconds]);
  if (Number(rows[0] && rows[0].acquired) !== 1) {
    throw busy(busyMessage || `Resource "${name}" is busy, please retry.`, { lock: name });
  }
  try {
    return await fn();
  } finally {
    try {
      await conn.query('SELECT RELEASE_LOCK(?)', [name]);
    } catch (_) {
      /* connection gone: MySQL releases the lock with the session */
    }
  }
}

/** SELECT … FOR UPDATE helper; appends the clause so callers write a plain SELECT. */
async function selectForUpdate(conn, sql, params) {
  const [rows] = await conn.query(`${sql.trim().replace(/;$/, '')} FOR UPDATE`, params);
  return rows;
}

module.exports = { withNamedLock, selectForUpdate };
