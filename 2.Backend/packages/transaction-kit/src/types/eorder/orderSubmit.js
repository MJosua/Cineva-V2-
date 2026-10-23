/**
 * @hots/transaction-kit — E-Order order submission (header + all container lines in ONE transaction)
 * Head: src/index.js
 * Source behaviour (controllers/OnlineOrder/serverOrder.js addOrderHeader / addOrderDetail, 2026-10-06):
 *   header and each detail are separate HTTP requests, no DB transaction, client-chosen order_id,
 *   e-mail sent right after the header insert, failed header → setTimeout(3s) hard delete.
 * This type keeps the same tables/columns (m_order, m_order_dtl) but:
 *  - header + details commit together or not at all;
 *  - load rules are validated on the SERVER via an injected `validateLoad` (use @hots/calc-kit:
 *    resolveCBM / calculateContainerCBM / resolveMaxQty — the same code the UI uses);
 *  - order id comes from `orderIdStrategy` ('client' = keep today's behaviour, or a function using
 *    kernel/sequence.js under a named lock);
 *  - "order received" e-mail becomes an outbox event (sent once, after commit);
 *  - request_id idempotency (double submit → same order).
 *
 * input: { request_id?, order_id?, company_id, user_id,
 *          header: { delv_week, delv_week_desc, delv_year, po_buyer, stuffing_date, port_shipment, ship_to, po_url, final_dest, tolling_id, po_buyer_pcl },
 *          lines: [{ detail_id, cont_size, cont_qty, sku1, sku2, sku3, qty1, qty2, qty3, price1, price2, price3, remarks, bulk, delv_week, delv_year }] }
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { validation, ruleViolation } = require('../../kernel/errors');
const { assertIdentifier } = require('../../kernel/idempotency');

function createOrderSubmitType({
  repo = mysqlOrderRepo(),
  name = 'eorder.order_submit',
  /** async (conn, input) → { ok: true } | { ok: false, reason, details } */
  validateLoad = null,
  /** 'client' | async (conn, input) → order_id */
  orderIdStrategy = 'client',
  eventType = 'order_received',
} = {}) {
  return {
    name,
    check(input) {
      if (!input.company_id) throw validation('company_id is required');
      if (!input.user_id) throw validation('user_id is required');
      if (!input.header || typeof input.header !== 'object') throw validation('header is required');
      if (!Array.isArray(input.lines) || input.lines.length === 0) throw validation('lines must be a non-empty array');
      if (orderIdStrategy === 'client' && !input.order_id) throw validation('order_id is required (orderIdStrategy = client)');
      input.lines.forEach((l, i) => {
        if (!l.detail_id) throw validation(`lines[${i}].detail_id is required`);
      });
    },
    idempotencyKey: (input) => (input.request_id ? `${name}:${input.request_id}` : null),
    async execute(conn, input) {
      if (validateLoad) {
        const verdict = await validateLoad(conn, input);
        if (!verdict || verdict.ok !== true) throw ruleViolation(verdict?.reason || 'Container load rules failed', verdict?.details);
      }
      const orderId = orderIdStrategy === 'client' ? input.order_id : await orderIdStrategy(conn, input);
      await repo.insertHeader(conn, { ...input.header, order_id: orderId, company_id: input.company_id, created_by: input.user_id });
      await repo.insertLines(conn, orderId, input.company_id, input.user_id, input.lines);
      return {
        result: { order_id: orderId, lines: input.lines.length },
        events: [{ event_type: eventType, ref_id: orderId, company_id: input.company_id, user_id: input.user_id, idempotency_key: `${eventType}_${orderId}` }],
      };
    },
  };
}

const HEADER_COLUMNS = ['order_id', 'company_id', 'delv_week', 'delv_week_desc', 'delv_year', 'po_buyer', 'stuffing_date', 'port_shipment', 'ship_to', 'po_url', 'created_by', 'tolling_id', 'po_buyer_pcl', 'final_dest'];
const LINE_COLUMNS = ['cont_size', 'cont_qty', 'sku1', 'sku2', 'sku3', 'qty1', 'qty2', 'qty3', 'price1', 'price2', 'price3', 'remarks', 'bulk', 'delv_week', 'delv_year'];

function mysqlOrderRepo({ headerTable = 'm_order', lineTable = 'm_order_dtl', initialStatus = 0 } = {}) {
  [headerTable, lineTable].forEach(assertIdentifier);
  return {
    async insertHeader(conn, h) {
      const values = HEADER_COLUMNS.map((c) => (h[c] === undefined ? null : h[c]));
      await conn.query(
        `INSERT INTO ${headerTable} (${HEADER_COLUMNS.join(', ')}, po_date, status, is_active) VALUES (${HEADER_COLUMNS.map(() => '?').join(', ')}, NOW(), ?, 1)`,
        [...values, initialStatus],
      );
    },
    async insertLines(conn, orderId, companyId, userId, lines) {
      const rows = lines.map((l) => [orderId, companyId, userId, l.detail_id, ...LINE_COLUMNS.map((c) => (l[c] === undefined ? null : l[c])), 1]);
      await conn.query(`INSERT INTO ${lineTable} (order_id, company_id, created_by, detail_id, ${LINE_COLUMNS.join(', ')}, is_active) VALUES ?`, [rows]);
    },
  };
}

module.exports = { createOrderSubmitType, mysqlOrderRepo, HEADER_COLUMNS, LINE_COLUMNS };
