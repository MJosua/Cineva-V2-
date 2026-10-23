const { dbHots } = require("../../../../config/db");
const sseManager = require('../../../../core/sse-manager');
const { RESOURCE_CATEGORIES } = require("../../../../script/Utility/hotsConstants");

/**
 * Inventory Management Controller
 * Handles SKU management and stock transactions (Receive, Issue, Transfer, Adjust)
 */
const InventoryController = {
    /**
     * GET /hots_settings/get/inventory
     * Fetches all inventory items and storage locations
     */
    getInventory: async (req, res) => {
        try {
            const [rows] = await dbHots.promise().query(`
                SELECT 
                    id, 
                    resource_category, 
                    resource_key, 
                    resource_label, 
                    attributes,
                    is_active
                FROM hots.resource_m_data 
                WHERE resource_category IN ('it_asset', 'posm', 'storage_location')
                  AND is_active = 1
                ORDER BY resource_category ASC, resource_label ASC
            `);

            // Parse attributes safely
            const data = rows.map(row => ({
                ...row,
                attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes
            }));

            res.status(200).json({ success: true, data });
        } catch (err) {
            console.error("Inventory Fetch Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_settings/post/inventory/upsert
     * Creates or updates a SKU (Master Data)
     */
    upsertItem: async (req, res) => {
        const { id, resource_category, resource_key, resource_label, attributes, is_active } = req.body;
        const attrJson = JSON.stringify(attributes || {});

        const conn = await dbHots.promise().getConnection();
        try {
            await conn.beginTransaction();

            if (id) {
                // Update
                await conn.query(`
                    UPDATE hots.resource_m_data 
                    SET resource_category = ?, resource_key = ?, resource_label = ?, attributes = ?, is_active = ?
                    WHERE id = ?
                `, [resource_category, resource_key, resource_label, attrJson, is_active !== undefined ? is_active : 1, id]);
                
                await conn.commit();
                sseManager.broadcast('inventory_update', { id: id, action: 'update' });
                res.status(200).json({ success: true, message: "Item updated successfully" });
            } else {
                // Create
                const [result] = await conn.query(`
                    INSERT INTO hots.resource_m_data (resource_category, resource_key, resource_label, attributes, is_active)
                    VALUES (?, ?, ?, ?, ?)
                `, [resource_category, resource_key, resource_label, attrJson, is_active !== undefined ? is_active : 1]);
                
                const newId = result.insertId;
                await conn.commit();
                sseManager.broadcast('inventory_update', { id: newId, action: 'create' });
                res.status(201).json({ success: true, message: "Item created successfully", id: newId });
            }
        } catch (err) {
            await conn.rollback();
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    },

    /**
     * POST /hots_settings/post/inventory/transaction
     * Processes inventory movements (Receive, Issue, Transfer, Adjust)
     * Follows strict Transaction + Rollback logic for audit compliance.
     */
    postTransaction: async (req, res) => {
        const { operation, items, notes } = req.body;
        const userId = req.dataToken?.id || req.dataToken?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized: User session missing" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items provided for transaction" });
        }

        const conn = await dbHots.promise().getConnection();
        try {
            await conn.beginTransaction();

            for (const item of items) {
                await InventoryController.performTransaction(conn, {
                    resource_id: item.id,
                    type: operation,
                    qty: item.quantity,
                    location_id: item.location_id,
                    target_location_id: item.target_location_id,
                    remark: notes,
                    created_by: userId
                });
            }

            await conn.commit();

            // Broadcast after all items processed
            sseManager.broadcast('inventory_update', { action: 'transaction', type: operation });

            res.status(200).json({ success: true, message: 'Transaction successful' });
        } catch (error) {
            await conn.rollback();
            console.error("Transaction Hub Error:", error);
            res.status(400).json({ success: false, message: error.message });
        } finally {
            conn.release();
        }
    },

    /**
     * Internal method to process a transaction securely 
     * @param {Object} conn - Database connection (active transaction)
     * @param {Object} params - { resource_id, type, qty, location_id, target_location_id, remark, created_by }
     */
    performTransaction: async (conn, { resource_id, type, qty, location_id, target_location_id, remark, created_by }) => {
        // 1. Get current item state
        const [items] = await conn.query(
            "SELECT resource_category, resource_key, resource_label, attributes FROM hots.resource_m_data WHERE id = ? FOR UPDATE", 
            [resource_id]
        );
        if (!items.length) throw new Error("Item not found");

        let attributes = typeof items[0].attributes === 'string' ? JSON.parse(items[0].attributes) : items[0].attributes;
        if (!attributes.stocks) attributes.stocks = {};
        
        const currentStockAtLoc = Number(attributes.stocks[location_id] || 0);
        const moveQty = Number(qty);

        // 2. Perform logic based on transaction type
        switch (type) {
            case 'receive':
                attributes.stocks[location_id] = currentStockAtLoc + moveQty;
                break;
            case 'issue':
                if (currentStockAtLoc < moveQty) throw new Error("Insufficient stock at source location");
                attributes.stocks[location_id] = currentStockAtLoc - moveQty;
                break;
            case 'transfer':
                if (!target_location_id) throw new Error("Target location required for transfer");
                if (currentStockAtLoc < moveQty) throw new Error("Insufficient stock at source location");
                
                attributes.stocks[location_id] = currentStockAtLoc - moveQty;
                attributes.stocks[target_location_id] = Number(attributes.stocks[target_location_id] || 0) + moveQty;
                break;
            case 'adjust':
                attributes.stocks[location_id] = moveQty;
                break;
            default:
                throw new Error("Invalid transaction type");
        }

        // Recalculate total_stock
        attributes.total_stock = Object.values(attributes.stocks).reduce((sum, s) => sum + Number(s), 0);

        // 3. Update Item Attributes
        await conn.query(
            "UPDATE hots.resource_m_data SET attributes = ? WHERE id = ?",
            [JSON.stringify(attributes), resource_id]
        );

        // 4. Log Transaction (Audit Trail)
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        if (type === 'transfer') {
            // Transfers require two log entries to track both location balances
            await conn.query(`
                INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, quantity, user_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [transactionId, resource_id, location_id, 'transfer_out', qty, created_by, remark]);
            
            await conn.query(`
                INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, quantity, user_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [transactionId, resource_id, target_location_id, 'transfer_in', qty, created_by, remark]);
        } else {
            // Standard log entry
            await conn.query(`
                INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, quantity, user_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [transactionId, resource_id, location_id, type, qty, created_by, remark]);
        }

        // 5. Atomic Asset Creation (Serialized IT assets only)
        if (items[0].resource_category === 'it_asset' && type === 'receive') {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const dateStr = `${dd}${mm}${yyyy}`;
            const skuKey = items[0].resource_key;
            const prefix = `${skuKey}-${dateStr}-`;

            // Get current max counter for this prefix to ensure unique SNs
            const [lastAssets] = await conn.query(
                "SELECT resource_key FROM hots.resource_m_data WHERE resource_key LIKE ? ORDER BY resource_key DESC LIMIT 1",
                [`${prefix}%`]
            );

            let counter = 1;
            if (lastAssets.length > 0) {
                const lastKey = lastAssets[0].resource_key;
                const parts = lastKey.split('-');
                const lastCounterPart = parts[parts.length - 1];
                const lastCounter = parseInt(lastCounterPart);
                if (!isNaN(lastCounter)) {
                    counter = lastCounter + 1;
                }
            }

            // Create instances
            for (let i = 0; i < qty; i++) {
                const sn = `${prefix}${String(counter + i).padStart(3, '0')}`;
                const instanceAttr = {
                    sku_id: resource_id,
                    condition: 'new',
                    registered_date: today.toISOString().split('T')[0],
                    location_id: location_id,
                    is_occupied: false,
                    occupied_by: null
                };
                
                const [insResult] = await conn.query(`
                    INSERT INTO hots.resource_m_data (resource_category, resource_key, resource_label, attributes, is_active)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    'it_asset_instance', 
                    sn, 
                    items[0].resource_label, 
                    JSON.stringify(instanceAttr), 
                    1
                ]);

                // Create initial history log for each asset instance
                const assetId = insResult.insertId;
                await conn.query(`
                    INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, quantity, user_id, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [transactionId, assetId, location_id, 'receive', 1, created_by, `Initial intake from Bulk Receive SKU: ${skuKey}`]);
            }
            
            // Broadcast combined update
            sseManager.broadcast('asset_instance_update', { action: 'bulk_create', category: 'it_asset_instance' });
        }

        // Broadcast real-time inventory update
        sseManager.broadcast('inventory_update', { id: resource_id, action: type });
        
        return { success: true, resource_id };
    },

    /**
     * DELETE /hots_settings/delete/inventory/:id
     * Deactivates a SKU instead of hard deleting
     */
    deleteItem: async (req, res) => {
        try {
            const { id } = req.params;
            await dbHots.promise().query("UPDATE hots.resource_m_data SET is_active = 0 WHERE id = ?", [id]);
            
            // Broadcast deletion (deactivation)
            sseManager.broadcast('inventory_update', { id, action: 'delete' });
            
            res.json({ success: true, message: "Item deactivated" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * GET /hots_settings/public/locations
     * Publicly fetches storage locations for audit form suggestions
     */
    getPublicLocations: async (req, res) => {
        try {
            const [rows] = await dbHots.promise().query(`
                SELECT id, resource_label 
                FROM hots.resource_m_data 
                WHERE resource_category = 'storage_location' 
                  AND is_active = 1
                ORDER BY resource_label ASC
            `);
            res.status(200).json({ success: true, data: rows });
        } catch (err) {
            console.error("Public Location Fetch Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = InventoryController;
