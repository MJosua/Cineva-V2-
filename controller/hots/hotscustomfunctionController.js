const {
    dbHots,
    dbQueryHots,
    // addSqlLogger
} = require("../../config/db"); // Adjust path as needed
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const yellowTerminal = '\x1b[33m';


const puppeteer = require('puppeteer');
const Mustache = require('mustache');

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

    generateDocument: async (template, ticketData, params) => {
        const fileName = `document_${ticketData.ticket_id}_${Date.now()}.pdf`;
        const filePath = path.join('public', 'hots', 'generateddocuments', fileName);

        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Combine ticketData and params for full rendering context
        const data = { ...ticketData, ...params };
        console.log("data", data)

        let itemRowsHtml = '';
        let totalPcs = 0;
        let totalCtn = 0;

        for (let i = 7, no = 1; i <= 16; i += 2, no++) {
            const itemName = data[`cstm_col${i}`];
            const quantity = data[`cstm_col${i + 1}`];

            if (!itemName && !quantity) continue;

            let pcs = '', ctn = '';

            if (quantity?.toLowerCase().includes('pcs')) {
                pcs = quantity;
                const val = parseInt(quantity);
                if (!isNaN(val)) totalPcs += val;
            }

            if (quantity?.toLowerCase().includes('ctn')) {
                ctn = quantity;
                const val = parseInt(quantity);
                if (!isNaN(val)) totalCtn += val;
            }
            itemRowsHtml += `
                <tr>
                <td>${no}</td>
                <td>${itemName || ''}</td>
                <td>${pcs}</td>
                <td>${ctn}</td>
                </tr>`;
        }
        const html = `
            <html>
                <head>
                <meta charset="utf-8" />
                <title>SAMPLE REQUEST FORM</title>
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
                </style>
                </head>
                <body>

                <table class="no-border">
                    <tr>
                    <td><strong>PT. INDOFOOD CBP SUKSES MAKMUR</strong></td>
                    <td style="text-align:right;">To&nbsp;: ${data.cstm_col2}</td>
                    </tr>
                    <tr>
                    <td><strong>Division</strong>&nbsp;: IOD </td>
                    <td style="text-align:right;">From&nbsp;: Anindia Alfia Putri</td>
                    </tr>
                    <tr>
                    <td><strong>Location</strong>&nbsp;: INDOFOOD TOWER LT.23</td>
                    <td></td>
                    </tr>
                    <tr>
                    <td><strong>SRF NO</strong>&nbsp;: SRF/${data.ticket_id}</td>
                    <td></td>
                    </tr>
                </table>

                <div class="section-title">SAMPLE REQUEST FORM</div>

                <table class="no-border">
                    <tr>
                    <td>To</td><td>: ${data.cstm_col2}</td>
                    <td>Name/Title</td><td>: ${data.cstm_col1}</td>
                    </tr>
                    <tr>
                    <td>Cc</td><td>: ${data.cstm_col3}</td>
                    <td>Purposes</td><td>: ${data.cstm_col4}</td>
                    </tr>
                    <tr>
                    <td></td><td></td>
                    <td>Deliver to</td><td>: ${data.cstm_col5}</td>
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
                    {{#items}}
                    ${itemRowsHtml}
                    {{/items}}
                    <tr>
                        <td colspan="2" class="bold">TOTAL</td>
                        <td class="bold">${totalPcs} PCS</td>
                        <td class="bold">${totalCtn} CTN</td>
                    </tr>
                    </tbody>
                </table>

                <div class="note">
                    <strong>Note:</strong>
                    <p>
                    ${data.cstm_col6}
                    </p>
                    Thank you
                </div>

                <table class="approval-table">
                    <tr class="bold">
                    <td>Request by,</td>
                    <td>Approved by,</td>
                    <td>Approved by,</td>
                    </tr>
                    <tr>
                    <td>{{approval_section.request_by}}<br /><span class="small">{{business_analyst}}</span></td>
                    <td>{{approval_section.approved_by}}<br /><span class="small">Logistics Manager</span></td>
                    <td>{{approval_section.accounting_manager}}<br /><span class="small">Accounting Manager</span></td>
                    </tr>
                </table>

                </body>
                </html>
        `;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);
        await page.pdf({ path: filePath, format: 'A4' });
        await browser.close();

        return filePath;
    },

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


            // Generate document
            const documentPath = await module.exports.generateDocument(config, ticketData[0], params);

            // Save generated document info
            await dbHots.promise().query(`
                INSERT INTO t_generated_documents 
                (ticket_id, document_type, file_path, file_name, generated_date, template_used)
                VALUES (?, ?, ?, ?, NOW(), ?)
            `, [
                ticketId,
                config.documentType || 'letter',
                documentPath || '',
                path.basename(documentPath || 'unknown.pdf'),
                config.template || 'unknown_template'
            ]);

            return {
                success: true,
                documentPath,
                documentType: config.documentType || 'letter'
            };
        } catch (err) {
            console.log(`[executeDocumentGeneration] Error for ticket ${ticketId}:`);
            console.dir(err, { depth: null }); // Full object logging

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


};

