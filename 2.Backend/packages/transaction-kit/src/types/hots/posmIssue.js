/**
 * @hots/transaction-kit — HOTS POSM stock request (issue on approval)
 * Head: src/index.js
 * Sources: script/trigger-functions/deduct_posm_stock.js (reads `posm_order_data` from t_ticket_work_data,
 * items { sku|resource_key, qty|requested_qty }, decrements `$.current_stock` with GREATEST(0, …), no
 * transaction) and engineTicket.js (service 14 POSM = hard block).
 *
 * Fixes as parameters/behaviour, not by editing HOTS:
 *  - hard block instead of silently clamping to 0 (`allowNegative` param, default false);
 *  - idempotent per ticket: re-running the approval trigger never deducts twice;
 *  - one transaction for all lines (all-or-nothing) with row locks;
 *  - SKU → item id resolution is a parameter (`resolveItemIds`).
 *
 * input: { ticket_id, user_id, items:[{ id? , sku?|resource_key?, qty|requested_qty|quantity, location_id? }] }
 */
/* eslint-disable no-restricted-syntax -- SQL identifiers (table/column names) come from validated options or constants; every value is a ? parameter (standard 11 §4) */
const { validation, notFound } = require('../../kernel/errors');
const { assertIdentifier } = require('../../kernel/idempotency');

function createPosmIssueType({
  ledger,
  name = 'hots.posm_issue',
  serviceId = 14,
  defaultLocationId = 'DEFAULT',
  allowNegative = false,
  /** async (conn, skus[]) → Map<sku, id>; default reads hots.resource_m_data (category 'posm'). */
  resolveItemIds = mysqlResolveItemIds({}),
  eventType = 'posm_stock_deducted',
} = {}) {
  if (!ledger) throw new Error(`${name}: ledger is required`);

  const lineQty = (l) => Number(l.quantity ?? l.qty ?? l.requested_qty ?? 0);

  return {
    name,
    check(input) {
      if (!input.ticket_id) throw validation('ticket_id is required');
      if (!input.user_id) throw validation('user_id is required');
      if (!Array.isArray(input.items) || input.items.length === 0) throw validation('items must be a non-empty array');
      input.items.forEach((l, i) => {
        if (l.id == null && !(l.sku || l.resource_key)) throw validation(`items[${i}] needs id or sku`);
        if (!(lineQty(l) > 0)) throw validation(`items[${i}] quantity must be > 0`);
      });
    },
    idempotencyKey: (input) => `${name}:${input.ticket_id}`,
    async execute(conn, input) {
      const skus = input.items.filter((l) => l.id == null).map((l) => String(l.sku || l.resource_key));
      const idBySku = skus.length ? await resolveItemIds(conn, skus) : new Map();
      const items = input.items.map((l) => {
        const id = l.id ?? idBySku.get(String(l.sku || l.resource_key));
        if (id == null) throw notFound(`POSM item ${l.sku || l.resource_key} not found`);
        return { id, quantity: lineQty(l), location_id: l.location_id ?? defaultLocationId };
      });
      const result = await ledger.post(
        conn,
        { operation: 'issue', items, user_id: input.user_id, notes: `POSM request ${input.ticket_id}` },
        { transactionId: `POSM-ISSUE-${input.ticket_id}`, allowNegative },
      );
      return { result, events: [{ event_type: eventType, ticket_id: input.ticket_id, service_id: serviceId, transaction_id: result.transaction_id }] };
    },
  };
}

function mysqlResolveItemIds({ table = 'hots.resource_m_data', category = 'posm' }) {
  assertIdentifier(table);
  return async (conn, skus) => {
    const [rows] = await conn.query(`SELECT id, resource_key FROM ${table} WHERE resource_category = ? AND resource_key IN (?)`, [category, skus]);
    return new Map(rows.map((r) => [String(r.resource_key), r.id]));
  };
}

module.exports = { createPosmIssueType, mysqlResolveItemIds };
