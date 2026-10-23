import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../../..'),knowledge=path.join(root,'3.Knowledge');
const after=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'after.json'),'utf8'));
const code=JSON.parse(await fs.readFile(path.join(knowledge,'code_manifest.json'),'utf8'));
const docs=JSON.parse(await fs.readFile(path.join(knowledge,'knowledge_manifest.json'),'utf8'));
const chunks=(await fs.readFile(path.join(knowledge,'knowledge_chunks.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
const build=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'frontend_build.json'),'utf8'));
const missing=[];for(const f of [...code.files,...docs.documents])try{await fs.access(path.join(root,f.path));}catch{missing.push(f.path);}
const forbidden=code.files.filter(f=>f.path.split('/').some(x=>['node_modules','public','key','keys','dist','.env'].includes(x))||f.path.includes('/.env'));
if(missing.length||forbidden.length)throw new Error('Index path/exclusion validation failed');
const result={sourceFiles:code.files.length,documents:docs.documents.length,chunks:chunks.length,missingIndexPaths:missing,forbiddenIndexPaths:forbidden,frontendBuild:build};
await fs.writeFile(path.join(import.meta.dirname,'index_checks.json'),JSON.stringify(result,null,2));
const mappings=[
 ['Frontend','1, fontend/HOTS','1.Frontend/HOTS','React/Vite app; npm --prefix 1.Frontend/HOTS'],
 ['Backend directories','app/bootstrap/config/controller/core/jobs/middleware/public/routers/script/server/service','2.Backend/Integrated-API/<same name>','Internal relative imports preserved'],
 ['Backend entry/config','index.js, ecosystem.config.js, .env, package.json, package-lock.json, pack_for_prod.bat, README.md','2.Backend/Integrated-API/<same name>','Backend cwd, .env ownership and packaging'],
 ['Knowledge','3. knowledge','3.Knowledge','Documents, reports, scripts and index engine'],
 ['One-time scripts','fix_schema.js, tmp-repair-dash.js','3.Knowledge/scripts/legacy','Backend imports adjusted; not executed'],
 ['References','4. Refrence','4. Refrence','Unchanged'],
 ['Root commands','Backend package.json at root','Workspace package.json at root','Delegates to app npm scripts; no app dependencies'],
];
const checks=[
 ['Captured moved files',after.capturedFiles,'Snapshot old/new paths + SHA256'],
 ['Byte-identical moved files',after.unchangedFiles,'Application source and environment preserved except listed support files'],
 ['Intentionally edited files',after.changedFiles.length,'PM2 cwd, two BATs, two repair imports, frontend package/lock uuid dependency'],
 ['Missing moved files',after.missingFiles.length,'Verified against all captured files'],
 ['Relative require checks',after.relativeRequireChecks,'Static literal require regex, includes old/comment matches'],
 ['Before unresolved',after.baselineUnresolved,'Existing issues; not a runtime module-loader count'],
 ['New resolution regressions',after.relativeRequireRegressions.length,'Before/after status identical'],
 ['Index source files',code.files.length,'Config-scoped frontend and active backend source'],
 ['Index documents',docs.documents.length,'Knowledge Markdown only; generated maps excluded'],
 ['Retrieval chunks',chunks.length,'Source path/hash + line ranges; no embeddings'],
 ['Missing indexed paths',missing.length,'All indexed code/doc paths exist'],
 ['Forbidden indexed files',forbidden.length,'Environment/key/public/dependency/generated source paths excluded'],
 ['JS/MJS syntax','Passed','Edited ecosystem, repair scripts, index engine/CLI and audit builder checked'],
 ['PM2 working directory','Passed','Config cwd equals backend absolute root'],
 ['Search approveApplicant','Passed','Returns frontend service, backend controller and related docs'],
 ['Frontend npm ci','Passed','Clean install passed; explicit uuid dependency added afterwards'],
 ['Frontend production build',build.status,build.details],
 ['Backend/DB runtime','Not run','No backend startup, cron, DB write, repair execution, PM2 restart or deployment'],
];
const overview=[
 ['Date','2026-10-14 Asia/Jakarta'],['Result','Cineva workspace separated following Kantor frontend/backend/knowledge convention'],
 ['Business architecture','Engine and marketplace logic preserved; program/package upgrade remains a separate phase'],
 ['Frontend','1.Frontend/HOTS'],['Backend','2.Backend/Integrated-API'],['Knowledge','3.Knowledge'],
 ['Re-index','npm.cmd run knowledge:index'],['Search','npm.cmd run knowledge:search -- approveApplicant'],
 ['Launch frontend','npm.cmd run dev:frontend'],['Launch backend','npm.cmd start'],
 ['Scope boundary','Static move/index checks and frontend build; no DB/runtime/deployment proof'],
 ['Index docs','3.Knowledge/architecture/folder_restructure_2026_10_14.md'],
];
const wb=Workbook.create();
const sets=[['Ringkasan',['Item','Hasil'],overview,[37,105]],['Mapping',['Area','Sebelum','Sesudah','Catatan'],mappings,[28,90,80,85]],['Verifikasi',['Check','Result','Evidence / boundary'],checks,[39,25,110]]];
for(const [name,heads,rows,widths]of sets){const s=wb.worksheets.add(name);s.showGridLines=false;const end=rows.length+3,last=String.fromCharCode(64+heads.length);s.getRange('A1').values=[['Cineva | Folder restructure | 14 Oct 2026']];s.getRange('A1').format.font={name:'Arial',size:14,bold:true,color:'#153451'};s.getRange(`A3:${last}3`).values=[heads];s.getRange(`A4:${last}${end}`).values=rows;const all=s.getRange(`A3:${last}${end}`);all.format.font={name:'Arial',size:11};all.format.wrapText=true;all.format.verticalAlignment='top';s.getRange(`A3:${last}3`).format.fill='#153451';s.getRange(`A3:${last}3`).format.font={name:'Arial',size:11,bold:true,color:'#FFFFFF'};s.getRange(`A3:${last}3`).format.rowHeight=28;for(let i=0;i<widths.length;i++)s.getRange(`${String.fromCharCode(65+i)}3:${String.fromCharCode(65+i)}${end}`).format.columnWidth=widths[i];for(let i=0;i<rows.length;i++){const r=s.getRange(`A${i+4}:${last}${i+4}`);r.format.rowHeight=name==='Mapping'?58:34;if(i%2===1)r.format.fill='#F0F5FA';}s.freezePanes.freezeRows(3);}
wb.recalculate();const out=path.join(knowledge,'reports/folder_restructure_2026_10_14');await fs.mkdir(out,{recursive:true});await(await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,'Cineva_Folder_Restructure.xlsx'));
for(const [name]of sets){const blob=await wb.render({sheetName:name,range:name==='Mapping'?'A3:D7':name==='Verifikasi'?'A3:C10':'A1:B8',scale:1});await fs.writeFile(path.join(out,`preview_${name}.png`),new Uint8Array(await blob.arrayBuffer()));}
console.log(JSON.stringify({out,checks:result}));
