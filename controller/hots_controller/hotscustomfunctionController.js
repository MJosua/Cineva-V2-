const {
    dbHots,
    dbQueryHots,
    dbQuery,
    dbConf,
} = require("../../config/db"); // Adjust path as needed
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const yellowTerminal = '\x1b[33m';


const puppeteer = require('puppeteer');
const Mustache = require('mustache');
// const { PORT, API_URL } = require("../../index");

const { PORT, API_URL } = require("../../config/env")

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
        const fileName = `document_${template.template_name || ticketData[0]?.ticket_id}_${Date.now()}.pdf`;
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

        const getByLabel = (labelKeyword) => {
            const row = detailRows.find(r =>
                r.lbl_col?.toLowerCase().includes(labelKeyword.toLowerCase())
            );
            return cleanValue(row?.cstm_col || '');
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
                console.log("factory", factory)
                return (result && result.length > 0) ? result : [{ pic_name: '', flag: '1' }];
            } catch (error) {
                console.error('Error fetching team leader:', error);
                return { team_leader_name: 'Unknown', team_leader_email: '-' };
            }
        };

        const getApproval = async (dataticket_id) => {
            try {
                const query = `
                      SELECT 
                      t.approval_order,
                      t.approve_date, 
                      t.approver_id,
                      u.email,
                      t.remark, 
                      CONCAT(u.firstname, ' ', u.lastname) AS fullname  
                      from 
                      t_ticket_event t 
                        left join user u 
                        on t.approver_id = u.user_id
                        where t.approval_id = ${dataticket_id}
                        and
                        t.approver_leader = "1"
    
                    `;
                const result = await dbQueryHots(query);
                return (result && result.length > 0) ? result : [{ approval_order: "", approve_date: "", approver_id: "", fullname: "" }];
            } catch (error) {
                console.error('Error fetching team leader:', error);
                return { team_leader_name: 'Unknown', team_leader_email: '-' };
            }
        };

        const monthToRoman = (month) => {
            const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
            return romans[month - 1];
        };

        const getSRFNumberDynamic = async (factory, categoryName, service_id, ticket_id) => {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const romanMonth = monthToRoman(month);

            // ✅ Step 0: Check if SRF already exists in t_ticket_detail
            const [existingSRF] = await dbHots.promise().query(
                `SELECT cstm_col AS doc_no 
               FROM t_ticket_detail 
               WHERE ticket_id = ? AND lbl_col = 'SRF No.' 
               LIMIT 1`,
                [ticket_id]
            );

            if (existingSRF.length > 0 && existingSRF[0].doc_no) {
                console.log(`🔁 Using existing SRF from t_ticket_detail: ${existingSRF[0].doc_no}`);
                return existingSRF[0].doc_no;
            }

            // Step 1: Resolve category shortname
            const [catQuery] = await dbHots.promise().query(`
              SELECT samplecat_shortname 
              FROM m_sample_category 
              WHERE samplecat_name LIKE ${dbHots.escape('%' + categoryName + '%')}
            `);
            const category = catQuery?.[0]?.samplecat_shortname || "GEN";
            if (category === "NICI") return "-";

            const factoryPart = category === "/FS" ? "" : `/${factory}`;

            // Step 2: Generate new SRF dynamically
            const conn = await dbHots.promise().getConnection();
            try {
                await conn.beginTransaction();

                const [existing] = await conn.query(
                    `
                SELECT MAX(CAST(td.cstm_col AS UNSIGNED)) AS last_seq
                FROM t_ticket_doc_no td
                WHERE td.lbl_col = 'sequence'
                AND td.service_id = ?
                AND EXISTS (
                  SELECT 1 FROM t_ticket_doc_no f
                  WHERE f.doc_no = td.doc_no
                  AND f.lbl_col = 'factory' AND f.cstm_col = ?
                )
                AND EXISTS (
                  SELECT 1 FROM t_ticket_doc_no c
                  WHERE c.doc_no = td.doc_no
                  AND c.lbl_col = 'category' AND c.cstm_col = ?
                )
                AND EXISTS (
                  SELECT 1 FROM t_ticket_doc_no m
                  WHERE m.doc_no = td.doc_no
                  AND m.lbl_col = 'month' AND m.cstm_col = ?
                )
                AND EXISTS (
                  SELECT 1 FROM t_ticket_doc_no y
                  WHERE y.doc_no = td.doc_no
                  AND y.lbl_col = 'year' AND y.cstm_col = ?
                )
                `,
                    [service_id, factory, category, month.toString(), year.toString()]
                );

                const nextSeq = (existing?.[0]?.last_seq || 0) + 1;
                const paddedSeq = String(nextSeq).padStart(3, "0");
                const srfNumber = `${paddedSeq}/SRF${factoryPart}/${category}/${romanMonth}/${year}`;

                // Step 3: Insert decomposed info dynamically
                const parts = [
                    { lbl_col: "factory", cstm_col: factory },
                    { lbl_col: "category", cstm_col: category },
                    { lbl_col: "month", cstm_col: month.toString() },
                    { lbl_col: "year", cstm_col: year.toString() },
                    { lbl_col: "sequence", cstm_col: nextSeq.toString() },
                ];

                for (const part of parts) {
                    await conn.query(
                        `INSERT INTO t_ticket_doc_no (ticket_id, doc_no, lbl_col, cstm_col, service_id)
                   VALUES (?, ?, ?, ?, ?)`,
                        [ticket_id, srfNumber, part.lbl_col, part.cstm_col, service_id]
                    );
                }

                // ✅ Step 4: Save SRF number into t_ticket_detail
                await conn.query(
                    `INSERT INTO t_ticket_detail (ticket_id, lbl_col, cstm_col)
                 VALUES (?, 'SRF No.', ?)`,
                    [ticket_id, srfNumber]
                );

                await conn.commit();

                console.log(`✅ New SRF created and synced: ${srfNumber}`);
                return srfNumber;
            } catch (err) {
                await conn.rollback();
                console.error("❌ Error generating dynamic SRF number:", err);
                throw err;
            } finally {
                conn.release();
            }
        };



        const teamLeader = await getteamleaderEmail(17);
        const factoryPIC = await getFactoryPPIC(getByLabel('Factory_id'));
        console.log("getByLabel('Factory_id')", getByLabel('Factory_id'))
        const approvallistRaw = await getApproval(data?.ticket_id);
        const approvallist = approvallistRaw.filter(a => a.approval_order !== 2);
        const factory = getByLabel('factory');
        const factory_id = getByLabel('Factory_id');
        const sample = getByLabel('sample');
        const generatesrf = await getSRFNumberDynamic(factory, sample, data?.service_id, data?.ticket_id);

        console.log("factoryPIC", factoryPIC)






        const itemRows = detailRows.filter(row =>
            row.lbl_col?.toLowerCase().includes('item')
        );

        itemRows.forEach((row, i) => {
            const itemName = row.cstm_col || '';

            // Attempt to find the related quantity row by order_col or index
            const qtyRow = detailRows.find(
                r => r.lbl_col?.toLowerCase().includes('quantity') &&
                    r.order_col === row.order_col + 1
            ) || detailRows[i + 1];

            const qty = qtyRow?.cstm_col || '';
            let pcs = '', ctn = '';

            if (qty.toLowerCase().includes('pcs')) {
                pcs = qty;
                const val = parseInt(qty);
                if (!isNaN(val)) {
                    totalPcs += val;
                    pcs = val.toLocaleString(); // 👈 format with thousand separator
                }
            }

            if (qty.toLowerCase().includes('ctn')) {
                ctn = qty;
                const val = parseInt(qty);
                if (!isNaN(val)) {
                    totalCtn += val;
                    ctn = val.toLocaleString(); // 👈 format with thousand separator
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

        let notesHtml = '';


        approvallistRaw.forEach((data, i) => {
            if (data.remark && data.remark.trim() !== '') {
                notesHtml += `
                <li>${data.fullname} : ${data.remark}</li>
              `;
            }
        });

        const toPICs = factoryPIC.filter(p => p.flag === 1).map(p => p.pic_name);

        // Group 2 (Cc)
        const ccPICs = factoryPIC.filter(p => p.flag === 2).map(p => p.pic_name);

        const approvalColumnsHtml = approvallist
            .filter(a => a.approval_order !== 2) // skip unwanted ones
            .map((approver, index) => {
                // Find matching employee

                console.log("approver", approver)

                const isApproved = !!approver.approve_date;

                const signBlock = isApproved
                    ? `
              <div style="height: 100%; max-height:130px; display:flex; align-items:center;">
                <img
                  alt="sign"
                  src="https://backend.indofoodinternational.com:2864/ttd/sign-${approver.approver_id}.jpg"
                  style="width:120px;display:block;margin:0 auto 5px auto;"
                />
              </div>
            `
                    : `
              <div style="height: 100%; max-height:130px; display:flex; align-items:center;"></div>
            `;

                const roleTitles = {
                    1: "Regional Manager",
                    3: "Logistic Manager",
                    4: "Accounting Manager"
                };

                const positionLabel = roleTitles[approver.approval_order] || `Approver ${approver.approval_order}`;

                return `
            <td style="padding:10px;vertical-align:top;">
              ${signBlock}
              <br>
              ${approver.fullname || "—"}
              <br>
              <span style="font-size:12px;color:#555;">${positionLabel}</span>
            </td>
          `;
            })
            .join("");





        const html = `
              <html>
                <head>
                  <meta charset="utf-8" />
                  <title>SAMPLE REQUEST FORM ( SRF )</title>
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
                        <td class="content">: ${getByLabel('deliver')}</td>
                        <td class="label">Category</td>
                        <td class="content">: ${getByLabel('sample')}</td>
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
                    ${getByLabel('PO Number') ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA PO ${getByLabel('PO Number')}</p>` : ''}
                    ${getByLabel('Week Delivery') ? `<p>MOHON AGAR PERMINTAAN SAMPLE DIPROSES PADA WEEK ${getByLabel('Week Delivery')}</p>` : ''}
                    <p>MOHON AGAR PERMINTAAN SAMPLE ${getByLabel('Declare') === 1 ? "" : "TIDAK "}DIDECLARE PADA SHIPPING DOCS</p>
    
                </div>
    
                <div class="note">
                    <strong>Note:</strong>
                   <br>
                    ${getByLabel('Request Detail') ? `<p>${getByLabel('Request Detail')}</p>` : ''}
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
                            src="https://backend.indofoodinternational.com:2864/ttd/sign-${data.created_by}.jpg"
                            style="width:120px;display:block;margin:0 auto 5px auto;"
                        />
                        </div>
                        <br>
                        ${data?.requester_name || ''}
                        <br>
                        <span style="font-size:12px;color:#555;">${data.business_analyst || 'Business Analyst'}</span>
                    </td>
                    
    
                    ${approvalColumnsHtml}
                    
                   
                        <br>
                        ${approvallist.find(a => a.approval_order === 4)?.fullname || ''}
                        <br>
                        <span style="font-size:12px;color:#555;">Accounting Manager</span>
                    </td>
    
                  </tr>
                </table>
          
                </body>
              </html>
            `;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
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
            const documentPath = await module.exports.generateDocument(config, ticketData, params);
            // console.log("dataawal", ticketData)
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

