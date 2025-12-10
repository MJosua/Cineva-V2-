
const fs = require('fs');
const path = require('path');

const documentGenerator = {
    // Generate sample request form document
    generateSampleRequestForm: async (variables, config) => {
        try {
            // Create a simple HTML document as PDF generation placeholder
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Sample Request Form</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .form-row { margin: 10px 0; }
        .label { font-weight: bold; display: inline-block; width: 200px; }
        .value { display: inline-block; }
        .approval-section { margin-top: 40px; }
        .signature-box { 
            border: 1px solid #000; 
            height: 60px; 
            width: 200px; 
            display: inline-block; 
            margin: 10px; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${config.template_content?.form_title || 'SAMPLE REQUEST FORM'}</h1>
        <p>Document ID: ${variables.ticket_id}</p>
        <p>Generated on: ${variables.date}</p>
    </div>
    
    <div class="form-content">
        <div class="form-row">
            <span class="label">Ticket ID:</span>
            <span class="value">${variables.ticket_id}</span>
        </div>
        <div class="form-row">
            <span class="label">Requester Name:</span>
            <span class="value">${variables.requester_name}</span>
        </div>
        <div class="form-row">
            <span class="label">Department:</span>
            <span class="value">${variables.requester_department}</span>
        </div>
        <div class="form-row">
            <span class="label">Service:</span>
            <span class="value">${variables.service_name}</span>
        </div>
        <div class="form-row">
            <span class="label">Request Purpose:</span>
            <span class="value">${variables.request_purpose}</span>
        </div>
        <div class="form-row">
            <span class="label">Delivery Schedule:</span>
            <span class="value">${variables.delivery_schedule}</span>
        </div>
        <div class="form-row">
            <span class="label">Item List:</span>
            <span class="value">${variables.item_list}</span>
        </div>
    </div>
    
    <div class="approval-section">
        <h3>Approval Section</h3>
        <div>
            <p>Business Analyst: ${variables.business_analyst}</p>
            <div class="signature-box"></div>
            <p>Signature & Date</p>
        </div>
        <div>
            <p>Product Manager: ${variables.product_manager}</p>
            <div class="signature-box"></div>
            <p>Signature & Date</p>
        </div>
        <div>
            <p>Accounting Manager: ${variables.accounting_manager}</p>
            <div class="signature-box"></div>
            <p>Signature & Date</p>
        </div>
    </div>
</body>
</html>`;

            // Generate filename using pattern
            const fileName = config.file_name_pattern
                .replace('{{ticket_id}}', variables.ticket_id)
                .replace('{{date}}', variables.date);

            // Create documents directory if it doesn't exist
            const documentsDir = path.join(__dirname, '../../uploads/documents');
            if (!fs.existsSync(documentsDir)) {
                fs.mkdirSync(documentsDir, { recursive: true });
            }

            // Write HTML file (in real implementation, this would be converted to PDF)
            const filePath = path.join(documentsDir, fileName.replace('.pdf', '.html'));
            fs.writeFileSync(filePath, htmlContent);

            return {
                success: true,
                file_path: `documents/${fileName.replace('.pdf', '.html')}`,
                file_name: fileName,
                document_type: config.document_type,
                template_used: config.template_id
            };

        } catch (error) {
            console.error('Error generating document:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Handle Excel processing
    processExcelFile: async (filePath, variables) => {
        try {
            // Placeholder for Excel processing logic
            console.log('Processing Excel file:', filePath);
            console.log('With variables:', variables);
            
            return {
                success: true,
                processed_data: variables,
                message: 'Excel file processed successfully'
            };
        } catch (error) {
            console.error('Error processing Excel:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};

module.exports = documentGenerator;
