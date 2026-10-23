/**
 * @hots/transaction-kit — HEAD: service-level transaction engine for HOTS, Form, Event and E-Order.
 *
 *   kernel/engine.js        createTransactionEngine: registerType + run(type, input, { idempotencyKey, actor })
 *   kernel/mysqlAdapter.js  mysql2 pool → kit connection (BEGIN/COMMIT/ROLLBACK owned by the kit)
 *   kernel/locks.js         withNamedLock (GET_LOCK), selectForUpdate
 *   kernel/idempotency.js   tx_idempotency store (repeat → stored result)
 *   kernel/outbox.js        publish inside the transaction; worker claim (trigger_outbox)
 *   kernel/sequence.js      running numbers under a named lock (PAR no., ticket id, order id)
 *   kernel/errors.js        TxError codes
 *   kernel/problem.js       RFC 9457 Problem Details (toProblemDetails, sendProblem)
 *   ledger/stockLedger.js   receive / issue / adjust / transfer with locked balances + movement log
 *   stores/                 hotsResourceStore (resource_m_data + resource_t_log), memory (tests)
 *   types/hots/             inventoryMovement, posmIssue
 *   types/form/             formSubmission
 *   types/event/            couponClaim
 *   types/eorder/           orderSubmit
 *
 * Wiring in Integrated-API (example, not applied — existing code unchanged):
 *   const kit = require('../packages/transaction-kit');
 *   const engine = kit.createTransactionEngine({
 *     adapter: kit.createMysqlAdapter(dbHots),
 *     idempotency: kit.createIdempotencyStore(),
 *     outbox: kit.createOutbox(),
 *   });
 *   const ledger = kit.createStockLedger({ store: kit.createHotsResourceStore() });
 *   engine.registerType(kit.createPosmIssueType({ ledger }));
 *   await engine.run('hots.posm_issue', { ticket_id, user_id, items });
 */
const { createTransactionEngine } = require('./kernel/engine');
const { createMysqlAdapter } = require('./kernel/mysqlAdapter');
const { withNamedLock, selectForUpdate } = require('./kernel/locks');
const { createIdempotencyStore } = require('./kernel/idempotency');
const { createOutbox } = require('./kernel/outbox');
const { nextSequence } = require('./kernel/sequence');
const errors = require('./kernel/errors');
const { toProblemDetails, sendProblem } = require('./kernel/problem');
const { createStockLedger, checkMovementInput, OPERATIONS } = require('./ledger/stockLedger');
const { createHotsResourceStore } = require('./stores/hotsResourceStore');
const memory = require('./stores/memory');
const { createInventoryMovementType } = require('./types/hots/inventoryMovement');
const { createPosmIssueType, mysqlResolveItemIds } = require('./types/hots/posmIssue');
const { createFormSubmissionType, mysqlFormRepo } = require('./types/form/formSubmission');
const { createCouponClaimType, mysqlCouponRepo } = require('./types/event/couponClaim');
const { createOrderSubmitType, mysqlOrderRepo } = require('./types/eorder/orderSubmit');

module.exports = {
  // kernel
  createTransactionEngine,
  createMysqlAdapter,
  withNamedLock,
  selectForUpdate,
  createIdempotencyStore,
  createOutbox,
  nextSequence,
  ...errors,
  toProblemDetails,
  sendProblem,
  // ledger + stores
  createStockLedger,
  checkMovementInput,
  STOCK_OPERATIONS: OPERATIONS,
  createHotsResourceStore,
  memory,
  // program types
  createInventoryMovementType,
  createPosmIssueType,
  mysqlResolveItemIds,
  createFormSubmissionType,
  mysqlFormRepo,
  createCouponClaimType,
  mysqlCouponRepo,
  createOrderSubmitType,
  mysqlOrderRepo,
};
