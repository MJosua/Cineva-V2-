import fs from 'node:fs/promises'; import path from 'node:path'; import http from 'node:http'; import assert from 'node:assert/strict'; import { createRequire } from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/notification_package_2026_10_19'),app=path.join(root,'1.Frontend/HOTS');
const require=createRequire(path.join(app,'package.json')),runtime=createRequire('C:/Users/test/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {createSSEHub,createNotificationEngine,scopeKey}=require(path.join(root,'2.Backend/packages/notification-kit'));
const alias={'@':path.join(app,'src'),'@hots/app-core/notifications':path.join(root,'1.Frontend/packages/app-core/src/notifications.ts')};
const snapshot=JSON.parse(await fs.readFile(path.join(root,'3.Knowledge/scripts/package_upgrade_2026_10_14/snapshot.json'),'utf8'));
for(const p of snapshot.packages)alias[p.name]=path.join(root,p.local);
for(const c of snapshot.components.filter(c=>!c.status))alias[`@hots/ui-kit/components/${c.name.replace(/\.tsx$/,'')}`]=path.join(root,'1.Frontend/packages/ui-kit/src/components',c.name);
alias['@hots/ui-kit/utils']=path.join(root,'1.Frontend/packages/ui-kit/src/lib/utils.ts');
for(const name of ['react','react-dom','react-router-dom','axios']){
 let dir=path.dirname(require.resolve(name));
 while(true){try{if(JSON.parse(await fs.readFile(path.join(dir,'package.json'),'utf8')).name===name){alias[name]=dir;break;}}catch{}const parent=path.dirname(dir);if(parent===dir)throw new Error('Dependency missing');dir=parent;}
}
const esbuild=require('esbuild'),bundle=await esbuild.build({entryPoints:[path.join(import.meta.dirname,'preview.tsx')],bundle:true,write:false,platform:'browser',format:'iife',jsx:'automatic',alias,define:{'import.meta.env':'{}','process.env.NODE_ENV':'"production"'},logLevel:'warning'});esbuild.stop();
const js=bundle.outputFiles[0].text;
const assets=path.join(app,'dist/assets'),css=(await Promise.all((await fs.readdir(assets)).filter(f=>f.endsWith('.css')).map(f=>fs.readFile(path.join(assets,f),'utf8')))).join('\n');
const hub=createSSEHub(),a={tenantId:'dummy-A',userId:'dummy-user'},b={tenantId:'dummy-B',userId:'dummy-user'};
let records=[],nextId=0,failNext=false;
const scoped=(row,scope)=>scopeKey(row.scope)===scopeKey(scope);
const repository={
 async transaction(work){const draft=structuredClone(records);const result=await work({insert:row=>draft.push(row),markRead:(scope,id)=>{const row=draft.find(r=>scoped(r,scope)&&r.id===id);if(row)row.isRead=true;return !!row;},markAllRead:scope=>draft.filter(r=>scoped(r,scope)).forEach(r=>r.isRead=true)});records=draft;return result;},
 list:async(scope,{limit,offset})=>records.filter(r=>scoped(r,scope)).slice().reverse().slice(offset,offset+limit),unreadCount:async scope=>records.filter(r=>scoped(r,scope)&&!r.isRead).length,
};
const engine=createNotificationEngine({repository,transport:hub,authorize:(context,scope)=>scopeKey(context)===scopeKey(scope),id:()=>String(++nextId),clock:()=>Date.now(),format:input=>({title:input.title,message:'Synthetic message'})});
await engine.publish(a,a,{type:'new_comment',title:'Dummy initial'});
const json=(res,body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),p=url.pathname;
  if(p==='/'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script>window.__API_URL__=location.origin;localStorage.setItem("hots_tokek","dummy-only")</script><script src="/fixture.js"></script></body></html>');}
  if(p==='/fixture.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end(js);}
  if(p==='/style.css'){res.writeHead(200,{'Content-Type':'text/css'});return res.end(css);}
  if(p==='/sse'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});res.flushHeaders();const disconnect=hub.connect(a,res);res.write('event: connected\ndata: {}\n\n');req.on('close',disconnect);return;}
  if(p==='/dummy/publish'){const scope=url.searchParams.get('tenant')==='B'?b:a;await engine.publish(scope,scope,{type:'new_comment',title:url.searchParams.get('title')||'Dummy realtime'});return json(res,{success:true});}
  if(p==='/dummy/fail'){failNext=true;return json(res,{success:true});}
  if(p.startsWith('/hots_notifications')){
   if(failNext&&req.method==='POST'){failNext=false;return json(res,{success:false},500);}
   if(p==='/hots_notifications/unread_count')return json(res,{success:true,unread_count:await engine.unreadCount(a,a)});
   if(p==='/hots_notifications'&&req.method==='GET'){const data=(await engine.list(a,a)).map(row=>({notification_id:row.id,type:row.type,title:row.title,message:row.message,data_payload:null,is_read:row.isRead?1:0,created_at:new Date(row.createdAt).toISOString()}));return json(res,{success:true,data});}
   if(req.method==='POST'&&p==='/hots_notifications/read_all'){await engine.markAllRead(a,a);return json(res,{success:true});}
   if(req.method==='POST'&&p.startsWith('/hots_notifications/read/')){await engine.markRead(a,a,decodeURIComponent(p.split('/').at(-1)));return json(res,{success:true});}
  }
  res.writeHead(404);res.end();
 }catch(error){json(res,{success:false,error:error.message},500);}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const {chromium}=runtime('playwright'),browser=await chromium.launch({headless:true,executablePath:'C:/Users/test/.cache/puppeteer/chrome-headless-shell/win64-154.0.8037.57/chrome-headless-shell-win64/chrome-headless-shell.exe'});
const page=await browser.newPage(),checks=[],errors=[],blocked=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){blocked.push(route.request().url());return route.abort();}return route.continue();});
const check=async(name,work)=>{await work();checks.push({name,status:'passed'});process.stdout.write(`[NOTIFICATION-E2E][PASS] : ${name}\n`);};
const badge=()=>page.locator('#notification-bell');
try{
 await page.goto(origin);await page.waitForFunction(()=>document.documentElement.dataset.sse==='connected');
 await check('Real Cineva bell loads scoped synthetic inbox and unread badge through package client',async()=>{await page.waitForFunction(()=>document.querySelector('#notification-bell')?.textContent==='1');await badge().click();await page.getByText('Dummy initial',{exact:true}).waitFor();});
 await check('Mark one read persists through reload without removing notification history',async()=>{await page.getByText('Dummy initial',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('#notification-bell')?.textContent==='');await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.sse==='connected');await badge().click();await page.getByText('Dummy initial',{exact:true}).waitFor();});
 await check('Named SSE event updates open inbox and badge immediately',async()=>{await page.request.post(origin+'/dummy/publish');await page.getByText('Dummy realtime',{exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('#notification-bell')?.textContent==='1');});
 await check('Same user in another tenant does not leak inbox or realtime payload',async()=>{await page.request.post(origin+'/dummy/publish?tenant=B&title=Foreign-dummy');assert.equal(await page.getByText('Foreign-dummy',{exact:true}).count(),0);assert.equal(await badge().textContent(),'1');assert.equal((await engine.list(a,a)).length,2);});
 await check('Failed mark-all request preserves unread state; successful retry clears it',async()=>{await page.request.post(origin+'/dummy/fail');await page.getByRole('button',{name:'Mark all read'}).click();assert.equal(await engine.unreadCount(a,a),1);await page.getByRole('button',{name:'Mark all read'}).click();await page.waitForFunction(()=>document.querySelector('#notification-bell')?.textContent==='');});
 await check('New mobile session reads retained dummy history with no external services or browser errors',async()=>{await page.setViewportSize({width:430,height:850});await page.reload();await badge().click();await page.getByText('Dummy realtime',{exact:true}).waitFor();assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);await page.screenshot({path:path.join(out,'browser-preview.png'),fullPage:true});});
}finally{
 await fs.writeFile(path.join(out,'e2e-results.json'),JSON.stringify({checks,errors,blocked,scope:'Loopback HTTP + actual SSE + real Cineva bell; synthetic in-memory transaction repository only'},null,2));
 await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}
