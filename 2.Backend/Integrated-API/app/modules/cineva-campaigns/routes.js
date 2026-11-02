'use strict';
/** @purpose HTTP surface for Cineva campaign operations (t_cineva_*); fail-closed, runtime and principal injected, never imports DB or env. */
function createCampaignRouter({ Router, runtime = null, logger }) {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  const int = value => (value === undefined ? undefined : Number.parseInt(value, 10));
  const handle = action => async (req, res) => {
    try {
      if (!runtime?.service || typeof runtime.authorize !== 'function') throw Object.assign(new Error('not configured'), { code: 'CINEVA_CAMPAIGNS_NOT_CONFIGURED', status: 503 });
      const principal = await runtime.authorize(req);
      const data = await action(runtime.service, principal, req);
      res.json({ success: true, data });
    } catch (error) {
      const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
      if (status >= 500) logger?.error?.('[CINEVA_CAMPAIGNS][ERROR] : request_failed');
      res.status(status).json({ success: false, error: status === 500 ? { code: 'CINEVA_CAMPAIGNS_ERROR' } : { code: error.code ?? 'REQUEST_FAILED', message: error.message, ...(error.details ? { details: error.details } : {}) } });
    }
  };
  router.get('/campaigns', handle((s, p, req) => s.listCampaigns(p, { limit: int(req.query.limit), offset: int(req.query.offset) })));
  router.post('/campaigns', handle((s, p, req) => s.createCampaign(p, req.body ?? {})));
  router.get('/campaigns/:id', handle((s, p, req) => s.getCampaign(p, req.params.id)));
  router.put('/campaigns/:id/stage-plan', handle((s, p, req) => s.setStagePlan(p, req.params.id, req.body ?? {}, req.body?.expectedRevision)));
  router.post('/campaigns/:id/extensions', handle((s, p, req) => s.addExtension(p, req.params.id, req.body ?? {})));
  router.post('/campaigns/:id/assignments', handle((s, p, req) => s.addAssignment(p, req.params.id, req.body ?? {})));
  router.post('/campaigns/:id/cancellations', handle((s, p, req) => s.recordCancellation(p, req.params.id, req.body ?? {})));
  router.get('/campaigns/:id/assignments', handle((s, p, req) => s.listAssignments(p, req.params.id)));
  router.post('/campaigns/:id/batches', handle((s, p, req) => s.addBatch(p, req.params.id, req.body ?? {})));
  router.post('/campaigns/:id/milestones', handle((s, p, req) => s.addMilestone(p, req.params.id, req.body ?? {})));
  router.post('/campaigns/:id/products', handle((s, p, req) => s.addProduct(p, req.params.id, req.body ?? {})));
  router.post('/assignments/:id/deliverables', handle((s, p, req) => s.addDeliverable(p, req.params.id, req.body ?? {})));
  router.put('/assignments/:id/product', handle((s, p, req) => s.chooseProduct(p, req.params.id, req.body ?? {})));
  router.post('/assignments/:id/fulfillment', handle((s, p, req) => s.progressFulfillment(p, req.params.id, req.body ?? {})));
  router.post('/campaigns/:id/rating-criteria', handle((s, p, req) => s.addRatingCriterion(p, req.params.id, req.body ?? {})));
  router.post('/assignments/:id/ratings', handle((s, p, req) => s.recordRating(p, req.params.id, req.body ?? {})));
  router.get('/assignments/:id', handle((s, p, req) => s.getAssignment(p, req.params.id)));
  router.put('/assignments/:id/finance', handle((s, p, req) => s.configureFinance(p, req.params.id, req.body ?? {})));
  router.post('/assignments/:id/payout-requests', handle((s, p, req) => s.requestPayout(p, req.params.id)));
  router.post('/assignments/:id/payouts', handle((s, p, req) => s.recordPayout(p, req.params.id, req.body ?? {})));
  router.post('/deliverables/:id/drafts', handle((s, p, req) => s.submitDraft(p, req.params.id, req.body ?? {})));
  router.post('/deliverables/:id/reviews', handle((s, p, req) => s.reviewDraft(p, req.params.id, req.body ?? {})));
  router.post('/deliverables/:id/posting', handle((s, p, req) => s.recordPosting(p, req.params.id, req.body ?? {})));
  router.post('/deliverables/:id/insights', handle((s, p, req) => s.recordInsight(p, req.params.id, req.body ?? {})));
  router.post('/deliverables/:id/late-requests', handle((s, p, req) => s.requestLateSubmission(p, req.params.id, req.body ?? {})));
  router.post('/late-requests/:id/decision', handle((s, p, req) => s.decideLateSubmission(p, int(req.params.id), req.body ?? {})));
  return router;
}
module.exports = { createCampaignRouter };
