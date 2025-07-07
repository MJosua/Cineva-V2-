const express = require("express");
const route = express.Router();
const { readToken } = require('../../config/encrypts')
const { hotscustomfunctionController } = require('../../controller')
const { decodeTokenHT } = require('../../config/encrypts')

// Custom Functions Management
route.get('/list', decodeTokenHT, hotscustomfunctionController.getCustomFunctions);
route.get('/service/:serviceId', decodeTokenHT, hotscustomfunctionController.getServiceCustomFunctions);
route.post('/create', decodeTokenHT, hotscustomfunctionController.createCustomFunction);
route.put('/update/:id', decodeTokenHT, hotscustomfunctionController.updateCustomFunction);
route.delete('/delete/:id', decodeTokenHT, hotscustomfunctionController.deleteCustomFunction);

// Service Function Assignment
route.post('/assign_service', decodeTokenHT, hotscustomfunctionController.assignFunctionToService);
route.put('/update_service_assignment/:id', decodeTokenHT, hotscustomfunctionController.updateServiceFunctionAssignment);
route.delete('/remove_service_assignment/:id', decodeTokenHT, hotscustomfunctionController.removeServiceFunctionAssignment);

// Function Execution
route.post('/execute/:functionId', decodeTokenHT, hotscustomfunctionController.executeCustomFunction);

// Excel Processing
route.post('/upload_excel', decodeTokenHT, hotscustomfunctionController.uploadExcelFile);
route.get('/excel_data/:ticketId', decodeTokenHT, hotscustomfunctionController.getExcelData);

// Logs and Documents
route.get('/logs/:ticketId', decodeTokenHT, hotscustomfunctionController.getFunctionLogs);
route.get('/documents/:ticketId', decodeTokenHT, hotscustomfunctionController.getGeneratedDocuments);
route.get('/download/:documentId', decodeTokenHT, hotscustomfunctionController.downloadDocument);

// Templates
route.get('/templates', decodeTokenHT, hotscustomfunctionController.getFunctionTemplates);
route.post('/templates/create', decodeTokenHT, hotscustomfunctionController.createFunctionTemplate);
route.put('/templates/update/:id', decodeTokenHT, hotscustomfunctionController.updateFunctionTemplate);
route.delete('/templates/delete/:id', decodeTokenHT, hotscustomfunctionController.deleteFunctionTemplate);

module.exports = route;
