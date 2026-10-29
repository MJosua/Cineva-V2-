/** @purpose Checks actual Kantor promoted sources, package compatibility and preservation of unrelated edits. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..'),target='D:/Kantor/1.Frontend/packages';
const report=path.join(root,'3.Knowledge/reports/package_promotion_2026_10_29');
const require=createRequire(path.join(root,'1.Frontend/HOTS/package.json')),esbuild=require('esbuild');
const links=path.join(target,'tenant-client/node_modules/@hots');fs.mkdirSync(links,{recursive:true});
if(!fs.existsSync(path.join(links,'tenant-contracts')))fs.symlinkSync(path.join(target,'tenant-contracts'),path.join(links,'tenant-contracts'),'junction');
for(const [name,file] of [['content','content.ts'],['trigger','hots/trigger.ts']]){
 const compiled=esbuild.buildSync({entryPoints:[path.join(target,'engine-client/src',file)],bundle:true,platform:'node',format:'cjs',write:false});
 fs.writeFileSync(path.join(report,`${name}.cjs`),compiled.outputFiles[0].contents);
}
const checks=[];
for(const name of ['content-kit','tenant-client','tenant-contracts','scheduling-kit','domain-kit','table-engine']){
 const files=fs.readdirSync(path.join(target,name,'test')).filter(f=>/\.test\.(mjs|cjs|ts)$/.test(f)).map(f=>path.join(target,name,'test',f));
 const run=spawnSync(process.execPath,['--test','--test-reporter=tap',...files],{encoding:'utf8',cwd:path.join(target,name)});
 fs.writeFileSync(path.join(report,`${name}-tests.txt`),run.stdout+run.stderr);
 checks.push({name,exit:run.status,tests:Number(run.stdout.match(/# tests (\d+)/)?.[1]??0),passed:Number(run.stdout.match(/# pass (\d+)/)?.[1]??0)});
}
const run=spawnSync(process.execPath,['--test','--test-reporter=tap',path.join(import.meta.dirname,'client.test.mjs')],{encoding:'utf8'});
fs.writeFileSync(path.join(report,'engine-client-tests.txt'),run.stdout+run.stderr);
checks.push({name:'engine-client',exit:run.status,tests:Number(run.stdout.match(/# tests (\d+)/)?.[1]??0),passed:Number(run.stdout.match(/# pass (\d+)/)?.[1]??0)});
const baseline=JSON.parse(fs.readFileSync(path.join(report,'protected-baseline.json')));
const changedProtected=Object.entries(baseline).filter(([p,h])=>createHash('sha256').update(fs.readFileSync(path.join(target,p))).digest('hex')!==h).map(([p])=>p);
const sourceParity=JSON.parse(fs.readFileSync(path.join(report,'provenance.json'))).every(p=>p.sourceSha256===createHash('sha256').update(fs.readFileSync(path.join(target,p.package,p.file))).digest('hex'));
const result={checks,totalTests:checks.reduce((n,c)=>n+c.tests,0),changedProtected,sourceParity,liveDB:false,liveProvider:false,appMigration:false};
fs.writeFileSync(path.join(report,'validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
if(checks.some(c=>c.exit!==0||!c.tests)||changedProtected.length||!sourceParity)process.exitCode=1;
