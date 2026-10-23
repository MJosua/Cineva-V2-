import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),require=createRequire(path.join(root,'1.Frontend/HOTS/package.json'));
const esbuild=require('esbuild'),alias={'@':path.join(root,'1.Frontend/HOTS/src')};
const snapshot=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'snapshot.json'),'utf8'));
for(const p of snapshot.packages)alias[p.name]=path.join(root,p.local);
for(const component of snapshot.components.filter(c=>!c.status))alias[`@hots/ui-kit/components/${component.name.replace(/\.tsx$/,'')}`]=path.join(root,'1.Frontend/packages/ui-kit/src/components',component.name);
alias['@hots/ui-kit/utils']=path.join(root,'1.Frontend/packages/ui-kit/src/lib/utils.ts');
alias['@hots/ui-kit/hooks/use-mobile']=path.join(root,'1.Frontend/packages/ui-kit/src/hooks/use-mobile.tsx');
for(const name of ['react','react-dom','axios','framer-motion','next-themes','react-hook-form','recharts','react-pdf','xlsx','@tiptap/react','@tiptap/starter-kit','@tiptap/extension-image','@tiptap/extension-link']) {
  let dir=path.dirname(require.resolve(name));
  while(true){try{if(JSON.parse(await fs.readFile(path.join(dir,'package.json'),'utf8')).name===name){alias[name]=dir;break;}}catch{}const parent=path.dirname(dir);if(parent===dir)throw new Error(`Cannot resolve dependency ${name}`);dir=parent;}
}
const compatibility=process.argv.includes('--compatibility');
const bundle=compatibility?'compatibility-preview.bundle.js':'preview.bundle.js';
await esbuild.build({entryPoints:[path.join(import.meta.dirname,compatibility?'compatibility-preview.tsx':'preview.tsx')],outfile:path.join(import.meta.dirname,bundle),bundle:true,platform:'browser',format:'iife',jsx:'automatic',alias,define:{'import.meta.env':'{}','process.env.NODE_ENV':'"development"'},logLevel:'warning'});
esbuild.stop(); // Release the Windows executable handle before keeping the HTTP fixture alive.
const assets=path.join(root,'1.Frontend/HOTS/dist/assets'),css=(await fs.readdir(assets)).filter(f=>f.endsWith('.css'));
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css.map(f=>`<link rel="stylesheet" href="/${f}">`).join('')}<title>Cineva component fixture</title></head><body><div id="root"></div><script>window.__API_URL__=location.origin</script><script src="/preview.js"></script></body></html>`;
const allowed=new Map([['/',{body:html,type:'text/html'}],['/preview.js',{body:await fs.readFile(path.join(import.meta.dirname,bundle)),type:'text/javascript'}]]);
for(const file of css)allowed.set('/'+file,{body:await fs.readFile(path.join(assets,file)),type:'text/css'});
const server=http.createServer((req,res)=>{const item=allowed.get(req.url.split('?')[0]);if(!item){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':item.type,'Cache-Control':'no-store'});res.end(item.body);});
server.listen(48173,'127.0.0.1',()=>console.log('[PACKAGE-PREVIEW][INFO] : Mock-only component fixture listening on http://127.0.0.1:48173'));
process.stdin.on('data',data=>{if(String(data).trim()==='stop')server.close(()=>process.exit(0));});
