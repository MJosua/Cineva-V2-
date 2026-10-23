
const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const project_template_controller = require('../../controller/project_manager_controller/project_template_controller');

// Project Template CRUD operations
route.get('/', decodeTokenHT, project_template_controller.getAllProjectTemplates);
// route.get('/categories', decodeTokenHT, project_template_controller.getTemplateCategories);
route.get('/category/:category', decodeTokenHT, project_template_controller.getTemplatesByCategory);
route.post('/', decodeTokenHT, project_template_controller.createProjectTemplate);
route.get('/:id', decodeTokenHT, project_template_controller.getProjectTemplateById);
route.put('/:id', decodeTokenHT, project_template_controller.updateProjectTemplate);
route.delete('/:id', decodeTokenHT, project_template_controller.deleteProjectTemplate);

// Template usage
route.post('/:id/create-project', decodeTokenHT, project_template_controller.createProjectFromTemplate);
// route.get('/:id/preview', decodeTokenHT, project_template_controller.previewTemplate);

module.exports = route;
