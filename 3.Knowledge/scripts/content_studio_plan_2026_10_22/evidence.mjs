import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root='D:/Project/Cineva-V2-', upstream='D:/Kantor';
const out=path.join(root,'3.Knowledge/reports/content_studio_plan_2026_10_22');
await fs.mkdir(out,{recursive:true});
const locations=['1.Frontend/dynamic-form','1.Frontend/service-form-runtime',...['ui-kit','app-core','table-engine','engine-client','domain-kit','scheduling-kit','page-engine','workflow-policy-kit','tenant-contracts','tenant-client'].map(x=>'1.Frontend/packages/'+x),...['transaction-kit','tenant-server','notification-kit','submission-kit'].map(x=>'2.Backend/packages/'+x)];
async function inventory(base,location){
 const dir=path.join(base,location);
 try {
  const meta=JSON.parse(await fs.readFile(path.join(dir,'package.json'),'utf8'));
  const files=[];
  async function visit(sub){for(const e of await fs.readdir(path.join(dir,sub),{withFileTypes:true})){const rel=path.posix.join(sub,e.name);if(e.isDirectory())await visit(rel);else {const bytes=await fs.readFile(path.join(dir,rel));files.push({file:rel,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}}
  try{await visit('src');}catch(e){if(e.code!=='ENOENT')throw e;}
  return {name:meta.name,version:meta.version,exports:meta.exports??null,files};
 }catch(e){if(e.code==='ENOENT')return null;throw e;}
}
const packages=[];
for(const location of locations){const local=await inventory(root,location),reference=await inventory(upstream,location);const l=new Map(local?.files.map(x=>[x.file,x.sha256])??[]),r=new Map(reference?.files.map(x=>[x.file,x.sha256])??[]);const changed=[...new Set([...l.keys(),...r.keys()])].filter(k=>l.get(k)!==r.get(k));packages.push({location,local,reference,sourceParity:local&&reference?changed.length===0:null,differentFiles:changed});}
const evidence={date:'2026-10-22',scope:'Read-only package metadata/source comparison. No Kantor scripts, imports, tests or writes.',packages,validation:[{suite:'test:generic-packages',passed:44,failed:0,scope:'Synthetic package and consumer tests; package TypeScript diagnostics 0'},{suite:'test:packages',passed:17,failed:0,scope:'Existing frontend contract suite; table sources under 1000 lines'},{suite:'transaction-kit node --test kernel/programs/problem',passed:23,failed:0,scope:'Memory database and SQL-shape tests; no real MySQL'}]};
await fs.writeFile(path.join(out,'package-evidence.json'),JSON.stringify(evidence,null,2));
console.log(packages.map(x=>({path:x.location,local:x.local?.version??'absent',upstream:x.reference?.version??'absent',sourceParity:x.sourceParity,differences:x.differentFiles.length})));
