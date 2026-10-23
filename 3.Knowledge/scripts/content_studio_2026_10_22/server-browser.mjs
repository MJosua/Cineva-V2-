import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createMemoryStore} from '../../../2.Backend/Integrated-API/app/modules/content-studio/store.mjs';
import {createContentService} from '../../../2.Backend/Integrated-API/app/modules/content-studio/service.mjs';
import {reviewDocument} from '../../../1.Frontend/packages/content-kit/src/index.mjs';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/content_studio_2026_10_22');await fs.mkdir(out,{recursive:true});
const backendRequire=createRequire(path.join(root,'2.Backend/Integrated-API/package.json')),express=backendRequire('express'),{createContentRouter}=backendRequire('./app/modules/content-studio/routes.js');
const runtimeRequire=createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=runtimeRequire('playwright');
const logger={warn(){},error(){}},session=crypto.randomBytes(24).toString('hex'),csrf=crypto.randomBytes(24).toString('hex');
const store=createMemoryStore(),service=createContentService({store,logger,entitlements:async()=>({generation:5,render:5,publish:5,removeWatermark:true}),workflow:{review:(doc,input,actor)=>reviewDocument(doc,input.action,actor,input.expectedRevision,input.note)}});
const app=express();app.use(express.json());let origin,mutations=0;const seen=[],errors=[],checks=[];
const context=company_id=>({schema_version:1,tenant_key:'cineva',company_id,user_id:'7',membership_version:'1'});
const denied=()=>Object.assign(new Error('ACCESS_DENIED'),{code:'ACCESS_DENIED',status:403});
function auth(req){if(!req.headers.cookie?.includes(`studio_session=${session}`))throw denied();if(req.headers.authorization)throw new Error('Unexpected bearer');}
async function mutation(req){auth(req);if(req.headers.origin!==origin||req.headers['x-csrf-token']!==csrf)throw denied();mutations++;}
app.use((req,_res,next)=>{seen.push({method:req.method,path:req.path,hasBearer:Boolean(req.headers.authorization)});next();});
app.get('/api/tenant/v1/bootstrap',(req,res)=>{auth(req);res.json({success:true,data:{user_id:'7',tenant_key:'cineva',companies:[{company_id:1,company_name:'Studio Company A'},{company_id:2,company_name:'Studio Company B'}]}});});
app.post('/api/tenant/v1/context',async(req,res)=>{try{await mutation(req);const id=req.body.company_id;if(![1,2].includes(id))throw denied();res.json({success:true,data:{context:context(id),context_id:`ctx-${id}`}});}catch{res.status(403).json({success:false});}});
app.get('/api/tenant/v1/brand',(req,res)=>{auth(req);const id=Number(req.headers['x-workspace-context']?.slice(-1));res.json({success:true,data:{context:context(id),brand:{schema_version:1,revision:1,tenant_key:'cineva',company_id:id,brand:{display_name:`Studio Company ${id===1?'A':'B'}`,logo_asset_id:null},tokens:{primary:'37 62% 31%'}}}});});
app.use('/api/content/v1',createContentRouter({Router:express.Router,runtime:{service,assertMutation:mutation,async authorize(req){auth(req);const id=Number(req.headers['x-workspace-context']?.slice(-1));if(![1,2].includes(id))throw denied();return {scope:{tenant_key:'cineva',kind:'company',company_id:id},actor:{id:'7',permissions:['content.read','content.write','content.approve','content.accounts']}};}}}));
app.use('/hots',express.static(path.join(root,'1.Frontend/HOTS/dist')));app.get('/hots/*',(_req,res)=>res.sendFile(path.join(root,'1.Frontend/HOTS/dist/index.html')));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'}),contextBrowser=await browser.newContext({viewport:{width:1536,height:1050}});
await contextBrowser.addCookies([{name:'studio_session',value:session,url:origin,httpOnly:true},{name:'cineva_csrf',value:csrf,url:origin}]);const page=await contextBrowser.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
const check=async(name,fn)=>{await fn();checks.push({name,status:'passed'});process.stdout.write(`[STUDIO-SERVER-BROWSER][PASS] : ${name}\n`);};
try{
 await page.goto(origin+'/hots/platform/workspaces');
 await check('production UI connects to actual localhost HTTP API without route interception',async()=>{await page.getByRole('button',{name:'Studio Company A',exact:true}).click();await page.getByRole('region',{name:'Cineva Content Studio'}).waitFor();await page.getByText('Workspace server · akses terverifikasi',{exact:true}).waitFor();});
 await check('app-core sends cookie+CSRF+workspace context for real content mutation',async()=>{await page.getByRole('button',{name:'Konten baru',exact:true}).click();await page.getByLabel('Judul konten',{exact:false}).fill('Server-backed content');await page.getByRole('button',{name:'Buat dokumen',exact:true}).click();await page.getByLabel('Judul dokumen',{exact:true}).waitFor();assert(mutations>=2);assert.equal(store.kind,'memory');assert.equal((await store.read({tenant_key:'cineva',kind:'company',company_id:1})).documents.length,1);assert(!(await page.evaluate(()=>document.cookie)).includes('studio_session'));});
 await check('server-enforced reviewer permission renders and completes QC flow',async()=>{await page.getByRole('button',{name:'Ajukan QC',exact:true}).click();await page.getByRole('button',{name:'Setujui QC',exact:true}).click();await page.getByRole('button',{name:'Pilih akun & jadwalkan',exact:true}).waitFor();});
 await check('company switch removes prior content, then reselect loads only its own state',async()=>{await page.getByRole('button',{name:'Studio Company B',exact:true}).click();await page.getByText('Workspace server · akses terverifikasi',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/Server-backed content/}).count(),0);await page.getByRole('button',{name:'Studio Company A',exact:true}).click();await page.getByRole('button',{name:/Server-backed content/}).waitFor();});
 await check('missing CSRF is rejected by real HTTP server before mutation',async()=>{const status=await page.evaluate(async()=>{const r=await fetch('/api/content/v1/commands',{method:'POST',headers:{'Content-Type':'application/json','X-Workspace-Context':'ctx-1'},body:JSON.stringify({command:'document.create',input:{title:'forged'},key:'forged'})});return r.status;});assert.equal(status,403);assert.equal((await store.read({tenant_key:'cineva',kind:'company',company_id:1})).documents.length,1);});
 await check('new content API does not send manual Bearer credentials',async()=>assert(seen.filter(x=>x.path.startsWith('/api/content/')).every(x=>!x.hasBearer)));
 await page.screenshot({path:path.join(out,'studio-server-browser.png'),fullPage:true});assert.deepEqual(errors,[]);
 await fs.writeFile(path.join(out,'server-browser.json'),JSON.stringify({checks,errors,actualHTTP:true,productionFrontend:true,interception:false,auth:'synthetic localhost cookie/CSRF adapter',persistence:'memory',liveMySQL:false,liveIdP:false,liveProvider:false},null,2));
}catch(e){await page.screenshot({path:path.join(out,'server-browser-failure.png'),fullPage:true});await fs.writeFile(path.join(out,'server-browser-failure.txt'),String(e)+'\n'+await page.locator('body').innerText());throw e;}finally{await browser.close();await new Promise(r=>server.close(r));}
