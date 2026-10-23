import fs from 'node:fs/promises'; import path from 'node:path'; import crypto from 'node:crypto'; import {createRequire} from 'node:module'; import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/package_promotion_2026_10_19');
const require=createRequire(path.join(root,'1.Frontend/HOTS/package.json')),ts=require('typescript');await fs.mkdir(out,{recursive:true});const results=[];
for(const name of ['domain-kit','scheduling-kit']){
 const local=path.join(root,'1.Frontend/packages',name),upstream=path.join('D:/Kantor/1.Frontend/packages',name);
 const tests=(await fs.readdir(path.join(upstream,'test'))).filter(f=>f.endsWith('.test.ts')).map(f=>path.join(upstream,'test',f));
 const run=spawnSync(process.execPath,['--test',...tests],{encoding:'utf8'});process.stdout.write(run.stdout+run.stderr);await fs.writeFile(path.join(out,`${name}-tests.txt`),run.stdout+run.stderr);
 const source=(await fs.readdir(path.join(upstream,'src'))).filter(f=>f.endsWith('.ts')).map(f=>path.join(upstream,'src',f));
 const program=ts.createProgram(source,{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,skipLibCheck:true,allowImportingTsExtensions:true,lib:['lib.es2020.d.ts','lib.dom.d.ts']});
 const diagnostics=ts.getPreEmitDiagnostics(program).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),files=[];
 for(const folder of ['src','test'])for(const file of await fs.readdir(path.join(upstream,folder))){const bytes=await fs.readFile(path.join(upstream,folder,file));const same=bytes.equals(await fs.readFile(path.join(local,folder,file)));if(!same)throw new Error(`Source mismatch: ${name}/${folder}/${file}`);files.push({path:`${folder}/${file}`,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),identical:true,lines:bytes.toString().trimEnd().split(/\r?\n/).length});}
 const meta=JSON.parse(await fs.readFile(path.join(upstream,'package.json'),'utf8')),fork=JSON.parse(await fs.readFile(path.join(local,'package.json'),'utf8'));
 if(JSON.stringify(meta.exports)!==JSON.stringify(fork.exports))throw new Error('Export mismatch');
 results.push({package:meta.name,upstreamVersion:meta.version,cinevaVersion:fork.version,tests:Number(run.stdout.match(/pass\s+(\d+)/)?.[1]||0),exit:run.status,diagnostics,files});
}
await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({results},null,2));
if(results.some(r=>r.exit||r.diagnostics.length||r.files.some(f=>f.lines>1000)))process.exitCode=1;
