const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const user_controller = require('../../controller/project_manager_controller/user_controller');

// User routes for PM system
// route.get('/', decodeTokenHT, user_controller.getAllUsers);
// route.get('/department/:departmentId', decodeTokenHT, user_controller.getUsersByDepartment);
// route.post('/', decodeTokenHT, user_controller.createUser);
// route.get('/:id', decodeTokenHT, user_controller.getUserById);
// route.put('/:id', decodeTokenHT, user_controller.updateUser);
// route.delete('/:id', decodeTokenHT, user_controller.deleteUser);

// User project relationships
// route.get('/:id/projects', decodeTokenHT, user_controller.getUserProjects);
// route.get('/:id/tasks', decodeTokenHT, user_controller.getUserTasks);
// route.get('/:id/teams', decodeTokenHT, user_controller.getUserTeams);

module.exports = route;