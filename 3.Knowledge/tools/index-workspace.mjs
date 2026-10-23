import fs from 'node:fs/promises';
import path from 'node:path';
import { buildIndex, writeIndex } from './index-engine.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const config=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'index.config.json'),'utf8'));
const result=await buildIndex(root,config);
await writeIndex(root,config,result);
const timestamp=new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour12:false});
console.log(`[KNOWLEDGE][INFO][${timestamp}] : ${result.code.length} source files, ${result.knowledge.length} documents, ${result.chunks.length} retrieval chunks indexed.`);
