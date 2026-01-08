const {
    dbHots,
    dbQueryHots,
    dbQuery,
    dbConf,
} = require("../../../../config/db"); // Adjust path as needed
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const yellowTerminal = '\x1b[33m';


const puppeteer = require('puppeteer');
const Mustache = require('mustache');
// const { PORT, API_URL } = require("../../index");

const { PORT, API_URL: ENV_API_URL } = require("../../../../config/env");
const profileController = require('../../profile/controllers/profileController');

// Base URL for static files (signatures, images, etc.)
// Priority: BE_URL_HOTS (HOTS dev) > BE_URL (production) > fallback
const API_URL = process.env.BE_URL_HOTS || process.env.BE_URL || 'https://backend.indofoodinternational.com:2864';

/**
 * Custom Function Controller
 * Base Path: /hots_settings/custom_functions/
 */

module.exports = {
    /**
     * GET /hots_settings/custom_functions/list
     * Get all custom functions
     */
    getCustomFunctions: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT cf.*, COUNT(scf.id) as usage_count
                FROM hots.m_custom_functions cf
                LEFT JOIN hots.t_service_custom_functions scf ON cf.id = scf.function_id
                WHERE cf.is_deleted = 0
                GROUP BY cf.id
                ORDER BY cf.created_date DESC
            `);

            console.log(`${timestamp}Trying to get all custom functions success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get custom functions success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_settings/custom_functions/service/:serviceId
     * Get custom functions for a specific service
     */
    getServiceCustomFunctions: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { serviceId } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT scf.*, cf.name, cf.type, cf.handler, cf.config as function_config
                FROM hots.t_service_custom_functions scf
                JOIN hots.m_custom_functions cf ON scf.function_id = cf.id
                WHERE scf.service_id = ? AND scf.is_active = 1 AND cf.is_active = 1
                ORDER BY scf.execution_order ASC
            `, [serviceId]);

            console.log(`${timestamp}Trying to get service custom functions success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get service custom functions success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * POST /hots_settings/custom_functions/create
     * Create a new custom function
     */
    createCustomFunction: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { name, type, handler, config, is_active = 1 } = req.body;

        try {
            const [result] = await dbHots.promise().query(`
                INSERT INTO hots.m_custom_functions (name, type, handler, config, is_active, created_by, created_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [name, type, handler, JSON.stringify(config), is_active, user_id]);

            const [newFunction] = await dbHots.promise().query(`
                SELECT * FROM hots.m_custom_functions WHERE id = ?
            `, [result.insertId]);

            console.log(`${timestamp}Trying to create custom function success from ${user_id}`);

            res.status(200).json({
                data: newFunction[0],
                success: true,
                message: "Create custom function success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * PUT /hots_settings/custom_functions/update/:id
     * Update a custom function
     */
    updateCustomFunction: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;
        const { name, type, handler, config, is_active } = req.body;

        try {
            await dbHots.promise().query(`
                UPDATE hots.m_custom_functions 
                SET name = ?, type = ?, handler = ?, config = ?, is_active = ?, updated_date = NOW()
                WHERE id = ?
            `, [name, type, handler, JSON.stringify(config), is_active, id]);

            console.log(`${timestamp}Trying to update custom function success from ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Update custom function success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * DELETE /hots_settings/custom_functions/delete/:id
     * Delete a custom function (soft delete)
     */
    deleteCustomFunction: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { id } = req.params;

        try {
            await dbHots.promise().query(`
                UPDATE hots.m_custom_functions 
                SET is_deleted = 1, finished_date = NOW()
                WHERE id = ?
            `, [id]);

            console.log(`${timestamp}Trying to delete custom function success from ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Delete custom function success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * POST /hots_settings/custom_functions/assign_service
     * Assign custom function to a service
     */
    assignFunctionToService: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { service_id, function_id, trigger_event, execution_order, config } = req.body;

        try {
            await dbHots.promise().query(`
                INSERT INTO hots.t_service_custom_functions 
                (service_id, function_id, trigger_event, execution_order, config, is_active, created_by, created_date)
                VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
            `, [service_id, function_id, trigger_event, execution_order, JSON.stringify(config), user_id]);

            console.log(`${timestamp}Trying to assign function to service success from ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Assign function to service success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * POST /hots_settings/custom_functions/execute/:functionId
     * Execute a custom function
     */
    executeCustomFunction: async (reqOrTicketId, functionDataOrFunctionId, variablesOrParams, mode = 'auto') => {

        try {
            const mode = reqOrTicketId.body.mode === 'manual' ? 'manual' : 'auto';

            const isManual = mode === 'manual';

            const ticket_id = isManual ? reqOrTicketId.body.ticket_id : reqOrTicketId;
            const functionId = isManual ? reqOrTicketId.params.functionId : functionDataOrFunctionId.functionId;
            const params = isManual ? reqOrTicketId.body.params || {} : variablesOrParams;
            const userId = isManual ? reqOrTicketId.dataToken.user_id : (variablesOrParams.created_by || 0);

            console.log(`Executing custom function: ${functionId} for ticket: ${ticket_id}`);

            // Get function details
            const [functionDetails] = await dbHots.promise().query(
                'SELECT * FROM m_custom_functions WHERE id = ? AND is_active = 1',
                [functionId]
            );

            if (functionDetails.length === 0) {
                if (isManual) {
                    return reqOrTicketId.res.status(404).json({
                        success: false,
                        message: 'Custom function not found'
                    });
                } else {
                    throw new Error('Custom function not found');
                }
            }

            const func = functionDetails[0];
            let result = {};
            let status = 'success';
            let errorMessage = null;
            try {
                // Execute function based on type
                switch (func.type) {
                    case 'document_generation':
                        result = await module.exports.executeDocumentGeneration(func, ticket_id, params);
                        break;
                    case 'excel_processing':
                        result = await module.exports.executeExcelProcessing(func, ticket_id, params);
                        break;
                    case 'email_notification':
                        result = await module.exports.executeEmailNotification(func, ticket_id, params);
                        break;
                    case 'api_integration':
                        result = await module.exports.executeApiIntegration(func, ticket_id, params);
                        break;
                    default:
                        result = await module.exports.executeCustomHandler(func, ticket_id, params);
                }
            } catch (execError) {
                status = 'failed';
                errorMessage = execError.message;
                result = { error: execError.message };
                console.log('Function execution error: ' + execError.message);
            }

            // Log function execution
            await dbHots.promise().query(`
            INSERT INTO t_custom_function_logs 
            (ticket_id, service_id, function_name, trigger_event, status, result_data, error_message, execution_time, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
          `, [
                ticket_id,
                func.service_id || 0,
                func.name,
                isManual ? 'manual' : 'on_created',
                status,
                JSON.stringify(result),
                errorMessage,
                userId
            ]);

            console.log(`Function execution completed with status: ${status}`);

            if (isManual) {
                return reqOrTicketId.res.json({
                    success: status === 'success',
                    message: status === 'success' ? 'Function executed successfully' : 'Function execution failed',
                    data: result
                });
            } else {
                return { success: status === 'success', result };
            }
        } catch (error) {
            console.log('Error executing custom function: ' + error.message);

            if (mode === 'manual') {
                return reqOrTicketId.res.status(500).json({
                    success: false,
                    message: 'Failed to execute custom function',
                    error: error.message
                });
            } else {
                throw error;
            }
        }
    },

    /**
     * POST /hots_settings/custom_functions/upload_excel
     * Upload and process Excel file
     */
    uploadExcelFile: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { ticket_id } = req.body;

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const file = req.file;
            const workbook = XLSX.readFile(file.path);
            const sheetNames = workbook.SheetNames;
            const processedData = {};

            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                processedData[sheetName] = jsonData;
            });

            const summary = {
                totalSheets: sheetNames.length,
                sheetNames: sheetNames,
                totalRows: Object.values(processedData).reduce((sum, sheet) => sum + sheet.length, 0),
                fileName: file.originalname,
                fileSize: file.size,
                processedDate: new Date().toISOString()
            };

            await dbHots.promise().query(`
                INSERT INTO hots.t_excel_processed_data 
                (ticket_id, file_name, file_path, processed_data, summary, uploaded_by, upload_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [ticket_id, file.originalname, file.path, JSON.stringify(processedData), JSON.stringify(summary), user_id]);

            console.log(`${timestamp}Trying to upload excel file success from ${user_id}`);

            res.status(200).json({
                data: { summary, processedData },
                success: true,
                message: "Upload excel file success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_settings/custom_functions/logs/:ticketId
     * Get function execution logs for a ticket
     */
    getFunctionLogs: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { ticketId } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT * FROM hots.t_custom_function_logs 
                WHERE ticket_id = ? 
                ORDER BY execution_time DESC
            `, [ticketId]);

            console.log(`${timestamp}Trying to get function logs success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get function logs success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_settings/custom_functions/documents/:ticketId
     * Get generated documents for a ticket
     */
    getGeneratedDocuments: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { ticketId } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT * FROM hots.t_generated_documents 
                WHERE ticket_id = ? 
                ORDER BY generated_date DESC
            `, [ticketId]);

            console.log(`${timestamp}Trying to get generated documents success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get generated documents success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_settings/custom_functions/srf/preview_number
     * Get preview of the next SRF document number
     * Query params: factory_id, product_category (RM/FG/GEN)
     * Format: {SEQ}/SRF/{FACTORY_SNAME}/{CATEGORY}/{ROMAN_MONTH}/{YEAR}
     * Example: 001/SRF/CBT/GEN/I/2026
     */
    getSRFPreviewNumber: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { factory_id, product_category } = req.query;

        try {
            if (!factory_id || !product_category) {
                return res.status(400).json({
                    success: false,
                    message: "factory_id and product_category are required"
                });
            }

            // Get factory shortname
            const [factoryResult] = await dbHots.promise().query(`
                SELECT factory_sname FROM iod.mst_factory WHERE factory_id = ?
            `, [factory_id]);

            if (factoryResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Factory not found"
                });
            }

            const factorySname = factoryResult[0].factory_sname || 'UNK';
            const category = product_category.toUpperCase(); // RM, FG, or GEN

            // Get current month and year
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // 1-12

            // Roman numerals for months
            const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            const romanMonth = romanMonths[month - 1];

            // Get the next sequence number for this combination
            // Count existing documents in t_ticket_work_data for this pattern
            const [countResult] = await dbHots.promise().query(`
                SELECT COUNT(*) as cnt FROM hots.t_ticket_work_data 
                WHERE field_name = 'srf_document_number'
                AND field_value LIKE ?
            `, [`%/SRF/${factorySname}/${category}/${romanMonth}/${year}`]);

            const nextSeq = (countResult[0]?.cnt || 0) + 1;
            const seqStr = String(nextSeq).padStart(3, '0');

            // Format: 001/SRF/CBT/GEN/I/2026
            const previewNumber = `${seqStr}/SRF/${factorySname}/${category}/${romanMonth}/${year}`;

            console.log(`${timestamp}SRF preview number generated for user ${user_id}: ${previewNumber}`);

            res.status(200).json({
                success: true,
                preview_number: previewNumber,
                components: {
                    sequence: seqStr,
                    factory_sname: factorySname,
                    category: category,
                    roman_month: romanMonth,
                    year: year
                }
            });
        } catch (err) {
            console.error(`${timestamp}Error generating SRF preview number:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_customfunction/srf/auto_category/:ticketId
     * Auto-lookup category (RM/FG/GEN) from t_ticket_work_data + m_sample_category
     * Uses samplecategory_field_id to lookup samplecat_shortname
     */
    getAutoCategory: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!ticketId) {
                return res.status(400).json({ success: false, message: 'ticketId is required' });
            }

            // Lookup samplecat_shortname by joining t_ticket_work_data with m_sample_category
            const [rows] = await dbHots.promise().query(`
                SELECT sc.samplecat_shortname, sc.samplecat_name, sc.samplecat_group
                FROM hots.t_ticket_work_data wd
                JOIN hots.m_sample_category sc 
                  ON sc.samplecat_id = CAST(wd.field_value AS UNSIGNED)
                WHERE wd.ticket_id = ?
                  AND wd.field_name = 'samplecategory_field_id'
                LIMIT 1
            `, [ticketId]);

            if (rows.length > 0) {
                const shortname = rows[0].samplecat_shortname || rows[0].samplecat_group || 'GEN';
                console.log(`🔍 [AutoCategory] ticket=${ticketId}, category=${shortname}`);
                return res.json({
                    success: true,
                    category: shortname,
                    category_name: rows[0].samplecat_name,
                    auto_detected: true
                });
            }

            // Fallback: no auto-detected category
            return res.json({
                success: true,
                category: null,
                auto_detected: false
            });

        } catch (err) {
            console.error('Error in getAutoCategory:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    },

    /**
     * POST /hots_customfunction/srf/save_number
     * Save the confirmed SRF document number to t_ticket_doc_no
     * Body: { ticket_id, doc_no, factory_id, product_category }
     */
    saveSRFDocumentNumber: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';

        // Use a connection for transaction
        const connection = await dbHots.promise().getConnection();

        try {
            const { ticket_id, factory_id, product_category } = req.body;

            if (!ticket_id || !factory_id || !product_category) {
                return res.status(400).json({
                    success: false,
                    message: "ticket_id, factory_id, and product_category are required"
                });
            }

            await connection.beginTransaction();

            // 1. Check if this ticket already has a document number in t_ticket_work_data
            const [existingWorkData] = await connection.query(
                `SELECT field_value FROM hots.t_ticket_work_data 
                 WHERE ticket_id = ? AND field_name = 'srf_document_number' 
                 FOR UPDATE`,
                [ticket_id]
            );
            const existingDocNo = existingWorkData.length > 0 ? existingWorkData[0].field_value : null;

            // 2. Get Factory Shortname
            const [factoryResult] = await connection.query(`
                SELECT factory_sname FROM iod.mst_factory WHERE factory_id = ?
            `, [factory_id]);

            if (factoryResult.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: "Factory not found" });
            }

            const factorySname = factoryResult[0].factory_sname || 'UNK';
            const category = product_category.toUpperCase();

            // Date parts
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
            const romanMonth = romanMonths[month - 1];

            // 3. Count existing documents for this pattern
            const currentPatternSuffix = `/SRF/${factorySname}/${category}/${romanMonth}/${year}`;

            const [countResult] = await connection.query(`
                SELECT COUNT(*) as cnt FROM hots.t_ticket_work_data 
                WHERE field_name = 'srf_document_number'
                AND field_value LIKE ?
                FOR UPDATE
            `, [`%${currentPatternSuffix}`]);

            let finalDocNo = '';
            let sequenceNumber = 0;

            // Check if existing doc matches current pattern (same factory/category/month/year)
            if (existingDocNo && existingDocNo.endsWith(currentPatternSuffix)) {
                // Keep existing number if pattern matches
                finalDocNo = existingDocNo;
                // Extract sequence from existing string (e.g. "005/SRF/...")
                sequenceNumber = parseInt(finalDocNo.split('/')[0], 10) || 0;
            } else {
                // Generate new number
                sequenceNumber = (countResult[0]?.cnt || 0) + 1;
                const seqStr = String(sequenceNumber).padStart(3, '0');
                finalDocNo = `${seqStr}${currentPatternSuffix}`;
            }

            // 4. Update t_ticket_doc_no (The Component Analysis Storage)
            // First, delete existing components for this ticket/service to avoid duplicates/stale data
            await connection.query(
                `DELETE FROM hots.t_ticket_doc_no WHERE ticket_id = ? AND service_id = 6`,
                [ticket_id]
            );

            // Insert components matching document format: {Number}/SRF/{Factory}/{Category}/{RomanMonth}/{Year}
            // Plus factory_id for reference/reporting
            const components = [
                { lbl: 'number', val: String(sequenceNumber).padStart(3, '0') },
                { lbl: 'Document', val: 'SRF' },
                { lbl: 'Factory', val: factorySname },
                { lbl: 'Category', val: category },
                { lbl: 'Month', val: romanMonth },
                { lbl: 'Year', val: year.toString() },
                { lbl: 'factory_id', val: factory_id.toString() }
            ];

            for (const comp of components) {
                // cstm_col = VALUE, lbl_col = KEY/LABEL
                await connection.query(
                    `INSERT INTO hots.t_ticket_doc_no (ticket_id, cstm_col, lbl_col, service_id) 
                     VALUES (?, ?, ?, 6)`,
                    [ticket_id, comp.val, comp.lbl]
                );
            }

            // Also update t_ticket_work_data for backward compatibility/display widgets
            await connection.query(
                `INSERT INTO hots.t_ticket_work_data 
                 (ticket_id, service_id, data_type, entity_id, field_name, field_value, field_type, created_by)
                 VALUES (?, 6, 'executor_input', 'data update', 'srf_document_number', ?, 'text', ?)
                 ON DUPLICATE KEY UPDATE field_value = VALUES(field_value)`,
                [ticket_id, finalDocNo, req.dataToken.user_id]
            );

            await connection.commit();
            console.log(`${timestamp}Generated & Saved SRF doc number for ticket ${ticket_id}: ${finalDocNo}`);

            res.status(200).json({
                success: true,
                message: "Document number saved successfully",
                doc_no: finalDocNo
            });

        } catch (err) {
            await connection.rollback();
            console.error(`${timestamp}Error saving SRF document number:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        } finally {
            connection.release();
        }
    },

    /**
     * POST /hots_customfunction/srf/generate
     * Generate an SRF document (PDF)
     * Body: { ticket_id }
     */
    generateSRFDocument: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { ticket_id } = req.body;

            if (!ticket_id) {
                return res.status(400).json({
                    success: false,
                    message: "ticket_id is required"
                });
            }

            // Get ticket data WITH detail rows (required for srf_document_generator)
            const [ticketRows] = await dbHots.promise().query(`
                SELECT t.*, td.lbl_col, td.cstm_col, td.value, td.order_col, 
                       td.field_type, s.service_name,
                       CONCAT(u.firstname, ' ', u.lastname) as requester_name
                FROM hots.t_ticket t 
                LEFT JOIN hots.t_ticket_detail td ON t.ticket_id = td.ticket_id
                LEFT JOIN hots.m_service s ON t.service_id = s.service_id
                LEFT JOIN hots.user u ON t.created_by = u.user_id
                WHERE t.ticket_id = ?
            `, [ticket_id]);

            if (ticketRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Ticket not found"
                });
            }

            // Generate the document using existing srf_document_generator
            const config = { documentType: 'srf_document', service_id: 6 };
            // Pass requester_name from query result
            const params = {
                generated_by: user_id,
                requester_name: ticketRows[0]?.requester_name || ''
            };

            // Use module.exports since srf_document_generator is in the same file
            // Pass the full array (with detail rows), NOT just the first row
            const documentPath = await module.exports.srf_document_generator(config, ticketRows, params);

            if (!documentPath) {
                return res.status(400).json({
                    success: false,
                    message: "Failed to generate document - no path returned"
                });
            }

            // Save generated document info
            await dbHots.promise().query(`
                INSERT INTO hots.t_generated_documents 
                (ticket_id, document_type, file_path, file_name, generated_date, template_used)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                ticket_id,
                'srf_document',
                documentPath,
                require('path').basename(documentPath),
                'srf_document'
            ]);

            console.log(`${timestamp}SRF document generated for ticket ${ticket_id} by user ${user_id}: ${documentPath}`);

            res.status(200).json({
                success: true,
                message: "SRF document generated successfully",
                document: {
                    file_path: documentPath,
                    file_name: require('path').basename(documentPath)
                }
            });
        } catch (err) {
            console.error(`${timestamp}Error generating SRF document:`, err);
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * GET /hots_settings/custom_functions/templates
     * Get all function templates
     */
    getFunctionTemplates: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT * FROM hots.m_function_templates 
                WHERE is_active = 1 
                ORDER BY template_name ASC
            `);

            console.log(`${timestamp}Trying to get function templates success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get function templates success"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },
    // Update service function assignment
    updateServiceFunctionAssignment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;
            const { service_id, function_id, trigger_event, execution_order, config, is_active } = req.body;

            const [result] = await dbHots.promise().query(`
            UPDATE t_service_custom_functions 
            SET service_id = ?, function_id = ?, trigger_event = ?, execution_order = ?, 
                config = ?, is_active = ?, updated_date = NOW()
            WHERE id = ?
        `, [service_id, function_id, trigger_event, execution_order, JSON.stringify(config), is_active, id]);

            console.log(`Service function assignment updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Service function assignment updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Remove service function assignment
    removeServiceFunctionAssignment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;

            const [result] = await dbHots.promise().query(`
            UPDATE t_service_custom_functions 
            SET is_active = 0, finished_date = NOW()
            WHERE id = ?
        `, [id]);

            console.log(`Service function assignment removed successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Service function assignment removed successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Get Excel data for a ticket
    getExcelData: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { ticketId } = req.params;

            const [result] = await dbHots.promise().query(`
            SELECT * FROM t_excel_processed_data 
            WHERE ticket_id = ? 
            ORDER BY upload_date DESC
        `, [ticketId]);

            console.log(`Excel data retrieved successfully for ticket ${ticketId} by ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Excel data retrieved successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Download document (already exists but reformatted)
    downloadDocument: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { documentId } = req.params;

            const [documents] = await dbHots.promise().query(`
            SELECT * FROM t_generated_documents 
            WHERE id = ?
        `, [documentId]);

            if (documents.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            const document = documents[0];
            const filePath = path.join(__dirname, '..', document.file_path);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on server'
                });
            }

            console.log(`Document downloaded successfully by ${user_id} at ${timestamp}`);
            res.download(filePath, document.file_name);
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Create function template (already exists but reformatted)
    createFunctionTemplate: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { template_name, template_type, template_content, variables } = req.body;

            const [result] = await dbHots.promise().query(`
            INSERT INTO m_function_templates 
            (template_name, template_type, template_content, variables, is_active, created_by, created_date)
            VALUES (?, ?, ?, ?, 1, ?, NOW())
        `, [template_name, template_type, template_content, JSON.stringify(variables), user_id]);

            console.log(`Function template created successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                data: { id: result.insertId },
                success: true,
                message: "Function template created successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Update function template (already exists but reformatted)
    updateFunctionTemplate: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;
            const { template_name, template_type, template_content, variables, is_active } = req.body;

            const [result] = await dbHots.promise().query(`
            UPDATE m_function_templates 
            SET template_name = ?, template_type = ?, template_content = ?, 
                variables = ?, is_active = ?, updated_date = NOW()
            WHERE id = ?
        `, [template_name, template_type, template_content, JSON.stringify(variables), is_active, id]);

            console.log(`Function template updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Function template updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Delete function template (already exists but reformatted)
    deleteFunctionTemplate: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;

            const [result] = await dbHots.promise().query(`
            UPDATE m_function_templates 
            SET is_active = 0, finished_date = NOW()
            WHERE id = ?
        `, [id]);

            console.log(`Function template deleted successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Function template deleted successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    /**
     * SRF Document Generator
     * Generates Sample Request Form (SRF) PDF document
     * @param {Object} template - Template configuration
     * @param {Array|Object} ticketData - Ticket and detail data
     * @param {Object} params - Additional parameters
     * @returns {string} File path of generated PDF
     */
    srf_document_generator: async (template, ticketData, params) => {
        const fileName = `document_SRF_${ticketData[0]?.ticket_id || 'unknown'}_${Date.now()}.pdf`;
        const filePath = path.join('public', 'hots', 'generateddocuments', fileName);


        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // const data = !Array.isArray(ticketData) ? { ...ticketData, ...params } : { ...params };
        // const detailRows = Array.isArray(params.detail_rows) ? params.detail_rows : Array.isArray(ticketData) ? ticketData : [];
        // 🧠 Normalize ticket data
        let data = {};
        let detailRows = [];

        // Case 1: When ticketData is an array (as in your logs)
        if (Array.isArray(ticketData)) {
            // Extract general ticket-level fields (from the first row)
            const baseInfo = {
                ticket_id: ticketData[0]?.ticket_id,
                service_id: ticketData[0]?.service_id,
                status_id: ticketData[0]?.status_id,
                created_by: ticketData[0]?.created_by,
                assigned_team: ticketData[0]?.assigned_team,
                assigned_to: ticketData[0]?.assigned_to,
                creation_date: ticketData[0]?.creation_date,
                last_update: ticketData[0]?.last_update,
                workflow_step: ticketData[0]?.workflow_step,
            };


            // Store all rows as details
            detailRows = ticketData.map(r => ({
                lbl_col: r.lbl_col,
                value: r.value,
                cstm_col: r.cstm_col,
                order_col: r.order_col,
            }));

            // Merge params (contains requester_name, service_name, etc.)
            data = { ...baseInfo, ...params, detail_rows: detailRows };

            // Case 2: When ticketData is a single object (fallback)
        } else if (ticketData && typeof ticketData === 'object') {
            data = { ...ticketData, ...params };
            detailRows = params.detail_rows || ticketData.detail_rows || [];
        }

        // ✅ Final output


        let itemRowsHtml = '';
        let totalPcs = 0;
        let totalCtn = 0;



        const cleanValue = (value) => {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.join(', ') : parsed;
            } catch {
                return value;
            }
        };

        // 🔥 Support both HOTS and Core Engine field formats
        // HOTS: lbl_col = field_id, cstm_col = value
        // Core Engine: cstm_col = field_id, lbl_col = field_name, value = field value
        const getByLabel = (labelKeyword) => {
            // First try Core Engine format (cstm_col contains field_id)
            let row = detailRows.find(r =>
                r.cstm_col?.toLowerCase().includes(labelKeyword.toLowerCase())
            );
            if (row) return cleanValue(row?.value || '');

            // Fallback to HOTS format (lbl_col contains field_id)
            row = detailRows.find(r =>
                r.lbl_col?.toLowerCase().includes(labelKeyword.toLowerCase())
            );
            return cleanValue(row?.cstm_col || row?.value || '');
        };



        const getteamleaderEmail = async (teamId) => {
            try {
                const query = `
                        SELECT
                            u.email AS team_leader_email,
                            CONCAT(u.firstname, ' ', u.lastname) AS team_leader_name
                        FROM
                            m_team_member mtm
                        JOIN user u ON mtm.user_id = u.user_id
                        WHERE
                            mtm.team_leader = "1"
                            AND mtm.team_id = ${teamId}
                        LIMIT 1
                    `;
                const result = await dbQueryHots(query);
                return result[0] || { team_leader_name: 'Unknown', team_leader_email: '-' };
            } catch (error) {
                console.error('Error fetching team leader:', error);
                return { team_leader_name: 'Unknown', team_leader_email: '-' };
            }
        };

        const getFactoryPPIC = async (factory) => {
            try {
                const query = `
                                  select
                                        pic_name,
                                        flag
                                    from
                                        iod.map_factory_pic
                                    where
                                        plant_id = ?
                                        and 
                                                end_date is null
                                    order by
                                        flag
                    `;
                const result = await dbQuery(query, [factory]);
                return (result && result.length > 0) ? result : [{ pic_name: '', flag: '1' }];
            } catch (error) {
                console.error('Error fetching team leader:', error);
                return { team_leader_name: 'Unknown', team_leader_email: '-' };
            }
        };

        // Get factory shortname by factory_id from iod.mst_factory (for SRF number)
        const getFactoryByFactoryId = async (factoryId) => {
            try {
                if (!factoryId) return '';
                const result = await dbQuery(
                    'SELECT factory_name, factory_sname FROM iod.mst_factory WHERE factory_id = ?',
                    [factoryId]
                );
                console.log(`📍 [getFactoryByFactoryId] factory_id=${factoryId}, factory_sname=${result[0]?.factory_sname}`);
                // Return shortname for SRF number format
                return result[0]?.factory_sname || result[0]?.factory_name || '';
            } catch (error) {
                console.error('Error fetching factory by ID:', error);
                return '';
            }
        };

        // Get factory_id from t_ticket_work_data (set by executor)
        const getFactoryIdFromWorkData = async (ticketId) => {
            try {
                const [result] = await dbHots.promise().query(
                    `SELECT field_value FROM t_ticket_work_data 
                     WHERE ticket_id = ? AND field_name = 'factory_id' 
                     ORDER BY created_at DESC LIMIT 1`,
                    [ticketId]
                );
                console.log(`📍 [getFactoryIdFromWorkData] ticket=${ticketId}, factory_id=${result[0]?.field_value}`);
                return result[0]?.field_value || null;
            } catch (error) {
                console.error('Error fetching factory_id from work_data:', error);
                return null;
            }
        };

        const getApproval = async (ticket_id) => {
            try {
                // 1. Get ticket service_id
                const [ticket] = await dbHots.promise().query(
                    'SELECT service_id FROM t_ticket WHERE ticket_id = ?',
                    [ticket_id]
                );
                if (!ticket.length) {
                    console.warn(`Ticket ${ticket_id} not found`);
                    return [];
                }

                // 2. Get workflow definition
                const [workflow] = await dbHots.promise().query(
                    'SELECT definition FROM m_service_workflow WHERE workflow_id = ? AND is_active = 1',
                    [ticket[0].service_id]
                );
                if (!workflow.length) {
                    console.warn(`No workflow found for service ${ticket[0].service_id}`);
                    return [];
                }

                // Parse definition - might already be object if MySQL2 auto-parsed JSON
                const defRaw = workflow[0].definition;
                const workflowDef = typeof defRaw === 'string' ? JSON.parse(defRaw) : defRaw;
                const steps = workflowDef.steps || [];

                // 3. Get approvals from t_ticket_event
                const [events] = await dbHots.promise().query(`
                    SELECT 
                        e.approval_order,
                        e.approve_date,
                        e.approver_id,
                        e.remark,
                        CONCAT(u.firstname, ' ', u.lastname) AS fullname,
                        u.email
                    FROM t_ticket_event e
                    LEFT JOIN user u ON e.approver_id = u.user_id
                    WHERE e.ticket_id = ?
                    AND e.event_type = 'approve'
                    AND e.approver_leader = '1'
                    ORDER BY e.approval_order
                `, [ticket_id]);

                // 4. Map workflow steps to actual approvals
                return steps.map((step) => {
                    const event = events.find(e => e.approval_order === step.level);

                    return {
                        approval_order: step.level,
                        step_name: step.meta?.name || step.meta?.description || `Step ${step.level}`,
                        approve_date: event?.approve_date || null,
                        approver_id: event?.approver_id || null,
                        fullname: event?.fullname || null,
                        email: event?.email || null,
                        remark: event?.remark || ''
                    };
                });
            } catch (error) {
                console.error('Error fetching approvals:', error);
                return [];
            }
        };

        const monthToRoman = (month) => {
            const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
            return romans[month - 1];
        };

        const getSRFNumber = async (ticket_id) => {
            try {
                // Priority 1: Check t_ticket_work_data for srf_document_number (set by executor)
                const [workDataRows] = await dbHots.promise().query(
                    `SELECT field_value FROM hots.t_ticket_work_data 
                     WHERE ticket_id = ? AND field_name = 'srf_document_number' LIMIT 1`,
                    [ticket_id]
                );
                if (workDataRows[0]?.field_value) {
                    return workDataRows[0].field_value;
                }

                // Priority 2: Fallback to t_ticket_doc_no
                const [existingSRF] = await dbHots.promise().query(
                    `SELECT doc_no FROM hots.t_ticket_doc_no WHERE ticket_id = ? AND service_id = 6 LIMIT 1`,
                    [ticket_id]
                );
                return existingSRF[0]?.doc_no || 'To Be Generated';
            } catch (error) {
                return 'To Be Generated';
            }
        };





        const teamLeader = await getteamleaderEmail(17);

        // 📍 Factory Resolution Priority:
        // 1. Check t_ticket_work_data (set by executor)
        // 2. Fallback to t_ticket_detail (from form)
        let factory_id = await getFactoryIdFromWorkData(data?.ticket_id);
        let factory = '';

        if (factory_id) {
            // Get factory name from mst_factory
            factory = await getFactoryByFactoryId(factory_id);
            console.log(`📍 [SRF] Using factory from work_data: ${factory} (id: ${factory_id})`);
        } else {
            // Fallback to ticket_detail
            factory_id = getByLabel('factory_id');
            factory = getByLabel('factory');
            console.log(`📍 [SRF] Using factory from ticket_detail: ${factory} (id: ${factory_id})`);
        }

        const factoryPIC = await getFactoryPPIC(factory_id);
        const approvallistRaw = await getApproval(data?.ticket_id);
        const approvallist = approvallistRaw.filter(a => a.approval_order !== 2);
        const sample = getByLabel('sample');

        // Pass forceRegenerate=true when triggered manually (replaces old SRF)
        const forceRegenerate = params?.manual_trigger === true;
        const generatesrf = await getSRFNumber(data?.ticket_id);


        // 🔥 Handle Core Engine rowgroup format
        // Core Engine: field_type = 'rowgroup_item', lbl_col = 'Item Name' or 'Quantity', value = actual data
        // cstm_col = 'item_0', 'item_1', etc. for item index

        // Check if we're using Core Engine format (has rowgroup_item field_type)
        const isEngineFormat = detailRows.some(r =>
            r.field_type === 'rowgroup_item' ||
            r.lbl_col?.toLowerCase() === 'quantity' ||
            r.lbl_col?.toLowerCase() === 'item name'
        );

        console.log('📊 [DOC_GEN] isEngineFormat:', isEngineFormat);
        console.log('📊 [DOC_GEN] detailRows sample:', detailRows.slice(0, 5));

        if (isEngineFormat) {
            // Core Engine format: find Item Name and Quantity rows
            // Item rows have lbl_col = 'Item Name', cstm_col = 'item_0', 'item_1', etc.
            const itemRows = detailRows.filter(r =>
                r.lbl_col?.toLowerCase() === 'item name' ||
                r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('item')
            );

            const quantityRows = detailRows.filter(r =>
                r.lbl_col?.toLowerCase() === 'quantity' ||
                (r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('quantity'))
            );

            console.log('📊 [DOC_GEN] Found item rows:', itemRows.length);
            console.log('📊 [DOC_GEN] Found quantity rows:', quantityRows.length);

            // Match items with quantities by index (item_0 with quantity_0, etc.)
            itemRows.forEach((itemRow, i) => {
                const itemName = itemRow.value || '';

                // Try to find matching quantity by same index
                const itemIndex = itemRow.cstm_col?.match(/\d+/)?.[0] || i.toString();
                const qtyRow = quantityRows.find(q => q.cstm_col?.includes(itemIndex)) || quantityRows[i];

                const qtyValue = qtyRow?.value || '';

                console.log(`📊 [DOC_GEN] Row ${i}: item="${itemName}", qty="${qtyValue}"`);

                // Parse quantity: look for pcs or ctn
                let pcs = '', ctn = '';
                const cleanQty = qtyValue.replace(/\|/g, '').trim();

                if (cleanQty.toLowerCase().includes('pcs')) {
                    const val = parseInt(cleanQty);
                    if (!isNaN(val)) {
                        totalPcs += val;
                        pcs = val.toLocaleString();
                    }
                }
                if (cleanQty.toLowerCase().includes('ctn')) {
                    const val = parseInt(cleanQty);
                    if (!isNaN(val)) {
                        totalCtn += val;
                        ctn = val.toLocaleString();
                    }
                }

                itemRowsHtml += `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${itemName}</td>
                      <td>${pcs}</td>
                      <td>${ctn}</td>
                    </tr>`;
            });
        } else {
            // Old HOTS format
            const itemRows = detailRows.filter(row =>
                row.lbl_col?.toLowerCase().includes('item')
            );

            itemRows.forEach((row, i) => {
                const itemName = row.value || row.cstm_col || '';

                // Attempt to find the related quantity row by order_col or index
                const qtyRow = detailRows.find(
                    r => r.lbl_col?.toLowerCase().includes('quantity') &&
                        r.order_col === row.order_col + 1
                ) || detailRows[i + 1];

                const qty = qtyRow?.value || qtyRow?.cstm_col || '';
                let pcs = '', ctn = '';

                if (qty.toLowerCase().includes('pcs')) {
                    pcs = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) {
                        totalPcs += val;
                        pcs = val.toLocaleString();
                    }
                }

                if (qty.toLowerCase().includes('ctn')) {
                    ctn = qty;
                    const val = parseInt(qty);
                    if (!isNaN(val)) {
                        totalCtn += val;
                        ctn = val.toLocaleString();
                    }
                }

                itemRowsHtml += `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${itemName}</td>
                      <td>${pcs}</td>
                      <td>${ctn}</td>
                    </tr>`;
            });
        }

        let notesHtml = '';

        console.log("approvallistRaw", approvallistRaw)
        approvallistRaw.forEach((data, i) => {
            if (data.remark && data.remark.trim() !== '') {
                const stepInfo = data.step_name ? `(${data.step_name})` : '';
                notesHtml += `
                <li>${data.fullname} ${stepInfo}: ${data.remark}</li>
              `;
            }
        });

        const toPICs = factoryPIC.filter(p => p.flag === 1).map(p => p.pic_name);

        // Group 2 (Cc)
        const ccPICs = factoryPIC.filter(p => p.flag === 2).map(p => p.pic_name);

        // Helper to get signature URL from user_profile or fallback to legacy /ttd/
        const getSignatureUrl = async (userId) => {
            const signPath = await profileController.getUserSignaturePath(userId);
            if (signPath) {
                return `${API_URL}${signPath}`;
            }
            // Fallback to legacy /ttd/ path
            return `${API_URL}/ttd/sign-${userId}.jpg`;
        };

        // Build approval columns with proper signature paths
        const approvalColumnsPromises = approvallist
            .filter(a => a.approval_order !== 2) // Hide Logistic Analyst (step 2) signature
            .map(async (approver, index) => {
                const isApproved = !!approver.approve_date;

                let signBlock = '';
                if (isApproved) {
                    const signUrl = await getSignatureUrl(approver.approver_id);
                    signBlock = `
              <div style="height: 100%; max-height:130px; display:flex; align-items:center;">
                <img
                  alt="sign"
                  src="${signUrl}"
                  style="width:120px;display:block;margin:0 auto 5px auto;"
                />
              </div>
            `;
                } else {
                    signBlock = `
              <div style="height: 100%; max-height:130px; display:flex; align-items:center;"></div>
            `;
                }

                // Use dynamic step name from workflow definition
                const positionLabel = approver.step_name || `Step ${approver.approval_order}`;

                return `
            <td style="padding:10px 10px 15px 10px;vertical-align:top;">
              ${signBlock}
              <br>
              ${approver.fullname || "—"}
              <br>
              <span style="font-size:12px;color:#555;display:inline-block;margin-bottom:10px;">${positionLabel}</span>
            </td>
          `;
            });

        const approvalColumnsHtml = (await Promise.all(approvalColumnsPromises)).join("");

        // Get requester signature URL
        const requesterSignUrl = await getSignatureUrl(data.created_by);





        const html = `
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>SAMPLE REQUEST FORM ( SRF )</title>
                  <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; min-width: 700px; max-width: 794px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                    .no-border td { border: none; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .section-title { margin-top: 20px; font-weight: bold; font-size: 16px; text-align: center; }
                    .note { border: 1px solid #000; padding: 10px; margin-top: 10px; }
                    .approval-table td { height: 60px; vertical-align: bottom; text-align: center; word-break: break-word; overflow-wrap: break-word; }
                    .approval-table { table-layout: fixed; }
                    .approval-table td { width: 25%; }
                    .small { font-size: 10px; }
                  </style>
                </head>
                <body>
    
                <div style="display:flex;justify-content:space-between;width:100%;">
                    <div>
                        <img
                            src="https://backend.indofoodinternational.com:2864/aset/image/indofood_header_logo.png"
                            style="height:35px"
                        />
                    </div>
                    <div style="display:flex;justify-content:flex-end;">
                        <img
                            src="https://backend.indofoodinternational.com:2864/aset/image/icbp_header_logo.png"
                            style="height:35px"
                        />
                    </div>
                </div>
    
    
                <br>
    
                <table class="no-border">
                  <tr>
                    <td><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td>
                    <td style="text-align:right;">To&nbsp;: <em> ${toPICs.join(', ')} </em> </td>
                  </tr>
                  <tr>
                    <td><strong>Division</strong>&nbsp;: IOD </td>
                    <td style="text-align:right;"></td>
                  </tr>
                  <tr>
                    <td><strong>Location</strong>&nbsp;: INDOFOOD TOWER LT.23</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><strong>SRF NO</strong>&nbsp;: ${generatesrf}</td>
                    <td></td>
                  </tr>
                </table>
          
                <div class="section-title">SAMPLE REQUEST FORM ( SRF )</div>
          
               <style>
                    .no-border {
                        width: 100%;
                        table-layout: fixed;
                        border-collapse: collapse;
                    }
                    .no-border td {
                        vertical-align: top;
                        padding: 4px;
                    }
                    .label {
                        width: 12%;
                        font-weight: bold;
                    }
                    .content {
                        width: 38%;
                    }
                    </style>
    
                    <table class="no-border">
                    <tr>
                        <td class="label">To</td>
                        <td class="content">:  ${toPICs.join(', ')}</td>
                        <td class="label">Name/Title</td>
                        <td class="content">: ${getByLabel('name')}</td>
                    </tr>
                    <tr>
                        <td class="label">Cc</td>
                        <td class="content">:  ${ccPICs.join(', ')}</td>
                        <td class="label">Purposes</td>
                        <td class="content">: ${getByLabel('purpose')}</td>
                    </tr>
                    <tr>
                        <td class="label">Deliver to</td>
                        <td class="content">: ${getByLabel('deliver_to')}</td>
                        <td class="label">Category</td>
                        <td class="content">: ${getByLabel('Category_field')}</td>
                    </tr>
                    </table>
    
          
                <table>
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>DESCRIPTION</th>
                      <th>QUANTITY IN PCS</th>
                      <th>QUANTITY IN CTN</th>
                    </tr>
                  </thead>
                  <tbody>
    
                    ${itemRowsHtml}
                    <tr>
                      <td colspan="2" class="bold" style="text-align: right;">TOTAL</td>
                      <td class="bold">${totalPcs.toLocaleString()} PCS</td>
                      <td class="bold">${totalCtn.toLocaleString()} CTN</td>
                    </tr>
                  </tbody>
                </table>
          
                <div class="note">
                    <strong>Request Detail:</strong>
                   ${(() => {
                const po = getByLabel("PO_Number") || "";
                return !po.toLowerCase().includes("no data found")
                    ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA PO ${po}</p>`
                    : "";
            })()}
                  
                    ${getByLabel('Week Delivery') && getByLabel('Week Delivery') !== "No Data Found"
                ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA WEEK ${getByLabel('Week Delivery')}</p>`
                : ''}
                    <p>MOHON AGAR PERMINTAAN SAMPLE ${getByLabel('field_1761105177705').toLocaleString() === `true` ? "" : "TIDAK "}DIDECLARE PADA SHIPPING DOCS</p>
                </div>
    
                <div class="note">
                    <strong>Note:</strong>
                   <br>
                    ${getByLabel('field_1761105303599') ? `<p>${getByLabel('field_1761105303599')}</p>` : ''}
                     ${notesHtml}
                  <strong>Thank you</strong>
                </div>
          
                <table class="approval-table" style="width:100%; table-layout:fixed; border-collapse:collapse;">
 
                 <tr class="bold">
                    <td style="text-align:center; vertical-align:middle;">Request by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                </tr>
                  <tr>
                    
                    <td style="padding:10px 10px 15px 10px;vertical-align:top;">
                            <div style="height: 100%; max-height:130px;display:flex; align-items: center;">
                    
                        <img
                            alt="sign"
                            src="${requesterSignUrl}"
                            style="width:120px;display:block;margin:0 auto 5px auto;"
                        />
                        </div>
                        <br>
                        ${data?.requester_name || ''}
                        <br>
                        <span style="font-size:12px;color:#555;display:inline-block;margin-bottom:10px;">${data.business_analyst || 'Requester'}</span>
                    </td>
                    
    
                    ${approvalColumnsHtml}

                  </tr>
                </table>
          
                </body>
              </html>
            `;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        // Use domcontentloaded instead of networkidle0 to avoid timeout on slow/failed images
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
        // Give images a chance to load (signature images, logos)
        await new Promise(resolve => setTimeout(resolve, 2000));
        await page.pdf({ path: filePath, format: 'A4' });
        await browser.close();

        return filePath;




    },


    /**
     * Execute Document Generation
     * Dynamically selects document template based on config.template
     * @param {Object} func - Function configuration from m_custom_functions
     * @param {string} ticketId - Ticket ID
     * @param {Object} params - Additional parameters
     */
    executeDocumentGeneration: async (func, ticketId, params) => {
        try {
            const config = typeof func.config === 'string' ? JSON.parse(func.config) : func.config || {};

            // Fetch ticket data
            const [ticketData] = await dbHots.promise().query(
                'SELECT * FROM t_ticket t left join t_ticket_detail td on t.ticket_id = td.ticket_id WHERE t.ticket_id = ?',
                [ticketId]
            );

            if (!ticketData || ticketData.length === 0) {
                console.log(`[Error] Ticket not found with ID: ${ticketId}`);
                throw new Error('Ticket not found');
            }

            // ========== DYNAMIC TEMPLATE SELECTION ==========
            const templateName = config.template || 'srf_document';
            console.log(`📄 [DOC_GEN] Using template: ${templateName}`);

            let documentPath = null;

            // Select document generator based on template name
            switch (templateName) {
                case 'srf_document':
                    documentPath = await module.exports.srf_document_generator(config, ticketData, params);
                    break;
                // Add more templates here:
                // case 'job_offer_letter':
                //     documentPath = await module.exports.job_offer_letter_generator(config, ticketData, params);
                //     break;
                // case 'approval_memo':
                //     documentPath = await module.exports.approval_memo_generator(config, ticketData, params);
                //     break;
                default:
                    console.log(`⚠️ [DOC_GEN] Unknown template: ${templateName}, falling back to srf_document`);
                    documentPath = await module.exports.srf_document_generator(config, ticketData, params);
            }

            // Save generated document info
            await dbHots.promise().query(`
                INSERT INTO hots.t_generated_documents 
                (ticket_id, document_type, file_path, file_name, generated_date, template_used)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                ticketId,
                config.documentType || 'letter',
                documentPath || '',
                path.basename(documentPath || 'unknown.pdf'),
                templateName
            ]);

            return {
                success: true,
                documentPath,
                documentType: config.documentType || 'letter',
                template: templateName
            };
        } catch (err) {
            console.log(`[executeDocumentGeneration] Error for ticket ${ticketId}:`);
            console.dir(err, { depth: null });

            return {
                success: false,
                message: err?.message || JSON.stringify(err)
            };
        }
    },

    executeExcelProcessing: async (func, ticketId, params) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + `Executing function: ${func.name} ` + date.toLocaleTimeString('id') + ' : ';
        const config = typeof func.config === 'string' ? JSON.parse(func.config) : func.config || {};

        // Get Excel data from database
        const [excelData] = await dbHots.promise().query(
            'SELECT * FROM t_excel_processed_data WHERE ticket_id = ? ORDER BY upload_date DESC LIMIT 1',
            [ticketId]
        );

        if (excelData.length === 0) {
            throw new Error('No Excel data found for this ticket');
        }

        const processedData = JSON.parse(excelData[0].processed_data);

        // Process data based on configuration
        const result = hotscustomfunctionController.processExcelData(processedData, config);

        return {
            success: true,
            processedData: result,
            summary: JSON.parse(excelData[0].summary)
        };
    },

    executeEmailNotification: async (func, ticketId, params) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + `Executing email notification for function: ${func.name} ` + date.toLocaleTimeString('id') + ' : ';
        const config = typeof func.config === 'string' ? JSON.parse(func.config) : func.config || {};

        // Get ticket and user data
        const [ticketData] = await dbHots.promise().query(`
          SELECT t.*, u.email, u.firstname, u.lastname 
          FROM t_ticket t 
          JOIN users u ON t.created_by = u.user_id 
          WHERE t.ticket_id = ?
        `, [ticketId]);

        if (ticketData.length === 0) {
            throw new Error('Ticket not found');
        }

        // Send email (implementation depends on email service)
        const emailResult = await hotscustomfunctionController.sendEmail(config, ticketData[0], params);

        return {
            success: true,
            emailSent: emailResult,
            recipients: config.recipients
        };
    },

    executeApiIntegration: async (func, ticketId, params) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + `Executing API integration for function: ${func.name} ` + date.toLocaleTimeString('id') + ' : ';

        const config = typeof func.config === 'string' ? JSON.parse(func.config) : func.config || {};

        // Make API call
        const apiResult = await hotscustomfunctionController.makeApiCall(config, ticketId, params);

        return {
            success: true,
            apiResponse: apiResult
        };
    },

    executeCustomHandler: async (func, ticketId, params) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + `Executing custom handler for function: ${func.name} ` + date.toLocaleTimeString('id') + ' : ';

        // Implementation for custom handlers
        throw new Error('Custom handler execution not implemented');
    },

    /**
     * Manual Document Generation API Handler
     * Called from frontend to manually trigger document generation
     * Uses same approach as trigger-functions/srf_document_generator.js
     */
    manualGenerateDocument: async (req, res) => {
        try {
            const { ticketId } = req.params;
            const { service_id, template } = req.body;

            console.log(`📄 [MANUAL_DOC_GEN] ========= START =========`);
            console.log(`📄 [MANUAL_DOC_GEN] ticketId: ${ticketId}`);
            console.log(`📄 [MANUAL_DOC_GEN] service_id: ${service_id}`);
            console.log(`📄 [MANUAL_DOC_GEN] template: ${template || 'srf_document (default)'}`);

            // Build function config object (same as trigger does)
            const funcConfig = {
                config: JSON.stringify({
                    template: template || 'srf_document',
                    documentType: 'SRF'
                })
            };

            // Get requester name
            const [requesterData] = await dbHots.promise().query(`
                SELECT CONCAT(u.firstname, ' ', u.lastname) as requester_name, u.email as requester_email
                FROM t_ticket t
                JOIN user u ON t.created_by = u.user_id
                WHERE t.ticket_id = ?
            `, [ticketId]);

            console.log(`📄 [MANUAL_DOC_GEN] Requester data:`, requesterData);

            const params = {
                requester_name: requesterData[0]?.requester_name || 'Unknown',
                requester_email: requesterData[0]?.requester_email || '',
                manual_trigger: true
            };

            console.log(`📄 [MANUAL_DOC_GEN] Calling executeDocumentGeneration...`);

            // Call the internal document generation function (same as trigger does)
            const result = await module.exports.executeDocumentGeneration(funcConfig, ticketId, params);

            console.log(`📄 [MANUAL_DOC_GEN] Result:`, result);

            res.json({
                success: true,
                message: 'Document generated successfully',
                document_path: result
            });
        } catch (error) {
            console.error('❌ [MANUAL_DOC_GEN] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate document'
            });
        }
    },


    /**
     * Preview SRF Document HTML (for testing/debugging)
     * GET /hots_settings/custom_functions/preview_srf/:ticketId
     * Returns raw HTML instead of PDF - useful for debugging template
     */
    previewSRFDocument: async (req, res) => {
        try {
            const { ticketId } = req.params;

            console.log(`📄 [PREVIEW_SRF] ========= START =========`);
            console.log(`📄 [PREVIEW_SRF] ticketId: ${ticketId}`);

            // Fetch ticket data
            const [ticketData] = await dbHots.promise().query(
                'SELECT * FROM t_ticket t LEFT JOIN t_ticket_detail td ON t.ticket_id = td.ticket_id WHERE t.ticket_id = ?',
                [ticketId]
            );

            if (!ticketData || ticketData.length === 0) {
                return res.status(404).send(`<h1>Ticket not found: ${ticketId}</h1>`);
            }

            // Get requester info
            const [requesterData] = await dbHots.promise().query(`
                SELECT CONCAT(u.firstname, ' ', u.lastname) as requester_name, u.email as requester_email
                FROM t_ticket t
                JOIN user u ON t.created_by = u.user_id
                WHERE t.ticket_id = ?
            `, [ticketId]);

            const params = {
                requester_name: requesterData[0]?.requester_name || 'Unknown',
                requester_email: requesterData[0]?.requester_email || '',
                manual_trigger: true
            };

            // Generate HTML using existing generator (but intercept before PDF)
            const html = await module.exports.generateSRFHtml(ticketData, params);

            // Return HTML directly
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.send(html);

        } catch (error) {
            console.error('❌ [PREVIEW_SRF] Error:', error);
            res.status(500).send(`<h1>Error</h1><pre>${error.message}\n\n${error.stack}</pre>`);
        }
    },

    /**
     * Preview Page - Simple HTML form to input ticket ID
     * GET /hots_settings/custom_functions/preview
     */
    previewPage: async (req, res) => {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>SRF Document Preview</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #1a1a2e;
            color: #eee;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            background: #16213e;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 { color: #4fc3f7; margin-bottom: 30px; }
        input {
            padding: 15px 20px;
            font-size: 18px;
            border: 2px solid #4fc3f7;
            border-radius: 8px;
            background: #0f3460;
            color: #fff;
            width: 200px;
            margin-right: 10px;
        }
        input:focus {
            outline: none;
            border-color: #00e676;
        }
        button {
            padding: 15px 30px;
            font-size: 18px;
            background: linear-gradient(135deg, #4fc3f7, #00e676);
            border: none;
            border-radius: 8px;
            color: #1a1a2e;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        .hint {
            margin-top: 20px;
            color: #888;
            font-size: 14px;
        }
        .shortcuts {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #333;
        }
        .shortcuts a {
            color: #4fc3f7;
            text-decoration: none;
            margin: 0 10px;
        }
        .shortcuts a:hover { color: #00e676; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 SRF Document Preview</h1>
        <form id="previewForm">
            <input type="text" id="ticketId" placeholder="Ticket ID" autofocus />
            <button type="submit">Preview HTML</button>
        </form>
        <p class="hint">Enter a ticket ID to preview the generated SRF document HTML</p>
        
        <div class="shortcuts">
            <strong>Recent Tickets:</strong>
            <span id="recentTickets">Loading...</span>
        </div>
    </div>
    
    <script>
        document.getElementById('previewForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const ticketId = document.getElementById('ticketId').value.trim();
            if (ticketId) {
                window.open('./preview_srf/' + ticketId, '_blank');
            }
        });
        
        // Load recent SRF tickets
        fetch('/hots_ticket/tickets?service_id=17&limit=5')
            .then(r => r.json())
            .then(data => {
                if (data.data && data.data.length > 0) {
                    document.getElementById('recentTickets').innerHTML = data.data.map(t => 
                        '<a href="./preview_srf/' + t.ticket_id + '" target="_blank">' + t.ticket_id + '</a>'
                    ).join(' | ');
                } else {
                    document.getElementById('recentTickets').textContent = 'No recent tickets';
                }
            })
            .catch(() => {
                document.getElementById('recentTickets').textContent = 'Could not load';
            });
    </script>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    },

    /**
     * Generate SRF HTML only (without PDF conversion)
     * Used by both previewSRFDocument and srf_document_generator
     */
    generateSRFHtml: async (ticketData, params) => {
        // ===== Copy the exact logic from srf_document_generator but return HTML =====

        // Normalize ticket data
        let data = {};
        let detailRows = [];

        if (Array.isArray(ticketData)) {
            const baseInfo = {
                ticket_id: ticketData[0]?.ticket_id,
                service_id: ticketData[0]?.service_id,
                status_id: ticketData[0]?.status_id,
                created_by: ticketData[0]?.created_by,
                assigned_team: ticketData[0]?.assigned_team,
                assigned_to: ticketData[0]?.assigned_to,
                creation_date: ticketData[0]?.creation_date,
                last_update: ticketData[0]?.last_update,
                workflow_step: ticketData[0]?.workflow_step,
            };

            detailRows = ticketData.map(r => ({
                lbl_col: r.lbl_col,
                value: r.value,
                cstm_col: r.cstm_col,
                order_col: r.order_col,
                field_type: r.field_type,
            }));

            data = { ...baseInfo, ...params, detail_rows: detailRows };
        } else if (ticketData && typeof ticketData === 'object') {
            data = { ...ticketData, ...params };
            detailRows = params.detail_rows || ticketData.detail_rows || [];
        }

        const cleanValue = (value) => {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.join(', ') : parsed;
            } catch {
                return value;
            }
        };

        const getByLabel = (labelKeyword) => {
            let row = detailRows.find(r =>
                r.cstm_col?.toLowerCase().includes(labelKeyword.toLowerCase())
            );
            if (row) return cleanValue(row?.value || '');

            row = detailRows.find(r =>
                r.lbl_col?.toLowerCase().includes(labelKeyword.toLowerCase())
            );
            return cleanValue(row?.cstm_col || row?.value || '') || 'No Data Found';
        };

        // Helper functions - simplified versions
        const getteamleaderEmail = async (teamId) => {
            try {
                const [result] = await dbHots.promise().query(`
                    SELECT GROUP_CONCAT(u.email) AS emails
                    FROM m_team_members tm
                    JOIN user u ON tm.user_id = u.user_id
                    WHERE tm.team_id = ? AND tm.is_leader = 1
                `, [teamId]);
                return result[0]?.emails || '';
            } catch (error) {
                console.error('Error fetching team leader email:', error);
                return '';
            }
        };

        const getFactoryByFactoryId = async (factoryId) => {
            try {
                if (!factoryId) return '';
                const [result] = await dbHots.promise().query(
                    'SELECT factory_sname, factory_name FROM mst_factory WHERE factory_id = ?',
                    [factoryId]
                );
                return result[0]?.factory_sname || result[0]?.factory_name || '';
            } catch (error) {
                return '';
            }
        };

        const getFactoryIdFromWorkData = async (ticketId) => {
            try {
                const [result] = await dbHots.promise().query(
                    `SELECT field_value FROM t_ticket_work_data 
                     WHERE ticket_id = ? AND field_name = 'factory_id' 
                     ORDER BY created_at DESC LIMIT 1`,
                    [ticketId]
                );
                return result[0]?.field_value || null;
            } catch (error) {
                return null;
            }
        };

        const getFactoryPPIC = async (factoryId) => {
            try {
                if (!factoryId) return [];
                const [result] = await dbHots.promise().query(
                    'SELECT pic_name, flag FROM mst_factory_pic WHERE factory_id = ?',
                    [factoryId]
                );
                return result || [];
            } catch (error) {
                return [];
            }
        };

        const monthToRoman = (month) => {
            const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
            return romans[month - 1];
        };

        // Get approval list
        const getApproval = async (ticket_id) => {
            try {
                const [ticket] = await dbHots.promise().query(
                    'SELECT service_id FROM t_ticket WHERE ticket_id = ?',
                    [ticket_id]
                );
                if (!ticket.length) return [];

                const [workflow] = await dbHots.promise().query(
                    'SELECT definition FROM m_service_workflow WHERE workflow_id = ? AND is_active = 1',
                    [ticket[0].service_id]
                );
                if (!workflow.length) return [];

                const defRaw = workflow[0].definition;
                const workflowDef = typeof defRaw === 'string' ? JSON.parse(defRaw) : defRaw;
                const steps = workflowDef.steps || [];

                const [events] = await dbHots.promise().query(`
                    SELECT 
                        e.approval_order,
                        e.approve_date,
                        e.approver_id,
                        e.remark,
                        CONCAT(u.firstname, ' ', u.lastname) AS fullname,
                        u.email
                    FROM t_ticket_event e
                    LEFT JOIN user u ON e.approver_id = u.user_id
                    WHERE e.ticket_id = ?
                    AND e.event_type = 'approve'
                    AND e.approver_leader = '1'
                    ORDER BY e.approval_order
                `, [ticket_id]);

                return steps.map((step) => {
                    const event = events.find(e => e.approval_order === step.level);
                    return {
                        approval_order: step.level,
                        step_name: step.meta?.name || step.meta?.description || `Step ${step.level}`,
                        approve_date: event?.approve_date || null,
                        approver_id: event?.approver_id || null,
                        fullname: event?.fullname || null,
                        email: event?.email || null,
                        remark: event?.remark || ''
                    };
                });
            } catch (error) {
                console.error('Error fetching approvals:', error);
                return [];
            }
        };

        // Get SRF number
        const getSRFNumber = async (ticket_id) => {
            try {
                const [existingSRF] = await dbHots.promise().query(
                    `SELECT field_value AS doc_no FROM t_ticket_work_data WHERE ticket_id = ? AND field_name = 'srf_document_number' LIMIT 1`,
                    [ticket_id]
                );
                return existingSRF[0]?.doc_no || 'To Be Generated';
            } catch (error) {
                return 'Error';
            }
        };

        // Signature helper
        const getSignatureUrl = async (userId) => {
            const signPath = await profileController.getUserSignaturePath(userId);
            if (signPath) {
                return `${API_URL}${signPath}`;
            }
            return `${API_URL}/ttd/sign-${userId}.jpg`;
        };

        // Now build the document data
        let factory_id = await getFactoryIdFromWorkData(data?.ticket_id);
        let factory = '';

        if (factory_id) {
            factory = await getFactoryByFactoryId(factory_id);
        } else {
            factory_id = getByLabel('factory_id');
            factory = getByLabel('factory');
        }

        const factoryPIC = await getFactoryPPIC(factory_id);
        const approvallistRaw = await getApproval(data?.ticket_id);
        const approvallist = approvallistRaw.filter(a => a.approval_order !== 2);
        const generatesrf = await getSRFNumber(data?.ticket_id);

        // Build item rows
        let totalPcs = 0, totalCtn = 0;
        let itemRowsHtml = '';

        const isEngineFormat = detailRows.some(r =>
            r.field_type === 'rowgroup_item' ||
            r.lbl_col?.toLowerCase() === 'quantity' ||
            r.lbl_col?.toLowerCase() === 'item name'
        );

        if (isEngineFormat) {
            const itemRows = detailRows.filter(r =>
                r.lbl_col?.toLowerCase() === 'item name' ||
                r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('item')
            );

            const quantityRows = detailRows.filter(r =>
                r.lbl_col?.toLowerCase() === 'quantity' ||
                (r.field_type === 'rowgroup_item' && r.lbl_col?.toLowerCase().includes('quantity'))
            );

            itemRows.forEach((itemRow, i) => {
                const itemName = itemRow.value || '';
                const itemIndex = itemRow.cstm_col?.match(/\d+/)?.[0] || i.toString();
                const qtyRow = quantityRows.find(q => q.cstm_col?.includes(itemIndex)) || quantityRows[i];
                const qtyValue = qtyRow?.value || '';

                let pcs = '', ctn = '';
                const cleanQty = qtyValue.replace(/\|/g, '').trim();

                if (cleanQty.toLowerCase().includes('pcs')) {
                    const val = parseInt(cleanQty);
                    if (!isNaN(val)) {
                        totalPcs += val;
                        pcs = val.toLocaleString();
                    }
                }
                if (cleanQty.toLowerCase().includes('ctn')) {
                    const val = parseInt(cleanQty);
                    if (!isNaN(val)) {
                        totalCtn += val;
                        ctn = val.toLocaleString();
                    }
                }

                itemRowsHtml += `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${itemName}</td>
                      <td>${pcs}</td>
                      <td>${ctn}</td>
                    </tr>`;
            });
        } else {
            const itemRows = detailRows.filter(row =>
                row.lbl_col?.toLowerCase().includes('item')
            );

            itemRows.forEach((row, i) => {
                const itemName = row.value || row.cstm_col || '';
                const qtyRow = detailRows.find(
                    r => r.lbl_col?.toLowerCase().includes('quantity') &&
                        r.order_col === row.order_col + 1
                ) || detailRows[i + 1];

                const qty = qtyRow?.value || qtyRow?.cstm_col || '';
                let pcs = '', ctn = '';

                if (qty.toLowerCase().includes('pcs')) {
                    const val = parseInt(qty);
                    if (!isNaN(val)) {
                        totalPcs += val;
                        pcs = val.toLocaleString();
                    }
                }

                if (qty.toLowerCase().includes('ctn')) {
                    const val = parseInt(qty);
                    if (!isNaN(val)) {
                        totalCtn += val;
                        ctn = val.toLocaleString();
                    }
                }

                itemRowsHtml += `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${itemName}</td>
                      <td>${pcs}</td>
                      <td>${ctn}</td>
                    </tr>`;
            });
        }

        // Notes
        let notesHtml = '';
        approvallistRaw.forEach((approvalData) => {
            if (approvalData.remark && approvalData.remark.trim() !== '') {
                const stepInfo = approvalData.step_name ? `(${approvalData.step_name})` : '';
                notesHtml += `<li>${approvalData.fullname} ${stepInfo}: ${approvalData.remark}</li>`;
            }
        });

        const toPICs = factoryPIC.filter(p => p.flag === 1).map(p => p.pic_name);
        const ccPICs = factoryPIC.filter(p => p.flag === 2).map(p => p.pic_name);

        // Approval columns
        const approvalColumnsPromises = approvallist
            .filter(a => a.approval_order !== 2)
            .map(async (approver) => {
                const isApproved = !!approver.approve_date;
                let signBlock = '';
                if (isApproved) {
                    const signUrl = await getSignatureUrl(approver.approver_id);
                    signBlock = `
              <div style="height: 100%; max-height:130px; display:flex; align-items:center;">
                <img alt="sign" src="${signUrl}" style="width:120px;display:block;margin:0 auto 5px auto;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2260%22><text y=%2230%22 fill=%22red%22>Image Error</text></svg>'; this.title='Failed to load: ${signUrl}'"/>
              </div>`;
                } else {
                    signBlock = `<div style="height: 100%; max-height:130px; display:flex; align-items:center;"></div>`;
                }

                const positionLabel = approver.step_name || `Step ${approver.approval_order}`;

                return `
            <td style="padding:10px;vertical-align:top;">
              ${signBlock}
              <br>
              ${approver.fullname || "—"}
              <br>
              <span style="font-size:12px;color:#555;">${positionLabel}</span>
            </td>`;
            });

        const approvalColumnsHtml = (await Promise.all(approvalColumnsPromises)).join("");
        const requesterSignUrl = await getSignatureUrl(data.created_by);

        // Build final HTML (same as srf_document_generator)
        const html = `
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>SAMPLE REQUEST FORM ( SRF ) - PREVIEW</title>
                  <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 40px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                    .no-border td { border: none; }
                    .center { text-align: center; }
                    .bold { font-weight: bold; }
                    .section-title { margin-top: 20px; font-weight: bold; font-size: 16px; text-align: center; }
                    .note { border: 1px solid #000; padding: 10px; margin-top: 10px; }
                    .approval-table td { height: 60px; vertical-align: bottom; text-align: center; }
                    .small { font-size: 10px; }
                    /* Debug styling for preview */
                    .debug-bar { 
                        background: #ff6b6b; color: white; padding: 10px; margin-bottom: 20px; 
                        font-size: 14px; border-radius: 5px; 
                    }
                    .debug-bar strong { color: yellow; }
                  </style>
                </head>
                <body>
    
                <div class="debug-bar">
                    🧪 <strong>PREVIEW MODE</strong> | Ticket: ${data.ticket_id} | Created by: ${data.created_by} | 
                    Factory: ${factory} | SRF: ${generatesrf}
                </div>
    
                <div style="display:flex;justify-content:space-between;width:100%;">
                    <div>
                        <img
                            src="${API_URL}/aset/image/indofood_header_logo.png"
                            style="height:35px"
                        />
                    </div>
                    <div style="display:flex;justify-content:flex-end;">
                        <img
                            src="${API_URL}/aset/image/icbp_header_logo.png"
                            style="height:35px"
                        />
                    </div>
                </div>
    
    
                <br>
    
                <table class="no-border">
                  <tr>
                    <td><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td>
                    <td style="text-align:right;">To&nbsp;: <em> ${toPICs.join(', ')} </em> </td>
                  </tr>
                  <tr>
                    <td><strong>Division</strong>&nbsp;: IOD </td>
                    <td style="text-align:right;"></td>
                  </tr>
                  <tr>
                    <td><strong>Location</strong>&nbsp;: INDOFOOD TOWER LT.23</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><strong>SRF NO</strong>&nbsp;: ${generatesrf}</td>
                    <td></td>
                  </tr>
                </table>
          
                <div class="section-title">SAMPLE REQUEST FORM ( SRF )</div>
          
               <style>
                    .no-border {
                        width: 100%;
                        table-layout: fixed;
                        border-collapse: collapse;
                    }
                    .no-border td {
                        vertical-align: top;
                        padding: 4px;
                    }
                    .label {
                        width: 12%;
                        font-weight: bold;
                    }
                    .content {
                        width: 38%;
                    }
                </style>
    
                <table class="no-border">
                    <tr>
                        <td class="label">To</td>
                        <td class="content">:  ${toPICs.join(', ')}</td>
                        <td class="label">Name/Title</td>
                        <td class="content">: ${getByLabel('name')}</td>
                    </tr>
                    <tr>
                        <td class="label">Cc</td>
                        <td class="content">:  ${ccPICs.join(', ')}</td>
                        <td class="label">Purposes</td>
                        <td class="content">: ${getByLabel('purpose')}</td>
                    </tr>
                    <tr>
                        <td class="label">Deliver to</td>
                        <td class="content">: ${getByLabel('deliver_to')}</td>
                        <td class="label">Category</td>
                        <td class="content">: ${getByLabel('Category_field')}</td>
                    </tr>
                </table>
    
          
                <table>
                  <thead>
                    <tr>
                      <th>NO</th>
                      <th>DESCRIPTION</th>
                      <th>QUANTITY IN PCS</th>
                      <th>QUANTITY IN CTN</th>
                    </tr>
                  </thead>
                  <tbody>
    
                    ${itemRowsHtml}
                    <tr>
                      <td colspan="2" class="bold" style="text-align: right;">TOTAL</td>
                      <td class="bold">${totalPcs.toLocaleString()} PCS</td>
                      <td class="bold">${totalCtn.toLocaleString()} CTN</td>
                    </tr>
                  </tbody>
                </table>
          
                <div class="note">
                    <strong>Request Detail:</strong>
                   ${(() => {
                const po = getByLabel("PO_Number") || "";
                return !po.toLowerCase().includes("no data found")
                    ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA PO ${po}</p>`
                    : "";
            })()}
                  
                    ${getByLabel('Week Delivery') && getByLabel('Week Delivery') !== "No Data Found"
                ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA WEEK ${getByLabel('Week Delivery')}</p>`
                : ''}
                    <p>MOHON AGAR PERMINTAAN SAMPLE ${getByLabel('field_1761105177705').toLocaleString() === `true` ? "" : "TIDAK "}DIDECLARE PADA SHIPPING DOCS</p>
                </div>
    
                <div class="note">
                    <strong>Note:</strong>
                   <br>
                    ${getByLabel('field_1761105303599') ? `<p>${getByLabel('field_1761105303599')}</p>` : ''}
                     ${notesHtml}
                  <strong>Thank you</strong>
                </div>
          
                <table class="approval-table" style="width:100%; table-layout:fixed; border-collapse:collapse;">
 
                 <tr class="bold">
                    <td style="text-align:center; vertical-align:middle;">Request by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                    <td style="text-align:center; vertical-align:middle;">Approved by</td>
                </tr>
                  <tr>
                    
                    <td style="padding:10px;vertical-align:top;">
                            <div style="height: 100%; max-height:130px;display:flex; align-items: center;">
                    
                        <img
                            alt="sign"
                            src="${requesterSignUrl}"
                            style="width:120px;display:block;margin:0 auto 5px auto;"
                            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2260%22><text y=%2230%22 fill=%22red%22>Image Error</text></svg>'; this.title='Failed to load: ${requesterSignUrl}'"
                        />
                        </div>
                        <br>
                        ${data?.requester_name || ''}
                        <br>
                        <span style="font-size:12px;color:#555;">${data.business_analyst || 'Business Analyst'}</span>
                    </td>
                    

                    ${approvalColumnsHtml}

                  </tr>
                </table>
          
                </body>
              </html>
            `;

        return html;
    },


};

