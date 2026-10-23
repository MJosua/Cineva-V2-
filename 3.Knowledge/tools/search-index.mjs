import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const query=process.argv.slice(2).join(' ').trim().toLowerCase();
if(!query){console.error('[KNOWLEDGE][WARN] : Usage: npm run knowledge:search -- search words');process.exit(1);}
const terms=query.split(/\s+/),out=path.join(root,'3.Knowledge');
const code=JSON.parse(await fs.readFile(path.join(out,'code_manifest.json'),'utf8')).files;
const docs=(await fs.readFile(path.join(out,'knowledge_chunks.jsonl'),'utf8')).trim().split('\n').filter(Boolean).map(v=>JSON.parse(v));
const hits=[];
for(const f of code){const haystack=[f.path,...f.imports,...(f.symbols||[]),...f.endpoints.map(e=>e.path)].join(' ').toLowerCase();if(terms.every(t=>haystack.includes(t)))hits.push({type:'code',path:f.path,lines:`1-${f.lines}`});}
for(const c of docs){const haystack=`${c.path} ${c.heading} ${c.text}`.toLowerCase();if(terms.every(t=>haystack.includes(t)))hits.push({type:'knowledge',path:c.path,lines:`${c.lineStart}-${c.lineEnd}`,heading:c.heading});}
console.log(JSON.stringify({query,matches:hits.length,results:hits.slice(0,30)},null,2));
