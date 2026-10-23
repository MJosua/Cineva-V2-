'use strict';
/** Fail-closed, injected composition. Never imports DB/env or starts a background worker. */
function createContentRouter({Router,runtime=null,logger}){
  const router=Router();
  router.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
  router.get('/media/:token',async(req,res)=>{try{if(!runtime?.assets?.read)return res.status(503).json({success:false,error:{code:'CONTENT_MEDIA_NOT_CONFIGURED'}});const media=await runtime.assets.read(req.params.token);res.type(media.mime).send(Buffer.from(media.bytes));}catch(error){res.status(error.status||500).json({success:false,error:{code:error.status?error.code:'CONTENT_MEDIA_ERROR'}});}});
  const handle=(permission,mutating,action)=>async(req,res)=>{try{
    if(!runtime)throw Object.assign(new Error(),{code:'CONTENT_STUDIO_NOT_CONFIGURED',status:503});
    if(mutating)await runtime.assertMutation(req);
    const principal=await runtime.authorize(req,permission);
    const data=await action(req,principal);
    res.json({success:true,data});
  }catch(error){const status=Number.isInteger(error.status)&&error.status>=400&&error.status<600?error.status:500;if(status>=500)logger?.error?.('[CONTENT][ERROR] : request_failed');res.status(status).json({success:false,error:{code:status===500?'CONTENT_STUDIO_ERROR':error.code??'CONTENT_REQUEST_FAILED'}});}};
  router.get('/workspace',handle('content.read',false,(_req,p)=>runtime.service.read(p)));
  router.post('/commands',handle('content.write',true,(req,p)=>runtime.service.command(p,req.body)));
  router.post('/generate',handle('content.write',true,(req,p)=>runtime.service.generate(p,req.body)));
  router.post('/render',handle('content.write',true,(req,p)=>runtime.service.render(p,req.body)));
  router.get('/analytics',handle('content.read',false,(req,p)=>runtime.service.analytics(p,req.query)));
  router.post('/insights/sync',handle('content.write',true,(_req,p)=>runtime.sync(p)));
  router.post('/insights/ai',handle('content.read',true,(req,p)=>runtime.service.insight(p,req.body)));
  router.post('/accounts/begin',handle('content.accounts',true,(req,p)=>{if(!runtime.connections)throw Object.assign(new Error(),{code:'OAUTH_NOT_CONFIGURED',status:503});return runtime.connections.begin(p,req.body.provider,req.body.binding);}));
  router.post('/accounts/finish',handle('content.accounts',true,(req,p)=>runtime.connections.finish(p,req.body)));
  router.post('/accounts/creator-info',handle('content.write',true,(req,p)=>runtime.creatorInfo(p,req.body.accountId)));
  router.post('/reconcile',handle('content.write',true,(req,p)=>runtime.worker.reconcile(p.scope,req.body.targetId)));
  return router;
}
module.exports={createContentRouter};
