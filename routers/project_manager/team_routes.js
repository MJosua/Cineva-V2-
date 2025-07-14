
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const team_controller = require('../../controller/project_manager_controller/team_controller');
const teamJoinRequestController = require('../../controller/project_manager_controller/teamJoinRequestController');

// Team CRUD routes
route.get('/', decodeTokenHT, team_controller.getAllTeams);
route.get('/byid/:department_id', decodeTokenHT, team_controller.getAllTeams);
route.get('/:id', decodeTokenHT, team_controller.getTeamDetail);
route.post('/', decodeTokenHT, team_controller.createTeam);
route.put('/:id', decodeTokenHT, team_controller.updateTeam);
route.delete('/:id', decodeTokenHT, team_controller.deleteTeam);

// Team join request routes
route.post('/join-request', decodeTokenHT, teamJoinRequestController.createJoinRequest);
route.get('/join-requests', decodeTokenHT, teamJoinRequestController.getJoinRequests);
route.get('/my-join-requests', decodeTokenHT, teamJoinRequestController.getUserJoinRequests);
route.put('/join-request/:requestId', decodeTokenHT, teamJoinRequestController.updateJoinRequest);

module.exports = route;
