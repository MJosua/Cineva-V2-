import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const root=path.resolve(import.meta.dirname,'../../..'),reference='D:/Kantor';
const require=createRequire(path.join(root,'1.Frontend/HOTS/package.json'));
const ts=require('typescript');
const skipped=new Set(['node_modules','.git','dist','build','coverage','.vscode']);
async function walk(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(e.isDirectory()&&!skipped.has(e.name))files.push(...await walk(path.join(dir,e.name)));else if(e.isFile()&&!e.name.includes('.timestamp-')&&!e.name.endsWith('.tsbuildinfo'))files.push(path.join(dir,e.name));}return files.sort();}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const packageRoots=['1.Frontend/dynamic-form','1.Frontend/service-form-runtime',...(await fs.readdir(`${reference}/1.Frontend/packages`,{withFileTypes:true})).filter(e=>e.isDirectory()).map(e=>`1.Frontend/packages/${e.name}`),'2.Backend/packages/transaction-kit'];
const packages=[];
for(const rel of packageRoots){
 const source=path.join(reference,rel),dest=path.join(root,rel);
 try{await fs.access(dest);throw new Error(`Target already exists: ${rel}`);}catch(e){if(e.code!=='ENOENT')throw e;}
 const files=[];for(const file of await walk(source)){const sub=path.relative(source,file),buf=await fs.readFile(file);await fs.mkdir(path.dirname(path.join(dest,sub)),{recursive:true});await fs.writeFile(path.join(dest,sub),buf);files.push({path:sub.replaceAll('\\','/'),sha256:hash(buf)});}
 const metadata=JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8'));
 packages.push({name:metadata.name,version:metadata.version,source:source.replaceAll('\\','/'),local:rel,files});
}
function exportsOf(text){const file=ts.createSourceFile('component.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),named=[];let defaultExport=false;for(const n of file.statements){if(ts.isExportAssignment(n)){defaultExport=true;continue;}if(ts.isExportDeclaration(n)&&n.exportClause&&ts.isNamedExports(n.exportClause))for(const x of n.exportClause.elements)named.push(x.name.text);if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){if(n.modifiers.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword)){defaultExport=true;continue;}if(ts.isVariableStatement(n))for(const d of n.declarationList.declarations)if(ts.isIdentifier(d.name))named.push(d.name.text);else{}else if(n.name)named.push(n.name.text);}}return {named:[...new Set(named)],defaultExport};}
const components=[];
const ui=path.join(root,'1.Frontend/HOTS/src/components/ui'),shared=path.join(root,'1.Frontend/packages/ui-kit/src/components');
for(const file of await walk(ui)){const name=path.basename(file),original=await fs.readFile(file,'utf8');try{const modern=await fs.readFile(path.join(shared,name),'utf8');components.push({name,original:exportsOf(original),package:exportsOf(modern)});}catch(e){if(e.code==='ENOENT')components.push({name,status:'not-in-package'});else throw e;}}
await fs.writeFile(path.join(import.meta.dirname,'snapshot.json'),JSON.stringify({reference,packages,components},null,2));
console.log(JSON.stringify({packages:packages.length,files:packages.reduce((n,p)=>n+p.files.length,0),components},null,2));
