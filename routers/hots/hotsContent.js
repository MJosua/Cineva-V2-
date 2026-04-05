const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');
const JobMgmt = require('../../controller/hots_controller/jobmarketplace/JobManagementController');

const authGuard = process.env.LOCAL_DISABLE_AUTH === '1'
  ? (req, _res, next) => {
      req.dataToken = req.dataToken || { user_id: 1, role_id: 1, company_id: 1 };
      next();
    }
  : decodeTokenHT;

/**
 * Compatibility Layer: /hots/content
 * Maps legacy "Content Engine" calls to the new Job Marketplace structure.
 */

// GET /hots/content?type=JOB -> listJobs
route.get('/', authGuard, (req, res) => {
  if (req.query.type === 'JOB') {
    return JobMgmt.listJobs(req, res);
  }
  return res.status(400).json({ success: false, message: 'Unsupported content type' });
});

// GET /hots/content/:id -> getJobDetail
route.get('/:job_id', authGuard, (req, res) => {
  if (!isNaN(req.params.job_id)) {
    return JobMgmt.getJobDetail(req, res);
  }
  return res.status(400).json({ success: false, message: 'Invalid content ID' });
});

module.exports = route;
