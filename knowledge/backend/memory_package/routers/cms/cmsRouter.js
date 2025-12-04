// routers/cms/cmsRouter.js
const express = require('express');
const router = express.Router();
const cms = require('../../controller/cms/cmsController');
const { decodeTokenHT } = require('../../config/encrypts');

// PUBLIC
router.get('/public/:slug', async (req, res) => {
  try {
    return await cms.getPublicPage(req, res);
  } catch (e) {
    console.error('[cmsRouter] public handler error', e);
    return res.status(500).json({ ok: false, message: e.message });
  }
});

// ADMIN — debug wrapper + protect
router.use('/admin', (req, res, next) => {
  console.log('[cmsRouter] ADMIN route hit:', req.method, req.originalUrl, 'from', req.ip);
  next();
});
router.use('/admin', decodeTokenHT);

// ADMIN ROUTES
router.get('/admin/list', (req, res) => cms.listPages(req, res));
router.get('/admin/:id', (req, res) => cms.getPageById(req, res));
router.post('/admin/save', express.json({ limit: '10mb' }), (req, res) => cms.savePage(req, res));
router.delete('/admin/:id', (req, res) => cms.deletePage(req, res));

module.exports = router;
