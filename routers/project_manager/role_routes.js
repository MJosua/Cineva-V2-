const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const role_controller = require('../../controller/project_manager_controller/role_controller');

// Role CRUD operations
route.get('/', decodeTokenHT, role_controller.getAllRoles);
route.post('/', decodeTokenHT, role_controller.createRole);
route.get('/:id', decodeTokenHT, role_controller.getRoleById);
route.put('/:id', decodeTokenHT, role_controller.updateRole);
route.delete('/:id', decodeTokenHT, role_controller.deleteRole);

// Role permissions management
route.get('/:id/permissions', decodeTokenHT, role_controller.getRolePermissions);
route.post('/:id/permissions', decodeTokenHT, role_controller.addRolePermission);
route.delete('/:id/permissions/:permissionId', decodeTokenHT, role_controller.removeRolePermission);

// Role users
route.get('/:id/users', decodeTokenHT, role_controller.getRoleUsers);

module.exports = route;