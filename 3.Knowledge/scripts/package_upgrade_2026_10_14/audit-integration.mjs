import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const snapshot=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'snapshot.json'),'utf8'));
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const referenceChanged=[],localChanges=[],catalog=[];
for(const p of snapshot.packages){
 for(const f of p.files){if(hash(await fs.readFile(path.join(p.source,f.path)))!==f.sha256)referenceChanged.push(`${p.source}/${f.path}`);if(hash(await fs.readFile(path.join(root,p.local,f.path)))!==f.sha256)localChanges.push(`${p.local}/${f.path}`);}
 const metadata=JSON.parse(await fs.readFile(path.join(root,p.local,'package.json'),'utf8'));
 catalog.push({name:p.name,upstream:p.version,localVersion:metadata.version,path:p.local,files:p.files.length});
}
const skip=new Set(['node_modules','dist','build','public','_old','_archive']);
async function walk(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.isDirectory()&&!skip.has(e.name))files.push(...await walk(path.join(dir,e.name)));else if(e.isFile()&&/\.(?:js|jsx|ts|tsx)$/.test(e.name))files.push(path.join(dir,e.name));}return files;}
const fileGaps=[],imports=new Set(),app=path.join(root,'1.Frontend/HOTS');
for(const file of [...await walk(path.join(app,'src')),path.join(app,'eslint.config.js')]){
 const text=await fs.readFile(file,'utf8'),rel=path.relative(root,file).replaceAll('\\','/'),flags=[];
 for(const m of text.matchAll(/['"](@hots\/[^/'"]+)/g))imports.add(m[1]);
 if(/\baxios\.(?:get|post|put|patch|delete|request)|\bfetch\s*\(/.test(text))flags.push('Inline HTTP/API call');
 if(/localStorage\.(?:getItem|setItem)\(\s*['"](?:hots_tokek|hots_auth_token|token)['"]/.test(text))flags.push('Legacy token storage access');
 if(text.split(/\r?\n/).length>1000)flags.push('Over 1000 lines');
 if(rel.includes('/components/forms/')&&!text.includes('@hots/dynamic-form')&&!rel.includes('/shared/'))flags.push('Local form/domain renderer');
 if(flags.length)fileGaps.push({path:rel,flags});
}
const backendBaseline=JSON.parse(await fs.readFile(path.join(root,'3.Knowledge/scripts/restructure_2026_10_14/before.json'),'utf8'));
const backendChanges=[];
for(const e of backendBaseline.entries.filter(e=>e.newPath.startsWith('2.Backend/Integrated-API/')&&/\.(?:js|json|bat)$/.test(e.newPath))){
 if(hash(await fs.readFile(path.join(root,e.newPath)))!==e.sha256&&!['2.Backend/Integrated-API/ecosystem.config.js','2.Backend/Integrated-API/pack_for_prod.bat'].includes(e.newPath))backendChanges.push(e.newPath);
}
const result={catalog,consumed:[...imports].sort(),referenceSnapshotFiles:snapshot.packages.reduce((n,p)=>n+p.files.length,0),referenceChanged,localChanges,backendChanges,uiForwarders:snapshot.components.filter(c=>!c.status).length,fileGaps};
await fs.writeFile(path.join(import.meta.dirname,'integration.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({packages:catalog.length,consumed:result.consumed,referenceFiles:result.referenceSnapshotFiles,referenceChanged,localChanges,backendChanges,remainingFlaggedFiles:fileGaps.length},null,2));
if(referenceChanged.length||backendChanges.length)process.exitCode=1;
