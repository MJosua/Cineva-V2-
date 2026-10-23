/**
 * @hots/transaction-kit — document / running-number sequences
 * Head: src/index.js
 * Sources: PAR document number (parDocument.service.js: GET_LOCK + MAX(sequence_no) + padStart → "0001/MM/YYYY")
 * and HOTS ticket id (core/transaction/types/ticketing.js: YY SS UUUU RRRR, read without a lock — race-prone).
 * Here the "read max → +1" always runs under a named lock, inside the caller's transaction.
 */
const { withNamedLock } = require('./locks');

/**
 * @param conn       kit connection (inside a transaction)
 * @param lockName   e.g. 'hots_par_document_sequence'
 * @param currentMax async (conn) => number   — highest number already used for this scope
 * @param format     (n) => string             — e.g. n => `${String(n).padStart(4,'0')}/${mm}/${yyyy}`
 */
async function nextSequence(conn, { lockName, currentMax, format = (n) => String(n), timeoutSeconds = 10, busyMessage }) {
  return withNamedLock(
    conn,
    lockName,
    async () => {
      const max = Number(await currentMax(conn)) || 0;
      const next = max + 1;
      return { next, value: format(next) };
    },
    { timeoutSeconds, busyMessage },
  );
}

module.exports = { nextSequence };
