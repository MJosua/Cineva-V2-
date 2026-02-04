const express = require('express')
const route = express.Router();
const { readToken, readTokenTM } = require('../../config/encrypts')
const { userController } = require('../../controller');
const { imageUploader } = require('../../config/uploader')

const imageFeedbackUploader = imageUploader('feedback', 'feedback-').array('image', 1)

route.post('/feedback', imageFeedbackUploader, readToken, userController.addFeedback)
route.post('/contact-us', readToken, userController.addContactUs)
route.post('/request-change-data', readToken, userController.addRequstDataChange)
route.post('/email', readToken, userController.updateEmail)

route.get('/port', readToken, userController.port);

//digunakan untuk om
route.get('/portfind', readToken, userController.portfind)


route.get('/stp', readToken, userController.stp);
// cari btp dan ntp
route.get('/ostp', readToken, userController.ostp);
// cari notify parti khusus
route.get('/ntp/:company_id', readToken, userController.findntp);



route.get('/profile', readToken, userController.profile)
route.get('/feedback', readToken, userController.getFeedback)
route.get('/banner', readToken, userController.getBanner)
route.get('/top', readToken, userController.top)
route.get('/email', readToken, userController.getEmail)

route.get('/getUpdateList', userController.GetUpdateList);
route.get('/getLatestUpdate', userController.GetLatestUpdate);
route.get('/getUpcomingUpdate', userController.GetUpcomingUpdate);

route.post('/setUpdateList', userController.setUpdateList);



module.exports = route;