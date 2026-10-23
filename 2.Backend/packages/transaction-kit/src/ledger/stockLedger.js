/**
 * @hots/transaction-kit — stock ledger (receive / issue / adjust / transfer)
 * Head: src/index.js
 * Source: Integrated-API core/transaction/types/inventory.js (same operations, same multi-location
 * `stocks` map, same log rows) — rebuilt so that:
 *  - all touched items are locked FOR UPDATE first, in ascending id order (no lost update, no deadlock
 *    between two requests touching the same items in different order);
 *  - the negative-stock check runs on the LOCKED balance (HOTS checked outside the transaction);
 *  - negative stock is a parameter (`allowNegative`) instead of a service-id special case in the caller;
 *  - every change writes one immutable movement row (audit trail) in the same transaction.
 *
 * Storage is pluggable (`store`): stores/hotsResourceStore.js (resource_m_data + resource_t_log) or
 * stores/memory.js (tests). A future ledger-first store can implement the same 3 methods.
 *
 * store contract:
 *   lockItems(conn, ids[]) → Map<id, { id, label, stocks: { [locationId]: number } }>   (rows locked)
 *   saveItem(conn, item)                                                               (persist balances)
 *   appendMovements(conn, rows[])  rows: { transaction_id, item_id, location_id, operation, quantity, snapshot, user_id, notes }
 */
const { validation, notFound, insufficientStock } = require('../kernel/errors');

const OPERATIONS = ['receive', 'issue', 'adjust', 'transfer'];

/** Pure input validation (shared by every inventory-like type). */
function checkMovementInput({ operation, items }) {
  if (!OPERATIONS.includes(operation)) throw validation(`operation must be one of: ${OPERATIONS.join(', ')}`);
  if (!Array.isArray(items) || items.length === 0) throw validation('items must be a non-empty array');
  items.forEach((item, i) => {
    const qty = Number(item.quantity);
    if (item.id == null) throw validation(`items[${i}].id is required`);
    if (!Number.isFinite(qty) || qty < 0 || (operation !== 'adjust' && qty === 0)) throw validation(`items[${i}].quantity is invalid`);
    if (operation === 'transfer') {
      if (item.from_location_id == null || item.to_location_id == null) throw validation(`items[${i}] transfer needs from_location_id and to_location_id`);
      if (String(item.from_location_id) === String(item.to_location_id)) throw validation(`items[${i}] transfer locations must differ`);
    } else if (item.location_id == null) {
      throw validation(`items[${i}].location_id is required`);
    }
  });
}

function createStockLedger({ store }) {
  if (!store) throw new Error('stockLedger: store is required');

  /**
   * @param input { operation, items:[{ id, quantity, location_id | from_location_id+to_location_id }], user_id, notes }
   * @param opts  { transactionId, allowNegative: boolean | (item, input) => boolean }
   */
  async function post(conn, input, { transactionId, allowNegative = false } = {}) {
    checkMovementInput(input);
    const { operation, items, user_id = null, notes = null } = input;
    const txId = transactionId || `INV-${operation.toUpperCase()}-${Date.now()}`;

    const ids = [...new Set(items.map((i) => String(i.id)))].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
    const locked = await store.lockItems(conn, ids);
    const movements = [];
    const touched = new Map();

    for (const line of items) {
      const item = locked.get(String(line.id));
      if (!item) throw notFound(`Item ${line.id} not found`, { id: line.id });
      const qty = Number(line.quantity);
      const mayGoNegative = typeof allowNegative === 'function' ? allowNegative(item, input) : Boolean(allowNegative);
      const get = (loc) => Number(item.stocks[String(loc)] || 0);
      const set = (loc, value) => {
        item.stocks[String(loc)] = value;
      };
      const ensureAvailable = (loc) => {
        if (!mayGoNegative && get(loc) < qty) {
          throw insufficientStock(`Insufficient stock for ${item.label || item.id} at location ${loc}. Available: ${get(loc)}, Requested: ${qty}`, {
            id: item.id,
            location_id: loc,
            available: get(loc),
            requested: qty,
          });
        }
      };
      const move = (loc, op) => movements.push({ transaction_id: txId, item_id: item.id, location_id: loc, operation: op, quantity: qty, snapshot: get(loc), user_id, notes });

      if (operation === 'receive') {
        set(line.location_id, get(line.location_id) + qty);
        move(line.location_id, 'receive');
      } else if (operation === 'issue') {
        ensureAvailable(line.location_id);
        set(line.location_id, get(line.location_id) - qty);
        move(line.location_id, 'issue');
      } else if (operation === 'adjust') {
        set(line.location_id, qty);
        move(line.location_id, 'adjust');
      } else {
        ensureAvailable(line.from_location_id);
        set(line.from_location_id, get(line.from_location_id) - qty);
        move(line.from_location_id, 'transfer_out');
        set(line.to_location_id, get(line.to_location_id) + qty);
        move(line.to_location_id, 'transfer_in');
      }
      touched.set(String(item.id), item);
    }

    for (const item of touched.values()) await store.saveItem(conn, item);
    await store.appendMovements(conn, movements);

    return {
      transaction_id: txId,
      operation,
      items: [...touched.values()].map((i) => ({ id: i.id, stocks: { ...i.stocks }, total_stock: sum(i.stocks) })),
      movements: movements.length,
    };
  }

  return { post };
}

const sum = (stocks) => Object.values(stocks).reduce((t, v) => t + (Number(v) || 0), 0);

module.exports = { createStockLedger, checkMovementInput, OPERATIONS };
