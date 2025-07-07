
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const team_controller = require('../../controller/project_manager_controller/team_controller');

// Team routes
route.get('/', decodeTokenHT, team_controller.getAllTeams);
route.get('/:id', decodeTokenHT, team_controller.getTeamDetail);
route.post('/', decodeTokenHT, team_controller.createTeam);
route.put('/:id', decodeTokenHT, team_controller.updateTeam);

module.exports = route;
