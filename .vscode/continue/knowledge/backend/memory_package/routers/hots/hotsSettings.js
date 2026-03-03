const express = require("express");
const route = express.Router();
const { generateTokenHT, decodeTokenHT } = require('../../config/encrypts')
const { hotsSettingsController, hotsSRFController } = require('../../controller');
const teamJoinRequestController = require('../../controller/project_manager_controller/teamJoinRequestController');


route.get('/get_menu', decodeTokenHT, hotsSettingsController.getmenu)
route.get('/get_menu_active', decodeTokenHT, hotsSettingsController.getserviceactive)
route.get('/get_menu_inactive', decodeTokenHT, hotsSettingsController.getserviceinactive)
route.post('/toggle_menu', decodeTokenHT, hotsSettingsController.setserviceactivestatus)

// User Management
route.get('/get/user', decodeTokenHT, hotsSettingsController.getAllUser)
route.post('/post/user', decodeTokenHT, hotsSettingsController.createUser)
route.put('/update/user/:id', decodeTokenHT, hotsSettingsController.updateUser)
route.delete('/delete/user/:id', decodeTokenHT, hotsSettingsController.deleteUser)

// Team CRUD (you only have GET operations)
route.post('/post/team', decodeTokenHT, hotsSettingsController.createTeam)
route.put('/update/team/:id', decodeTokenHT, hotsSettingsController.updateTeam)
route.delete('/delete/team/:id', decodeTokenHT, hotsSettingsController.deleteTeam)


// TEAM Member
route.get('/get/team', decodeTokenHT, hotsSettingsController.getTeams)
route.get('/get/team_members/:team_id', decodeTokenHT, hotsSettingsController.getTeamMembers)
route.get('/get/team_leaders/:team_id', decodeTokenHT, hotsSettingsController.getTeamLeaders)

// Team member management
route.post('/post/team_member', decodeTokenHT, hotsSettingsController.addTeamMember)
route.put('/update/team_leader/:id', decodeTokenHT, hotsSettingsController.updateTeamLeader)
route.delete('/delete/team_member/:team_id/:user_id', decodeTokenHT, hotsSettingsController.removeTeamMember);

// Team join request routes (added for frontend compatibility)
route.post('/team_join_request', decodeTokenHT, teamJoinRequestController.createJoinRequest);
route.get('/team_join_requests', decodeTokenHT, teamJoinRequestController.getJoinRequests);
route.get('/my_team_join_requests', decodeTokenHT, teamJoinRequestController.getUserJoinRequests);
route.put('/team_join_request/:requestId', decodeTokenHT, teamJoinRequestController.updateJoinRequest);

// Department CRUD
route.get('/get/departments', decodeTokenHT, hotsSettingsController.getAllDepartments)
route.post('/post/department', decodeTokenHT, hotsSettingsController.createDepartment)
route.put('/update/department/:id', decodeTokenHT, hotsSettingsController.updateDepartment)
route.delete('/delete/department/:id', decodeTokenHT, hotsSettingsController.deleteDepartment)

// Get teams by department
route.get('/get/departments/:department_id/teams', decodeTokenHT, hotsSettingsController.getTeamsByDepartment)


// Workflow Groups
route.get('/get/workflow_groups', decodeTokenHT, hotsSettingsController.getAllWorkflowGroups)
route.post('/post/workflow_group', decodeTokenHT, hotsSettingsController.createWorkflowGroup)
route.put('/update/workflow_group/:id', decodeTokenHT, hotsSettingsController.updateWorkflowGroup)
route.delete('/delete/workflow_group/:id', decodeTokenHT, hotsSettingsController.deleteWorkflowGroup)

// Workflow Steps (new - needed for step definitions)
route.get('/get/workflow_steps/:workflow_group_id', decodeTokenHT, hotsSettingsController.getWorkflowSteps)
route.post('/post/workflow_step', decodeTokenHT, hotsSettingsController.createWorkflowStep)
route.put('/update/workflow_step/:id', decodeTokenHT, hotsSettingsController.updateWorkflowStep)
route.delete('/delete/workflow_step/:id', decodeTokenHT, hotsSettingsController.deleteWorkflowStep)


route.get('/get/workflow_instances', decodeTokenHT, hotsSettingsController.getWorkflowInstances)
route.post('/create/workflow_instance', decodeTokenHT, hotsSettingsController.createWorkflowInstance)

route.get('/get/workflow_step_executions/:workflow_id', decodeTokenHT, hotsSettingsController.getWorkflowStepExecutions)

// Role Management
route.get('/get/role', decodeTokenHT, hotsSettingsController.getAllRole)
route.post('/post/role', decodeTokenHT, hotsSettingsController.createRole)
route.put('/update/role/:id', decodeTokenHT, hotsSettingsController.updateRole)
route.delete('/delete/role/:id', decodeTokenHT, hotsSettingsController.deleteRole)


route.get('/get_superior', decodeTokenHT, hotsSettingsController.getsuperior)

// Job Title Management
route.get('/get/jobtitle', decodeTokenHT, hotsSettingsController.getAllJobTitle)
route.post('/post/jobtitle', decodeTokenHT, hotsSettingsController.createJobTitle)
route.put('/update/jobtitle/:id', decodeTokenHT, hotsSettingsController.updateJobTitle)
route.delete('/delete/jobtitle/:id', decodeTokenHT, hotsSettingsController.deleteJobTitle)

// Service Management (standardize naming)
route.get('/get/services', decodeTokenHT, hotsSettingsController.getAllServices) // instead of get_service
route.get('/get/services/active', decodeTokenHT, hotsSettingsController.getActiveServices)
route.get('/get/services/inactive', decodeTokenHT, hotsSettingsController.getInactiveServices)
route.post('/toggle/service', decodeTokenHT, hotsSettingsController.toggleServiceStatus)
route.post('/toggle/service/:service_id/:status', decodeTokenHT, hotsSettingsController.toggleServiceStatus)

// widget add on for service
route.put('/update/widget/:service_id', decodeTokenHT, hotsSettingsController.updatewidget)


route.get('/get_team_member/:team_id', decodeTokenHT, hotsSettingsController.getmember)
route.get('/get_service', decodeTokenHT, hotsSettingsController.getservice)
route.get('/get_serviceCategory', decodeTokenHT, hotsSettingsController.getserviceCategory)
route.get('/get_category', decodeTokenHT, hotsSettingsController.getcategory)
route.get('/get_completionstatus', decodeTokenHT, hotsSettingsController.getcompletionstatus)

// SRF
route.get('/get_srf_plant', decodeTokenHT, hotsSettingsController.getSRFPlant)
route.get('/get_srf_sampleCategory', decodeTokenHT, hotsSettingsController.getSRFSampleCategory)
route.get('/get_srf_deliverTo', decodeTokenHT, hotsSettingsController.getSRFDeliverTo)
route.get('/get_srf_sku', decodeTokenHT, hotsSRFController.getAllSkunRM)
route.get('/get_srf_purpose', decodeTokenHT, hotsSRFController.getPurpose)
route.get('/get_srf_po/:company_id', decodeTokenHT, hotsSRFController.getPONumbersrf)

route.get('/get_srf/todaysweek', decodeTokenHT, hotsSettingsController.todaysweek)

//Data Update
route.get('/get_data_update_service', decodeTokenHT, hotsSettingsController.getservice_dataupdate)

// Pricing Structure Settings
route.get('/get_ps_ticket_row', decodeTokenHT, hotsSettingsController.getpricingstructure_row)

route.post('/insertupdate/service_catalog', decodeTokenHT, hotsSettingsController.insertupdateServiceCatalog)
route.delete("/delete/service/:service_id", decodeTokenHT, hotsSettingsController.deleteServiceCatalog)

//meetingroom
route.get('/get/meetingroom', decodeTokenHT, hotsSettingsController.getmeetingroom)
route.get('/get/meetingroom_static', decodeTokenHT, hotsSettingsController.getmeetingroom_static)



module.exports = route




