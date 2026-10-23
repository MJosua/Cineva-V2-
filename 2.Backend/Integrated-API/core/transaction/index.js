/**
 * core/transaction/index.js
 * 
 * Public API for the Transaction Engine.
 * 
 * Usage:
 *   const txEngine = require('./core/transaction');
 *   
 *   // Begin a transaction
 *   const tx = await txEngine.begin('ticketing', {
 *     user_id: 123,
 *     service_id: 7,
 *     form_data: { title: 'IT Support Request', ... }
 *   });
 *   
 *   // Commit it
 *   const result = await tx.commit();
 * 
 * @module transaction
 */

const transactionManager = require('./transaction-manager');

// Import built-in transaction types
const TicketingType = require('./types/ticketing');
const POSType = require('./types/pos');
const InventoryType = require('./types/inventory');

// Register built-in types (will happen when module is first loaded after init)
let _typesRegistered = false;

function registerBuiltInTypes() {
    if (_typesRegistered) return;

    transactionManager.registerType('ticketing', TicketingType);
    transactionManager.registerType('pos', POSType);
    transactionManager.registerType('inventory', InventoryType);

    // Future types can be registered here:
    // transactionManager.registerType('pos', POSType);
    // transactionManager.registerType('inventory', InventoryType);

    _typesRegistered = true;
}

// Export the manager with a wrapper to auto-register types after init
module.exports = {
    /**
     * Initialize the transaction engine
     * Called by init-engines.js
     */
    init(deps) {
        transactionManager.init(deps);
        registerBuiltInTypes();
    },

    /**
     * Begin a new transaction
     * @param {string} type - Transaction type ('ticketing', 'pos', 'inventory')
     * @param {object} context - Transaction context
     */
    begin: (type, context) => transactionManager.begin(type, context),

    /**
     * Register a custom transaction type
     * @param {string} name - Type name
     * @param {object} handler - Handler with validate/execute methods
     */
    registerType: (name, handler) => transactionManager.registerType(name, handler),

    /**
     * List registered transaction types
     */
    listTypes: () => transactionManager.listTypes(),

    /**
     * Get underlying manager (for advanced use)
     */
    getManager: () => transactionManager
};
