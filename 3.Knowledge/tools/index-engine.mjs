import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Purely file-based, config-driven indexing engine; no application imports or DB access.
export async function buildIndex(root, config) {
  const excluded=new Set(config.excludedDirectories), skip=new Set(config.excludedFiles);
  const rel=p=>path.relative(root,p).replaceAll('\\','/');
  async function scan(folder,extensions){
    const found=[];
    async function visit(p){
      const st=await fs.lstat(p);if(st.isSymbolicLink())return;
      if(st.isDirectory()){for(const e of await fs.readdir(p,{withFileTypes:true})){if(!excluded.has(e.name)&&!e.name.startsWith('.env'))await visit(path.join(p,e.name));}}
      else if(extensions.includes(path.extname(p))&&!skip.has(path.basename(p))&&!path.basename(p).includes('.timestamp-'))found.push(p);
    }
    await visit(folder);return found.sort();
  }
  const digest=text=>crypto.createHash('sha256').update(text).digest('hex');
  const code=[];
  for(const app of config.apps){
    const appRoot=path.join(root,app.root),files=new Set();
    for(const source of app.sourceRoots)for(const f of await scan(path.join(appRoot,source),config.sourceExtensions))files.add(f);
    for(const f of [...files].sort()){
      const text=await fs.readFile(f,'utf8'),lines=text.split(/\r?\n/);
      const imports=[...text.matchAll(/(?:\brequire\s*\(\s*|\bfrom\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
      const symbols=[...text.matchAll(/\b(?:const|let|class|function)\s+([A-Za-z_$][\w$]*)|\basync\s+([A-Za-z_$][\w$]*)\s*\(/g)].map(m=>m[1]||m[2]);
      const endpoints=[];
      for(let i=0;i<lines.length;i++)for(const m of lines[i].matchAll(/\b(?:route|router|app|App)\.(get|post|put|patch|delete|use)\s*\(\s*['"]([^'"]+)['"]/g))endpoints.push({method:m[1].toUpperCase(),path:m[2],line:i+1});
      code.push({app:app.key,path:rel(f),sha256:digest(text),lines:lines.length,imports:[...new Set(imports)],symbols:[...new Set(symbols)],endpoints});
    }
  }
  const knowledge=[],chunks=[];
  const documentation = new Set(await scan(path.join(root,config.knowledgeRoot),['.md']));
  if (config.includeAppDocs) for (const app of config.apps) {
    const folder = path.join(root, app.root, 'docs');
    try { for (const file of await scan(folder, ['.md'])) documentation.add(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for(const f of [...documentation].sort()){
    const text=await fs.readFile(f,'utf8'),lines=text.split(/\r?\n/),hash=digest(text),source=rel(f);
    const headings=lines.map((v,i)=>({v,i})).filter(x=>/^#{1,6}\s/.test(x.v)).map(x=>({heading:x.v.replace(/^#+\s*/,''),line:x.i+1}));
    knowledge.push({path:source,sha256:hash,title:headings[0]?.heading||path.basename(f),headings});
    for(let start=0;start<lines.length;start+=config.chunkMaxLines){
      const end=Math.min(start+config.chunkMaxLines,lines.length),body=lines.slice(start,end).join('\n');if(!body.trim())continue;
      chunks.push({id:`${source}:${start+1}-${end}`,path:source,lineStart:start+1,lineEnd:end,sourceSha256:hash,heading:headings.filter(h=>h.line<=start+1).at(-1)?.heading||headings[0]?.heading||'',text:body});
    }
  }
  return {schemaVersion:config.schemaVersion,generatedAt:new Date().toISOString(),apps:config.apps,code,knowledge,chunks};
}

export async function writeIndex(root,config,index){
 const out=path.join(root,config.knowledgeRoot);
 await fs.writeFile(path.join(out,'code_manifest.json'),JSON.stringify({schemaVersion:index.schemaVersion,generatedAt:index.generatedAt,files:index.code},null,2));
 await fs.writeFile(path.join(out,'knowledge_manifest.json'),JSON.stringify({schemaVersion:index.schemaVersion,generatedAt:index.generatedAt,documents:index.knowledge},null,2));
 await fs.writeFile(path.join(out,'knowledge_chunks.jsonl'),index.chunks.map(c=>JSON.stringify(c)).join('\n')+'\n');
 const map=['# Cineva file map','',`Generated: ${index.generatedAt}. Static extraction only; route paths can be relative to mount prefixes.`, '', '| Area | Root | Source files | App map |','|---|---|---:|---|'];
 for(const app of index.apps){
  const files=index.code.filter(f=>f.app===app.key);
  map.push(`| ${app.key} | ${app.root} | ${files.length} | [APP_MAP](../${app.root}/APP_MAP.md) |`);
  const appMap=[`# ${app.key} source map`,'',`Generated: ${index.generatedAt}. Regex-based inventory; imports/route strings are source observations, not runtime validation.`, '', '| File | Lines | Imports | Route definitions |','|---|---:|---:|---|'];
  for(const f of files)appMap.push(`| [${f.path.slice(app.root.length+1)}](${f.path.slice(app.root.length+1)}) | ${f.lines} | ${f.imports.length} | ${f.endpoints.map(e=>`${e.method} ${e.path} (L${e.line})`).join('; ').replaceAll('|','\\|')} |`);
  await fs.writeFile(path.join(root,app.root,'APP_MAP.md'),appMap.join('\n')+'\n');
 }
 map.push('','## Knowledge and app/package docs','',...index.knowledge.map(k=>`- [${k.title}](${path.relative(out,path.join(root,k.path)).replaceAll('\\','/')})`),'','## Retrieval rules','','Use exact paths/hashes from manifests, then read source. Knowledge chunks provide line ranges for citations. Re-index after code/docs changes. Sensitive environment/key/upload files and generated indexes are excluded. No embeddings, vector ranking or live DB/schema verification is provided.');
 await fs.writeFile(path.join(out,'FILE_MAP.md'),map.join('\n')+'\n');
}
