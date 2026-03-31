/**
 * core/transaction/types/inventory.js
 * 
 * Transaction type handler for Inventory Management.
 * Implements multi-location stock tracking in resource_m_data attributes.
 */

const { dbHots } = require('../../../config/db');

const InventoryType = {
    name: 'inventory',

    /**
     * Validate inventory transaction before execution
     * @param {object} context - { user_id, operation, items: [{id, location_id, quantity}], ... }
     */
    async validate(context, manager) {
        const { user_id, operation, items, force_allow_out_of_stock } = context;

        if (!user_id) throw new Error('Inventory requires user_id');
        
        const validOperations = ['receive', 'issue', 'adjust', 'transfer'];
        if (!operation || !validOperations.includes(operation)) {
            throw new Error(`Inventory requires operation: ${validOperations.join(', ')}`);
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Inventory requires items array');
        }

        for (const item of items) {
            if (operation === 'transfer') {
                if (!item.from_location_id || !item.to_location_id) {
                    throw new Error('Transfer requires from_location_id and to_location_id');
                }
            } else {
                if (!item.location_id) {
                    throw new Error(`Operation ${operation} requires location_id`);
                }
            }

            const itemId = item.id || item.product_id;
            const requestedQty = parseInt(item.quantity) || 0;

            // Check stock if decrementing
            if ((operation === 'issue' || operation === 'transfer') && !force_allow_out_of_stock) {
                const sourceLocId = operation === 'transfer' ? item.from_location_id : item.location_id;
                
                const [rows] = await dbHots.promise().query(
                    "SELECT resource_label, attributes FROM resource_m_data WHERE id = ?",
                    [itemId]
                );

                if (rows.length === 0) throw new Error(`Item ID ${itemId} not found`);
                
                const attr = rows[0].attributes || {};
                const stocks = attr.stocks || {};
                const currentStockAtLoc = parseInt(stocks[sourceLocId]) || 0;
                
                if (currentStockAtLoc < requestedQty) {
                    throw new Error(`Insufficient stock for ${rows[0].resource_label} at selected location. Available: ${currentStockAtLoc}, Requested: ${requestedQty}`);
                }
            }
        }

        return true;
    },

    /**
     * Execute inventory transaction
     */
    async execute(context, manager) {
        const { user_id, operation, items, connection, notes } = context;
        const p = connection || dbHots.promise();

        console.log(`📦 [TX:Inventory] ${operation.toUpperCase()} multi-location operation`);

        const results = [];
        const transaction_id = `INV-${operation.toUpperCase()}-${Date.now()}`;

        for (const item of items) {
            const itemId = item.id || item.product_id;
            const qty = parseInt(item.quantity) || 0;
            
            const [rows] = await p.query("SELECT attributes FROM resource_m_data WHERE id = ?", [itemId]);
            if (rows.length === 0) throw new Error(`Item ${itemId} not found`);

            let attr = rows[0].attributes || {};
            if (!attr.stocks) attr.stocks = {};
            
            // Migrate legacy current_stock if it exists but stocks doesn't
            if (attr.current_stock !== undefined && Object.keys(attr.stocks).length === 0) {
                attr.stocks['DEFAULT'] = parseInt(attr.current_stock) || 0;
                delete attr.current_stock;
            }

            if (operation === 'transfer') {
                const { from_location_id, to_location_id } = item;
                attr.stocks[from_location_id] = (parseInt(attr.stocks[from_location_id]) || 0) - qty;
                attr.stocks[to_location_id] = (parseInt(attr.stocks[to_location_id]) || 0) + qty;
                
                // Log transfer out
                await p.query(
                    `INSERT INTO resource_t_log (transaction_id, resource_id, location_id, operation, quantity, current_stock_snapshot, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [transaction_id, itemId, from_location_id, 'transfer_out', qty, attr.stocks[from_location_id], user_id, notes || 'Inter-location transfer']
                );
                
                // Log transfer in
                await p.query(
                    `INSERT INTO resource_t_log (transaction_id, resource_id, location_id, operation, quantity, current_stock_snapshot, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [transaction_id, itemId, to_location_id, 'transfer_in', qty, attr.stocks[to_location_id], user_id, notes || 'Inter-location transfer']
                );
            } else {
                if (operation === 'receive') {
                    attr.stocks[item.location_id] = (parseInt(attr.stocks[item.location_id]) || 0) + qty;
                } else if (operation === 'issue') {
                    attr.stocks[item.location_id] = (parseInt(attr.stocks[item.location_id]) || 0) - qty;
                } else if (operation === 'adjust') {
                    attr.stocks[item.location_id] = qty; // Absolute count
                }
                
                // Log standard operation
                await p.query(
                    `INSERT INTO resource_t_log (transaction_id, resource_id, location_id, operation, quantity, current_stock_snapshot, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [transaction_id, itemId, item.location_id, operation, qty, attr.stocks[item.location_id], user_id, notes || 'Stock update']
                );
            }

            // Recalculate total_stock for quick lookup
            attr.total_stock = Object.values(attr.stocks).reduce((sum, val) => sum + (parseInt(val) || 0), 0);

            const [res] = await p.execute(
                "UPDATE resource_m_data SET attributes = ? WHERE id = ?",
                [JSON.stringify(attr), itemId]
            );
            
            results.push({ id: itemId, affectedRows: res.affectedRows, operation });
        }

        return { 
            ok: true, 
            transaction_id, 
            operation, 
            results 
        };
    },

    async rollback(context, result, manager) {
        console.log(`🔄 [TX:Inventory] Rollback handled by DB transaction`);
    }
};

module.exports = InventoryType;
