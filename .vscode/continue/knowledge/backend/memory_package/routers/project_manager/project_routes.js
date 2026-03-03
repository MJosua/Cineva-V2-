
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const project_controller = require('../../controller/project_manager_controller/project_controller');

// Project CRUD operations
route.get('/', decodeTokenHT, project_controller.getAllProjects);
route.get('/my-projects', decodeTokenHT, project_controller.getMyProjects);
route.get('/user', decodeTokenHT, project_controller.getUserProjects);
route.get('/available-to-join', decodeTokenHT, project_controller.getAvailableProjectsToJoin);
route.post('/', decodeTokenHT, project_controller.createProject);
route.get('/:id', decodeTokenHT, project_controller.getProjectById);
route.get('/detail/:id', decodeTokenHT, project_controller.getProjectById);
route.put('/:id', decodeTokenHT, project_controller.updateProject);
route.delete('/:id', decodeTokenHT, project_controller.deleteProject);

// Project members
route.get('/:id/members', decodeTokenHT, project_controller.getProjectMembers);
route.post('/:id/members', decodeTokenHT, project_controller.addProjectMember);
route.delete('/:id/members/:userId', decodeTokenHT, project_controller.removeProjectMember);

// Project join requests
route.post('/:id/join-request', decodeTokenHT, project_controller.requestToJoinProject);
route.get('/:id/join-requests', decodeTokenHT, project_controller.getJoinRequests);
route.patch('/join-requests/:requestId/approve', decodeTokenHT, project_controller.approveJoinRequest);
route.patch('/join-requests/:requestId/reject', decodeTokenHT, project_controller.rejectJoinRequest);

module.exports = route;
