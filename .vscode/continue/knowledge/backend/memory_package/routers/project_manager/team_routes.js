
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const team_controller = require('../../controller/project_manager_controller/team_controller');
const teamJoinRequestController = require('../../controller/project_manager_controller/teamJoinRequestController');

// Team CRUD routes
route.get('/', decodeTokenHT, team_controller.getAllTeams);
route.get('/user', decodeTokenHT, team_controller.getUserTeams);
route.get('/byid/:department_id', decodeTokenHT, team_controller.getAllTeams);
route.post('/', decodeTokenHT, team_controller.createTeam);
route.get('/:id', decodeTokenHT, team_controller.getTeamDetail);
route.put('/:id', decodeTokenHT, team_controller.updateTeam);
route.delete('/:id', decodeTokenHT, team_controller.deleteTeam);

// Team member management
route.get('/:id/members', decodeTokenHT, team_controller.getTeamMembers);
route.post('/:id/members', decodeTokenHT, team_controller.addTeamMember);
route.delete('/:id/members/:userId', decodeTokenHT, team_controller.removeTeamMember);

// Team join request routes
// route.post('/:id/join-request', decodeTokenHT, teamJoinRequestController.requestToJoinTeam);
// route.get('/:id/join-requests', decodeTokenHT, teamJoinRequestController.getTeamJoinRequests);
// route.patch('/join-requests/:requestId/approve', decodeTokenHT, teamJoinRequestController.approveJoinRequest);
// route.patch('/join-requests/:requestId/reject', decodeTokenHT, teamJoinRequestController.rejectJoinRequest);
route.get('/join-requests', decodeTokenHT, teamJoinRequestController.getJoinRequests);
route.get('/my-join-requests', decodeTokenHT, teamJoinRequestController.getUserJoinRequests);
route.put('/join-request/:requestId', decodeTokenHT, teamJoinRequestController.updateJoinRequest);

module.exports = route;
