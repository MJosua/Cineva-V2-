const express = require('express')
const route = express.Router();
const { readToken } = require('../config/encrypts')
const { userController } = require('../controller');
const { imageUploader } = require('../config/uploader')

const imageFeedbackUploader = imageUploader('feedback', 'feedback-').array('image', 1)

route.post('/feedback', imageFeedbackUploader, readToken,userController.addFeedback)
route.post('/contact-us', readToken, userController.addContactUs)
route.post('/request-change-data', readToken, userController.addRequstDataChange)
route.post('/email', readToken, userController.updateEmail)

route.get('/port', readToken, userController.port);
route.get('/stp', readToken, userController.stp);
route.get('/profile', readToken, userController.profile)
route.get('/feedback', readToken, userController.getFeedback)
route.get('/banner', readToken, userController.getBanner)
route.get('/top', readToken, userController.top)
route.get('/email', readToken, userController.getEmail)


module.exports = route;