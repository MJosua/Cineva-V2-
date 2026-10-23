/**
 * @hots/transaction-kit — typed errors (every failure carries a stable `code` + HTTP-ish `status`)
 * Head: src/index.js
 */

class TxError extends Error {
  constructor(code, message, { status = 400, details } = {}) {
    super(message);
    this.name = 'TxError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const TX_ERRORS = {
  VALIDATION: 'TX_VALIDATION',
  UNKNOWN_TYPE: 'TX_UNKNOWN_TYPE',
  NOT_FOUND: 'TX_NOT_FOUND',
  CONFLICT: 'TX_CONFLICT',
  INSUFFICIENT_STOCK: 'TX_INSUFFICIENT_STOCK',
  BUSY: 'TX_BUSY',
  RULE_VIOLATION: 'TX_RULE_VIOLATION',
};

const validation = (message, details) => new TxError(TX_ERRORS.VALIDATION, message, { status: 400, details });
const notFound = (message, details) => new TxError(TX_ERRORS.NOT_FOUND, message, { status: 404, details });
const conflict = (message, details) => new TxError(TX_ERRORS.CONFLICT, message, { status: 409, details });
const busy = (message, details) => new TxError(TX_ERRORS.BUSY, message, { status: 503, details });
const ruleViolation = (message, details) => new TxError(TX_ERRORS.RULE_VIOLATION, message, { status: 422, details });
const insufficientStock = (message, details) => new TxError(TX_ERRORS.INSUFFICIENT_STOCK, message, { status: 409, details });

/** MySQL errors worth retrying the whole transaction for. */
const RETRYABLE_DB_CODES = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);
const isRetryable = (err) => Boolean(err && RETRYABLE_DB_CODES.has(err.code));
const isDuplicate = (err) => Boolean(err && err.code === 'ER_DUP_ENTRY');

module.exports = { TxError, TX_ERRORS, validation, notFound, conflict, busy, ruleViolation, insufficientStock, isRetryable, isDuplicate };
