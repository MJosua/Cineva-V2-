const dbHots = require('../config/database');
const fs = require('fs');
const path = require('path');

const customFunctionController = {
    // Get function logs for a ticket
    getFunctionLogs: (req, res) => {
        const ticketId = req.params.ticket_id;
        
        if (!ticketId) {
            return res.status(400).send({
                success: false,
                message: "ticket_id is required"
            });
        }

        const query = `
            SELECT 
                id,
                ticket_id,
                service_id,
                function_name,
                trigger_event,
                status,
                result_data,
                error_message,
                execution_time,
                created_by
            FROM t_custom_function_logs 
            WHERE ticket_id = ? 
            ORDER BY execution_time DESC
        `;

        dbHots.execute(query, [ticketId], (err, results) => {
            if (err) {
                console.error('Error fetching function logs:', err);
                return res.status(500).send({
                    success: false,
                    message: err.message || 'Failed to fetch function logs'
                });
            }

  // Get custom functions for a specific service
  getServiceCustomFunctions: async (req, res) => {
    try {
      const { serviceId } = req.params;
      yellowTerminal(`Getting custom functions for service: ${serviceId}`);
      
      const query = `
        SELECT scf.*, cf.name, cf.type, cf.handler, cf.config as function_config
        FROM t_service_custom_functions scf
        JOIN m_custom_functions cf ON scf.function_id = cf.id
        WHERE scf.service_id = ? AND scf.is_active = 1 AND cf.is_active = 1
        ORDER BY scf.execution_order ASC
      `;
      
      const [serviceFunctions] = await dbHots.promise().query(query, [serviceId]);
      
      yellowTerminal(`Retrieved ${serviceFunctions.length} service functions`);
        
      res.json({
        success: true,
        message: 'Service custom functions retrieved successfully',
        data: serviceFunctions
      });
    } catch (error) {
      yellowTerminal('Error getting service custom functions: ' + error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve service custom functions',
        error: error.message
      });
    }
  },

    // Get generated documents for a ticket
    getGeneratedDocuments: (req, res) => {
        const ticketId = req.params.ticket_id;
        
        if (!ticketId) {
            return res.status(400).send({
                success: false,
                message: "ticket_id is required"
            });
        }

        const query = `
            SELECT 
                id,
                ticket_id,
                document_type,
                file_path,
                file_name,
                generated_date,
                template_used
            FROM t_generated_documents 
            WHERE ticket_id = ? 
            ORDER BY generated_date DESC
        `;

        dbHots.execute(query, [ticketId], (err, results) => {
            if (err) {
                console.error('Error fetching generated documents:', err);
                return res.status(500).send({
                    success: false,
                    message: err.message || 'Failed to fetch generated documents'
                });
            }

            console.log(`Found ${results.length} generated documents for ticket ${ticketId}`);
            
            return res.status(200).send({
                success: true,
                message: "Generated documents fetched successfully",
                data: results
            });
        });
    },

  executeCustomFunction: async (reqOrTicketId, functionDataOrFunctionId, variablesOrParams, mode = 'auto') => {
    try {
      const isManual = mode === 'manual';
  
      const ticket_id = isManual ? reqOrTicketId.body.ticket_id : reqOrTicketId;
      const functionId = isManual ? reqOrTicketId.params.functionId : functionDataOrFunctionId;
      const params = isManual ? reqOrTicketId.body.params || {} : variablesOrParams;
      const userId = isManual ? reqOrTicketId.dataToken.user_id : (variablesOrParams.created_by || 0);
  
      yellowTerminal(`Executing custom function: ${functionId} for ticket: ${ticket_id}`);
  
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
            result = await hotscustomfunctionController.executeDocumentGeneration(func, ticket_id, params);
            break;
          case 'excel_processing':
            result = await hotscustomfunctionController.executeExcelProcessing(func, ticket_id, params);
            break;
          case 'email_notification':
            result = await hotscustomfunctionController.executeEmailNotification(func, ticket_id, params);
            break;
          case 'api_integration':
            result = await hotscustomfunctionController.executeApiIntegration(func, ticket_id, params);
            break;
          default:
            result = await hotscustomfunctionController.executeCustomHandler(func, ticket_id, params);
        }
      } catch (execError) {
        status = 'failed';
        errorMessage = execError.message;
        result = { error: execError.message };
        yellowTerminal('Function execution error: ' + execError.message);
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
  
      yellowTerminal(`Function execution completed with status: ${status}`);
  
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
      yellowTerminal('Error executing custom function: ' + error.message);
  
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
  }
,  

  // Upload and process Excel file
  uploadExcelFile: [
    upload.single('file'),
    async (req, res) => {
      try {
        const { ticket_id } = req.body;
        const userId = req.dataToken.user_id;
        
        if (!documentPath) {
            return res.status(400).send({
                success: false,
                message: "document_path is required"
            });
        }

        const fullPath = path.join(__dirname, '../../uploads', documentPath);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).send({
                success: false,
                message: "Document not found"
            });
        }

        // Send file
        res.download(fullPath, (err) => {
            if (err) {
                console.error('Error downloading document:', err);
                return res.status(500).send({
                    success: false,
                    message: "Error downloading document"
                });
            }
        });
    },

    // Download by document ID
    downloadById: (req, res) => {
        const documentId = req.params.document_id;
        
        if (!documentId) {
            return res.status(400).send({
                success: false,
                message: "document_id is required"
            });
        }

        const query = `
            SELECT file_path, file_name 
            FROM t_generated_documents 
            WHERE id = ?
        `;

        dbHots.execute(query, [documentId], (err, results) => {
            if (err) {
                console.error('Error fetching document info:', err);
                return res.status(500).send({
                    success: false,
                    message: "Error fetching document information"
                });
            }

            if (!results.length) {
                return res.status(404).send({
                    success: false,
                    message: "Document not found"
                });
            }

            const document = results[0];
            const fullPath = path.join(__dirname, '../../uploads', document.file_path);
            
            // Check if file exists
            if (!fs.existsSync(fullPath)) {
                return res.status(404).send({
                    success: false,
                    message: "Document file not found"
                });
            }

            // Send file
            res.download(fullPath, document.file_name, (err) => {
                if (err) {
                    console.error('Error downloading document:', err);
                    return res.status(500).send({
                        success: false,
                        message: "Error downloading document"
                    });
                }
            });
        });
    }
};

module.exports = customFunctionController;
