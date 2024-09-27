const express = require("express");
const router = express.Router();
const { readToken } = require('../config/encrypts')
const { hotsAuth } = require('../controller')

router.post('/login', hotsAuth.login);
router.post('/keep-login', hotsAuth.keepLogin);


module.exports = router;
