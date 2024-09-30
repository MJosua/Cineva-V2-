const express = require("express");
const router = express.Router();
const { readToken } = require('../config/encrypts')
const { hotsAuth } = require('../controller')
const { decodeTokenHT } = require('../config/encrypts')


router.post('/login', hotsAuth.login);


router.get('/keeplogin', decodeTokenHT, hotsAuth.keepLogin);


module.exports = router;
