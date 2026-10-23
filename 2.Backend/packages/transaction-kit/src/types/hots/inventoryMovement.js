/**
 * @hots/transaction-kit — HOTS inventory movement type (receive / issue / adjust / transfer)
 * Head: src/index.js
 * Source: Integrated-API core/transaction/types/inventory.js + its caller engineTicket.js
 * (service 19 IT Asset may go negative / backorder, service 14 POSM is a hard block).
 * The service rule is now a parameter: `allowNegativeServiceIds`.
 *
 * input: { operation, items:[{ id, quantity, location_id | from_location_id, to_location_id }],
 *          user_id, service_id?, ticket_id?, request_id?, notes? }
 */
const { validation } = require('../../kernel/errors');
const { checkMovementInput } = require('../../ledger/stockLedger');

function createInventoryMovementType({ ledger, name = 'hots.inventory', allowNegativeServiceIds = [19], eventType = 'inventory_moved' } = {}) {
  if (!ledger) throw new Error(`${name}: ledger is required`);
  const negativeAllowed = new Set(allowNegativeServiceIds.map(Number));

  return {
    name,
    check(input) {
      if (!input.user_id) throw validation('user_id is required');
      checkMovementInput(input);
    },
    idempotencyKey: (input) => (input.request_id ? `${name}:${input.request_id}` : null),
    async execute(conn, input) {
      const transactionId = input.ticket_id ? `INV-${input.operation.toUpperCase()}-${input.ticket_id}` : undefined;
      const result = await ledger.post(conn, input, {
        transactionId,
        allowNegative: input.force_allow_out_of_stock === true || negativeAllowed.has(Number(input.service_id)),
      });
      return {
        result,
        events: [{ event_type: eventType, ticket_id: input.ticket_id ?? result.transaction_id, service_id: input.service_id ?? null, transaction_id: result.transaction_id, operation: input.operation }],
      };
    },
  };
}

module.exports = { createInventoryMovementType };
