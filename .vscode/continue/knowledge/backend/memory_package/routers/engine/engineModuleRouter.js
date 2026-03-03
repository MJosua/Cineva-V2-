const express=require('express');
const router=express.Router();
const runtime=require('../../controller/engine/moduleRuntimeController');
const admin=require('../../controller/engine/moduleController');

// Admin
router.post('/admin/modules', admin.create);
router.get('/admin/modules', admin.list);
router.get('/admin/modules/:moduleKey', admin.get);
router.put('/admin/modules/:moduleKey', admin.update);

// Runtime
router.get('/module/:moduleKey', runtime.getModulePublic);
router.post('/module/:moduleKey/submit', runtime.submitModule);
router.get('/module/:moduleKey/status/:ticketId', runtime.status);

module.exports=router;