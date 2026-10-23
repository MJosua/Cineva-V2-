/**
 * @hots/transaction-kit — RFC 9457 Problem Details for HTTP APIs
 * Head: src/index.js
 * Standard: 3.Knowledge/domains/shared-platform/11_backend_design_principles.md §3.
 *
 * Turns any error (TxError, validation error, unknown) into
 *   { type, title, status, detail, instance, code, errors?, trace_id, success: false, message }
 * `success` + `message` keep old HOTS clients working (additive).
 * Unknown errors never leak internals: detail = generic text, real message only in logs.
 */
const { TxError, TX_ERRORS } = require('./errors');

const TITLES = {
  [TX_ERRORS.VALIDATION]: 'Validation failed',
  [TX_ERRORS.UNKNOWN_TYPE]: 'Unknown transaction type',
  [TX_ERRORS.NOT_FOUND]: 'Not found',
  [TX_ERRORS.CONFLICT]: 'Conflict',
  [TX_ERRORS.INSUFFICIENT_STOCK]: 'Insufficient stock',
  [TX_ERRORS.BUSY]: 'Resource busy',
  [TX_ERRORS.RULE_VIOLATION]: 'Business rule violated',
};

const toSlug = (code) => String(code).toLowerCase().replace(/^tx_/, '').replace(/_/g, '-');

/**
 * @param err      any error
 * @param options  { instance?: request path, traceId?: correlation id, typeBase?: URI prefix }
 * @returns { status, headers, body }
 */
function toProblemDetails(err, { instance, traceId, typeBase = 'https://hots.indofoodinternational.com/problems/' } = {}) {
  const known = err instanceof TxError || (err && typeof err.code === 'string' && Number.isInteger(err.status) && err.status >= 400 && err.status < 600);
  const status = known ? err.status : 500;
  const code = known ? err.code : 'INTERNAL_ERROR';
  const title = TITLES[code] || (known ? 'Request failed' : 'Internal server error');
  const detail = known ? err.message : 'An unexpected error occurred. Quote the trace id when reporting it.';

  const body = {
    type: `${typeBase}${toSlug(code)}`,
    title,
    status,
    detail,
    ...(instance ? { instance } : {}),
    code,
    ...(known && Array.isArray(err.details?.errors) ? { errors: err.details.errors } : {}),
    ...(known && err.details && !Array.isArray(err.details?.errors) ? { details: err.details } : {}),
    ...(traceId ? { trace_id: traceId } : {}),
    success: false,
    message: detail,
  };
  return { status, headers: { 'Content-Type': 'application/problem+json' }, body };
}

/** Express helper: res.status(..).set(..).json(..) with the problem body. */
function sendProblem(res, err, options = {}) {
  const { status, headers, body } = toProblemDetails(err, options);
  return res.status(status).set(headers).send(JSON.stringify(body));
}

module.exports = { toProblemDetails, sendProblem };
