const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../../config/encrypts')
const userController = require('../../controller/hots_controller/settings/controllers/UserManagementController');
const catalogController = require('../../controller/hots_controller/settings/controllers/ServiceCatalogController');
const workflowController = require('../../controller/hots_controller/settings/controllers/WorkflowConfigController');
const metadataController = require('../../controller/hots_controller/settings/controllers/MetadataController');
const systemController = require('../../controller/hots_controller/settings/controllers/SystemUtilityController');
const { hotsSRFController } = require('../../controller');
const hotsDataChangeController = require('../../controller/hots_controller/hotsDataChangeController');
const teamJoinRequestController = require('../../controller/project_manager_controller/teamJoinRequestController');


route.get('/get_menu', decodeTokenHT, systemController.getmenu)
route.get('/get_menu_active', decodeTokenHT, catalogController.getActiveServices)
route.get('/get_menu_inactive', decodeTokenHT, catalogController.getInactiveServices)
route.post('/toggle_menu', decodeTokenHT, catalogController.toggleServiceStatus)
route.get('/get_data_diff', decodeTokenHT, hotsDataChangeController.getSOHeader)

// User Management
route.get('/get/user', decodeTokenHT, userController.getAllUser)
route.post('/post/user', decodeTokenHT, userController.createUser)
route.put('/update/user/:id', decodeTokenHT, userController.updateUser)
route.delete('/delete/user/:id', decodeTokenHT, userController.deleteUser)

// Team CRUD
route.post('/post/team', decodeTokenHT, userController.createTeam)
route.put('/update/team/:id', decodeTokenHT, userController.updateTeam)
route.delete('/delete/team/:id', decodeTokenHT, userController.deleteTeam)

// TEAM Member
route.get('/get/team', decodeTokenHT, userController.getTeams)
route.get('/get/team_members/:team_id', decodeTokenHT, userController.getTeamMembers)
route.get('/get/team_leaders/:team_id', decodeTokenHT, userController.getTeamLeaders)

// Team member management
route.post('/post/team_member', decodeTokenHT, userController.addTeamMember)
route.put('/update/team_leader/:id', decodeTokenHT, userController.updateTeamLeader)
route.delete('/delete/team_member/:team_id/:user_id', decodeTokenHT, userController.removeTeamMember);

// Team join request routes
route.post('/team_join_request', decodeTokenHT, teamJoinRequestController.createJoinRequest);
route.get('/team_join_requests', decodeTokenHT, teamJoinRequestController.getJoinRequests);
route.get('/my_team_join_requests', decodeTokenHT, teamJoinRequestController.getUserJoinRequests);
route.put('/team_join_request/:requestId', decodeTokenHT, teamJoinRequestController.updateJoinRequest);

// Department CRUD
route.get('/get/departments', decodeTokenHT, userController.getAllDepartments)
route.post('/post/department', decodeTokenHT, userController.createDepartment)
route.put('/update/department/:id', decodeTokenHT, userController.updateDepartment)
route.delete('/delete/department/:id', decodeTokenHT, userController.deleteDepartment)

// Get teams by department
route.get('/get/departments/:department_id/teams', decodeTokenHT, userController.getTeamsByDepartment)

// Workflow Groups
route.get('/get/workflow_groups', decodeTokenHT, workflowController.getAllWorkflowGroups)
route.post('/post/workflow_group', decodeTokenHT, workflowController.createWorkflowGroup)
route.put('/update/workflow_group/:id', decodeTokenHT, workflowController.updateWorkflowGroup)
route.delete('/delete/workflow_group/:id', decodeTokenHT, workflowController.deleteWorkflowGroup)

// Workflow Steps
route.get('/get/workflow_steps/:workflow_group_id', decodeTokenHT, workflowController.getWorkflowSteps)
route.post('/post/workflow_step', decodeTokenHT, workflowController.createWorkflowStep)
route.put('/update/workflow_step/:id', decodeTokenHT, workflowController.updateWorkflowStep)
route.delete('/delete/workflow_step/:id', decodeTokenHT, workflowController.deleteWorkflowStep)

route.get('/get/workflow_instances', decodeTokenHT, workflowController.getWorkflowInstances)
route.post('/create/workflow_instance', decodeTokenHT, workflowController.createWorkflowInstance)
route.get('/get/workflow_step_executions/:workflow_id', decodeTokenHT, workflowController.getWorkflowStepExecutions)

// Role Management
route.get('/get/role', decodeTokenHT, userController.getAllRole)
route.post('/post/role', decodeTokenHT, userController.createRole)
route.put('/update/role/:id', decodeTokenHT, userController.updateRole)
route.delete('/delete/role/:id', decodeTokenHT, userController.deleteRole)

route.get('/get_superior', decodeTokenHT, metadataController.getsuperior)

// Job Title Management
route.get('/get/jobtitle', decodeTokenHT, userController.getAllJobTitle)
route.post('/post/jobtitle', decodeTokenHT, userController.createJobTitle)
route.put('/update/jobtitle/:id', decodeTokenHT, userController.updateJobTitle)
route.delete('/delete/jobtitle/:id', decodeTokenHT, userController.deleteJobTitle)

// Service Management
route.get('/get/services', decodeTokenHT, catalogController.getAllServices)
route.get('/get/services/active', decodeTokenHT, catalogController.getActiveServices)
route.get('/get/services/inactive', decodeTokenHT, catalogController.getInactiveServices)
route.post('/toggle/service', decodeTokenHT, catalogController.toggleServiceStatus)
route.post('/toggle/service/:service_id/:status', decodeTokenHT, catalogController.toggleServiceStatus)

// widget add on for service
route.put('/update/widget/:service_id', decodeTokenHT, catalogController.updatewidget)

route.get('/get_team_member/:team_id', decodeTokenHT, userController.getmember)
route.get('/get_service', decodeTokenHT, catalogController.getservice)
route.get('/get_service/:service_id', decodeTokenHT, catalogController.getserviceById)
route.get('/get_serviceCategory', decodeTokenHT, catalogController.getserviceCategory)
route.get('/get_category', decodeTokenHT, catalogController.getcategory)
route.get('/get_completionstatus', decodeTokenHT, systemController.getcompletionstatus)

// SRF
route.get('/get_srf_plant', decodeTokenHT, metadataController.getSRFPlant)
route.get('/get_srf_sampleCategory', decodeTokenHT, metadataController.getSRFSampleCategory)
route.get('/get_srf_deliverTo', decodeTokenHT, metadataController.getSRFDeliverTo)
route.get('/get_srf_sku', decodeTokenHT, hotsSRFController.getAllSkunRM)
route.get('/get_srf_purpose', decodeTokenHT, hotsSRFController.getPurpose)
route.get('/get_srf_po/:company_id', decodeTokenHT, hotsSRFController.getPONumbersrf)

// Virtual Document System
route.get('/document/:documentId/view', decodeTokenHT, hotsSRFController.viewDocument)
route.get('/document/:documentId/download', decodeTokenHT, hotsSRFController.downloadDocument)
route.get('/documents/:ticketId', decodeTokenHT, hotsSRFController.listDocuments)

route.get('/get_srf/todaysweek', decodeTokenHT, systemController.todaysweek)

// Data Update (unused / historic check?)
// route.get('/get_data_update_service', decodeTokenHT, hotsSettingsController.getservice_dataupdate)

// Pricing Structure Settings
// route.get('/get_ps_ticket_row', decodeTokenHT, hotsSettingsController.getpricingstructure_row)

route.post('/insertupdate/service_catalog', decodeTokenHT, catalogController.insertupdateServiceCatalog)
route.delete("/delete/service/:service_id", decodeTokenHT, catalogController.deleteServiceCatalog)

// meetingroom
route.get('/get/meetingroom', decodeTokenHT, systemController.getmeetingroom)
route.get('/get/meetingroom_static', decodeTokenHT, systemController.getmeetingroom_static)

// Factory list
route.get('/factories', decodeTokenHT, metadataController.getFactories)

// Trigger Management
route.get('/triggers/:service_id', decodeTokenHT, systemController.getTriggers)
route.post('/triggers/:service_id', decodeTokenHT, systemController.saveTriggers)
route.get('/schema', decodeTokenHT, systemController.getSchemaInfo)
route.post('/validate_triggers', decodeTokenHT, systemController.validateTriggerConfig)

// Data Change Request APIs
route.get('/get_so_header/:po_number', decodeTokenHT, hotsDataChangeController.getSOHeader)
route.get('/get_so_details/:so_id', decodeTokenHT, hotsDataChangeController.getSODetails)
route.post('/store_dcr_original', decodeTokenHT, hotsDataChangeController.storeOriginalData)
route.post('/submit_data_change', decodeTokenHT, hotsDataChangeController.submitDataChange)
route.get('/get_all_products', decodeTokenHT, hotsDataChangeController.getAllProducts)

// ============================================
// Trigger Functions (Visual API Builder)
// Admin only for create/update/delete
// ============================================
const triggerFunctionController = require('../../controller/hots_controller/settings/controllers/triggerFunctionController');

// List and get (authenticated users)
route.get('/trigger-functions', decodeTokenHT, triggerFunctionController.listFunctions)
route.get('/trigger-functions/categories', decodeTokenHT, triggerFunctionController.getCategories)
route.get('/trigger-functions/:key', decodeTokenHT, triggerFunctionController.getFunction)

// Validate (authenticated users)
route.post('/trigger-functions/validate', decodeTokenHT, triggerFunctionController.validateQuery)

// Execute (authenticated users - but function itself can restrict)
route.post('/trigger-functions/:key/execute', decodeTokenHT, triggerFunctionController.executeFunction)

// Create/Update/Delete (Admin only - middleware in controller)
route.post('/trigger-functions', decodeTokenHT, ...triggerFunctionController.createFunction)
route.put('/trigger-functions/:key', decodeTokenHT, ...triggerFunctionController.updateFunction)
route.delete('/trigger-functions/:key', decodeTokenHT, ...triggerFunctionController.deleteFunction)

// ============================================
// SRF Document Preview (for debugging/testing)
// ============================================
const customfunctionController = require('../../controller/hots_controller/customfunction/controllers/customfunctionController');

// Preview page with form input
route.get('/custom_functions/preview', customfunctionController.previewPage)
// Preview specific ticket (returns raw HTML)
route.get('/custom_functions/preview_srf/:ticketId', customfunctionController.previewSRFDocument)

// ============================================
// Card Name Generator (HR Tool)
// ============================================
route.get('/card_generator/search_users', decodeTokenHT, customfunctionController.searchUsersForCard)
route.get('/card_generator/user/:userId', decodeTokenHT, customfunctionController.getUserCardData)
route.post('/card_generator/generate', decodeTokenHT, customfunctionController.generateCard)
route.get('/card_generator/preview/:target_user_id', decodeTokenHT, customfunctionController.previewCard);
route.post('/card_generator/delete_card', decodeTokenHT, customfunctionController.deleteUserCard);

// ============================================
// Public Card Profile (NO AUTH - accessed via QR code)
// ============================================
route.get('/card/profile', customfunctionController.getCardProfile);

module.exports = route
