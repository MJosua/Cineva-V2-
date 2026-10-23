// routers/cms/cmsRouter.js
const express = require('express');
const router = express.Router();
const { hotsCMS, hotsMedia } = require('../../controller');
const { hotsTempUploader } = require('../../config/uploader');
const uploadController = require('../../controller/hots_controller/engine/uploadController');
const { decodeTokenHT } = require('../../config/encrypts');

// PUBLIC ROUTES
router.get('/posts', hotsCMS.getPosts);
router.get('/categories', hotsCMS.getCategories);
router.get('/public/:slug', hotsCMS.getPublicPostBySlug);

// ADMIN — debug wrapper + protect
router.use('/admin', (req, res, next) => {
    console.log('[cmsRouter] ADMIN route hit:', req.method, req.originalUrl, 'from', req.ip);
    next();
});
router.use('/admin', decodeTokenHT);

// ADMIN ROUTES
router.get('/admin/list', hotsCMS.getAdminPosts);
router.get('/admin/:id', hotsCMS.getPostById);
router.post('/admin/save', express.json({ limit: '10mb' }), hotsCMS.upsertPost);
router.post('/admin/category', hotsCMS.createCategory);
router.put('/admin/:id/quick', hotsCMS.quickUpdate);
router.put('/admin/:id/category', hotsCMS.quickUpdateCategory);
router.delete('/admin/:id', hotsCMS.deletePost);

// MEDIA LIBRARY ROUTES
router.get('/admin/media/list', hotsMedia.getMediaList);
router.post('/admin/media/upload-temp', hotsTempUploader('temp', 'media-').single('file'), uploadController.uploadTemp);
router.post('/admin/media/finalize', express.json(), hotsMedia.finalizeMedia);
router.delete('/admin/media/:id', hotsMedia.deleteMedia);

module.exports = router;
