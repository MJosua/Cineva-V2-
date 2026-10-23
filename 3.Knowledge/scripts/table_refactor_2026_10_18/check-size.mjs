import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../../..');
const dir=path.join(root,'1.Frontend/packages/table-engine/src');
const files=await fs.readdir(dir,{recursive:true});
const counts=await Promise.all(files.filter(f=>/\.(ts|tsx)$/.test(f)).map(async file=>{
  const source=await fs.readFile(path.join(dir,file),'utf8');
  return {file:file.replaceAll('\\','/'),lines:source.trimEnd().split(/\r?\n/).length};
}));
counts.sort((a,b)=>b.lines-a.lines);
const out=path.join(root,'3.Knowledge/reports/table_refactor_2026_10_18');
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'line-counts.json'),JSON.stringify(counts,null,2));
process.stdout.write(JSON.stringify({limit:1000,files:counts.length,largest:counts[0],exceeded:counts.filter(f=>f.lines>1000)})+'\n');
if(counts.some(f=>f.lines>1000))process.exitCode=1;
