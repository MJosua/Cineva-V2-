const express = require('express');
const route = express.Router();
const { decodeTokenHT } = require('../../config/encrypts');

// New Modular Controllers
const JobMgmt = require('../../controller/hots_controller/jobmarketplace/JobManagementController');
const JobClaim = require('../../controller/hots_controller/jobmarketplace/JobClaimController');
const JobPIC = require('../../controller/hots_controller/jobmarketplace/JobPICController');
const TalentProfile = require('../../controller/hots_controller/jobmarketplace/TalentProfileController');

const authGuard = process.env.LOCAL_DISABLE_AUTH === '1'
  ? (req, _res, next) => {
      req.dataToken = req.dataToken || { user_id: 1, role_id: 1, company_id: 1 };
      next();
    }
  : decodeTokenHT;

// --- JOBS & CAMPAIGNS (Management) ---
route.get('/jobs', authGuard, JobMgmt.listJobs);
route.get('/detail/:job_id', authGuard, JobMgmt.getJobDetail);
route.get('/campaigns', authGuard, JobMgmt.listCampaigns);
route.post('/campaigns', authGuard, JobMgmt.createCampaign);
route.put('/campaigns/:id', authGuard, JobMgmt.updateCampaign);
route.delete('/campaigns/:id', authGuard, JobMgmt.deleteCampaign);

// --- OPERATIONS ---
route.get('/batches', authGuard, JobMgmt.listBatches);
route.post('/batches', authGuard, JobMgmt.createBatch);
route.get('/locations', authGuard, JobMgmt.listLocations);
route.post('/locations', authGuard, JobMgmt.createLocation);

// --- BRAND MASTER ---
route.get('/brands', authGuard, JobMgmt.listBrands);
route.post('/brands', authGuard, JobMgmt.createBrand);

// --- CATEGORY MASTER ---
route.get('/categories', authGuard, JobMgmt.listCategories);
route.post('/categories', authGuard, JobMgmt.createCategory);

// --- PLATFORM MASTER ---
route.get('/platforms', authGuard, JobMgmt.listPlatforms);
route.post('/platforms', authGuard, JobMgmt.createPlatform);

// --- CONTENT TYPE MASTER ---
route.get('/content-types', authGuard, JobMgmt.listContentTypes);
route.post('/content-types', authGuard, JobMgmt.createContentType);

// --- KOL FLOW (Take Job / Claim) ---
route.post('/take-job', authGuard, JobClaim.takeJob);
route.get('/my-requests', authGuard, JobClaim.listMyRequests);

// --- PIC FLOW (Applicants & Assignment Tracking) ---
route.get('/applicants/:job_id?', authGuard, JobPIC.listApplicants);
route.post('/approve-applicant', authGuard, JobPIC.approveApplicant);
route.get('/assignments', authGuard, JobPIC.listAssignments);
route.get('/content-logs', authGuard, JobPIC.listContentLogs);
route.post('/content-logs', authGuard, JobPIC.createContentLog);

// --- TALENT PROFILE & FORM RESPONSES ---
route.get('/profile-summary', authGuard, TalentProfile.getProfileSummary);
route.post('/form-response', authGuard, TalentProfile.createFormResponse);
route.get('/form-response', authGuard, TalentProfile.listFormResponses);
route.post('/form-response/:id/map-to-profile', authGuard, TalentProfile.mapFormResponseToProfile);

module.exports = route;
