/**
 * core/transaction/transaction-manager.js
 * 
 * Unified Transaction Engine facade that wraps existing engines:
 * - workflow-engine.js (approvals, state transitions)
 * - trigger-engine.js (events, notifications)
 * - document-engine.js (PDF generation)
 * 
 * Provides a clean API for all transaction types (Ticketing, POS, Inventory).
 * 
 * Usage:
 *   const txManager = require('./core/transaction');
 *   const tx = await txManager.begin('ticketing', { user_id, service_id, data });
 *   await tx.commit();
 * 
 * @module transaction-manager
 */

const assert = require('assert');

class TransactionManager {
    constructor() {
        this.workflowEngine = null;
        this.triggerEngine = null;
        this.documentEngine = null;
        this.engineLoader = null;
        this.dbQuery = null;
        this.types = new Map(); // Transaction type registry
        this._initialized = false;
    }

    /**
     * Initialize the Transaction Manager with required engines
     * Called by init-engines.js during bootstrap
     */
    init({ workflowEngine, triggerEngine, documentEngine, engineLoader, dbQuery }) {
        assert(workflowEngine, 'TransactionManager requires workflowEngine');
        assert(triggerEngine, 'TransactionManager requires triggerEngine');
        assert(dbQuery, 'TransactionManager requires dbQuery');

        this.workflowEngine = workflowEngine;
        this.triggerEngine = triggerEngine;
        this.documentEngine = documentEngine;
        this.engineLoader = engineLoader;
        this.dbQuery = dbQuery;
        this._initialized = true;

        console.log('✅ TransactionManager initialized');
    }

    /**
     * Register a transaction type handler
     * @param {string} name - Type name (e.g., 'ticketing', 'pos', 'inventory')
     * @param {object} handler - Handler object with lifecycle methods
     */
    registerType(name, handler) {
        assert(handler.validate, `Type ${name} must have validate() method`);
        assert(handler.execute, `Type ${name} must have execute() method`);
        this.types.set(name, handler);
        console.log(`📝 Transaction type registered: ${name}`);
    }

    /**
     * Begin a new transaction
     * @param {string} type - Transaction type name
     * @param {object} context - Transaction context (user, service, data)
     * @returns {Transaction} Active transaction object
     */
    async begin(type, context = {}) {
        assert(this._initialized, 'TransactionManager not initialized. Call init() first.');

        const handler = this.types.get(type);
        if (!handler) {
            throw new Error(`Unknown transaction type: ${type}. Available: ${[...this.types.keys()].join(', ')}`);
        }

        // Create transaction instance
        const tx = new Transaction({
            type,
            context,
            handler,
            manager: this
        });

        // Validate before beginning
        await tx.validate();

        return tx;
    }

    /**
     * Get a registered type handler
     */
    getType(name) {
        return this.types.get(name);
    }

    /**
     * List all registered types
     */
    listTypes() {
        return [...this.types.keys()];
    }
}

/**
 * Transaction instance - represents an active transaction
 */
class Transaction {
    constructor({ type, context, handler, manager }) {
        this.type = type;
        this.context = context;
        this.handler = handler;
        this.manager = manager;
        this.state = 'pending'; // pending -> validated -> committed | rolled_back
        this.result = null;
        this.error = null;
        this.startTime = Date.now();
    }

    /**
     * Validate the transaction before execution
     */
    async validate() {
        if (this.state !== 'pending') {
            throw new Error(`Cannot validate transaction in state: ${this.state}`);
        }

        try {
            await this.handler.validate(this.context, this.manager);
            this.state = 'validated';
            return true;
        } catch (err) {
            this.state = 'invalid';
            this.error = err;
            throw err;
        }
    }

    /**
     * Commit the transaction (execute and finalize)
     */
    async commit() {
        if (this.state !== 'validated') {
            throw new Error(`Cannot commit transaction in state: ${this.state}. Must be validated first.`);
        }

        try {
            // Execute the main transaction logic
            this.result = await this.handler.execute(this.context, this.manager);

            // Run post-commit triggers if defined
            if (this.handler.afterCommit) {
                await this.handler.afterCommit(this.context, this.result, this.manager);
            }

            // Fire triggers via trigger engine
            if (this.manager.triggerEngine && this.context.service_id) {
                try {
                    await this.manager.triggerEngine.runTriggersForEvent(
                        this.context.service_id,
                        'on_commit',
                        { ...this.context, result: this.result }
                    );
                } catch (triggerErr) {
                    console.warn('⚠️ Post-commit trigger error:', triggerErr.message);
                }
            }

            this.state = 'committed';
            return this.result;
        } catch (err) {
            this.error = err;
            await this.rollback();
            throw err;
        }
    }

    /**
     * Rollback the transaction
     */
    async rollback() {
        if (this.state === 'rolled_back') {
            return; // Already rolled back
        }

        try {
            if (this.handler.rollback) {
                await this.handler.rollback(this.context, this.result, this.manager);
            }
        } catch (rollbackErr) {
            console.error('❌ Rollback error:', rollbackErr.message);
        }

        this.state = 'rolled_back';
    }

    /**
     * Get transaction state info
     */
    getState() {
        return {
            type: this.type,
            state: this.state,
            result: this.result,
            error: this.error?.message,
            duration: Date.now() - this.startTime
        };
    }
}

// Singleton instance
module.exports = new TransactionManager();
