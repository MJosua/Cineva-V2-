/**
 * Data Change Request Controller
 * Handles APIs for SO data lookup, editing, and audit trail
 */

const {
    dbHots,
    dbQueryHots,
    dbConf,
    dbQuery
} = require("../../config/db");

const { ConsoleInfo } = require("../../script/Utility/consoleinfo");

let green = "\x1b[32m";
let yellow = "\x1b[33m";

module.exports = {

    /**
     * Get SO Header by PO Number
     * Used by DiffWidget to display editable SO header fields
     */
    getSOHeader: async (req, res) => {
        const timestamp = yellow + new Date().toLocaleString('id') + ' : ';
        try {
            console.log(timestamp, '🔍 DCR getSOHeader called!');
            console.log(timestamp, '📥 Query params:', JSON.stringify(req.query));

            // Use query parameter instead of path parameter (handles slashes in PO numbers)
            let po_number = req.query.po_number || req.params.po_number;

            // Safety: trim leading slash if present
            if (po_number && po_number.startsWith('/')) {
                po_number = po_number.substring(1);
            }

            console.log(timestamp, '📦 Extracted po_number:', po_number);

            if (!po_number) {
                console.log(timestamp, '❌ PO Number is missing!');
                return res.status(400).json({
                    success: false,
                    message: "PO Number is required"
                });
            }

            console.log(timestamp, `✅ DCR getSOHeader: PO=${po_number}`);

            const query = `
                 SELECT 
                    tso.so_id,
                    tso.so_date,
                    tso.po_number,
                    tso.po_date,
                    tso.client_id,
                    mc.company_name as client_name,
                    tso.ship_to_id,
                    mc2.company_name as ship_to_name,
                    tso.delv_date,
                    tso.week_delv,
                    tso.year_delv,
                    tso.completion_note,
                    tso.trade_promo,
                    tso.final_dest,
                    tso.incoterm_id,
                    mi.incoterm_name as incoterm_desc,
                    tso.factory_id,
                    mf.factory_name
                FROM iod.trs_sales_order tso
                LEFT JOIN iod.mst_company mc ON tso.client_id = mc.company_id
                LEFT JOIN iod.mst_company mc2 ON tso.ship_to_id = mc2.company_id
                LEFT JOIN iod.mst_incoterm mi ON tso.incoterm_id = mi.id 
                LEFT JOIN iod.mst_factory mf ON tso.factory_id = mf.factory_id
                WHERE tso.po_number = ?
                ORDER BY tso.so_id DESC
                LIMIT 1
            `;

            dbConf.execute(query, [po_number], (err, results) => {
                if (err) {
                    console.error(timestamp, "DCR getSOHeader Error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });
                }

                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "No SO found for this PO number"
                    });
                }

                const so = results[0];

                // Transform to key-value pairs for DiffWidget
                const data = [
                    { key: "SO Number", field: "so_number", value: so.so_number || '', type: 'text', editable: false },
                    { key: "SO Date", field: "so_date", value: so.so_date || '', type: 'date', editable: false },
                    { key: "PO Number", field: "po_number", value: so.po_number || '', type: 'text', editable: false },
                    { key: "PO Date", field: "po_date", value: so.po_date || '', type: 'date', editable: true },
                    { key: "Client", field: "client_name", value: so.client_name || '', type: 'text', editable: false },
                    { key: "Ship To", field: "ship_to_name", value: so.ship_to_name || '', type: 'text', editable: false },
                    { key: "Delivery Date", field: "delv_date", value: so.delv_date || '', type: 'date', editable: true },
                    { key: "Week Delivery", field: "week_delv", value: String(so.week_delv || ''), type: 'number', editable: true },
                    { key: "Completion Note", field: "completion_note", value: so.completion_note || '', type: 'text', editable: true },
                    { key: "Trade Promo", field: "trade_promo", value: so.trade_promo || '', type: 'text', editable: true },
                    { key: "Container 20ft", field: "cont20", value: String(so.cont20 || '0'), type: 'number', editable: true },
                    { key: "Container 40ft", field: "cont40", value: String(so.cont40 || '0'), type: 'number', editable: true },
                    { key: "Container 40HC", field: "cont40hc", value: String(so.cont40hc || '0'), type: 'number', editable: true },
                    { key: "Final Destination", field: "final_dest", value: so.final_dest || '', type: 'text', editable: true },
                    { key: "Incoterm", field: "incoterm_desc", value: so.incoterm_desc || '', type: 'text', editable: false },
                    { key: "Factory", field: "factory_name", value: so.factory_name || '', type: 'text', editable: false }
                ];

                return res.json({
                    success: true,
                    data: data,
                    meta: {
                        so_id: so.so_id,
                        client_id: so.client_id
                    }
                });
            });

        } catch (error) {
            console.error(timestamp, "DCR getSOHeader Exception:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    },

    /**
     * Get SO Details (Line Items) by SO ID
     * Used by DetailTableWidget to display editable line items
     */
    getSODetails: async (req, res) => {
        const timestamp = yellow + new Date().toLocaleString('id') + ' : ';
        try {
            const { so_id } = req.params;

            if (!so_id) {
                return res.status(400).json({
                    success: false,
                    message: "SO ID is required"
                });
            }

            console.log(timestamp, `DCR getSODetails: SO_ID=${so_id}`);

            const query = `
                SELECT 
                    tsd.detail_nr,
                    tsd.sku_id,
                    mp.product_sku,
                    mp.product_name,
                    tsd.quantity,
                    tsd.value,
                    tsd.disc,
                    tsd.delivery_date,
                    tsd.delivery_period,
                    tsd.rate_unit,
                    tsd.freight_surcharge,
                    tsd.so_detail_desc
                FROM iod.trs_so_detail tsd
                LEFT JOIN iod.mst_product mp ON tsd.sku_id = mp.product_code
                WHERE tsd.so_id = ?
                ORDER BY tsd.detail_nr
            `;

            dbConf.execute(query, [so_id], (err, results) => {
                if (err) {
                    console.error(timestamp, "DCR getSODetails Error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });
                }

                if (!results || results.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "No line items found for this SO"
                    });
                }

                // Transform to row format with editability flags
                const data = results.map(row => ({
                    detail_nr: row.detail_nr,
                    sku_id: row.sku_id,
                    product_sku: row.product_sku || String(row.sku_id),
                    product_name: row.product_name || 'Unknown Product',
                    quantity: row.quantity,
                    value: parseFloat(row.value) || 0,
                    disc: parseFloat(row.disc) || 0,
                    delivery_date: row.delivery_date,
                    delivery_period: row.delivery_period,
                    rate_unit: row.rate_unit,
                    freight_surcharge: parseFloat(row.freight_surcharge) || 0,
                    so_detail_desc: row.so_detail_desc || ''
                }));

                return res.json({
                    success: true,
                    data: data,
                    meta: {
                        so_id: so_id,
                        total_rows: data.length
                    }
                });
            });

        } catch (error) {
            console.error(timestamp, "DCR getSODetails Exception:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    },

    /**
     * Store original data to t_ticket_work_data for audit trail
     * Called when user loads SO data for the first time
     */
    storeOriginalData: async (req, res) => {
        const timestamp = yellow + new Date().toLocaleString('id') + ' : ';
        try {
            const { ticket_id, service_id, so_id, header_data, detail_data } = req.body;
            const user_id = req.decoded?.user_id || req.body.user_id;

            if (!ticket_id || !service_id || !so_id) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: ticket_id, service_id, so_id"
                });
            }

            console.log(timestamp, `DCR storeOriginalData: ticket=${ticket_id}, so=${so_id}`);

            // Check if original data already stored for this ticket
            const checkQuery = `
                SELECT COUNT(*) as count FROM hots.t_ticket_work_data 
                WHERE ticket_id = ? AND data_type = 'dcr_original_header'
            `;

            const [checkResult] = await dbQueryHots(checkQuery, [ticket_id]);

            if (checkResult && checkResult.count > 0) {
                console.log(timestamp, "Original data already stored for this ticket");
                return res.json({
                    success: true,
                    message: "Original data already stored",
                    already_exists: true
                });
            }

            // Store header data
            if (header_data && Array.isArray(header_data)) {
                for (const field of header_data) {
                    await dbQueryHots(
                        `INSERT INTO hots.t_ticket_work_data 
                         (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                         VALUES (?, ?, 'dcr_original_header', ?, ?, ?, ?, ?)`,
                        [ticket_id, service_id, so_id, field.field, field.value, field.type || 'text', user_id]
                    );
                }
            }

            // Store detail data
            if (detail_data && Array.isArray(detail_data)) {
                for (const row of detail_data) {
                    const entity_id = `${so_id}_${row.detail_nr}`;

                    // Store each editable field
                    const fields = ['quantity', 'value', 'disc', 'freight_surcharge'];
                    for (const fieldName of fields) {
                        if (row[fieldName] !== undefined) {
                            await dbQueryHots(
                                `INSERT INTO hots.t_ticket_work_data 
                                 (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                                 VALUES (?, ?, 'dcr_original_detail', ?, ?, ?, 'number', ?)`,
                                [ticket_id, service_id, entity_id, fieldName, String(row[fieldName]), user_id]
                            );
                        }
                    }
                }
            }

            return res.json({
                success: true,
                message: "Original data stored for audit trail"
            });

        } catch (error) {
            console.error(timestamp, "DCR storeOriginalData Exception:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    },

    /**
     * Submit proposed data changes
     * Stores changes in t_ticket_work_data with old/new values
     * Also stores meta info (distributor, po_number) for analytics
     */
    submitDataChange: async (req, res) => {
        const timestamp = yellow + new Date().toLocaleString('id') + ' : ';
        try {
            const {
                ticket_id,
                service_id,
                so_id,
                header_changes,
                detail_changes,
                // New fields for analytics
                distributor_id,
                po_number,
                client_id
            } = req.body;
            const user_id = req.decoded?.user_id || req.body.user_id;

            if (!ticket_id || !service_id) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: ticket_id, service_id"
                });
            }

            console.log(timestamp, `DCR submitDataChange: ticket=${ticket_id}, distributor=${distributor_id}, po=${po_number}`);

            // Store meta info for analytics (distributor, po_number, client_id)
            if (so_id) {
                const metaValue = JSON.stringify({
                    so_id: so_id,
                    distributor_id: distributor_id,
                    po_number: po_number,
                    client_id: client_id
                });

                // Check if meta already exists
                const existing = await dbQueryHots(
                    `SELECT id FROM hots.t_ticket_work_data 
                     WHERE ticket_id = ? AND data_type = 'dcr_meta' LIMIT 1`,
                    [ticket_id]
                );

                if (!existing || existing.length === 0) {
                    await dbQueryHots(
                        `INSERT INTO hots.t_ticket_work_data 
                         (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                         VALUES (?, ?, 'dcr_meta', ?, 'reference_info', ?, 'json', ?)`,
                        [ticket_id, service_id, so_id, metaValue, user_id]
                    );
                }
            }

            // Store header changes
            if (header_changes && Array.isArray(header_changes)) {
                for (const change of header_changes) {
                    if (change.is_changed) {
                        const changeValue = JSON.stringify({
                            old_value: change.old_value,
                            new_value: change.new_value
                        });

                        await dbQueryHots(
                            `INSERT INTO hots.t_ticket_work_data 
                             (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                             VALUES (?, ?, 'dcr_proposed_header', ?, ?, ?, 'json', ?)`,
                            [ticket_id, service_id, so_id, change.field_name, changeValue, user_id]
                        );
                    }
                }
            }

            // Store detail changes
            if (detail_changes && Array.isArray(detail_changes)) {
                for (const change of detail_changes) {
                    const entity_id = `${so_id}_${change.detail_nr}`;
                    const changeValue = JSON.stringify({
                        old_value: change.old_value,
                        new_value: change.new_value
                    });

                    await dbQueryHots(
                        `INSERT INTO hots.t_ticket_work_data 
                         (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                         VALUES (?, ?, 'dcr_proposed_detail', ?, ?, ?, 'json', ?)`,
                        [ticket_id, service_id, entity_id, change.field_name, changeValue, user_id]
                    );
                }
            }

            return res.json({
                success: true,
                message: "Data change request submitted successfully"
            });

        } catch (error) {
            console.error(timestamp, "DCR submitDataChange Exception:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    },

    /**
     * Get all products for item name dropdown
     * Used by DCR detail_table widget for item selection
     */
    getAllProducts: async (req, res) => {
        const timestamp = yellow + new Date().toLocaleString('id') + ' : ';
        try {
            console.log(timestamp, '📦 DCR getAllProducts called');

            const { search, limit = 100 } = req.query;

            let query = `
                SELECT 
                    mp.product_code as sku_id,
                    mp.product_code,
                    mp.product_sku,
                    mp.product_name,
                    mp.product_desc,
                    mp.per_carton
                FROM iod.mst_product mp
                WHERE mp.active = 1
            `;
            const params = [];
            const limitNum = Math.min(Number(limit) || 100, 1000); // Allow up to 1000 for client-side filtering

            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                // Only search string columns (product_sku, product_name)
                query += ` AND (mp.product_sku LIKE ? OR mp.product_name LIKE ?)`;
                params.push(searchTerm, searchTerm);
            }

            query += ` ORDER BY mp.product_name ASC LIMIT ${limitNum}`;

            dbConf.execute(query, params, (err, results) => {
                if (err) {
                    console.error(timestamp, "DCR getAllProducts Error:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error",
                        error: err.message
                    });
                }

                console.log(timestamp, `✅ DCR getAllProducts: Found ${results.length} products`);

                return res.json({
                    success: true,
                    data: results,
                    total: results.length
                });
            });

        } catch (error) {
            console.error(timestamp, "DCR getAllProducts Exception:", error);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    }

};
