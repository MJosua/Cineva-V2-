const {
    dbHots,
    dbQueryHots,
    dbQuery,
    dbConf,
} = require("../../../../config/db"); // Adjust path as needed
const resourceEngine = require('../../../../core/resource-engine');
const { RESOURCE_CATEGORIES } = require('../../../../script/Utility/hotsConstants');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const yellowTerminal = '\x1b[33m';


const puppeteer = require('puppeteer');
const documentEngine = require('../../../../core/document-engine');
const renderSRFHtml = require('../../../../core/renderers/srf-renderer');
const Mustache = require('mustache');
const QRCode = require('qrcode');
// const { PORT, API_URL } = require("../../index");

const { PORT, API_URL: ENV_API_URL } = require("../../../../config/env");
const profileController = require('../../profile/controllers/profileController');
const encrypts = require('../../../../config/encrypts');

// Base URL for static files (signatures, images, etc.)
// Priority: DEV/PROD prefixed variables based on NODE_ENV
const isProd = process.env.NODE_ENV === 'production';
const API_URL = isProd
    ? (process.env.PROD_BE_URL_HOTS || process.env.PROD_BE_URL)
    : (process.env.DEV_BE_URL_HOTS || process.env.DEV_BE_URL || 'http://localhost:9999');

/**
 * Custom Function Controller
 * Base Path: /hots_settings/custom_functions/
 */



// Helper: Convert local image file to Base64 Data URL
const imageToDataURL = (filePath) => {
    try {
        if (!filePath) return null;
        // controller/hots_controller/customfunction/controllers/customfunctionController.js -> root is 4 levels up
        const rootDir = path.resolve(__dirname, '../../../../');

        // Remove leading slash for relative resolution
        const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

        // Try multiple possible physical locations
        const possiblePaths = [
            path.isAbsolute(filePath) ? filePath : null, // 1. Raw absolute path
            path.join(rootDir, cleanPath),              // 2. Relative to root
            path.join(rootDir, 'public', cleanPath)     // 3. Relative to public folder (common for URL paths)
        ].filter(Boolean);

        let absolutePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                absolutePath = p;
                break;
            }
        }

        if (!absolutePath) {
            console.warn(`[imageToDataURL] File not found: ${filePath}`);
            return null;
        }

        const fileBuffer = fs.readFileSync(absolutePath);
        const ext = path.extname(absolutePath).toLowerCase().replace('.', '');
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
        return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (err) {
        console.error(`[imageToDataURL] Error reading file ${filePath}:`, err);
        return null;
    }
};

module.exports = {
    /**
     * GET /hots_settings/custom_functions
     * Get all trigger functions (migrated from m_custom_functions to m_service_trigger_function)
     */
    getCustomFunctions: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    tf.function_id as id,
                    tf.function_key,
                    tf.function_name as name,
                    tf.function_type as type,
                    tf.handler_path as handler,
                    tf.handler_params as config,
                    tf.description,
                    tf.category,
                    tf.is_active,
                    tf.created_at as created_date,
                    COUNT(st.trigger_id) as usage_count
                FROM hots.m_service_trigger_function tf
                LEFT JOIN hots.m_service_triggers st ON JSON_EXTRACT(st.trigger_config, '$.actions[0].function_key') = tf.function_key
                WHERE tf.is_active = 1
                GROUP BY tf.function_id
                ORDER BY tf.created_at DESC
            `);

            console.log(`${timestamp}Trying to get all trigger functions success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get trigger functions success"
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
     * Get triggers for a specific service (migrated from t_service_custom_functions to m_service_triggers)
     */
    getServiceCustomFunctions: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { serviceId } = req.params;

        try {
            const [result] = await dbHots.promise().query(`
                SELECT 
                    st.trigger_id as id,
                    st.service_id,
                    st.trigger_name,
                    st.trigger_type,
                    st.trigger_config,
                    st.active as is_active,
                    st.created_at as created_date,
                    tf.function_name as name,
                    tf.function_type as type,
                    tf.handler_path as handler,
                    tf.handler_params as function_config
                FROM hots.m_service_triggers st
                LEFT JOIN hots.m_service_trigger_function tf 
                    ON JSON_UNQUOTE(JSON_EXTRACT(st.trigger_config, '$.actions[0].function_key')) = tf.function_key
                WHERE st.service_id = ? AND st.active = 1
                ORDER BY st.trigger_id ASC
            `, [serviceId]);

            console.log(`${timestamp}Trying to get service triggers success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get service triggers success"
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
     * Assign trigger function to a service (migrated to m_service_triggers)
     */
    assignFunctionToService: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { service_id, function_key, trigger_event, config } = req.body;

        try {
            // Build trigger_config JSON
            const triggerConfig = {
                actions: [
                    {
                        action_type: 'execute_function',
                        function_key: function_key,
                        params: config || {}
                    }
                ]
            };

            await dbHots.promise().query(`
                INSERT INTO hots.m_service_triggers 
                (service_id, trigger_name, trigger_type, trigger_config, active, created_by, created_at)
                VALUES (?, ?, 'action', ?, 1, ?, NOW())
            `, [service_id, trigger_event, JSON.stringify(triggerConfig), user_id]);

            console.log(`${timestamp}Trying to assign trigger to service success from ${user_id}`);

            res.status(200).json({
                success: true,
                message: "Assign trigger to service success"
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

            // Log function execution - using new m_service_trigger_log
            await dbHots.promise().query(`
            INSERT INTO m_service_trigger_log 
            (ticket_id, service_id, function_key, trigger_name, action_type, status, result_summary, error_message, created_by, created_at)
            VALUES (?, ?, ?, ?, 'execute_function', ?, ?, ?, ?, NOW())
          `, [
                ticket_id,
                func.service_id || null,
                func.name,
                isManual ? 'manual' : 'on_create',
                status,
                JSON.stringify(result).substring(0, 500),
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
                SELECT * FROM hots.m_service_trigger_log 
                WHERE ticket_id = ? 
                ORDER BY created_at DESC
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
            // Fetch physical files from t_file_upload
            const [physicalDocs] = await dbHots.promise().query(`
                SELECT 
                    upload_id as id,
                    entity_id as ticket_id,
                    filename as file_name,
                    file_path,
                    created_at as generated_date,
                    'srf_document' as template_used,
                    'physical' as document_type,
                    NULL as view_url,
                    NULL as download_url
                FROM hots.t_file_upload 
                WHERE entity_id = ? AND entity_type = 'generated_document'
            `, [ticketId]);

            // Fetch virtual documents from t_document
            let virtualDocs = [];
            try {
                const [vDocs] = await dbHots.promise().query(`
                    SELECT 
                        id,
                        entity_id as ticket_id,
                        file_name,
                        NULL as file_path,
                        generated_at as generated_date,
                        template_name as template_used,
                        'virtual' as document_type,
                        CONCAT('hots_customfunction/render/', id) as view_url,
                        CONCAT('hots_customfunction/render/', id) as download_url
                    FROM hots.t_document
                    WHERE entity_id = ? AND entity_type = 'ticket'
                `, [ticketId]);
                virtualDocs = vDocs || [];
            } catch (vErr) {
                console.warn(`⚠️ [getGeneratedDocuments] Virtual docs query failed:`, vErr.message);
            }

            // Combine and sort by date descending
            const result = [...physicalDocs, ...virtualDocs].sort((a, b) =>
                new Date(b.generated_date) - new Date(a.generated_date)
            );

            console.log(`${timestamp}Trying to get generated documents success from ${user_id}`);

            res.status(200).json({
                data: result,
                success: true,
                message: "Get generated documents success"
            });
        } catch (err) {
            console.error(`❌ [getGeneratedDocuments] Error:`, err.message);
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
            let category = product_category.toUpperCase(); // Fallback

            // Try to resolve a shorter name if product_category is a resource key (e.g. 'fg_noodle')
            const resource = await resourceEngine.getResource(RESOURCE_CATEGORIES.SAMPLE_CATEGORY, product_category.toLowerCase());
            if (resource) {
                category = (resource.attributes?.samplecat_shortname || resource.attributes?.shortname || resource.resource_key || product_category).toUpperCase();
            }

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
                ORDER BY created_at DESC
    LIMIT 1
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
     * Auto-lookup category (RM/FG/GEN) from t_ticket_work_data + resource_m_data
     * Uses samplecategory_field_id to lookup category from unified resource system
     */
    getAutoCategory: async (req, res) => {
        try {
            const { ticketId } = req.params;

            if (!ticketId) {
                return res.status(400).json({ success: false, message: 'ticketId is required' });
            }

            // Step 1: Get the samplecategory_field_id from t_ticket_work_data
            const [workDataRows] = await dbHots.promise().query(`
                SELECT field_value
                FROM hots.t_ticket_work_data
                WHERE ticket_id = ?
                  AND field_name = 'samplecategory_field_id'
                LIMIT 1
            `, [ticketId]);

            if (workDataRows.length > 0 && workDataRows[0].field_value) {
                const categoryId = workDataRows[0].field_value;

                // Step 2: Lookup from ResourceEngine (unified resource system)
                const resource = await resourceEngine.getResource(
                    RESOURCE_CATEGORIES.SAMPLE_CATEGORY,
                    categoryId
                );

                if (resource) {
                    const shortname = resource.attributes?.samplecat_shortname || resource.attributes?.shortname || resource.resource_key || 'GEN';
                    console.log(`🔍 [AutoCategory] ticket=${ticketId}, category=${shortname} (from ResourceEngine)`);
                    return res.json({
                        success: true,
                        category: shortname,
                        category_name: resource.label,
                        auto_detected: true
                    });
                }
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


            await connection.query(
                `DELETE FROM hots.t_ticket_work_data WHERE ticket_id = ? AND field_name = 'srf_document_number'`,
                [ticket_id]
            );

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

            // Broadcast standard ticket update SSE so other users' UI updates
            if (global.sseManager) {
                global.sseManager.broadcastTicketUpdate(ticket_id);
            }

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
     * Generate an SRF document (PDF) - ASYNC with notification
     * Body: { ticket_id }
     * Returns immediately, document generation runs in background
     */
    generateSRFDocument: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;
        const { createNotification, updateNotification } = require('../../notification/notificationController');

        try {
            const { ticket_id } = req.body;

            if (!ticket_id) {
                return res.status(400).json({
                    success: false,
                    message: "ticket_id is required"
                });
            }

            // 🆕 RESPOND IMMEDIATELY - Don't wait for PDF generation
            res.status(202).json({
                success: true,
                message: "Document generation started. You will be notified when complete.",
                status: 'processing'
            });

            // 🆕 Create "processing" notification
            let notificationId = null;
            try {
                notificationId = await createNotification({
                    user_id: user_id,
                    type: 'doc_generation_started',
                    title: '📄 Generating Document...',
                    message: 'SRF document is being generated',
                    data_payload: {
                        ticket_id,
                        status: 'processing',
                        url: `/ticket/${ticket_id}`
                    }
                });

                // 🆕 Broadcast SSE for doc_generation_started so ALL users viewing this ticket see loading card
                if (global.sseManager) {
                    global.sseManager.broadcast('doc_generation_started', {
                        ticket_id,
                        status: 'processing',
                        message: `Generating SRF document for ticket ${ticket_id}...`
                    });
                    console.log(`📄 [generateSRFDocument] Broadcasted doc_generation_started for ticket ${ticket_id}`);
                }
            } catch (notifErr) {
                console.error('Failed to create processing notification:', notifErr);
            }

            // 🆕 ASYNC: Generate document in background
            (async () => {
                try {
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
                        throw new Error("Ticket not found");
                    }

                    // Generate the document using existing srf_document_generator
                    const config = { documentType: 'srf_document', service_id: 6 };
                    const params = {
                        generated_by: user_id,
                        requester_name: ticketRows[0]?.requester_name || ''
                    };

                    const documentPath = await module.exports.srf_document_generator(config, ticketRows, params);

                    if (!documentPath) {
                        throw new Error("Failed to generate document - no path returned");
                    }

                    // Save generated document info (standardized format)
                    await dbHots.promise().query(`
                        INSERT INTO hots.t_file_upload 
                        (entity_type, entity_id, ticket_id, field_name, file_path, filename, original_name, mime_type, upload_date, is_active, uploaded_by, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1, ?, NOW(), NOW())
                    `, [
                        'generated_document',
                        ticket_id,
                        ticket_id, // ticket_id column
                        'srf_document', // field_name
                        documentPath,
                        require('path').basename(documentPath),
                        require('path').basename(documentPath),
                        'application/pdf',
                        user_id
                    ]);

                    console.log(`${timestamp}SRF document generated for ticket ${ticket_id} by user ${user_id}: ${documentPath}`);

                    // 🆕 Update notification to success
                    if (notificationId) {
                        try {
                            await updateNotification(notificationId, {
                                type: 'doc_generation_complete',
                                title: '✅ Document Ready',
                                message: 'SRF document has been generated successfully',
                                data_payload: {
                                    ticket_id,
                                    status: 'success',
                                    file_path: documentPath,
                                    url: `/ticket/${ticket_id}`
                                }
                            });
                        } catch (updateErr) {
                            console.error('Failed to update notification:', updateErr);
                        }
                    }

                    // 🆕 Broadcast SSE to notify ALL users viewing this ticket
                    if (global.sseManager) {
                        global.sseManager.broadcast('doc_generation_complete', {
                            ticket_id,
                            document_path: documentPath,
                            file_name: require('path').basename(documentPath),
                            status: 'success',
                            message: 'SRF document generated successfully'
                        });
                        console.log(`📄 [generateSRFDocument] Broadcasted doc_generation_complete for ticket ${ticket_id}`);
                    }

                } catch (err) {
                    console.error(`${timestamp}Error generating SRF document (async):`, err);

                    // 🆕 Update notification to error
                    if (notificationId) {
                        try {
                            await updateNotification(notificationId, {
                                type: 'doc_generation_complete',
                                title: '❌ Document Error',
                                message: `Failed to generate document: ${err.message}`,
                                data_payload: {
                                    ticket_id,
                                    status: 'error',
                                    error: err.message,
                                    url: `/ticket/${ticket_id}`
                                }
                            });
                        } catch (updateErr) {
                            console.error('Failed to update error notification:', updateErr);
                        }
                    }

                    // 🆕 Broadcast SSE error to notify ALL users viewing this ticket
                    if (global.sseManager) {
                        global.sseManager.broadcast('doc_generation_complete', {
                            ticket_id,
                            status: 'error',
                            error: err.message,
                            message: `Document generation failed: ${err.message}`
                        });
                        console.log(`📄 [generateSRFDocument] Broadcasted doc_generation_complete (error) for ticket ${ticket_id}`);
                    }
                }
            })();

        } catch (err) {
            console.error(`${timestamp}Error starting SRF document generation:`, err);
            // This only catches errors before the async block starts
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
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
    // Update service trigger assignment (migrated to m_service_triggers)
    updateServiceFunctionAssignment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;
            const { service_id, function_key, trigger_event, config, is_active } = req.body;

            // Build trigger_config JSON
            const triggerConfig = {
                actions: [
                    {
                        action_type: 'execute_function',
                        function_key: function_key,
                        params: config || {}
                    }
                ]
            };

            const [result] = await dbHots.promise().query(`
            UPDATE m_service_triggers 
            SET service_id = ?, trigger_name = ?, trigger_config = ?, 
                active = ?, updated_at = NOW()
            WHERE trigger_id = ?
        `, [service_id, trigger_event, JSON.stringify(triggerConfig), is_active ? 1 : 0, id]);

            console.log(`Service trigger updated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Service trigger updated successfully"
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: err.message
            });
        }
    },

    // Remove service trigger (migrated to m_service_triggers)
    removeServiceFunctionAssignment: async (req, res) => {
        let date = new Date();
        let timestamp = yellowTerminal + date.toLocaleDateString('id') + ' ' + date.toLocaleTimeString('id') + ' : ';
        let user_id = req.dataToken.user_id;

        try {
            const { id } = req.params;

            const [result] = await dbHots.promise().query(`
            UPDATE m_service_triggers 
            SET active = 0, updated_at = NOW()
            WHERE trigger_id = ?
        `, [id]);

            console.log(`Service trigger deactivated successfully by ${user_id} at ${timestamp}`);

            res.status(200).json({
                success: true,
                message: "Service trigger deactivated successfully"
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

            SELECT 
                upload_id as id,
                filename as file_name,
                file_path
            FROM hots.t_file_upload 
            WHERE upload_id = ?
                `, [documentId]);

            if (documents.length === 0) {
                // If not found in t_file_upload, check if it's a virtual document
                const virtualDoc = await documentEngine.getDocument(documentId);
                if (virtualDoc) {
                    // Redirect to render endpoint with format=pdf
                    return res.redirect(`${req.baseUrl}/render/${documentId}?format=pdf`);
                }

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


    /**
     * Render Virtual Document (HTML or PDF)
     * GET /hots_customfunction/render/:documentId?format=pdf
     */
    renderVirtualDocument: async (req, res) => {
        try {
            const { documentId } = req.params;
            const format = req.query.format || 'html';

            // 1. Render HTML using the Engine
            // renderHtml accepts documentId and handles fetching + template selection
            const result = await documentEngine.renderHtml(documentId);
            if (!result.ok) {
                return res.status(404).json({ ok: false, error: result.error || 'Document not found' });
            }

            const htmlContent = result.html;

            // 2. Output
            if (format === 'pdf') {
                const browser = await puppeteer.launch({
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                const page = await browser.newPage();
                await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await new Promise(resolve => setTimeout(resolve, 1000));
                const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
                await browser.close();

                res.set('Content-Type', 'application/pdf');
                return res.send(pdfBuffer);
            }

            // HTML
            res.set('Content-Type', 'text/html');
            res.send(htmlContent);

        } catch (error) {
            console.error('❌ [renderVirtualDocument] Error:', error);
            res.status(500).send('Error rendering document: ' + error.message);
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
            VALUES(?, ?, ?, ?, 1, ?, NOW())
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
    /**
     * SRF Document Generator (Physical PDF)
     * UNIFIED VERSION
     * Uses core/document-data-preparer and core/renderers/srf-renderer
     */
    srf_document_generator: async (template, ticketData, params) => {
        try {
            console.log('📄 [CONTROLLER] Generating Physical SRF Document via Unified Renderer...');

            // Extract Ticket ID
            const ticketId = Array.isArray(ticketData) ? ticketData[0]?.ticket_id : (ticketData?.ticket_id || params.ticket_id);
            if (!ticketId) throw new Error("Ticket ID mismatch or missing.");

            const fileName = `document_SRF_${ticketId}_${Date.now()}.pdf`;
            const folderPath = path.join('public', 'hots', 'generateddocuments');
            const filePath = path.join(folderPath, fileName);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            // 1. Prepare Data
            // Use the centralized data preparer to ensure consistency with Virtual Documents
            const { prepareSRFData } = require('../../../../core/document-data-preparer');
            // prepareSRFData requires { db } context for database queries
            const data = await prepareSRFData(ticketId, { db: dbHots });

            // 2. Generate HTML
            // Use the unified Source of Truth renderer
            const htmlContent = renderSRFHtml(data);

            // 3. Generate PDF
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Set content and wait for network/images
            await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 60000 });

            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
            });
            await browser.close();

            // 4. Write to Disk
            fs.writeFileSync(filePath, pdfBuffer);

            return filePath;

        } catch (error) {
            console.error('❌ [CONTROLLER] Error generating physical SRF:', error);
            throw error;
        }
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
            // Save generated document info to t_file_upload (use 'generated_document' entity_type to match getGeneratedDocuments query)
            await dbHots.promise().query(`
                INSERT INTO hots.t_file_upload
                (entity_type, entity_id, ticket_id, field_name, filename, original_name, file_path, upload_date, is_active, created_at, updated_at, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1, NOW(), NOW(), ?)
                `, [
                'generated_document', // Changed from 'ticket' to match getGeneratedDocuments query
                ticketId,
                ticketId,
                'srf_document', // field_name
                path.basename(documentPath || 'unknown.pdf'), // filename
                path.basename(documentPath || 'unknown.pdf'), // original_name
                documentPath || '', // file_path
                0 // uploaded_by (system)
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
                                font - family: Arial, sans-serif;
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
                            h1 {color: #4fc3f7; margin-bottom: 30px; }
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
                            button:hover {transform: scale(1.05); }
                            .hint {
                                margin - top: 20px;
                            color: #888;
                            font-size: 14px;
        }
                            .shortcuts {
                                margin - top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #333;
        }
                            .shortcuts a {
                                color: #4fc3f7;
                            text-decoration: none;
                            margin: 0 10px;
        }
                            .shortcuts a:hover {color: #00e676; }
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
                const factoryPICs = factoryId ? await new Promise((resolve, reject) => {
                    dbHots.query(
                        'SELECT pic_name, flag FROM iod.map_factory_pic WHERE factory_id = ? AND end_date IS NULL ORDER BY flag ASC',
                        [factoryId],
                        (err, results) => {
                            if (err) {
                                return reject(err);
                            }
                            resolve(results);
                        }
                    );
                }) : [];
                return factoryPICs || [];
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



        const getApprovalLeaderOnly = async (ticket_id) => {
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

                // 3. Get approvals from t_ticket_event (only leaders for document signatures)
                const [events] = await dbHots.promise().query(`
                    SELECT
                        e.approval_order,
                        e.approve_date,
                        e.approver_id,
                        e.approver_leader,
                        e.remark,
                        CONCAT(u.firstname, ' ', u.lastname) AS fullname,
                        u.email
                    FROM t_ticket_event e
                    LEFT JOIN user u ON e.approver_id = u.user_id
                    WHERE e.ticket_id = ?
                        AND e.event_type = 'approve'
                        AND e.approver_leader = 1
                    ORDER BY e.approval_order
                `, [ticket_id]);

                // 4. Map workflow steps to actual approvals (only for steps that have a leader approver)
                return steps
                    .map((step) => {
                        const event = events.find(e => e.approval_order === step.level);

                        return {
                            approval_order: step.level,
                            step_name: step.meta?.name || step.meta?.description || `Step ${step.level}`,
                            approve_date: event?.approve_date || null,
                            approver_id: event?.approver_id || null,
                            approver_leader: event?.approver_leader || null,
                            fullname: event?.fullname || null,
                            email: event?.email || null,
                            remark: event?.remark || ''
                        };
                    })
                    .filter(step => step.approver_id !== null); // Only include steps that have a leader assigned
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
            if (!userId) return '';
            try {
                // 1. Try profile path (Profile Handsign)
                const signPath = await profileController.getUserSignaturePath(userId);
                if (signPath) {
                    const dataUrl = imageToDataURL(signPath);
                    if (dataUrl) return dataUrl;
                }
                // 2. Fallback to legacy path (TTD Fallback)
                return imageToDataURL(`public/ttd/sign-${userId}.jpg`) || '';
            } catch (err) {
                console.warn(`[getSignatureUrl] Error for user ${userId}:`, err.message);
                return '';
            }
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
        const approvallistLeaderOnly = await getApprovalLeaderOnly(data?.ticket_id);

        const approvallist = approvallistLeaderOnly.filter(a => a.approval_order !== 2);
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
                    <img alt="sign" src="${signUrl}" style="width:120px;display:block;margin:0 auto 5px auto;" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2260%22><text y=%2230%22 fill=%22red%22>Image Error</text></svg>'; this.title='Failed to load: ${signUrl}'" />
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
                                    body {font - family: Arial, sans-serif; font-size: 12px; margin: 40px; }
                                    table {width: 100%; border-collapse: collapse; margin-top: 10px; }
                                    th, td {border: 1px solid #000; padding: 5px; text-align: left; }
                                    .no-border td {border: none; }
                                    .center {text - align: center; }
                                    .bold {font - weight: bold; }
                                    .section-title {margin - top: 20px; font-weight: bold; font-size: 16px; text-align: center; }
                                    .note {border: 1px solid #000; padding: 10px; margin-top: 10px; }
                                    .approval-table td {height: 60px; vertical-align: bottom; text-align: center; }
                                    .small {font - size: 10px; }
                                    /* Debug styling for preview */
                                    .debug-bar {
                                        background: #ff6b6b; color: white; padding: 10px; margin-bottom: 20px;
                                    font-size: 14px; border-radius: 5px; 
                    }
                                    .debug-bar strong {color: yellow; }
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
                                            src="${imageToDataURL('public/aset/image/indofood_header_logo.png')}"
                                            style="height:35px"
                                        />
                                    </div>
                                    <div style="display:flex;justify-content:flex-end;">
                                        <img
                                            src="${imageToDataURL('public/aset/image/icbp_header_logo.png')}"
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
                                            vertical - align: top;
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

    /**
     * Generate Card Name HTML
     * Creates HTML for business card generation
     * @param {Object} userData - User data object
                                    * @param {Object} params - Additional parameters
                                    * @returns {string} HTML string for the card
                                    */
    generateCardNameHTML: async (userData, params = {}) => {
        // Helper: Phone Formatter (from reference Preview.jsx)
        const formatPhoneNumber = (phoneNumber) => {
            if (!phoneNumber || phoneNumber.trim() === "") return "";
            const cleaned = phoneNumber.replace(/[^\d+]/g, '');
            if (cleaned.startsWith('0')) {
                const formatted = cleaned.substring(1);
                return `+62 ${formatted.slice(0, 3)} ${formatted.slice(3, 7)} ${formatted.slice(7, 11)}`.trim();
            } else if (cleaned.startsWith('+62')) {
                const formatted = cleaned.substring(3);
                return `+62 ${formatted.slice(0, 3)} ${formatted.slice(3, 7)} ${formatted.slice(7, 11)}`.trim();
            }
            return phoneNumber;
        };

        // Map user data to card fields
        const data = {
            name: userData.fullname || `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || params.name || '',
            position: userData.job_title_name || params.position || '',
            cellPhone: userData.cell_phone || params.cellPhone || '',
            extPhone: userData.ext_phone || userData.phone || params.extPhone || '',
            email: userData.email || params.email || '',
            company: userData.company_name || params.company || 'PT. INDOFOOD CBP SUKSES MAKMUR',
            department_name: userData.department_name // Added department mapping
        };

        // Build HTML using EXACT reference pattern from refrence/src/App.css + refrence/src/Component/Preview.jsx
        // Dimensions: 510.2362px x 311.811px (fixed pixels, not mm)
        // Asset path: /public/hots/aset/cardgenerator/

        // Use localhost for development, production URL when deployed
        const ASSET_BASE = API_URL + '/public/hots/aset/cardgenerator';

        // Calculate email font size based on length
        const emailLength = data.email.length;
        let emailFontSize = 'fs-20px'; // default (11.9px)
        if (emailLength > 35) {
            emailFontSize = 'fs-12px'; // 9px
        } else if (emailLength > 30) {
            emailFontSize = 'fs-14px'; // 10px
        } else if (emailLength > 25) {
            emailFontSize = 'fs-16px'; // 11px
        } else if (emailLength > 22) {
            emailFontSize = 'fs-18px'; // 11.9px (same as 20px in CSS)
        }

        // Generate QR Code for profile page
        const userId = userData.user_id || params.userId;
        let qrCodeDataUrl = '';
        if (userId) {
            try {
                const encryptedId = encrypts.encryptEmployeeId(userId);
                // URL encode the encrypted ID for safe URL usage
                const encodedId = encodeURIComponent(encryptedId);
                const profileUrl = `https://hots.indofood.com/hots/card/card?employee_id=${encodedId}`;
                qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
                    width: 100,
                    margin: 1,
                    color: { dark: '#000000', light: '#ffffff' }
                });
            } catch (qrError) {
                console.error('QR Code generation failed:', qrError);
                qrCodeDataUrl = ''; // Will show placeholder
            }
        }

        const html = `
                                    <!DOCTYPE html>
                                    <html>
                                        <head>
                                            <meta charset="utf-8" />
                                            <title>Business Card - ${data.name}</title>
                                            <style>
                /* ===== EXACT CSS FROM refrence/src/App.css ===== */
                                                body, * {
                                                    font - family: Arial, sans-serif;
                                                margin: 0;
                                                padding: 0;
                                                box-sizing: border-box;
                }

                                                body {
                                                    background: #f0f0f0;
                                                display: flex;
                                                justify-content: center;
                                                align-items: center;
                                                padding: 20px;
                }

                                                .page-container {
                                                    display: flex;
                                                flex-direction: column;
                                                gap: 20px;
                }

                                                /* Card base - EXACT dimensions from reference */
                                                .base-kartunama {
                                                    width: 510.2362px;
                                                height: 311.811px;
                                                border-radius: 5px;
                                                user-select: none;
                                                padding: 0px;
                                                padding-top: 11.33px;
                                                background: white;
                                                position: relative;
                                                border: 1px solid #ddd;
                                                overflow: hidden; /* IMPORTANT: Keep footer inside card */
                }

                                                .logo-kartunama {
                                                    width: 187.0886px;
                }

                                                .footer-kartunama {
                                                    border - radius: 0px 0px 5px 5px;
                                                height: 17.00787px;
                                                background-color: #083484;
                }

                                                .nama-kartunama {
                                                    color: #083484;
                                                font-size: 17.6px;
                }

                                                .text-subsidiary {
                                                    color: #083484;
                                                font-size: 13.4px;
                                                font-weight: 500;
                }

                                                .no-gap {margin - bottom: -5px; }
                                                .no-gap-print {margin - bottom: -15px; }
                                                .up-gap {margin - top: 5px; }

                                                .perusahaan-kartunama {
                                                    color: #0ea8e6;
                                                position: relative;
                }

                                                .fs-12px {font - size: 9px; font-weight: 400; }
                                                .fs-14px {font - size: 10px; font-weight: 400; }
                                                .fs-16px {font - size: 11px; font-weight: 400; }
                                                .fs-18px {font - size: 11.9px; }
                                                .fs-20px {font - size: 11.9px; font-weight: 400; }
                                                .fs-22px {font - size: 13.4px; font-weight: 400; }

                                                /* Bootstrap-like helpers */
                                                .container-fluid {width: 100%; padding-left: 15px; padding-right: 15px; }
                                                .row {display: flex; flex-wrap: wrap; margin-left: -15px; margin-right: -15px; }
                                                .col-12 {flex: 0 0 100%; max-width: 100%; padding-left: 15px; padding-right: 15px; }
                                                .col-6 {flex: 0 0 50%; max-width: 50%; padding-left: 15px; padding-right: 15px; }
                                                .fw-bold {font - weight: bold; }
                                                .mt-1 {margin - top: 0.25rem; }
                                                .mt-4 {margin - top: 1.5rem; }
                                                .mb-1 {margin - bottom: 0.25rem; }
                                                .mb-3 {margin - bottom: 1rem; }
                                                .pb-3 {padding - bottom: 1rem; }
                                                .py-0 {padding - top: 0; padding-bottom: 0; }
                                                .py-2 {padding - top: 0.5rem; padding-bottom: 0.5rem; }
                                                .py-4 {padding - top: 1.5rem; padding-bottom: 1.5rem; }
                                                .px-0 {padding - left: 0; padding-right: 0; }
                                                .px-2 {padding - left: 0.5rem; padding-right: 0.5rem; }
                                                .ps-2 {padding - left: 0.5rem; }
                                                .pe-0 {padding - right: 0; }
                                                .position-absolute {position: absolute; }
                                                .position-relative {position: relative; }
                                                .bottom-0 {bottom: 0; }
                                                .start-0 {left: 0; }
                                                .w-100 {width: 100%; }
                                                .d-flex {display: flex; }
                                                .justify-content-center {justify - content: center; }
                                                .align-items-end {align - items: flex-end; }
                                                .h-100 {height: 100%; }

                                                @media print {
                                                    body {background: white; }
                                                .base-kartunama {page -break-after: always; border: none; }
                }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="page-container">
                                                <!-- ===== FRONT CARD ===== -->
                                                <!-- Reference: refrence/src/Component/Preview.jsx -->
                                                <div class="base-kartunama px-2 py-0 position-relative">
                                                    <div class="container-fluid py-0">
                                                        <div class="col-12 mt-4 py-0">
                                                            <!-- Logo with negative margin to compensate for image whitespace -->
                                                            <div class="col-12 py-0 pb-3" style="margin-left: -10px;">
                                                                <img src="${ASSET_BASE}/logo-indofoodcbp-cbp.png" class="logo-kartunama" alt="Indofood CBP" />
                                                            </div>

                                                            <div class="container-fluid ps-2 py-2">
                                                                <div class="row px-0 " style="margin-top: 25px;">
                                                                    <!-- LEFT COLUMN: User Info -->
                                                                    <div class="col-6 px-0 py-0">
                                                                        <div class="container-fluid py-0">
                                                                            <div class="row py-0">
                                                                                <!-- Name -->
                                                                                <div class="col-12 fw-bold nama-kartunama" style="margin-bottom: 2px;">
                                                                                    ${data.name}
                                                                                </div>
                                                                                <!-- Position -->
                                                                                <div class="col-12 fs-18px" style="margin-bottom: 2px;">
                                                                                    ${data.position}
                                                                                </div>
                                                                                <!-- Division under position (like reference) -->
                                                                                <div class="col-12 fs-20px" style="margin-bottom: 15px;">
                                                                                    International Operations Division
                                                                                </div>
                                                                                <!-- Phone -->
                                                                                <div class="col-12 fs-18px" style="margin-bottom: 2px;">
                                                                                    ${data.cellPhone || ''}
                                                                                </div>
                                                                                <!-- Email -->
                                                                                <div class="col-12 ${emailFontSize}">
                                                                                    ${data.email}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <!-- RIGHT COLUMN: Company & Address -->
                                                                    <div class="col-6 px-0 py-0">
                                                                        <div class="container-fluid py-0 px-0">
                                                                            <div class="row">
                                                                                <!-- PT INDOFOOD CBP Logo - ALIGN TOP with Name -->
                                                                                <div class="col-12 perusahaan-kartunama pe-0 no-gap-print">
                                                                                    <img src="${ASSET_BASE}/PT-Indofood-cbp-Sukses-Makmur.png"
                                                                                        class="logo-kartunama"
                                                                                        style="width: 93%;" />
                                                                                </div>
                                                                                <!-- Address Block with proper spacing -->
                                                                                <div style="margin-top: 8px;">
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px; margin-top: 8px;">Sudirman asas Plaza</div>
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px;">Indofood Tower, 23<sup>rd</sup> Floor</div>
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px;">Jl. Jend. Sudirman Kav. 76 - 78</div>
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px;">Jakarta 12910, Indonesia</div>
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px;">T. +6221 5795 8822${data.extPhone && data.extPhone >= 1000 ? ' ext.' + data.extPhone : ''}</div>
                                                                                    <div class="col-12 fs-22px" style="margin-bottom: 1px;">F. +6221 5793 7422</div>
                                                                                    <div class="col-12 fs-22px">www.indofoodcbp.com</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <!-- Blue footer bar -->
                                                    <div class="col-12 w-100 position-absolute bottom-0 start-0 footer-kartunama"></div>
                                                </div>

                                                <!-- ===== BACK CARD ===== -->
                                                <div class="base-kartunama position-relative">

                                                    <!-- CENTER WRAPPER (accounts for footer + padding) -->
                                                    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: calc(100% - 17.00787px); /* footer height */
        padding-top: 11.33px;           /* same as card */
        box-sizing: border-box;
    ">

                                                        <!-- QR Code -->
                                                        ${qrCodeDataUrl
                ? `<img src="${qrCodeDataUrl}" style="width:100px;height:100px;margin-bottom:10px;" />`
                : `<div style="width:100px;height:100px;background:#f8f8f8;border:1px solid #ddd;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;margin-bottom:10px;">QR Code</div>`
            }

                                                        <!-- Subsidiary text -->
                                                        <div class="text-subsidiary" style="margin-bottom:8px;">
                                                            a subsidiary of:
                                                        </div>

                                                        <!-- Indofood Logo -->
                                                        <img src="${ASSET_BASE}/logo-indofood.png" style="width:170px;" />
                                                    </div>

                                                    <!-- Footer -->
                                                    <div class="w-100 position-absolute bottom-0 start-0 footer-kartunama"></div>
                                                </div>
                                            </div>
                                        </body>
                                    </html>
                                    `;
        return html;
    },

    // cardname_document_generator: REMOVED (Migrated to document-engine)

    /**
     * Get User Card Data (for frontend preview)
     * Returns user info for the Card Generator widget
     */

    // --- UNIFIED CARD GENERATOR LOGIC ---
    // Legacy fetchUserCardData: REMOVED

    // API: Preview Virtual Card
    getUserCardData: async (req, res) => {
        try {
            const { userId } = req.params;
            const { prepareCardData } = require('../../../../core/document-data-preparer');

            // Use unified preparer (Live Mode)
            const data = await prepareCardData(userId, { db: dbHots });

            res.json({
                success: true,
                data: {
                    user_id: parseInt(userId),
                    encrypted_id: encodeURIComponent(encrypts.encryptEmployeeId(userId)), // Secure ID for public URL
                    fullname: data.name,
                    ...data,
                    // Frontend backward compatibility
                    job_title: data.position,
                    department: data.department_name
                }
            });
        } catch (error) {
            console.error('Error fetching card data:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // API: Public Profile (QR Code Target)
    getCardProfile: async (req, res) => {
        try {
            const { employee_id } = req.query;
            if (!employee_id) return res.status(400).json({ success: false, message: 'Employee ID is required' });

            // Decrypt ID
            let userId;
            try {
                if (encrypts.decryptEmployeeId) {
                    userId = encrypts.decryptEmployeeId(decodeURIComponent(employee_id));
                } else {
                    return res.status(500).json({ success: false, message: 'Encryption service unavailable' });
                }
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid or expired ID. Please scan a fresh QR code.' });
            }

            // Reuse unified preparer
            const { prepareCardData } = require('../../../../core/document-data-preparer');
            const data = await prepareCardData(userId, { db: dbHots });

            res.json({
                success: true,
                data: {
                    user_id: userId,
                    fullname: data.name,
                    position: data.position,
                    department: data.department_name,
                    email: data.email,
                    phone: data.cellPhone || data.extPhone,
                    linkedin: '',
                    company: data.company,
                    website: 'https://www.indofoodcbp.com/',
                    location: 'https://www.google.com/maps/place/Indofood+Tower',
                    address: 'Sudirman Plaza, Indofood Tower 23rd Floor, Jl. Jend. Sudirman Kav. 76-78, Jakarta 12910',
                    encrypted_id: employee_id,
                    download_url: `/hots_settings/custom_functions/card_pdf/${userId}`
                }
            });
        } catch (error) {
            console.error('❌ [getCardProfile] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // API: Generate/Download PDF
    generateCardNamePDF: async (req, res) => {
        try {
            const { userId } = req.params;
            const { prepareCardData } = require('../../../../core/document-data-preparer');
            const renderCardHtml = require('../../../../core/renderers/card-renderer');

            const data = await prepareCardData(userId, { db: dbHots });
            const html = renderCardHtml(data);

            const puppeteer = require('puppeteer');
            const browser = await puppeteer.launch({
                headless: 'shell', // Use the new faster headless mode
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' }); // Wait for images if possible
            const pdfBuffer = await page.pdf({
                width: '510.2362px',
                height: '633.622px', // Height of TWO cards (311.811 * 2) + 10px gap
                printBackground: true,
                margin: { top: 0, right: 0, bottom: 0, left: 0 }
            });
            await browser.close();

            // CRITICAL: Puppeteer 24 returns Uint8Array. Express needs Buffer for binary res.send
            const binaryBuffer = Buffer.from(pdfBuffer);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Card_${data.name.replace(/\s+/g, '_')}.pdf`);
            res.setHeader('Content-Length', binaryBuffer.length);
            res.send(binaryBuffer);

        } catch (error) {
            console.error('Error generating Card PDF:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // API: Preview Card HTML (for iframe rendering)
    // GET /card_generator/preview/:target_user_id
    previewCard: async (req, res) => {
        try {
            const userId = req.params.target_user_id;
            const { prepareCardData } = require('../../../../core/document-data-preparer');
            const renderCardHtml = require('../../../../core/renderers/card-renderer');

            const data = await prepareCardData(userId, { db: dbHots });
            const html = renderCardHtml(data);

            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        } catch (error) {
            console.error('Error previewing card:', error);
            res.status(500).send('<p>Error generating preview</p>');
        }
    },

    // API: Generate Card (on-the-fly PDF, returns download URL)
    // POST /card_generator/generate  { target_user_id }
    generateCard: async (req, res) => {
        try {
            const userId = req.body.target_user_id || req.user?.user_id;
            if (!userId) return res.status(400).json({ success: false, message: 'target_user_id is required' });

            // Return a download URL that points to the on-the-fly PDF endpoint
            // The frontend uses download_url property to trigger window.open
            const downloadPath = `hots_settings/custom_functions/card_pdf/${userId}`;

            res.json({
                success: true,
                data: {
                    file_path: downloadPath, // Legacy field
                    download_url: downloadPath, // Correct field for frontend
                    file_name: `BusinessCard_${userId}.pdf`,
                    message: 'Card ready for download (generated on-the-fly)'
                }
            });
        } catch (error) {
            console.error('Error in generateCard:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    /**
     * Search Users for Card Generator
     * GET /hots_settings/custom_functions/search_users?q=searchterm
     */
    searchUsersForCard: async (req, res) => {
        try {
            const { q } = req.query;
            const searchTerm = `%${q || ''}%`;

            const [users] = await dbHots.promise().query(`
                SELECT
                u.user_id,
                u.nik,
                CONCAT(u.firstname, ' ', u.lastname) AS fullname,
                jt.job_title AS job_title_name,
                d.department_name
                FROM user u
                LEFT JOIN m_job_title jt ON u.jobtitle_id = jt.jobtitle_id
                LEFT JOIN m_department d ON u.department_id = d.department_id
                WHERE u.active = 1
                AND (
                CONCAT(u.firstname, ' ', u.lastname) LIKE ?
                OR u.nik LIKE ?
                OR u.email LIKE ?
                )
                ORDER BY u.firstname ASC
                LIMIT 20
            `, [searchTerm, searchTerm, searchTerm]);

            res.json({
                success: true,
                data: users.map(u => ({
                    value: u.user_id,
                    label: `${u.fullname} | ${u.nik || 'No NIK'}`,
                    job_title: u.job_title_name,
                    department: u.department_name
                }))
            });
        } catch (error) {
            console.error('❌ [searchUsersForCard] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },


};

