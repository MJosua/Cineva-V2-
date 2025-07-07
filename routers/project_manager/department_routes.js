
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const department_controller = require('../../controller/project_manager_controller/department_controller');

// Department routes
route.get('/', decodeTokenHT, department_controller.getAllDepartments);
route.get('/:id', decodeTokenHT, department_controller.getDepartmentDetail);
route.post('/', decodeTokenHT, department_controller.createDepartment);
route.put('/:id', decodeTokenHT, department_controller.updateDepartment);

module.exports = route;
