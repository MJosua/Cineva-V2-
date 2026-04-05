/**
 * jobMarketplaceController.js (LEGACY / REDIRECTOR)
 * 
 * WARNING: All logic has been modularized and moved to thematic controllers 
 * under controller/hots_controller/jobmarketplace/ to comply with the 1000-line limit 
 * and prevent duplication.
 * 
 * New Modules:
 * - JobManagementController.js
 * - JobClaimController.js
 * - JobPICController.js
 * - TalentProfileController.js
 * 
 * Please update your references to use the specific controllers directly.
 */

const JobMgmt = require('./JobManagementController');
const JobClaim = require('./JobClaimController');
const JobPIC = require('./JobPICController');
const TalentProfile = require('./TalentProfileController');

module.exports = {
  // --- Management ---
  listJobs: JobMgmt.listJobs,
  getJobDetail: JobMgmt.getJobDetail,
  listCampaigns: JobMgmt.listCampaigns,
  createCampaign: JobMgmt.createCampaign,
  updateCampaign: JobMgmt.updateCampaign,
  deleteCampaign: JobMgmt.deleteCampaign,

  // --- Ops ---
  listBatches: JobMgmt.listBatches,
  createBatch: JobMgmt.createBatch,
  listLocations: JobMgmt.listLocations,
  createLocation: JobMgmt.createLocation,

  // --- Claim/Pickup ---
  takeJob: JobClaim.takeJob,
  listMyRequests: JobClaim.listMyRequests,

  // --- PIC/Assignments ---
  listApplicants: JobPIC.listApplicants,
  approveApplicant: JobPIC.approveApplicant,
  listAssignments: JobPIC.listAssignments,
  listContentLogs: JobPIC.listContentLogs,

  // --- Profile/Talent ---
  getProfileSummary: TalentProfile.getProfileSummary,
  createFormResponse: TalentProfile.createFormResponse,
  listFormResponses: TalentProfile.listFormResponses,
  mapFormResponseToProfile: TalentProfile.mapFormResponseToProfile,
};
