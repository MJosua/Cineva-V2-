
const documentGenerator = require('./documentGenerator');

const customFunctionMapper = {
    // Map ticket data to template variables for Sample Request Form
    mapTicketDataToVariables: (ticketData, ticketDetail) => {
        const variables = {
            ticket_id: ticketData.ticket_id,
            requester_name: ticketData.created_by_name || 'N/A',
            requester_department: ticketData.dept_name || ticketData.team_name || 'N/A',
            service_name: ticketData.service_name || 'N/A',
            year: new Date().getFullYear().toString(),
            date: new Date().toISOString().split('T')[0]
        };

        // Map custom form fields to specific variables based on labels
        if (ticketDetail) {
            for (let i = 1; i <= 16; i++) {
                const label = ticketDetail[`lbl_col${i}`];
                const value = ticketDetail[`cstm_col${i}`];
                
                if (label && value) {
                    const normalizedLabel = label.toLowerCase().trim();
                    
                    // Map based on common field labels
                    if (normalizedLabel.includes('purpose') || normalizedLabel.includes('reason')) {
                        variables.request_purpose = value;
                    } else if (normalizedLabel.includes('delivery') || normalizedLabel.includes('schedule')) {
                        variables.delivery_schedule = value;
                    } else if (normalizedLabel.includes('manager') && normalizedLabel.includes('approval')) {
                        variables.approval_manager = value;
                    } else if (normalizedLabel.includes('business') && normalizedLabel.includes('analyst')) {
                        variables.business_analyst = value;
                    } else if (normalizedLabel.includes('product') && normalizedLabel.includes('manager')) {
                        variables.product_manager = value;
                    } else if (normalizedLabel.includes('accounting') && normalizedLabel.includes('manager')) {
                        variables.accounting_manager = value;
                    } else if (normalizedLabel.includes('item') || normalizedLabel.includes('list')) {
                        variables.item_list = value;
                    }
                }
            }
        }

        // Set default values for missing variables
        variables.request_purpose = variables.request_purpose || 'Sample Request';
        variables.delivery_schedule = variables.delivery_schedule || 'ASAP';
        variables.approval_manager = variables.approval_manager || 'Manager';
        variables.business_analyst = variables.business_analyst || 'Business Analyst';
        variables.product_manager = variables.product_manager || 'Product Manager';
        variables.accounting_manager = variables.accounting_manager || 'Accounting Manager';
        variables.item_list = variables.item_list || 'Sample Items';

        return variables;
    },

    // Execute custom function for a ticket
    executeCustomFunction: async (dbHots, ticketId, functionData, variables) => {
        return new Promise(async (resolve, reject) => {
            const startTime = new Date();
            let executionResult = null;
            let errorMessage = null;

            try {
                console.log('Executing custom function:', functionData.name);
                console.log('Function type:', functionData.type);
                console.log('Variables:', variables);

                // Execute based on function type
                switch (functionData.type) {
                    case 'document_generation':
                        if (functionData.handler === 'generate_sample_request_form') {
                            executionResult = await documentGenerator.generateSampleRequestForm(variables, functionData.config || functionData);
                        }
                        break;
                    
                    case 'excel_processing':
                        executionResult = await documentGenerator.processExcelFile(null, variables);
                        break;
                    
                    default:
                        executionResult = {
                            success: true,
                            message: `Custom function ${functionData.name} executed with type ${functionData.type}`
                        };
                }

                console.log('Execution result:', executionResult);

                // Insert execution log
                const logQuery = `
                    INSERT INTO t_custom_function_logs (
                        ticket_id, service_id, function_name, trigger_event, status, 
                        result_data, error_message, execution_time, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `;

                dbHots.execute(logQuery, [
                    ticketId,
                    functionData.service_id || null,
                    functionData.name,
                    functionData.trigger_event || 'on_created',
                    executionResult?.success ? 'success' : 'failed',
                    JSON.stringify(executionResult),
                    executionResult?.success ? null : (executionResult?.error || 'Unknown error'),
                    functionData.created_by || null
                ], (logErr) => {
                    if (logErr) {
                        console.error('Error inserting function log:', logErr);
                    }
                });

                // If document was generated successfully, save to generated documents table
                if (executionResult?.success && executionResult?.file_path && functionData.type === 'document_generation') {
                    const docQuery = `
                        INSERT INTO t_generated_documents (
                            ticket_id, document_type, file_path, file_name, 
                            generated_date, template_used
                        ) VALUES (?, ?, ?, ?, NOW(), ?)
                    `;

                    dbHots.execute(docQuery, [
                        ticketId,
                        executionResult.document_type || functionData.config?.document_type || 'document',
                        executionResult.file_path,
                        executionResult.file_name,
                        executionResult.template_used || functionData.config?.template_id || 'default'
                    ], (docErr) => {
                        if (docErr) {
                            console.error('Error inserting generated document:', docErr);
                        } else {
                            console.log('Generated document saved successfully');
                        }
                    });
                }

                resolve(executionResult);

            } catch (error) {
                console.error('Error executing custom function:', error);
                errorMessage = error.message;

                // Insert error log
                const errorLogQuery = `
                    INSERT INTO t_custom_function_logs (
                        ticket_id, service_id, function_name, trigger_event, status, 
                        result_data, error_message, execution_time, created_by
                    ) VALUES (?, ?, ?, ?, 'failed', NULL, ?, NOW(), ?)
                `;

                dbHots.execute(errorLogQuery, [
                    ticketId,
                    functionData.service_id || null,
                    functionData.name,
                    functionData.trigger_event || 'on_created',
                    errorMessage,
                    functionData.created_by || null
                ], (logErr) => {
                    if (logErr) {
                        console.error('Error inserting error log:', logErr);
                    }
                });

                reject(error);
            }
        });
    }
};

module.exports = customFunctionMapper;
