const express = require('express');
const route = express.Router();
const { readTokenTM } = require('../config/encrypts');

const { authTmController } = require('../controller');

route.post('/login', authTmController.login)
route.post('/create', readTokenTM, authTmController.createUser)
route.post('/keep', readTokenTM, authTmController.keepLogin)


module.exports = route;