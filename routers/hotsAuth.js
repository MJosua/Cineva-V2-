const express = require("express");
const router = express.Router();
const { readToken } = require('../config/encrypts')
const { hotsAuth } = require('../controller')

router.post('/login', hotsAuth.login);


module.exports = router;
