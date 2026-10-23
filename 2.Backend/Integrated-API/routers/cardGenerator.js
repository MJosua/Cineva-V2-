const express = require('express');
const router = express.Router();

const { cardGenerator } = require('../controller')
const { readTokenCG } = require('../config/encrypts')

router.get('/listEmployeeNameonly', readTokenCG, cardGenerator.getListEmployeeName);
router.get('/employeeData', cardGenerator.getEmployeeData);
router.post('/setemployeeData', readTokenCG, cardGenerator.setEmployeeData);
router.post('/editemployeeData', readTokenCG, cardGenerator.updateEmployeeData);
router.post('/deletemployeeData', readTokenCG, cardGenerator.deleteeEmployeeData);
router.post('/createAccount', cardGenerator.createAccount);
router.post('/login', cardGenerator.AuthLogin);
router.get('/autoLogin', readTokenCG, cardGenerator.AutoLogin);

module.exports = router;