import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const backendDirs=['app','bootstrap','config','controller','core','jobs','middleware','public','routers','script','server','service'];
const backendFiles=['.env','ecosystem.config.js','index.js','pack_for_prod.bat','package-lock.json','package.json','README.md'];
const targets=[...backendDirs.map(p=>[p,`2.Backend/Integrated-API/${p}`]),...backendFiles.map(p=>[p,`2.Backend/Integrated-API/${p}`]),['1, fontend','1.Frontend'],['fix_schema.js','3.Knowledge/scripts/legacy/fix_schema.js'],['tmp-repair-dash.js','3.Knowledge/scripts/legacy/tmp-repair-dash.js']];
const entries=[];
async function scan(oldRel,newRel){
 const src=path.join(root,oldRel),st=await fs.lstat(src);
 if(st.isSymbolicLink())throw new Error(`Unexpected link: ${oldRel}`);
 if(st.isDirectory())for(const e of await fs.readdir(src))await scan(`${oldRel}/${e}`,`${newRel}/${e}`);
 else entries.push({oldPath:oldRel,newPath:newRel,size:st.size,sha256:crypto.createHash('sha256').update(await fs.readFile(src)).digest('hex')});
}
for(const [a,b]of targets)await scan(a,b);
const requireChecks=[];
for(const e of entries.filter(e=>backendDirs.some(d=>e.oldPath.startsWith(d+'/'))&&e.oldPath.endsWith('.js'))){
 const source=await fs.readFile(path.join(root,e.oldPath),'utf8');
 for(const m of source.matchAll(/\brequire\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)){
  const base=path.resolve(root,path.dirname(e.oldPath),m[1]);
  let found=false;for(const s of ['', '.js','.json','.node','/index.js','/index.json']){try{if((await fs.stat(base+s)).isFile()){found=true;break;}}catch{}}
  requireChecks.push({file:e.oldPath,request:m[1],found});
 }
}
await fs.writeFile(path.join(root,'3. knowledge/scripts/restructure_2026_10_14/before.json'),JSON.stringify({targets,entries,requireChecks},null,2));
console.log(JSON.stringify({files:entries.length,relativeRequireChecks:requireChecks.length,unresolved:requireChecks.filter(r=>!r.found).length}));
