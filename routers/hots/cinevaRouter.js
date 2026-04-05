const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const cinevaBillingController = require('../../controller/hots_controller/jobmarketplace/CinevaBillingController');

const authGuard = process.env.LOCAL_DISABLE_AUTH === '1'
  ? (req, _res, next) => {
      req.dataToken = req.dataToken || { user_id: 1, role_id: 1, company_id: 1 };
      next();
    }
  : decodeTokenHT;

// Billing Routes
route.get('/billing', authGuard, cinevaBillingController.listBillings);
route.get('/billing/report', authGuard, cinevaBillingController.getReport);
route.put('/billing/:id/pay', authGuard, cinevaBillingController.recordPayment);
route.get('/billing/export', authGuard, cinevaBillingController.exportBillings);

module.exports = route;
