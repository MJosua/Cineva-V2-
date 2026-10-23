import crypto from 'node:crypto';
import {fail,scopeKey,renderManifest} from '../../../../../1.Frontend/packages/content-kit/src/index.mjs';
/** Short-lived signed capability for provider download. No HTML/PDF/PNG persistence. */
export function createVirtualMedia({store,origin,signingKey,rasterize,clock=Date.now,ttlMs=3600000}){
  const base=new URL(origin);fail(base.protocol==='https:'&&Buffer.isBuffer(signingKey)&&signingKey.length>=32&&typeof rasterize==='function','MEDIA_CONFIGURATION');
  const signature=data=>crypto.createHmac('sha256',signingKey).update(data).digest('base64url');
  return {
    async prepare(doc,scope,target){const manifest=renderManifest(doc);return manifest.slides.map((_,index)=>{const data=Buffer.from(JSON.stringify({scope,targetId:target.id,index,revision:doc.revision,expires:clock()+ttlMs})).toString('base64url');const token=`${data}.${signature(data)}`;return {url:new URL(`/api/content/v1/media/${token}`,base).href,width:manifest.width,height:manifest.height};});},
    async read(token){fail(typeof token==='string'&&token.length<2000&&/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token),'INVALID_MEDIA_TOKEN',403);const [data,provided,...extra]=token.split('.');const expected=signature(data??'');fail(extra.length===0&&provided&&provided.length===expected.length&&crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(expected)),'INVALID_MEDIA_TOKEN',403);let payload;try{payload=JSON.parse(Buffer.from(data,'base64url').toString());}catch{fail(false,'INVALID_MEDIA_TOKEN',403);}scopeKey(payload.scope);fail(Number.isSafeInteger(payload.expires)&&payload.expires>clock(),'MEDIA_LINK_EXPIRED',403);
      const s=await store.read(payload.scope),target=s.targets.find(t=>t.id===payload.targetId&&t.revision===payload.revision);fail(target&&!['cancelled','failed'].includes(target.status)&&s.accounts.some(a=>a.id===target.accountId&&a.active),'MEDIA_UNAVAILABLE',404);const manifest=renderManifest(target.snapshot);fail(Number.isSafeInteger(payload.index)&&payload.index>=0&&payload.index<manifest.slides.length,'MEDIA_UNAVAILABLE',404);return {bytes:await rasterize(manifest.slides[payload.index],{width:manifest.width,height:manifest.height}),mime:'image/png'};
    }
  };
}
/** Puppeteer supplied by the host; browser lifecycle, font installation and concurrency are explicit. */
export function createPuppeteerRasterizer({browser}){return async(svg,{width,height})=>{const page=await browser.newPage();try{await page.setJavaScriptEnabled(false);await page.setViewport({width,height,deviceScaleFactor:1});await page.setRequestInterception(true);page.on('request',request=>request.url().startsWith('data:')?request.continue():request.abort());await page.setContent(`<html><head><style>html,body{margin:0;padding:0}</style></head><body>${svg}</body></html>`,{waitUntil:'load',timeout:20000});await page.evaluate(()=>document.fonts.ready);return await page.screenshot({type:'png',clip:{x:0,y:0,width,height}});}finally{await page.close();}};}
