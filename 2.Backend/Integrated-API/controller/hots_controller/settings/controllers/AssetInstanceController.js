const { dbHots } = require("../../../../config/db");
const sseManager = require('../../../../core/sse-manager');
const InventoryController = require('./InventoryController');

/**
 * Asset Instance Controller
 * Handles CRUD operations for individual serialized assets (e.g. SN-DELL-001)
 * Category is derived from parent category: 'it_asset' -> 'it_asset_instance'
 */
const AssetInstanceController = {
    /**
     * GET /hots_settings/get/asset-instances/:category
     * Fetches all instances for a specific category (e.g. it_asset_instance or posm_instance)
     */
    getAssetInstances: async (req, res) => {
        try {
            const { category } = req.params; 
            const instanceCategory = `${category}_instance`; // e.g., 'it_asset_instance'

            const [rows] = await dbHots.promise().query(`
                SELECT 
                    id, 
                    resource_category, 
                    resource_key, 
                    resource_label, 
                    attributes,
                    is_active
                FROM hots.resource_m_data 
                WHERE resource_category = ?
                  AND is_active = 1
                ORDER BY resource_label ASC
            `, [instanceCategory]);

            // Parse attributes safely
            const data = rows.map(row => ({
                ...row,
                attributes: typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes
            }));

            res.status(200).json({ success: true, data });
        } catch (err) {
            console.error("Asset Instances Fetch Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_settings/post/asset-instance/upsert
     * Creates or updates a specific serialized asset. 
     * Expects resource_category to be explicitly provided (e.g. 'it_asset_instance')
     */
    upsertAssetInstance: async (req, res) => {
        const { id, resource_category, resource_key, resource_label, attributes, is_active, location_id, incrementStock } = req.body;
        const userId = req.dataToken?.id || req.dataToken?.user_id;
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
                sseManager.broadcast('asset_instance_update', { id: id, action: 'update', category: resource_category });
                res.status(200).json({ success: true, message: "Asset instance updated successfully" });
            } else {
                // Create
                const [result] = await conn.query(`
                    INSERT INTO hots.resource_m_data (resource_category, resource_key, resource_label, attributes, is_active)
                    VALUES (?, ?, ?, ?, ?)
                `, [resource_category, resource_key, resource_label, attrJson, is_active !== undefined ? is_active : 1]);
                
                const newId = result.insertId;

                // Handle atomic stock increment if requested
                if (incrementStock && location_id && attributes?.sku_id) {
                    await InventoryController.performTransaction(conn, {
                        resource_id: attributes.sku_id,
                        type: 'receive',
                        qty: 1,
                        location_id: location_id,
                        remark: `Auto-increment from asset registration: ${resource_key}`,
                        created_by: userId
                    });
                }
                
                await conn.commit();
                sseManager.broadcast('asset_instance_update', { id: newId, action: 'create', category: resource_category });
                res.status(201).json({ success: true, message: "Asset instance created successfully", id: newId });
            }
        } catch (err) {
            await conn.rollback();
            console.error("Asset Upsert Error:", err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    },

    /**
     * DELETE /hots_settings/delete/asset-instance/:id
     * Deactivates an asset instance
     */
    deleteAssetInstance: async (req, res) => {
        try {
            const { id } = req.params;
            const [rows] = await dbHots.promise().query("SELECT resource_category FROM hots.resource_m_data WHERE id = ?", [id]);
            const category = rows[0]?.resource_category;

            await dbHots.promise().query("UPDATE hots.resource_m_data SET is_active = 0 WHERE id = ?", [id]);
            if(category) {
                sseManager.broadcast('asset_instance_update', { id, action: 'delete', category });
            }
            res.json({ success: true, message: "Asset instance deactivated" });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * GET /hots_settings/get/asset-timeline/:resourceId
     * Fetches historical logs for a specific asset instance
     */
    getAssetTimeline: async (req, res) => {
        try {
            const { resourceId } = req.params;
            const [rows] = await dbHots.promise().query(`
                SELECT 
                    l.id, l.transaction_id, l.operation, l.notes, l.created_at,
                    CONCAT(u.firstname, ' ', IFNULL(u.lastname, '')) as user_name
                FROM hots.resource_t_log l
                LEFT JOIN hots.user u ON l.user_id = u.user_id
                WHERE l.resource_id = ?
                ORDER BY l.created_at DESC
            `, [resourceId]);

            const data = rows.map(row => ({
                ...row,
                notes: typeof row.notes === 'string' && row.notes.startsWith('{') ? JSON.parse(row.notes) : row.notes
            }));

            res.status(200).json({ success: true, data });
        } catch (err) {
            console.error("Timeline Fetch Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_settings/post/asset-timeline/:resourceId
     * Adds a new timeline entry (audit/maintenance/photo)
     */
    postAssetTimeline: async (req, res) => {
        const { resourceId } = req.params;
        const { operation, notes } = req.body;
        const userId = req.dataToken?.id || req.dataToken?.user_id;
        const transactionId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        try {
            let locationId = null;
            if (notes && notes.location) {
                // Try to resolve location name to ID for the log
                const [locs] = await dbHots.promise().query(
                    "SELECT id FROM hots.resource_m_data WHERE resource_category = 'storage_location' AND resource_label = ?", 
                    [notes.location]
                );
                if (locs.length > 0) {
                    locationId = locs[0].id;
                }
            }

            const noteStr = typeof notes === 'object' ? JSON.stringify(notes) : notes;
            await dbHots.promise().query(`
                INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, notes, user_id, quantity)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `, [transactionId, resourceId, locationId, operation || 'audit', noteStr, userId]);

            // Sync master asset record with the latest audit data
            if (notes && notes.condition) {
                // Using JSON_SET to update only specific attributes without overwriting the whole blob
                await dbHots.promise().query(`
                    UPDATE hots.resource_m_data 
                    SET attributes = JSON_SET(
                        IF(JSON_VALID(attributes), attributes, '{}'), 
                        '$.condition', ?, 
                        '$.location_name', ?,
                        '$.last_audit_user', ?
                    )
                    WHERE id = ?
                `, [notes.condition, notes.location || '', notes.reported_user || '', resourceId]);
            }

            sseManager.broadcast('asset_instance_update', { id: resourceId, action: 'timeline', resource_id: resourceId });
            res.status(201).json({ success: true, message: "Timeline entry added" });
        } catch (err) {
            console.error("Timeline Insert Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * GET /hots_settings/get/asset-by-sn/:category/:sn
     * Fetches a single asset instance by its serial number/key
     * Used mainly for the QR landing portal.
     */
    getAssetBySN: async (req, res) => {
        try {
            const { category, sn } = req.params;
            const instanceCategory = category.endsWith('_instance') ? category : `${category}_instance`;

            const [rows] = await dbHots.promise().query(`
                SELECT 
                    id, resource_category, resource_key, resource_label, attributes, is_active
                FROM hots.resource_m_data 
                WHERE resource_category = ? AND resource_key = ?
            `, [instanceCategory, sn]);

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: "Asset not found" });
            }

            const data = {
                ...rows[0],
                attributes: typeof rows[0].attributes === 'string' ? JSON.parse(rows[0].attributes) : rows[0].attributes
            };

            res.status(200).json({ success: true, data });
        } catch (err) {
            console.error("Asset Lookup Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * GET /hots_settings/get/asset-next-serial/:skuKey/:date
     * date format: DDMMYYYY
     * Returns: { success: true, nextSerial: "SKU-DATE-001" }
     */
    getNextSerialNumber: async (req, res) => {
        try {
            const { skuKey, date } = req.params;
            const prefix = `${skuKey}-${date}-`;
            
            // Search for existing keys with this prefix to find the next counter
            const [rows] = await dbHots.promise().query(`
                SELECT resource_key 
                FROM hots.resource_m_data 
                WHERE resource_key LIKE ?
                ORDER BY resource_key DESC 
                LIMIT 1
            `, [`${prefix}%`]);

            let nextCounter = 1;
            if (rows.length > 0) {
                const lastSerial = rows[0].resource_key;
                const parts = lastSerial.split('-');
                const lastCounterPart = parts[parts.length - 1];
                const lastCounter = parseInt(lastCounterPart);
                if (!isNaN(lastCounter)) {
                    nextCounter = lastCounter + 1;
                }
            }

            const formattedCounter = String(nextCounter).padStart(3, '0');
            const nextSerial = `${prefix}${formattedCounter}`;

            res.status(200).json({ success: true, nextSerial });
        } catch (err) {
            console.error("Next Serial Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * GET /hots_settings/public/asset/:sn
     * Public lookup for asset by SN (no token)
     */
    getPublicAssetBySN: async (req, res) => {
        try {
            const { sn } = req.params;

            // 1. Fetch Asset Record
            const [assets] = await dbHots.promise().query(`
                SELECT 
                    id, 
                    resource_key, 
                    resource_label, 
                    resource_category, 
                    attributes,
                    created_at
                FROM hots.resource_m_data 
                WHERE resource_key = ?
                LIMIT 1
            `, [sn]);

            if (assets.length === 0) {
                return res.status(404).json({ success: false, message: "Asset not found" });
            }

            const asset = assets[0];
            const resourceId = asset.id;
            const attributes = typeof asset.attributes === 'string' ? JSON.parse(asset.attributes) : asset.attributes;
            const skuId = attributes?.sku_id;

            let skuData = null;
            if (skuId) {
                const [skus] = await dbHots.promise().query(`
                    SELECT resource_key, resource_label, attributes
                    FROM hots.resource_m_data
                    WHERE id = ?
                `, [skuId]);
                if (skus.length > 0) {
                    skuData = {
                        ...skus[0],
                        attributes: typeof skus[0].attributes === 'string' ? JSON.parse(skus[0].attributes) : skus[0].attributes
                    };
                }
            }

            // 2. Fetch Timeline Logs
            const [logs] = await dbHots.promise().query(`
                SELECT 
                    l.id, 
                    l.transaction_id, 
                    l.operation, 
                    l.notes, 
                    l.created_at,
                    JSON_UNQUOTE(JSON_EXTRACT(l.notes, '$.reported_user')) as reported_user,
                    u.firstname, 
                    u.lastname
                FROM hots.resource_t_log l
                LEFT JOIN hots.user u ON l.user_id = u.user_id
                WHERE l.resource_id = ?
                ORDER BY l.created_at DESC
            `, [resourceId]);

            res.status(200).json({ 
                success: true, 
                asset: {
                    ...asset,
                    attributes
                }, 
                sku: skuData,
                timeline: logs.map(l => ({
                    ...l,
                    notes: typeof l.notes === 'string' ? JSON.parse(l.notes) : l.notes
                }))
            });
        } catch (err) {
            console.error("Public Asset Fetch Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_settings/public/post-timeline/:sn
     * Publicly submit timeline, but requires UID/PSWD in body
     */
    postPublicTimeline: async (req, res) => {
        const { sn } = req.params;
        const { operation, notes, auth } = req.body;

        if (!auth || !auth.uid || !auth.pswd) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }

        try {
            // 1. Verify Credentials
            const { hashPasswordHT } = require("../../../../config/encrypts");
            const [users] = await dbHots.promise().query(
                "SELECT user_id, firstname, lastname FROM hots.user WHERE LOWER(uid) = LOWER(?) AND pswd = ? AND active = 1 LIMIT 1",
                [auth.uid, hashPasswordHT(auth.pswd)]
            );

            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Invalid username or password" });
            }

            const user = users[0];

            // 2. Find Resource ID
            const [assets] = await dbHots.promise().query(
                "SELECT id FROM hots.resource_m_data WHERE resource_key = ? LIMIT 1",
                [sn]
            );

            if (assets.length === 0) {
                return res.status(404).json({ success: false, message: "Asset not found" });
            }

            const resourceId = assets[0].id;
            const transactionId = `PUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // 3. Resolve Location
            let locationId = null;
            if (notes && notes.location) {
                const [locs] = await dbHots.promise().query(
                    "SELECT id FROM hots.resource_m_data WHERE resource_category = 'storage_location' AND resource_label = ?", 
                    [notes.location]
                );
                if (locs.length > 0) locationId = locs[0].id;
            }

            // 4. Insert Log
            const noteStr = typeof notes === 'object' ? JSON.stringify(notes) : notes;
            await dbHots.promise().query(`
                INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, notes, user_id, quantity)
                VALUES (?, ?, ?, ?, ?, ?, 0)
            `, [transactionId, resourceId, locationId, operation || 'audit', noteStr, user.user_id]);

            // 5. Sync Master
            if (notes && notes.condition) {
                await dbHots.promise().query(`
                    UPDATE hots.resource_m_data 
                    SET attributes = JSON_SET(
                        IF(JSON_VALID(attributes), attributes, '{}'), 
                        '$.condition', ?, 
                        '$.location_name', ?,
                        '$.last_audit_user', ?
                    )
                    WHERE id = ?
                `, [notes.condition, notes.location || '', notes.reported_user || '', resourceId]);
            }

            sseManager.broadcast('asset_instance_update', { id: resourceId, action: 'timeline', resource_id: resourceId });
            res.status(201).json({ success: true, message: "Timeline entry added successfully", user: user.firstname });
        } catch (err) {
            console.error("Public Post Error:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_settings/post/asset-instances/bulk-update
     * Handles mass updates for multiple asset IDs (e.g., location move, release as available)
     */
    bulkUpdateAssetInstances: async (req, res) => {
        const { ids, updates } = req.body; // ids: [1, 2, 3], updates: { location_id: 5, is_occupied: false }
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No asset IDs provided" });
        }

        const conn = await dbHots.promise().getConnection();
        const userId = req.dataToken?.id || req.dataToken?.user_id;

        try {
            await conn.beginTransaction();

            for (const id of ids) {
                // Fetch current attributes to merge
                const [rows] = await conn.query("SELECT id, resource_category, attributes FROM hots.resource_m_data WHERE id = ?", [id]);
                if (rows.length === 0) continue;

                const currentAsset = rows[0];
                let currentAttrs = typeof currentAsset.attributes === 'string' ? JSON.parse(currentAsset.attributes) : (currentAsset.attributes || {});
                
                // Merge updates into attributes if they belong there
                if (updates.is_occupied !== undefined) currentAttrs.is_occupied = !!updates.is_occupied;
                if (updates.occupied_by !== undefined) currentAttrs.occupied_by = updates.occupied_by;
                if (updates.location_name !== undefined) currentAttrs.location_name = updates.location_name;
                if (updates.condition !== undefined) currentAttrs.condition = updates.condition;

                const attrJson = JSON.stringify(currentAttrs);
                
                // Perform Update
                await conn.query(`
                    UPDATE hots.resource_m_data 
                    SET attributes = ?, 
                        location_id = IF(? IS NOT NULL, ?, location_id)
                    WHERE id = ?
                `, [attrJson, updates.location_id || null, updates.location_id || null, id]);

                // Log to timeline if specified
                if (updates.log_operation) {
                    const transactionId = `BULK-${Date.now()}-${id}`;
                    await conn.query(`
                        INSERT INTO hots.resource_t_log (transaction_id, resource_id, location_id, operation, notes, user_id, quantity)
                        VALUES (?, ?, ?, ?, ?, ?, 0)
                    `, [
                        transactionId, 
                        id, 
                        updates.location_id || null, 
                        updates.log_operation, 
                        updates.log_notes || 'Bulk update performed', 
                        userId
                    ]);
                }
            }

            await conn.commit();
            
            // Broadcast event for the whole batch
            sseManager.broadcast('asset_instance_update', { ids, action: 'bulk-update' });
            
            res.status(200).json({ success: true, message: `Successfully updated ${ids.length} assets` });
        } catch (err) {
            await conn.rollback();
            console.error("Bulk Update Error:", err);
            res.status(500).json({ success: false, message: err.message });
        } finally {
            conn.release();
        }
    }
};

module.exports = AssetInstanceController;
