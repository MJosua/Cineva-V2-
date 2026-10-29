/** @purpose Promotes reviewed additive frontend capabilities; preserves upstream fixes and unrelated work. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'../../..');
const source=path.join(root,'1.Frontend/packages'), target='D:/Kantor/1.Frontend/packages';
const report=path.join(root,'3.Knowledge/reports/package_promotion_2026_10_29');
fs.mkdirSync(report,{recursive:true});
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const dirty=execFileSync('git',['ls-files','--modified','--others','--exclude-standard','-z'],{cwd:target,encoding:'utf8'}).split('\0').filter(Boolean);
const baseline=Object.fromEntries(dirty.filter(p=>fs.statSync(path.join(target,p)).isFile()).map(p=>[p,hash(path.join(target,p))]));
fs.writeFileSync(path.join(report,'protected-baseline.json'),JSON.stringify(baseline,null,2));
const provenance=[];
for(const name of ['content-kit','tenant-client']){
 const dst=path.join(target,name);if(fs.existsSync(dst))throw Error(`Refuse overwrite: ${dst}`);
 fs.mkdirSync(dst,{recursive:true});
 for(const item of ['src','test','docs','package.json'])fs.cpSync(path.join(source,name,item),path.join(dst,item),{recursive:true});
 const pkg=JSON.parse(fs.readFileSync(path.join(dst,'package.json')));pkg.version='0.1.0';
 fs.writeFileSync(path.join(dst,'package.json'),JSON.stringify(pkg,null,2)+'\n');
 const files=fs.readdirSync(path.join(dst,'src'));
 for(const f of files)provenance.push({package:name,file:`src/${f}`,sourceSha256:hash(path.join(source,name,'src',f)),targetSha256:hash(path.join(dst,'src',f))});
 const title=name==='content-kit'?'Universal content contracts, revision policy, templates, SVG renderer and metrics':'Scoped tenant client lifecycle and React brand adapter';
 const card=`---\napp: @hots/${name}\npurpose: ${title}\ndomain: Shared Platform\nowner: iod.it\nstatus: active\nbase: -\nport: -\napi_prefix: -\nowns_tables: []\nreads_tables: []\nwrites_tables: []\nemits: []\nlistens: []\ndepends_on: ${name==='tenant-client'?'["@hots/tenant-contracts", "react"]':'[]'}\nmust_not: ["write:*"]\n---\n\n`;
 const readme=fs.readFileSync(path.join(dst,'docs/README.md'),'utf8');
 fs.writeFileSync(path.join(dst,'docs/README.md'),card+`# HOTS promotion 0.1.0 — 2026-10-29\n\nPromoted with user authorization from Cineva ${name==='content-kit'?'0.1.0-cineva.1':'0.1.0-cineva.1'}. Source and tests preserved; release metadata and documentation differ. No existing HOTS app is migrated. ${name==='tenant-client'?'Depends on the existing Kantor tenant-contracts 0.1.0.':'No provider, scheduler, editor UI or persistence activation is included.'}\n\nHistorical Cineva snapshot documentation follows (local-only/upstream-pending statements describe the original release):\n\n`+readme);
 const changelog=path.join(dst,'docs/CHANGELOG.md');fs.writeFileSync(changelog,`# 0.1.0 — 2026-10-29\n\n- Promote existing Cineva reusable source/tests to HOTS; no program/backend/DB activation.\n- Provenance: D:/Project/Cineva-V2-/1.Frontend/packages/${name}, 0.1.0-cineva.1.\n\n`+fs.readFileSync(changelog,'utf8'));
}
const engine=path.join(target,'engine-client');
fs.copyFileSync(path.join(source,'engine-client/src/content.ts'),path.join(engine,'src/content.ts'));
const entry=path.join(engine,'src/index.ts');fs.appendFileSync(entry,"\nexport * from './content';\n");
const pkg=JSON.parse(fs.readFileSync(path.join(engine,'package.json')));pkg.version='0.3.0';fs.writeFileSync(path.join(engine,'package.json'),JSON.stringify(pkg,null,2)+'\n');
const changelog=path.join(engine,'docs/CHANGELOG.md');fs.writeFileSync(changelog,fs.readFileSync(changelog,'utf8').replace('## [Unreleased]','## [Unreleased]\n\n## [0.3.0] - 2026-10-29\n### Added\n- Optional createContentClient from Cineva 0.2.0-cineva.2, with injected HTTP/CSRF transport, required workspace context and stale-context rejection.\n- Existing createEngineClient result/defaults, trigger types, request/error handling remain unchanged.\n- Content backend/provider activation is a separate host integration.'));
fs.appendFileSync(path.join(engine,'docs/README.md'),'\n## Content Studio client (0.3.0)\n\n`createContentClient(http, {context, basePath?})` is an opt-in named export. Use the existing trusted app-core cookie/CSRF transport; context returns the current workspace context ID. Default base path is `/api/content/v1`. Methods cover workspace read, commands, generate, render, insight/sync, reconcile and account begin/finish/creatorInfo. No backend route or provider is enabled by this package. Source provenance: Cineva engine-client 0.2.0-cineva.2, src/content.ts.\n');
provenance.push({package:'engine-client',file:'src/content.ts',sourceSha256:hash(path.join(source,'engine-client/src/content.ts')),targetSha256:hash(path.join(engine,'src/content.ts'))});
fs.writeFileSync(path.join(report,'provenance.json'),JSON.stringify(provenance,null,2));
console.log(JSON.stringify({promoted:['content-kit@0.1.0','tenant-client@0.1.0','engine-client@0.3.0'],protectedFiles:Object.keys(baseline).length}));
