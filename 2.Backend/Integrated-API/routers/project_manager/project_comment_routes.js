const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const projectCommentController = require('../../controller/project_manager_controller/project_comment_controller');

// Project comment routes (adapted from HOTS ticket comments)
route.get('/:project_id', decodeTokenHT, projectCommentController.getProjectComments);
route.post('/:project_id', decodeTokenHT, projectCommentController.addProjectComment);
route.put('/:comment_id', decodeTokenHT, projectCommentController.updateProjectComment);
route.delete('/:comment_id', decodeTokenHT, projectCommentController.deleteProjectComment);

module.exports = route;