import fs from 'node:fs/promises'; import path from 'node:path'; import { createRequire } from 'node:module'; import { spawnSync } from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),out=path.join(root,'3.Knowledge/reports/notification_package_2026_10_19');
const require=createRequire(path.join(root,'1.Frontend/HOTS/package.json')),esbuild=require('esbuild'),ts=require('typescript');
await fs.mkdir(out,{recursive:true}); const results=[];
const packages=[['cineva',path.join(root,'1.Frontend/packages/app-core')],['kantor','D:/Kantor/1.Frontend/packages/app-core']];
for(const [name,base]of packages){
 const target=path.join(import.meta.dirname,`${name}.bundle.cjs`);
 await esbuild.build({entryPoints:[path.join(base,'test/notifications.test.ts')],outfile:target,bundle:true,platform:'node',format:'cjs',logLevel:'warning'});
 const run=spawnSync(process.execPath,['--test',target],{encoding:'utf8'});await fs.writeFile(path.join(out,`${name}-client-tests.txt`),run.stdout+run.stderr);process.stdout.write(run.stdout+run.stderr);
 const program=ts.createProgram([path.join(base,'src/notifications.ts')],{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,skipLibCheck:true,lib:['lib.es2020.d.ts','lib.dom.d.ts']});
 const diagnostics=ts.getPreEmitDiagnostics(program).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '));
 results.push({name,passed:Number(run.stdout.match(/pass\s+(\d+)/)?.[1]||0),exit:run.status,diagnostics});
}
esbuild.stop();
const backend=spawnSync(process.execPath,['--test',path.join(root,'2.Backend/packages/notification-kit/test/contracts.test.cjs'),path.join(import.meta.dirname,'legacy.test.cjs')],{encoding:'utf8'});
await fs.writeFile(path.join(out,'backend-tests.txt'),backend.stdout+backend.stderr);process.stdout.write(backend.stdout+backend.stderr);
results.push({name:'backend-and-legacy',passed:Number(backend.stdout.match(/pass\s+(\d+)/)?.[1]||0),exit:backend.status,diagnostics:[]});
const sourceFiles=[...await fs.readdir(path.join(root,'2.Backend/packages/notification-kit/src'))].map(f=>path.join(root,'2.Backend/packages/notification-kit/src',f));
sourceFiles.push(...packages.map(([,base])=>path.join(base,'src/notifications.ts')),path.join(root,'2.Backend/Integrated-API/core/sse-manager.js'),path.join(root,'1.Frontend/HOTS/src/hooks/notificationAdapter.ts'));
const lines=await Promise.all(sourceFiles.map(async f=>({path:f,lines:(await fs.readFile(f,'utf8')).trimEnd().split(/\r?\n/).length})));
await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({results,lines},null,2));
if(results.some(r=>r.exit||r.diagnostics.length)||lines.some(f=>f.lines>1000))process.exitCode=1;
