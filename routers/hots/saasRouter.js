const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const cinevaSubscriptionController = require('../../controller/hots_controller/jobmarketplace/CinevaSubscriptionController');

const authGuard = process.env.LOCAL_DISABLE_AUTH === '1'
  ? (req, _res, next) => {
      req.dataToken = req.dataToken || { user_id: 1, role_id: 1, company_id: 1 };
      next();
    }
  : decodeTokenHT;

// SaaS Billing/Subscription Routes
route.get('/billing/subscription', authGuard, cinevaSubscriptionController.getSubscription);
route.get('/billing/invoices', authGuard, cinevaSubscriptionController.getInvoices);
route.post('/billing/subscription/upgrade', authGuard, cinevaSubscriptionController.upgradePlan);
route.post('/billing/invoices/:id/pay', authGuard, cinevaSubscriptionController.payInvoice);

module.exports = route;
