import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'../../..');
const baseline=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'before.json'),'utf8'));
const missing=[],changed=[],unchanged=[];
for(const e of baseline.entries){
 try{const sha=crypto.createHash('sha256').update(await fs.readFile(path.join(root,e.newPath))).digest('hex');(sha===e.sha256?unchanged:changed).push(e.newPath);}catch{missing.push(e.newPath);}
}
const requireDiff=[];
for(const check of baseline.requireChecks){
 const file=`2.Backend/Integrated-API/${check.file}`,base=path.resolve(root,path.dirname(file),check.request);let found=false;
 for(const s of ['', '.js','.json','.node','/index.js','/index.json']){try{if((await fs.stat(base+s)).isFile()){found=true;break;}}catch{}}
 if(found!==check.found)requireDiff.push({...check,newPath:file,after:found});
}
const result={capturedFiles:baseline.entries.length,unchangedFiles:unchanged.length,changedFiles:changed,missingFiles:missing,relativeRequireChecks:baseline.requireChecks.length,baselineUnresolved:baseline.requireChecks.filter(c=>!c.found).length,relativeRequireRegressions:requireDiff};
await fs.writeFile(path.join(import.meta.dirname,'after.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(missing.length||requireDiff.length)process.exitCode=1;
